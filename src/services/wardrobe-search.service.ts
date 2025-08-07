import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError'

const prisma = new PrismaClient()

export interface WardrobeSearchFilters {
  userId: string
  q?: string // busca livre
  type?: string
  color?: string
  season?: string
  occasion?: string
  brand?: string
  tags?: string[]
  page: number
  limit: number
  sortBy?: 'date' | 'type' | 'color' | 'recent'
  sortOrder?: 'asc' | 'desc'
}

export interface WardrobeSearchResponse {
  items: any[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    availableTypes: string[]
    availableColors: string[]
    availableSeasons: string[]
    availableBrands: string[]
    availableOccasions: string[]
  }
}

export interface ItemValidationRequest {
  itemIds: string[]
  userId: string
}

export interface ItemValidationResponse {
  validItems: Array<{
    id: string
    type: string
    color: string
    available: boolean
  }>
  invalidItems: string[]
  summary: {
    total: number
    valid: number
    invalid: number
  }
}

class WardrobeSearchService {
  // Busca avançada no guarda-roupa
  async searchWardrobe(filters: WardrobeSearchFilters): Promise<WardrobeSearchResponse> {
    try {
      const { userId, q, type, color, season, occasion, brand, tags, page, limit, sortBy = 'date', sortOrder = 'desc' } = filters
      const skip = (page - 1) * limit

      // Construir filtros dinâmicos
      const where: any = {
        userId,
        ...(type && { type: { contains: type, mode: 'insensitive' } }),
        ...(color && { color: { contains: color, mode: 'insensitive' } }),
        ...(season && { season: { contains: season, mode: 'insensitive' } }),
        ...(occasion && { occasion: { contains: occasion, mode: 'insensitive' } }),
        ...(tags && tags.length > 0 && {
          tags: {
            hasSome: tags
          }
        })
      }

      // Busca livre (q) em múltiplos campos
      if (q) {
        where.OR = [
          { type: { contains: q, mode: 'insensitive' } },
          { color: { contains: q, mode: 'insensitive' } },
          { tags: { has: q } },
          // Se brand field existir, descomentar:
          // { brand: { contains: q, mode: 'insensitive' } }
        ]
      }

      // Configurar ordenação
      const orderBy: any = {}
      switch (sortBy) {
        case 'date':
          orderBy.createdAt = sortOrder
          break
        case 'type':
          orderBy.type = sortOrder
          break
        case 'color':
          orderBy.color = sortOrder
          break
        case 'recent':
          orderBy.createdAt = 'desc'
          break
        default:
          orderBy.createdAt = 'desc'
      }

      // Executar busca
      const [items, totalCount] = await Promise.all([
        prisma.clothingItem.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        prisma.clothingItem.count({ where })
      ])

      // Buscar filtros disponíveis (para mostrar no frontend)
      const availableFilters = await this.getAvailableFilters(userId)

      return {
        items,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        filters: availableFilters
      }
    } catch (error) {
      console.error('Error searching wardrobe:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Obter filtros disponíveis
  private async getAvailableFilters(userId: string) {
    try {
      // Buscar todos os valores únicos para filtros
      const items = await prisma.clothingItem.findMany({
        where: { userId },
        select: {
          type: true,
          color: true,
          season: true,
          occasion: true,
          tags: true
        }
      })

      const types = new Set<string>()
      const colors = new Set<string>()
      const seasons = new Set<string>()
      const occasions = new Set<string>()
      const brands = new Set<string>() // Placeholder para brands futuramente

      items.forEach(item => {
        if (item.type) types.add(item.type)
        if (item.color) colors.add(item.color)
        if (item.season) seasons.add(item.season)
        if (item.occasion) occasions.add(item.occasion)
      })

      return {
        availableTypes: Array.from(types).sort(),
        availableColors: Array.from(colors).sort(),
        availableSeasons: Array.from(seasons).sort(),
        availableOccasions: Array.from(occasions).sort(),
        availableBrands: Array.from(brands).sort()
      }
    } catch (error) {
      console.error('Error getting available filters:', error)
      return {
        availableTypes: [],
        availableColors: [],
        availableSeasons: [],
        availableOccasions: [],
        availableBrands: []
      }
    }
  }

  // Validar itens em lote
  async validateItems(data: ItemValidationRequest): Promise<ItemValidationResponse> {
    try {
      const { itemIds, userId } = data

      // Buscar itens que existem e pertencem ao usuário
      const validItems = await prisma.clothingItem.findMany({
        where: {
          id: { in: itemIds },
          userId
        },
        select: {
          id: true,
          type: true,
          color: true
        }
      })

      const validItemIds = validItems.map(item => item.id)
      const invalidItemIds = itemIds.filter(id => !validItemIds.includes(id))

      const validItemsResponse = validItems.map(item => ({
        id: item.id,
        type: item.type,
        color: item.color,
        available: true
      }))

      return {
        validItems: validItemsResponse,
        invalidItems: invalidItemIds,
        summary: {
          total: itemIds.length,
          valid: validItems.length,
          invalid: invalidItemIds.length
        }
      }
    } catch (error) {
      console.error('Error validating items:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Buscar itens mais usados
  async getMostUsedItems(userId: string, limit: number = 10) {
    try {
      // Por enquanto, retornar itens mais recentes
      // Em produção, seria baseado em analytics de uso
      const items = await prisma.clothingItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return items
    } catch (error) {
      console.error('Error getting most used items:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Buscar recomendações baseadas em itens selecionados
  async getRecommendations(userId: string, selectedItemIds: string[], limit: number = 5) {
    try {
      if (selectedItemIds.length === 0) {
        return []
      }

      // Buscar itens selecionados para entender o contexto
      const selectedItems = await prisma.clothingItem.findMany({
        where: {
          id: { in: selectedItemIds },
          userId
        }
      })

      if (selectedItems.length === 0) {
        return []
      }

      // Extrair características dos itens selecionados
      const selectedOccasions = [...new Set(selectedItems.map(item => item.occasion))]
      const selectedSeasons = [...new Set(selectedItems.map(item => item.season))]
      const selectedTypes = [...new Set(selectedItems.map(item => item.type))]

      // Buscar itens recomendados baseados nas características
      const recommendations = await prisma.clothingItem.findMany({
        where: {
          userId,
          id: { notIn: selectedItemIds }, // Excluir itens já selecionados
          OR: [
            { occasion: { in: selectedOccasions } },
            { season: { in: selectedSeasons } },
            { type: { notIn: selectedTypes } } // Tipos diferentes para complementar
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return recommendations
    } catch (error) {
      console.error('Error getting recommendations:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Obter estatísticas do guarda-roupa
  async getWardrobeStats(userId: string) {
    try {
      const [totalItems, typeStats, colorStats, seasonStats] = await Promise.all([
        // Total de itens
        prisma.clothingItem.count({
          where: { userId }
        }),
        // Estatísticas por tipo
        prisma.clothingItem.groupBy({
          by: ['type'],
          where: { userId },
          _count: { type: true },
          orderBy: { _count: { type: 'desc' } },
          take: 10
        }),
        // Estatísticas por cor
        prisma.clothingItem.groupBy({
          by: ['color'],
          where: { userId },
          _count: { color: true },
          orderBy: { _count: { color: 'desc' } },
          take: 10
        }),
        // Estatísticas por estação
        prisma.clothingItem.groupBy({
          by: ['season'],
          where: { userId },
          _count: { season: true },
          orderBy: { _count: { season: 'desc' } }
        })
      ])

      return {
        totalItems,
        topTypes: typeStats.map(stat => ({
          type: stat.type,
          count: stat._count.type
        })),
        topColors: colorStats.map(stat => ({
          color: stat.color,
          count: stat._count.color
        })),
        seasonDistribution: seasonStats.map(stat => ({
          season: stat.season,
          count: stat._count.season
        }))
      }
    } catch (error) {
      console.error('Error getting wardrobe stats:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }
}

export default new WardrobeSearchService()
