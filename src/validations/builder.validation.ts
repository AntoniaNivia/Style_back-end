import { z } from 'zod';

export const generateOutfitSchema = z.object({
  body: z.object({
    weather: z.string().min(1, 'Clima é obrigatório'),
    occasion: z.string().min(1, 'Ocasião é obrigatória'),
    style: z.string().min(1, 'Estilo é obrigatório'),
    mannequinPreference: z.enum(['Woman', 'Man', 'Neutral'], {
      errorMap: () => ({ message: 'Preferência de manequim deve ser Woman, Man ou Neutral' })
    }),
  }),
});

export type GenerateOutfitInput = z.infer<typeof generateOutfitSchema>['body'];
