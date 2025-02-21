import { AlertCircle, Package, Tag } from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { ProductCard } from '../../../store/ProductCard';
import { Product } from '../../../../lib/types';

export function LayoutSettings() {
  const { previewData, updatePreview, stagePendingChanges } = useStoreCustomization();

  // Validar configurações de layout
  const validateLayout = () => {
    const messages = [];
    
    // Validar número de colunas com estilo compacto
    if (previewData.productCardStyle === 'compact' && Number(previewData.gridColumns) > 3) {
      messages.push('O estilo compacto é recomendado com no máximo 3 colunas para melhor visualização');
    }

    // Validar espaçamento com estilo minimal
    if (previewData.productCardStyle === 'minimal' && Number(previewData.gridGap) < 24) {
      messages.push('O estilo minimal funciona melhor com espaçamento maior (24px ou mais) para dar destaque às imagens');
    }

    // Validar combinação de colunas e largura
    if (Number(previewData.gridColumns) >= 4 && previewData.containerWidth === 'max-w-5xl') {
      messages.push('Com 4 ou mais colunas, recomendamos usar largura média ou larga para melhor visualização dos produtos');
    }

    return messages;
  };

  const layoutWarnings = validateLayout();

  // Handler para mudança de estilo do card
  const handleCardStyleChange = (style: 'default' | 'compact' | 'minimal') => {
    const updates = { productCardStyle: style };
    
    // Atualiza preview
    updatePreview(updates, 'layout');
    
    // Aplica mudanças
    stagePendingChanges(updates, 'layout');
  };

  // Handler para mudança de colunas
  const handleColumnsChange = (columns: '2' | '3' | '4' | '5') => {
    const updates = { gridColumns: columns };
    
    // Atualiza preview
    updatePreview(updates, 'layout');
    
    // Aplica mudanças
    stagePendingChanges(updates, 'layout');
  };

  // Handler para mudança de espaçamento
  const handleGapChange = (value: string) => {
    const updates = { gridGap: value };
    
    // Atualiza preview
    updatePreview(updates, 'layout');
    
    // Aplica mudanças
    stagePendingChanges(updates, 'layout');
  };

  // Handler para mudança de largura do container
  const handleContainerWidthChange = (width: 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full') => {
    const updates = { containerWidth: width };
    
    // Atualiza preview
    updatePreview(updates, 'layout');
    
    // Aplica mudanças
    stagePendingChanges(updates, 'layout');
  };

  // Dados de exemplo para preview com tipo correto
  const previewProducts: Product[] = Array(12).fill(null).map((_, i) => ({
    id: `preview-${i}`,
    title: `Produto ${i + 1}`,
    description: 'Lorem ipsum dolor sit amet',
    price: 99.99,
    brand: 'Marca Exemplo',
    tags: ['Tag 1', 'Tag 2'],
    images: [],
    type: 'simple',
    store_id: '',
    created_at: new Date().toISOString(),
    status: true,
    sku: null,
    category_id: null,
    promotional_price: null,
    components: [],
    attributes: {}
  }));

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Estilo dos Cards de Produto</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleCardStyleChange('default')}
            className={`p-4 border rounded-lg ${
              previewData.productCardStyle === 'default'
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
            onClick={() => handleCardStyleChange('compact')}
            className={`p-4 border rounded-lg ${
              previewData.productCardStyle === 'compact'
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
            onClick={() => handleCardStyleChange('minimal')}
            className={`p-4 border rounded-lg ${
              previewData.productCardStyle === 'minimal'
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
            value={previewData.gridColumns}
            onChange={(e) => handleColumnsChange(e.target.value as '2' | '3' | '4' | '5')}
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
              value={previewData.gridGap}
              onChange={(e) => handleGapChange(e.target.value)}
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
            value={previewData.containerWidth}
            onChange={(e) => handleContainerWidthChange(e.target.value as 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full')}
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

      {/* Preview Grid */}
      <div>
        <h3 className="text-lg font-medium mb-4">Prévia da Grade</h3>
        <div className={`${previewData.containerWidth} mx-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700`}>
          <div className={`grid gap-${previewData.gridGap} grid-cols-1 sm:grid-cols-2 ${
            previewData.gridColumns === '3' ? 'lg:grid-cols-3' :
            previewData.gridColumns === '4' ? 'lg:grid-cols-4' :
            previewData.gridColumns === '5' ? 'lg:grid-cols-5' :
            'lg:grid-cols-2'
          }`}
          style={{
            gap: `${previewData.gridGap}px`
          }}>
            {previewProducts.slice(0, Number(previewData.gridColumns) * 2).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => {}}
                style={previewData.productCardStyle}
                view="grid"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}