import { Request, Response, NextFunction } from 'express';
import { wardrobeService } from '../services/wardrobe.service';
import { addClothingItemSchema, getWardrobeSchema, analyzeClothingSchema } from '../validations/wardrobe.validation';
import { generateOutfitSchema } from '../validations/builder.validation';
import { ValidationError } from '../utils/AppError';

export class WardrobeController {
  async addClothingItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Validate request
      const validation = addClothingItemSchema.safeParse({ body: req.body });
      
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await wardrobeService.addClothingItem(req.user.id, validation.data.body);

      res.status(201).json({
        success: true,
        message: 'Item adicionado ao guarda-roupa com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWardrobe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Validate request
      const validation = getWardrobeSchema.safeParse({ query: req.query });
      
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await wardrobeService.getWardrobe(req.user.id, validation.data.query);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteClothingItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const { id } = req.params;
      const result = await wardrobeService.deleteClothingItem(req.user.id, id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

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

      const result = await wardrobeService.generateOutfit(req.user.id, validation.data.body);

      res.json({
        success: true,
        message: 'Look gerado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSavedOutfits(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await wardrobeService.getSavedOutfits(req.user.id, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async analyzeClothing(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      // Validate request
      const validation = analyzeClothingSchema.safeParse({ body: req.body });
      
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await wardrobeService.analyzeClothingOnly(validation.data.body);

      res.json({
        success: true,
        message: 'Análise de roupa concluída',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const wardrobeController = new WardrobeController();
