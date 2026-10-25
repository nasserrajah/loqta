import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Home, Search } from 'lucide-react';

export function NotFound() {
  const { t } = useAppStore();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-primary-600 mb-4">404</div>
        <h1 className="text-2xl md:text-3xl font-black text-dark mb-2">{t('pageNotFound')}</h1>
        <p className="text-gray-500 mb-8">{t('pageNotFoundDesc')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-full font-bold hover:bg-primary-700 transition"
          >
            <Home className="w-5 h-5" />
            {t('backToHome')}
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-full font-bold hover:bg-gray-50 transition"
          >
            <Search className="w-5 h-5" />
            {t('exploreProducts')}
          </Link>
        </div>
      </div>
    </div>
  );
}
