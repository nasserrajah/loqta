import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, SearchX, AlertTriangle, X } from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { useAppStore } from '../store/useAppStore';
import { productService, categoryService } from '../services/api';
import { mapBackendProduct } from '../lib/mappers';
import { mergeCatalog } from '../lib/catalog';
import { translateCategory } from '../lib/catalogAr';
import { DEMO_PRODUCTS, type Product } from '../data/demoProducts';
import type { CategoryDto, ProductListQuery, CategoriesResponse } from '../services/types';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

/** The six storefront categories. True data comes from GET /categories. */
const FALLBACK_CATEGORIES: CategoryDto[] = [
  { id: 'laptops', name: 'Laptops and Computers', slug: 'laptops' },
  { id: 'smartphones', name: 'Smartphones', slug: 'smartphones' },
  { id: 'headphones', name: 'Headphones and Earbuds', slug: 'headphones' },
  { id: 'monitors', name: 'Monitors', slug: 'monitors' },
  { id: 'cameras', name: 'Cameras', slug: 'cameras' },
  { id: 'gaming', name: 'Gaming Devices', slug: 'gaming' },
];

function filterAndSort(
  products: Product[],
  search: string,
  categoryName: string,
  sort: string,
): Product[] {
  let result = products;
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.nameAr ?? '').includes(search),
    );
  }
  if (categoryName) {
    result = result.filter(
      (p) => p.category.toLowerCase() === categoryName.toLowerCase(),
    );
  }
  switch (sort) {
    case 'price_asc':
      result = [...result].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      break;
    case 'price_desc':
      result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      break;
    case 'name_asc':
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // Demo array is already newest-first.
      break;
  }
  return result;
}

export function Products() {
  const { t, language } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const search = searchInput.trim();
  const category = searchParams.get('category') ?? '';
  const sort = (searchParams.get('sort') as ProductListQuery['sort']) ?? 'newest';
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<CategoriesResponse>(FALLBACK_CATEGORIES);

  // Debounce the search input so typing does not fire a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (search) next.set('q', search);
        else next.delete('q');
        return next;
      }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Load category facets from the API, fall back to the storefront set.
  useEffect(() => {
    let cancelled = false;
    categoryService
      .list()
      .then((list) => {
        if (!cancelled && list.length > 0) setCategories(list);
      })
      .catch(() => {
        // FALLBACK_CATEGORIES stay active.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the catalog once. The "3D only" filter, the local deal items, search,
  // category and sorting are all applied client-side; the API call requests the
  // full catalog at once (pageSize 100).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    productService
      .getProducts({ page: 1, pageSize: 100, sort: 'newest' })
      .then((response) => {
        if (cancelled) return;
        const apiItems = (response.data ?? [])
          .map(mapBackendProduct)
          .filter((item) => Boolean(item.modelUrl));
        if (apiItems.length === 0) {
          // Backend reachable but nothing has a 3D model — show the demo
          // catalog so the storefront never looks broken.
          setProducts(DEMO_PRODUCTS);
          setIsDemoMode(true);
        } else {
          setProducts(mergeCatalog(apiItems));
          setIsDemoMode(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setProducts(DEMO_PRODUCTS);
        setIsDemoMode(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategoryName = useMemo(
    () => categories.find((c) => c.slug === category)?.name ?? '',
    [categories, category],
  );

  const filtered = useMemo(
    () => filterAndSort(products, search, activeCategoryName, sort ?? 'newest'),
    [products, search, activeCategoryName, sort],
  );

  const visibleProducts = filtered.slice(0, page * PAGE_SIZE);
  const hasNextPage = visibleProducts.length < filtered.length;

  const activeFilterLabel = useMemo(() => {
    const parts: string[] = [];
    if (category) {
      const label =
        language === 'ar'
          ? translateCategory(activeCategoryName) ?? activeCategoryName
          : activeCategoryName;
      parts.push(`${t('filterByCategory')}: ${label || category}`);
    }
    if (search) parts.push(`"${search}"`);
    return parts.join(' · ');
  }, [category, search, t, language, activeCategoryName]);

  const hasDemoData = products.some((p) => p.isDemo);

  const setCategory = (slug: string) => {
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (slug) next.set('category', slug);
      else next.delete('category');
      return next;
    }, { replace: true });
  };

  const setSort = (value: string) => {
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'newest') next.set('sort', value);
      else next.delete('sort');
      return next;
    }, { replace: true });
  };

  const clearFilters = () => {
    setSearchInput('');
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const loadingSkeleton = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-2xl"></div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-dark">{t('products')}</h1>
        {isDemoMode && !loading && (
          <p className="mt-2 text-sm text-amber-600 flex items-center gap-2" role="status">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {t('demoNotice')}
          </p>
        )}
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="w-full ps-10 pe-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition"
          />
          <SlidersHorizontal className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
              aria-label={t('clearFilters')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label={t('sort')}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-sm font-medium"
        >
          <option value="newest">{t('sortNewest')}</option>
          <option value="price_asc">{t('sortPriceAsc')}</option>
          <option value="price_desc">{t('sortPriceDesc')}</option>
          <option value="name_asc">{t('sortNameAsc')}</option>
        </select>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label={t('filterByCategory')}>
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            !category ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {t('allCategories')}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.slug)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              category === c.slug ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {language === 'ar' ? translateCategory(c.slug) ?? c.name : c.name}
          </button>
        ))}
      </div>

      {activeFilterLabel && !loading && (
        <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
          <span>
            {filtered.length} {t('results')} · {activeFilterLabel}
          </span>
          <button onClick={clearFilters} className="text-primary-600 font-semibold hover:underline">
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        loadingSkeleton
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <SearchX className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-black text-dark mb-2">{t('noProducts')}</h2>
          <p className="text-gray-500 mb-6">{t('noProductsDesc')}</p>
          <button onClick={clearFilters} className="text-primary-600 font-bold hover:underline">
            {t('clearFilters')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="flex justify-center mt-10">
            {hasNextPage && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="px-8 py-3 bg-white border border-gray-200 text-primary-600 font-bold rounded-full hover:bg-primary-50 transition"
              >
                {t('loadMore')}
              </button>
            )}
          </div>

          {hasDemoData && (
            <p className="mt-10 text-center text-xs text-gray-400">
              {language === 'ar'
                ? 'المنتجات المعروضة بيانات تجريبية للعرض فقط — لا تدّعي أنها موجودة في قاعدة البيانات الفعلية.'
                : 'Displayed items are demo reference data for presentation only — they are not claimed to exist in the live database.'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
