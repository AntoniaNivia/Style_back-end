import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import manualOutfitController from '../controllers/manual-outfit.controller'

const router = Router()

// Aplicar autenticação a todas as rotas
router.use(authMiddleware)

// POST /api/manual-outfits - Criar um novo look manual
router.post('/', manualOutfitController.createManualOutfit)

// GET /api/manual-outfits - Listar looks manuais do usuário
router.get('/', manualOutfitController.getManualOutfits)

// GET /api/manual-outfits/my - Listar looks manuais do usuário (alias para compatibilidade)
router.get('/my', manualOutfitController.getManualOutfits)

// GET /api/manual-outfits/stats - Obter estatísticas dos looks manuais
router.get('/stats', manualOutfitController.getManualOutfitStats)

// GET /api/manual-outfits/:id - Buscar um look manual específico
router.get('/:id', manualOutfitController.getManualOutfitById)

// POST /api/manual-outfits/:id/duplicate - Duplicar um look manual
router.post('/:id/duplicate', manualOutfitController.duplicateManualOutfit)

// PUT /api/manual-outfits/:id - Atualizar um look manual
router.put('/:id', manualOutfitController.updateManualOutfit)

// DELETE /api/manual-outfits/:id - Deletar um look manual
router.delete('/:id', manualOutfitController.deleteManualOutfit)

export default router
