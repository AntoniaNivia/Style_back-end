import { z } from 'zod';

export const generateOutfitSchema = z.object({
  body: z.object({
    occasion: z.string().min(1, 'Ocasião é obrigatória'),
    weather: z.string().optional(),
    season: z.string().optional(),
    style: z.string().optional(),
    colors: z.array(z.string()).optional(),
    excludeItems: z.array(z.string()).optional(),
  }),
});

export type GenerateOutfitInput = z.infer<typeof generateOutfitSchema>['body'];
