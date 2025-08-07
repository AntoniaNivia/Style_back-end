import { PrismaClient } from '@prisma/client';
import { runFlow } from '@genkit-ai/flow';
import { generateOutfit } from '@/ai/flows/generate-outfit.flow';
import { NotFoundError, ValidationError, AppError } from '@/utils/AppError';
import { GenerateOutfitInput } from '@/validations/builder.validation';

const prisma = new PrismaClient();

interface SelectedItem {
  id: string;
  type: string;
  reason: string;
}

interface OutfitResponse {
  selectedItems: SelectedItem[];
  reasoning: string;
  styleNotes: string;
  mannequinImagePrompt?: string;
  confidence: number;
  outfitId: string;
  mannequinImage?: string;
}

export class BuilderService {
  async generateOutfit(userId: string, preferences: GenerateOutfitInput): Promise<OutfitResponse> {
    try {
      // 1. Buscar guarda-roupa do usuário
      const wardrobeItems = await prisma.clothingItem.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          color: true,
          season: true,
          occasion: true,
          tags: true,
          photoUrl: true,
        },
      });

      if (wardrobeItems.length === 0) {
        throw new ValidationError('Adicione itens ao seu guarda-roupa primeiro para gerar looks!');
      }

      // 2. Filtrar itens relevantes baseados nas preferências
      const relevantItems = this.filterItemsByCriteria(wardrobeItems, preferences);

      if (relevantItems.length < 2) {
        throw new ValidationError('Você precisa de mais itens no guarda-roupa para gerar um look completo. Adicione pelo menos uma parte superior e inferior.');
      }

      // 3. Gerar look com IA
      const aiResponse = await this.generateWithAI(relevantItems, preferences);

      // 4. Validar resposta da IA
      const validatedResponse = this.validateAIResponse(aiResponse, wardrobeItems);

      // 5. Gerar prompt para imagem do manequim
      const mannequinImagePrompt = this.generateMannequinPrompt(validatedResponse.selectedItems, preferences);

      // 6. Salvar no banco de dados
      const savedOutfit = await prisma.generatedOutfit.create({
        data: {
          userId,
          selectedItemsJson: JSON.stringify(validatedResponse.selectedItems),
          reasoning: validatedResponse.reasoning,
          styleNotes: validatedResponse.styleNotes,
          confidence: validatedResponse.confidence,
          inputPreferencesJson: JSON.stringify(preferences),
          mannequinImageUrl: null, // TODO: Implementar geração de imagem
        },
      });

      return {
        selectedItems: validatedResponse.selectedItems,
        reasoning: validatedResponse.reasoning,
        styleNotes: validatedResponse.styleNotes,
        mannequinImagePrompt,
        confidence: validatedResponse.confidence,
        outfitId: savedOutfit.id,
        mannequinImage: this.getPlaceholderMannequinImage(preferences.mannequinPreference),
      };

    } catch (error) {
      console.error('Erro ao gerar look:', error);
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new AppError('Erro interno ao gerar look', 500);
    }
  }

  private filterItemsByCriteria(items: any[], preferences: GenerateOutfitInput) {
    return items.filter(item => {
      // Filtro por ocasião
      const occasionMatch = !item.occasion || 
        item.occasion.toLowerCase().includes(preferences.occasion.toLowerCase()) ||
        this.isOccasionCompatible(item.occasion, preferences.occasion);

      // Filtro por clima/estação
      const weatherMatch = !item.season || 
        this.isWeatherCompatible(item.season, preferences.weather);

      return occasionMatch && weatherMatch;
    });
  }

  private isOccasionCompatible(itemOccasion: string, requestedOccasion: string): boolean {
    const casualOccasions = ['casual', 'passeio', 'fim de semana', 'relaxar'];
    const formalOccasions = ['trabalho', 'reunião', 'formal', 'escritório', 'profissional'];
    const socialOccasions = ['festa', 'jantar', 'encontro', 'social', 'evento'];

    const itemLower = itemOccasion.toLowerCase();
    const requestedLower = requestedOccasion.toLowerCase();

    // Se algum dos casualOccasions está presente
    if (casualOccasions.some(occ => itemLower.includes(occ) || requestedLower.includes(occ))) {
      return casualOccasions.some(occ => itemLower.includes(occ) || requestedLower.includes(occ));
    }

    // Se algum dos formalOccasions está presente
    if (formalOccasions.some(occ => itemLower.includes(occ) || requestedLower.includes(occ))) {
      return formalOccasions.some(occ => itemLower.includes(occ) || requestedLower.includes(occ));
    }

    // Se algum dos socialOccasions está presente
    if (socialOccasions.some(occ => itemLower.includes(occ) || requestedLower.includes(occ))) {
      return socialOccasions.some(occ => itemLower.includes(occ) || requestedLower.includes(occ));
    }

    return true; // Default para compatível se não há match específico
  }

  private isWeatherCompatible(itemSeason: string, weather: string): boolean {
    const weatherLower = weather.toLowerCase();
    const seasonLower = itemSeason.toLowerCase();

    // Mapeamento clima -> estação
    const weatherSeasonMap: { [key: string]: string[] } = {
      'ensolarado': ['verão', 'primavera'],
      'quente': ['verão'],
      'frio': ['inverno', 'outono'],
      'chuvoso': ['outono', 'inverno'],
      'vento': ['outono', 'inverno'],
      'neve': ['inverno'],
    };

    for (const [weatherType, compatibleSeasons] of Object.entries(weatherSeasonMap)) {
      if (weatherLower.includes(weatherType)) {
        return compatibleSeasons.some(season => seasonLower.includes(season));
      }
    }

    return true; // Default para compatível
  }

  private async generateWithAI(items: any[], preferences: GenerateOutfitInput) {
    try {
      // Usar a função diretamente
      const response = await generateOutfit(items, {
        occasion: preferences.occasion,
        weather: preferences.weather,
        style: preferences.style,
        mannequinPreference: preferences.mannequinPreference,
      });

      return response;
    } catch (error) {
      console.warn('IA não disponível, usando algoritmo fallback:', error);
      return this.generateWithFallbackAlgorithm(items, preferences);
    }
  }

  private generateWithFallbackAlgorithm(items: any[], preferences: GenerateOutfitInput) {
    // Algoritmo simples de combinação
    const selectedItems: SelectedItem[] = [];
    
    // Buscar uma parte superior
    const tops = items.filter(item => 
      ['blusa', 'camiseta', 'camisa', 'top', 'regata'].some(type => 
        item.type.toLowerCase().includes(type)
      )
    );
    
    if (tops.length > 0) {
      const randomTop = tops[Math.floor(Math.random() * tops.length)];
      selectedItems.push({
        id: randomTop.id,
        type: randomTop.type,
        reason: `${randomTop.type} ${randomTop.color} combina perfeitamente com a ocasião ${preferences.occasion}`,
      });
    }

    // Buscar uma parte inferior
    const bottoms = items.filter(item => 
      ['calça', 'saia', 'shorts', 'bermuda'].some(type => 
        item.type.toLowerCase().includes(type)
      )
    );
    
    if (bottoms.length > 0) {
      const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
      selectedItems.push({
        id: randomBottom.id,
        type: randomBottom.type,
        reason: `${randomBottom.type} ${randomBottom.color} oferece o conforto ideal para ${preferences.weather}`,
      });
    }

    // Buscar calçado
    const shoes = items.filter(item => 
      ['sapato', 'tênis', 'sandália', 'bota'].some(type => 
        item.type.toLowerCase().includes(type)
      )
    );
    
    if (shoes.length > 0) {
      const randomShoe = shoes[Math.floor(Math.random() * shoes.length)];
      selectedItems.push({
        id: randomShoe.id,
        type: randomShoe.type,
        reason: `${randomShoe.type} completa o visual ${preferences.style}`,
      });
    }

    return {
      selectedItems,
      reasoning: `Look ${preferences.style} perfeito para ${preferences.occasion} em dia ${preferences.weather}. As peças foram selecionadas para criar harmonia e conforto.`,
      styleNotes: `Para um toque especial, considere acessórios que complementem as cores escolhidas. Este look pode ser facilmente adaptado para outras ocasiões.`,
      confidence: 0.75,
    };
  }

  private validateAIResponse(response: any, wardrobeItems: any[]) {
    // Verificar se os itens selecionados existem no guarda-roupa
    const validItems = response.selectedItems.filter((item: SelectedItem) => 
      wardrobeItems.some(wardrobeItem => wardrobeItem.id === item.id)
    );

    if (validItems.length === 0) {
      throw new ValidationError('Nenhum item válido foi selecionado pela IA');
    }

    return {
      ...response,
      selectedItems: validItems,
    };
  }

  private generateMannequinPrompt(selectedItems: SelectedItem[], preferences: GenerateOutfitInput): string {
    const itemDescriptions = selectedItems.map(item => `${item.type}`).join(', ');
    
    return `Professional photo of a ${preferences.mannequinPreference.toLowerCase()} mannequin wearing: ${itemDescriptions}. Style: ${preferences.style}, studio lighting, clean background, fashion photography`;
  }

  private getPlaceholderMannequinImage(mannequinType: string): string {
    // Por enquanto, retorna uma URL placeholder
    return `https://via.placeholder.com/400x600/f0f0f0/333333?text=${mannequinType}+Mannequin`;
  }

  async getGeneratedOutfits(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [outfits, total] = await Promise.all([
      prisma.generatedOutfit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.generatedOutfit.count({ where: { userId } }),
    ]);

    const formattedOutfits = outfits.map(outfit => ({
      id: outfit.id,
      selectedItems: JSON.parse(outfit.selectedItemsJson),
      reasoning: outfit.reasoning,
      styleNotes: outfit.styleNotes,
      confidence: outfit.confidence,
      inputPreferences: JSON.parse(outfit.inputPreferencesJson),
      mannequinImage: outfit.mannequinImageUrl || this.getPlaceholderMannequinImage('Neutral'),
      createdAt: outfit.createdAt,
    }));

    return {
      outfits: formattedOutfits,
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

  async getOutfitById(outfitId: string, userId: string) {
    const outfit = await prisma.generatedOutfit.findFirst({
      where: { 
        id: outfitId,
        userId, // Verificar se pertence ao usuário
      },
    });

    if (!outfit) {
      throw new NotFoundError('Look não encontrado');
    }

    // Buscar detalhes dos itens selecionados
    const selectedItems = JSON.parse(outfit.selectedItemsJson);
    const itemIds = selectedItems.map((item: SelectedItem) => item.id);

    const itemDetails = await prisma.clothingItem.findMany({
      where: { 
        id: { in: itemIds },
        userId, // Verificar segurança
      },
      select: {
        id: true,
        type: true,
        color: true,
        photoUrl: true,
        tags: true,
      },
    });

    // Enriquecer selectedItems com detalhes
    const enrichedItems = selectedItems.map((item: SelectedItem) => {
      const details = itemDetails.find(detail => detail.id === item.id);
      return {
        ...item,
        ...details,
      };
    });

    return {
      id: outfit.id,
      selectedItems: enrichedItems,
      reasoning: outfit.reasoning,
      styleNotes: outfit.styleNotes,
      confidence: outfit.confidence,
      inputPreferences: JSON.parse(outfit.inputPreferencesJson),
      mannequinImage: outfit.mannequinImageUrl || this.getPlaceholderMannequinImage('Neutral'),
      createdAt: outfit.createdAt,
    };
  }
}

export const builderService = new BuilderService();
