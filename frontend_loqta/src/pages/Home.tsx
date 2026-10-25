import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Box, Heart } from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { DEMO_PRODUCTS, type Product } from '../data/demoProducts';
import { useAppStore } from '../store/useAppStore';
import { productService } from '../services/api';
import { mapBackendProduct } from '../lib/mappers';
import { Laptop, Smartphone, Headphones, Monitor, Camera, Gamepad2 } from 'lucide-react';

const CATEGORY_LINKS = [
  { slug: 'laptops', en: 'Laptops', ar: 'لابتوبات', Icon: Laptop },
  { slug: 'smartphones', en: 'Smartphones', ar: 'هواتف', Icon: Smartphone },
  { slug: 'headphones', en: 'Headphones', ar: 'سماعات', Icon: Headphones },
  { slug: 'monitors', en: 'Monitors', ar: 'شاشات', Icon: Monitor },
  { slug: 'cameras', en: 'Cameras', ar: 'كاميرات', Icon: Camera },
  { slug: 'gaming', en: 'Gaming', ar: 'أجهزة ألعاب', Icon: Gamepad2 },
];

export function Home() {
  const { t, language } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApiData, setIsApiData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      try {
        const response = await productService.getProducts({ pageSize: 100 });
        // Only products with a real 3D model are featured.
        const items = (response.data ?? []).map(mapBackendProduct).filter((item) => Boolean(item.modelUrl));
        if (cancelled) return;
        if (items.length > 0 && !items.every((p) => p.isDemo)) {
          setProducts(items.slice(0, 8));
          setIsApiData(true);
        } else {
          setProducts(DEMO_PRODUCTS);
        }
      } catch (error) {
        if (!cancelled) {
          // Backend unreachable — expose the 3D demo catalog.
          setProducts(DEMO_PRODUCTS);
          console.error('Product listing fell back to demo data because the API is unavailable');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = isApiData ? products.filter((p) => !p.isDemo).slice(0, 4) : [];

  return (
    <div className="flex flex-col pb-20 bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative bg-dark text-white pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550009158-9ebf69173e03')] bg-cover bg-center opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 rounded-full blur-[120px] opacity-30"></div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-6 backdrop-blur-md">
            ✨ <Box className="inline w-4 h-4 mx-1 -mt-1" /> 3D product inspection
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight max-w-4xl mx-auto leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">{t('heroSubtitle')}</p>
          <Link
            to="/products"
            className="inline-flex bg-white text-dark px-8 py-4 rounded-full font-black text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] items-center gap-2"
          >
            {t('shopNow')}
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {/* Categories strip */}
      <section className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORY_LINKS.map(({ slug, en, ar, Icon }) => (
            <Link
              key={slug}
              to={`/products?category=${slug}`}
              className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-white flex flex-col items-center gap-2 hover:-translate-y-1 hover:shadow-xl transition-all"
            >
              <span className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-xs md:text-sm font-bold text-dark text-center">{language === 'ar' ? ar : en}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured (only when the backend provides real flagged products) */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 mt-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-dark tracking-tight flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-accent-500" /> {t('featured')}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Products — exactly ten demo items when real data is unavailable */}
      <section className="container mx-auto px-4 mt-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl font-black text-dark tracking-tight">{t('trendingNow')}</h2>
            <p className="text-gray-500 mt-2 text-lg">{t('trendingDesc')}</p>
          </div>
          <Link to="/products" className="hidden md:flex text-primary-600 font-bold hover:underline items-center gap-1">
            {t('viewAll')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Benefits — honest, no unsupported commercial claims */}
      <section className="container mx-auto px-4 mt-24">
        <h2 className="text-3xl font-black text-dark tracking-tight mb-10 text-center">{t('benefitsTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Icon: Box, title: t('benefit1Title'), desc: t('benefit1Desc') },
            { Icon: Sparkles, title: t('benefit2Title'), desc: t('benefit2Desc') },
            { Icon: Heart, title: t('benefit3Title'), desc: t('benefit3Desc') },
          ].map(({ Icon, title, desc }, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-dark text-lg mb-1">{title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
