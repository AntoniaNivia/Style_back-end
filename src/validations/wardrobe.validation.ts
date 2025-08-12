import { z } from 'zod';

export const addClothingItemSchema = z.object({
  body: z.object({
    photoDataUri: z.string().min(1, 'Imagem é obrigatória'),
    type: z.string().optional(),
    color: z.string().optional(),
    season: z.string().optional(),
    occasion: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const getWardrobeSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).default('20'),
    type: z.string().optional(),
    color: z.string().optional(),
    season: z.string().optional(),
    occasion: z.string().optional(),
  }),
});

export const analyzeClothingSchema = z.object({
  body: z.object({
    // Suporte para o novo formato
    imageBase64: z.string().optional(),
    imageType: z.string().optional(),
    // Suporte para o formato antigo (compatibilidade)
    photoDataUri: z.string().optional(),
    // Campos opcionais
    name: z.string().optional(),
    description: z.string().optional(),
  }).refine(
    (data) => data.photoDataUri || (data.imageBase64 && data.imageType),
    {
      message: "É necessário fornecer 'photoDataUri' ou 'imageBase64' + 'imageType'",
    }
  ),
});

export type AddClothingItemInput = z.infer<typeof addClothingItemSchema>['body'];
export type AnalyzeClothingInput = z.infer<typeof analyzeClothingSchema>['body'];
export type GetWardrobeInput = z.infer<typeof getWardrobeSchema>['query'];
