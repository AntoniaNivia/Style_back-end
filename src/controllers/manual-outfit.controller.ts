import { Request, Response, NextFunction } from 'express'
import manualOutfitService from '../services/manual-outfit.service'
import {
  createManualOutfitSchema,
  updateManualOutfitSchema,
  getManualOutfitsSchema,
  deleteManualOutfitSchema
} from '../validations/manual-outfit.validation'

class ManualOutfitController {
  // POST /api/manual-outfits - Criar um novo look manual
  async createManualOutfit(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar dados de entrada
      const validatedData = createManualOutfitSchema.parse({
        body: req.body
      })

      // Criar o look manual
      const items = validatedData.body.selectedItems || validatedData.body.itemIds
      const manualOutfit = await manualOutfitService.createManualOutfit({
        userId: req.user?.id!,
        name: validatedData.body.name,
        selectedItems: items!,
        notes: validatedData.body.notes,
        tags: validatedData.body.tags,
        isPrivate: validatedData.body.isPrivate
      })

      res.status(201).json({
        success: true,
        message: 'Look manual criado com sucesso',
        data: manualOutfit
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/manual-outfits - Listar looks manuais do usuário
  async getManualOutfits(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar parâmetros de query
      const validatedData = getManualOutfitsSchema.parse({
        query: req.query
      })

      // Buscar os looks manuais
      const result = await manualOutfitService.getManualOutfits({
        userId: req.user?.id!,
        page: validatedData.query.page,
        limit: validatedData.query.limit,
        search: validatedData.query.search,
        tags: validatedData.query.tags,
        isPrivate: validatedData.query.isPrivate
      })

      res.json({
        success: true,
        data: {
          outfits: result.outfits,
          pagination: result.pagination
        }
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/manual-outfits/:id - Buscar um look manual específico
  async getManualOutfitById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const manualOutfit = await manualOutfitService.getManualOutfitById(id, req.user?.id!)

      res.json({
        success: true,
        data: manualOutfit
      })
    } catch (error) {
      next(error)
    }
  }

  // PUT /api/manual-outfits/:id - Atualizar um look manual
  async updateManualOutfit(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar dados de entrada
      const validatedData = updateManualOutfitSchema.parse({
        body: req.body,
        params: req.params
      })

      // Atualizar o look manual
      const updatedOutfit = await manualOutfitService.updateManualOutfit(
        validatedData.params.id,
        req.user?.id!,
        {
          name: validatedData.body.name,
          selectedItems: validatedData.body.selectedItems,
          notes: validatedData.body.notes,
          tags: validatedData.body.tags,
          isPrivate: validatedData.body.isPrivate
        }
      )

      res.json({
        success: true,
        message: 'Look manual atualizado com sucesso',
        data: updatedOutfit
      })
    } catch (error) {
      next(error)
    }
  }

  // DELETE /api/manual-outfits/:id - Deletar um look manual
  async deleteManualOutfit(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar dados de entrada
      const validatedData = deleteManualOutfitSchema.parse({
        params: req.params
      })

      // Deletar o look manual
      const result = await manualOutfitService.deleteManualOutfit(
        validatedData.params.id,
        req.user?.id!
      )

      res.json({
        success: true,
        message: result.message
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/manual-outfits/stats - Obter estatísticas dos looks manuais
  async getManualOutfitStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await manualOutfitService.getManualOutfitStats(req.user?.id!)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  // POST /api/manual-outfits/:id/duplicate - Duplicar um look manual
  async duplicateManualOutfit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const result = await manualOutfitService.duplicateManualOutfit(id, req.user?.id!)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new ManualOutfitController()
