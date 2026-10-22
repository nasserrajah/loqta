import bcrypt from 'bcryptjs';
import type { PasswordHasher } from './password-hasher.js';

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly rounds: number) {}

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
