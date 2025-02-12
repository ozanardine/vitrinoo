import React from 'react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { AlertCircle } from 'lucide-react';

export function LayoutSettings() {
  const { formData, updateFormData } = useStoreCustomization();

  // Validar configurações de layout
  const validateLayout = () => {
    const messages = [];
    
    // Validar número de colunas com estilo compacto
    if (formData.productCardStyle === 'compact' && Number(formData.gridColumns) > 3) {
      messages.push('O estilo compacto é recomendado com no máximo 3 colunas');
    }

    // Validar espaçamento com estilo minimal
    if (formData.productCardStyle === 'minimal' && Number(formData.gridGap) < 24) {
      messages.push('O estilo minimal funciona melhor com espaçamento maior (24px ou mais)');
    }

    return messages;
  };

  const layoutWarnings = validateLayout();

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Estilo dos Cards de Produto</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => updateFormData({ productCardStyle: 'default' })}
            className={`p-4 border rounded-lg ${
              formData.productCardStyle === 'default'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-2" />
            <div className="space-y-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ productCardStyle: 'compact' })}
            className={`p-4 border rounded-lg ${
              formData.productCardStyle === 'compact'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex gap-2">
              <div className="w-1/3 aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ productCardStyle: 'minimal' })}
            className={`p-4 border rounded-lg ${
              formData.productCardStyle === 'minimal'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <div className="mt-2 text-center space-y-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto" />
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mx-auto" />
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Colunas na Grade</label>
          <select
            value={formData.gridColumns}
            onChange={(e) => updateFormData({ gridColumns: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="2">2 Colunas</option>
            <option value="3">3 Colunas</option>
            <option value="4">4 Colunas</option>
            <option value="5">5 Colunas</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">Número de produtos por linha</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Espaçamento da Grade</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={formData.gridGap}
              onChange={(e) => updateFormData({ gridGap: e.target.value })}
              className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="16"
              max="48"
              step="4"
            />
            <span className="text-gray-500">px</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Espaço entre os produtos</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Largura do Conteúdo</label>
          <select
            value={formData.containerWidth}
            onChange={(e) => updateFormData({ containerWidth: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="max-w-5xl">Estreita (1024px)</option>
            <option value="max-w-6xl">Média (1152px)</option>
            <option value="max-w-7xl">Larga (1280px)</option>
            <option value="max-w-full">Tela Cheia</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">Largura máxima do conteúdo</p>
        </div>
      </div>

      {layoutWarnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Recomendações de Layout
            </h4>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            {layoutWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}