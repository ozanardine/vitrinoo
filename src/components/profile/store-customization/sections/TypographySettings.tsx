import React from 'react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { RangeInput } from '../forms/RangeInput';

export function TypographySettings() {
  const { formData, updateFormData } = useStoreCustomization();

  const getFontFamily = (font: string) => {
    switch (font) {
      case 'sans':
        return 'ui-sans-serif, system-ui, sans-serif';
      case 'serif':
        return 'ui-serif, Georgia, serif';
      case 'mono':
        return 'ui-monospace, monospace';
      case 'display':
        return 'var(--font-display), ui-sans-serif, system-ui, sans-serif';
      default:
        return 'ui-sans-serif, system-ui, sans-serif';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RangeInput
          label="Tamanho da Logo"
          value={formData.logoSize}
          onChange={(value) => updateFormData({ logoSize: value })}
          min="80"
          max="300"
          step="10"
          unit="px"
          description="Tamanho em pixels (80-300px)"
        />

        <RangeInput
          label="Tamanho do Título"
          value={formData.titleSize}
          onChange={(value) => updateFormData({ titleSize: value })}
          min="24"
          max="72"
          step="2"
          unit="px"
          description="Tamanho em pixels (24-72px)"
        />

        <RangeInput
          label="Tamanho da Descrição"
          value={formData.descriptionSize}
          onChange={(value) => updateFormData({ descriptionSize: value })}
          min="14"
          max="24"
          step="1"
          unit="px"
          description="Tamanho em pixels (14-24px)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Fonte dos Títulos</label>
          <select
            value={formData.titleFont}
            onChange={(e) => updateFormData({ titleFont: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="sans">Sans-serif (Moderna)</option>
            <option value="serif">Serif (Clássica)</option>
            <option value="display">Display (Decorativa)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">Fonte usada para títulos e cabeçalhos</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fonte do Texto</label>
          <select
            value={formData.bodyFont}
            onChange={(e) => updateFormData({ bodyFont: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="sans">Sans-serif (Moderna)</option>
            <option value="serif">Serif (Clássica)</option>
            <option value="mono">Monospace (Técnica)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">Fonte usada para textos e descrições</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-4">Previsualização da Tipografia</h4>
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          <h1 
            style={{ 
              fontSize: `${formData.titleSize}px`,
              fontFamily: getFontFamily(formData.titleFont)
            }}
          >
            Exemplo de Título
          </h1>
          <p 
            style={{ 
              fontSize: `${formData.descriptionSize}px`,
              fontFamily: getFontFamily(formData.bodyFont)
            }}
          >
            Este é um exemplo de texto para demonstrar como a tipografia será exibida no seu catálogo.
            O tamanho e estilo das fontes podem ser ajustados para melhor se adequar à sua marca.
          </p>
        </div>
      </div>
    </div>
  );
}