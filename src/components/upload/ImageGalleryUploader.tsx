import { useState } from 'react';
import { Info, Trash2, X, Plus } from 'lucide-react';
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
  const [manualUrl, setManualUrl] = useState('');
  const [showUrlInfo, setShowUrlInfo] = useState(false);

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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Adicionar imagem por URL</h4>
            <button
              type="button"
              onClick={() => setShowUrlInfo(!showUrlInfo)}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              <Info className="w-4 h-4" />
              <span>Ajuda</span>
            </button>
          </div>

          {showUrlInfo && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <p className="text-blue-700 dark:text-blue-300">
                Cole a URL direta da imagem. A URL deve terminar com uma extensão de imagem (ex: .jpg, .png, .jpeg).
                Certifique-se de que a URL é pública e acessível.
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="w-full p-2 pr-8 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {manualUrl && (
                <button
                  onClick={() => setManualUrl('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (manualUrl) {
                  handleAddImage(manualUrl);
                  setManualUrl('');
                }
              }}
              disabled={!manualUrl}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <BaseImageUploader
            onSuccess={handleAddImage}
            onError={setError}
            disabled={!canUseImgur}
            {...props}
          />
        </div>
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

      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {images.length} de {maxImages} imagens
        </p>
        {planType === 'free' ? (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Plano Gratuito: Você pode adicionar até 3 imagens apenas via URL.
              Para fazer upload de imagens diretamente do seu computador, faça upgrade para o plano Básico ou Plus.
            </p>
          </div>
        ) : !canUseImgur && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Upload de imagens disponível apenas para planos Básico e Plus
          </p>
        )}
      </div>
    </div>
  );
}