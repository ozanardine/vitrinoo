import { useEffect, useMemo, useCallback } from 'react';
import { Palette } from 'lucide-react';
import { useThemeStore } from '../../../../stores/useThemeStore';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { COLOR_THEMES, COLOR_PRESETS, GRADIENT_DIRECTIONS } from '../../../../constants/theme';
import { ColorPickerField } from './theme/ColorPickerField';
import { ThemePresetButton } from './theme/ThemePresetButton';

export function ThemeSettings() {
  const { formData, updateFormData } = useStoreCustomization();
  const themeState = useThemeStore();
  
  // Inicialização
  useEffect(() => {
    themeState.initializeTheme(formData);
  }, []);

  // Sincronização com formData
  useEffect(() => {
    updateFormData({
      primaryColor: themeState.primaryColor,
      secondaryColor: themeState.secondaryColor,
      accentColor: themeState.accentColor,
      background: themeState.background,
      headerBackground: themeState.headerBackground,
      headerStyle: themeState.headerStyle,
      headerGradient: themeState.gradient.direction
    });
  }, [themeState, updateFormData]);

  // Handlers memoizados
  const handleColorChange = useCallback((key: keyof typeof themeState) => (color: string) => {
    themeState.updateColor(key, color);
  }, []);

  const handleGradientChange = useCallback((prop: 'direction' | 'startColor' | 'endColor') => (value: string) => {
    themeState.updateGradient(prop, value);
  }, []);

  // Presets memoizados
  const presetButtons = useMemo(() => (
    Object.entries(COLOR_THEMES).map(([key, theme]) => (
      <ThemePresetButton
        key={key}
        presetKey={key}
        theme={theme}
        isSelected={themeState.selectedPreset === key}
        onSelect={themeState.applyPreset}
      />
    ))
  ), [themeState.selectedPreset]);

  // Estilos memoizados para preview
  const previewStyles = useMemo(() => ({
    container: {
      backgroundColor: themeState.primaryColor,
      color: themeState.secondaryColor
    },
    header: {
      background: themeState.headerStyle === 'gradient'
        ? `linear-gradient(${themeState.gradient.direction}, ${themeState.gradient.startColor}, ${themeState.gradient.endColor})`
        : themeState.headerBackground
    }
  }), [themeState]);

  return (
    <div className="space-y-8">
      {/* Presets Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Temas Predefinidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presetButtons}
        </div>
      </section>

      {/* Color Pickers Section */}
      <section className="space-y-6">
        <h3 className="text-lg font-semibold">Cores Personalizadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPickerField
            label="Cor Principal"
            value={themeState.primaryColor}
            onChange={handleColorChange('primaryColor')}
            description="Cor de fundo principal"
            presets={COLOR_PRESETS.primary}
          />
          {/* Adicione os outros ColorPickerFields aqui */}
        </div>
      </section>

      {/* Preview Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="p-6 rounded-lg" style={previewStyles.container}>
          {/* Preview content */}
        </div>
      </section>
    </div>
  );
}