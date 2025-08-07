import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { UnauthorizedError, NotFoundError } from '@/utils/AppError';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  type: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        type: 'USER' | 'STORE';
        gender: 'FEMALE' | 'MALE' | 'OTHER';
        mannequinPreference: 'Woman' | 'Man' | 'Neutral';
        style?: string;
        avatarUrl?: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('Auth middleware - No token provided');
      throw new UnauthorizedError('Token de acesso não fornecido');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    console.log('Auth middleware - Token decoded for user:', decoded.userId);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        gender: true,
        mannequinPreference: true,
        style: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.log('Auth middleware - User not found:', decoded.userId);
      throw new NotFoundError('Usuário não encontrado');
    }

    req.user = {
      ...user,
      style: user.style ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
    };
    console.log('Auth middleware - User set:', req.user.id);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Token inválido'));
    } else {
      next(error);
    }
  }
};

export const requireUserType = (allowedTypes: ('USER' | 'STORE')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuário não autenticado'));
    }

    if (!allowedTypes.includes(req.user.type)) {
      return next(new UnauthorizedError('Tipo de usuário não autorizado para esta ação'));
    }

    next();
  };
};
