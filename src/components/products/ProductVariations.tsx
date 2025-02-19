import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface Variation {
  id?: string;
  attributes: Record<string, string>;
  sku: string;
  price: number;
  promotional_price?: number | null;
  images: string[];
}

interface ProductVariationsProps {
  attributes: string[];
  variations: Variation[];
  onVariationsChange: (variations: Variation[]) => void;
  disabled?: boolean;
  existingAttributes?: Record<string, string[]>;
  onExistingAttributesChange?: (attrs: Record<string, string[]>) => void;
  parentSku?: string;
}

export function ProductVariations({
  attributes,
  variations,
  onVariationsChange,
  disabled,
  existingAttributes = {},
  onExistingAttributesChange,
  parentSku
}: ProductVariationsProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Validar atributos quando mudarem
  useEffect(() => {
    if (attributes.length > 0) {
      const missingOptions = attributes.filter(attr => {
        const options = existingAttributes[attr];
        return !options || options.length === 0;
      });
  
      if (missingOptions.length > 0) {
        setError(`Atributo "${missingOptions[0]}" não tem opções definidas. Adicione opções ao atributo antes de gerar variações.`);
      } else {
        setError(null);
      }
    }
  }, [attributes, existingAttributes]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const generateAttributeCombinations = (
    attrs: string[],
    options: Record<string, string[]>
  ): Record<string, string>[] => {
    // Validar se todos os atributos têm opções
    const missingOptions = attrs.filter(attr => !options[attr] || options[attr].length === 0);
    if (missingOptions.length > 0) {
      return [];
    }

    let combinations: Record<string, string>[] = [{}];
    
    // Gerar todas as combinações possíveis
    for (const attr of attrs) {
      const attrOptions = options[attr] || [];
      const newCombinations: Record<string, string>[] = [];
      
      for (const combo of combinations) {
        for (const option of attrOptions) {
          newCombinations.push({
            ...combo,
            [attr]: option
          });
        }
      }
      
      combinations = newCombinations;
    }
    
    return combinations;
  };

  const generateVariations = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!attributes.length) {
      setError('Selecione pelo menos um atributo de variação');
      return;
    }
  
    // Validar se todos os atributos têm opções
    const missingOptions = attributes.filter(attr => {
      const options = existingAttributes[attr];
      return !options || !Array.isArray(options) || options.length === 0;
    });
  
    if (missingOptions.length > 0) {
      setError(`Atributo "${missingOptions[0]}" não tem opções definidas. Adicione opções ao atributo antes de gerar variações.`);
      return;
    }

    // Manter variações existentes em um mapa
    const existingVariationsMap = new Map<string, Variation>();
    variations.forEach(variation => {
      const key = Object.entries(variation.attributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([attr, val]) => `${attr}:${val}`)
        .join('|');
      existingVariationsMap.set(key, variation);
    });

    // Gerar todas as combinações possíveis
    const combinations = generateAttributeCombinations(attributes, existingAttributes);
    
    if (combinations.length === 0) {
      setError('Não foi possível gerar variações. Verifique se todos os atributos têm opções definidas.');
      return;
    }

    // Criar novas variações mantendo dados existentes
    const newVariations = combinations.map((combo, index) => {
      const key = Object.entries(combo)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([attr, val]) => `${attr}:${val}`)
        .join('|');

      const existing = existingVariationsMap.get(key);
      
      if (existing) {
        return existing;
      }

      // Gerar SKU automático se houver SKU pai
      const sku = parentSku 
        ? `${parentSku}-${(index + 1).toString().padStart(3, '0')}` 
        : '';

      return {
        attributes: combo,
        sku,
        price: 0,
        promotional_price: null,
        images: []
      };
    });

    onVariationsChange(newVariations);

    // Atualizar existingAttributes
    const newExistingAttributes: Record<string, string[]> = {};
    attributes.forEach(attr => {
      newExistingAttributes[attr] = Array.from(new Set(
        newVariations.map(v => v.attributes[attr])
      ));
    });
    onExistingAttributesChange?.(newExistingAttributes);

    // Expandir primeira variação
    if (newVariations.length > 0) {
      const firstId = newVariations[0].id || '0';
      setExpanded(new Set([firstId]));
    }
  };

  const updateVariation = (index: number, updates: Partial<Variation>) => {
    const newVariations = [...variations];
    newVariations[index] = { ...newVariations[index], ...updates };
    onVariationsChange(newVariations);
  };

  const removeVariation = (index: number) => {
    const newVariations = variations.filter((_, i) => i !== index);
    onVariationsChange(newVariations);

    // Atualizar existingAttributes
    const newExistingAttributes: Record<string, string[]> = {};
    attributes.forEach(attr => {
      newExistingAttributes[attr] = Array.from(new Set(
        newVariations.map(v => v.attributes[attr])
      ));
    });
    onExistingAttributesChange?.(newExistingAttributes);

    // Limpar expanded state para a variação removida
    setExpanded(prev => {
      const newExpanded = new Set(prev);
      newExpanded.delete(variations[index].id || index.toString());
      return newExpanded;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Variações do Produto</h3>
        <button
          type="button"
          onClick={generateVariations}
          disabled={disabled || attributes.length === 0}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Gerar Variações</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 p-3 bg-red-100 dark:bg-red-900/20 rounded">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {variations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Clique em "Gerar Variações" para criar as combinações de atributos
        </div>
      ) : (
        <div className="space-y-2">
          {variations.map((variation, index) => {
            const variationId = variation.id || index.toString();
            const isExpanded = expanded.has(variationId);

            return (
              <div
                key={variationId}
                className="border rounded-lg dark:border-gray-700"
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(variationId)}
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
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeVariation(index);
                      }}
                      className="p-1 text-gray-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">SKU</label>
                        <input
                          type="text"
                          value={variation.sku}
                          onChange={(e) =>
                            updateVariation(index, { sku: e.target.value })
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
                            value={variation.price || ''}
                            onChange={(e) =>
                              updateVariation(index, { price: parseFloat(e.target.value) })
                            }
                            className="w-full p-2 pl-10 border rounded dark:bg-gray-700 dark:border-gray-600"
                            disabled={disabled}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Preço Promocional</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">R$</span>
                        <input
                          type="number"
                          value={variation.promotional_price || ''}
                          onChange={(e) =>
                            updateVariation(index, {
                              promotional_price: e.target.value ? parseFloat(e.target.value) : null
                            })
                          }
                          className="w-full p-2 pl-10 border rounded dark:bg-gray-700 dark:border-gray-600"
                          disabled={disabled}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}