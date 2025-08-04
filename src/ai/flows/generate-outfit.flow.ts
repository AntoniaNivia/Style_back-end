import { defineFlow, runFlow } from '@genkit-ai/flow';
import { generate } from '@genkit-ai/ai';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

export const generateOutfitInputSchema = z.object({
  clothingItems: z.array(z.object({
    id: z.string(),
    type: z.string(),
    color: z.string(),
    season: z.string(),
    occasion: z.string(),
    tags: z.array(z.string()),
    photoUrl: z.string(),
  })),
  userPreferences: z.object({
    occasion: z.string(),
    weather: z.string().optional(),
    season: z.string().optional(),
    style: z.string().optional(),
    colors: z.array(z.string()).optional(),
    excludeItems: z.array(z.string()).optional(),
    mannequinPreference: z.enum(['Woman', 'Man', 'Neutral']),
  }),
});

export const generateOutfitOutputSchema = z.object({
  selectedItems: z.array(z.object({
    id: z.string(),
    type: z.string(),
    reason: z.string(),
  })),
  reasoning: z.string(),
  styleNotes: z.string(),
  mannequinImagePrompt: z.string(),
  confidence: z.number(),
});

export const generateOutfitFlow = defineFlow(
  {
    name: 'generateOutfit',
    inputSchema: generateOutfitInputSchema,
    outputSchema: generateOutfitOutputSchema,
  },
  async (input) => {
    const { clothingItems, userPreferences } = input;

    // Filter items based on preferences
    let filteredItems = clothingItems.filter(item => {
      // Exclude specifically requested items
      if (userPreferences.excludeItems?.includes(item.id)) {
        return false;
      }

      // Filter by season if specified
      if (userPreferences.season && item.season !== 'todas' && item.season !== userPreferences.season) {
        return false;
      }

      // Filter by occasion
      if (item.occasion !== 'todas' && item.occasion !== userPreferences.occasion) {
        return false;
      }

      return true;
    });

    const prompt = `
Você é um estilista virtual especializado em criar looks harmoniosos. Com base no guarda-roupa e preferências do usuário, crie um outfit completo.

GUARDA-ROUPA DISPONÍVEL:
${filteredItems.map(item => `
- ID: ${item.id}
- Tipo: ${item.type}
- Cor: ${item.color}
- Estação: ${item.season}
- Ocasião: ${item.occasion}
- Tags: ${item.tags.join(', ')}
`).join('')}

PREFERÊNCIAS DO USUÁRIO:
- Ocasião: ${userPreferences.occasion}
- Clima: ${userPreferences.weather || 'não especificado'}
- Estação: ${userPreferences.season || 'não especificado'}
- Estilo preferido: ${userPreferences.style || 'não especificado'}
- Cores preferidas: ${userPreferences.colors?.join(', ') || 'não especificado'}
- Preferência de manequim: ${userPreferences.mannequinPreference}

INSTRUÇÕES:
1. Selecione 3-6 peças que formem um look completo e harmonioso
2. Priorize peças que combinem bem em cores e estilos
3. Considere a ocasião e o clima
4. Explique o raciocínio por trás de cada escolha
5. Forneça dicas de estilo
6. Crie uma descrição detalhada para gerar uma imagem de manequim com o look

Retorne apenas JSON no seguinte formato:
{
  "selectedItems": [
    {
      "id": "id_da_peça",
      "type": "tipo_da_peça",
      "reason": "motivo_da_escolha"
    }
  ],
  "reasoning": "explicação_geral_do_look",
  "styleNotes": "dicas_de_como_usar",
  "mannequinImagePrompt": "descrição_detalhada_para_gerar_imagem_do_manequim_${userPreferences.mannequinPreference.toLowerCase()}",
  "confidence": 0.95
}
`;

    const response = await generate({
      model: googleAI('gemini-1.5-flash'),
      prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    try {
      const outfitText = response.text();
      const cleanJson = outfitText.replace(/```json|```/g, '').trim();
      const outfit = JSON.parse(cleanJson);

      // Validate selected items exist in available items
      const validSelectedItems = outfit.selectedItems?.filter((selected: any) =>
        filteredItems.some(item => item.id === selected.id)
      ) || [];

      return {
        selectedItems: validSelectedItems,
        reasoning: outfit.reasoning || 'Look criado com base nas peças disponíveis.',
        styleNotes: outfit.styleNotes || 'Combine as peças com confiança!',
        mannequinImagePrompt: outfit.mannequinImagePrompt || `${userPreferences.mannequinPreference} wearing the selected outfit`,
        confidence: typeof outfit.confidence === 'number' ? outfit.confidence : 0.7,
      };
    } catch (error) {
      console.error('Erro ao analisar resposta da IA:', error);

      // Return a basic outfit if parsing fails
      const basicOutfit = filteredItems.slice(0, 3);
      return {
        selectedItems: basicOutfit.map(item => ({
          id: item.id,
          type: item.type,
          reason: 'Selecionado automaticamente',
        })),
        reasoning: 'Look criado automaticamente com as peças disponíveis.',
        styleNotes: 'Combine as peças de forma criativa!',
        mannequinImagePrompt: `${userPreferences.mannequinPreference} wearing a stylish outfit`,
        confidence: 0.5,
      };
    }
  }
);

export const generateOutfit = async (clothingItems: any[], userPreferences: any) => {
  return await runFlow(generateOutfitFlow, { clothingItems, userPreferences });
};
