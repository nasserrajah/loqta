import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { DEMO_PRODUCTS, Product } from '../data/demoProducts';
import { ProductCard } from '../components/products/ProductCard';
import { favoriteService } from '../services/api';
import { mapBackendProduct } from '../lib/mappers';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function Favorites() {
  const { favorites, user, t } = useAppStore();
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-red-300" />
        </div>
        <h2 className="text-3xl font-black text-dark mb-4">{t('noFavorites')}</h2>
        <p className="text-gray-500 mb-8 max-w-md">{t('noFavoritesDesc')}</p>
        <Link to="/" className="bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 hover:shadow-lg transition-all">
          {t('exploreProducts')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-dark">{t('yourFavorites')}</h1>
        <Link to="/" className="text-primary-600 font-bold hover:underline">Back to Home</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favoriteProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
