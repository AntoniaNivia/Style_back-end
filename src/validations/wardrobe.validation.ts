import { z } from 'zod';

export const addClothingItemSchema = z.object({
  body: z.object({
    photoDataUri: z.string().min(1, 'Imagem é obrigatória'),
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

export type AddClothingItemInput = z.infer<typeof addClothingItemSchema>['body'];
export type GetWardrobeInput = z.infer<typeof getWardrobeSchema>['query'];
