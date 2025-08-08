import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { profileController } from '../controllers/profile.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import {
  updateProfileSchema,
  uploadAvatarSchema,
  createOutfitSchema,
  getOutfitsSchema,
  likeOrFavoriteSchema,
  getFavoritesSchema,
} from '../validations/profile.validation';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// User routes (protected)
router.get('/me', authController.getMe.bind(authController));

// Profile management routes
router.get('/profile', profileController.getProfile);
router.put('/profile', validateRequest(updateProfileSchema), profileController.updateProfile);
router.post('/avatar', validateRequest(uploadAvatarSchema), profileController.uploadAvatar);
router.get('/profile/stats', profileController.getStats);

// User outfits routes
router.get('/outfits', validateRequest(getOutfitsSchema), profileController.getOutfits);
router.post('/outfits', validateRequest(createOutfitSchema), profileController.createOutfit);
router.delete('/outfits/:id', profileController.deleteOutfit);

// Social interaction routes
router.post('/like', validateRequest(likeOrFavoriteSchema), profileController.toggleLike);
router.post('/favorite', validateRequest(likeOrFavoriteSchema), profileController.toggleFavorite);
router.get('/favorites', validateRequest(getFavoritesSchema), profileController.getFavorites);

export { router as userRoutes };
