import { useState } from 'react';
import { COLOR_THEMES, ColorTheme } from '../../../../../constants/theme';
import { useThemeStore } from '../../../../../stores/useThemeStore';

interface ThemePresetSelectorProps {
  selectedPreset: string | null;
  onSelect: (presetId: string, colors: ColorTheme['colors']) => void;
}

export function ThemePresetSelector({ selectedPreset, onSelect }: ThemePresetSelectorProps) {
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const themeState = useThemeStore();
  
  // Verifica se o preset atual tem modificações
  const isPresetModified = (presetKey: string): boolean => {
    if (!themeState.isDirty || selectedPreset !== presetKey) return false;
    
    const preset = COLOR_THEMES[presetKey];
    if (!preset) return false;
    
    return (
      themeState.primaryColor !== preset.colors.primary ||
      themeState.secondaryColor !== preset.colors.secondary ||
      themeState.accentColor !== preset.colors.accent ||
      themeState.headerBackground !== preset.colors.header.background
    );
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Object.entries(COLOR_THEMES).map(([key, theme]) => {
        const isSelected = selectedPreset === key;
        const isModified = isPresetModified(key);
        
        return (
          <button
            key={key}
            // Importante: adicionar type="button" para evitar que funcione como submit
            type="button"
            onClick={() => onSelect(key, theme.colors)}
            onMouseEnter={() => setHoveredPreset(key)}
            onMouseLeave={() => setHoveredPreset(null)}
            className={`
              p-4 rounded-lg border-2 transition-all relative
              ${isSelected 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: theme.colors.accent }}
              />
              <span className="font-medium">{theme.name}</span>
              
              {isSelected && isModified && (
                <span className="ml-auto text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                  Modificado
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {theme.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { key: 'primary', label: 'Primary' },
                { key: 'secondary', label: 'Secondary' },
                { key: 'accent', label: 'Accent' },
                { key: 'surface', label: 'Surface' },
                { key: 'border', label: 'Border' },
                { key: 'muted', label: 'Muted' }
              ].map(({ key: colorKey, label }) => {
                // Pega o valor da cor do tema
                const colorValue = typeof theme.colors[colorKey as keyof ColorTheme['colors']] === 'string' 
                  ? theme.colors[colorKey as keyof ColorTheme['colors']] as string
                  : (theme.colors[colorKey as keyof ColorTheme['colors']] as { background: string }).background;
                
                // Compara com o valor atual no store se for o preset selecionado
                const isColorModified = isSelected && isModified && (
                  (colorKey === 'primary' && themeState.primaryColor !== colorValue) ||
                  (colorKey === 'secondary' && themeState.secondaryColor !== colorValue) ||
                  (colorKey === 'accent' && themeState.accentColor !== colorValue) ||
                  (colorKey === 'surface' && themeState.surfaceColor !== colorValue) ||
                  (colorKey === 'border' && themeState.borderColor !== colorValue) ||
                  (colorKey === 'muted' && themeState.mutedColor !== colorValue)
                );
                
                return (
                  <div
                    key={colorKey}
                    className={`w-6 h-6 rounded-full border-2 shadow-sm relative ${
                      isColorModified ? 'border-yellow-500' : 'border-white'
                    }`}
                    style={{ backgroundColor: colorValue }}
                    title={`${label}${isColorModified ? ' (modificado)' : ''}`}
                  >
                    {isColorModified && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-500" />
                    )}
                  </div>
                );
              })}
            </div>
            
            {hoveredPreset === key && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white font-medium px-4 py-2 bg-blue-600 rounded-lg">
                  {isSelected ? 'Selecionado' : 'Selecionar'} 
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}