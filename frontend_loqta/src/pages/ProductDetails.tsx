import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft, Heart, ShoppingCart, Star, Info } from 'lucide-react';
import { DEMO_PRODUCTS, Product } from '../data/demoProducts';
import { Product3DViewer } from '../components/3d/Product3DViewer';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../lib/utils';
import { productService } from '../services/api';
import { mapBackendProduct } from '../lib/mappers';
import { pickLocalized } from '../lib/i18n';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language, favorites, toggleFavorite, addToCart } = useAppStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;

      // Demo products (incl. the local 3D deals) resolve by id or slug.
      const demo = DEMO_PRODUCTS.find(
        (item) => item.id === id || (item.slug && item.slug === id),
      );
      if (demo) {
        setProduct(demo);
        setLoading(false);
        return;
      }

      try {
        const response = await productService.getProduct(id);
        setProduct(mapBackendProduct(response.data));
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="h-[420px] bg-gray-200 animate-pulse rounded-3xl" />
          <div className="space-y-4">
            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
            <div className="h-10 w-3/4 bg-gray-200 animate-pulse rounded" />
            <div className="h-8 w-40 bg-gray-200 animate-pulse rounded" />
            <div className="h-24 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="p-20 text-center text-xl text-red-500">{t('productNotFound')}</div>;
  }

  const isFavorite = favorites.includes(product.id);

  const displayName = pickLocalized(language, product.name, product.nameAr);
  const displayDescription = pickLocalized(language, product.description, product.descriptionAr);
  const displayCategory = pickLocalized(language, product.category, product.categoryAr);
  const displaySpecs =
    language === 'ar' && product.specificationsAr && Object.keys(product.specificationsAr).length > 0
      ? product.specificationsAr
      : product.specifications;

  const hasDiscount = product.originalPrice && product.originalPrice > (product.price || 0);
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - (product.price || 0)) / product.originalPrice!) * 100)
    : 0;

  return (
    <div className="bg-cream min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-500 hover:text-primary-700 mb-6 font-medium transition"
        >
          <ChevronLeft className="w-5 h-5 me-1 rtl:rotate-180" />
          {t('backToProducts')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Media column */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-fit lg:sticky lg:top-28">
            <Product3DViewer
              modelUrl={product.modelUrl}
              fallbackImage={product.image}
              productName={displayName}
            />
            {product.isDemo && (
              <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {t('demoDataNotice')}
              </p>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col">
            <span className="text-primary-700 font-bold tracking-widest uppercase text-xs mb-2">
              {displayCategory}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
              {displayName}
            </h1>

            {typeof product.rating === 'number' && (
              <div className="flex items-center gap-1.5 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= Math.round(product.rating!)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.rating.toFixed(1)})</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-6">
              {product.price ? (
                <>
                  <span className="text-3xl md:text-4xl font-extrabold text-gray-900">
                    {formatCurrency(product.price, product.currency || 'USD', language)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {formatCurrency(product.originalPrice!, product.currency || 'USD', language)}
                      </span>
                      <span className="text-xs font-bold bg-primary-600 text-white px-2.5 py-1 rounded-full">
                        -{discountPct}%
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-xl text-gray-500">{t('priceUnavailable')}</span>
              )}
              {product.inStock ? (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                  {t('inStock')}
                </span>
              ) : (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                  {t('outOfStockStatus')}
                </span>
              )}
            </div>

            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8">
              {displayDescription}
            </p>

            {displaySpecs && Object.keys(displaySpecs).length > 0 && (
              <div className="mb-8 bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-900">{t('specifications')}</h3>
                <ul className="space-y-3">
                  {Object.entries(displaySpecs).map(([key, value]) => (
                    <li
                      key={key}
                      className="flex justify-between gap-3 text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0"
                    >
                      <span className="text-gray-500">{key}</span>
                      <span className="font-semibold text-gray-900 text-end">{value as string}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 mb-8 mt-auto">
              <button
                onClick={() => addToCart(product.id, product)}
                disabled={!product.inStock}
                className="flex-1 bg-primary-700 text-white px-6 py-3.5 rounded-xl font-bold text-base hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <ShoppingCart className="w-5 h-5" /> {t('addToCart')}
              </button>
              <button
                onClick={() => toggleFavorite(product.id)}
                aria-label={t('favorites')}
                className={`p-3.5 rounded-xl border-2 transition-all ${
                  isFavorite
                    ? 'border-red-500 text-red-500 bg-red-50'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}