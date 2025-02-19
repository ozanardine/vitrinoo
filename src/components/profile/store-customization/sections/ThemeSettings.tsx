import { useState, useEffect, useCallback } from 'react';
import { Palette, Check } from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ColorPicker } from '../forms/ColorPicker';
import { useStore } from '../../../../lib/store';
import { useStoreTheme } from '../../../../lib/store-theme';
import { calculateTextColor } from '../../../../lib/colors';

// Color theme presets
const COLOR_THEMES = {
  minimal: {
    name: 'Minimalista',
    colors: {
      primary: '#ffffff',
      secondary: '#18181b',
      accent: '#3b82f6',
      background: '#fafafa',
      headerBackground: '#ffffff'
    },
    description: 'Design limpo e moderno com foco no conteúdo'
  },
  nature: {
    name: 'Natural',
    colors: {
      primary: '#f5f7f2',
      secondary: '#2d3b29',
      accent: '#4a7c59',
      background: '#f0f4ed',
      headerBackground: '#4a7c59'
    },
    description: 'Tons orgânicos e naturais para uma experiência acolhedora'
  },
  elegant: {
    name: 'Elegante',
    colors: {
      primary: '#faf7f5',
      secondary: '#2c1810',
      accent: '#9c6644',
      background: '#f8f3f1',
      headerBackground: '#9c6644'
    },
    description: 'Sofisticação e requinte com tons terrosos'
  },
  ocean: {
    name: 'Oceano',
    colors: {
      primary: '#f0f9ff',
      secondary: '#0c4a6e',
      accent: '#0284c7',
      background: '#ecfeff',
      headerBackground: '#0284c7'
    },
    description: 'Inspirado nas cores do mar para uma atmosfera tranquila'
  },
  modern: {
    name: 'Moderno',
    colors: {
      primary: '#ffffff',
      secondary: '#1f2937',
      accent: '#6366f1',
      background: '#f8fafc',
      headerBackground: '#6366f1'
    },
    description: 'Visual contemporâneo com tons vibrantes'
  },
  dark: {
    name: 'Escuro',
    colors: {
      primary: '#1f2937',
      secondary: '#f9fafb',
      accent: '#60a5fa',
      background: '#111827',
      headerBackground: '#111827'
    },
    description: 'Tema escuro para uma experiência noturna'
  }
};

// Gradient directions
const GRADIENT_DIRECTIONS = [
  { value: 'to bottom', label: 'De cima para baixo' },
  { value: 'to right', label: 'Da esquerda para direita' },
  { value: 'to bottom right', label: 'Diagonal ↘' },
  { value: 'to bottom left', label: 'Diagonal ↙' },
  { value: 'to top', label: 'De baixo para cima' },
  { value: 'to top right', label: 'Diagonal ↗' },
  { value: 'to top left', label: 'Diagonal ↖' }
];

// Color presets
const COLOR_PRESETS = {
  primary: [
    '#ffffff', '#f8fafc', '#f0f9ff', '#faf5ff', '#fff1f2', '#f7fee7'
  ],
  secondary: [
    '#1f2937', '#1e3a8a', '#365314', '#3b0764', '#881337', '#422006'
  ],
  accent: [
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b'
  ],
  background: [
    '#ffffff', '#f8fafc', '#f1f5f9', '#f9fafb', '#f5f3ff', '#fef2f2'
  ],
  headerBackground: [
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b'
  ]
};

