import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../shared/constants/index.js';

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    phone: z
      .string()
      .trim()
      .min(6)
      .max(30)
      .regex(/^[0-9+\-() ]+$/, 'Phone contains invalid characters')
      .nullable(),
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one profile field must be provided',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
