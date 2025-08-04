import { Router } from 'express';
import { wardrobeController } from '@/controllers/wardrobe.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

// All builder routes are protected
router.use(authMiddleware);

// Builder routes
router.post('/generate', wardrobeController.generateOutfit.bind(wardrobeController));

export { router as builderRoutes };
