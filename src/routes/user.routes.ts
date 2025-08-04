import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

// User routes (protected)
router.get('/me', authMiddleware, authController.getMe.bind(authController));

export { router as userRoutes };
