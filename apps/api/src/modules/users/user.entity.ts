import type { UserRole } from '../../shared/constants/index.js';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
