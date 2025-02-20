import { useState } from 'react';
import { Info, Trash2 } from 'lucide-react';
import { GalleryImageUploaderProps } from './types';
import { BaseImageUploader } from './BaseImageUploader';

export function ImageGalleryUploader({
  onImagesChange,
  currentImages = [],
  maxImages = 5,
  planType,
  ...props
}: GalleryImageUploaderProps) {
  const [images, setImages] = useState<string[]>(currentImages);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o plano permite upload
  const canUseImgur = planType === 'basic' || planType === 'plus';

  const handleAddImage = (url: string) => {
    if (images.length >= maxImages) {
      setError(`Você atingiu o limite de ${maxImages} imagens.`);
      return;
    }

    const newImages = [...images, url];
    setImages(newImages);
    onImagesChange(newImages);
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium">Imagens do Produto</label>
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            <Info className="w-4 h-4" />
            <span>Diretrizes de imagem</span>
          </button>
        </div>

        {showGuidelines && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">
              Diretrizes para imagens:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Dimensões recomendadas: 1000x1000 pixels (quadrada)</li>
              <li>Dimensões mínimas: 500x500 pixels</li>
              <li>Proporção: 1:1 (quadrada) para melhor visualização</li>
              <li>Formato: JPG ou PNG</li>
              <li>Tamanho máximo: 10MB</li>
              <li>Fundo branco ou neutro para melhor apresentação</li>
              <li>Boa iluminação e foco nítido</li>
              <li>Produto deve ocupar 80-90% do quadro</li>
            </ul>
            <p className="text-blue-600 dark:text-blue-400 mt-2">
              Dica: Use a primeira imagem como a principal do produto, ela será exibida na listagem.
            </p>
          </div>
        )}

        <BaseImageUploader
          onSuccess={handleAddImage}
          onError={setError}
          disabled={!canUseImgur}
          {...props}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Imagem ${index + 1}`}
              className="w-full h-32 object-cover rounded"
            />
            <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 
                    group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                <Trash2 className="w-4 h-4" />
            </button>
                    </div>
                    ))}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {images.length} de {maxImages} imagens
                    {!canUseImgur && (
                    <span className="ml-2 text-yellow-500">
                        (Upload de imagens disponível apenas para planos Básico e Plus)
                    </span>
                    )}
                </p>
                </div>
            );
            }