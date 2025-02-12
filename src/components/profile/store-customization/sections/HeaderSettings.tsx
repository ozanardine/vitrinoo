import React, { useState, useEffect } from 'react';
import { Image, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ImageUploader } from '../../../ImageUploader';

export function HeaderSettings() {
  const { formData, updateFormData } = useStoreCustomization();
  const [minHeight, setMinHeight] = useState(200);

  // Initialize visibility from formData
  const [visibility, setVisibility] = useState(formData.headerVisibility);

  // Calculate minimum height based on visible elements
  useEffect(() => {
    let height = 120; // Base mínima reduzida

    if (visibility.logo && formData.logoUrl) {
      height += Math.min(Number(formData.logoSize), 160) + 24;
    }

    if (visibility.title) {
      height += Math.min(Number(formData.titleSize), 48) + 12;
    }

    if (visibility.description && formData.description) {
      height += Math.min(Number(formData.descriptionSize), 18) * 1.5 + 16;
    }

    if (visibility.socialLinks && formData.socialLinks.length > 0) {
      height += 40;
    }

    height += 32;
    height = Math.ceil(height / 10) * 10;

    setMinHeight(height);
  }, [
    visibility,
    formData.logoUrl,
    formData.logoSize,
    formData.titleSize,
    formData.description,
    formData.descriptionSize,
    formData.socialLinks
  ]);

  const handleHeightChange = (value: string) => {
    const height = Math.min(Math.max(Number(value), minHeight), 800);
    updateFormData({ headerHeight: height.toString() });
  };

  const toggleVisibility = (element: keyof typeof visibility) => {
    const newVisibility = {
      ...visibility,
      [element]: !visibility[element]
    };
    setVisibility(newVisibility);
    updateFormData({ headerVisibility: newVisibility });
  };

  const alignmentOptions = [
    { value: 'left', label: 'À Esquerda' },
    { value: 'center', label: 'Centralizado' },
    { value: 'right', label: 'À Direita' }
  ];

  return (
    <div className="space-y-6">
      {/* Controles de Visibilidade */}
      <div>
        <label className="block text-sm font-medium mb-2">Elementos Visíveis</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleVisibility('logo')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
              visibility.logo
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {visibility.logo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Logo</span>
          </button>

          <button
            type="button"
            onClick={() => toggleVisibility('title')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
              visibility.title
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {visibility.title ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Título</span>
          </button>

          <button
            type="button"
            onClick={() => toggleVisibility('description')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
              visibility.description
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {visibility.description ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Descrição</span>
          </button>

          <button
            type="button"
            onClick={() => toggleVisibility('socialLinks')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
              visibility.socialLinks
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {visibility.socialLinks ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Redes Sociais</span>
          </button>
        </div>
      </div>

      {/* Estilo do Cabeçalho */}
      <div>
        <label className="block text-sm font-medium mb-2">Estilo do Cabeçalho</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => updateFormData({ headerStyle: 'solid' })}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              formData.headerStyle === 'solid' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <span>Cor Sólida</span>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ headerStyle: 'gradient' })}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              formData.headerStyle === 'gradient'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="w-full h-16 bg-gradient-to-b from-gray-200 to-white dark:from-gray-700 dark:to-gray-900 rounded" />
            <span>Gradiente</span>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ headerStyle: 'image' })}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              formData.headerStyle === 'image'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <Image className="w-6 h-6 text-gray-400" />
            </div>
            <span>Imagem de Fundo</span>
          </button>
        </div>
      </div>

      {/* Configurações específicas do estilo */}
      {formData.headerStyle === 'gradient' && (
        <div>
          <label className="block text-sm font-medium mb-2">Direção do Gradiente</label>
          <select
            value={formData.headerGradient}
            onChange={(e) => updateFormData({ headerGradient: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="to bottom">De cima para baixo</option>
            <option value="to right">Da esquerda para direita</option>
            <option value="to bottom right">Diagonal</option>
            <option value="to top">De baixo para cima</option>
          </select>
        </div>
      )}

      {formData.headerStyle === 'image' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Imagem de Fundo</label>
            <ImageUploader
              onImageUrl={(url) => updateFormData({ headerImage: url })}
              currentUrl={formData.headerImage}
            />
            <p className="text-sm text-gray-500 mt-1">
              Recomendado: 1920x400px ou maior, formato 16:9
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Opacidade da Sobreposição ({formData.headerOverlayOpacity}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.headerOverlayOpacity}
              onChange={(e) => updateFormData({ headerOverlayOpacity: e.target.value })}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ajuste a opacidade da sobreposição escura sobre a imagem
            </p>
          </div>
        </div>
      )}

      {/* Altura e Alinhamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Altura do Cabeçalho</label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min={minHeight}
              max="800"
              step="10"
              value={formData.headerHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-16">
              {formData.headerHeight}px
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Altura mínima: {minHeight}px
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alinhamento</label>
          <select
            value={formData.headerAlignment}
            onChange={(e) => updateFormData({ headerAlignment: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            {alignmentOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Alinhamento do conteúdo do cabeçalho
          </p>
        </div>
      </div>
    </div>
  );
}