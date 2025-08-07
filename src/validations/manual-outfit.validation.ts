import { z } from 'zod'

// Validation schema para criação de look manual
export const createManualOutfitSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    selectedItems: z.array(z.string().cuid()).min(1, 'Pelo menos um item deve ser selecionado').optional(),
    itemIds: z.array(z.string().cuid()).min(1, 'Pelo menos um item deve ser selecionado').optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).default([]),
    isPrivate: z.boolean().default(false)
  }).refine(data => data.selectedItems || data.itemIds, {
    message: 'selectedItems ou itemIds deve ser fornecido'
  })
})

// Validation schema para atualização de look manual
export const updateManualOutfitSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    selectedItems: z.array(z.string().cuid()).min(1, 'Pelo menos um item deve ser selecionado').optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPrivate: z.boolean().optional()
  }),
  params: z.object({
    id: z.string().cuid()
  })
})

// Validation schema para listagem de looks manuais
export const getManualOutfitsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
    search: z.string().optional(),
    tags: z.string().optional().transform(val => val ? val.split(',') : undefined),
    isPrivate: z.enum(['true', 'false']).optional().transform(val => val === 'true')
  })
})

// Validation schema para deleção de look manual
export const deleteManualOutfitSchema = z.object({
  params: z.object({
    id: z.string().cuid()
  })
})

export type CreateManualOutfitRequest = z.infer<typeof createManualOutfitSchema>
export type UpdateManualOutfitRequest = z.infer<typeof updateManualOutfitSchema>
export type GetManualOutfitsRequest = z.infer<typeof getManualOutfitsSchema>
export type DeleteManualOutfitRequest = z.infer<typeof deleteManualOutfitSchema>
