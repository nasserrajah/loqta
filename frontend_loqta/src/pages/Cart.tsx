import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { DEMO_PRODUCTS } from '../data/demoProducts';
import { formatCurrency } from '../lib/utils';
import { pickLocalized } from '../lib/i18n';
import { Product3DThumb } from '../components/3d/Product3DThumb';
import { Trash2, ArrowRight, Minus, Plus, Info, ShoppingBag } from 'lucide-react';

export function Cart() {
  const { cart, addToCart, decreaseQuantity, removeFromCart, language, t } = useAppStore();

  const cartDetails = cart.map((item) => {
    const product =
      item.product ||
      DEMO_PRODUCTS.find((p) => p.id === item.id) || {
        id: item.id,
        name: 'Product',
        description: '',
        image: '',
        category: '',
        inStock: true,
        isDemo: true,
      };
    return { ...item, product };
  });

  const total = cartDetails.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0,
  );

  const removeLabel = language === 'ar' ? 'إزالة' : 'Remove';

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center bg-cream min-h-screen">
        <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-primary-400" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">{t('emptyCart')}</h2>
        <p className="text-gray-500 mb-8 max-w-md">{t('emptyCartDesc')}</p>
        <Link
          to="/"
          className="bg-primary-700 text-white px-8 py-3.5 rounded-full font-bold hover:bg-primary-800 hover:shadow-lg transition-all"
        >
          {t('startShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-8">{t('shoppingCart')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartDetails.map(({ product, quantity, id }) => {
              const displayName = pickLocalized(language, product.name, (product as any).nameAr);
              const displayCategory = pickLocalized(language, product.category, (product as any).categoryAr);

              return (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition"
                >
                  <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                    <Product3DThumb
                      modelUrl={product.modelUrl}
                      image={product.image}
                      alt={displayName}
                      imageClassName="p-2"
                    />
                  </div>
                  <div className="flex-grow text-center sm:text-start">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{displayName}</h3>
                    <p className="text-gray-400 text-xs mb-2">{displayCategory}</p>
                    <p className="text-primary-700 font-extrabold text-lg">
                      {formatCurrency(product.price || 0, 'USD', language)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                      <button
                        onClick={() => decreaseQuantity(id)}
                        className="p-1.5 hover:bg-white rounded-md shadow-sm transition text-gray-600"
                        aria-label="decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-6 text-center text-sm">{quantity}</span>
                      <button
                        onClick={() => addToCart(id, product)}
                        className="p-1.5 hover:bg-white rounded-md shadow-sm transition text-gray-600"
                        aria-label="increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(id)}
                      className="text-red-500 text-xs font-semibold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {removeLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-28">
              <h2 className="text-xl font-black mb-6">{t('orderSummary')}</h2>
              <div className="flex justify-between mb-3 text-gray-600 text-sm">
                <span>{t('subtotal')}</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(total, 'USD', language)}
                </span>
              </div>
              <div className="flex justify-between mb-6 text-gray-600 text-sm">
                <span>{t('shipping')}</span>
                <span className="text-primary-700 font-semibold">{t('free')}</span>
              </div>
              <div className="flex justify-between font-black text-2xl border-t border-gray-100 pt-5 mb-6">
                <span>{t('total')}</span>
                <span>{formatCurrency(total, 'USD', language)}</span>
              </div>
              <button className="w-full bg-primary-700 text-white py-3.5 rounded-xl font-bold hover:bg-primary-800 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                {t('checkout')}
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
              <p className="mt-4 text-xs text-amber-600 flex items-start gap-2 text-start">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                {t('checkoutDemoNotice')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}