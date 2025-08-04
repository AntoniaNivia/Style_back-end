import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    type: z.enum(['USER', 'STORE']).default('USER'),
    gender: z.enum(['FEMALE', 'MALE', 'OTHER']).default('OTHER'),
    mannequinPreference: z.enum(['Woman', 'Man', 'Neutral']).default('Neutral'),
    style: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
