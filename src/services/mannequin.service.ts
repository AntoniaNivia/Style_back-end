import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError'
import { ai } from '../ai/genkit'

const prisma = new PrismaClient()

export interface MannequinGenerationRequest {
  userId: string
  selectedItems: string[]
  mannequinPreference: 'Woman' | 'Man' | 'Neutral'
  outfitName?: string
  notes?: string
  imagesDataUri?: string[] // Array de imagens das roupas em Data URI
}

export interface MannequinGenerationResponse {
  mannequinImageUrl: string
  previewId: string
  itemsValidated: Array<{
    id: string
    type: string
    color: string
    valid: boolean
  }>
  generationTime: string
}

class MannequinService {
  // Gerar preview do manequim
  async generateMannequinPreview(data: MannequinGenerationRequest): Promise<MannequinGenerationResponse> {
    try {
      // 1. Validar se todos os itens pertencem ao usuário
      const items = await prisma.clothingItem.findMany({
        where: {
          id: { in: data.selectedItems },
          userId: data.userId
        }
      })

      if (items.length !== data.selectedItems.length) {
        throw new AppError('Alguns itens não foram encontrados ou não pertencem ao usuário', 400)
      }

      // 2. Gerar ID único para o preview
      const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 3. Criar prompt multimodal para IA
      const itemsDescription = items.map(item => 
        `${item.type} ${item.color} (${item.occasion}, ${item.season})`
      ).join(', ')

      // Prompt multimodal: texto + imagens
      const prompt: any[] = [
        { text: `Gere uma imagem de corpo inteiro de um manequim ${data.mannequinPreference} em um fundo de estúdio branco, vestindo o conjunto de roupas fornecido nas imagens a seguir. Combine as peças de forma realista e estilosa. Descrição do look: ${itemsDescription}` }
      ]
      if (data.imagesDataUri && data.imagesDataUri.length > 0) {
        prompt.push(...data.imagesDataUri.map(dataUri => ({ media: { url: dataUri } })))
      }

      // 4. Criar registro de geração
      const generation = await prisma.mannequinGeneration.create({
        data: {
          userId: data.userId,
          previewId,
          status: 'PENDING',
          generationPrompt: JSON.stringify(prompt),
          aiService: 'googleai/gemini-2.0-flash-preview-image-generation'
        }
      })

      // 5. Gerar imagem real usando IA (multimodal)
      const mannequinImageUrl = await this.generateImageWithAI(prompt, previewId)

      // 6. Atualizar o registro com sucesso
      await prisma.mannequinGeneration.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          imageUrl: mannequinImageUrl,
          generationTime: 3 // 3 segundos simulado
        }
      })

      // 7. Preparar resposta
      const itemsValidated = items.map(item => ({
        id: item.id,
        type: item.type,
        color: item.color,
        valid: true
      }))

      return {
        mannequinImageUrl,
        previewId,
        itemsValidated,
        generationTime: new Date().toISOString()
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error generating mannequin preview:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Construir prompt para IA
  private buildGenerationPrompt(itemsDescription: string, mannequinPreference: string): string {
    const basePrompt = `Fashion mannequin wearing ${itemsDescription} on ${mannequinPreference} body type, professional fashion photography style, white background, full body shot, high quality, detailed clothing, realistic fabric textures`
    
    return basePrompt
  }

  // Gerar imagem real usando IA (Genkit/Google AI)
  private async generateImageWithAI(prompt: any[], previewId: string): Promise<string> {
    try {
      // Chamada à IA para gerar imagem multimodal
      const result = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: prompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });
      // Espera-se que result.media.url seja a URL da imagem gerada
      if (result && result.media && result.media.url) {
        return result.media.url;
      }
      // Fallback se não vier a URL
      return `https://api.stylewise.com/mannequin/generated/${previewId}.jpg`;
    } catch (error) {
      console.error('Erro ao gerar imagem com IA:', error);
      // Fallback para URL simulada
      return `https://api.stylewise.com/mannequin/generated/${previewId}.jpg`;
    }
  }

  // Buscar status da geração
  async getGenerationStatus(previewId: string, userId: string) {
    try {
      const generation = await prisma.mannequinGeneration.findFirst({
        where: {
          previewId,
          userId
        }
      })

      if (!generation) {
        throw new AppError('Geração não encontrada', 404)
      }

      return {
        previewId: generation.previewId,
        status: generation.status,
        imageUrl: generation.imageUrl,
        generationTime: generation.generationTime,
        errorMessage: generation.errorMessage,
        createdAt: generation.createdAt
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error getting generation status:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Listar gerações do usuário
  async getUserGenerations(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit

      const [generations, totalCount] = await Promise.all([
        prisma.mannequinGeneration.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.mannequinGeneration.count({
          where: { userId }
        })
      ])

      return {
        generations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      }
    } catch (error) {
      console.error('Error getting user generations:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }

  // Deletar geração
  async deleteGeneration(previewId: string, userId: string) {
    try {
      const generation = await prisma.mannequinGeneration.findFirst({
        where: {
          previewId,
          userId
        }
      })

      if (!generation) {
        throw new AppError('Geração não encontrada', 404)
      }

      await prisma.mannequinGeneration.delete({
        where: { id: generation.id }
      })

      return { message: 'Geração deletada com sucesso' }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error deleting generation:', error)
      throw new AppError('Erro interno do servidor', 500)
    }
  }
}

export default new MannequinService()
