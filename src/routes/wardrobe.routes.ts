import { Router } from 'express';
import { wardrobeController } from '@/controllers/wardrobe.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

// All wardrobe routes are protected
router.use(authMiddleware);

// Wardrobe routes
router.post('/', wardrobeController.addClothingItem.bind(wardrobeController));
router.get('/', wardrobeController.getWardrobe.bind(wardrobeController));
router.delete('/:id', wardrobeController.deleteClothingItem.bind(wardrobeController));

// Saved outfits
router.get('/outfits', wardrobeController.getSavedOutfits.bind(wardrobeController));

export { router as wardrobeRoutes };
