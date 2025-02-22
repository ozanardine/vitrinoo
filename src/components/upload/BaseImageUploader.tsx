import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { BaseImageUploaderProps, ImageUploaderState } from './types';
import { validateImage } from './utils';
import { uploadImage } from '../../lib/imgur';

interface BaseImageUploaderCompProps extends BaseImageUploaderProps {
  onSuccess: (url: string) => void;
  onClear?: () => void;
  currentUrl?: string;
}

export function BaseImageUploader({
  onSuccess,
  onError,
  onClear,
  currentUrl,
  disabled = false,
  className = '',
  ...validationProps
}: BaseImageUploaderCompProps) {
  const [state, setState] = useState<ImageUploaderState>({
    loading: false,
    error: null
  });
  const [manualUrl, setManualUrl] = useState(currentUrl || '');

  const handleError = (message: string) => {
    setState(prev => ({ ...prev, error: message }));
    onError?.(message);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState({ loading: true, error: null });

    try {
      // Validar imagem
      const validation = await validateImage(file, validationProps);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Upload
      const imageUrl = await uploadImage(file);
      onSuccess(imageUrl);
      setManualUrl(imageUrl);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleManualUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setManualUrl(url);
    onSuccess(url);
  };

  const handleClear = () => {
    setManualUrl('');
    onClear?.();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={manualUrl}
            onChange={handleManualUrlChange}
            disabled={disabled || state.loading}
            className="w-full p-2 pr-8 border rounded dark:bg-gray-700 dark:border-gray-600 
              disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="https://"
          />
          {manualUrl && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || state.loading}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="relative">
          <input
            type="file"
            accept={validationProps.acceptedFormats?.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
            disabled={disabled || state.loading}
          />
          <label
            htmlFor="image-upload"
            className={`flex items-center px-4 py-3 rounded transition-colors
              ${(disabled || state.loading)
                ? 'bg-blue-600/50 dark:bg-blue-600/50 text-white/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700'}`}
          >
            {state.loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </label>
        </div>
      </div>

      {state.error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </div>
      )}
    </div>
  );
}