import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ShoppingCart, Heart, User, Search, Globe, Menu, X, LogIn, ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services/api';

const NAV_CATEGORIES = [
  { slug: 'laptops', en: 'Laptops', ar: 'لابتوبات' },
  { slug: 'smartphones', en: 'Smartphones', ar: 'هواتف' },
  { slug: 'headphones', en: 'Headphones', ar: 'سماعات' },
  { slug: 'monitors', en: 'Monitors', ar: 'شاشات' },
  { slug: 'cameras', en: 'Cameras', ar: 'كاميرات' },
  { slug: 'gaming', en: 'Gaming', ar: 'أجهزة ألعاب' },
];

export function Navbar() {
  const { t, language, setLanguage, cart, favorites, user, setUser } = useAppStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    setUserMenuOpen(false);
    setMenuOpen(false);
    setUser(null);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
    setMenuOpen(false);
  };

  const closeMenus = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setCatOpen(false);
  };

  const badge = (count: number) =>
    count > 0 && (
      <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
        {count > 99 ? '99+' : count}
      </span>
    );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-3">
        {/* Mobile menu button */}
        <button
          className="p-2 -ms-2 text-gray-700 hover:text-primary-600 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? t('close') : t('menu')}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <Link
          to="/"
          className="text-xl md:text-2xl font-black text-primary-700 tracking-tighter shrink-0"
          onClick={closeMenus}
        >
          Loqta | لُقطة
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-xl">
          <Link to="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition">
            {t('home')}
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition flex items-center gap-1">
              {t('categories')}
              <ChevronDown className="w-4 h-4" />
            </button>
            {catOpen && (
              <div className="absolute top-full start-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                {NAV_CATEGORIES.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => { navigate(`/products?category=${c.slug}`); closeMenus(); }}
                    className="block w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                  >
                    {language === 'ar' ? c.ar : c.en}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link to="/products" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition">
            {t('deals')}
          </Link>
          <Link to="/products" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition">
            {t('delivery')}
          </Link>
        </nav>

        {/* Search Bar (desktop) */}
        <form className="hidden md:flex flex-1 max-w-sm relative" role="search" onSubmit={handleSearch}>
          <input
            type="search"
            aria-label={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full ps-10 pe-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="p-2 text-gray-700 hover:text-primary-600 flex items-center gap-1 font-medium text-sm"
            aria-label="Switch language"
          >
            <Globe className="w-5 h-5" />
            <span className="hidden md:inline">{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          <Link to="/favorites" className="p-2 text-gray-700 hover:text-primary-600 relative" aria-label={t('favorites')}>
            <Heart className="w-5 h-5" />
            {badge(favorites.length)}
          </Link>

          <Link to="/cart" className="p-2 text-gray-700 hover:text-primary-600 relative" aria-label={t('cart')}>
            <ShoppingCart className="w-5 h-5" />
            {badge(cartCount)}
          </Link>

          {user ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 p-2 text-gray-700 hover:text-primary-600 font-medium"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline max-w-24 truncate text-sm">{user.fullName}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute end-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg" role="menu">
                  <div className="p-2 flex flex-col">
                    <Link to="/profile" className="px-4 py-2 hover:bg-gray-50 rounded-lg text-sm" onClick={closeMenus} role="menuitem">
                      {t('profile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-start text-red-600"
                      role="menuitem"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-primary-700 transition"
            >
              <User className="w-4 h-4" />
              {t('login')}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-4" role="navigation">
          <form className="flex relative" role="search" onSubmit={handleSearch}>
            <input
              type="search"
              aria-label={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full ps-10 pe-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <Search className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
          </form>

          <nav className="flex flex-wrap gap-2">
            {NAV_CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => {
                  navigate(`/products?category=${c.slug}`);
                  closeMenus();
                }}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
              >
                {language === 'ar' ? c.ar : c.en}
              </button>
            ))}
          </nav>

          {user ? (
            <div className="flex gap-2">
              <Link to="/profile" onClick={closeMenus} className="flex-1 text-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full font-medium text-sm">
                {t('profile')}
              </Link>
              <button onClick={handleLogout} className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-full font-medium text-sm">
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" onClick={closeMenus} className="flex-1 text-center px-4 py-2.5 bg-primary-600 text-white rounded-full font-medium text-sm flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                {t('login')}
              </Link>
              <Link to="/register" onClick={closeMenus} className="flex-1 text-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full font-medium text-sm">
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}