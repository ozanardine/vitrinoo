import React, { useState } from 'react';
import { Store, AlertCircle, Upload, Palette, Layout } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Store as StoreType } from '../../lib/types';
import { ImageUploader } from '../ImageUploader';
import { SocialNetworksForm } from './SocialNetworksForm';
import { StoreHeader } from '../store/StoreHeader';

interface StoreCustomizationTabProps {
  store: StoreType;
  onUpdate: () => void;
}

export function StoreCustomizationTab({ store, onUpdate }: StoreCustomizationTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState({
    name: store.name,
    slug: store.slug,
    description: store.description || '',
    logoUrl: store.logo_url || '',
    primaryColor: store.primary_color || '#000000',
    secondaryColor: store.secondary_color || '#ffffff',
    headerStyle: store.header_style || 'solid',
    headerHeight: store.header_height || '400px',
    headerImage: store.header_image || '',
    headerGradient: store.header_gradient || 'to bottom',
    logoSize: store.logo_size || '160px',
    titleSize: store.title_size || '48px',
    descriptionSize: store.description_size || '18px'
  });
  const [socialLinks, setSocialLinks] = useState<Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>>(store.social_links || []);

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(() => {
      if (type === 'success') setSuccess(null);
      else setError(null);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verificar se o slug já existe (exceto para a loja atual)
      const { data: existingStores, error: checkError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', storeForm.slug)
        .neq('id', store.id);

      if (checkError) throw checkError;

      if (existingStores && existingStores.length > 0) {
        throw new Error('Esta URL já está em uso. Por favor, escolha outra.');
      }

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          name: storeForm.name,
          slug: storeForm.slug,
          description: storeForm.description || null,
          logo_url: storeForm.logoUrl || null,
          primary_color: storeForm.primaryColor,
          secondary_color: storeForm.secondaryColor,
          header_style: storeForm.headerStyle,
          header_height: storeForm.headerHeight,
          header_image: storeForm.headerImage || null,
          header_gradient: storeForm.headerGradient,
          logo_size: storeForm.logoSize,
          title_size: storeForm.titleSize,
          description_size: storeForm.descriptionSize,
          social_links: socialLinks,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      if (updateError) throw updateError;

      showAlert('Loja atualizada com sucesso!', 'success');
      onUpdate();
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {(error || success) && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          error ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error || success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Loja</label>
              <input
                type="text"
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
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
                  value={storeForm.slug}
                  onChange={(e) => setStoreForm({ ...storeForm, slug: e.target.value })}
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
                value={storeForm.description}
                onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                rows={3}
                placeholder="Uma breve descrição sobre sua loja..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo</label>
              <ImageUploader
                onImageUrl={(url) => setStoreForm({ ...storeForm, logoUrl: url })}
                currentUrl={storeForm.logoUrl}
              />
            </div>
          </div>
        </div>

        {/* Header Customization */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Personalização do Cabeçalho</h3>
          
          <div className="space-y-6">
            {/* Header Style */}
            <div>
              <label className="block text-sm font-medium mb-2">Estilo do Cabeçalho</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setStoreForm({ ...storeForm, headerStyle: 'solid' })}
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
                    storeForm.headerStyle === 'solid' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  <span>Sólido</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStoreForm({ ...storeForm, headerStyle: 'gradient' })}
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
                    storeForm.headerStyle === 'gradient'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-full h-16 bg-gradient-to-b from-gray-200 to-white dark:from-gray-700 dark:to-gray-900 rounded" />
                  <span>Gradiente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStoreForm({ ...storeForm, headerStyle: 'image' })}
                  className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
                    storeForm.headerStyle === 'image'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <span>Imagem</span>
                </button>
              </div>
            </div>

            {/* Header Style Specific Options */}
            {storeForm.headerStyle === 'gradient' && (
              <div>
                <label className="block text-sm font-medium mb-2">Direção do Gradiente</label>
                <select
                  value={storeForm.headerGradient}
                  onChange={(e) => setStoreForm({ ...storeForm, headerGradient: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="to bottom">De cima para baixo</option>
                  <option value="to right">Da esquerda para direita</option>
                  <option value="to bottom right">Diagonal</option>
                  <option value="to top">De baixo para cima</option>
                </select>
              </div>
            )}

            {storeForm.headerStyle === 'image' && (
              <div>
                <label className="block text-sm font-medium mb-2">Imagem de Fundo</label>
                <ImageUploader
                  onImageUrl={(url) => setStoreForm({ ...storeForm, headerImage: url })}
                  currentUrl={storeForm.headerImage}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Recomendado: 1920x400px ou maior, formato 16:9
                </p>
              </div>
            )}

            {/* Header Colors */}
            <div className="space-y-4 mb-6">
              <h4 className="text-md font-medium">Cores do Cabeçalho</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cor de Fundo</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={storeForm.primaryColor}
                      onChange={(e) => setStoreForm({ ...storeForm, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={storeForm.primaryColor}
                      onChange={(e) => setStoreForm({ ...storeForm, primaryColor: e.target.value })}
                      className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      title="Código de cor hexadecimal válido (ex: #000000)"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Cor principal do cabeçalho (fundo sólido ou base do gradiente)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Cor do Texto</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={storeForm.secondaryColor}
                      onChange={(e) => setStoreForm({ ...storeForm, secondaryColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={storeForm.secondaryColor}
                      onChange={(e) => setStoreForm({ ...storeForm, secondaryColor: e.target.value })}
                      className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      title="Código de cor hexadecimal válido (ex: #000000)"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Cor do texto e elementos no cabeçalho
                  </p>
                </div>
              </div>
            </div>

            {/* Header Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Altura do Cabeçalho</label>
                <input
                  type="number"
                  value={storeForm.headerHeight.replace('px', '')}
                  onChange={(e) => setStoreForm({ ...storeForm, headerHeight: `${e.target.value}px` })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="400"
                  min="200"
                  max="800"
                />
                <p className="text-sm text-gray-500 mt-1">Altura em pixels (200-800px)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tamanho da Logo</label>
                <input
                  type="number"
                  value={storeForm.logoSize.replace('px', '')}
                  onChange={(e) => setStoreForm({ ...storeForm, logoSize: `${e.target.value}px` })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="160"
                  min="80"
                  max="300"
                />
                <p className="text-sm text-gray-500 mt-1">Tamanho em pixels (80-300px)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tamanho do Título</label>
                <input
                  type="number"
                  value={storeForm.titleSize.replace('px', '')}
                  onChange={(e) => setStoreForm({ ...storeForm, titleSize: `${e.target.value}px` })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="48"
                  min="24"
                  max="72"
                />
                <p className="text-sm text-gray-500 mt-1">Tamanho em pixels (24-72px)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Prévia</h3>
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <StoreHeader
              name={storeForm.name}
              description={storeForm.description}
              logoUrl={storeForm.logoUrl}
              primaryColor={storeForm.primaryColor}
              secondaryColor={storeForm.secondaryColor}
              socialLinks={socialLinks}
              customization={{
                headerStyle: storeForm.headerStyle as 'solid' | 'gradient' | 'image',
                headerHeight: storeForm.headerHeight,
                headerImage: storeForm.headerImage,
                headerGradient: storeForm.headerGradient,
                logoSize: storeForm.logoSize,
                titleSize: storeForm.titleSize,
                descriptionSize: storeForm.descriptionSize
              }}
            />
          </div>
        </div>

        {/* Social Networks */}
        <SocialNetworksForm
          links={socialLinks}
          onChange={setSocialLinks}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}