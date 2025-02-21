import React, { createContext, useContext, useState, useCallback } from 'react';
import { StoreFormData, PendingChanges } from './types';
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
} as const;

// Exportando a interface do contexto
export interface StoreCustomizationContextType {
  formData: StoreFormData;
  updateFormData: (updates: Partial<StoreFormData>) => void;
  loading: boolean;
  error: string | null;
  activeSection: string;
  setActiveSection: (section: string) => void;
  pendingChanges: PendingChanges;
  hasPendingChanges: (section?: string) => boolean;
  revertSectionChanges: (section: string) => void;
  saveChanges: () => Promise<boolean>;
}

export function StoreCustomizationProvider({ children, store, onUpdate }: ProviderProps) {
  // Estado inicial do formulário
  const [formData, setFormData] = useState<StoreFormData>(() => ({
    name: store.name,
    slug: store.slug,
    description: store.description || '',
    logoUrl: store.logo_url || '',
    primaryColor: store.primary_color || '#000000',
    secondaryColor: store.secondary_color || '#ffffff',
    accentColor: store.accent_color || '#0066FF',
    headerBackground: store.header_background || '#ffffff',
    background: store.background || '#ffffff',
    allowThemeToggle: true,
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
  }));

  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [activeSection, setActiveSection] = useState<string>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para atualizar o estado do formulário sem salvar
  const updateFormData = useCallback((updates: Partial<StoreFormData>) => {
    const timestamp = Date.now();
    
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== formData[key as keyof StoreFormData]) {
          newChanges[key] = {
            section: activeSection,
            value,
            timestamp,
            previousValue: formData[key as keyof StoreFormData]
          };
        } else {
          delete newChanges[key];
        }
      });
      
      return newChanges;
    });

    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, [formData, activeSection]);

  // Função para reverter alterações de uma seção
  const revertSectionChanges = useCallback((section: string) => {
    const updatesToRevert: Partial<StoreFormData> = {};
    
    Object.entries(pendingChanges).forEach(([key, change]) => {
      if (change.section === section) {
        updatesToRevert[key as keyof StoreFormData] = change.previousValue;
      }
    });

    setPendingChanges(prev => {
      const newChanges = { ...prev };
      Object.entries(newChanges).forEach(([key, change]) => {
        if (change.section === section) {
          delete newChanges[key];
        }
      });
      return newChanges;
    });

    setFormData(prev => ({
      ...prev,
      ...updatesToRevert
    }));
  }, [pendingChanges]);

  // Função para validar alterações antes de salvar
  const validateChanges = useCallback(async () => {
    if (!pendingChanges.slug) return true;

    // Validação básica de campos obrigatórios
    if (pendingChanges.name && !pendingChanges.name.value.trim()) {
      throw new Error('O nome da loja é obrigatório');
    }

    // Validação de slug
    if (pendingChanges.slug) {
      const { data, error: checkError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', pendingChanges.slug.value)
        .neq('id', store.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (data) {
        throw new Error('Esta URL já está em uso. Por favor, escolha outra.');
      }
    }

    return true;
  }, [pendingChanges, store.id]);

  // Função aprimorada para salvar alterações
  const saveChanges = async () => {
    setLoading(true);
    setError(null);

    try {
      await validateChanges();

      const updateData: Record<string, any> = {};
      
      Object.entries(pendingChanges).forEach(([key, change]) => {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updateData[dbKey] = change.value;

        if (['logoSize', 'titleSize', 'descriptionSize', 'headerHeight'].includes(key)) {
          updateData[dbKey] = `${change.value}px`;
        }
      });

      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', store.id);

      if (updateError) throw updateError;

      setPendingChanges({});
      onUpdate();

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se há alterações pendentes
  const hasPendingChanges = useCallback((section?: string) => {
    if (section) {
      return Object.values(pendingChanges).some(change => change.section === section);
    }
    return Object.keys(pendingChanges).length > 0;
  }, [pendingChanges]);

  const contextValue: StoreCustomizationContextType = {
    formData,
    updateFormData,
    loading,
    error,
    activeSection,
    setActiveSection,
    pendingChanges,
    hasPendingChanges,
    revertSectionChanges,
    saveChanges
  };

  return (
    <StoreCustomizationContext.Provider value={contextValue}>
      {children(contextValue)}
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