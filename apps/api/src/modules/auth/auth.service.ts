import type {
  PasswordResetRepository,
  SessionRepository,
  UserRepository,
} from '../../infrastructure/database/repositories/index.js';
import type { EmailSender } from '../../infrastructure/email/index.js';
import type { PasswordHasher } from '../../infrastructure/security/index.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/index.js';
import { addDays, addMinutes, isExpired, nowIso } from '../../shared/utils/date.js';
import { generateOpaqueToken, hashToken, newId } from '../../shared/utils/crypto.js';
import type { AuthContext } from '../../shared/types/express.js';
import { toUserDto } from '../users/user.dto.js';
import type { AuthSessionResult, ForgotPasswordResult, SessionDto } from './auth.dto.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export interface SessionContext {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface AuthOptions {
  sessionTtlDays: number;
  passwordResetTtlMinutes: number;
  appUrl: string;
  exposeResetToken: boolean;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwordResets: PasswordResetRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly emailSender: EmailSender,
    private readonly options: AuthOptions,
  ) {}

  private async createSession(userId: string, context: SessionContext): Promise<AuthSessionResult> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError('User account is unavailable');

    const token = generateOpaqueToken();
    const expiresAt = addDays(new Date(), this.options.sessionTtlDays).toISOString();
    const lastUsedAt = nowIso();

    await this.sessions.create({
      id: newId(),
      userId,
      tokenHash: hashToken(token),
      userAgent: context.userAgent?.slice(0, 500) ?? null,
      ipAddress: context.ipAddress?.slice(0, 64) ?? null,
      expiresAt,
      lastUsedAt,
    });

    return { user: toUserDto(user), token, expiresAt };
  }

  async register(input: RegisterInput, context: SessionContext): Promise<AuthSessionResult> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({
      id: newId(),
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone ?? null,
      role: 'User',
    });

    return this.createSession(user.id, context);
  }

  async login(input: LoginInput, context: SessionContext): Promise<AuthSessionResult> {
    const user = await this.users.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return this.createSession(user.id, context);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.sessions.deleteByTokenHash(hashToken(token));
  }

  async authenticate(token: string): Promise<AuthContext> {
    const session = await this.sessions.findByTokenHash(hashToken(token));
    if (!session) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    if (isExpired(session.expiresAt)) {
      await this.sessions.deleteById(session.id);
      throw new UnauthorizedError('Invalid or expired session');
    }

    const user = await this.users.findById(session.userId);
    if (!user || !user.isActive) {
      await this.sessions.deleteById(session.id);
      throw new UnauthorizedError('Invalid or expired session');
    }

    const lastUsed = new Date(session.lastUsedAt).getTime();
    if (Date.now() - lastUsed > 60_000) {
      await this.sessions.touch(session.id, nowIso());
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      sessionId: session.id,
    };
  }

  async listSessions(userId: string, currentSessionId: string): Promise<SessionDto[]> {
    const sessions = await this.sessions.listByUserId(userId);
    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      current: session.id === currentSessionId,
    }));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    currentSessionId: string,
  ): Promise<{ revokedCurrent: boolean }> {
    const session = await this.sessions.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundError('Session not found');
    }

    await this.sessions.deleteById(sessionId);
    return { revokedCurrent: sessionId === currentSessionId };
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) {
      // Do not reveal whether an account exists.
      return {};
    }

    await this.passwordResets.deleteByUserId(user.id);

    const token = generateOpaqueToken();
    const expiresAt = addMinutes(new Date(), this.options.passwordResetTtlMinutes).toISOString();

    await this.passwordResets.create({
      id: newId(),
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

    const resetUrl = `${this.options.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.emailSender.send({
      to: user.email,
      subject: 'Reset your Loqta password',
      text: `Use this link to reset your password: ${resetUrl}\nThe link expires in ${this.options.passwordResetTtlMinutes} minutes.`,
    });

    // Always return token for now so it can be used from the frontend in this setup
    return { resetToken: token };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const reset = await this.passwordResets.findByTokenHash(hashToken(token));
    if (!reset || reset.usedAt || isExpired(reset.expiresAt)) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const user = await this.users.findById(reset.userId);
    if (!user || !user.isActive) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    const consumed = await this.passwordResets.markUsed(reset.id, nowIso());
    if (!consumed) {
      throw new BadRequestError('Invalid or expired password reset token');
    }
    await this.users.updatePasswordHash(user.id, passwordHash);
    await this.sessions.deleteByUserId(user.id);
    await this.passwordResets.deleteByUserId(user.id);
  }
}
