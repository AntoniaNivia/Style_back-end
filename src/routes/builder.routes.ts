import { Router } from 'express';
import { builderController } from '../controllers/builder.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All builder routes are protected
router.use(authMiddleware);

// Builder routes
router.post('/generate', builderController.generateOutfit.bind(builderController));
router.get('/outfits', builderController.getGeneratedOutfits.bind(builderController));
router.get('/outfits/:outfitId', builderController.getOutfitById.bind(builderController));

export { router as builderRoutes };
