import { Request, Response, NextFunction } from 'express';
import { builderService } from '@/services/builder.service';
import { generateOutfitSchema } from '@/validations/builder.validation';
import { ValidationError } from '@/utils/AppError';

export class BuilderController {
  async generateOutfit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Validate request
      const validation = generateOutfitSchema.safeParse({ body: req.body });
      
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await builderService.generateOutfit(req.user.id, validation.data.body);

      res.status(201).json({
        success: true,
        message: 'Look gerado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGeneratedOutfits(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await builderService.getGeneratedOutfits(req.user.id, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOutfitById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const { outfitId } = req.params;
      const result = await builderService.getOutfitById(outfitId, req.user.id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const builderController = new BuilderController();
