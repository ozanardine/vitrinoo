// src/components/profile/StoreCustomizationTab.tsx
import { useState } from 'react';
import { Store, Palette, Layout, Type, Grid, Phone } from 'lucide-react';
import { Store as StoreType } from '../../lib/types';
import { StoreCustomizationProvider, StoreCustomizationContextType } from './store-customization/StoreCustomizationContext';
import { ThemePreviewProvider } from './store-customization/theme-management/ThemePreviewContext';
import { StoreHeader } from '../store/StoreHeader';
import { GeneralSettings } from './store-customization/sections/GeneralSettings';
import { ThemeSettings } from './store-customization/sections/ThemeSettings';
import { HeaderSettings } from './store-customization/sections/HeaderSettings';
import { TypographySettings } from './store-customization/sections/TypographySettings';
import { LayoutSettings } from './store-customization/sections/LayoutSettings';
import { ContactsAndSocialNetworks } from './store-customization/sections/ContactsAndSocialNetworks';
import { Alert, Snackbar } from '@mui/material';

interface StoreCustomizationTabProps {
  store: StoreType;
  onUpdate: () => void;
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
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
        name={context.formData.name}
        description={context.formData.description}
        logoUrl={context.formData.logoUrl}
        primaryColor={context.formData.primaryColor}
        secondaryColor={context.formData.secondaryColor}
        accentColor={context.formData.accentColor}
        socialLinks={context.formData.socialLinks}
        customization={{
          headerStyle: context.formData.headerStyle,
          headerHeight: `${context.formData.headerHeight}px`,
          headerImage: context.formData.headerImage,
          headerGradient: context.formData.headerGradient,
          headerAlignment: context.formData.headerAlignment,
          headerOverlayOpacity: context.formData.headerOverlayOpacity,
          headerVisibility: context.formData.headerVisibility,
          logoSize: `${context.formData.logoSize}px`,
          titleSize: `${context.formData.titleSize}px`,
          descriptionSize: `${context.formData.descriptionSize}px`,
          titleFont: context.formData.titleFont,
          bodyFont: context.formData.bodyFont,
          socialSettings: context.formData.socialSettings,
          headerBackground: context.formData.headerBackground,
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

  const [selectedThemePreset, setSelectedThemePreset] = useState<string | null>(null);

  const initialThemePreview = {
    primaryColor: store.primary_color || '#000000',
    secondaryColor: store.secondary_color || '#ffffff',
    accentColor: store.accent_color || '#0066FF',
    headerBackground: store.header_background || '#ffffff',
    background: store.background || '#ffffff'
  };

  const renderSection = (context: StoreCustomizationContextType) => {
    switch (context.activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'theme':
        return (
          <ThemeSettings 
            selectedPreset={selectedThemePreset}
            onPresetChange={setSelectedThemePreset}
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

  const handleSave = async (context: StoreCustomizationContextType) => {
    try {
      const success = await context.saveChanges();
      
      if (success) {
        setAlert({
          open: true,
          message: 'Alterações salvas com sucesso!',
          severity: 'success'
        });
        setSelectedThemePreset(null);
      }
    } catch (error: any) {
      setAlert({
        open: true,
        message: error.message || 'Erro ao salvar alterações',
        severity: 'error'
      });
    }
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
                    const hasPendingChanges = context.hasPendingChanges(section.id);
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => context.setActiveSection(section.id)}
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
                      {context.hasPendingChanges() && (
                        <button
                          type="button"
                          onClick={() => context.revertSectionChanges(context.activeSection)}
                          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Descartar Alterações
                        </button>
                      )}
                      
                      <button
                        type="submit"
                        disabled={context.loading || !context.hasPendingChanges()}
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