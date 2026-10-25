import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Laptop, Smartphone, Headphones, Monitor, Camera, Gamepad2, LayoutGrid } from 'lucide-react';
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

/** Icons by fallback category id — used when the backend provides no icon data. */
const CATEGORY_ICONS: Record<string, typeof Laptop> = {
  laptops: Laptop,
  smartphones: Smartphone,
  headphones: Headphones,
  monitors: Monitor,
  cameras: Camera,
  gaming: Gamepad2,
};

function iconFor(slug: string) {
  const key = Object.keys(CATEGORY_ICONS).find((k) => slug.toLowerCase().includes(k));
  return key ? CATEGORY_ICONS[key] : LayoutGrid;
}

export function Categories() {
  const { t } = useAppStore();
  const [categories, setCategories] = useState<CategoriesResponse>(FALLBACK_CATEGORIES);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .list()
      .then((list) => {
        if (cancelled) return;
        // Only trust the API when it actually returns category data.
        if (list.length > 0 && list.some((c) => c?.slug)) {
          setCategories(list);
          setIsDemo(false);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false); // FALLBACK_CATEGORIES stay active
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-dark">{t('categoriesTitle')}</h1>
        <p className="text-gray-500 mt-2">{t('categoriesDesc')}</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = iconFor(category.slug);
            return (
              <Link
                key={category.id ?? category.slug}
                to={`/products?category=${encodeURIComponent(category.slug)}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-8 flex items-center gap-6"
              >
                <span className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <Icon className="w-8 h-8" />
                </span>
                <span>
                  <span className="block text-lg font-bold text-dark group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </span>
                  {category.description && (
                    <span className="block text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {isDemo && !loading && (
        <p className="mt-8 text-center text-xs text-gray-400">
          {t('demoNotice')}
        </p>
      )}
    </div>
  );
}
