import React, { useState } from 'react';
import { X, FolderTree, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CategoryTreeModal } from './CategoryTreeModal';
import { ImageGalleryUploader } from './ImageGalleryUploader';
import { ProductDescriptionGenerator } from './ProductDescriptionGenerator';
import { Product } from '../lib/types';

interface ProductModalProps {
  storeId: string;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
  product?: Product;
  planType?: 'free' | 'basic' | 'plus';
}

export function ProductModal({ 
  storeId, 
  categories, 
  onClose, 
  onSuccess,
  product,
  planType = 'free'
}: ProductModalProps) {
  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(product?.description || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string>('');
  const [tags, setTags] = useState(product?.tags?.join(', ') || '');
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [promotionalPrice, setPromotionalPrice] = useState(product?.promotional_price?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!categoryId) {
        throw new Error('Por favor, selecione uma categoria.');
      }

      const numericPrice = parseFloat(price);
      const numericPromotionalPrice = promotionalPrice ? parseFloat(promotionalPrice) : null;

      if (numericPromotionalPrice && numericPromotionalPrice >= numericPrice) {
        throw new Error('O preço promocional deve ser menor que o preço normal');
      }

      // Verificar se o SKU já existe (exceto para o produto atual em caso de edição)
      if (sku) {
        const { data: existingSku, error: skuError } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', storeId)
          .eq('sku', sku)
          .neq('id', product?.id || '')
          .maybeSingle();

        if (skuError) throw skuError;
        if (existingSku) {
          throw new Error('Este SKU já está em uso por outro produto.');
        }
      }

      const productData = {
        store_id: storeId,
        title,
        description,
        brand,
        sku: sku || null,
        category_id: categoryId,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        images,
        price: numericPrice,
        promotional_price: numericPromotionalPrice,
      };

      if (product) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (updateError) throw updateError;
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto. Por favor, tente novamente.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (selectedId: string) => {
    setCategoryId(selectedId);
    setShowCategoryModal(false);

    // Buscar o caminho completo da categoria
    try {
      const { data, error } = await supabase.rpc('get_category_path', {
        category_id: selectedId
      });

      if (error) throw error;
      setSelectedCategoryPath(data.join(' > '));
    } catch (err) {
      console.error('Erro ao buscar caminho da categoria:', err);
    }
  };

  const handleGeneratedDescription = (description: string) => {
    setDescription(description);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {product ? 'Editar Produto' : 'Novo Produto'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Código único do produto (opcional)"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Código único para identificação do produto
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Marca</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="flex-1 flex items-center justify-between p-2 border rounded dark:bg-gray-700 dark:border-gray-600 hover:border-blue-500"
              >
                <span className="truncate">
                  {selectedCategoryPath || 'Selecionar categoria'}
                </span>
                <FolderTree className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div>
            <ProductDescriptionGenerator
              title={title}
              brand={brand}
              category={selectedCategoryPath}
              onGenerate={handleGeneratedDescription}
              disabled={planType !== 'plus'}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              required
            />
          </div>

          <ImageGalleryUploader
            onImagesChange={setImages}
            currentImages={images}
            maxImages={planType === 'plus' ? 10 : planType === 'basic' ? 5 : 3}
            planType={planType}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Preço</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 pl-8 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preço Promocional</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-gray-500">R$</span>
                <input
                  type="number"
                  value={promotionalPrice}
                  onChange={(e) => setPromotionalPrice(e.target.value)}
                  className="w-full p-2 pl-8 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="ex: novo, promoção, destaque"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </form>

        {showCategoryModal && (
          <CategoryTreeModal
            storeId={storeId}
            onSelect={handleCategorySelect}
            onClose={() => setShowCategoryModal(false)}
            initialSelectedId={categoryId}
          />
        )}
      </div>
    </div>
  );
}