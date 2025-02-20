import { Store } from '../../../lib/types';
import { ReactNode } from 'react';

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
  headerBackground: string;
  background: string;
  allowThemeToggle: boolean;

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
  socialSettings: {
    contactsPosition: 'above' | 'below';
    displayFormat: 'username' | 'network';
  };
}

interface PendingChange {
  section: string;
  value: any;
  timestamp: number;
  previousValue: any;
}

export interface PendingChanges {
  [key: string]: PendingChange;
}

export interface StoreCustomizationContextType {
  formData: StoreFormData;
  updatePreview: (updates: Partial<StoreFormData>, section: string) => void;
  loading: boolean;
  error: string | null;
  activeSection: string;
  setActiveSection: (section: string) => void;
  pendingChanges: PendingChanges;
  hasPendingChanges: (section?: string) => boolean;
  revertSectionChanges: (section: string) => void;
  saveChanges: () => Promise<boolean>;
}

export interface Section {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
}

export interface StoreCustomizationProps {
  store: Store;
  onUpdate: () => void;
  children: (context: StoreCustomizationContextType) => ReactNode;
}