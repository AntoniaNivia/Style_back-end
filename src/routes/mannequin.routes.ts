import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import mannequinController from '../controllers/mannequin.controller'

const router = Router()

// Aplicar autenticação a todas as rotas
router.use(authMiddleware)

// POST /api/mannequin-preview - Gerar preview do manequim
router.post('/', mannequinController.generatePreview)

// GET /api/mannequin-preview/generations - Listar gerações do usuário
router.get('/generations', mannequinController.getUserGenerations)

// GET /api/mannequin-preview/:previewId/status - Buscar status da geração
router.get('/:previewId/status', mannequinController.getGenerationStatus)

// DELETE /api/mannequin-preview/:previewId - Deletar geração
router.delete('/:previewId', mannequinController.deleteGeneration)

export default router
