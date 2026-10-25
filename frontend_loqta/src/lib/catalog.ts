import { DEMO_PRODUCTS, type Product } from '../data/demoProducts';

/**
 * Products that only exist as demo 3D offers: they power the "up to 70% off"
 * row and are also listed in the catalog with a "Demo Data" badge.
 */
export const DEAL_PRODUCT_IDS = ['demo-10', 'demo-11', 'demo-12', 'demo-13'];

export function dealProducts(): Product[] {
  return DEAL_PRODUCT_IDS
    .map((id) => DEMO_PRODUCTS.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
}

/** Discount percentage for a demo offer (0 when there is no original price). */
export function discountPercent(product: Product): number {
  if (!product.originalPrice || !product.price) return 0;
  if (product.originalPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.originalPrice) * 100);
}

/**
 * Live API catalog + the local 3D deal items.
 * Deals are skipped when the live catalog already contains the same id/slug.
 */
export function mergeCatalog(apiProducts: Product[]): Product[] {
  const ids = new Set(apiProducts.map((product) => product.id));
  const slugs = new Set(
    apiProducts.map((product) => product.slug).filter((slug): slug is string => Boolean(slug)),
  );
  const extras = dealProducts().filter(
    (product) =>
      !ids.has(product.id) && (!product.slug || !slugs.has(product.slug)),
  );
  return [...apiProducts, ...extras];
}
