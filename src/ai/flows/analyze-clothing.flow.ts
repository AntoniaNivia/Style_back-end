import { defineFlow, runFlow } from '@genkit-ai/flow';
import { generate } from '@genkit-ai/ai';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

export const analyzeClothingInputSchema = z.object({
  imageBase64: z.string(),
  imageType: z.string(),
});

export const analyzeClothingOutputSchema = z.object({
  type: z.string(),
  color: z.string(),
  season: z.string(),
  occasion: z.string(),
  tags: z.array(z.string()),
  confidence: z.number(),
});

export const analyzeClothingFlow = defineFlow(
  {
    name: 'analyzeClothing',
    inputSchema: analyzeClothingInputSchema,
    outputSchema: analyzeClothingOutputSchema,
  },
  async (input) => {
    const prompt = `
Analise esta imagem de roupa e extraia as seguintes informações em formato JSON:

1. type: Tipo da peça (ex: "camiseta", "calça", "vestido", "sapato", "acessório", etc.)
2. color: Cor predominante (ex: "azul", "vermelho", "preto", "branco", etc.)
3. season: Estação mais adequada (ex: "verão", "inverno", "meia-estação", "todas")
4. occasion: Ocasião de uso (ex: "casual", "formal", "esporte", "festa", "trabalho")
5. tags: Array de tags descritivas (ex: ["confortável", "elegante", "esportivo"])
6. confidence: Nível de confiança da análise (0-1)

Seja específico e use termos em português. Retorne apenas o JSON sem texto adicional.

Exemplo de resposta:
{
  "type": "camiseta",
  "color": "azul",
  "season": "verão",
  "occasion": "casual",
  "tags": ["confortável", "básica", "algodão"],
  "confidence": 0.95
}
`;

    const response = await generate({
      model: googleAI('gemini-1.5-flash'),
      prompt: {
        text: prompt,
        media: {
          url: `data:${input.imageType};base64,${input.imageBase64}`,
        },
      },
      config: {
        temperature: 0.1,
        maxOutputTokens: 500,
      },
    });

    try {
      const analysisText = response.text();
      const cleanJson = analysisText.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanJson);

      // Validate and sanitize the response
      return {
        type: analysis.type || 'indefinido',
        color: analysis.color || 'indefinido',
        season: analysis.season || 'todas',
        occasion: analysis.occasion || 'casual',
        tags: Array.isArray(analysis.tags) ? analysis.tags : [],
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
      };
    } catch (error) {
      console.error('Erro ao analisar resposta da IA:', error);
      
      // Return default values if parsing fails
      return {
        type: 'indefinido',
        color: 'indefinido',
        season: 'todas',
        occasion: 'casual',
        tags: [],
        confidence: 0.1,
      };
    }
  }
);

export const analyzeClothing = async (imageBase64: string, imageType: string) => {
  return await runFlow(analyzeClothingFlow, { imageBase64, imageType });
};
