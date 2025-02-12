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
  type: 'simple' | 'variable' | 'kit' | 'manufactured' | 'service';
  parent_id?: string;
  attributes?: Record<string, any>;
  variation_attributes?: string[];
  // Campos específicos para serviços
  duration?: string;
  availability?: {
    weekdays: string[];
    hours: {
      start: string;
      end: string;
    }[];
  };
  service_location?: string;
  service_modality?: 'presential' | 'online' | 'hybrid';
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
  social_settings?: {
    contacts_position: 'above' | 'below';
    display_format: 'username' | 'network';
  };
}