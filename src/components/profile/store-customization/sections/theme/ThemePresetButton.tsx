import { memo } from 'react';
import { Check } from 'lucide-react';
import { COLOR_THEMES } from '../../../../../constants/theme';

interface ThemePresetButtonProps {
  presetKey: string;
  theme: typeof COLOR_THEMES[keyof typeof COLOR_THEMES];
  isSelected: boolean;
  onSelect: (key: string) => void;
}

export const ThemePresetButton = memo(function ThemePresetButton({
  presetKey,
  theme,
  isSelected,
  onSelect
}: ThemePresetButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(presetKey)}
      className={`p-6 rounded-lg border-2 text-left transition-all hover:scale-[1.02] relative overflow-hidden ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
      }`}
      style={{
        backgroundColor: theme.colors.primary as string,
        color: theme.colors.secondary as string
      }}
    >
      {isSelected && (
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
                background: color as string,
                borderColor: `${theme.colors.secondary}20`
              }}
              title={`${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}: ${color}`}
            />
          ))}
        </div>
      </div>
    </button>
  );
});