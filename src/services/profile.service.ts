import { PrismaClient } from '@prisma/client';
import { supabaseService } from './supabase.service';
import { AppError } from '../utils/AppError';
import { UpdateProfileInput, CreateOutfitInput, LikeOrFavoriteInput } from '../validations/profile.validation';

const prisma = new PrismaClient();

export class ProfileService {
  // Buscar perfil completo do usuário
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        location: true,
        style: true,
        avatarUrl: true,
        type: true,
        createdAt: true,
        _count: {
          select: {
            clothingItems: true,
            userOutfits: true,
            feedPosts: true,
            likes: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      location: user.location,
      style: user.style,
      avatar: user.avatarUrl,
      userType: user.type,
      createdAt: user.createdAt,
      stats: {
        clothingItems: user._count.clothingItems,
        outfits: user._count.userOutfits,
        posts: user._count.feedPosts,
        likes: user._count.likes,
        favorites: user._count.favorites,
      },
    };
  }

  // Atualizar perfil do usuário
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.style && { style: data.style }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        location: true,
        style: true,
        avatarUrl: true,
        type: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }

  // Upload de avatar
  async uploadAvatar(userId: string, imageDataUri: string) {
    try {
      // Converter data URI para buffer
      const base64Data = imageDataUri.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload da imagem para o Supabase
      const imageUrl = await supabaseService.uploadImage(buffer, "avatars");

      // Atualizar o avatar do usuário no banco
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: imageUrl },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          location: true,
          style: true,
          avatarUrl: true,
          type: true,
          createdAt: true,
        },
      });

      return {
        ...updatedUser,
        avatar: updatedUser.avatarUrl,
        userType: updatedUser.type,
      };
    } catch (error) {
      throw new AppError('Erro ao fazer upload do avatar', 500);
    }
  }

  // Buscar outfits do usuário
  async getUserOutfits(userId: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;

    const [outfits, total] = await Promise.all([
      prisma.userOutfit.findMany({
        where: { userId },
        include: {
          outfitItems: {
            include: {
              clothingItem: {
                select: {
                  id: true,
                  photoUrl: true,
                  type: true,
                  color: true,
                  season: true,
                  occasion: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userOutfit.count({
        where: { userId },
      }),
    ]);

    // Contar likes para cada outfit
    const outfitIds = outfits.map(outfit => outfit.id);
    const likeCounts = await prisma.like.groupBy({
      by: ['targetId'],
      where: {
        targetId: { in: outfitIds },
        targetType: 'OUTFIT',
      },
      _count: {
        id: true,
      },
    });

    const likeCountMap = new Map(
      likeCounts.map(item => [item.targetId, item._count.id])
    );

    return {
      outfits: outfits.map(outfit => ({
        id: outfit.id,
        title: outfit.title,
        imageUrl: outfit.imageUrl,
        tags: outfit.tags,
        isAiGenerated: outfit.isAiGenerated,
        createdAt: outfit.createdAt,
        items: outfit.outfitItems.map(item => item.clothingItem),
        likesCount: likeCountMap.get(outfit.id) || 0,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Criar novo outfit
  async createOutfit(userId: string, data: CreateOutfitInput) {
    // Verificar se todas as peças pertencem ao usuário
    const clothingItems = await prisma.clothingItem.findMany({
      where: {
        id: { in: data.itemIds },
        userId,
      },
    });

    if (clothingItems.length !== data.itemIds.length) {
      throw new AppError('Uma ou mais peças não pertencem ao usuário', 400);
    }

    let imageUrl: string | null = null;

    // Se uma imagem foi fornecida, fazer upload
    if (data.imageDataUri) {
      try {
        // Converter data URI para buffer
        const base64Data = data.imageDataUri.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        imageUrl = await supabaseService.uploadImage(
          buffer,
          "outfits"
        );
      } catch (error) {
        throw new AppError('Erro ao fazer upload da imagem do outfit', 500);
      }
    }

    // Criar o outfit
    const outfit = await prisma.userOutfit.create({
      data: {
        title: data.title,
        userId,
        imageUrl,
        tags: data.tags || [],
        isAiGenerated: false,
      },
    });

    // Criar as relações com as peças
    await prisma.outfitItem.createMany({
      data: data.itemIds.map(itemId => ({
        outfitId: outfit.id,
        clothingItemId: itemId,
      })),
    });

    // Buscar o outfit completo para retornar
    const completeOutfit = await prisma.userOutfit.findUnique({
      where: { id: outfit.id },
      include: {
        outfitItems: {
          include: {
            clothingItem: {
              select: {
                id: true,
                photoUrl: true,
                type: true,
                color: true,
                season: true,
                occasion: true,
              },
            },
          },
        },
      },
    });

    return {
      id: completeOutfit!.id,
      title: completeOutfit!.title,
      imageUrl: completeOutfit!.imageUrl,
      tags: completeOutfit!.tags,
      isAiGenerated: completeOutfit!.isAiGenerated,
      createdAt: completeOutfit!.createdAt,
      items: completeOutfit!.outfitItems.map(item => item.clothingItem),
      likesCount: 0,
    };
  }

  // Deletar outfit
  async deleteOutfit(userId: string, outfitId: string) {
    const outfit = await prisma.userOutfit.findFirst({
      where: {
        id: outfitId,
        userId,
      },
    });

    if (!outfit) {
      throw new AppError('Outfit não encontrado ou não pertence ao usuário', 404);
    }

    // Deletar o outfit (as relações serão deletadas automaticamente por causa do onDelete: Cascade)
    await prisma.userOutfit.delete({
      where: { id: outfitId },
    });

    return { message: 'Outfit deletado com sucesso' };
  }

  // Toggle like em outfit ou post
  async toggleLike(userId: string, data: LikeOrFavoriteInput) {
    const { targetId, targetType } = data;

    // Verificar se o target existe
    if (targetType === 'OUTFIT') {
      const outfit = await prisma.userOutfit.findUnique({
        where: { id: targetId },
      });
      if (!outfit) {
        throw new AppError('Outfit não encontrado', 404);
      }
    } else if (targetType === 'POST') {
      const post = await prisma.feedPost.findUnique({
        where: { id: targetId },
      });
      if (!post) {
        throw new AppError('Post não encontrado', 404);
      }
    }

    // Verificar se já existe like
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
    });

    if (existingLike) {
      // Remover like
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    } else {
      // Adicionar like
      await prisma.like.create({
        data: {
          userId,
          targetId,
          targetType,
        },
      });
      return { liked: true };
    }
  }

  // Toggle favorite em outfit ou post
  async toggleFavorite(userId: string, data: LikeOrFavoriteInput) {
    const { targetId, targetType } = data;

    // Verificar se o target existe
    if (targetType === 'OUTFIT') {
      const outfit = await prisma.userOutfit.findUnique({
        where: { id: targetId },
      });
      if (!outfit) {
        throw new AppError('Outfit não encontrado', 404);
      }
    } else if (targetType === 'POST') {
      const post = await prisma.feedPost.findUnique({
        where: { id: targetId },
      });
      if (!post) {
        throw new AppError('Post não encontrado', 404);
      }
    }

    // Verificar se já existe favorite
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
    });

    if (existingFavorite) {
      // Remover favorite
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      return { favorited: false };
    } else {
      // Adicionar favorite
      await prisma.favorite.create({
        data: {
          userId,
          targetId,
          targetType,
        },
      });
      return { favorited: true };
    }
  }

  // Buscar favoritos do usuário
  async getUserFavorites(userId: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.favorite.count({
        where: { userId },
      }),
    ]);

    // Separar IDs por tipo
    const outfitIds = favorites.filter(f => f.targetType === 'OUTFIT').map(f => f.targetId);
    const postIds = favorites.filter(f => f.targetType === 'POST').map(f => f.targetId);

    // Buscar outfits
    const outfits = outfitIds.length > 0 ? await prisma.userOutfit.findMany({
      where: { id: { in: outfitIds } },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        outfitItems: {
          include: {
            clothingItem: {
              select: {
                id: true,
                photoUrl: true,
                type: true,
                color: true,
              },
            },
          },
        },
      },
    }) : [];

    // Buscar posts
    const posts = postIds.length > 0 ? await prisma.feedPost.findMany({
      where: { id: { in: postIds } },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    }) : [];

    // Mapear outfits
    const outfitMap = new Map(outfits.map(outfit => [outfit.id, outfit]));
    const postMap = new Map(posts.map(post => [post.id, post]));

    const formattedFavorites = favorites.map(favorite => {
      if (favorite.targetType === 'OUTFIT') {
        const outfit = outfitMap.get(favorite.targetId);
        if (outfit) {
          return {
            id: favorite.id,
            type: 'OUTFIT',
            createdAt: favorite.createdAt,
            outfit: {
              id: outfit.id,
              title: outfit.title,
              imageUrl: outfit.imageUrl,
              tags: outfit.tags,
              isAiGenerated: outfit.isAiGenerated,
              createdAt: outfit.createdAt,
              user: {
                id: outfit.user.id,
                name: outfit.user.name,
                avatar: outfit.user.avatarUrl,
              },
              items: outfit.outfitItems.map(item => item.clothingItem),
              likesCount: 0, // Será calculado depois se necessário
            },
          };
        }
      } else if (favorite.targetType === 'POST') {
        const post = postMap.get(favorite.targetId);
        if (post) {
          return {
            id: favorite.id,
            type: 'POST',
            createdAt: favorite.createdAt,
            post: {
              id: post.id,
              imageUrl: post.imageUrl,
              caption: post.caption,
              createdAt: post.createdAt,
              user: {
                id: post.store.id,
                name: post.store.name,
                avatar: post.store.avatarUrl,
              },
              likesCount: 0, // Será calculado depois se necessário
              commentsCount: 0, // Não temos comentários ainda
            },
          };
        }
      }
      return null;
    }).filter(Boolean);

    return {
      favorites: formattedFavorites,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Buscar estatísticas detalhadas do usuário
  async getUserStats(userId: string) {
    const [
      clothingItemsCount,
      outfitsCount,
      postsCount,
      likesGivenCount,
      favoritesCount,
    ] = await Promise.all([
      prisma.clothingItem.count({ where: { userId } }),
      prisma.userOutfit.count({ where: { userId } }),
      prisma.feedPost.count({ where: { storeId: userId } }),
      prisma.like.count({ where: { userId } }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    // Contar likes recebidos (mais complexo)
    const userOutfits = await prisma.userOutfit.findMany({
      where: { userId },
      select: { id: true },
    });

    const userPosts = await prisma.feedPost.findMany({
      where: { storeId: userId },
      select: { id: true },
    });

    const outfitIds = userOutfits.map(o => o.id);
    const postIds = userPosts.map(p => p.id);

    let likesReceivedCount = 0;

    if (outfitIds.length > 0 || postIds.length > 0) {
      const orConditions = [];
      
      if (outfitIds.length > 0) {
        orConditions.push({
          targetType: 'OUTFIT' as const,
          targetId: { in: outfitIds },
        });
      }
      
      if (postIds.length > 0) {
        orConditions.push({
          targetType: 'POST' as const,
          targetId: { in: postIds },
        });
      }

      if (orConditions.length > 0) {
        likesReceivedCount = await prisma.like.count({
          where: {
            OR: orConditions,
          },
        });
      }
    }

    return {
      clothingItems: clothingItemsCount,
      outfits: outfitsCount,
      posts: postsCount,
      likesGiven: likesGivenCount,
      favorites: favoritesCount,
      likesReceived: likesReceivedCount,
    };
  }
}

export const profileService = new ProfileService();
