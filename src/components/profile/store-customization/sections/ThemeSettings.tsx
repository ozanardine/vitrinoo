import React from 'react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ColorPicker } from '../forms/ColorPicker';

export function ThemeSettings() {
  const { formData, updateFormData } = useStoreCustomization();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ColorPicker
          label="Cor Principal"
          value={formData.primaryColor}
          onChange={(color) => updateFormData({ primaryColor: color })}
          description="Cor principal do seu catálogo"
        />

        <ColorPicker
          label="Cor Secundária"
          value={formData.secondaryColor}
          onChange={(color) => updateFormData({ secondaryColor: color })}
          description="Cor dos textos e elementos"
        />

        <ColorPicker
          label="Cor de Destaque"
          value={formData.accentColor}
          onChange={(color) => updateFormData({ accentColor: color })}
          description="Cor para botões e elementos de destaque"
        />
      </div>

      <div>
        <h4 className="font-medium mb-4">Previsualização das Cores</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: formData.primaryColor }}>
            <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <h5 className="font-medium mb-2" style={{ color: formData.secondaryColor }}>
                Exemplo de Título
              </h5>
              <p className="text-sm" style={{ color: formData.secondaryColor }}>
                Exemplo de texto com a combinação de cores selecionada
              </p>
              <button
                className="mt-4 px-4 py-2 rounded-lg"
                style={{ backgroundColor: formData.accentColor, color: '#FFFFFF' }}
              >
                Botão de Exemplo
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: formData.primaryColor }}
              />
              <span>Cor Principal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: formData.secondaryColor }}
              />
              <span>Cor Secundária</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: formData.accentColor }}
              />
              <span>Cor de Destaque</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}