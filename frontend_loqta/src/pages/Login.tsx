import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { authService } from '../services/api';
import { apiErrorMessage } from '../lib/apiErrors';
import { Lock, Mail } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const setUser = useAppStore(state => state.setUser);
  const { t } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      const user = response?.data?.user || (response as any)?.user || (response as any)?.data;
      if (!user?.id) {
        throw new Error('Invalid response from server');
      }
      await setUser(user);
      navigate('/');
    } catch (err: any) {
      // Always a clear, translated sentence — never the raw backend payload.
      setError(apiErrorMessage(err, t, 'login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-dark">{t('login')}</h2>
          <p className="mt-2 text-sm text-gray-500">{t('welcomeBack')}</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 rtl:pr-10 rtl:pl-4"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:right-3 rtl:left-auto" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 rtl:pr-10 rtl:pl-4"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition"
          >
            {loading ? t('signingIn') : t('login')}
          </button>
        </form>
        
        <div className="text-center text-sm space-y-3 mt-4">
          <div>
            {t('noAccount')}{' '}
            <Link to="/register" className="text-primary-600 font-bold hover:underline">
              {t('createAccount')}
            </Link>
          </div>
          <div>
            <Link to="/forgot-password" className="text-gray-500 hover:text-primary-600 transition">
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="text-xs text-gray-500">
            {t('demoAccount')}
          </div>
        </div>
      </div>
    </div>
  );
}