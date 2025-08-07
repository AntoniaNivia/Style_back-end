import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { wardrobeRoutes } from './wardrobe.routes';
import { builderRoutes } from './builder.routes';
import { feedRoutes } from './feed.routes';
import manualOutfitRoutes from './manual-outfit.routes';
import mannequinRoutes from './mannequin.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'StyleWise API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes); // Agora inclui todas as rotas de perfil
router.use('/wardrobe', wardrobeRoutes); // 🆕 Inclui busca avançada
router.use('/builder', builderRoutes);
router.use('/feed', feedRoutes);
router.use('/manual-outfits', manualOutfitRoutes); // 🆕 Rotas para looks manuais
router.use('/mannequin-preview', mannequinRoutes); // 🆕 Rotas para geração de manequim

export { router as apiRoutes };
