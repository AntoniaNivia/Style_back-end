import { defineFlow, runFlow } from '@genkit-ai/flow';
import { generate } from '@genkit-ai/ai';
import { gemini15Pro } from '@genkit-ai/googleai';
import { z } from 'zod';

export const analyzeClothingInputSchema = z.object({
  imageBase64: z.string(),
  imageType: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const analyzeClothingOutputSchema = z.object({
  type: z.string(),
  color: z.string(),
  season: z.string(),
  occasion: z.string(),
  tags: z.array(z.string()),
  confidence: z.number(),
  reasoning: z.string(),
  qualityScore: z.number(),
  retryCount: z.number().optional(),
});

export const analyzeClothingFlow = defineFlow(
  {
    name: 'analyzeClothing',
    inputSchema: analyzeClothingInputSchema,
    outputSchema: analyzeClothingOutputSchema,
  },
  async (input) => {
    // 1. Validação de qualidade da imagem
    const qualityScore = validateImageQuality(input.imageBase64);
    
    if (qualityScore < 0.3) {
      return {
        type: 'indefinido',
        color: 'indefinido',
        season: 'todas',
        occasion: 'casual',
        tags: ['qualidade_baixa'],
        confidence: 0.1,
        reasoning: 'Imagem de baixa qualidade ou muito pequena para análise precisa.',
        qualityScore,
        retryCount: 0,
      };
    }

    // 2. Prompt melhorado e mais específico
    const contextInfo = input.name || input.description ? 
      `\nInformações adicionais fornecidas pelo usuário:
       ${input.name ? `Nome/Tipo esperado: ${input.name}` : ''}
       ${input.description ? `Descrição: ${input.description}` : ''}` : '';

    const improvedPrompt = `
ANÁLISE PRECISA DE ROUPAS - INSTRUÇÕES DETALHADAS:

Você é um especialista em moda e análise de vestuário. Analise esta imagem de roupa com MÁXIMA PRECISÃO.

OBSERVAÇÕES CRÍTICAS:
1. Observe CUIDADOSAMENTE a forma, silhueta e corte da peça
2. Analise as CORES reais visíveis, não suponha cores
3. Considere o contexto e proporções da peça
4. Diferencie claramente entre tipos de roupas (calça ≠ vestido, saia ≠ short)

TIPOS VÁLIDOS (seja preciso):
- Roupas superiores: camiseta, camisa, blusa, regata, cropped, casaco, jaqueta, suéter
- Roupas inferiores: calça, short, saia, bermuda, legging
- Vestidos: vestido (peça única que cobre torso e pernas)
- Calçados: tênis, sapato, sandália, bota, chinelo
- Acessórios: bolsa, chapéu, óculos, cinto, relógio, joia

CORES (seja específico):
- Cores básicas: preto, branco, cinza, bege, marrom
- Cores vibrantes: vermelho, azul, verde, amarelo, rosa, roxo, laranja
- Tons específicos: azul-marinho, verde-oliva, rosa-claro, etc.
- Padrões: listrado, xadrez, floral, poá, estampado

ESTAÇÕES:
- verão: tecidos leves, cores claras, peças frescas
- inverno: tecidos pesados, cores escuras, peças quentes  
- meia-estação: peças versáteis para primavera/outono
- todas: peças básicas e atemporais

OCASIÕES:
- casual: uso diário, conforto
- formal: trabalho, eventos sérios
- esporte: atividades físicas
- festa: eventos sociais, celebrações
- praia: roupas de banho, verão

${contextInfo}

FORMATO DE RESPOSTA (JSON obrigatório):
{
  "type": "tipo_exato_da_peça",
  "color": "cor_predominante_real",
  "season": "estação_adequada",
  "occasion": "ocasião_principal",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95,
  "reasoning": "Explicação detalhada da análise realizada"
}

ANALISE A IMAGEM AGORA COM MÁXIMA ATENÇÃO AOS DETALHES:`;

    let bestResult = null;
    let retryCount = 0;
    const maxRetries = 3;

    // 3. Implementação de retry logic
    while (retryCount < maxRetries) {
      try {
        const response = await generate({
          model: gemini15Pro,
          prompt: [
            { text: improvedPrompt },
            { 
              media: { 
                url: `data:${input.imageType};base64,${input.imageBase64}` 
              } 
            }
          ],
          config: {
            temperature: retryCount === 0 ? 0.1 : 0.2, // Aumenta criatividade em retries
            maxOutputTokens: 800,
            topP: 0.8,
            topK: 40,
          },
        });

        const analysisText = response.text();
        const cleanJson = analysisText.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleanJson);

        // 4. Validação e sanitização da resposta
        const validatedResult = {
          type: validateClothingType(analysis.type) || 'indefinido',
          color: validateColor(analysis.color) || 'indefinido', 
          season: validateSeason(analysis.season) || 'todas',
          occasion: validateOccasion(analysis.occasion) || 'casual',
          tags: validateTags(analysis.tags) || [],
          confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
          reasoning: analysis.reasoning || 'Análise realizada automaticamente.',
          qualityScore,
          retryCount,
        };

        // Se a confiança é alta, aceita o resultado
        if (validatedResult.confidence >= 0.7) {
          return validatedResult;
        }

        // Guarda o melhor resultado até agora
        if (!bestResult || validatedResult.confidence > bestResult.confidence) {
          bestResult = validatedResult;
        }

        retryCount++;

      } catch (error) {
        console.error(`Erro na tentativa ${retryCount + 1} de análise:`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          break;
        }
      }
    }

    // Retorna o melhor resultado ou fallback
    return bestResult || {
      type: 'indefinido',
      color: 'indefinido', 
      season: 'todas',
      occasion: 'casual',
      tags: ['análise_incompleta'],
      confidence: 0.2,
      reasoning: 'Não foi possível analisar a imagem com precisão após múltiplas tentativas.',
      qualityScore,
      retryCount,
    };
  }
);

// Funções auxiliares de validação
function validateImageQuality(base64: string): number {
  try {
    const sizeBytes = (base64.length * 3) / 4;
    const sizeKB = sizeBytes / 1024;
    
    // Score baseado no tamanho da imagem
    if (sizeKB < 5) return 0.1;      // Muito pequena
    if (sizeKB < 20) return 0.4;     // Pequena  
    if (sizeKB < 100) return 0.7;    // Adequada
    if (sizeKB < 500) return 0.9;    // Boa
    return 1.0;                      // Excelente
  } catch {
    return 0.3;
  }
}

function validateClothingType(type: string): string | null {
  const validTypes = [
    'camiseta', 'camisa', 'blusa', 'regata', 'cropped', 'casaco', 'jaqueta', 'suéter',
    'calça', 'short', 'saia', 'bermuda', 'legging', 'vestido',
    'tênis', 'sapato', 'sandália', 'bota', 'chinelo',
    'bolsa', 'chapéu', 'óculos', 'cinto', 'relógio', 'joia'
  ];
  
  return validTypes.find(valid => 
    type?.toLowerCase().includes(valid) || valid.includes(type?.toLowerCase())
  ) || null;
}

function validateColor(color: string): string | null {
  const validColors = [
    'preto', 'branco', 'cinza', 'bege', 'marrom',
    'vermelho', 'azul', 'verde', 'amarelo', 'rosa', 'roxo', 'laranja',
    'azul-marinho', 'verde-oliva', 'rosa-claro', 'cinza-escuro',
    'listrado', 'xadrez', 'floral', 'poá', 'estampado'
  ];
  
  return validColors.find(valid => 
    color?.toLowerCase().includes(valid) || valid.includes(color?.toLowerCase())
  ) || null;
}

function validateSeason(season: string): string | null {
  const validSeasons = ['verão', 'inverno', 'meia-estação', 'todas'];
  return validSeasons.includes(season?.toLowerCase()) ? season.toLowerCase() : null;
}

function validateOccasion(occasion: string): string | null {
  const validOccasions = ['casual', 'formal', 'esporte', 'festa', 'praia'];
  return validOccasions.includes(occasion?.toLowerCase()) ? occasion.toLowerCase() : null;
}

function validateTags(tags: any): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter(tag => typeof tag === 'string' && tag.length > 0).slice(0, 5);
}

export const analyzeClothing = async (imageBase64: string, imageType: string) => {
  return await runFlow(analyzeClothingFlow, { imageBase64, imageType });
};
