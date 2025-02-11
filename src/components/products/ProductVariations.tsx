import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Variation {
  id: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
}

interface ProductVariationsProps {
  attributes: string[];
  variations: Variation[];
  onVariationsChange: (variations: Variation[]) => void;
  disabled?: boolean;
}

export function ProductVariations({
  attributes,
  variations,
  onVariationsChange,
  disabled
}: ProductVariationsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [attributeOptions, setAttributeOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadAttributeOptions();
  }, [attributes]);

  const loadAttributeOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('name, options')
        .in('name', attributes);

      if (error) throw error;

      const options: Record<string, string[]> = {};
      data?.forEach(attr => {
        options[attr.name] = attr.options;
      });
      setAttributeOptions(options);
    } catch (err) {
      console.error('Erro ao carregar opções de atributos:', err);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const addVariation = () => {
    const newVariation: Variation = {
      id: Math.random().toString(36).substring(7),
      attributes: {},
      sku: '',
      price: 0,
      stock: 0
    };
    onVariationsChange([...variations, newVariation]);
  };

  const updateVariation = (id: string, updates: Partial<Variation>) => {
    const newVariations = variations.map(v =>
      v.id === id ? { ...v, ...updates } : v
    );
    onVariationsChange(newVariations);
  };

  const removeVariation = (id: string) => {
    onVariationsChange(variations.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Variações do Produto</h3>
        <button
          onClick={addVariation}
          disabled={disabled}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Variação</span>
        </button>
      </div>

      {variations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Clique em "Adicionar Variação" para criar uma nova variação
        </div>
      ) : (
        <div className="space-y-2">
          {variations.map((variation) => (
            <div
              key={variation.id}
              className="border rounded-lg dark:border-gray-700"
            >
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(variation.id)}
              >
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(variation.attributes).map(([name, value]) => (
                      <span
                        key={name}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                      >
                        {name}: {value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVariation(variation.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {expanded.has(variation.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              {expanded.has(variation.id) && (
                <div className="p-4 border-t dark:border-gray-700 space-y-4">
                  {/* Attribute Selection */}
                  {attributes.map((attrName) => (
                    <div key={attrName}>
                      <label className="block text-sm font-medium mb-1">
                        {attrName}
                      </label>
                      <select
                        value={variation.attributes[attrName] || ''}
                        onChange={(e) =>
                          updateVariation(variation.id, {
                            attributes: {
                              ...variation.attributes,
                              [attrName]: e.target.value
                            }
                          })
                        }
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        disabled={disabled}
                      >
                        <option value="">Selecione {attrName}</option>
                        {attributeOptions[attrName]?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">SKU</label>
                      <input
                        type="text"
                        value={variation.sku}
                        onChange={(e) =>
                          updateVariation(variation.id, { sku: e.target.value })
                        }
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        disabled={disabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Preço</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                        <input
                          type="number"
                          value={variation.price}
                          onChange={(e) =>
                            updateVariation(variation.id, { price: parseFloat(e.target.value) })
                          }
                          className="w-full p-2 pl-10 border rounded dark:bg-gray-700 dark:border-gray-600"
                          disabled={disabled}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}