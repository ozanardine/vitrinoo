import React, { useState, useMemo } from 'react';
import { Moon, Sun, Palette, AlertCircle, Check } from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ColorPicker } from '../forms/ColorPicker';
import { useStore } from '../../../../lib/store';
import { useStoreTheme } from '../../../../lib/store-theme';
import { StoreThemeToggle } from '../../../store/StoreThemeToggle';
import { calculateTextColor } from '../../../../lib/colors';

// Color theme presets
const COLOR_THEMES = {
  modern: {
    name: 'Moderno',
    colors: {
      primary: '#ffffff',
      secondary: '#1f2937',
      accent: '#3b82f6',
      background: '#f8fafc'
    }
  },
  nature: {
    name: 'Natureza',
    colors: {
      primary: '#f5f7f2',
      secondary: '#2d3b29',
      accent: '#4a7c59',
      background: '#f0f4ed'
    }
  },
  elegant: {
    name: 'Elegante',
    colors: {
      primary: '#faf7f5',
      secondary: '#2c1810',
      accent: '#9c6644',
      background: '#f8f3f1'
    }
  },
  minimal: {
    name: 'Minimalista',
    colors: {
      primary: '#ffffff',
      secondary: '#18181b',
      accent: '#404040',
      background: '#fafafa'
    }
  },
  ocean: {
    name: 'Oceano',
    colors: {
      primary: '#f0f9ff',
      secondary: '#0c4a6e',
      accent: '#0284c7',
      background: '#ecfeff'
    }
  },
  dark: {
    name: 'Escuro',
    colors: {
      primary: '#1f2937',
      secondary: '#f9fafb',
      accent: '#60a5fa',
      background: '#111827'
    }
  }
};

// Color presets for individual color pickers
const COLOR_PRESETS = {
  primary: [
    '#ffffff', // White
    '#f8fafc', // Slate 50
    '#f0f9ff', // Sky 50
    '#faf5ff', // Purple 50
    '#fff1f2', // Rose 50
    '#f7fee7'  // Lime 50
  ],
  secondary: [
    '#1f2937', // Gray 800
    '#1e3a8a', // Blue 900
    '#365314', // Lime 900
    '#3b0764', // Purple 950
    '#881337', // Rose 900
    '#422006'  // Orange 950
  ],
  accent: [
    '#3b82f6', // Blue 500
    '#22c55e', // Green 500
    '#f59e0b', // Amber 500
    '#ec4899', // Pink 500
    '#8b5cf6', // Violet 500
    '#f43f5e'  // Rose 500
  ],
  background: [
    '#ffffff', // White
    '#f8fafc', // Slate 50
    '#f1f5f9', // Slate 100
    '#f9fafb', // Gray 50
    '#f5f3ff', // Violet 50
    '#fef2f2'  // Red 50
  ]
};

export function ThemeSettings() {
  const { formData, updateFormData } = useStoreCustomization();
  const { theme: siteTheme } = useStore();
  const { theme: storeTheme } = useStoreTheme();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Preview styles based on current colors
  const previewStyles = useMemo(() => {
    const textColor = calculateTextColor(formData.primaryColor);
    
    return {
      container: {
        backgroundColor: formData.primaryColor,
        color: formData.secondaryColor,
        border: `1px solid ${formData.secondaryColor}20`
      },
      button: {
        backgroundColor: formData.accentColor,
        color: textColor === 'light' ? '#ffffff' : '#000000'
      },
      card: {
        backgroundColor: formData.primaryColor,
        color: formData.secondaryColor,
        border: `1px solid ${formData.secondaryColor}20`
      }
    };
  }, [formData.primaryColor, formData.secondaryColor, formData.accentColor]);

  // Apply theme preset
  const applyThemePreset = (presetKey: keyof typeof COLOR_THEMES) => {
    const preset = COLOR_THEMES[presetKey];
    setSelectedPreset(presetKey);
    updateFormData({
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      headerBackground: preset.colors.primary
    });
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
              onClick={() => applyThemePreset(key as keyof typeof COLOR_THEMES)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                selectedPreset === key ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
              }`}
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.secondary
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">{theme.name}</span>
                {selectedPreset === key && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex gap-2">
                {Object.values(theme.colors).map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                ))}
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
            value={formData.headerBackground}
            onChange={(color) => updateFormData({ headerBackground: color })}
            description="Cor de fundo do cabeçalho quando estilo sólido"
            presets={COLOR_PRESETS.background}
          />
        </div>
      </div>

      {/* Theme Toggle Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Alternador de Tema</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Permitir que os visitantes alternem entre tema claro e escuro
            </p>
          </div>
          <div className="flex items-center gap-4">
            <StoreThemeToggle
              preview={true}
              allowPreviewToggle={true}
              accentColor={formData.accentColor}
            />
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowThemeToggle}
                onChange={(e) => updateFormData({ allowThemeToggle: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              O tema da loja é independente do tema do site principal.
              Atualmente o site está em modo <strong>{siteTheme}</strong> e
              a loja em modo <strong>{storeTheme}</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Prévia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Light Theme Preview */}
          <div 
            className="p-6 rounded-lg transition-all duration-300"
            style={previewStyles.container}
          >
            <div className="mb-4">
              <h4 className="text-xl font-semibold mb-2">Exemplo de Título</h4>
              <p className="text-sm opacity-80">
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
                style={previewStyles.card}
              >
                <span className="opacity-80">Elemento secundário</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}