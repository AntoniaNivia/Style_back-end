import { z } from 'zod';

// Validação para atualização de perfil
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
    bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
    location: z.string().max(100, 'Localização deve ter no máximo 100 caracteres').optional(),
    style: z.string().optional(),
  }),
});

// Validação para upload de avatar
export const uploadAvatarSchema = z.object({
  body: z.object({
    imageDataUri: z.string().min(1, 'Imagem é obrigatória').refine(
      (value) => value.startsWith('data:image/'),
      'Formato de imagem inválido'
    ),
  }),
});

// Validação para criação de outfit
export const createOutfitSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Título é obrigatório').max(100, 'Título deve ter no máximo 100 caracteres'),
    itemIds: z.array(z.string()).min(1, 'Pelo menos uma peça deve ser selecionada').max(20, 'Máximo 20 peças por outfit'),
    tags: z.array(z.string()).max(10, 'Máximo 10 tags por outfit').default([]),
    imageDataUri: z.string().optional(),
  }),
});

// Validação para paginação de outfits
export const getOutfitsSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(50)).default('12'),
  }),
});

// Validação para like/favorite
export const likeOrFavoriteSchema = z.object({
  body: z.object({
    targetId: z.string().min(1, 'ID do target é obrigatório'),
    targetType: z.enum(['OUTFIT', 'POST'], {
      errorMap: () => ({ message: 'Tipo deve ser OUTFIT ou POST' }),
    }),
  }),
});

// Validação para paginação de favoritos
export const getFavoritesSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(50)).default('12'),
  }),
});

// Types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>['body'];
export type CreateOutfitInput = z.infer<typeof createOutfitSchema>['body'];
export type GetOutfitsInput = z.infer<typeof getOutfitsSchema>['query'];
export type LikeOrFavoriteInput = z.infer<typeof likeOrFavoriteSchema>['body'];
export type GetFavoritesInput = z.infer<typeof getFavoritesSchema>['query'];
