import React, { useMemo } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ColorPicker } from '../forms/ColorPicker';
import { useStore } from '../../../../lib/store';
import { useStoreTheme } from '../../../../lib/store-theme';
import { StoreThemeToggle } from '../../../store/StoreThemeToggle';

const THEME_PRESETS = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      muted: '#6b7280'
    }
  },
  dark: {
    background: '#111827',
    surface: '#1f2937',
    text: {
      primary: '#f9fafb',
      secondary: '#e5e7eb',
      muted: '#9ca3af'
    }
  }
} as const;

const COLOR_PRESETS = {
  accent: [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' }
  ],
  header: [
    { name: 'White', value: '#ffffff' },
    { name: 'Slate 50', value: '#f8fafc' },
    { name: 'Slate 100', value: '#f1f5f9' },
    { name: 'Gray 800', value: '#1f2937' },
    { name: 'Gray 900', value: '#111827' },
    { name: 'Gray 950', value: '#030712' }
  ]
};

export function ThemeSettings() {
  const { formData, updateFormData } = useStoreCustomization();
  const { theme: siteTheme } = useStore();
  const { theme: storeTheme } = useStoreTheme();

  const handleThemeToggle = (allowThemeToggle: boolean) => {
    updateFormData({ allowThemeToggle });
  };

  const previewStyles = useMemo(() => ({
    light: {
      button: {
        backgroundColor: formData.accentColor,
        color: '#ffffff',
        transition: 'all 0.2s ease-in-out',
        transform: 'scale(1)',
        ':hover': {
          transform: 'scale(1.02)',
          filter: 'brightness(1.1)'
        }
      },
      surface: {
        backgroundColor: THEME_PRESETS.light.surface,
        color: THEME_PRESETS.light.text.muted,
        transition: 'all 0.2s ease-in-out'
      }
    },
    dark: {
      button: {
        backgroundColor: formData.accentColor,
        color: '#ffffff',
        transition: 'all 0.2s ease-in-out',
        transform: 'scale(1)',
        ':hover': {
          transform: 'scale(1.02)',
          filter: 'brightness(1.1)'
        }
      },
      surface: {
        backgroundColor: THEME_PRESETS.dark.surface,
        color: THEME_PRESETS.dark.text.muted,
        transition: 'all 0.2s ease-in-out'
      }
    }
  }), [formData.accentColor]);

  return (
    <div className="space-y-8">
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800/30 dark:to-gray-800/50 rounded-lg border border-blue-100/50 dark:border-gray-700/50 backdrop-blur-sm">
        <h4 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Tema da Loja
        </h4>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: formData.allowThemeToggle ? 'rgb(59 130 246)' : '#9ca3af'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.allowThemeToggle}
                      onChange={(e) => handleThemeToggle(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className={`
                      inline-block h-4 w-4 rounded-full bg-white shadow-lg
                      transition-all duration-300 ease-spring
                      ${formData.allowThemeToggle ? 'translate-x-6' : 'translate-x-1'}
                      group-hover:scale-110
                    `} />
                  </div>
                  <span>
                    Permitir alternar tema
                  </span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-[3.25rem]">
                  {formData.allowThemeToggle
                    ? 'Os visitantes poderão alternar entre os temas claro e escuro.'
                    : 'O tema será fixo, e os visitantes não poderão alterá-lo.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200/50 dark:border-yellow-800/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <span className="text-sm">
                  O tema da loja é independente do tema do site principal.
                  Atualmente o site está em modo <strong>{siteTheme}</strong> e
                  a loja em modo <strong>{storeTheme}</strong>.
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <ColorPicker
              label="Cor de Destaque"
              value={formData.accentColor}
              onChange={(color) => updateFormData({ accentColor: color })}
              description="Cor principal para botões e elementos interativos"
              presets={COLOR_PRESETS.accent.map(preset => preset.value)}
            />

            <ColorPicker
              label="Cor de Fundo do Header"
              value={formData.headerBackground}
              onChange={(color) => updateFormData({ headerBackground: color })}
              description="Cor de fundo do cabeçalho quando estilo sólido"
              presets={COLOR_PRESETS.header.map(preset => preset.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Previsualização do Tema</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Light Theme Preview */}
          <div 
            className="p-6 rounded-lg border border-gray-200/50 transition-all duration-300 shadow-sm hover:shadow-md"
            style={{ backgroundColor: THEME_PRESETS.light.background }}
          >
            <div className="mb-4">
              <h5 className="font-medium" style={{ color: THEME_PRESETS.light.text.primary }}>
                Tema Claro
              </h5>
              <p className="text-sm" style={{ color: THEME_PRESETS.light.text.secondary }}>
                Exemplo de como seu conteúdo aparecerá no tema claro
              </p>
            </div>
            <div className="space-y-3">
              <button
                className="px-4 py-2 rounded-lg text-white w-full transition-all duration-300 hover:shadow-lg cursor-default"
                style={previewStyles.light.button}
                disabled
                onClick={(e) => e.preventDefault()}
              >
                Botão de Ação
              </button>
              <div className="p-3 rounded-lg transition-all duration-300" style={previewStyles.light.surface}>
                <span>Elemento secundário</span>
              </div>
            </div>
          </div>

          {/* Dark Theme Preview */}
          <div 
            className="p-6 rounded-lg border border-gray-700/50 transition-all duration-300 shadow-sm hover:shadow-md"
            style={{ backgroundColor: THEME_PRESETS.dark.background }}
          >
            <div className="mb-4">
              <h5 className="font-medium" style={{ color: THEME_PRESETS.dark.text.primary }}>
                Tema Escuro
              </h5>
              <p className="text-sm" style={{ color: THEME_PRESETS.dark.text.secondary }}>
                Exemplo de como seu conteúdo aparecerá no tema escuro
              </p>
            </div>
            <div className="space-y-3">
              <button
                className="px-4 py-2 rounded-lg text-white w-full transition-all duration-300 hover:shadow-lg cursor-default"
                style={previewStyles.dark.button}
                disabled
                onClick={(e) => e.preventDefault()}
              >
                Botão de Ação
              </button>
              <div className="p-3 rounded-lg transition-all duration-300" style={previewStyles.dark.surface}>
                <span>Elemento secundário</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
