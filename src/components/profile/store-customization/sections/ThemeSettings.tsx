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
      headerBackground: 'linear-gradient(to bottom, #4a7c59, #2d3b29)'
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
      headerBackground: 'linear-gradient(to right, #9c6644, #2c1810)'
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
      headerBackground: 'linear-gradient(to bottom right, #0284c7, #0c4a6e)'
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
      headerBackground: 'linear-gradient(to bottom, #6366f1, #4f46e5)'
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
      headerBackground: 'linear-gradient(to bottom, #1f2937, #111827)'
    },
    description: 'Tema escuro para uma experiência noturna'
  }
};

// Color presets for individual color pickers
const COLOR_PRESETS = {
  primary: [
    '#ffffff', // Branco puro
    '#f8fafc', // Cinza muito claro
    '#f0f9ff', // Azul muito claro
    '#faf5ff', // Roxo muito claro
    '#fff1f2', // Rosa muito claro
    '#f7fee7'  // Verde muito claro
  ],
  secondary: [
    '#1f2937', // Cinza escuro
    '#1e3a8a', // Azul escuro
    '#365314', // Verde escuro
    '#3b0764', // Roxo escuro
    '#881337', // Rosa escuro
    '#422006'  // Marrom escuro
  ],
  accent: [
    '#3b82f6', // Azul
    '#6366f1', // Índigo
    '#8b5cf6', // Violeta
    '#ec4899', // Rosa
    '#22c55e', // Verde
    '#f59e0b'  // Laranja
  ],
  background: [
    '#ffffff', // Branco puro
    '#f8fafc', // Cinza muito claro
    '#f1f5f9', // Cinza azulado claro
    '#f9fafb', // Cinza neutro claro
    '#f5f3ff', // Roxo muito claro
    '#fef2f2'  // Vermelho muito claro
  ],
  headerBackground: [
    'linear-gradient(to bottom, #3b82f6, #1e3a8a)',     // Azul
    'linear-gradient(to right, #6366f1, #4f46e5)',      // Índigo
    'linear-gradient(to bottom right, #8b5cf6, #6d28d9)', // Violeta
    'linear-gradient(to bottom, #ec4899, #db2777)',      // Rosa
    'linear-gradient(to right, #22c55e, #16a34a)',      // Verde
    'linear-gradient(to bottom right, #f59e0b, #d97706)' // Laranja
  ]
};

// Gradient directions
const GRADIENT_DIRECTIONS = [
  { value: 'to bottom', label: 'De cima para baixo' },
  { value: 'to right', label: 'Da esquerda para direita' },
  { value: 'to bottom right', label: 'Diagonal' },
  { value: 'to top', label: 'De baixo para cima' }
];

interface ThemeData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBackground: string;
  allowThemeToggle: boolean;
  background: string;
}

interface ThemeSettingsProps {
  onLocalChange?: (localData: ThemeData) => void;
  selectedPreset: string | null;
  onPresetChange: (preset: string | null) => void;
}

