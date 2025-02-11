import React, { useState } from 'react';
import { Plus, X, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Product } from '../../lib/types';

interface Component {
  id: string;
  product_id: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface ProductComponentsProps {
  storeId: string;
  components: Component[];
  onChange: (components: Component[]) => void;
  type: 'kit' | 'manufactured';
  disabled?: boolean;
}

export function ProductComponents({
  storeId,
  components,
  onChange,
  type,
  disabled
}: ProductComponentsProps) {
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = async (term: string) => {
    if (!term) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', true)
        .ilike('title', `%${term}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err: any) {
      setError('Erro ao buscar produtos');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const addComponent = (product: Product) => {
    const newComponent: Component = {
      id: Math.random().toString(36).substring(7),
      product_id: product.id,
      quantity: 1,
      unit: product.stock_unit || 'un'
    };

    onChange([...components, newComponent]);
    setShowProductSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateComponent = (id: string, updates: Partial<Component>) => {
    onChange(
      components.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const removeComponent = (id: string) => {
    onChange(components.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">
          {type === 'kit' ? 'Produtos do Kit' : 'Componentes do Produto'}
        </h3>
        <button
          onClick={() => setShowProductSearch(true)}
          disabled={disabled}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar {type === 'kit' ? 'Produto' : 'Componente'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {showProductSearch && (
        <div className="border rounded-lg p-4 dark:border-gray-700 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchProducts(e.target.value);
              }}
              placeholder="Buscar produtos..."
              className="w-full p-2 pl-10 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addComponent(product)}
                  className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                >
                  <div className="font-medium">{product.title}</div>
                  <div className="text-sm text-gray-500">
                    SKU: {product.sku || 'N/A'}
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm && (
            <div className="text-center py-4 text-gray-500">
              Nenhum produto encontrado
            </div>
          )}
        </div>
      )}

      {components.length > 0 ? (
        <div className="space-y-2">
          {components.map((component) => {
            const product = searchResults.find(p => p.id === component.product_id);
            
            return (
              <div
                key={component.id}
                className="border rounded-lg p-4 dark:border-gray-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {product?.title || 'Produto não encontrado'}
                    </div>
                    <div className="text-sm text-gray-500">
                      SKU: {product?.sku || 'N/A'}
                    </div>
                  </div>
                  <button
                    onClick={() => removeComponent(component.id)}
                    className="p-1 text-gray-500 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      value={component.quantity}
                      onChange={(e) =>
                        updateComponent(component.id, {
                          quantity: parseFloat(e.target.value)
                        })
                      }
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      min="0.001"
                      step="0.001"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Unidade
                    </label>
                    <input
                      type="text"
                      value={component.unit}
                      onChange={(e) =>
                        updateComponent(component.id, { unit: e.target.value })
                      }
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      value={component.notes || ''}
                      onChange={(e) =>
                        updateComponent(component.id, { notes: e.target.value })
                      }
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Nenhum {type === 'kit' ? 'produto' : 'componente'} adicionado
        </div>
      )}
    </div>
  );
}