import React, { createContext, useContext, useState } from 'react';
import { StoreFormData, StoreCustomizationContextType } from './types';
import { Store } from '../../../lib/types';
import { supabase } from '../../../lib/supabase';

const StoreCustomizationContext = createContext<StoreCustomizationContextType | null>(null);

interface ProviderProps {
  children: (context: StoreCustomizationContextType) => React.ReactNode;
  store: Store;
  onUpdate: () => void;
}

const DEFAULT_VALUES = {
  titleFont: 'sans' as const,
  bodyFont: 'sans' as const,
  gridColumns: '4' as const,
  containerWidth: 'max-w-7xl' as const,
  productCardStyle: 'default' as const,
  headerStyle: 'solid' as const,
  headerAlignment: 'center' as const,
  socialSettings: {
    contactsPosition: 'above' as const,
    displayFormat: 'username' as const
  }
};

export function StoreCustomizationProvider({ children, store, onUpdate }: ProviderProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    name: store.name,
    slug: store.slug,
    description: store.description || '',
    logoUrl: store.logo_url || '',
    primaryColor: store.primary_color || '#000000',
    secondaryColor: store.secondary_color || '#ffffff',
    accentColor: store.accent_color || '#0066FF',
    headerBackground: store.header_background || '#ffffff',
    allowThemeToggle: store.allow_theme_toggle ?? true,
    headerStyle: (store.header_style as StoreFormData['headerStyle']) || DEFAULT_VALUES.headerStyle,
    headerHeight: store.header_height?.replace('px', '') || '400',
    headerImage: store.header_image || '',
    headerGradient: store.header_gradient || 'to bottom',
    headerOverlayOpacity: store.header_overlay_opacity || '50',
    headerAlignment: (store.header_alignment as StoreFormData['headerAlignment']) || DEFAULT_VALUES.headerAlignment,
    headerVisibility: store.header_visibility || {
      logo: true,
      title: true,
      description: true,
      socialLinks: true
    },
    logoSize: store.logo_size?.replace('px', '') || '160',
    titleSize: store.title_size?.replace('px', '') || '48',
    descriptionSize: store.description_size?.replace('px', '') || '18',
    titleFont: (store.title_font as StoreFormData['titleFont']) || DEFAULT_VALUES.titleFont,
    bodyFont: (store.body_font as StoreFormData['bodyFont']) || DEFAULT_VALUES.bodyFont,
    productCardStyle: (store.product_card_style as StoreFormData['productCardStyle']) || DEFAULT_VALUES.productCardStyle,
    gridColumns: (store.grid_columns as StoreFormData['gridColumns']) || DEFAULT_VALUES.gridColumns,
    gridGap: store.grid_gap || '24',
    containerWidth: (store.container_width as StoreFormData['containerWidth']) || DEFAULT_VALUES.containerWidth,
    socialLinks: store.social_links || [],
    socialSettings: store.social_settings || DEFAULT_VALUES.socialSettings
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateFormData = (updates: Partial<StoreFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const onSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Verificar se o slug já existe
      const { data: existingStores, error: checkError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', formData.slug)
        .neq('id', store.id);

      if (checkError) throw checkError;
      if (existingStores && existingStores.length > 0) {
        throw new Error('Esta URL já está em uso. Por favor, escolha outra.');
      }

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          logo_url: formData.logoUrl || null,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          accent_color: formData.accentColor,
          header_background: formData.headerBackground,
          allow_theme_toggle: formData.allowThemeToggle,
          header_style: formData.headerStyle,
          header_height: `${formData.headerHeight}px`,
          header_image: formData.headerImage || null,
          header_gradient: formData.headerGradient,
          header_overlay_opacity: formData.headerOverlayOpacity,
          header_alignment: formData.headerAlignment,
          header_visibility: formData.headerVisibility,
          logo_size: `${formData.logoSize}px`,
          title_size: `${formData.titleSize}px`,
          description_size: `${formData.descriptionSize}px`,
          title_font: formData.titleFont,
          body_font: formData.bodyFont,
          product_card_style: formData.productCardStyle,
          grid_columns: formData.gridColumns,
          grid_gap: formData.gridGap,
          container_width: formData.containerWidth,
          social_links: formData.socialLinks,
          social_settings: formData.socialSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      if (updateError) throw updateError;

      setSuccess('Loja atualizada com sucesso!');
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    formData,
    updateFormData,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    onSave
  };

  return (
    <StoreCustomizationContext.Provider value={value}>
      {children(value)}
    </StoreCustomizationContext.Provider>
  );
}

export const useStoreCustomization = () => {
  const context = useContext(StoreCustomizationContext);
  if (!context) {
    throw new Error('useStoreCustomization must be used within StoreCustomizationProvider');
  }
  return context;
};
