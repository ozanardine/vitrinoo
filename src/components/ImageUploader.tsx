import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadImage } from '../lib/imgur';

interface ImageUploaderProps {
  onImageUrl: (url: string) => void;
  currentUrl?: string;
}

export function ImageUploader({ onImageUrl, currentUrl }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState(currentUrl || '');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('A imagem deve ter no máximo 10MB.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const imageUrl = await uploadImage(file);
      onImageUrl(imageUrl);
      setManualUrl(imageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualUrl(e.target.value);
    onImageUrl(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">URL da Imagem</label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="url"
              value={manualUrl}
              onChange={handleManualUrlChange}
              className="w-full p-2 pr-8 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="https://"
            />
            {manualUrl && (
              <button
                onClick={() => {
                  setManualUrl('');
                  onImageUrl('');
                }}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
              disabled={loading}
            />
            <label
              htmlFor="image-upload"
              className={`flex items-center px-4 py-2 border rounded cursor-pointer
                ${loading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'} 
                dark:border-gray-600 dark:hover:bg-gray-700`}
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

      {manualUrl && (
        <img
          src={manualUrl}
          alt="Preview"
          className="w-full h-48 object-cover rounded"
        />
      )}
    </div>
  );
}