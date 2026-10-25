import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../../data/demoProducts';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../lib/utils';
import { pickLocalized } from '../../lib/i18n';
import { Product3DThumb } from '../3d/Product3DThumb';

export function ProductCard({ product }: { product: Product }) {
  const { t, language, favorites, toggleFavorite, addToCart } = useAppStore();
  const isFavorite = favorites.includes(product.id);

  const name = pickLocalized(language, product.name, product.nameAr);
  const category = pickLocalized(language, product.category, product.categoryAr);
  const hasDiscount = product.originalPrice && product.originalPrice > (product.price || 0);
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - (product.price || 0)) / product.originalPrice!) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col">
      {product.isDemo && (
        <span className="absolute top-3 start-3 z-10 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
          {t('demoDataNotice')}
        </span>
      )}

      <button
        onClick={() => toggleFavorite(product.id)}
        className="absolute top-3 end-3 z-10 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition"
        aria-label="Toggle Favorite"
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
      </button>

      <Link to={`/products/${product.slug ?? product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <Product3DThumb
          modelUrl={product.modelUrl}
          image={product.image}
          alt={name}
          imageClassName="p-6 group-hover:scale-105 transition-transform duration-500"
        />
        {hasDiscount && (
          <span className="absolute top-3 start-3 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            -{discountPct}%
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-grow">
        <span className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
          {category}
        </span>
        <Link to={`/products/${product.slug ?? product.id}`} className="block">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
        </Link>

        {typeof product.rating === 'number' && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-gray-500">{product.rating.toFixed(1)}</span>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {product.price ? (
              <>
                <span className="text-base font-extrabold text-gray-900 leading-tight">
                  {formatCurrency(product.price, product.currency || 'USD', language)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatCurrency(product.originalPrice!, product.currency || 'USD', language)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-500">{t('priceUnavailable')}</span>
            )}
          </div>
          <button
            onClick={() => addToCart(product.id, product)}
            className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors shrink-0"
            aria-label={t('addToCart')}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}