import { Request, Response } from 'express';
import { profileService } from '../services/profile.service';
import { AppError } from '../utils/AppError';
import {
  UpdateProfileInput,
  UploadAvatarInput,
  CreateOutfitInput,
  GetOutfitsInput,
  LikeOrFavoriteInput,
  GetFavoritesInput,
} from '../validations/profile.validation';

export class ProfileController {
  // GET /api/users/profile - Buscar perfil do usuário
  async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const profile = await profileService.getUserProfile(userId);

      return res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // PUT /api/users/profile - Atualizar perfil do usuário
  async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const data: UpdateProfileInput = req.body;

      const updatedProfile = await profileService.updateProfile(userId, data);

      return res.json({
        success: true,
        data: {
          ...updatedProfile,
          avatar: updatedProfile.avatarUrl,
          userType: updatedProfile.type,
        },
        message: 'Perfil atualizado com sucesso',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // POST /api/users/avatar - Upload de avatar
  async uploadAvatar(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { imageDataUri }: UploadAvatarInput = req.body;

      const updatedProfile = await profileService.uploadAvatar(userId, imageDataUri);

      return res.json({
        success: true,
        data: updatedProfile,
        message: 'Avatar atualizado com sucesso',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // GET /api/users/outfits - Buscar outfits do usuário
  async getOutfits(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { page, limit }: GetOutfitsInput = req.query as any;

      const result = await profileService.getUserOutfits(userId, page, limit);

      return res.json({
        success: true,
        data: result.outfits,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // POST /api/users/outfits - Criar novo outfit
  async createOutfit(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const data: CreateOutfitInput = req.body;

      const outfit = await profileService.createOutfit(userId, data);

      return res.status(201).json({
        success: true,
        data: outfit,
        message: 'Outfit criado com sucesso',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // DELETE /api/users/outfits/:id - Deletar outfit
  async deleteOutfit(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const outfitId = req.params.id;

      const result = await profileService.deleteOutfit(userId, outfitId);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // POST /api/users/like - Toggle like em outfit ou post
  async toggleLike(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const data: LikeOrFavoriteInput = req.body;

      const result = await profileService.toggleLike(userId, data);

      return res.json({
        success: true,
        data: result,
        message: result.liked ? 'Like adicionado' : 'Like removido',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // POST /api/users/favorite - Toggle favorite em outfit ou post
  async toggleFavorite(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const data: LikeOrFavoriteInput = req.body;

      const result = await profileService.toggleFavorite(userId, data);

      return res.json({
        success: true,
        data: result,
        message: result.favorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // GET /api/users/favorites - Buscar favoritos do usuário
  async getFavorites(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { page, limit }: GetFavoritesInput = req.query as any;

      const result = await profileService.getUserFavorites(userId, page, limit);

      return res.json({
        success: true,
        data: result.favorites,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // GET /api/users/profile/stats - Buscar estatísticas do usuário
  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      console.log('Getting stats for user:', userId);
      
      const stats = await profileService.getUserStats(userId);
      console.log('Stats retrieved:', stats);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
}

export const profileController = new ProfileController();
