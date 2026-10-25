import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, authService } from '../services/api';
import { apiErrorMessage } from '../lib/apiErrors';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, ShieldCheck, Lock } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'fieldRequired' }),
  phone: z
    .string()
    .trim()
    .max(20, { message: 'fieldRequired' })
    .refine((v) => v === '' || /^[+\d\s()-]{5,20}$/.test(v), { message: 'invalidPhone' }),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'fieldRequired' }),
    newPassword: z.string().min(8, { message: 'passwordTooShort' }),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'passwordsNoMatch',
    path: ['confirmNewPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export function Profile() {
  const navigate = useNavigate();
  const { t, user, language, setUser } = useAppStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState('');
  const [role, setRole] = useState<string | undefined>();
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  const [pwStatus, setPwStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/me')
      .then((response) => {
        if (cancelled) return;
        const profile = response.data?.data;
        if (!profile) return;
        setEmail(profile.email);
        setPhone(profile.phone);
        setMemberSince(profile.createdAt);
        setRole(profile.role);
        reset({ fullName: profile.fullName, phone: profile.phone ?? '' });
      })
      .catch(() => {
        // The page still renders from the persisted store user below.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-black text-dark mb-4">{t('requireLogin')}</h1>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="bg-primary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-primary-700 transition"
          >
            {t('login')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition"
          >
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ProfileForm) => {
    setStatus('idle');
    setServerError('');
    try {
      const response = await api.patch('/users/me', {
        fullName: data.fullName,
        phone: data.phone === '' ? null : data.phone,
      });
      const updated = response.data?.data;
      if (updated) {
        setEmail(updated.email);
        setPhone(updated.phone);
        reset({ fullName: updated.fullName, phone: updated.phone ?? '' });
        // Keep global user state in sync so UI updates everywhere.
        if (user) {
          setUser({ ...user, fullName: updated.fullName });
        }
      }
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setServerError(apiErrorMessage(error, t, 'profile'));
      setStatus('error');
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setPwStatus('idle');
    setPwError('');
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPwStatus('saved');
      resetPw();
      setTimeout(() => setPwStatus('idle'), 3000);
    } catch (error) {
      setPwError(apiErrorMessage(error, t, 'password'));
      setPwStatus('error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-black text-dark mb-8">{t('myProfile')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info card */}
        <aside className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xl font-black">
              {user.fullName?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
            <div>
              <p className="font-bold text-dark truncate">{user.fullName}</p>
              <p className="text-sm text-gray-500 truncate">{email || user.email}</p>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">{t('phoneLabel')}</dt>
              <dd className="font-semibold text-dark text-end">{phone ?? t('noPhone')}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-gray-500">{t('memberSince')}</dt>
              <dd className="font-semibold text-dark">
                {memberSince ? new Date(memberSince).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '—'}
              </dd>
            </div>
            {role === 'Admin' && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold">{role}</span>
              </div>
            )}
          </dl>
        </aside>

        {/* Edit form */}
        <section className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xl font-black text-dark mb-6">{t('personalInfo')}</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {status === 'saved' && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2" role="status">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('profileUpdated')}
                </div>
              )}
              {(serverError || status === 'error') && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm" role="alert">
                  {serverError || t('profileUpdateError')}
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('fullName')}
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.fullName ? 'border-red-300' : 'border-gray-200'
                  }`}
                  {...register('fullName')}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{t(errors.fullName.message as never)}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('email')}
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('phoneLabel')}
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t('noPhone')}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    errors.phone ? 'border-red-300' : 'border-gray-200'
                  }`}
                  {...register('phone')}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? t('saving') : t('saveChanges')}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-black text-dark">{t('changePassword')}</h2>
            </div>
            <form onSubmit={handleSubmitPw(onChangePassword)} noValidate className="space-y-5">
              {pwStatus === 'saved' && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2" role="status">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('changePasswordSuccess')}
                </div>
              )}
              {(pwError || pwStatus === 'error') && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm" role="alert">
                  {pwError || t('changePasswordError')}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('currentPassword')}
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    pwErrors.currentPassword ? 'border-red-300' : 'border-gray-200'
                  }`}
                  {...registerPw('currentPassword')}
                />
                {pwErrors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">{t(pwErrors.currentPassword.message as never)}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('newPassword')}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    pwErrors.newPassword ? 'border-red-300' : 'border-gray-200'
                  }`}
                  {...registerPw('newPassword')}
                />
                {pwErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{t(pwErrors.newPassword.message as never)}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('confirmPassword')}
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                    pwErrors.confirmNewPassword ? 'border-red-300' : 'border-gray-200'
                  }`}
                  {...registerPw('confirmNewPassword')}
                />
                {pwErrors.confirmNewPassword && (
                  <p className="text-red-500 text-xs mt-1">{t(pwErrors.confirmNewPassword.message as never)}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={pwSubmitting}
                className="px-8 py-3 bg-dark text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {pwSubmitting ? t('saving') : t('changePassword')}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
