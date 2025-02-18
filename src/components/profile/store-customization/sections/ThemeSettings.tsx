import React, { useState, useMemo, useEffect } from 'react';
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
    '#ffffff',
    '#f8fafc',
    '#f0f9ff',
    '#faf5ff',
    '#fff1f2',
    '#f7fee7'
  ],
  secondary: [
    '#1f2937',
    '#1e3a8a',
    '#365314',
    '#3b0764',
    '#881337',
    '#422006'
  ],
  accent: [
    '#3b82f6',
    '#22c55e',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#f43f5e'
  ],
  background: [
    '#ffffff',
    '#f8fafc',
    '#f1f5f9',
    '#f9fafb',
    '#f5f3ff',
    '#fef2f2'
  ]
};

interface ThemeData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBackground: string;
  allowThemeToggle: boolean;
}

interface ThemeSettingsProps {
  onLocalChange?: (localData: ThemeData) => void;
  selectedPreset: string | null;
  onPresetChange: (preset: string | null) => void;
}

export function ThemeSettings({ onLocalChange, selectedPreset, onPresetChange }: ThemeSettingsProps) {
  const { formData } = useStoreCustomization();
  const { theme: siteTheme } = useStore();
  const { theme: storeTheme } = useStoreTheme();

  // Estado local para armazenar alterações temporárias
  const [localThemeData, setLocalThemeData] = useState<ThemeData>({
    primaryColor: formData.primaryColor,
    secondaryColor: formData.secondaryColor,
    accentColor: formData.accentColor,
    headerBackground: formData.headerBackground,
    allowThemeToggle: formData.allowThemeToggle
  });

  // Sincronizar com formData quando ele mudar
  useEffect(() => {
    setLocalThemeData({
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      accentColor: formData.accentColor,
      headerBackground: formData.headerBackground,
      allowThemeToggle: formData.allowThemeToggle
    });

    // Verificar se as cores atuais correspondem a algum preset
    const currentColors = {
      primary: formData.primaryColor,
      secondary: formData.secondaryColor,
      accent: formData.accentColor,
      background: formData.headerBackground
    };

    const matchingPreset = Object.entries(COLOR_THEMES).find(([_, theme]) => 
      Object.entries(theme.colors).every(([key, value]) => 
        value.toLowerCase() === currentColors[key as keyof typeof currentColors].toLowerCase()
      )
    )?.[0] || null;

    onPresetChange(matchingPreset);
  }, [formData, onPresetChange]);

  // Notificar mudanças no estado local
  useEffect(() => {
    onLocalChange?.(localThemeData);
  }, [localThemeData, onLocalChange]);

  // Preview styles baseado no estado local
  const previewStyles = useMemo(() => {
    const textColor = calculateTextColor(localThemeData.primaryColor);
    
    return {
      container: {
        backgroundColor: localThemeData.primaryColor,
        color: localThemeData.secondaryColor,
        border: `1px solid ${localThemeData.secondaryColor}20`
      },
      button: {
        backgroundColor: localThemeData.accentColor,
        color: textColor === 'light' ? '#ffffff' : '#000000'
      },
      card: {
        backgroundColor: localThemeData.primaryColor,
        color: localThemeData.secondaryColor,
        border: `1px solid ${localThemeData.secondaryColor}20`
      }
    };
  }, [localThemeData]);

  // Função para aplicar tema predefinido
  const applyThemePreset = (presetKey: keyof typeof COLOR_THEMES) => {
    const preset = COLOR_THEMES[presetKey];
    onPresetChange(presetKey);
    
    setLocalThemeData(prev => ({
      ...prev,
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      headerBackground: preset.colors.primary
    }));
  };

  // Função para atualizar uma cor específica
  const updateLocalColor = (colorKey: keyof Omit<ThemeData, 'allowThemeToggle'>, value: string) => {
    setLocalThemeData(prev => ({
      ...prev,
      [colorKey]: value
    }));
    onPresetChange(null);
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
          {Object.entries(COLOR_THEMES).map(([key, theme]) => {
            const isSelected = selectedPreset === key;
            const textColor = calculateTextColor(theme.colors.primary);
            
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyThemePreset(key as keyof typeof COLOR_THEMES)}
                className={`p-6 rounded-lg border-2 transition-all hover:scale-[1.02] relative overflow-hidden ${
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
                }`}
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.secondary
                }}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                <div className="mb-4">
                  <h4 className="text-lg font-semibold mb-2">{theme.name}</h4>
                  <div className="flex gap-2">
                    {Object.entries(theme.colors).map(([colorKey, color]) => (
                      <div
                        key={colorKey}
                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={`${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}: ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div 
                  className="p-3 rounded-lg transition-colors"
                  style={{ backgroundColor: theme.colors.accent }}
                >
                  <span style={{ color: textColor === 'light' ? '#ffffff' : '#000000' }}>
                    Prévia do Botão
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Cores Personalizadas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker
            label="Cor Principal"
            value={localThemeData.primaryColor}
            onChange={(color) => updateLocalColor('primaryColor', color)}
            description="Cor de fundo principal e elementos primários"
            presets={COLOR_PRESETS.primary}
          />

          <ColorPicker
            label="Cor do Texto"
            value={localThemeData.secondaryColor}
            onChange={(color) => updateLocalColor('secondaryColor', color)}
            description="Cor dos textos e elementos secundários"
            presets={COLOR_PRESETS.secondary}
          />

          <ColorPicker
            label="Cor de Destaque"
            value={localThemeData.accentColor}
            onChange={(color) => updateLocalColor('accentColor', color)}
            description="Cor para botões e elementos interativos"
            presets={COLOR_PRESETS.accent}
          />

          <ColorPicker
            label="Cor de Fundo"
            value={localThemeData.headerBackground}
            onChange={(color) => updateLocalColor('headerBackground', color)}
            description="Cor de fundo do cabeçalho quando estilo sólido"
            presets={COLOR_PRESETS.background}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Prévia</h3>
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
  );
}