import { Link } from 'react-router-dom';
import { Facebook, Twitter, Youtube, Instagram } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function Footer() {
  const { t } = useAppStore();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <p className="text-2xl font-black text-primary-700 tracking-tighter mb-3">Loqta | لُقطة</p>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">{t('footerTagline')}</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">{t('footerAbout')}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-primary-600 transition">{t('home')}</Link></li>
              <li><Link to="/products" className="hover:text-primary-600 transition">{t('products')}</Link></li>
              <li><Link to="/categories" className="hover:text-primary-600 transition">{t('categories')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">{t('footerExplore')}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/favorites" className="hover:text-primary-600 transition">{t('favorites')}</Link></li>
              <li><Link to="/cart" className="hover:text-primary-600 transition">{t('cart')}</Link></li>
              <li><Link to="/profile" className="hover:text-primary-600 transition">{t('profile')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">{t('footerContact')}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/login" className="hover:text-primary-600 transition">{t('login')}</Link></li>
              <li><Link to="/register" className="hover:text-primary-600 transition">{t('register')}</Link></li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-primary-600 transition"><Facebook className="w-4 h-4" /></a>
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-primary-600 transition"><Twitter className="w-4 h-4" /></a>
              <a href="#" aria-label="Youtube" className="text-gray-400 hover:text-primary-600 transition"><Youtube className="w-4 h-4" /></a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-primary-600 transition"><Instagram className="w-4 h-4" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/policies/privacy" className="hover:text-primary-600 transition">{t('privacyPolicy')}</Link>
            <Link to="/policies/terms" className="hover:text-primary-600 transition">{t('termsOfService')}</Link>
            <Link to="/policies/returns" className="hover:text-primary-600 transition">{t('returnPolicy')}</Link>
          </div>
          <p>&copy; {year} Loqta. {t('footerRights')}</p>
        </div>
      </div>
    </footer>
  );
}