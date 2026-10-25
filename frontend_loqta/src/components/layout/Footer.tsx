import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export function Footer() {
  const { t, language } = useAppStore();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark text-gray-400 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <p className="text-2xl font-black text-white tracking-tighter mb-3">Loqta | لُقطة</p>
            <p className="text-sm leading-relaxed max-w-xs">{t('footerTagline')}</p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">{t('footerLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition">{t('home')}</Link></li>
              <li><Link to="/products" className="hover:text-white transition">{t('products')}</Link></li>
              <li><Link to="/categories" className="hover:text-white transition">{t('categories')}</Link></li>
              <li><Link to="/favorites" className="hover:text-white transition">{t('favorites')}</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">{t('cart')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wide">{t('profile')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition">{t('login')}</Link></li>
              <li><Link to="/register" className="hover:text-white transition">{t('register')}</Link></li>
              <li><Link to="/profile" className="hover:text-white transition">{t('profile')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          &copy; {year} Loqta | لُقطة. {t('footerRights')}
          {language === 'en' && ' — Built as a portfolio project.'}
          {language === 'ar' && ' — مشروع عرض احترافي.'}
        </div>
      </div>
    </footer>
  );
}
