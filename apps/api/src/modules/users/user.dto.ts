import type { UserRole } from '../../shared/constants/index.js';
import type { User } from './user.entity.js';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
