import type { PasswordHasher } from '../../infrastructure/security/index.js';
import type {
  SessionRepository,
  UserRepository,
} from '../../infrastructure/database/repositories/index.js';
import { BadRequestError, NotFoundError } from '../../shared/errors/index.js';
import type { ChangePasswordInput, UpdateProfileInput } from './user.schemas.js';
import { toUserDto, type UserDto } from './user.dto.js';

export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async getById(userId: string): Promise<UserDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return toUserDto(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const updated = await this.users.updateProfile(userId, {
      fullName: input.fullName ?? user.fullName,
      phone: input.phone === undefined ? user.phone : input.phone,
    });
    if (!updated) throw new NotFoundError('User not found');
    return toUserDto(updated);
  }

  async changePassword(
    userId: string,
    currentSessionId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const currentPasswordMatches = await this.passwordHasher.verify(
      input.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordMatches) {
      throw new BadRequestError('Current password is incorrect');
    }

    const newHash = await this.passwordHasher.hash(input.newPassword);
    await this.users.updatePasswordHash(userId, newHash);
    await this.sessions.deleteByUserId(userId, currentSessionId);
  }
}
