import React, { useState, useEffect, useRef } from 'react';
import { Store, Palette, Layout, Type, Grid, Phone } from 'lucide-react';
import { Store as StoreType } from '../../lib/types';
import { StoreCustomizationProvider } from './store-customization/StoreCustomizationContext';
import { StoreCustomizationContextType } from './store-customization/types';
import { ThemePreviewProvider } from './store-customization/theme-management/ThemePreviewContext';
import { StoreHeader } from '../store/StoreHeader';
import { GeneralSettings } from './store-customization/sections/GeneralSettings';
import { ThemeSettings } from './store-customization/sections/ThemeSettings';
import { HeaderSettings } from './store-customization/sections/HeaderSettings';
import { TypographySettings } from './store-customization/sections/TypographySettings';
import { LayoutSettings } from './store-customization/sections/LayoutSettings';
import { ContactsAndSocialNetworks } from './store-customization/sections/ContactsAndSocialNetworks';
import { Alert, Snackbar } from '@mui/material';
import { useThemeStore } from '../../stores/useThemeStore';

interface StoreCustomizationTabProps {
  store: StoreType;
  onUpdate: () => void;
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

interface Section {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
}

const sections: Section[] = [
  { id: 'general', title: 'Informações Gerais', icon: Store },
  { id: 'theme', title: 'Cores e Tema', icon: Palette },
  { id: 'header', title: 'Cabeçalho', icon: Layout },
  { id: 'typography', title: 'Tipografia', icon: Type },
  { id: 'layout', title: 'Layout', icon: Grid },
  { id: 'contacts', title: 'Contatos e Redes', icon: Phone }
];

const PreviewSection = ({ context }: { context: StoreCustomizationContextType }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Preview</h3>
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <StoreHeader
        name={context.previewData.name}
        description={context.previewData.description}
        logoUrl={context.previewData.logoUrl}
        primaryColor={context.previewData.primaryColor}
        secondaryColor={context.previewData.secondaryColor}
        accentColor={context.previewData.accentColor}
        socialLinks={context.previewData.socialLinks}
        customization={{
          headerStyle: context.previewData.headerStyle,
          headerHeight: `${context.previewData.headerHeight}px`,
          headerImage: context.previewData.headerImage,
          headerGradient: context.previewData.headerGradient,
          headerAlignment: context.previewData.headerAlignment,
          headerOverlayOpacity: context.previewData.headerOverlayOpacity,
          headerVisibility: context.previewData.headerVisibility,
          logoSize: `${context.previewData.logoSize}px`,
          titleSize: `${context.previewData.titleSize}px`,
          descriptionSize: `${context.previewData.descriptionSize}px`,
          titleFont: context.previewData.titleFont,
          bodyFont: context.previewData.bodyFont,
          socialSettings: context.previewData.socialSettings,
          headerBackground: context.previewData.headerBackground,
          preview: true
        }}
      />
    </div>
  </div>
);

export function StoreCustomizationTab({ store, onUpdate }: StoreCustomizationTabProps) {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Usar null como padrão pois selected_preset pode não existir no tipo Store
  const [selectedThemePreset, setSelectedThemePreset] = useState<string | null>((store as any).selected_preset || null);
  const [pendingPreset, setPendingPreset] = useState<string | null>((store as any).selected_preset || null);
  
  const themeStore = useThemeStore();
  const hasInitialized = useRef(false);

  const initialThemePreview = {
    primaryColor: store.primary_color || '#000000',
    secondaryColor: store.secondary_color || '#ffffff',
    accentColor: store.accent_color || '#0066FF',
    headerBackground: store.header_background || '#ffffff',
    background: store.background || '#ffffff'
  };

  // Inicializa theme store com valores da loja apenas uma vez
  useEffect(() => {
    // Usando useRef para garantir que inicialize apenas uma vez
    if (store && !hasInitialized.current) {
      themeStore.initializeTheme({
        primaryColor: store.primary_color,
        secondaryColor: store.secondary_color,
        accentColor: store.accent_color,
        headerBackground: store.header_background,
        background: store.background,
        headerStyle: store.header_style,
        surfaceColor: store.surface_color || '#ffffff',
        borderColor: store.border_color || '#e5e7eb',
        mutedColor: '#6b7280', // Valor padrão para mutedColor
        selectedPreset: (store as any).selected_preset || null // Uso de cast para evitar erro de tipagem
      });
      hasInitialized.current = true;
    }
  }, [store, themeStore]);

  const handleSave = async (context: StoreCustomizationContextType) => {
    try {
      // Verificar se há alterações para salvar
      if (!context.hasPendingChanges() && !themeStore.hasChanges()) {
        setAlert({
          open: true,
          message: 'Não há alterações para salvar.',
          severity: 'info'
        });
        return;
      }

      const success = await context.saveChanges();
      
      if (success) {
        // Atualiza o preset selecionado após o salvamento bem-sucedido
        if (pendingPreset !== selectedThemePreset) {
          setSelectedThemePreset(pendingPreset);
        }
        
        setAlert({
          open: true,
          message: 'Alterações salvas com sucesso!',
          severity: 'success'
        });
      }
    } catch (error: any) {
      setAlert({
        open: true,
        message: error.message || 'Erro ao salvar alterações',
        severity: 'error'
      });
    }
  };

  const handleSectionChange = (context: StoreCustomizationContextType, sectionId: string) => {
    // Se houver mudanças pendentes na seção atual, pergunta se quer descartar
    if (context.hasPendingChanges(context.activeSection) || 
        (context.activeSection === 'theme' && themeStore.hasChanges())) {
      
      const confirmChange = window.confirm(
        'Existem alterações não salvas. Deseja descartar estas alterações?'
      );

      if (confirmChange) {
        // Reverter mudanças contextuais
        context.revertSectionChanges(context.activeSection);
        
        // Reverter mudanças do theme se estiver na seção de tema
        if (context.activeSection === 'theme') {
          themeStore.resetToOriginal();
          setPendingPreset(selectedThemePreset);
        }
      } else {
        return; // Cancelar troca de seção
      }
    }

    context.setActiveSection(sectionId);
  };

  const handleThemePresetChange = (presetId: string) => {
    // Atualiza o preset pendente, que será confirmado no salvamento
    setPendingPreset(presetId);
  };

  const renderSection = (context: StoreCustomizationContextType) => {
    switch (context.activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'theme':
        return (
          <ThemeSettings 
            selectedPreset={pendingPreset} // Usar o preset pendente para preview
            onPresetChange={handleThemePresetChange}
          />
        );
      case 'header':
        return <HeaderSettings />;
      case 'typography':
        return <TypographySettings />;
      case 'layout':
        return <LayoutSettings />;
      case 'contacts':
        return <ContactsAndSocialNetworks />;
      default:
        return null;
    }
  };

  const shouldShowPreview = (section: string): boolean => {
    return !['layout', 'theme'].includes(section);
  };

  return (
    <StoreCustomizationProvider store={store} onUpdate={onUpdate}>
      {(context) => (
        <ThemePreviewProvider initialData={initialThemePreview}>
          <div className="relative">
            <Snackbar
              open={alert.open}
              autoHideDuration={3000}
              onClose={() => setAlert({ ...alert, open: false })}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Alert
                onClose={() => setAlert({ ...alert, open: false })}
                severity={alert.severity}
                variant="filled"
              >
                {alert.message}
              </Alert>
            </Snackbar>

            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const hasPendingChanges = context.hasPendingChanges(section.id) || 
                      (section.id === 'theme' && themeStore.hasChanges());
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSectionChange(context, section.id)}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 rounded-lg 
                          transition-colors relative
                          ${context.activeSection === section.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <span>{section.title}</span>
                        </div>
                        
                        {hasPendingChanges && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave(context);
                    }} 
                    className="space-y-8"
                  >
                    {/* Render active section */}
                    {renderSection(context)}

                    {/* Preview Section */}
                    {shouldShowPreview(context.activeSection) && (
                      <PreviewSection context={context} />
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4">
                      {(context.hasPendingChanges() || 
                        (context.activeSection === 'theme' && themeStore.hasChanges())) && (
                        <button
                          type="button"
                          onClick={() => {
                            context.revertSectionChanges(context.activeSection);
                            if (context.activeSection === 'theme') {
                              themeStore.resetToOriginal();
                              setPendingPreset(selectedThemePreset);
                            }
                          }}
                          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Descartar Alterações
                        </button>
                      )}
                      
                      <button
                        type="submit"
                        disabled={context.loading || 
                          (!context.hasPendingChanges() && 
                            !(context.activeSection === 'theme' && themeStore.hasChanges()))}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                          disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors duration-200"
                      >
                        {context.loading ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </ThemePreviewProvider>
      )}
    </StoreCustomizationProvider>
  );
}