import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, MessageSquare, CreditCard, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { Product3DViewer } from '../components/3d/Product3DViewer';
import { Product3DThumb } from '../components/3d/Product3DThumb';
import { DEMO_PRODUCTS, type Product } from '../data/demoProducts';
import { useAppStore } from '../store/useAppStore';
import { productService } from '../services/api';
import { mapBackendProduct } from '../lib/mappers';
import { dealProducts, discountPercent, mergeCatalog } from '../lib/catalog';
import { pickLocalized } from '../lib/i18n';

/** The animated shopping basket shown in the hero. */
const HERO_MODEL_URL = '/models/cover_basket/loqta-cart-1.gltf';

const CATEGORY_LINKS = [
  {
    slug: 'laptops',
    en: 'Laptops', ar: 'لابتوبات',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
  },
  {
    slug: 'smartphones',
    en: 'Smartphones', ar: 'هواتف',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  },
  {
    slug: 'headphones',
    en: 'Headphones', ar: 'سماعات',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  },
  {
    slug: 'monitors',
    en: 'Monitors', ar: 'شاشات',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80',
  },
  {
    slug: 'cameras',
    en: 'Cameras', ar: 'كاميرات',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
  },
  {
    slug: 'gaming',
    en: 'Gaming', ar: 'أجهزة ألعاب',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80',
  },
];

/** Demo customer stories for the testimonial carousel (clearly marked as samples in the UI). */
const TESTIMONIALS = [
  {
    name: { en: 'Sarah M.', ar: 'سارة م.' },
    roleKey: 'verifiedBuyer' as const,
    quote: {
      en: 'I ordered the headphones after checking them in 3D first. They arrived exactly as shown, and delivery was faster than I expected.',
      ar: 'طلبت السماعات بعد ما فحصتها بالمجسّم ثلاثي الأبعاد. وصلت مطابقة تمامًا لما رأيت، والتوصيل أسرع من المتوقع.',
    },
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
    initials: 'SM',
  },
  {
    name: { en: 'Omar K.', ar: 'عمر ك.' },
    roleKey: 'verifiedBuyer' as const,
    quote: {
      en: 'Spinning the console in 3D before paying saved me from guessing. The product arrived matching every detail I saw on the page.',
      ar: 'تدوير الجهاز ثلاثي الأبعاد قبل الدفع وفّر عليّ أي تخمين. وصل المنتج مطابقًا لكل التفاصيل التي رأيتها في الصفحة.',
    },
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    initials: 'OK',
  },
  {
    name: { en: 'Layla A.', ar: 'ليلى ع.' },
    roleKey: 'verifiedBuyer' as const,
    quote: {
      en: 'Clear prices, quick support, and the 3D preview is genuinely useful. Loqta became my first stop for electronics.',
      ar: 'أسعار واضحة ودعم سريع، ومعاينة المجسّم مفيدة فعلًا. صارت لُقطة وجهتي الأولى للأجهزة الإلكترونية.',
    },
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80',
    initials: 'LA',
  },
];

