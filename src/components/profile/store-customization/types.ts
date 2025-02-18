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
  titleFont: 'sans' | 'serif' | 'mono' | 'display';
  bodyFont: 'sans' | 'serif' | 'mono';

  // Layout Settings
  productCardStyle: 'default' | 'compact' | 'minimal';
  gridColumns: '2' | '3' | '4' | '5';
  gridGap: string;
  containerWidth: 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';

  // Social & Contact
  socialLinks: Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>;

  // Social Settings
  socialSettings?: {
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
  icon: React.FC<{ className?: string }>;
}

export interface StoreCustomizationProps {
  store: Store;
  onUpdate: () => void;
}
