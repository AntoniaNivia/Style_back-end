import { Request, Response, NextFunction } from 'express';
import { feedService } from '@/services/feed.service';
import { createFeedPostSchema, getFeedSchema } from '@/validations/feed.validation';
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

      const { id } = req.params;
      const result = await feedService.likePost(req.user.id, id);

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

      const { id } = req.params;
      const result = await feedService.unlikePost(req.user.id, id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFeedPost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const { id } = req.params;
      const result = await feedService.deleteFeedPost(req.user.id, id);

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
      const { id } = req.params;
      const result = await feedService.getPostById(id, req.user?.id);

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
}

export const feedController = new FeedController();
