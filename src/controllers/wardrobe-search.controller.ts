import { Request, Response, NextFunction } from 'express'
import wardrobeSearchService from '../services/wardrobe-search.service'
import {
  wardrobeSearchSchema,
  validateItemsSchema,
  getRecommendationsSchema
} from '../validations/manual-builder.validation'

class WardrobeSearchController {
  // GET /api/wardrobe/search - Busca avançada no guarda-roupa
  async searchWardrobe(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar parâmetros de query
      const validatedData = wardrobeSearchSchema.parse({
        query: req.query
      })

      // Executar busca
      const result = await wardrobeSearchService.searchWardrobe({
        userId: req.user?.id!,
        q: validatedData.query.q,
        type: validatedData.query.type,
        color: validatedData.query.color,
        season: validatedData.query.season,
        occasion: validatedData.query.occasion,
        brand: validatedData.query.brand,
        tags: validatedData.query.tags,
        page: validatedData.query.page,
        limit: validatedData.query.limit,
        sortBy: validatedData.query.sortBy,
        sortOrder: validatedData.query.sortOrder
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  // POST /api/wardrobe/validate-items - Validar itens em lote
  async validateItems(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar dados de entrada
      const validatedData = validateItemsSchema.parse({
        body: req.body
      })

      // Validar itens
      const result = await wardrobeSearchService.validateItems({
        itemIds: validatedData.body.itemIds,
        userId: req.user?.id!
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/wardrobe/most-used - Buscar itens mais usados
  async getMostUsedItems(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

      const items = await wardrobeSearchService.getMostUsedItems(req.user?.id!, limit)

      res.json({
        success: true,
        data: items
      })
    } catch (error) {
      next(error)
    }
  }

  // POST /api/wardrobe/recommendations - Buscar recomendações
  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar dados de entrada
      const validatedData = getRecommendationsSchema.parse({
        body: req.body
      })

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5

      // Buscar recomendações
      const recommendations = await wardrobeSearchService.getRecommendations(
        req.user?.id!,
        validatedData.body.selectedItemIds,
        limit
      )

      res.json({
        success: true,
        data: recommendations
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/wardrobe/stats - Obter estatísticas do guarda-roupa
  async getWardrobeStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await wardrobeSearchService.getWardrobeStats(req.user?.id!)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /api/wardrobe/filters - Obter filtros disponíveis
  async getAvailableFilters(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await wardrobeSearchService.searchWardrobe({
        userId: req.user?.id!,
        page: 1,
        limit: 1 // Só queremos os filtros, não os itens
      })

      res.json({
        success: true,
        data: result.filters
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new WardrobeSearchController()
