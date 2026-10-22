export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandWithProductCount extends Brand {
  productCount: number;
}
