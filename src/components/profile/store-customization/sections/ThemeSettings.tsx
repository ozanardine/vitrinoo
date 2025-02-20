import { useEffect, useCallback } from 'react';
import { Palette, Droplet } from 'lucide-react';
import { StoreHeader } from '../../../store/StoreHeader';
import { useThemeStore } from '../../../../stores/useThemeStore';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { COLOR_PRESETS } from '../../../../constants/theme';
import { ColorPicker } from '../forms/ColorPicker';
import { ThemePresetSelector } from './theme/ThemePresetSelector';

interface ThemeSettingsProps {
  onLocalChange: (data: any) => void;
  selectedPreset: string | null;
  onPresetChange: (presetId: string) => void;
}

export function ThemeSettings({ onLocalChange, selectedPreset, onPresetChange }: ThemeSettingsProps) {
  const { formData, updateFormData } = useStoreCustomization();
  const themeState = useThemeStore();
  
  // Initialize theme state
  useEffect(() => {
    if (!formData.primaryColor) return;
    themeState.initializeTheme(formData);
  }, []);

  // Sync with formData changes
  useEffect(() => {
    if (!formData.primaryColor) return;

    const hasChanges = 
      formData.primaryColor !== themeState.primaryColor ||
      formData.secondaryColor !== themeState.secondaryColor ||
      formData.accentColor !== themeState.accentColor ||
      formData.headerBackground !== themeState.headerBackground;

    if (hasChanges) {
      themeState.updateColor('primaryColor', formData.primaryColor);
      themeState.updateColor('secondaryColor', formData.secondaryColor);
      themeState.updateColor('accentColor', formData.accentColor);
      themeState.updateColor('headerBackground', formData.headerBackground || formData.primaryColor);
      themeState.updateColor('background', formData.primaryColor);
    }
  }, [formData]);

  const handleColorChange = useCallback((key: 'background' | 'accentColor' | 'primaryColor' | 'secondaryColor' | 'headerBackground') => (color: string) => {
    themeState.updateColor(key, color);
    const updatedData = {
      primaryColor: key === 'primaryColor' ? color : themeState.primaryColor,
      secondaryColor: key === 'secondaryColor' ? color : themeState.secondaryColor,
      accentColor: key === 'accentColor' ? color : themeState.accentColor,
      headerBackground: key === 'headerBackground' ? color : themeState.headerBackground,
      background: key === 'primaryColor' ? color : themeState.primaryColor
    };
    updateFormData(updatedData);
    onLocalChange(updatedData);
  }, [themeState, updateFormData, onLocalChange]);

  const handlePresetSelect = useCallback((presetId: string, colors: any) => {
    const updatedData = {
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      accentColor: colors.accent,
      headerBackground: colors.header.background,
      background: colors.primary
    };
    
    themeState.updateColor('primaryColor', colors.primary);
    themeState.updateColor('secondaryColor', colors.secondary);
    themeState.updateColor('accentColor', colors.accent);
    themeState.updateColor('headerBackground', colors.header.background);
    themeState.updateColor('background', colors.primary);
    themeState.applyPreset(presetId);
    
    // Only update local state for preview
    onLocalChange(updatedData);
    onPresetChange(presetId);
  }, [themeState, onLocalChange, onPresetChange]);

  return (
    <div className="space-y-8">
      {/* Presets Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Temas Predefinidos
        </h3>
        <ThemePresetSelector
          selectedPreset={selectedPreset}
          onSelect={handlePresetSelect}
        />
      </section>

      {/* Color Pickers Section */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Droplet className="w-5 h-5" />
          Cores Personalizadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker
            label="Cor Principal"
            value={themeState.primaryColor}
            onChange={handleColorChange('primaryColor')}
            description="Cor de fundo principal"
            presets={COLOR_PRESETS.primary}
          />
          <ColorPicker
            label="Cor Secundária"
            value={themeState.secondaryColor}
            onChange={handleColorChange('secondaryColor')}
            description="Cor do texto e elementos de contraste"
            presets={COLOR_PRESETS.secondary}
          />
          <ColorPicker
            label="Cor de Destaque"
            value={themeState.accentColor}
            onChange={handleColorChange('accentColor')}
            description="Cor para botões e elementos interativos"
            presets={COLOR_PRESETS.accent}
          />
          {formData.headerStyle !== 'image' && (
            <ColorPicker
              label="Cor do Cabeçalho"
              value={themeState.headerBackground}
              onChange={handleColorChange('headerBackground')}
              description="Cor de fundo específica para o cabeçalho"
              presets={COLOR_PRESETS.primary}
            />
          )}
        </div>
      </section>

      {/* Preview Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <StoreHeader
            name="Nome da Loja"
            description="Uma descrição atraente para sua loja online"
            logoUrl={formData.logoUrl || "/api/placeholder/400/400"}
            primaryColor={themeState.primaryColor}
            secondaryColor={themeState.secondaryColor}
            accentColor={themeState.accentColor}
            socialLinks={[
              { type: 'instagram', url: 'loja' },
              { type: 'whatsapp', url: '5511999999999' },
              { type: 'email', url: 'contato@loja.com' }
            ]}
            customization={{
              headerStyle: formData.headerStyle,
              headerHeight: '200px',
              headerImage: formData.headerImage,
              headerGradient: 'to bottom',
              headerAlignment: 'center',
              headerOverlayOpacity: formData.headerOverlayOpacity,
              headerVisibility: {
                logo: true,
                title: true,
                description: true,
                socialLinks: true
              },
              logoSize: '120px',
              titleSize: '32px',
              descriptionSize: '16px',
              titleFont: 'Roboto',
              bodyFont: 'Roboto',
              socialSettings: {
                contactsPosition: 'above',
                displayFormat: 'username'
              },
              headerBackground: themeState.headerBackground,
              preview: true
            }}
          />
          <div className="p-8" style={{ backgroundColor: themeState.primaryColor }}>
            <div className="max-w-7xl mx-auto">
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((_, index) => (
                  <div 
                    key={index}
                    className="group rounded-lg overflow-hidden transition-all hover:shadow-lg"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${themeState.secondaryColor}20`
                    }}
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4">
                      <h5 className="font-medium mb-2" style={{ color: themeState.secondaryColor }}>Produto Exemplo</h5>
                      <p className="text-sm mb-4" style={{ color: `${themeState.secondaryColor}80` }}>Descrição breve do produto</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold" style={{ color: themeState.secondaryColor }}>R$ 99,90</span>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg transition-all"
                          style={{
                            backgroundColor: themeState.accentColor,
                            color: '#FFFFFF'
                          }}
                        >
                          Comprar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}