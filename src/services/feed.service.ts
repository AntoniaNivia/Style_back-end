import { PrismaClient } from '@prisma/client';
import { supabaseService } from './supabase.service';
import { NotFoundError, ForbiddenError, ValidationError } from '@/utils/AppError';
import { CreateFeedPostInput, GetFeedInput } from '@/validations/feed.validation';

const prisma = new PrismaClient();

export class FeedService {
  async createFeedPost(storeId: string, data: CreateFeedPostInput) {
    try {
      // Convert data URI to buffer
      const { buffer, contentType } = supabaseService.dataUriToBuffer(data.imageDataUri);

      // Upload image to Supabase
      const imageUrl = await supabaseService.uploadImage(buffer, 'feed', contentType);

      // Create feed post
      const feedPost = await prisma.feedPost.create({
        data: {
          storeId,
          imageUrl,
          caption: data.caption,
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      return feedPost;
    } catch (error) {
      console.error('Erro ao criar post no feed:', error);
      throw error;
    }
  }

  async getFeed(filters: GetFeedInput, userId?: string) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
          likes: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
        },
      }),
      prisma.feedPost.count(),
    ]);

    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: userId ? post.likes && post.likes.length > 0 : false,
      likesCount: post._count.likes,
      likes: undefined, // Remove likes array from response
      _count: undefined, // Remove _count from response
    }));

    return {
      posts: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async likePost(userId: string, postId: string) {
    // Check if post exists
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Check if already liked
    const existingLike = await prisma.likedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      throw new ValidationError('Post já foi curtido');
    }

    // Create like
    const like = await prisma.likedPost.create({
      data: {
        userId,
        postId,
      },
    });

    // Get updated likes count
    const likesCount = await prisma.likedPost.count({
      where: { postId },
    });

    return {
      message: 'Post curtido com sucesso',
      likesCount,
    };
  }

  async unlikePost(userId: string, postId: string) {
    // Check if post exists
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Check if like exists
    const existingLike = await prisma.likedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingLike) {
      throw new ValidationError('Post não foi curtido');
    }

    // Remove like
    await prisma.likedPost.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    // Get updated likes count
    const likesCount = await prisma.likedPost.count({
      where: { postId },
    });

    return {
      message: 'Curtida removida com sucesso',
      likesCount,
    };
  }

  async deleteFeedPost(storeId: string, postId: string) {
    // Check if post exists and belongs to the store
    const post = await prisma.feedPost.findFirst({
      where: {
        id: postId,
        storeId,
      },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Delete post (cascade will handle likes)
    await prisma.feedPost.delete({
      where: { id: postId },
    });

    // Delete image from Supabase (async, don't wait)
    supabaseService.deleteImage(post.imageUrl).catch(console.error);

    return { message: 'Post removido com sucesso' };
  }

  async getPostById(postId: string, userId?: string) {
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
        likes: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    return {
      ...post,
      isLiked: userId ? post.likes && post.likes.length > 0 : false,
      likesCount: post._count.likes,
      likes: undefined,
      _count: undefined,
    };
  }

  async getStorePosts(storeId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.feedPost.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
      }),
      prisma.feedPost.count({ where: { storeId } }),
    ]);

    return {
      posts: posts.map(post => ({
        ...post,
        likesCount: post._count.likes,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }
}

export const feedService = new FeedService();
