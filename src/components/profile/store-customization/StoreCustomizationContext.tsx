import React, { createContext, useContext, useState } from 'react';
import { StoreFormData, StoreCustomizationContextType } from './types';
import { supabase } from '../../../lib/supabase';

const StoreCustomizationContext = createContext<StoreCustomizationContextType | null>(null);

interface ProviderProps {
  children: (context: StoreCustomizationContextType) => React.ReactNode;
  store: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    header_style: string;
    header_height: string;
    header_image: string | null;
    header_gradient: string;
    header_overlay_opacity: string;
    header_alignment: string;
    logo_size: string;
    title_size: string;
    description_size: string;
    title_font: string;
    body_font: string;
    product_card_style: string;
    grid_columns: string;
    grid_gap: string;
    container_width: string;
    social_links: Array<{
      type: string;
      url: string;
    }>;
  };
  onUpdate: () => void;
}

export function StoreCustomizationProvider({ children, store, onUpdate }: ProviderProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    name: store.name,
    slug: store.slug,
    description: store.description || '',
    logoUrl: store.logo_url || '',
    primaryColor: store.primary_color || '#000000',
    secondaryColor: store.secondary_color || '#ffffff',
    accentColor: store.accent_color || '#0066FF',
    headerStyle: store.header_style as any || 'solid',
    headerHeight: store.header_height?.replace('px', '') || '400',
    headerImage: store.header_image || '',
    headerGradient: store.header_gradient || 'to bottom',
    headerOverlayOpacity: store.header_overlay_opacity || '50',
    headerAlignment: store.header_alignment as any || 'center',
    headerVisibility: {
      logo: true,
      title: true,
      description: true,
      socialLinks: true
    },
    logoSize: store.logo_size?.replace('px', '') || '160',
    titleSize: store.title_size?.replace('px', '') || '48',
    descriptionSize: store.description_size?.replace('px', '') || '18',
    titleFont: store.title_font || 'sans',
    bodyFont: store.body_font || 'sans',
    productCardStyle: store.product_card_style as any || 'default',
    gridColumns: store.grid_columns || '4',
    gridGap: store.grid_gap || '24',
    containerWidth: store.container_width || 'max-w-7xl',
    socialLinks: store.social_links || [],
    socialSettings: {
      contactsPosition: store.social_settings?.contacts_position || 'above',
      displayFormat: store.social_settings?.display_format || 'username'
    }
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
          header_style: formData.headerStyle,
          header_height: `${formData.headerHeight}px`,
          header_image: formData.headerImage || null,
          header_gradient: formData.headerGradient,
          header_overlay_opacity: formData.headerOverlayOpacity,
          header_alignment: formData.headerAlignment,
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
          social_settings: {
            contacts_position: formData.socialSettings.contactsPosition,
            display_format: formData.socialSettings.displayFormat
          },
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