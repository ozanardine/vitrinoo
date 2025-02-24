import { useState } from 'react';
import { Check } from 'lucide-react';
import { COLOR_THEMES, ColorTheme } from '../../../../../constants/theme';
import { useThemeStore } from '../../../../../stores/useThemeStore';

interface ThemePresetSelectorProps {
  selectedPreset: string | null;
  onSelect: (presetId: string) => void;
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

  // Agrupa temas por categoria
  const groupedThemes = Object.entries(COLOR_THEMES).reduce((acc, [key, theme]) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push({ key, theme });
    return acc;
  }, {} as Record<string, Array<{ key: string; theme: ColorTheme }>>);
  
  return (
    <div className="space-y-8">
      {(['light', 'dark', 'branded'] as const).map((category) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            {category === 'light' && 'Temas Claros'}
            {category === 'dark' && 'Temas Escuros'}
            {category === 'branded' && 'Temas Personalizados'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedThemes[category]?.map(({ key, theme }) => {
              const isSelected = selectedPreset === key;
              const isModified = isPresetModified(key);
              
              return (
                <div
                  key={key}
                  className={`
                    group relative overflow-hidden rounded-lg transition-all duration-200
                    ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:ring-1 hover:ring-blue-500/50 hover:shadow-md'}
                  `}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(key)}
                    onMouseEnter={() => setHoveredPreset(key)}
                    onMouseLeave={() => setHoveredPreset(null)}
                    className="w-full text-left"
                  >
                    <div 
                      className="p-6 space-y-4"
                      style={{ 
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.border
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div 
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: theme.colors.accent }}
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 
                              className="font-semibold text-lg"
                              style={{ color: theme.colors.secondary }}
                            >
                              {theme.name}
                            </h3>
                            {isSelected && isModified && (
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${theme.colors.accent}20`,
                                  color: theme.colors.accent
                                }}
                              >
                                Modificado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p 
                        className="text-sm"
                        style={{ color: `${theme.colors.secondary}CC` }}
                      >
                        {theme.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'primary' as const },
                          { key: 'secondary' as const },
                          { key: 'accent' as const },
                          { key: 'surface' as const },
                          { key: 'border' as const },
                          { key: 'muted' as const }
                        ].map(({ key: colorKey }) => {
                          const color = theme.colors[colorKey];
                          
                          const isColorModified = isSelected && isModified && (
                            (colorKey === 'primary' && themeState.primaryColor !== color) ||
                            (colorKey === 'secondary' && themeState.secondaryColor !== color) ||
                            (colorKey === 'accent' && themeState.accentColor !== color)
                          );
                          
                          return (
                            <div
                              key={colorKey}
                              className={`
                                relative w-8 h-8 rounded-full border-2 shadow-sm transition-all duration-200
                                ${isColorModified ? 'ring-2 ring-yellow-500' : 'border-white/30'}
                                group-hover:scale-105
                              `}
                              style={{ backgroundColor: color }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {hoveredPreset === key && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center transition-opacity"
                        style={{ backgroundColor: `${theme.colors.secondary}66` }}
                      >
                        <span 
                          className="px-4 py-2 rounded-lg font-medium shadow-lg"
                          style={{ 
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.secondary
                          }}
                        >
                          {isSelected ? 'Selecionado' : 'Selecionar Tema'}
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}