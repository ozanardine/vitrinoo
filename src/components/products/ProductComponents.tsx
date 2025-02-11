import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';

interface Component {
  id: string;
  title: string;
  sku?: string;
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
  components,
  onChange,
  type,
  disabled
}: ProductComponentsProps) {
  const [error, setError] = useState<string | null>(null);

  const addComponent = () => {
    const newComponent: Component = {
      id: Math.random().toString(36).substring(7),
      title: '',
      quantity: 1,
      unit: type === 'manufactured' ? 'un' : 'pç',
    };

    onChange([...components, newComponent]);
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
          {type === 'kit' ? 'Produtos do Kit' : 'Matéria-Prima'}
        </h3>
        <button
          onClick={addComponent}
          disabled={disabled}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar {type === 'kit' ? 'Produto' : 'Material'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {components.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum {type === 'kit' ? 'produto' : 'material'} adicionado
        </div>
      ) : (
        <div className="space-y-4">
          {components.map((component) => (
            <div
              key={component.id}
              className="border rounded-lg p-4 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={component.title}
                    onChange={(e) => updateComponent(component.id, { title: e.target.value })}
                    placeholder={`Nome do ${type === 'kit' ? 'produto' : 'material'}`}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 mb-2"
                    disabled={disabled}
                  />
                  {type === 'manufactured' && (
                    <input
                      type="text"
                      value={component.sku || ''}
                      onChange={(e) => updateComponent(component.id, { sku: e.target.value })}
                      placeholder="Código/SKU do material (opcional)"
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      disabled={disabled}
                    />
                  )}
                </div>
                <button
                  onClick={() => removeComponent(component.id)}
                  className="p-1 text-gray-500 hover:text-red-500 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <select
                    value={component.unit}
                    onChange={(e) =>
                      updateComponent(component.id, { unit: e.target.value })
                    }
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    disabled={disabled}
                  >
                    {type === 'manufactured' ? (
                      <>
                        <option value="un">Unidade (un)</option>
                        <option value="kg">Quilograma (kg)</option>
                        <option value="g">Grama (g)</option>
                        <option value="l">Litro (l)</option>
                        <option value="ml">Mililitro (ml)</option>
                        <option value="m">Metro (m)</option>
                        <option value="cm">Centímetro (cm)</option>
                        <option value="m2">Metro Quadrado (m²)</option>
                        <option value="m3">Metro Cúbico (m³)</option>
                      </>
                    ) : (
                      <>
                        <option value="pç">Peça (pç)</option>
                        <option value="un">Unidade (un)</option>
                        <option value="kit">Kit</option>
                      </>
                    )}
                  </select>
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
                    placeholder="Opcional"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}