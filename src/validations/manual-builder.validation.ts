import { z } from 'zod'

// Validation para geração de preview do manequim
export const generateMannequinPreviewSchema = z.object({
  body: z.object({
    selectedItems: z.array(z.string().cuid()).min(1, 'Pelo menos um item deve ser selecionado').max(50, 'Máximo 50 itens por look'),
    mannequinPreference: z.enum(['Woman', 'Man', 'Neutral']),
    outfitName: z.string().min(1).max(100).optional(),
    notes: z.string().max(500).optional()
  })
})

// Validation para busca avançada no guarda-roupa
export const wardrobeSearchSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    type: z.string().optional(),
    color: z.string().optional(),
    season: z.string().optional(),
    occasion: z.string().optional(),
    brand: z.string().optional(),
    tags: z.string().optional().transform(val => val ? val.split(',') : undefined),
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
    sortBy: z.enum(['date', 'type', 'color', 'recent']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
})

// Validation para validação de itens
export const validateItemsSchema = z.object({
  body: z.object({
    itemIds: z.array(z.string().cuid()).min(1, 'Pelo menos um item deve ser fornecido').max(50, 'Máximo 50 itens por validação')
  })
})

// Validation para duplicação de looks
export const duplicateOutfitSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
})

// Validation para status de geração de manequim
export const getGenerationStatusSchema = z.object({
  params: z.object({
    previewId: z.string().min(1)
  })
})

// Validation para listagem de gerações
export const getUserGenerationsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20')
  })
})

// Validation para deleção de geração
export const deleteGenerationSchema = z.object({
  params: z.object({
    previewId: z.string().min(1)
  })
})

// Validation para recomendações
export const getRecommendationsSchema = z.object({
  body: z.object({
    selectedItemIds: z.array(z.string().cuid()).max(20, 'Máximo 20 itens para recomendações')
  })
})

// Validation para manual outfit atualizado
export const createManualOutfitEnhancedSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    selectedItems: z.array(z.string().cuid()).min(1, 'Pelo menos um item deve ser selecionado').max(50, 'Máximo 50 itens por look'),
    notes: z.string().max(500).optional(),
    tags: z.array(z.string().max(30)).max(10, 'Máximo 10 tags por look').default([]),
    isPrivate: z.boolean().default(false),
    mannequinPreference: z.enum(['Woman', 'Man', 'Neutral']).default('Neutral'),
    mannequinImageUrl: z.string().url().optional(),
    previewId: z.string().min(1).optional(),
    generationMetadata: z.string().optional()
  })
})

export type GenerateMannequinPreviewRequest = z.infer<typeof generateMannequinPreviewSchema>
export type WardrobeSearchRequest = z.infer<typeof wardrobeSearchSchema>
export type ValidateItemsRequest = z.infer<typeof validateItemsSchema>
export type DuplicateOutfitRequest = z.infer<typeof duplicateOutfitSchema>
export type GetGenerationStatusRequest = z.infer<typeof getGenerationStatusSchema>
export type GetUserGenerationsRequest = z.infer<typeof getUserGenerationsSchema>
export type DeleteGenerationRequest = z.infer<typeof deleteGenerationSchema>
export type GetRecommendationsRequest = z.infer<typeof getRecommendationsSchema>
export type CreateManualOutfitEnhancedRequest = z.infer<typeof createManualOutfitEnhancedSchema>
