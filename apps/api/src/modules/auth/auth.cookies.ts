import type { CookieOptions, Response } from 'express';
import { SESSION_COOKIE_NAME } from '../../shared/constants/index.js';

function cookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    // The frontend lives on a different origin during local development (and
    // potentially in production), so the cookie must travel in cross-site
    // requests. SameSite=None requires the Secure flag, which matches the
    // `secure` argument (true in production behind HTTPS).
    sameSite: secure ? 'none' : 'lax',
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
