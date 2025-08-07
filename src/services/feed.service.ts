import { PrismaClient } from '@prisma/client';
import { supabaseService } from './supabase.service';
import { NotFoundError, ForbiddenError, ValidationError, AppError } from '@/utils/AppError';
import { CreateFeedPostInput, GetFeedInput } from '@/validations/feed.validation';

const prisma = new PrismaClient();

export interface FeedQuery {
  page?: number;
  limit?: number;
}

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
        },
      });

      return {
        ...feedPost,
        likesCount: 0,
        isLiked: false,
        isSaved: false,
      };
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
          likes: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
          savedPosts: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
        },
      }),
      prisma.feedPost.count(),
    ]);

    const postsWithStatus = posts.map(post => ({
      id: post.id,
      storeId: post.storeId,
      imageUrl: post.imageUrl,
      caption: post.caption,
      likesCount: post.likesCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      store: {
        id: post.store.id,
        name: post.store.name,
        avatarUrl: post.store.avatarUrl,
      },
      isLiked: userId ? (post.likes && post.likes.length > 0) : false,
      isSaved: userId ? (post.savedPosts && post.savedPosts.length > 0) : false,
    }));

    return {
      posts: postsWithStatus,
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

    // Create like and update counter in transaction
    const [like, updatedPost] = await prisma.$transaction([
      prisma.likedPost.create({
        data: {
          userId,
          postId,
        },
      }),
      prisma.feedPost.update({
        where: { id: postId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
        select: {
          likesCount: true,
        },
      }),
    ]);

    return {
      message: 'Post curtido com sucesso',
      likesCount: updatedPost.likesCount,
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

    // Remove like and update counter in transaction
    const [, updatedPost] = await prisma.$transaction([
      prisma.likedPost.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      }),
      prisma.feedPost.update({
        where: { id: postId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
        select: {
          likesCount: true,
        },
      }),
    ]);

    return {
      message: 'Curtida removida com sucesso',
      likesCount: updatedPost.likesCount,
    };
  }

  // 🆕 NOVAS FUNCIONALIDADES PARA POSTS SALVOS

  async savePost(postId: string, userId: string) {
    // Verificar se o post existe
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Verificar se já salvou
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingSave) {
      throw new ValidationError('Post já foi salvo');
    }

    // Salvar post
    await prisma.savedPost.create({
      data: {
        userId,
        postId,
      },
    });

    return {
      message: 'Post salvo com sucesso',
      isSaved: true,
    };
  }

  async unsavePost(postId: string, userId: string) {
    // Verificar se o post existe
    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado');
    }

    // Verificar se realmente salvou
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingSave) {
      throw new ValidationError('Post não foi salvo');
    }

    // Remover dos salvos
    await prisma.savedPost.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return {
      message: 'Post removido dos favoritos',
      isSaved: false,
    };
  }

  // Listar posts salvos pelo usuário (para integração com perfil)
  async getSavedPosts(userId: string, query: FeedQuery = {}) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 12, 50);
    const skip = (page - 1) * limit;

    const [savedPosts, total] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId },
        include: {
          post: {
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.savedPost.count({
        where: { userId },
      }),
    ]);

    const formattedPosts = savedPosts.map(savedPost => ({
      id: savedPost.post.id,
      storeId: savedPost.post.storeId,
      imageUrl: savedPost.post.imageUrl,
      caption: savedPost.post.caption,
      likesCount: savedPost.post.likesCount,
      createdAt: savedPost.post.createdAt,
      updatedAt: savedPost.post.updatedAt,
      store: {
        id: savedPost.post.store.id,
        name: savedPost.post.store.name,
        avatarUrl: savedPost.post.store.avatarUrl,
      },
      isLiked: false, // Será calculado se necessário
      isSaved: true,
      savedAt: savedPost.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      outfits: formattedPosts, // Usando "outfits" para compatibilidade com frontend
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      },
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

  // Deletar post (apenas para proprietários)
  async deletePost(postId: string, userId: string) {
    // Verificar se o post existe e se o usuário é o dono
    const post = await prisma.feedPost.findFirst({
      where: {
        id: postId,
        storeId: userId, // O usuário deve ser o dono da loja
      },
    });

    if (!post) {
      throw new NotFoundError('Post não encontrado ou você não tem permissão para deletá-lo');
    }

    // Deletar imagem do Supabase
    try {
      await supabaseService.deleteImage(post.imageUrl);
    } catch (error) {
      console.warn('Erro ao deletar imagem do Supabase:', error);
      // Continua mesmo se não conseguir deletar a imagem
    }

    // Deletar post (vai deletar relacionamentos automaticamente devido ao CASCADE)
    await prisma.feedPost.delete({
      where: { id: postId },
    });

    return {
      message: 'Post deletado com sucesso',
    };
  }

  // Estatísticas para o perfil
  async getFeedStats(userId: string) {
    const [postsCount, savedPostsCount] = await Promise.all([
      prisma.feedPost.count({
        where: { storeId: userId },
      }),
      prisma.savedPost.count({
        where: { userId },
      }),
    ]);

    return {
      totalPosts: postsCount,
      savedPosts: savedPostsCount,
    };
  }
}

export const feedService = new FeedService();
