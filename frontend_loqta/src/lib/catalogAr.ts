/**
 * Arabic labels for the live catalog.
 *
 * The backend stores category names in English (`nameAr` is null) and does not
 * provide Arabic product names. This module translates *labels only* — it never
 * invents specs, prices or identifiers.
 */

/** English category name for every slug the storefront may receive. */
export const CATEGORY_NAME_BY_SLUG: Record<string, string> = {
  smartphones: 'Smartphones',
  'headphones-audio': 'Headphones & Audio',
  computers: 'Computers',
  monitors: 'Monitors',
  'cameras-photography': 'Cameras & Photography',
  'computer-accessories': 'Computer Accessories',
  'mobile-accessories': 'Mobile Accessories',
  'gaming-entertainment': 'Gaming & Entertainment',
  'smart-devices': 'Smart Devices',
  // fallback facets used by the products page before /categories answers
  laptops: 'Laptops and Computers',
  headphones: 'Headphones and Earbuds',
  cameras: 'Cameras',
  gaming: 'Gaming Devices',
};

/** Lower-cased English name -> Arabic label. */
const CATEGORY_AR: Record<string, string> = {
  smartphones: 'هواتف ذكية',
  'headphones & audio': 'سماعات وصوتيات',
  computers: 'كمبيوترات',
  monitors: 'شاشات',
  'cameras & photography': 'كاميرات وتصوير',
  'computer accessories': 'ملحقات الكمبيوتر',
  'mobile accessories': 'ملحقات الجوال',
  'gaming & entertainment': 'ألعاب وترفيه',
  'smart devices': 'أجهزة ذكية',
  'laptops and computers': 'لابتوبات وأجهزة كمبيوتر',
  'headphones and earbuds': 'سماعات وإيربودز',
  laptops: 'لابتوبات',
  headphones: 'سماعات',
  audio: 'صوتيات',
  cameras: 'كاميرات',
  gaming: 'أجهزة ألعاب',
  general: 'عام',
};

/** Returns the Arabic label for a category slug, its English name, or null. */
export function translateCategory(value?: string | null): string | undefined {
  if (!value) return undefined;
  const slug = value.trim().toLowerCase();
  const english = CATEGORY_NAME_BY_SLUG[slug] ?? value;
  return CATEGORY_AR[english.trim().toLowerCase()] ?? CATEGORY_AR[slug];
}

/**
 * Arabic display names for the product lines that ship with a 3D model.
 * Model codes (WH-1000XM5, S24, G5) are kept as-is on purpose.
 */
const PRODUCT_AR: Array<{ pattern: RegExp; ar: string }> = [
  { pattern: /iphone\s*15\s*pro/i, ar: 'آيفون 15 برو' },
  { pattern: /galaxy\s*s24\s*ultra/i, ar: 'جالاكسي S24 ألترا' },
  { pattern: /wh-?1000xm5/i, ar: 'سماعات WH-1000XM5 اللاسلكية' },
  { pattern: /playstation\s*5\s*slim/i, ar: 'جهاز بلايستيشن 5 سليم' },
  { pattern: /odyssey/i, ar: 'شاشة أوديسي G5 مقاس 32 بوصة' },
  { pattern: /ultragear/i, ar: 'شاشة ألتراجير للألعاب مقاس 27 بوصة' },
  { pattern: /alpha\s*7\s*iv/i, ar: 'كاميرا ألفا 7 IV بدون مرآة' },
];

export function translateProductName(name?: string | null): string | undefined {
  if (!name) return undefined;
  return PRODUCT_AR.find((rule) => rule.pattern.test(name))?.ar;
}
