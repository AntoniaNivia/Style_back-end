import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Auth routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

export { router as authRoutes };
