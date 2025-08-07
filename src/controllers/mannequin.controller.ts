import { Request, Response, NextFunction } from 'express'
import mannequinService from '../services/mannequin.service'
import {
  generateMannequinPreviewSchema,
  getGenerationStatusSchema,
  getUserGenerationsSchema,
  deleteGenerationSchema
} from '../validations/manual-builder.validation'

class MannequinController {
  // POST /api/mannequin-preview - Gerar preview do manequim
  async generatePreview(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar dados de entrada
      const validatedData = generateMannequinPreviewSchema.parse({
        body: req.body
      })

      // Gerar preview
      const result = await mannequinService.generateMannequinPreview({
        userId: req.user?.id!,
        selectedItems: validatedData.body.selectedItems,
        mannequinPreference: validatedData.body.mannequinPreference,
        outfitName: validatedData.body.outfitName,
        notes: validatedData.body.notes
      })

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/mannequin-preview/:previewId/status - Buscar status da geração
  async getGenerationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar dados de entrada
      const validatedData = getGenerationStatusSchema.parse({
        params: req.params
      })

      // Buscar status
      const status = await mannequinService.getGenerationStatus(
        validatedData.params.previewId,
        req.user?.id!
      )

      res.json({
        success: true,
        data: status
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/mannequin-preview/generations - Listar gerações do usuário
  async getUserGenerations(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar parâmetros de query
      const validatedData = getUserGenerationsSchema.parse({
        query: req.query
      })

      // Buscar gerações
      const result = await mannequinService.getUserGenerations(
        req.user?.id!,
        validatedData.query.page,
        validatedData.query.limit
      )

      res.json({
        success: true,
        data: result.generations,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  // DELETE /api/mannequin-preview/:previewId - Deletar geração
  async deleteGeneration(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar dados de entrada
      const validatedData = deleteGenerationSchema.parse({
        params: req.params
      })

      // Deletar geração
      const result = await mannequinService.deleteGeneration(
        validatedData.params.previewId,
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
}

export default new MannequinController()
