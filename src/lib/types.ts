export interface Product {
  id: string;
  title: string;
  description: string;
  brand: string;
  category_id: string;
  sku: string | null;
  tags: string[];
  images: string[];
  price: number;
  promotional_price: number | null;
  store_id: string;
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  subscription: {
    plan_type: 'free' | 'basic' | 'plus';
    active: boolean;
    expires_at: string | null;
  };
  products_count: number;
  product_limit: number;
  categories_count: number;
  category_limit: number;
}