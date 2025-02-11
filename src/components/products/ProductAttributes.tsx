import React, { useState, useEffect } from 'react';
import { Plus, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Attribute {
  id: string;
  name: string;
  description?: string;
  options: string[];
}

interface ProductAttributesProps {
  storeId: string;
  selectedAttributes: string[];
  onAttributesChange: (attributes: string[]) => void;
  disabled?: boolean;
  existingAttributes?: Record<string, string[]>;
  onAttributeOptionsChange?: (name: string, options: string[]) => void;
}

export function ProductAttributes({
  storeId,
  selectedAttributes,
  onAttributesChange,
  disabled,
  existingAttributes = {},
  onAttributeOptionsChange
}: ProductAttributesProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [showNewAttribute, setShowNewAttribute] = useState(false);
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    description: '',
    options: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttributes();
  }, [storeId]);

  const loadAttributes = async () => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('store_id', storeId)
        .order('name');

      if (error) throw error;
      
      // Atualizar as opções dos atributos existentes
      if (data) {
        const newExistingAttributes: Record<string, string[]> = {};
        data.forEach(attr => {
          newExistingAttributes[attr.name] = attr.options || [];
        });
        if (onAttributeOptionsChange) {
          selectedAttributes.forEach(attr => {
            if (newExistingAttributes[attr]) {
              onAttributeOptionsChange(attr, newExistingAttributes[attr]);
            }
          });
        }
      }

      setAttributes(data || []);
    } catch (err) {
      console.error('Erro ao carregar atributos:', err);
      setError('Erro ao carregar atributos. Por favor, tente novamente.');
    }
  };

  const handleAddOption = () => {
    setNewAttribute({
      ...newAttribute,
      options: [...newAttribute.options, '']
    });
  };

  const handleRemoveOption = (index: number) => {
    setNewAttribute({
      ...newAttribute,
      options: newAttribute.options.filter((_, i) => i !== index)
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newAttribute.options];
    newOptions[index] = value;
    setNewAttribute({
      ...newAttribute,
      options: newOptions
    });
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!newAttribute.name) {
        throw new Error('Nome do atributo é obrigatório');
      }

      const validOptions = newAttribute.options.filter(opt => opt.trim());
      if (validOptions.length < 1) {
        throw new Error('Adicione pelo menos uma opção');
      }

      const { data: existingAttr } = await supabase
        .from('product_attributes')
        .select('id')
        .eq('store_id', storeId)
        .eq('name', newAttribute.name)
        .maybeSingle();

      if (existingAttr) {
        throw new Error('Já existe um atributo com este nome');
      }

      const { error: saveError } = await supabase
        .from('product_attributes')
        .insert({
          store_id: storeId,
          name: newAttribute.name,
          description: newAttribute.description || null,
          options: validOptions
        });

      if (saveError) throw saveError;

      setNewAttribute({ name: '', description: '', options: [''] });
      setShowNewAttribute(false);
      await loadAttributes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttribute = async (attributeName: string) => {
    const attribute = attributes.find(attr => attr.name === attributeName);
    if (!attribute) return;

    const newAttributes = selectedAttributes.includes(attributeName)
      ? selectedAttributes.filter(attr => attr !== attributeName)
      : [...selectedAttributes, attributeName];
    
    onAttributesChange(newAttributes);

    // Atualizar opções disponíveis
    if (onAttributeOptionsChange) {
      onAttributeOptionsChange(attributeName, attribute.options);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Atributos de Variação</h3>
        <button
          type="button"
          onClick={() => setShowNewAttribute(true)}
          disabled={disabled}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Atributo</span>
        </button>
      </div>

      {showNewAttribute && (
        <div className="border rounded-lg p-4 space-y-4 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={newAttribute.name}
              onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="ex: Cor, Tamanho, Material"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={newAttribute.description}
              onChange={(e) => setNewAttribute({ ...newAttribute, description: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Opções</label>
            <div className="space-y-2">
              {newAttribute.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder={`Opção ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                + Adicionar opção
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setShowNewAttribute(false);
                setNewAttribute({ name: '', description: '', options: [''] });
                setError(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAttribute}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Atributo'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {attributes.map((attribute) => {
          const isSelected = selectedAttributes.includes(attribute.name);
          const existingOptions = existingAttributes[attribute.name] || [];

          return (
            <button
              key={attribute.id}
              type="button"
              onClick={() => toggleAttribute(attribute.name)}
              disabled={disabled}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{attribute.name}</h4>
                  {attribute.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {attribute.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attribute.options.map((option, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded text-sm ${
                          existingOptions.includes(option)
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {option}
                        {existingOptions.includes(option) && (
                          <Check className="w-3 h-3 inline ml-1" />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}