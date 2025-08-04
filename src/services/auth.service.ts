import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { ConflictError, UnauthorizedError, ValidationError } from '@/utils/AppError';
import { RegisterInput, LoginInput } from '@/validations/auth.validation';

const prisma = new PrismaClient();

export class AuthService {
  async register(data: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('Email já está em uso');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        gender: true,
        mannequinPreference: true,
        style: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.type);

    return {
      user,
      token,
    };
  }

  async login(data: LoginInput) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.type);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        gender: true,
        mannequinPreference: true,
        style: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clothingItems: true,
            savedOutfits: true,
            feedPosts: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    return user;
  }

  private generateToken(userId: string, email: string, type: string): string {
    return jwt.sign(
      { userId, email, type },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }
}

export const authService = new AuthService();
