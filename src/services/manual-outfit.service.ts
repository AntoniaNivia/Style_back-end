import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError'

const prisma = new PrismaClient()

export interface CreateManualOutfitData {
  userId: string
  name?: string
  selectedItems: string[]
  notes?: string
  tags?: string[]
  isPrivate?: boolean
  mannequinPreference?: 'Woman' | 'Man' | 'Neutral'
  mannequinImageUrl?: string
  previewId?: string
  generationMetadata?: string
}

export interface UpdateManualOutfitData {
  name?: string
  selectedItems?: string[]
  notes?: string
  tags?: string[]
  isPrivate?: boolean
  mannequinPreference?: 'Woman' | 'Man' | 'Neutral'
  mannequinImageUrl?: string
  previewId?: string
  generationMetadata?: string
}

export interface GetManualOutfitsFilters {
  userId: string
  page: number
  limit: number
  search?: string
  tags?: string[]
  isPrivate?: boolean
}

class ManualOutfitService {
  // Criar um novo look manual
  async createManualOutfit(data: CreateManualOutfitData) {
    try {
      // Verificar se todos os itens pertencem ao usuário
      const items = await prisma.clothingItem.findMany({
        where: {
          id: { in: data.selectedItems },
          userId: data.userId
        }
      })

      if (items.length !== data.selectedItems.length) {
        throw new AppError('Alguns itens não foram encontrados ou não pertencem ao usuário', 400)
      }

      // Criar o look manual
      const manualOutfit = await prisma.manualOutfit.create({
        data: {
          userId: data.userId,
          name: data.name,
          selectedItemsJson: JSON.stringify(data.selectedItems),
          notes: data.notes,
          tags: data.tags || [],
          isPrivate: data.isPrivate || false,
          mannequinPreference: data.mannequinPreference || 'Neutral',
          mannequinImageUrl: data.mannequinImageUrl,
          previewId: data.previewId,
          generationMetadata: data.generationMetadata
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      })

      // Buscar os itens completos para retornar
      const completeItems = await prisma.clothingItem.findMany({
        where: {
          id: { in: data.selectedItems }
        }
      })

      return {
        ...manualOutfit,
        selectedItems: completeItems,
        selectedItemsJson: undefined // Remove o JSON raw da resposta
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error creating manual outfit:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Listar looks manuais do usuário
  async getManualOutfits(filters: GetManualOutfitsFilters) {
    try {
      const { userId, page, limit, search, tags, isPrivate } = filters
      const skip = (page - 1) * limit

      // Construir filtros
      const where: any = {
        userId,
        ...(isPrivate !== undefined && { isPrivate }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(tags && tags.length > 0 && {
          tags: {
            hasSome: tags
          }
        })
      }

      // Buscar looks com paginação
      const [outfits, totalCount] = await Promise.all([
        prisma.manualOutfit.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.manualOutfit.count({ where })
      ])

      // Enriquecer os looks com os itens completos
      const enrichedOutfits = await Promise.all(
        outfits.map(async (outfit) => {
          const selectedItemIds = JSON.parse(outfit.selectedItemsJson)
          const selectedItems = await prisma.clothingItem.findMany({
            where: {
              id: { in: selectedItemIds }
            }
          })

          return {
            ...outfit,
            selectedItems,
            selectedItemsJson: undefined
          }
        })
      )

      return {
        outfits: enrichedOutfits,
        pagination: {
          page: page,
          limit: limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Error getting manual outfits:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Buscar um look manual específico
  async getManualOutfitById(id: string, userId: string) {
    try {
      const outfit = await prisma.manualOutfit.findFirst({
        where: {
          id,
          userId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      })

      if (!outfit) {
        throw new AppError('Look manual não encontrado', 404)
      }

      // Buscar os itens completos
      const selectedItemIds = JSON.parse(outfit.selectedItemsJson)
      const selectedItems = await prisma.clothingItem.findMany({
        where: {
          id: { in: selectedItemIds }
        }
      })

      return {
        ...outfit,
        selectedItems,
        selectedItemsJson: undefined
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error getting manual outfit by id:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Atualizar um look manual
  async updateManualOutfit(id: string, userId: string, data: UpdateManualOutfitData) {
    try {
      // Verificar se o look existe e pertence ao usuário
      const existingOutfit = await prisma.manualOutfit.findFirst({
        where: {
          id,
          userId
        }
      })

      if (!existingOutfit) {
        throw new AppError('Look manual não encontrado', 404)
      }

      // Se está atualizando os itens, verificar se pertencem ao usuário
      if (data.selectedItems) {
        const items = await prisma.clothingItem.findMany({
          where: {
            id: { in: data.selectedItems },
            userId
          }
        })

        if (items.length !== data.selectedItems.length) {
          throw new AppError('Alguns itens não foram encontrados ou não pertencem ao usuário', 400)
        }
      }

      // Atualizar o look
      const updatedOutfit = await prisma.manualOutfit.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.selectedItems && { selectedItemsJson: JSON.stringify(data.selectedItems) }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.tags && { tags: data.tags }),
          ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate })
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      })

      // Buscar os itens completos para retornar
      const selectedItemIds = JSON.parse(updatedOutfit.selectedItemsJson)
      const selectedItems = await prisma.clothingItem.findMany({
        where: {
          id: { in: selectedItemIds }
        }
      })

      return {
        ...updatedOutfit,
        selectedItems,
        selectedItemsJson: undefined
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error updating manual outfit:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Deletar um look manual
  async deleteManualOutfit(id: string, userId: string) {
    try {
      // Verificar se o look existe e pertence ao usuário
      const outfit = await prisma.manualOutfit.findFirst({
        where: {
          id,
          userId
        }
      })

      if (!outfit) {
        throw new AppError('Look manual não encontrado', 404)
      }

      // Deletar o look
      await prisma.manualOutfit.delete({
        where: { id }
      })

      return { message: 'Look manual deletado com sucesso' }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error deleting manual outfit:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Obter estatísticas dos looks manuais do usuário
  async getManualOutfitStats(userId: string) {
    try {
      const [totalOutfits, privateOutfits, publicOutfits, tagsUsage] = await Promise.all([
        prisma.manualOutfit.count({
          where: { userId }
        }),
        prisma.manualOutfit.count({
          where: { userId, isPrivate: true }
        }),
        prisma.manualOutfit.count({
          where: { userId, isPrivate: false }
        }),
        prisma.manualOutfit.findMany({
          where: { userId },
          select: { tags: true }
        })
      ])

      // Calcular uso de tags
      const tagCounts: Record<string, number> = {}
      tagsUsage.forEach(outfit => {
        outfit.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }))

      return {
        totalOutfits,
        privateOutfits,
        publicOutfits,
        topTags
      }
    } catch (error) {
      console.error('Error getting manual outfit stats:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Duplicar um look manual
  async duplicateManualOutfit(id: string, userId: string) {
    try {
      // Verificar se o look existe e pertence ao usuário
      const outfit = await prisma.manualOutfit.findFirst({
        where: {
          id,
          userId
        }
      })

      if (!outfit) {
        throw new AppError('Look manual não encontrado', 404)
      }

      // Buscar os itens completos para validação
      const selectedItemIds = JSON.parse(outfit.selectedItemsJson)
      const selectedItems = await prisma.clothingItem.findMany({
        where: {
          id: { in: selectedItemIds },
          userId
        }
      })

      // Preparar dados para duplicação
      const duplicateData = {
        name: outfit.name ? `Cópia - ${outfit.name}` : 'Cópia do Look',
        selectedItems: selectedItems.map(item => item.id),
        notes: outfit.notes || '',
        tags: outfit.tags,
        isPrivate: outfit.isPrivate,
        mannequinPreference: outfit.mannequinPreference || 'Neutral'
      }

      return {
        originalOutfitId: id,
        duplicateData
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error duplicating manual outfit:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }
}

export default new ManualOutfitService()
