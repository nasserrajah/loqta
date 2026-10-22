import { createHash, randomBytes, randomUUID } from 'node:crypto';

export function newId(): string {
  return randomUUID();
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
