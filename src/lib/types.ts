export interface Product {
  id: string;
  title: string;
  description: string;
  brand: string;
  category_id: string | null;
  sku: string | null;
  tags: string[];
  images: string[];
  price: number;
  promotional_price: number | null;
  store_id: string;
  created_at: string;
  status: boolean;
  type: 'simple' | 'variable' | 'kit' | 'manufactured' | 'service';
  parent_id?: string;
  attributes?: Record<string, any>;
  variation_attributes?: string[];
  children?: Product[];
  components?: Array<{
    id: string;
    title: string;
    sku?: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
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
  description: string | null;
  logo_url: string | null;
  
  // Cores e tema
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_background: string;
  background: string;
  border_color: string;
  surface_color: string;
  
  // Configurações do cabeçalho
  header_style: 'solid' | 'gradient' | 'image';
  header_height: string;
  header_image: string | null;
  header_gradient: string;
  header_overlay_opacity: string;
  header_alignment: 'left' | 'center' | 'right';
  header_visibility: {
    logo: boolean;
    title: boolean;
    description: boolean;
    socialLinks: boolean;
  };
  
  // Configurações de tipografia
  logo_size: string;
  title_size: string;
  description_size: string;
  title_font: string;
  body_font: string;
  
  // Configurações de layout
  product_card_style: 'default' | 'compact' | 'minimal';
  grid_columns: string;
  grid_gap: string;
  container_width: string;
  
  // Configurações sociais
  social_links: Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>;
  social_settings?: {
    contactsPosition: 'above' | 'below';
    displayFormat: 'username' | 'network';
  };

  // Informações da assinatura
  subscription: {
    plan_type: 'starter' | 'pro' | 'enterprise';
    active: boolean;
    status: string;
    trial_ends_at: string | null;
    next_payment_at: string | null;
  };

  // Contadores e limites
  products_count: number;
  product_limit: number;
  categories_count: number;
  category_limit: number;
}

export interface StoreHeaderCustomization {
  headerStyle: 'solid' | 'gradient' | 'image';
  headerHeight: string;
  headerImage: string | null;
  headerGradient: string;
  headerAlignment: 'left' | 'center' | 'right';
  headerOverlayOpacity: string;
  headerVisibility: {
    logo: boolean;
    title: boolean;
    description: boolean;
    socialLinks: boolean;
  };
  logoSize: string;
  titleSize: string;
  descriptionSize: string;
  titleFont: string;
  bodyFont: string;
  socialSettings?: {
    contactsPosition: 'above' | 'below';
    displayFormat: 'username' | 'network';
  };
  headerBackground: string;
  surfaceColor?: string;
  borderColor?: string;
  preview?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  store_id: string;
  description?: string | null;
  children?: Category[];
  level?: number;
}
