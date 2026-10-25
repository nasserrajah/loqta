import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { categoryService } from '../services/api';
import type { CategoryDto, CategoriesResponse } from '../services/types';

const FALLBACK_CATEGORIES: CategoryDto[] = [
  { id: 'laptops', name: 'Laptops and Computers', slug: 'laptops' },
  { id: 'smartphones', name: 'Smartphones', slug: 'smartphones' },
  { id: 'headphones', name: 'Headphones and Earbuds', slug: 'headphones' },
  { id: 'monitors', name: 'Monitors', slug: 'monitors' },
  { id: 'cameras', name: 'Cameras', slug: 'cameras' },
  { id: 'gaming', name: 'Gaming Devices', slug: 'gaming' },
];

/** Image per category slug — visual identity matching the storefront. */
const CATEGORY_IMAGES: Record<string, string> = {
  laptops: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
  smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  monitors: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
  cameras: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80',
  gaming: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80',
};

/** Arabic category names for fallback data. */
const CATEGORY_NAMES_AR: Record<string, string> = {
  laptops: 'لابتوبات وحواسيب',
  smartphones: 'هواتف ذكية',
  headphones: 'سماعات',
  monitors: 'شاشات',
  cameras: 'كاميرات',
  gaming: 'أجهزة ألعاب',
};

function imageFor(slug: string): string {
  const key = Object.keys(CATEGORY_IMAGES).find((k) => slug.toLowerCase().includes(k));
  return key
    ? CATEGORY_IMAGES[key]
    : 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80';
}

function nameArFor(category: CategoryDto, language: string): string {
  if (language === 'ar') {
    const known = CATEGORY_NAMES_AR[category.slug.toLowerCase()];
    return known ?? category.name;
  }
  return category.name;
}

export function Categories() {
  const { t, language } = useAppStore();
  const [categories, setCategories] = useState<CategoriesResponse>(FALLBACK_CATEGORIES);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .list()
      .then((list) => {
        if (cancelled) return;
        if (list.length > 0 && list.some((c) => c?.slug)) {
          setCategories(list);
          setIsDemo(false);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-cream min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <header className="mb-10">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900">
            {t('categoriesTitle')}
          </h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base">{t('categoriesDesc')}</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/3] bg-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category) => {
              const displayName = nameArFor(category, language);
              return (
                <Link
                  key={category.id ?? category.slug}
                  to={`/products?category=${encodeURIComponent(category.slug)}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 hover:shadow-lg transition-all"
                >
                  <img
                    src={imageFor(category.slug)}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                  <div className="absolute top-3 end-3 w-9 h-9 bg-white/90 rounded-lg flex items-center justify-center text-primary-700 opacity-0 group-hover:opacity-100 transition">
                    <LayoutGrid className="w-4 h-4" />
                  </div>

                  <div className="absolute bottom-4 start-4 end-4">
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">
                      {displayName}
                    </h3>
                    {category.description && (
                      <p className="text-white/80 text-xs mt-1 line-clamp-1">
                        {category.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-white/90 font-semibold mt-2 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {t('exploreProducts')} →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {isDemo && !loading && (
          <p className="mt-8 text-center text-xs text-gray-400">{t('demoNotice')}</p>
        )}
      </div>
    </div>
  );
}