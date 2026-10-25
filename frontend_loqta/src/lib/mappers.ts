import { Product } from '../data/demoProducts';
import { resolveModelUrl } from '../data/modelRegistry';
import { isDisplayableImage } from './images';
import { translateCategory, translateProductName } from './catalogAr';

/** Picks the primary image the API really provides (never a generated one). */
function pickImage(item: any): string {
  const candidates = [
    item.primaryImageUrl,
    item.imageUrl,
    ...(Array.isArray(item.images) ? item.images.map((image: any) => image?.url) : []),
  ];
  const found = candidates.find((url) => isDisplayableImage(url));
  return typeof found === 'string' ? found : '';
}

export function mapBackendProduct(item: any): Product {
  let specifications: Record<string, string> | null = null;
  let specificationsAr: Record<string, string> | undefined = undefined;
  if (item.specifications) {
    if (typeof item.specifications === 'string') {
      try {
        specifications = JSON.parse(item.specifications);
      } catch {
        specifications = null;
      }
    } else {
      specifications = item.specifications;
    }
  }
  // Optional Arabic specifications if provided by backend
  if (item.specificationsAr && typeof item.specificationsAr === 'object') {
    specificationsAr = item.specificationsAr;
  }

  const modelUrl =
    item.modelUrl ||
    item.model3dUrl ||
    item.model ||
    item.glbUrl ||
    item.gltfUrl ||
    item.assetUrl ||
    resolveModelUrl(item.name ?? '') ||
    undefined;

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    // The API leaves nameAr null: fall back to the storefront translation.
    nameAr: item.nameAr ?? item.name_ar ?? translateProductName(item.name),
    description: item.description || 'No description available.',
    descriptionAr: item.descriptionAr ?? item.description_ar ?? undefined,
    image: pickImage(item),
    modelUrl,
    category: item.category?.name || 'General',
    categoryAr:
      item.category?.nameAr ??
      item.category?.name_ar ??
      translateCategory(item.category?.slug ?? item.category?.name),
    price: parseFloat(item.price) || 0,
    currency: item.currency || 'USD',
    originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
    inStock: item.inStock ?? item.stockQuantity > 0,
    isDemo: false,
    rating: typeof item.rating === 'number' ? item.rating : undefined,
    specifications: specifications ?? undefined,
    specificationsAr,
  };
}