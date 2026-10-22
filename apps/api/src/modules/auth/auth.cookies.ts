import type { CookieOptions, Response } from 'express';
import { SESSION_COOKIE_NAME } from '../../shared/constants/index.js';

function cookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  };
}

export function setSessionCookie(
  res: Response,
  token: string,
  expiresAt: string,
  secure: boolean,
): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...cookieOptions(secure),
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(res: Response, secure: boolean): void {
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions(secure));
}
