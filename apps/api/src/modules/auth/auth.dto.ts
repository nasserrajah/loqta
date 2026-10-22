import type { UserDto } from '../users/user.dto.js';

export interface AuthResponseDto {
  user: UserDto;
  session: {
    expiresAt: string;
  };
}

export interface AuthSessionResult {
  user: UserDto;
  token: string;
  expiresAt: string;
}

export interface SessionDto {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

export interface ForgotPasswordResult {
  resetToken?: string;
}
