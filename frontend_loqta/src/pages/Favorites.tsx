import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DEMO_PRODUCTS, Product } from '../data/demoProducts';
import { ProductCard } from '../components/products/ProductCard';
import { favoriteService } from '../services/api';
import { mapBackendProduct } from '../lib/mappers';
import { Link } from 'react-router-dom';
import { Heart, ChevronLeft } from 'lucide-react';

export function Favorites() {
  const { favorites, user, t, language } = useAppStore();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (user) {
        try {
          const response = await favoriteService.list({ page: 1, pageSize: 100 });
          const products = (response.data ?? []).map(mapBackendProduct);
          if (!cancelled) {
            setFavoriteProducts(products);
            setLoading(false);
          }
          return;
        } catch {
          // Fall back to locally tracked ids below.
        }
      }
      const products = DEMO_PRODUCTS.filter((p) => favorites.includes(p.id));
      if (!cancelled) {
        setFavoriteProducts(products);
        setLoading(false);
      }
    }

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [user, favorites]);

  const backHomeLabel = language === 'ar' ? 'العودة للرئيسية' : 'Back to Home';
  const countLabel =
    language === 'ar'
      ? `${favoriteProducts.length} منتج في المفضلة`
      : `${favoriteProducts.length} ${favoriteProducts.length === 1 ? 'item' : 'items'} saved`;

  /* ---------------------- Loading skeleton ---------------------- */
  if (loading) {
    return (
      <div className="bg-cream min-h-screen">
        <div className="container mx-auto px-4 py-10">
          <div className="h-8 w-56 bg-gray-200 animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------- Empty state ---------------------- */
  if (favoriteProducts.length === 0) {
    return (
      <div className="bg-cream min-h-screen flex items-center justify-center px-4">
        <div className="container mx-auto py-24 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-primary-300" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
            {t('noFavorites')}
          </h2>
          <p className="text-gray-500 mb-8 max-w-md text-sm md:text-base">
            {t('noFavoritesDesc')}
          </p>
          <Link
            to="/products"
            className="bg-primary-700 text-white px-8 py-3.5 rounded-full font-bold hover:bg-primary-800 hover:shadow-lg transition-all"
          >
            {t('exploreProducts')}
          </Link>
        </div>
      </div>
    );
  }

  /* ---------------------- Favorites grid ---------------------- */
  return (
    <div className="bg-cream min-h-screen">
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-gray-500 hover:text-primary-700 text-sm font-medium mb-3 transition"
            >
              <ChevronLeft className="w-4 h-4 me-1 rtl:rotate-180" />
              {backHomeLabel}
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2.5">
              <Heart className="w-6 h-6 fill-primary-600 text-primary-600" />
              {t('yourFavorites')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{countLabel}</p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-primary-700 px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-primary-50 hover:border-primary-200 transition self-start sm:self-auto"
          >
            {t('exploreProducts')}
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}