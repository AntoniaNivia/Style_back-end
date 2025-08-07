import { z } from 'zod';

export const createFeedPostSchema = z.object({
  body: z.object({
    imageDataUri: z.string().min(1, 'Imagem é obrigatória'),
    caption: z.string().min(1, 'Legenda é obrigatória'),
  }),
});

export const getFeedSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(50)).default('20'),
  }),
});

// Validação para posts salvos
export const getSavedPostsSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(50)).default('12'),
  }),
});

// Validação para IDs de post
export const postIdSchema = z.object({
  params: z.object({
    postId: z.string().uuid('ID do post inválido'),
  }),
});

export type CreateFeedPostInput = z.infer<typeof createFeedPostSchema>['body'];
export type GetFeedInput = z.infer<typeof getFeedSchema>['query'];
export type GetSavedPostsInput = z.infer<typeof getSavedPostsSchema>['query'];
export type PostIdInput = z.infer<typeof postIdSchema>['params'];
