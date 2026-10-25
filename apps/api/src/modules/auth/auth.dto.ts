import type { UserDto } from '../users/user.dto.js';

export interface AuthResponseDto {
  user: UserDto;
  session: {
    expiresAt: string;
  };
  /**
   * Opaque session token. The same value is also set as an HttpOnly cookie;
   * exposing it lets browser clients from other origins authenticate with an
   * Authorization header when third-party cookies are unavailable.
   */
  token: string;
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
