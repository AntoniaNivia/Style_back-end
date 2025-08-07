import { Router } from 'express';
import { wardrobeController } from '@/controllers/wardrobe.controller';
import wardrobeSearchController from '../controllers/wardrobe-search.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

// All wardrobe routes are protected
router.use(authMiddleware);

// Wardrobe routes
router.post('/', wardrobeController.addClothingItem.bind(wardrobeController));
router.post('/analyze', wardrobeController.analyzeClothing.bind(wardrobeController));
router.get('/', wardrobeController.getWardrobe.bind(wardrobeController));
router.delete('/:id', wardrobeController.deleteClothingItem.bind(wardrobeController));

// Saved outfits
router.get('/outfits', wardrobeController.getSavedOutfits.bind(wardrobeController));

// 🆕 Novas rotas de busca avançada
router.get('/search', wardrobeSearchController.searchWardrobe);
router.post('/validate-items', wardrobeSearchController.validateItems);
router.get('/most-used', wardrobeSearchController.getMostUsedItems);
router.post('/recommendations', wardrobeSearchController.getRecommendations);
router.get('/stats', wardrobeSearchController.getWardrobeStats);
router.get('/filters', wardrobeSearchController.getAvailableFilters);

export { router as wardrobeRoutes };
