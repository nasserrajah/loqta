export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithProductCount extends Category {
  productCount: number;
}
