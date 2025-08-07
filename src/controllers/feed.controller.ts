import { Request, Response, NextFunction } from 'express';
import { feedService } from '@/services/feed.service';
import { 
  createFeedPostSchema, 
  getFeedSchema, 
  getSavedPostsSchema, 
  postIdSchema 
} from '@/validations/feed.validation';
import { ValidationError } from '@/utils/AppError';

export class FeedController {
  async createFeedPost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Validate request
      const validation = createFeedPostSchema.safeParse({ body: req.body });
      
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.createFeedPost(req.user.id, validation.data.body);

      res.status(201).json({
        success: true,
        message: 'Post criado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request
      const validation = getFeedSchema.safeParse({ query: req.query });
      
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.getFeed(validation.data.query, req.user?.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async likePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const validation = postIdSchema.safeParse({ params: req.params });
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.likePost(req.user.id, validation.data.params.postId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const validation = postIdSchema.safeParse({ params: req.params });
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.unlikePost(req.user.id, validation.data.params.postId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // 🆕 NOVOS ENDPOINTS PARA POSTS SALVOS

  async savePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const validation = postIdSchema.safeParse({ params: req.params });
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.savePost(validation.data.params.postId, req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async unsavePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const validation = postIdSchema.safeParse({ params: req.params });
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.unsavePost(validation.data.params.postId, req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSavedPosts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const validation = getSavedPostsSchema.safeParse({ query: req.query });
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.getSavedPosts(req.user.id, validation.data.query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Endpoint atualizado para deletar posts
  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const validation = postIdSchema.safeParse({ params: req.params });
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.deletePost(validation.data.params.postId, req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = postIdSchema.safeParse({ params: req.params });
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await feedService.getPostById(validation.data.params.postId, req.user?.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStorePosts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await feedService.getStorePosts(req.user.id, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Estatísticas do feed para o perfil
  async getFeedStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const result = await feedService.getFeedStats(req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const feedController = new FeedController();
