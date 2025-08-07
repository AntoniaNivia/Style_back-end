import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@/utils/AppError';

/**
 * Middleware para garantir que apenas usuários do tipo STORE possam acessar o endpoint
 */
export const storeOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new ForbiddenError('Usuário não autenticado'));
  }

  if (req.user.type !== 'STORE') {
    return next(new ForbiddenError('Acesso restrito a lojas'));
  }

  next();
};
