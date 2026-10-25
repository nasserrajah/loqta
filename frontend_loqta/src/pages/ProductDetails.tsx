import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft, Heart, ShoppingCart } from 'lucide-react';
import { DEMO_PRODUCTS, Product } from '../data/demoProducts';
import { Product3DViewer } from '../components/3d/Product3DViewer';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../lib/utils';
import { productService } from '../services/api';
import { mapBackendProduct } from '../lib/mappers';

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language, favorites, toggleFavorite, addToCart } = useAppStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;

      // Demo items are local-only and never exist in the backend.
      const demo = DEMO_PRODUCTS.find((item) => item.id === id);
      if (demo) {
        setProduct(demo);
        setLoading(false);
        return;
      }

      try {
        const response = await productService.getProduct(id);
        setProduct(mapBackendProduct(response.data)); 
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="p-20 text-center text-xl animate-pulse">{t('loadingProduct')}</div>;
  if (!product) return <div className="p-20 text-center text-xl text-red-500">{t('productNotFound')}</div>;

  const isFavorite = favorites.includes(product.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-8 font-medium transition">
        <ChevronLeft className="w-5 h-5 mr-1 rtl:rotate-180" />
        {t('backToProducts')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
           <Product3DViewer modelUrl={product.modelUrl} fallbackImage={product.image} productName={product.name} />
        </div>

        <div className="flex flex-col">
          <span className="text-primary-600 font-bold tracking-widest uppercase text-sm mb-2">{product.category}</span>
          <h1 className="text-4xl md:text-5xl font-black text-dark mb-4 leading-tight">{product.name}</h1>
          
          <div className="text-4xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
            {product.price ? (
              formatCurrency(product.price, product.currency || 'USD', language)
            ) : (
              <span className="text-xl text-gray-500">{t('priceUnavailable')}</span>
            )}
            {product.inStock ? (
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">{t('inStock')}</span>
            ) : (
              <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">{t('outOfStockStatus')}</span>
            )}
          </div>

          <p className="text-gray-600 text-lg leading-relaxed mb-8">{product.description}</p>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mb-8 bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-4 text-dark">{t('specifications')}</h3>
              <ul className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <li key={key} className="flex justify-between text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                    <span className="text-gray-500">{key}</span>
                    <span className="font-semibold text-gray-900">{value as string}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 mb-8 mt-auto">
            <button onClick={() => addToCart(product.id)} className="flex-1 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-700 hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" /> {t('addToCart')}
            </button>
            <button onClick={() => toggleFavorite(product.id)} className={`p-4 rounded-xl border-2 transition-all ${isFavorite ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}