import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/api';
import { apiErrorMessage } from '../lib/apiErrors';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, Mail } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().trim().email({ message: 'invalidEmail' }),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export function ForgotPassword() {
  const t = useAppStore((state) => state.t);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotForm) => {
    setServerError('');
    try {
      await authService.forgotPassword(data.email);
      // Always confirm politely: the email only goes out for real accounts.
      setSent(true);
    } catch (error: any) {
      setServerError(apiErrorMessage(error, t, 'forgot'));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-dark">{t('forgotPasswordTitle')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('forgotPasswordSubtitle')}</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <p className="text-gray-700 font-medium" role="status">
              {t('forgotPasswordSent')}
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
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t('email')}
                  aria-label={t('email')}
                  aria-invalid={Boolean(errors.email)}
                  className={`w-full ps-10 pe-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 rtl:pe-10 rtl:ps-4 ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{t(errors.email.message as never)}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? t('sending') : t('sendResetLink')}
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
