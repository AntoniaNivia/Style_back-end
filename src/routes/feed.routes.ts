import { Router } from 'express';
import { feedController } from '../controllers/feed.controller';
import { authMiddleware, requireUserType } from '../middlewares/auth.middleware';

const router = Router();

// Public feed routes
router.get('/', feedController.getFeed.bind(feedController));
router.get('/:postId', feedController.getPostById.bind(feedController));

// Protected feed routes
router.use(authMiddleware);

// Store-only routes
router.post('/', requireUserType(['STORE']), feedController.createFeedPost.bind(feedController));
router.delete('/:postId', requireUserType(['STORE']), feedController.deletePost.bind(feedController));

// User and Store routes - Like/Unlike
router.post('/:postId/like', feedController.likePost.bind(feedController));
router.delete('/:postId/like', feedController.unlikePost.bind(feedController));

// 🆕 ROTAS PARA POSTS SALVOS
router.post('/:postId/save', feedController.savePost.bind(feedController));
router.delete('/:postId/save', feedController.unsavePost.bind(feedController));

// Listar posts salvos (para integração com perfil)
router.get('/saved/posts', feedController.getSavedPosts.bind(feedController));

// Store posts management
router.get('/my/posts', requireUserType(['STORE']), feedController.getStorePosts.bind(feedController));

// Estatísticas do feed
router.get('/my/stats', feedController.getFeedStats.bind(feedController));

export { router as feedRoutes };
