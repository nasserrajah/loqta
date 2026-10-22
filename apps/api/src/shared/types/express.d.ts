import type { UserRole } from '../constants/index.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthContext {
  user: AuthenticatedUser;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      validated: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
