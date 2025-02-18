import React, { useState, useEffect } from 'react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { RangeInput } from '../forms/RangeInput';
import '@fontsource/roboto';
import '@fontsource/open-sans';
import '@fontsource/lato';
import '@fontsource/montserrat';
import '@fontsource/playfair-display';
import '@fontsource/merriweather';
import '@fontsource/source-code-pro';
import '@fontsource/fira-mono';

const FONT_OPTIONS = {
  sans: [
    { value: 'roboto', label: 'Roboto', family: 'Roboto' },
    { value: 'open-sans', label: 'Open Sans', family: 'Open Sans' },
    { value: 'lato', label: 'Lato', family: 'Lato' },
    { value: 'montserrat', label: 'Montserrat', family: 'Montserrat' }
  ],
  serif: [
    { value: 'playfair', label: 'Playfair Display', family: 'Playfair Display' },
    { value: 'merriweather', label: 'Merriweather', family: 'Merriweather' }
  ],
  mono: [
    { value: 'source-code-pro', label: 'Source Code Pro', family: 'Source Code Pro' },
    { value: 'fira-mono', label: 'Fira Mono', family: 'Fira Mono' }
  ]
};

interface TypographyData {
  titleFont: string;
  bodyFont: string;
  logoSize: string;
  titleSize: string;
  descriptionSize: string;
}

interface TypographySettingsProps {
  onLocalChange?: (localData: TypographyData) => void;
}

export function TypographySettings({ onLocalChange }: TypographySettingsProps) {
  const { formData } = useStoreCustomization();

  // Estado local para armazenar alterações temporárias
  const [localTypographyData, setLocalTypographyData] = useState<TypographyData>({
    titleFont: formData.titleFont,
    bodyFont: formData.bodyFont,
    logoSize: formData.logoSize,
    titleSize: formData.titleSize,
    descriptionSize: formData.descriptionSize
  });

  // Sincronizar com formData quando ele mudar
  useEffect(() => {
    setLocalTypographyData({
      titleFont: formData.titleFont,
      bodyFont: formData.bodyFont,
      logoSize: formData.logoSize,
      titleSize: formData.titleSize,
      descriptionSize: formData.descriptionSize
    });
  }, [formData]);

  // Notificar mudanças no estado local
  useEffect(() => {
    onLocalChange?.(localTypographyData);
  }, [localTypographyData, onLocalChange]);

  // Função para obter a família da fonte
  const getFontFamily = (font: string) => {
    for (const category of Object.values(FONT_OPTIONS)) {
      const foundFont = category.find(f => f.value === font);
      if (foundFont) return foundFont.family;
    }
    return 'system-ui';
  };

  // Função para atualizar o estado local
  const updateLocalData = (updates: Partial<TypographyData>) => {
    setLocalTypographyData(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-medium">Tipografia</h3>

      {/* Font Sizes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RangeInput
          label="Tamanho da Logo"
          value={localTypographyData.logoSize.replace('px', '')}
          onChange={(value) => updateLocalData({ logoSize: `${value}px` })}
          min="80"
          max="300"
          step="10"
          unit="px"
          description="Tamanho em pixels (80-300px)"
        />

        <RangeInput
          label="Tamanho do Título"
          value={localTypographyData.titleSize.replace('px', '')}
          onChange={(value) => updateLocalData({ titleSize: `${value}px` })}
          min="24"
          max="72"
          step="2"
          unit="px"
          description="Tamanho em pixels (24-72px)"
        />

        <RangeInput
          label="Tamanho da Descrição"
          value={localTypographyData.descriptionSize.replace('px', '')}
          onChange={(value) => updateLocalData({ descriptionSize: `${value}px` })}
          min="14"
          max="24"
          step="1"
          unit="px"
          description="Tamanho em pixels (14-24px)"
        />
      </div>

      {/* Font Families */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Title Font */}
        <div className="space-y-4">
          <label className="block text-sm font-medium">Fonte dos Títulos</label>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(FONT_OPTIONS).map(([category, fonts]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm text-gray-500 dark:text-gray-400 capitalize">{category}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {fonts.map(font => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => updateLocalData({ titleFont: font.value })}
                      className={`
                        p-3 text-left rounded-lg border-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800
                        ${localTypographyData.titleFont === font.value 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'}
                      `}
                    >
                      <span style={{ fontFamily: font.family }}>{font.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body Font */}
        <div className="space-y-4">
          <label className="block text-sm font-medium">Fonte do Texto</label>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(FONT_OPTIONS).map(([category, fonts]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm text-gray-500 dark:text-gray-400 capitalize">{category}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {fonts.map(font => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => updateLocalData({ bodyFont: font.value })}
                      className={`
                        p-3 text-left rounded-lg border-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800
                        ${localTypographyData.bodyFont === font.value 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'}
                      `}
                    >
                      <span style={{ fontFamily: font.family }}>{font.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 space-y-4">
        <h4 className="font-medium">Prévia da Tipografia</h4>
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          <h1 
            style={{ 
              fontSize: localTypographyData.titleSize,
              fontFamily: getFontFamily(localTypographyData.titleFont)
            }}
            className="mb-4"
          >
            Exemplo de Título
          </h1>
          <p 
            style={{ 
              fontSize: localTypographyData.descriptionSize,
              fontFamily: getFontFamily(localTypographyData.bodyFont)
            }}
            className="max-w-2xl"
          >
            Este é um exemplo de texto para demonstrar como a tipografia será exibida no seu catálogo.
            O tamanho e estilo das fontes podem ser ajustados para melhor se adequar à sua marca.
            Experimente diferentes combinações até encontrar o visual perfeito para sua loja.
          </p>
        </div>
      </div>
    </div>
  );
}