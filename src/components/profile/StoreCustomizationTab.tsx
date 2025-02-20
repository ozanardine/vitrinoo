import { useState } from 'react';
import { Store, Palette, Layout, Type, Grid, Phone } from 'lucide-react';
import { Store as StoreType } from '../../lib/types';
import { StoreCustomizationProvider } from './store-customization/StoreCustomizationContext';
import { GeneralSettings } from './store-customization/sections/GeneralSettings';
import { ThemeSettings } from './store-customization/sections/ThemeSettings';
import { HeaderSettings } from './store-customization/sections/HeaderSettings';
import { TypographySettings } from './store-customization/sections/TypographySettings';
import { LayoutSettings } from './store-customization/sections/LayoutSettings';
import { ContactsAndSocialNetworks } from './store-customization/sections/ContactsAndSocialNetworks';
import { StoreHeader } from '../store/StoreHeader';
import { StoreFormData } from './store-customization/types';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

interface StoreCustomizationTabProps {
  store: StoreType;
  onUpdate: () => void;
}

export function StoreCustomizationTab({ store, onUpdate }: StoreCustomizationTabProps) {
  const [activeSection, setActiveSection] = useState<string>('general');
  const [localThemeData, setLocalThemeData] = useState<Partial<StoreFormData>>({});
  const [selectedThemePreset, setSelectedThemePreset] = useState<string | null>(null);
  const [localTypographyData, setLocalTypographyData] = useState<Partial<StoreFormData>>({});
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const sections = [
    { id: 'general', title: 'Informações Gerais', icon: Store },
    { id: 'theme', title: 'Cores e Tema', icon: Palette },
    { id: 'header', title: 'Cabeçalho', icon: Layout },
    { id: 'typography', title: 'Tipografia', icon: Type },
    { id: 'layout', title: 'Layout', icon: Grid },
    { id: 'contacts', title: 'Contatos e Redes', icon: Phone }
  ];

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleSave = async (context: any) => {
    try {
      // Merge all local changes
      const updatedData = {
        ...context.formData,
        ...(Object.keys(localThemeData).length > 0 && localThemeData),
        ...(Object.keys(localTypographyData).length > 0 && localTypographyData)
      };

      // Update form data with merged changes
      context.updateFormData(updatedData);
      
      // Save changes
      await context.onSave();
      
      // Clear local state after successful save
      setLocalThemeData({});
      setLocalTypographyData({});
      
      // Show success alert
      setAlert({
        open: true,
        message: 'Alterações salvas com sucesso!',
        severity: 'success'
      });
    } catch (error: any) {
      // Show error alert
      setAlert({
        open: true,
        message: error.message || 'Erro ao salvar alterações',
        severity: 'error'
      });
    }
  };

  const renderSection = (context: any) => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'theme':
        return (
          <ThemeSettings 
            onLocalChange={(data) => {
              setLocalThemeData(data);
              context.updateFormData(data);
            }}
            selectedPreset={selectedThemePreset}
            onPresetChange={setSelectedThemePreset}
          />
        );
      case 'header':
        return <HeaderSettings />;
      case 'typography':
        return <TypographySettings onLocalChange={(data) => setLocalTypographyData(data)} />;
      case 'layout':
        return <LayoutSettings />;
      case 'contacts':
        return <ContactsAndSocialNetworks />;
      default:
        return null;
    }
  };

  return (
    <StoreCustomizationProvider store={store} onUpdate={onUpdate}>
      {(context) => (
        <div className="relative">
          <Snackbar
            open={alert.open}
            autoHideDuration={3000}
            onClose={() => setAlert({ ...alert, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{ position: 'fixed' }}
          >
            <Alert
              onClose={() => setAlert({ ...alert, open: false })}
              severity={alert.severity}
              sx={{ width: '100%' }}
              variant="filled"
            >
              {alert.message}
            </Alert>
          </Snackbar>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar com navegação */}
              <div className="w-full md:w-64 space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{section.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Área principal de conteúdo */}
              <div className="flex-1">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSave(context);
                }} className="space-y-8">
                  {renderSection(context)}

                  {/* Preview - Hidden for Layout and Theme sections */}
                  {activeSection !== 'layout' && activeSection !== 'theme' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Preview</h3>
                      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <StoreHeader
                          name={context.formData.name}
                          description={context.formData.description}
                          logoUrl={context.formData.logoUrl}
                          primaryColor={activeSection === 'theme' ? localThemeData.primaryColor || context.formData.primaryColor : context.formData.primaryColor}
                          secondaryColor={activeSection === 'theme' ? localThemeData.secondaryColor || context.formData.secondaryColor : context.formData.secondaryColor}
                          accentColor={activeSection === 'theme' ? localThemeData.accentColor || context.formData.accentColor : context.formData.accentColor}
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
                            titleFont: activeSection === 'typography' ? localTypographyData.titleFont || context.formData.titleFont : context.formData.titleFont,
                            bodyFont: activeSection === 'typography' ? localTypographyData.bodyFont || context.formData.bodyFont : context.formData.bodyFont,
                            socialSettings: context.formData.socialSettings,
                            headerBackground: activeSection === 'theme' ? localThemeData.headerBackground || context.formData.headerBackground : context.formData.headerBackground,
                            preview: true
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      type="submit"
                      disabled={context.loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                    >
                      {context.loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </StoreCustomizationProvider>
  );
}