export function ThemeSettings({ 
  onLocalChange, 
  selectedPreset, 
  onPresetChange 
}: ThemeSettingsProps) {
  const { formData, updateFormData } = useStoreCustomization();
  const { theme: siteTheme } = useStore();
  const { theme: storeTheme } = useStoreTheme();
  const [gradientDirection, setGradientDirection] = useState('to bottom');
  const [gradientStart, setGradientStart] = useState('#ffffff');
  const [gradientEnd, setGradientEnd] = useState('#f8fafc');
  const [useGradient, setUseGradient] = useState(false);

  // Estado local para armazenar alterações temporárias
  const [localThemeData, setLocalThemeData] = useState<ThemeData>({
    primaryColor: formData.primaryColor,
    secondaryColor: formData.secondaryColor,
    accentColor: formData.accentColor,
    headerBackground: formData.headerBackground,
    allowThemeToggle: formData.allowThemeToggle,
    background: formData.background || '#ffffff'
  });

  // Sincronizar com formData quando ele mudar
  React.useEffect(() => {
    setLocalThemeData({
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      accentColor: formData.accentColor,
      headerBackground: formData.headerBackground,
      allowThemeToggle: formData.allowThemeToggle,
      background: formData.background || '#ffffff'
    });

    // Parse gradient if present
    if (formData.headerBackground.includes('gradient')) {
      setUseGradient(true);
      const match = formData.headerBackground.match(/linear-gradient\((.*?),(.*?),(.*?)\)/);
      if (match) {
        setGradientDirection(match[1].trim());
        setGradientStart(match[2].trim());
        setGradientEnd(match[3].trim());
      }
    } else {
      setUseGradient(false);
    }

    // Verificar se as cores atuais correspondem a algum preset
    const currentColors = {
      primary: formData.primaryColor,
      secondary: formData.secondaryColor,
      accent: formData.accentColor,
      background: formData.background || '#ffffff',
      headerBackground: formData.headerBackground
    };

    const matchingPreset = Object.entries(COLOR_THEMES).find(([_, theme]) => 
      Object.entries(theme.colors).every(([key, value]) => 
        value.toLowerCase() === currentColors[key as keyof typeof currentColors].toLowerCase()
      )
    )?.[0] || null;

    onPresetChange(matchingPreset);
  }, [formData, onPresetChange]);

  // Notificar mudanças no estado local
  React.useEffect(() => {
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
      },
      header: {
        background: useGradient 
          ? `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`
          : localThemeData.headerBackground
      }
    };
  }, [localThemeData, useGradient, gradientDirection, gradientStart, gradientEnd]);

  // Função para aplicar tema predefinido
  const applyThemePreset = (presetKey: keyof typeof COLOR_THEMES) => {
    const preset = COLOR_THEMES[presetKey];
    onPresetChange(presetKey);
    
    setLocalThemeData(prev => ({
      ...prev,
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      background: preset.colors.background,
      headerBackground: preset.colors.headerBackground
    }));

    // Parse gradient if present
    if (preset.colors.headerBackground.includes('gradient')) {
      setUseGradient(true);
      const match = preset.colors.headerBackground.match(/linear-gradient\((.*?),(.*?),(.*?)\)/);
      if (match) {
        setGradientDirection(match[1].trim());
        setGradientStart(match[2].trim());
        setGradientEnd(match[3].trim());
      }
    } else {
      setUseGradient(false);
    }

    // Atualizar formData imediatamente para refletir no preview
    updateFormData({
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      background: preset.colors.background,
      headerBackground: preset.colors.headerBackground
    });
  };

  // Função para atualizar uma cor específica
  const updateLocalColor = (colorKey: keyof Omit<ThemeData, 'allowThemeToggle'>, value: string) => {
    setLocalThemeData(prev => ({
      ...prev,
      [colorKey]: value
    }));
    onPresetChange(null);

    // Atualizar formData imediatamente para refletir no preview
    updateFormData({
      [colorKey]: value
    });
  };

  // Função para atualizar o gradiente
  const updateGradient = () => {
    const gradientValue = `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`;
    updateLocalColor('headerBackground', gradientValue);
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
                  <p className="text-sm opacity-80 mb-4">{theme.description}</p>
                  <div className="flex gap-2">
                    {Object.entries(theme.colors).map(([colorKey, color]) => (
                      <div
                        key={colorKey}
                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
                        style={{ 
                          background: color.includes('gradient') ? color : color,
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
            value={localThemeData.background}
            onChange={(color) => updateLocalColor('background', color)}
            description="Cor de fundo da página"
            presets={COLOR_PRESETS.background}
          />
        </div>

        {/* Header Background Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Fundo do Cabeçalho</h4>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!useGradient}
                onChange={() => setUseGradient(false)}
                className="text-blue-600"
              />
              <span>Cor Sólida</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={useGradient}
                onChange={() => setUseGradient(true)}
                className="text-blue-600"
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
                  onChange={(color) => {
                    setGradientStart(color);
                    updateGradient();
                  }}
                  presets={COLOR_PRESETS.accent}
                />
                
                <ColorPicker
                  label="Cor Final"
                  value={gradientEnd}
                  onChange={(color) => {
                    setGradientEnd(color);
                    updateGradient();
                  }}
                  presets={COLOR_PRESETS.accent}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Direção do Gradiente</label>
                <select
                  value={gradientDirection}
                  onChange={(e) => {
                    setGradientDirection(e.target.value);
                    updateGradient();
                  }}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  {GRADIENT_DIRECTIONS.map(direction => (
                    <option key={direction.value} value={direction.value}>
                      {direction.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <ColorPicker
              label="Cor do Cabeçalho"
              value={localThemeData.headerBackground}
              onChange={(color) => updateLocalColor('headerBackground', color)}
              description="Cor de fundo do cabeçalho quando estilo sólido"
              presets={COLOR_PRESETS.background}
            />
          )}
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