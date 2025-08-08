import { User } from '../lib/types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
