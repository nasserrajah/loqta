import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../../data/demoProducts';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const { t, language, favorites, toggleFavorite, addToCart } = useAppStore();
  const isFavorite = favorites.includes(product.id);

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col">
      {product.isDemo && (
        <span className="absolute top-4 left-4 z-10 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-md">
          {t('demoDataNotice')}
        </span>
      )}
      
      <button 
        onClick={() => toggleFavorite(product.id)}
        className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition"
        aria-label="Toggle Favorite"
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
      </button>

      <Link to={`/products/${product.slug ?? product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <img 
          src={product.image} 
          alt={product.name} 
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      <div className="p-5 flex flex-col flex-grow">
        <span className="text-xs text-primary-600 font-semibold uppercase tracking-wider mb-1">
          {product.category}
        </span>
        <Link to={`/products/${product.slug ?? product.id}`} className="block">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="text-lg font-extrabold text-gray-900">
            {product.price 
              ? formatCurrency(product.price, product.currency || 'USD', language)
              : <span className="text-sm text-gray-500 font-normal">{t('priceUnavailable')}</span>
            }
          </div>
          <button 
            onClick={() => addToCart(product.id)}
            className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors"
            aria-label={t('addToCart')}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}