import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
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
}

export function ProductAttributes({
  storeId,
  selectedAttributes,
  onAttributesChange,
  disabled
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

  const loadAttributes = async () => {
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('store_id', storeId)
        .order('name');

      if (error) throw error;
      setAttributes(data || []);
    } catch (err) {
      console.error('Erro ao carregar atributos:', err);
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

  const handleSaveAttribute = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar nome
      if (!newAttribute.name) {
        throw new Error('Nome do atributo é obrigatório');
      }

      // Validar opções
      const validOptions = newAttribute.options.filter(opt => opt.trim());
      if (validOptions.length < 1) {
        throw new Error('Adicione pelo menos uma opção');
      }

      // Salvar atributo
      const { error: saveError } = await supabase
        .from('product_attributes')
        .insert({
          store_id: storeId,
          name: newAttribute.name,
          description: newAttribute.description || null,
          options: validOptions
        });

      if (saveError) throw saveError;

      // Limpar form e recarregar atributos
      setNewAttribute({ name: '', description: '', options: [''] });
      setShowNewAttribute(false);
      loadAttributes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttribute = (attributeName: string) => {
    const newAttributes = selectedAttributes.includes(attributeName)
      ? selectedAttributes.filter(attr => attr !== attributeName)
      : [...selectedAttributes, attributeName];
    
    onAttributesChange(newAttributes);
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
            <div className="text-sm text-red-600">
              {error}
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
        {attributes.map((attribute) => (
          <button
            key={attribute.id}
            onClick={() => toggleAttribute(attribute.name)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              selectedAttributes.includes(attribute.name)
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
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                    >
                      {option}
                    </span>
                  ))}
                </div>
              </div>
              {selectedAttributes.includes(attribute.name) && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}