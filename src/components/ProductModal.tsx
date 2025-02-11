import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { CategoryTreeModal } from './CategoryTreeModal';
import { BasicInfo } from './products/form/BasicInfo';
import { Description } from './products/form/Description';
import { Images } from './products/form/Images';
import { ProductAttributes } from './products/ProductAttributes';
import { ProductVariations } from './products/ProductVariations';
import { ProductComponents } from './products/ProductComponents';
import { ServiceInfo } from './products/form/ServiceInfo';
import { PLAN_LIMITS } from '../lib/store';

interface ProductModalProps {
  storeId: string;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
  product?: Product;
  planType: 'free' | 'basic' | 'plus';
  categoryLimit: number;
  currentCategoryCount: number;
}

export function ProductModal({ 
  storeId, 
  categories, 
  onClose, 
  onSuccess, 
  product,
  planType,
  categoryLimit,
  currentCategoryCount
}: ProductModalProps) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productType, setProductType] = useState<'simple' | 'variable' | 'kit' | 'manufactured' | 'service'>(product?.type || 'simple');
  const [variationAttributes, setVariationAttributes] = useState<string[]>(product?.variation_attributes || []);
  const [variations, setVariations] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [existingAttributes, setExistingAttributes] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    title: product?.title || '',
    description: product?.description || '',
    brand: product?.brand || '',
    sku: product?.sku || '',
    price: product?.price || 0,
    promotional_price: product?.promotional_price || null,
    category_id: product?.category_id || null,
    images: product?.images || [],
    tags: product?.tags || [],
    status: product?.status ?? true,
    attributes: product?.attributes || {},
    // Service specific fields
    duration: product?.duration || '',
    availability: product?.availability || { weekdays: [], hours: [] },
    service_location: product?.service_location || '',
    service_modality: product?.service_modality || ''
  });

  useEffect(() => {
    if (product && (product.type === 'kit' || product.type === 'manufactured')) {
      loadComponents();
    }
  }, [product]);

  useEffect(() => {
    if (product && product.type === 'variable') {
      loadVariations();
    }
  }, [product]);

  const loadComponents = async () => {
    try {
      const { data, error } = await supabase
        .from('product_components')
        .select(`
          id,
          component_id,
          component_type,
          quantity,
          unit,
          notes
        `)
        .eq('product_id', product.id);

      if (error) throw error;
      setComponents(data || []);
    } catch (err) {
      console.error('Erro ao carregar componentes:', err);
    }
  };

  const loadVariations = async () => {
    if (!product?.id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('parent_id', product.id);

      if (error) throw error;

      // Extract existing attribute values
      const attrs: Record<string, Set<string>> = {};
      data?.forEach(variation => {
        Object.entries(variation.attributes || {}).forEach(([key, value]) => {
          if (!attrs[key]) attrs[key] = new Set();
          attrs[key].add(value as string);
        });
      });

      // Convert Sets to arrays
      const existingAttrs: Record<string, string[]> = {};
      Object.entries(attrs).forEach(([key, values]) => {
        existingAttrs[key] = Array.from(values);
      });

      setExistingAttributes(existingAttrs);
      setVariations(data || []);
    } catch (err) {
      console.error('Erro ao carregar variações:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate image limit
      const planLimits = PLAN_LIMITS[planType];
      if (form.images.length > planLimits.images_per_product) {
        throw new Error(`O plano ${planLimits.name} permite apenas ${planLimits.images_per_product} imagens por produto`);
      }

      const productData = {
        ...form,
        store_id: storeId,
        type: productType,
        variation_attributes: productType === 'variable' ? variationAttributes : [],
        updated_at: new Date().toISOString()
      };

      // Validações específicas por tipo
      if (productType === 'variable' && variationAttributes.length === 0) {
        throw new Error('Selecione pelo menos um atributo de variação');
      }

      if ((productType === 'kit' || productType === 'manufactured') && components.length === 0) {
        throw new Error(`Adicione pelo menos um ${productType === 'kit' ? 'produto' : 'componente'}`);
      }

      if (form.promotional_price && form.promotional_price >= form.price) {
        throw new Error('O preço promocional deve ser menor que o preço normal');
      }

      // Validações específicas para serviço
      if (productType === 'service') {
        if (!form.duration) {
          throw new Error('A duração do serviço é obrigatória');
        }

        if (!form.service_modality) {
          throw new Error('A modalidade do serviço é obrigatória');
        }

        if ((form.service_modality === 'presential' || form.service_modality === 'hybrid') && !form.service_location) {
          throw new Error('O local do serviço é obrigatório para serviços presenciais ou híbridos');
        }

        if (!form.availability?.weekdays?.length) {
          throw new Error('Selecione pelo menos um dia de atendimento');
        }

        if (!form.availability?.hours?.length) {
          throw new Error('Adicione pelo menos um horário de atendimento');
        }
      }

      let productId = product?.id;

      if (product) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (updateError) throw updateError;
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (insertError) throw insertError;
        productId = newProduct.id;
      }

      if (productId && (productType === 'kit' || productType === 'manufactured')) {
        await supabase
          .from('product_components')
          .delete()
          .eq('product_id', productId);

        if (components.length > 0) {
          const { error: componentsError } = await supabase
            .from('product_components')
            .insert(
              components.map(comp => ({
                ...comp,
                product_id: productId
              }))
            );

          if (componentsError) throw componentsError;
        }
      }

      if (productId && productType === 'variable' && variations.length > 0) {
        // Primeiro remove todas as variações existentes
        if (product) {
          await supabase
            .from('products')
            .delete()
            .eq('parent_id', productId);
        }

        // Depois insere as novas variações
        for (const variation of variations) {
          await supabase
            .from('products')
            .insert([{
              ...variation,
              store_id: storeId,
              parent_id: productId,
              type: 'simple'
            }]);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={product ? 'Editar Produto' : 'Novo Produto'}
      maxWidth="max-w-5xl"
    >
      <div className="px-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
              {error}
            </div>
          )}

          <BasicInfo
            form={form}
            setForm={setForm}
            productType={productType}
            setProductType={setProductType}
            categories={categories}
            onOpenCategoryModal={() => setShowCategoryModal(true)}
            disabled={!!product}
          />

          <Description
            form={form}
            setForm={setForm}
            title={form.title}
            brand={form.brand}
            category={categories.find(c => c.id === form.category_id)?.name || ''}
            planType={planType}
          />

          <Images
            form={form}
            setForm={setForm}
            planType={planType}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tags</h3>
            <div className="flex flex-wrap gap-2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
              {form.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })}
                    className="ml-1 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="flex-1 min-w-[120px] bg-transparent outline-none"
                placeholder="Digite uma tag e pressione Enter ou vírgula"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value) {
                      setForm({
                        ...form,
                        tags: [...new Set([...form.tags, value])]
                      });
                      (e.target as HTMLInputElement).value = '';
                    }
                  } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
                    e.preventDefault();
                    setForm({
                      ...form,
                      tags: form.tags.slice(0, -1)
                    });
                  }
                }}
              />
            </div>
          </div>

          {productType === 'service' && (
            <ServiceInfo
              form={form}
              setForm={setForm}
            />
          )}

          {productType === 'variable' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Variações</h3>
              <ProductAttributes
                storeId={storeId}
                selectedAttributes={variationAttributes}
                onAttributesChange={setVariationAttributes}
                disabled={loading}
                existingAttributes={existingAttributes}
              />
              {variationAttributes.length > 0 && (
                <ProductVariations
                  attributes={variationAttributes}
                  variations={variations}
                  onVariationsChange={setVariations}
                  disabled={loading}
                  existingAttributes={existingAttributes}
                  onExistingAttributesChange={setExistingAttributes}
                  parentSku={form.sku}
                />
              )}
            </div>
          )}

          {(productType === 'kit' || productType === 'manufactured') && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {productType === 'kit' ? 'Produtos do Kit' : 'Componentes'}
              </h3>
              <ProductComponents
                storeId={storeId}
                components={components}
                onChange={setComponents}
                type={productType}
                disabled={loading}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="status"
              checked={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="status" className="text-sm">
              Produto ativo
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      {showCategoryModal && (
        <CategoryTreeModal
          storeId={storeId}
          onSelect={(categoryId) => {
            setForm({ ...form, category_id: categoryId });
            setShowCategoryModal(false);
          }}
          onClose={() => setShowCategoryModal(false)}
          initialSelectedId={form.category_id}
          categoryLimit={categoryLimit}
          currentCategoryCount={currentCategoryCount}
        />
      )}
    </Modal>
  );
}