export function Home() {
  const { t, language } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bestselling' | 'new' | 'brands'>('bestselling');
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      try {
        const response = await productService.getProducts({ pageSize: 100 });
        const items = (response.data ?? []).map(mapBackendProduct).filter((item) => Boolean(item.modelUrl));
        if (cancelled) return;
        setProducts(items.length > 0 ? mergeCatalog(items) : DEMO_PRODUCTS);
      } catch {
        if (!cancelled) setProducts(DEMO_PRODUCTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  const weeklyPopular = products.slice(0, 4);
  const bestDeals = products.slice(0, 8);

  return (
    <div className="flex flex-col bg-cream">
      {/* HERO */}
      <section className="container mx-auto px-4 pt-6">
        <div className="relative rounded-3xl overflow-hidden bg-primary-100">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-200/60 via-primary-100/40 to-transparent" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-8 md:p-14 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-primary-900 leading-tight mb-4 tracking-tight text-balance">
                {t('heroTitle')}
              </h1>
              <p className="text-sm md:text-base text-primary-800/80 mb-6 max-w-md">
                {t('heroSubtitle')}
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-primary-800 transition shadow-md"
              >
                {t('shopNow')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="relative h-64 md:h-96">
              <Product3DViewer
                modelUrl={HERO_MODEL_URL}
                productName={t('heroTitle')}
                className="w-full h-full overflow-hidden relative"
                showReset={false}
                interactive={false}
                alwaysRotate
                zoom={0.72}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 mt-12">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-5">{t('shopByCategories')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORY_LINKS.map((c) => (
            <Link
              key={c.slug}
              to={`/products?category=${c.slug}`}
              className="relative aspect-square rounded-2xl overflow-hidden group"
            >
              <img
                src={c.image}
                alt={c.en}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <span className="absolute bottom-3 start-3 end-3 text-white font-bold text-sm text-center">
                {language === 'ar' ? c.ar : c.en}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* WEEKLY POPULAR */}
      <section className="container mx-auto px-4 mt-12">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-black text-gray-900">{t('weeklyPopular')}</h2>
          <Link to="/products" className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1">
            {t('viewAll')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading
            ? [1, 2, 3, 4].map((i) => <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-2xl" />)
            : weeklyPopular.map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </section>

      {/* GET UP TO 70% OFF — real 3D deals */}
      <section className="container mx-auto px-4 mt-12">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-5">{t('getUpTo70')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dealProducts().map((item) => {
            const name = pickLocalized(language, item.name, item.nameAr);
            const discount = discountPercent(item);
            return (
              <Link
                key={item.id}
                to={`/products/${item.slug ?? item.id}`}
                className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  <Product3DThumb modelUrl={item.modelUrl} image={item.image} alt={name} />
                  {discount > 0 && (
                    <span className="absolute top-3 start-3 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                      -{discount}%
                    </span>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-gray-900">{name}</p>
                  <span className="shrink-0 p-1.5 bg-primary-50 text-primary-600 rounded-md group-hover:bg-primary-600 group-hover:text-white transition">
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TODAY'S BEST DEALS */}
      <section className="container mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xl md:text-2xl font-black text-gray-900">{t('todayBestDeals')}</h2>
          <Link to="/products" className="text-sm font-semibold text-primary-700 bg-primary-50 px-4 py-1.5 rounded-full hover:bg-primary-100 transition">
            {t('seeAll')}
          </Link>
        </div>

        <div className="flex gap-1 mb-5 border-b border-gray-200">
          {[
            { key: 'bestselling', label: t('bestselling') },
            { key: 'new', label: t('newArrivals') },
            { key: 'brands', label: t('brands') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                activeTab === tab.key
                  ? 'text-primary-700 border-primary-700'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading
            ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-72 bg-gray-200 animate-pulse rounded-2xl" />)
            : bestDeals.map((p) => <ProductCard key={p.id} product={p} />)
          }
        </div>
      </section>

      {/* 10% CASHBACK BANNER */}
      <section className="container mx-auto px-4 mt-12">
        <div className="relative rounded-3xl overflow-hidden bg-primary-100 p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-200/70 to-transparent" />
          <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-primary-900 mb-4 text-balance">
                {t('get10Cashback')}
              </h2>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-primary-700 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary-800 transition"
              >
                {t('learnMore')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
            <div className="relative h-48 md:h-56">
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"
                alt="Cashback"
                className="w-full h-full object-contain drop-shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — working bilingual carousel */}
      <section className="container mx-auto px-4 mt-16">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6">{t('whatClientsSay')}</h2>
        {(() => {
          const item = TESTIMONIALS[testimonialIndex];
          const goTo = (delta: number) =>
            setTestimonialIndex((i) => (i + delta + TESTIMONIALS.length) % TESTIMONIALS.length);
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-white rounded-3xl border border-gray-100 p-6 md:p-8">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={item.image}
                  alt={pickLocalized(language, item.name.en, item.name.ar)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goTo(-1)}
                      aria-label={t('previous')}
                      className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo(1)}
                      aria-label={t('next')}
                      className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4 text-sm md:text-base">
                  {pickLocalized(language, item.quote.en, item.quote.ar)}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      {pickLocalized(language, item.name.en, item.name.ar)}
                    </p>
                    <p className="text-xs text-gray-500">{t(item.roleKey)}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mt-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-4">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTestimonialIndex(i)}
                      aria-label={`${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        i === testimonialIndex ? 'w-6 bg-primary-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-4">{t('testimonialsDemo')}</p>
              </div>
            </div>
          );
        })()}
      </section>

      {/* SERVICES */}
      <section className="container mx-auto px-4 mt-16">
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6">{t('servicesTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <MessageSquare className="w-6 h-6" />,
              image: 'https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=600&q=80',
              label: t('faqService'),
            },
            {
              icon: <CreditCard className="w-6 h-6" />,
              image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80',
              label: t('paymentService'),
            },
            {
              icon: <Truck className="w-6 h-6" />,
              image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80',
              label: t('deliveryService'),
            },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition">
              <div className="aspect-[16/9] bg-gray-50 overflow-hidden">
                <img src={s.image} alt={s.label} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  {s.icon}
                </span>
                <p className="font-bold text-sm text-gray-900">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container mx-auto px-4 mt-16 mb-8">
        <div className="bg-primary-100 rounded-3xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-start">
              <h2 className="text-xl md:text-2xl font-black text-primary-900 mb-1">{t('newsletter')}</h2>
              <p className="text-sm text-primary-800/80">{t('newsletterDesc')}</p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full md:w-auto bg-white rounded-full p-1 shadow-sm max-w-md"
            >
              <input
                type="email"
                required
                placeholder={t('emailPlaceholder')}
                className="flex-1 min-w-0 px-4 py-2 text-sm bg-transparent focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary-700 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-primary-800 transition whitespace-nowrap"
              >
                {t('subscribeNow')}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}