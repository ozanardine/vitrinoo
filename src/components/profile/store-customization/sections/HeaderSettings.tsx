import { useState, useEffect } from 'react';
import { Image, Eye, EyeOff } from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ImageUploader } from '../../../upload/ImageUploader';

export function HeaderSettings() {
  const { previewData, updatePreview, stagePendingChanges } = useStoreCustomization();
  const [minHeight, setMinHeight] = useState(200);

  // Initialize visibility from previewData
  const [visibility, setVisibility] = useState(previewData.headerVisibility);

  // Calculate minimum height based on visible elements
  useEffect(() => {
    let height = 120; // Base mínima reduzida

    if (visibility.logo && previewData.logoUrl) {
      height += Math.min(Number(previewData.logoSize), 160) + 24;
    }

    if (visibility.title) {
      height += Math.min(Number(previewData.titleSize), 48) + 12;
    }

    if (visibility.description && previewData.description) {
      height += Math.min(Number(previewData.descriptionSize), 18) * 1.5 + 16;
    }

    if (visibility.socialLinks && previewData.socialLinks.length > 0) {
      height += 40;
    }

    height += 32;
    height = Math.ceil(height / 10) * 10;

    setMinHeight(height);
  }, [
    visibility,
    previewData.logoUrl,
    previewData.logoSize,
    previewData.titleSize,
    previewData.description,
    previewData.descriptionSize,
    previewData.socialLinks
  ]);

  const handleHeightChange = (value: string) => {
    const height = Math.min(Math.max(Number(value), minHeight), 800);
    
    // Atualiza preview
    updatePreview({ 
      headerHeight: height.toString() 
    }, 'header');

    // Aplica mudança
    stagePendingChanges({ 
      headerHeight: height.toString() 
    }, 'header');
  };

  const toggleVisibility = (element: keyof typeof visibility) => {
    const newVisibility = {
      ...visibility,
      [element]: !visibility[element]
    };
    setVisibility(newVisibility);

    // Atualiza preview
    updatePreview({ 
      headerVisibility: newVisibility 
    }, 'header');

    // Aplica mudança
    stagePendingChanges({ 
      headerVisibility: newVisibility 
    }, 'header');
  };

  const handleHeaderStyleChange = (style: 'solid' | 'gradient' | 'image') => {
    const updates = {
      headerStyle: style,
      headerBackground: style === 'solid' ? previewData.primaryColor : previewData.headerBackground
    };

    // Atualiza preview
    updatePreview(updates, 'header');

    // Aplica mudança
    stagePendingChanges(updates, 'header');
  };

  const handleGradientChange = (value: string) => {
    // Atualiza preview
    updatePreview({ 
      headerGradient: value 
    }, 'header');

    // Aplica mudança
    stagePendingChanges({ 
      headerGradient: value 
    }, 'header');
  };

  const handleImageUpload = (url: string) => {
    // Atualiza preview
    updatePreview({ 
      headerImage: url 
    }, 'header');

    // Aplica mudança
    stagePendingChanges({ 
      headerImage: url 
    }, 'header');
  };

  const handleOverlayOpacityChange = (value: string) => {
    // Atualiza preview
    updatePreview({ 
      headerOverlayOpacity: value 
    }, 'header');

    // Aplica mudança
    stagePendingChanges({ 
      headerOverlayOpacity: value 
    }, 'header');
  };

  const handleAlignmentChange = (value: 'left' | 'center' | 'right') => {
    // Atualiza preview
    updatePreview({ 
      headerAlignment: value 
    }, 'header');

    // Aplica mudança
    stagePendingChanges({ 
      headerAlignment: value 
    }, 'header');
  };

  const alignmentOptions = [
    { value: 'left' as const, label: 'À Esquerda' },
    { value: 'center' as const, label: 'Centralizado' },
    { value: 'right' as const, label: 'À Direita' }
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
            onClick={() => handleHeaderStyleChange('solid')}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              previewData.headerStyle === 'solid' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <span>Cor Sólida</span>
          </button>

          <button
            type="button"
            onClick={() => handleHeaderStyleChange('gradient')}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              previewData.headerStyle === 'gradient'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="w-full h-16 bg-gradient-to-b from-gray-200 to-white dark:from-gray-700 dark:to-gray-900 rounded" />
            <span>Gradiente</span>
          </button>

          <button
            type="button"
            onClick={() => handleHeaderStyleChange('image')}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
              previewData.headerStyle === 'image'
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
      {previewData.headerStyle === 'gradient' && (
        <div>
          <label className="block text-sm font-medium mb-2">Direção do Gradiente</label>
          <select
            value={previewData.headerGradient}
            onChange={(e) => handleGradientChange(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="to bottom">De cima para baixo</option>
            <option value="to right">Da esquerda para direita</option>
            <option value="to bottom right">Diagonal</option>
            <option value="to top">De baixo para cima</option>
          </select>
        </div>
      )}

      {previewData.headerStyle === 'image' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Imagem de Fundo</label>
            <ImageUploader
              onImageUrl={handleImageUpload}
              currentUrl={previewData.headerImage}
            />
            <p className="text-sm text-gray-500 mt-1">
              Recomendado: 1920x400px ou maior, formato 16:9
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Opacidade da Sobreposição ({previewData.headerOverlayOpacity}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={previewData.headerOverlayOpacity}
              onChange={(e) => handleOverlayOpacityChange(e.target.value)}
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
              value={previewData.headerHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="flex-1"
            />
            <span className="text-sm text-gray-500 w-16">
              {previewData.headerHeight}px
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Altura mínima: {minHeight}px
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alinhamento</label>
          <select
            value={previewData.headerAlignment}
            onChange={(e) => handleAlignmentChange(e.target.value as 'left' | 'center' | 'right')}
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