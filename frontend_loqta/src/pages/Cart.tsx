import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { DEMO_PRODUCTS } from '../data/demoProducts';
import { formatCurrency } from '../lib/utils';
import { Trash2, ArrowRight, Minus, Plus, Info } from 'lucide-react';

export function Cart() {
  const { cart, addToCart, decreaseQuantity, removeFromCart, language, t } = useAppStore();

  // Logged-in carts ship product data from the backend; guest carts resolve
  // products against the demo catalog.
  const cartDetails = cart.map(item => {
    const product =
      item.product ||
      DEMO_PRODUCTS.find(p => p.id === item.id) ||
      { id: item.id, name: 'Product', description: '', image: '', category: '', inStock: true, isDemo: true };
    return { ...item, product };
  });

  const total = cartDetails.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Trash2 className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-3xl font-black text-dark mb-4">{t('emptyCart')}</h2>
        <p className="text-gray-500 mb-8 max-w-md">{t('emptyCartDesc')}</p>
        <Link to="/" className="bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 hover:shadow-lg transition-all">
          {t('startShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-3xl font-black text-dark mb-10">{t('shoppingCart')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cartDetails.map(({ product, quantity, id }) => (
            <div key={id} className="flex flex-col sm:flex-row items-center gap-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
              <img src={product.image} alt={product.name} className="w-32 h-32 object-cover rounded-xl bg-gray-50" />
              <div className="flex-grow text-center sm:text-left">
                <h3 className="font-bold text-xl text-dark">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                <p className="text-primary-600 font-extrabold text-lg">
                  {formatCurrency(product.price || 0, 'USD', language)}
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border border-gray-200">
                  <button onClick={() => decreaseQuantity(id)} className="p-2 hover:bg-white rounded-md shadow-sm transition text-gray-600">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold w-6 text-center">{quantity}</span>
                  <button onClick={() => addToCart(id)} className="p-2 hover:bg-white rounded-md shadow-sm transition text-gray-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={() => removeFromCart(id)} className="text-red-500 text-sm font-semibold hover:underline flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg sticky top-28">
            <h2 className="text-2xl font-black mb-6">{t('orderSummary')}</h2>
            <div className="flex justify-between mb-3 text-gray-600">
              <span>{t('subtotal')}</span>
              <span className="font-semibold text-dark">{formatCurrency(total, 'USD', language)}</span>
            </div>
            <div className="flex justify-between mb-6 text-gray-600">
              <span>{t('shipping')}</span>
              <span className="text-green-600 font-semibold">{t('free')}</span>
            </div>
            <div className="flex justify-between font-black text-2xl border-t border-gray-100 pt-6 mb-8">
              <span>{t('total')}</span>
              <span>{formatCurrency(total, 'USD', language)}</span>
            </div>
            <button className="w-full bg-dark text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
              {t('checkout')}
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </button>
            {/* Honest labeling: the cart is demo-level; there is no payment system in this version. */}
            <p className="mt-4 text-xs text-amber-600 flex items-start gap-2 text-start">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              {t('checkoutDemoNotice')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}