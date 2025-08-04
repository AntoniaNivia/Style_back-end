import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { wardrobeRoutes } from './wardrobe.routes';
import { builderRoutes } from './builder.routes';
import { feedRoutes } from './feed.routes';

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
router.use('/users', userRoutes);
router.use('/wardrobe', wardrobeRoutes);
router.use('/builder', builderRoutes);
router.use('/feed', feedRoutes);

export { router as apiRoutes };
