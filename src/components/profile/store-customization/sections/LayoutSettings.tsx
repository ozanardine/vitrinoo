import React, { useState } from 'react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { AlertCircle, Package, Tag } from 'lucide-react';
import { ProductCard } from '../../../store/ProductCard';

export function LayoutSettings() {
  const { formData, updateFormData } = useStoreCustomization();
  const [currentSort, setCurrentSort] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [previewProducts] = useState(() => Array(12).fill(null).map((_, i) => ({
    id: `preview-${i}`,
    title: `Produto ${i + 1}`,
    description: 'Lorem ipsum dolor sit amet',
    price: 99.99,
    brand: 'Marca Exemplo',
    tags: ['Tag 1', 'Tag 2'],
    images: [],
    type: 'simple',
    store_id: '',
    created_at: new Date().toISOString()
  })));

  const buildCategoryOptions = (categories: Category[], parentId: string | null = null, level = 0): JSX.Element[] => {
    // Existing implementation
  };

  // Validar configurações de layout
  const validateLayout = () => {
    const messages = [];
    
    // Validar número de colunas com estilo compacto
    if (formData.productCardStyle === 'compact' && Number(formData.gridColumns) > 3) {
      messages.push('O estilo compacto é recomendado com no máximo 3 colunas para melhor visualização');
    }

    // Validar espaçamento com estilo minimal
    if (formData.productCardStyle === 'minimal' && Number(formData.gridGap) < 24) {
      messages.push('O estilo minimal funciona melhor com espaçamento maior (24px ou mais) para dar destaque às imagens');
    }

    // Validar combinação de colunas e largura
    if (Number(formData.gridColumns) >= 4 && formData.containerWidth === 'max-w-5xl') {
      messages.push('Com 4 ou mais colunas, recomendamos usar largura média ou larga para melhor visualização dos produtos');
    }

    return messages;
  };

  const layoutWarnings = validateLayout();

  // Função para renderizar preview do grid
  const renderGridPreview = () => {
    const columns = Number(formData.gridColumns);
    const gap = Number(formData.gridGap);
    
    return (
      <div 
        className="grid p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`
        }}
      >
        {Array.from({ length: columns * 2 }).map((_, index) => (
          <div 
            key={index}
            className={`
              rounded-lg bg-white dark:bg-gray-700 shadow-sm overflow-hidden
              ${formData.productCardStyle === 'minimal' ? '' : 'p-4'}
              ${formData.productCardStyle === 'compact' ? 'flex gap-3' : ''}
              transition-all duration-200 hover:shadow-md
            `}
          >
            {formData.productCardStyle === 'compact' ? (
              <>
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0 flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1 py-2 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded px-3 text-sm flex items-center justify-center text-gray-600 dark:text-gray-400">R$ 99,90</div>
                    <div className="h-6 bg-blue-100 dark:bg-blue-900/30 rounded px-3 text-sm flex items-center justify-center text-blue-600 dark:text-blue-400">-20%</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={`
                  aspect-square bg-gray-200 dark:bg-gray-600 rounded-lg
                  flex items-center justify-center relative overflow-hidden group
                  ${formData.productCardStyle === 'minimal' ? 'mb-3' : 'mb-4'}
                `}>
                  <Package className="w-12 h-12 text-gray-300 dark:text-gray-500 transition-transform group-hover:scale-110" />
                  {index % 3 === 0 && (
                    <div className="absolute top-2 right-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-2 py-1 rounded">-20%</div>
                  )}
                </div>
                <div className={formData.productCardStyle === 'minimal' ? 'text-center px-3 pb-3' : ''}>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-3" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded px-3 text-sm flex items-center justify-center text-gray-600 dark:text-gray-400">R$ 99,90</div>
                    {index % 2 === 0 && (
                      <div className="h-6 bg-green-100 dark:bg-green-900/30 rounded px-3 text-sm flex items-center justify-center text-green-600 dark:text-green-400">Em estoque</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Estilo dos Cards de Produto</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => updateFormData({ productCardStyle: 'default' })}
            className={`p-4 border rounded-lg ${
              formData.productCardStyle === 'default'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              <div className="flex gap-1">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Estilo padrão com todas as informações
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ productCardStyle: 'compact' })}
            className={`p-4 border rounded-lg ${
              formData.productCardStyle === 'compact'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex gap-3 mb-4">
              <div className="w-20 aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 py-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Layout compacto para listas densas
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateFormData({ productCardStyle: 'minimal' })}
            className={`p-4 border rounded-lg ${
              formData.productCardStyle === 'minimal'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-center space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto" />
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mx-auto" />
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Visual minimalista focado em imagens
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Colunas na Grade</label>
          <select
            value={formData.gridColumns}
            onChange={(e) => updateFormData({ gridColumns: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="2">2 Colunas</option>
            <option value="3">3 Colunas</option>
            <option value="4">4 Colunas</option>
            <option value="5">5 Colunas</option>
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Número de produtos por linha
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Espaçamento da Grade</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={formData.gridGap}
              onChange={(e) => updateFormData({ gridGap: e.target.value })}
              className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="16"
              max="48"
              step="4"
            />
            <span className="text-gray-500">px</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Espaço entre os produtos
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Largura do Conteúdo</label>
          <select
            value={formData.containerWidth}
            onChange={(e) => updateFormData({ containerWidth: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="max-w-5xl">Estreita (1024px) - Ideal para até 3 colunas</option>
            <option value="max-w-6xl">Média (1152px) - Ideal para 3-4 colunas</option>
            <option value="max-w-7xl">Larga (1280px) - Ideal para 4-5 colunas</option>
            <option value="max-w-full">Tela Cheia - Melhor para 5+ colunas</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Escolha a largura que melhor se adapta ao número de colunas e quantidade de produtos
          </p>
        </div>
      </div>

      {/* Grid Preview */}
      <div>
        <h3 className="text-lg font-medium mb-4">Prévia da Grade</h3>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            Importante
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>Esta é uma prévia com produtos de exemplo para demonstrar o layout</li>
            <li>O layout final pode variar dependendo da quantidade de produtos e conteúdo</li>
            <li>Para melhor visualização, mantenha uma proporção adequada entre largura e número de colunas</li>
            <li>Recomendamos testar diferentes combinações com seus produtos reais</li>
          </ul>
        </div>

        <div className={`${formData.containerWidth} mx-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700`}>
          <div className={`grid gap-${formData.gridGap} grid-cols-1 sm:grid-cols-2 ${
            formData.gridColumns === '3' ? 'lg:grid-cols-3' :
            formData.gridColumns === '4' ? 'lg:grid-cols-4' :
            formData.gridColumns === '5' ? 'lg:grid-cols-5' :
            'lg:grid-cols-2'
          }`}
          style={{
            gap: `${formData.gridGap}px`
          }}>
            {previewProducts.slice(0, Number(formData.gridColumns) * 2).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => {}}
                style={formData.productCardStyle}
                view="grid"
              />
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          A prévia usa {Number(formData.gridColumns) * 2} produtos de exemplo para demonstrar o layout
        </p>
      </div>

      {layoutWarnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Recomendações de Layout
            </h4>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            {layoutWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}