import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

export const validateRequest = (schema: z.ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validar body, query e params conforme definido no schema
      const validationData: any = {};
      
      if (schema.shape.body) {
        validationData.body = req.body;
      }
      
      if (schema.shape.query) {
        validationData.query = req.query;
      }
      
      if (schema.shape.params) {
        validationData.params = req.params;
      }

      const result = schema.parse(validationData);

      // Atualizar req com dados validados
      if (result.body) {
        req.body = result.body;
      }
      
      if (result.query) {
        req.query = result.query;
      }
      
      if (result.params) {
        req.params = result.params;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: messages,
        });
        return;
      }

      next(error);
    }
  };
};
