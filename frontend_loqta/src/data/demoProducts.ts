import { resolveModelUrl } from './modelRegistry';

export interface Product {
  id: string;
  /** Backend lookup key — the API only resolves products by slug. */
  slug?: string;
  name: string;
  description: string;
  image: string;
  modelUrl?: string;
  category: string;
  price?: number;
  currency?: string;
  inStock: boolean;
  isDemo: boolean;
  specifications?: Record<string, string>;
}

/**
 * Demo catalog — the reference products that have a real 3D model.
 *
 * 3D models come from src/data/modelRegistry.ts (GLTF bundles extracted under
 * public/models/). Only items with a working model are kept here so every
 * product page can offer the 3D viewer.
 */
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-2',
    name: 'ASUS ROG Gaming Laptop',
    description: 'High-performance gaming laptop.',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&q=80',
    modelUrl: resolveModelUrl('ASUS ROG Gaming Laptop'),
    category: 'Laptops',
    price: 1499.00,
    currency: 'USD',
    inStock: true,
    isDemo: true,
  },
  {
    id: 'demo-3',
    name: 'iPhone',
    description: 'The latest smartphone from Apple.',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&q=80',
    modelUrl: resolveModelUrl('iPhone'),
    category: 'Smartphones',
    price: 999.00,
    currency: 'USD',
    inStock: true,
    isDemo: true,
  },
  {
    id: 'demo-4',
    name: 'Samsung Galaxy',
    description: 'Flagship Android smartphone.',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&q=80',
    modelUrl: resolveModelUrl('Samsung Galaxy'),
    category: 'Smartphones',
    price: 899.00,
    currency: 'USD',
    inStock: true,
    isDemo: true,
  },
  {
    id: 'demo-5',
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise-canceling headphones.',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80',
    modelUrl: resolveModelUrl('Sony WH-1000XM5'),
    category: 'Audio',
    price: 399.00,
    currency: 'USD',
    inStock: true,
    isDemo: true,
  },
  {
    id: 'demo-7',
    name: 'Samsung Odyssey Monitor',
    description: 'Immersive curved gaming monitor.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
    modelUrl: resolveModelUrl('Samsung Odyssey Monitor'),
    category: 'Monitors',
    price: 699.00,
    currency: 'USD',
    inStock: true,
    isDemo: true,
  },
  {
    id: 'demo-8',
    name: 'LG UltraWide Monitor',
    description: 'Multi-tasking ultrawide monitor.',
    image: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=500&q=80',
    modelUrl: resolveModelUrl('LG UltraWide Monitor'),
    category: 'Monitors',
    price: 499.00,
    currency: 'USD',
    inStock: true,
    isDemo: true,
  },
  {
    id: 'demo-9',
    name: 'Sony Alpha Camera',
    description: 'Professional mirrorless camera.',
    image: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=500&q=80',
    modelUrl: resolveModelUrl('Sony Alpha Camera'),
    category: 'Cameras',
    price: 1999.00,
    currency: 'USD',
    inStock: true,
    isDemo: true,
  },
  {
    id: 'demo-10',
    name: 'PlayStation 5',
    description: 'Next-gen gaming console.',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&q=80',
    modelUrl: resolveModelUrl('PlayStation 5'),
    category: 'Gaming',
    price: 499.00,
    currency: 'USD',
    inStock: true,
    isDemo: true,
  }
];
