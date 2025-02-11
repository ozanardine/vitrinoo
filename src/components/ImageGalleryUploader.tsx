import React, { useState } from 'react';
import { Upload, X, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { uploadImage } from '../lib/imgur';

interface ImageGalleryUploaderProps {
  onImagesChange: (urls: string[]) => void;
  currentImages?: string[];
  maxImages?: number;
  planType: 'free' | 'basic' | 'plus';
}

export function ImageGalleryUploader({ 
  onImagesChange, 
  currentImages = [], 
  maxImages = 5,
  planType 
}: ImageGalleryUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(currentImages);
  const [manualUrl, setManualUrl] = useState('');
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Verificar se o plano permite upload
  const canUseImgur = planType === 'basic' || planType === 'plus';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canUseImgur) {
      setError('O upload de imagens está disponível apenas para planos Básico e Plus');
      return;
    }

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('A imagem deve ter no máximo 10MB.');
      return;
    }

    if (images.length >= maxImages) {
      setError(`Você atingiu o limite de ${maxImages} imagens.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const imageUrl = await uploadImage(file);
      const newImages = [...images, imageUrl];
      setImages(newImages);
      onImagesChange(newImages);
      setManualUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUrlAdd = () => {
    if (!manualUrl) return;

    if (images.length >= maxImages) {
      setError(`Você atingiu o limite de ${maxImages} imagens.`);
      return;
    }

    const newImages = [...images, manualUrl];
    setImages(newImages);
    onImagesChange(newImages);
    setManualUrl('');
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
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
            <h4 className="font-medium text-blue-800 dark:text-blue-200">Diretrizes para imagens:</h4>
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

        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="w-full p-2 pr-8 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://"
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
            onClick={handleManualUrlAdd}
            disabled={!manualUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
              disabled={loading || !canUseImgur}
            />
            <label
              htmlFor="image-upload"
              className={`flex items-center px-4 py-2 border rounded cursor-pointer
                ${loading || !canUseImgur ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'} 
                dark:border-gray-600 dark:hover:bg-gray-700`}
              title={!canUseImgur ? 'Disponível apenas para planos Básico e Plus' : 'Upload de imagem'}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </label>
          </div>
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
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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