import { COLOR_THEMES } from '../../../../../constants/theme';

interface ThemePresetSelectorProps {
  selectedPreset: string | null;
  onSelect: (presetId: string, colors: any) => void;
}

export function ThemePresetSelector({ selectedPreset, onSelect }: ThemePresetSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Object.entries(COLOR_THEMES).map(([key, theme]) => (
        <button
          key={key}
          onClick={() => onSelect(key, theme.colors)}
          className={`
            p-4 rounded-lg border-2 transition-all
            ${selectedPreset === key 
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
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {theme.description}
          </p>
          <div className="mt-3 flex gap-2">
            {['primary', 'secondary', 'accent'].map(colorKey => (
              <div
                key={colorKey}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: theme.colors[colorKey as keyof typeof theme.colors] }}
              />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}