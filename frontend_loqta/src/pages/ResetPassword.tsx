import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/api';
import { apiErrorMessage } from '../lib/apiErrors';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, KeyRound, Lock } from 'lucide-react';

const resetSchema = z
  .object({
    password: z.string().min(8, { message: 'passwordTooShort' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsNoMatch',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

export function ResetPassword() {
  const t = useAppStore((state) => state.t);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // The token arrives via the email link, but can also be pasted manually when
  // the link cannot be opened (e.g. different device or missing app URL).
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetForm) => {
    setServerError('');
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setServerError(t('resetTokenMissing'));
      return;
    }
    try {
      await authService.resetPassword({ token: trimmedToken, newPassword: data.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setServerError(apiErrorMessage(error, t, 'reset'));
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full ps-10 pe-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 rtl:pe-10 rtl:ps-4 ${
      hasError ? 'border-red-300' : 'border-gray-200'
    }`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-dark">{t('resetPasswordTitle')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('resetPasswordSubtitle')}</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <p className="text-gray-700 font-medium" role="status">
              {t('resetPasswordSuccess')}
            </p>
            <Link to="/login" className="inline-block mt-6 text-primary-600 font-bold hover:underline">
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center" role="alert">
                {serverError}
              </div>
            )}

            <div>
              <label htmlFor="resetToken" className="block text-sm font-medium text-gray-700 mb-1">
                {t('resetTokenLabel')}
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  id="resetToken"
                  type="text"
                  dir="ltr"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder={t('resetTokenPlaceholder')}
                  aria-describedby="resetTokenHint"
                  className={`${inputClass(false)} text-start`}
                />
              </div>
              <p id="resetTokenHint" className="text-xs text-gray-500 mt-1">
                {t('resetTokenHint')}
              </p>
            </div>

            <div>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('password')}
                  aria-label={t('password')}
                  aria-invalid={Boolean(errors.password)}
                  className={inputClass(Boolean(errors.password))}
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{t(errors.password.message as never)}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('confirmPassword')}
                  aria-label={t('confirmPassword')}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className={inputClass(Boolean(errors.confirmPassword))}
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{t(errors.confirmPassword.message as never)}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token.trim()}
              className="w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? t('resetting') : t('resetPassword')}
            </button>
          </form>
        )}

        <div className="text-center text-sm">
          <Link to="/login" className="text-primary-600 font-bold hover:underline">
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
