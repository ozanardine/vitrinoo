import { useState } from 'react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ImageUploader } from '../../../upload/ImageUploader';
import { AlertCircle } from 'lucide-react';
import { StoreFormData } from '../types';

type ValidationErrors = Partial<Record<keyof StoreFormData, string>>;

export function GeneralSettings() {
  const { formData, updatePreview } = useStoreCustomization();
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Função de validação local
  const validateField = (name: keyof StoreFormData, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'O nome da loja é obrigatório';
        if (value.length < 2) return 'O nome deve ter pelo menos 2 caracteres';
        if (value.length > 50) return 'O nome deve ter no máximo 50 caracteres';
        return '';
      
      case 'slug':
        if (!value.trim()) return 'A URL da loja é obrigatória';
        if (value.length < 3) return 'A URL deve ter pelo menos 3 caracteres';
        if (value.length > 30) return 'A URL deve ter no máximo 30 caracteres';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Use apenas letras minúsculas, números e hífens';
        return '';
      
      case 'description':
        if (value.length > 500) return 'A descrição deve ter no máximo 500 caracteres';
        return '';
        
      default:
        return '';
    }
  };

  // Handler para mudanças nos campos
  const handleFieldChange = (
    name: keyof Pick<StoreFormData, 'name' | 'slug' | 'description'>,
    value: string,
    debounce = false
  ) => {
    // Valida o campo
    const error = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // Se houver erro e for um campo que precisa de validação imediata, não atualiza
    if (error && !debounce) return;

    // Atualiza o preview
    updatePreview({
      [name]: value
    }, 'general');
  };

  // Handler específico para imagem
  const handleImageChange = (url: string) => {
    updatePreview({
      logoUrl: url
    }, 'general');
  };

  return (
    <div className="space-y-6">
      {/* Nome da Loja */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Nome da Loja
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className={`w-full p-2 border rounded transition-colors
            dark:bg-gray-700 
            ${validationErrors.name 
              ? 'border-red-500 dark:border-red-500' 
              : 'border-gray-200 dark:border-gray-600'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          `}
          placeholder="Digite o nome da sua loja"
          maxLength={50}
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.name}
          </p>
        )}
      </div>

      {/* URL da Loja */}
      <div>
        <label className="block text-sm font-medium mb-1">
          URL da Loja
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-1">
            {window.location.origin}/
          </span>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => handleFieldChange('slug', e.target.value.toLowerCase())}
            className={`flex-1 p-2 border rounded transition-colors
              dark:bg-gray-700 
              ${validationErrors.slug 
                ? 'border-red-500 dark:border-red-500' 
                : 'border-gray-200 dark:border-gray-600'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            `}
            placeholder="sua-loja"
            maxLength={30}
          />
        </div>
        {validationErrors.slug && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.slug}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Esta será a URL pública da sua loja
        </p>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value, true)}
          className={`w-full p-2 border rounded transition-colors
            dark:bg-gray-700 
            ${validationErrors.description 
              ? 'border-red-500 dark:border-red-500' 
              : 'border-gray-200 dark:border-gray-600'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          `}
          rows={3}
          placeholder="Uma breve descrição sobre sua loja..."
          maxLength={500}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Uma breve descrição que aparecerá no cabeçalho da sua loja
          </p>
          <span className="text-sm text-gray-500">
            {formData.description.length}/500
          </span>
        </div>
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.description}
          </p>
        )}
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Logo
        </label>
        <ImageUploader
          onImageUrl={(url) => console.log(url)}
          currentUrl="https://example.com/image.jpg"
          maxSizeMB={2}
          minWidth={200}
          minHeight={200}
          aspectRatio="1:1"
          acceptedFormats={['image/jpeg', 'image/png']}
        />
        <p className="mt-1 text-sm text-gray-500">
          Recomendado: Imagem quadrada com pelo menos 200x200 pixels. 
          Formatos aceitos: JPG, PNG e WebP. Tamanho máximo: 2MB
        </p>
      </div>
    </div>
  );
}