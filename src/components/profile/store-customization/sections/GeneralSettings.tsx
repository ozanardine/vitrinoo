import React from 'react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ImageUploader } from '../../../ImageUploader';

export function GeneralSettings() {
  const { formData, updateFormData } = useStoreCustomization();

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Nome da Loja</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">URL da Loja</label>
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-1">
            {window.location.origin}/
          </span>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => updateFormData({ slug: e.target.value })}
            className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
            pattern="[a-z0-9-]+"
            title="Apenas letras minúsculas, números e hífens são permitidos"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          rows={3}
          placeholder="Uma breve descrição sobre sua loja..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Logo</label>
        <ImageUploader
          onImageUrl={(url) => updateFormData({ logoUrl: url })}
          currentUrl={formData.logoUrl}
        />
      </div>
    </div>
  );
}