import { Router } from 'express';
import { feedController } from '@/controllers/feed.controller';
import { authMiddleware, requireUserType } from '@/middlewares/auth.middleware';

const router = Router();

// Public feed routes
router.get('/', feedController.getFeed.bind(feedController));
router.get('/:id', feedController.getPostById.bind(feedController));

// Protected feed routes
router.use(authMiddleware);

// Store-only routes
router.post('/', requireUserType(['STORE']), feedController.createFeedPost.bind(feedController));
router.delete('/:id', requireUserType(['STORE']), feedController.deleteFeedPost.bind(feedController));

// User and Store routes
router.post('/:id/like', feedController.likePost.bind(feedController));
router.delete('/:id/like', feedController.unlikePost.bind(feedController));

// Store posts management
router.get('/my/posts', requireUserType(['STORE']), feedController.getStorePosts.bind(feedController));

export { router as feedRoutes };
