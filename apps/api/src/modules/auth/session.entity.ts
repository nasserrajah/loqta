export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  lastUsedAt: string;
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}
