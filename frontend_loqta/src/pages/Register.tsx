import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '../store/useAppStore';
import { authService } from '../services/api';
import { apiErrorMessage } from '../lib/apiErrors';
import { Lock, Mail, User as UserIcon } from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, { message: 'fieldRequired' }),
    email: z.string().trim().email({ message: 'invalidEmail' }),
    password: z.string().min(8, { message: 'passwordTooShort' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsNoMatch',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const t = useAppStore((state) => state.t);

  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError('');
    try {
      const response = await authService.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      const user = response?.data?.user || (response as any)?.user || (response as any)?.data?.user;
      if (!user?.id) {
        throw new Error('Invalid response shape');
      }
      await setUser(user);
      navigate('/');
    } catch (error: any) {
      // Clear translated message — never the raw JSON response.
      setServerError(apiErrorMessage(error, t, 'register'));
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
          <h2 className="text-3xl font-extrabold text-dark">{t('registerTitle')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('registerSubtitle')}</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center" role="alert">
              {serverError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="name"
                  placeholder={t('fullName')}
                  aria-label={t('fullName')}
                  aria-invalid={Boolean(errors.fullName)}
                  className={inputClass(Boolean(errors.fullName))}
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{t(errors.fullName.message as never)}</p>}
            </div>

            <div>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t('email')}
                  aria-label={t('email')}
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass(Boolean(errors.email))}
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{t(errors.email.message as never)}</p>}
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition"
          >
            {isSubmitting ? t('creatingAccount') : t('register')}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-primary-600 font-bold hover:underline">
            {t('login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
