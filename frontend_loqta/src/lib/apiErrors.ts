import type { TranslationKey } from './i18n';

/** Where a failed API call is displayed — picks the most helpful wording. */
export type ErrorContext =
  | 'general'
  | 'login'
  | 'register'
  | 'forgot'
  | 'reset'
  | 'profile'
  | 'password';

/**
 * Translates a failed API call into a clear, human message in the active
 * language. The raw backend text (English internals like "Invalid email or
 * password" or JSON payloads) is never shown to shoppers.
 */
export function apiErrorMessage(
  error: unknown,
  t: (key: TranslationKey) => string,
  context: ErrorContext = 'general',
): string {
  const err = error as {
    response?: { status?: number; data?: any };
  };
  const status = err?.response?.status;
  const code: string | undefined = err?.response?.data?.error?.code ?? err?.response?.data?.code;

  // The backend only uses a handful of stable codes; map status first.
  if (code === 'RATE_LIMITED' || status === 429) return t('tooManyAttempts');

  if (status === 401) {
    if (context === 'login') return t('loginError');
    if (context === 'password') return t('wrongCurrentPassword');
    return t('sessionExpired');
  }
  if (status === 409 || code === 'CONFLICT') return t('emailInUse');
  if (status === 400) {
    // The reset endpoint answers 400 for a wrong/expired/used code.
    if (context === 'reset') return t('resetCodeInvalid');
    return t('invalidInput');
  }
  if (status === 403) return t('forbidden');
  if (status === 404) return t('notFound');
  if (status === undefined) return t('networkError');
  if (status >= 500 || code === 'INTERNAL_ERROR') return t('serverError');

  // Anything unusual still gets a sentence in the user's language.
  switch (context) {
    case 'login':
      return t('loginError');
    case 'register':
      return t('registerError');
    case 'forgot':
      return t('forgotPasswordError');
    case 'reset':
      return t('resetPasswordError');
    case 'profile':
      return t('profileUpdateError');
    case 'password':
      return t('changePasswordError');
    default:
      return t('genericError');
  }
}