export function ThemeSettings() {
  const { formData, updateFormData } = useStoreCustomization();
  const { theme } = useStore();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [useGradient, setUseGradient] = useState(formData.headerStyle === 'gradient');
  const [gradientDirection, setGradientDirection] = useState(formData.headerGradient || 'to bottom');
  const [gradientStart, setGradientStart] = useState(formData.headerBackground || '#ffffff');
  const [gradientEnd, setGradientEnd] = useState(
    formData.headerBackground?.includes('gradient') 
      ? formData.headerBackground.match(/,(.*?),/)?.[1]?.trim() || '#f8fafc'
      : '#f8fafc'
  );

  // Memoized update functions
  const updateGradient = useCallback(() => {
    const gradientValue = `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`;
    updateFormData({ 
      headerBackground: gradientValue,
      headerStyle: 'gradient',
      headerGradient: gradientDirection
    });
  }, [gradientDirection, gradientStart, gradientEnd, updateFormData]);

  const handleGradientDirectionChange = useCallback((direction: string) => {
    setGradientDirection(direction);
  }, []);

  const handleGradientStartChange = useCallback((color: string) => {
    setGradientStart(color);
  }, []);

  const handleGradientEndChange = useCallback((color: string) => {
    setGradientEnd(color);
  }, []);

  // Effect to update gradient when its components change
  useEffect(() => {
    if (useGradient) {
      updateGradient();
    }
  }, [useGradient, gradientDirection, gradientStart, gradientEnd, updateGradient]);

  // Handle style toggle
  const toggleHeaderStyle = useCallback((useGrad: boolean) => {
    setUseGradient(useGrad);
    if (!useGrad) {
      updateFormData({
        headerBackground: formData.primaryColor,
        headerStyle: 'solid'
      });
    }
  }, [formData.primaryColor, updateFormData]);

  // Apply theme preset
  const applyThemePreset = useCallback((presetKey: keyof typeof COLOR_THEMES) => {
    const preset = COLOR_THEMES[presetKey];
    setSelectedPreset(presetKey);
    
    const updates = {
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      background: preset.colors.background,
      headerBackground: preset.colors.headerBackground,
      headerStyle: 'solid'
    };

    updateFormData(updates);
    setUseGradient(false);
  }, [updateFormData]);

  // Preview styles
  const previewStyles = {
    container: {
      backgroundColor: formData.primaryColor,
      color: formData.secondaryColor,
      border: `1px solid ${formData.secondaryColor}20`
    },
    button: {
      backgroundColor: formData.accentColor,
      color: calculateTextColor(formData.accentColor) === 'light' ? '#ffffff' : '#000000'
    },
    header: {
      background: useGradient 
        ? `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`
        : formData.headerBackground
    }
  };

  return (
    <div className="space-y-8">
      {/* Theme Presets */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Temas Predefinidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(COLOR_THEMES).map(([key, theme]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyThemePreset(key as keyof typeof COLOR_THEMES)}
              className={`p-6 rounded-lg border-2 text-left transition-all hover:scale-[1.02] relative overflow-hidden ${
                selectedPreset === key ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
              }`}
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.secondary
              }}
            >
              {selectedPreset === key && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl">
                  <Check className="w-4 h-4" />
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{theme.name}</h3>
                <p className="text-sm opacity-80 mb-4">{theme.description}</p>
                <div className="flex gap-2">
                  {Object.entries(theme.colors).map(([colorKey, color]) => (
                    <div
                      key={colorKey}
                      className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
                      style={{ 
                        background: color,
                        borderColor: `${theme.colors.secondary}20`
                      }}
                      title={`${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}: ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div 
                className="p-3 rounded-lg transition-colors"
                style={{ backgroundColor: theme.colors.accent }}
              >
                <span style={{ 
                  color: calculateTextColor(theme.colors.accent) === 'light' ? '#ffffff' : '#000000' 
                }}>
                  Prévia do Botão
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Cores Personalizadas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker
            label="Cor Principal"
            value={formData.primaryColor}
            onChange={(color) => updateFormData({ primaryColor: color })}
            description="Cor de fundo principal e elementos primários"
            presets={COLOR_PRESETS.primary}
          />

          <ColorPicker
            label="Cor do Texto"
            value={formData.secondaryColor}
            onChange={(color) => updateFormData({ secondaryColor: color })}
            description="Cor dos textos e elementos secundários"
            presets={COLOR_PRESETS.secondary}
          />

          <ColorPicker
            label="Cor de Destaque"
            value={formData.accentColor}
            onChange={(color) => updateFormData({ accentColor: color })}
            description="Cor para botões e elementos interativos"
            presets={COLOR_PRESETS.accent}
          />

          <ColorPicker
            label="Cor de Fundo"
            value={formData.background}
            onChange={(color) => updateFormData({ background: color })}
            description="Cor de fundo da página"
            presets={COLOR_PRESETS.background}
          />
        </div>

        {/* Header Background Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Fundo do Cabeçalho</h4>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 mb-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useGradient}
                  onChange={() => toggleHeaderStyle(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Cor Sólida</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useGradient}
                  onChange={() => toggleHeaderStyle(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>Gradiente</span>
              </label>
            </div>

            {useGradient ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker
                    label="Cor Inicial"
                    value={gradientStart}
                    onChange={handleGradientStartChange}
                    presets={COLOR_PRESETS.headerBackground}
                  />
                  
                  <ColorPicker
                    label="Cor Final"
                    value={gradientEnd}
                    onChange={handleGradientEndChange}
                    presets={COLOR_PRESETS.headerBackground}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Direção do Gradiente</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GRADIENT_DIRECTIONS.map(direction => (
                      <button
                        key={direction.value}
                        type="button"
                        onClick={() => handleGradientDirectionChange(direction.value)}
                        className={`
                          p-2 rounded-lg border-2 transition-colors text-sm
                          ${gradientDirection === direction.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                          }
                        `}
                      >
                        {direction.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <ColorPicker
                label="Cor do Cabeçalho"
                value={formData.headerBackground}
                onChange={(color) => updateFormData({ 
                  headerBackground: color,
                  headerStyle: 'solid'
                })}
                description="Cor de fundo do cabeçalho quando estilo sólido"
                presets={COLOR_PRESETS.headerBackground}
              />
            )}

            <div className="mt-4">
              <div className="h-20 rounded-lg overflow-hidden shadow-inner"
                style={previewStyles.header}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Prévia</h3>
        <div 
          className="p-6 rounded-lg transition-all duration-300"
          style={previewStyles.container}
        >
          <div 
            className="mb-4 p-6 rounded-lg transition-all duration-300"
            style={previewStyles.header}
          >
            <h4 className="text-xl font-semibold mb-2">Prévia do Cabeçalho</h4>
            <p className="opacity-80">
              Exemplo de como seu conteúdo aparecerá com as cores selecionadas
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              className="w-full px-4 py-2 rounded-lg transition-all duration-300"
              style={previewStyles.button}
              disabled
            >
              Botão de Ação
            </button>
            <div 
              className="p-3 rounded-lg transition-all duration-300"
              style={previewStyles.container}
            >
              <span className="opacity-80">Elemento secundário</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}