import { Store } from '../../../lib/types';

export interface StoreFormData {
  // General Settings
  name: string;
  slug: string;
  description: string;
  logoUrl: string;

  // Theme Settings
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Header Settings
  headerStyle: 'solid' | 'gradient' | 'image';
  headerHeight: string;
  headerImage: string;
  headerGradient: string;
  headerOverlayOpacity: string;
  headerAlignment: 'left' | 'center' | 'right';
  headerVisibility: {
    logo: boolean;
    title: boolean;
    description: boolean;
    socialLinks: boolean;
  };

  // Typography Settings
  logoSize: string;
  titleSize: string;
  descriptionSize: string;
  titleFont: string;
  bodyFont: string;

  // Layout Settings
  productCardStyle: 'default' | 'compact' | 'minimal';
  gridColumns: string;
  gridGap: string;
  containerWidth: string;

  // Social & Contact
  socialLinks: Array<{
    type: string;
    url: string;
  }>;

  // Social Settings
  socialSettings: {
    contactsPosition: 'above' | 'below';
    displayFormat: 'username' | 'network';
  };
}

export interface StoreCustomizationContextType {
  formData: StoreFormData;
  updateFormData: (updates: Partial<StoreFormData>) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  success: string | null;
  setSuccess: (success: string | null) => void;
  onSave: () => Promise<void>;
}

export interface Section {
  id: string;
  title: string;
  icon: any;
}

export interface StoreCustomizationProps {
  store: Store;
  onUpdate: () => void;
}