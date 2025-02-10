import React, { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface CategoryModalProps {
  storeId: string;
  onClose: () => void;
  onSuccess: () => void;
  categoryLimit: number;
  currentCategoryCount: number;
  categoryToEdit?: Category | null;
}

export function CategoryModal({ 
  storeId, 
  onClose, 
  onSuccess,
  categoryLimit,
  currentCategoryCount,
  categoryToEdit 
}: CategoryModalProps) {
  const [name, setName] = useState(categoryToEdit?.name || '');
  const [parentId, setParentId] = useState<string | null>(categoryToEdit?.parent_id || null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similarCategories, setSimilarCategories] = useState<Category[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);

  useEffect(() => {
    if (!categoryToEdit && currentCategoryCount >= categoryLimit) {
      setError(`Você atingiu o limite de ${categoryLimit} categorias do seu plano. Faça upgrade para adicionar mais categorias.`);
      return;
    }
    loadCategories();
  }, [currentCategoryCount, categoryLimit, categoryToEdit]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError('Erro ao carregar categorias. Por favor, tente novamente.');
    }
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const checkSimilarity = (name1: string, name2: string): boolean => {
    const normalized1 = normalizeText(name1);
    const normalized2 = normalizeText(name2);
    
    if (normalized1 === normalized2) return true;
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
    
    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const similarity = 1 - distance / maxLength;
    
    return similarity > 0.8;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setError(null);

    if (value.trim().length < 3) {
      setSimilarCategories([]);
      return;
    }

    // Encontrar categorias similares no mesmo nível hierárquico
    const similar = categories.filter(cat => 
      cat.id !== categoryToEdit?.id &&
      cat.parent_id === parentId &&
      checkSimilarity(cat.name, value)
    );

    setSimilarCategories(similar);
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verificar se já existe uma categoria com o mesmo nome no mesmo nível
    const existingCategory = categories.find(
      cat => 
        cat.parent_id === parentId && 
        cat.id !== categoryToEdit?.id &&
        normalizeText(cat.name) === normalizeText(name)
    );

    if (existingCategory) {
      setError('Já existe uma categoria com este nome neste nível.');
      return;
    }

    // Se encontrou categorias similares, mostra confirmação
    if (similarCategories.length > 0 && !pendingSave) {
      setShowConfirmation(true);
      return;
    }

    setLoading(true);

    try {
      // Só valida o limite se for uma categoria principal e não for edição
      if (!parentId && !categoryToEdit && currentCategoryCount >= categoryLimit) {
        throw new Error(`Você atingiu o limite de ${categoryLimit} categorias principais do seu plano.`);
      }

      const slug = generateSlug(name);

      if (categoryToEdit) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({
            name,
            slug,
            parent_id: parentId
          })
          .eq('id', categoryToEdit.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('categories')
          .insert([{
            store_id: storeId,
            name,
            slug,
            parent_id: parentId
          }]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar categoria. Por favor, tente novamente.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
      setPendingSave(false);
    }
  };

  const handleConfirmSave = () => {
    setPendingSave(true);
    setShowConfirmation(false);
    handleSubmit(new Event('submit') as any);
  };

  const buildCategoryOptions = (categories: Category[], parentId: string | null = null, level = 0): JSX.Element[] => {
    return categories
      .filter(category => category.parent_id === parentId && category.id !== categoryToEdit?.id)
      .map(category => (
        <React.Fragment key={category.id}>
          <option value={category.id}>
            {'  '.repeat(level)}{level > 0 ? '→' : ''} {category.name}
          </option>
          {buildCategoryOptions(categories, category.id, level + 1)}
        </React.Fragment>
      ));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold mb-6">
            {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Categorias principais utilizadas:</span>
              <span>{currentCategoryCount} de {categoryLimit === Infinity ? 'Ilimitado' : categoryLimit}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div
                className="bg-green-600 rounded-full h-2 transition-all"
                style={{ width: `${Math.min((currentCategoryCount / categoryLimit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Categoria</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria Pai (opcional)</label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Nenhuma (categoria principal)</option>
                {buildCategoryOptions(categories)}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Apenas categorias principais contam no limite do plano
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || (!categoryToEdit && !parentId && currentCategoryCount >= categoryLimit)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50"
            >
              {loading ? 'Salvando...' : categoryToEdit ? 'Salvar Alterações' : 'Salvar Categoria'}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de Confirmação para Categorias Similares */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 text-yellow-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Categorias Similares Encontradas</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Existem categorias com nomes similares no mesmo nível:
              </p>
              <ul className="space-y-2 mb-4">
                {similarCategories.map(cat => (
                  <li key={cat.id} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>{cat.name}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-600 dark:text-gray-400">
                Deseja continuar mesmo assim? Isso pode dificultar a organização do seu catálogo.
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Voltar e Revisar
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
              >
                Continuar Mesmo Assim
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}