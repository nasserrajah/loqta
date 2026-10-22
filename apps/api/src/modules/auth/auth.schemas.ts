import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../shared/constants/index.js';

const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email('Enter a valid email address')
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);

const phoneSchema = z
  .string()
  .trim()
  .min(6)
  .max(30)
  .regex(/^[0-9+\-() ]+$/, 'Phone contains invalid characters');

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().trim().min(2).max(100),
    phone: phoneSchema.nullable().optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    newPassword: passwordSchema,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
