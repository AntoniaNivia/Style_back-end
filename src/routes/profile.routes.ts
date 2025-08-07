import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
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

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas de perfil
router.get('/profile', profileController.getProfile);
router.put('/profile', validateRequest(updateProfileSchema), profileController.updateProfile);
router.post('/avatar', validateRequest(uploadAvatarSchema), profileController.uploadAvatar);
router.get('/profile/stats', profileController.getStats);

// Rotas de outfits
router.get('/outfits', validateRequest(getOutfitsSchema), profileController.getOutfits);
router.post('/outfits', validateRequest(createOutfitSchema), profileController.createOutfit);
router.delete('/outfits/:id', profileController.deleteOutfit);

// Rotas de interação social
router.post('/like', validateRequest(likeOrFavoriteSchema), profileController.toggleLike);
router.post('/favorite', validateRequest(likeOrFavoriteSchema), profileController.toggleFavorite);
router.get('/favorites', validateRequest(getFavoritesSchema), profileController.getFavorites);

export default router;
