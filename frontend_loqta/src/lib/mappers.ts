import { Product } from '../data/demoProducts';
import { resolveModelUrl } from '../data/modelRegistry';

export function mapBackendProduct(item: any): Product {
  let specifications: Record<string, string> | null = null;
  if (item.specifications) {
    // The backend can send specifications either as JSON text or as an object.
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

  const modelUrl =
    item.modelUrl ||
    item.model3dUrl ||
    item.model ||
    item.glbUrl ||
    item.gltfUrl ||
    item.assetUrl ||
    // Fall back to a locally-dropped GLB matched by product name.
    resolveModelUrl(item.name ?? '') ||
    undefined;

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description || 'No description available.',
    image: item.primaryImageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    modelUrl,
    category: item.category?.name || 'General',
    price: parseFloat(item.price) || 0,
    currency: item.currency || 'USD',
    inStock: item.inStock ?? item.stockQuantity > 0,
    isDemo: false,
    specifications: specifications ?? undefined,
  };
}
