import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service';
import { registerSchema, loginSchema } from '@/validations/auth.validation';
import { ValidationError } from '@/utils/AppError';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request
      const validation = registerSchema.safeParse({ body: req.body });
      
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await authService.register(validation.data.body);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request
      const validation = loginSchema.safeParse({ body: req.body });
      
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const result = await authService.login(validation.data.body);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ValidationError('Usuário não autenticado');
      }

      const user = await authService.getUserById(req.user.id);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
