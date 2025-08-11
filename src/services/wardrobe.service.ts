import { PrismaClient } from '@prisma/client';
import { supabaseService } from './supabase.service';
import { analyzeClothingFlow } from '../ai/flows/analyze-clothing.flow';
import { generateOutfit } from '../ai/flows/generate-outfit.flow';
import { NotFoundError, ValidationError } from '../utils/AppError';
import { AddClothingItemInput, GetWardrobeInput, AnalyzeClothingInput } from '../validations/wardrobe.validation';
import { GenerateOutfitInput } from '../validations/builder.validation';
import { runFlow } from '@genkit-ai/flow';

const prisma = new PrismaClient();

export class WardrobeService {
  async addClothingItem(userId: string, data: AddClothingItemInput) {
    try {
      // Convert data URI to buffer
      const { buffer, contentType } = supabaseService.dataUriToBuffer(data.photoDataUri);
      
      // Extract base64 from data URI for AI analysis
      const base64Match = data.photoDataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!base64Match) {
        throw new ValidationError('Formato de imagem inválido');
      }
      
      const imageBase64 = base64Match[2];
      const imageType = base64Match[1];

      // Analyze clothing with AI
      const analysis = await runFlow(analyzeClothingFlow, {
        imageBase64,
        imageType,
      });
      console.log('Resultado da análise IA (addClothingItem):', analysis);

      // Upload image to Supabase
      const photoUrl = await supabaseService.uploadImage(buffer, 'clothing', contentType);

      // Save to database
      const clothingItem = await prisma.clothingItem.create({
        data: {
          userId,
          photoUrl,
          type: analysis.type,
          color: analysis.color,
          season: analysis.season,
          occasion: analysis.occasion,
          tags: analysis.tags,
        },
      });

      return clothingItem;
    } catch (error) {
      console.error('Erro ao adicionar item ao guarda-roupa:', error);
      throw error;
    }
  }

  async getWardrobe(userId: string, filters: GetWardrobeInput) {
    const { page, limit, type, color, season, occasion } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (type) where.type = { contains: type, mode: 'insensitive' };
    if (color) where.color = { contains: color, mode: 'insensitive' };
    if (season) where.season = { contains: season, mode: 'insensitive' };
    if (occasion) where.occasion = { contains: occasion, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.clothingItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.clothingItem.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async deleteClothingItem(userId: string, itemId: string) {
    const item = await prisma.clothingItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundError('Item não encontrado');
    }

    // Delete from database
    await prisma.clothingItem.delete({
      where: { id: itemId },
    });

    // Delete image from Supabase (async, don't wait)
    supabaseService.deleteImage(item.photoUrl).catch(console.error);

    return { message: 'Item removido com sucesso' };
  }

  async generateOutfit(userId: string, preferences: GenerateOutfitInput) {
    // Get user's clothing items
    const clothingItems = await prisma.clothingItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (clothingItems.length === 0) {
      throw new ValidationError('Você precisa ter pelo menos uma peça no seu guarda-roupa para gerar um look');
    }

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mannequinPreference: true,
        style: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Prepare data for AI
    const userPreferences = {
      ...preferences,
      mannequinPreference: user.mannequinPreference,
      style: preferences.style || user.style,
    };

    // Generate outfit with AI
    const outfit = await generateOutfit(clothingItems, userPreferences);

    // Create mannequin image prompt
    const mannequinImageData = await this.generateMannequinImage(outfit.mannequinImagePrompt);

    // Save outfit to database
    const savedOutfit = await prisma.savedOutfit.create({
      data: {
        userId,
        imageUrl: mannequinImageData.imageUrl,
        reasoning: outfit.reasoning,
        itemsJson: JSON.stringify(outfit.selectedItems),
      },
    });

    return {
      ...outfit,
      outfitId: savedOutfit.id,
      mannequinImage: mannequinImageData.imageUrl,
    };
  }

  private async generateMannequinImage(prompt: string): Promise<{ imageUrl: string }> {
    // This is a placeholder for mannequin image generation
    // In a real implementation, you would integrate with an image generation service
    // like DALL-E, Midjourney, or Stable Diffusion
    
    try {
      // For now, return a placeholder image URL
      const placeholderImageUrl = `https://via.placeholder.com/400x600/f0f0f0/333333?text=${encodeURIComponent('Mannequin Look')}`;
      
      return {
        imageUrl: placeholderImageUrl,
      };
    } catch (error) {
      console.error('Erro ao gerar imagem do manequim:', error);
      return {
        imageUrl: 'https://via.placeholder.com/400x600/f0f0f0/333333?text=Look',
      };
    }
  }

  async getSavedOutfits(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [outfits, total] = await Promise.all([
      prisma.savedOutfit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.savedOutfit.count({ where: { userId } }),
    ]);

    return {
      outfits: outfits.map(outfit => ({
        ...outfit,
        items: JSON.parse(outfit.itemsJson),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async analyzeClothingOnly(data: AnalyzeClothingInput) {
    try {
      let imageBase64: string;
      let imageType: string;

      // Suporte para ambos os formatos (compatibilidade)
      if (data.photoDataUri) {
        // Formato antigo: extrair base64 do data URI
        const base64Match = data.photoDataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!base64Match) {
          throw new ValidationError('Formato de imagem inválido');
        }
        imageBase64 = base64Match[2];
        imageType = base64Match[1];
      } else if (data.imageBase64 && data.imageType) {
        // Formato novo: usar diretamente
        imageBase64 = data.imageBase64;
        imageType = data.imageType;
      } else {
        throw new ValidationError('Dados de imagem não fornecidos corretamente');
      }

      // Analyze clothing with AI (without saving)
      const analysis = await runFlow(analyzeClothingFlow, {
        imageBase64,
        imageType,
        name: data.name,
        description: data.description,
      });

      return analysis;
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      throw error;
    }
  }
}

export const wardrobeService = new WardrobeService();
