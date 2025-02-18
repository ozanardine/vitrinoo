import React, { useState } from 'react';
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

interface StoreCustomizationTabProps {
  store: StoreType;
  onUpdate: () => void;
}

export function StoreCustomizationTab({ store, onUpdate }: StoreCustomizationTabProps) {
  const [activeSection, setActiveSection] = useState<string>('general');

  const sections = [
    { id: 'general', title: 'Informações Gerais', icon: Store },
    { id: 'theme', title: 'Cores e Tema', icon: Palette },
    { id: 'header', title: 'Cabeçalho', icon: Layout },
    { id: 'typography', title: 'Tipografia', icon: Type },
    { id: 'layout', title: 'Layout', icon: Grid },
    { id: 'contacts', title: 'Contatos e Redes', icon: Phone }
  ];

  const renderSection = (context: any) => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'theme':
        return <ThemeSettings />;
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

  return (
    <StoreCustomizationProvider store={store} onUpdate={onUpdate}>
      {(context) => (
        <div className="space-y-8">
          {/* Alert Messages */}
          {context.error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
              {context.error}
            </div>
          )}
          {context.success && (
            <div className="p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-lg">
              {context.success}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar com navegação */}
            <div className="w-full md:w-64 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
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
                context.onSave();
              }} className="space-y-8">
                {renderSection(context)}

                {/* Preview */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Prévia</h3>
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
                        socialSettings: context.formData.socialSettings
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="submit"
                    disabled={context.loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {context.loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </StoreCustomizationProvider>
  );
}
