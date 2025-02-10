import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  children?: Category[];
  hasChildren?: boolean;
}

interface CategoryTreeModalProps {
  storeId: string;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
  initialSelectedId?: string;
  categoryLimit: number;
  currentCategoryCount: number;
}

export function CategoryTreeModal({
  storeId,
  onSelect,
  onClose,
  initialSelectedId,
  categoryLimit,
  currentCategoryCount
}: CategoryTreeModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    parent_id: null as string | null
  });
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('name');

      if (categoriesError) throw categoriesError;

      const { data: childrenData, error: childrenError } = await supabase
        .from('categories')
        .select('parent_id')
        .eq('store_id', storeId)
        .not('parent_id', 'is', null);

      if (childrenError) throw childrenError;

      const parentIds = new Set(childrenData.map(c => c.parent_id));

      const categoriesWithInfo = categoriesData?.map(category => ({
        ...category,
        hasChildren: parentIds.has(category.id)
      })) || [];

      const categoriesMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      categoriesWithInfo.forEach(category => {
        categoriesMap.set(category.id, { ...category, children: [] });
      });

      categoriesWithInfo.forEach(category => {
        const categoryWithChildren = categoriesMap.get(category.id)!;
        if (category.parent_id) {
          const parent = categoriesMap.get(category.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(categoryWithChildren);
            parent.children.sort((a, b) => a.name.localeCompare(b.name));
          }
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });

      rootCategories.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(rootCategories);

      if (initialSelectedId) {
        const path = findCategoryPath(rootCategories, initialSelectedId);
        if (path.length > 0) {
          const newExpanded = new Set<string>();
          path.forEach(id => newExpanded.add(id));
          setExpandedCategories(newExpanded);
          setSelectedPath(path);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setError('Erro ao carregar categorias. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const findCategoryPath = (categories: Category[], targetId: string, currentPath: string[] = []): string[] => {
    for (const category of categories) {
      if (category.id === targetId) {
        return [...currentPath, category.id];
      }
      if (category.children) {
        const path = findCategoryPath(category.children, targetId, [...currentPath, category.id]);
        if (path.length > 0) {
          return path;
        }
      }
    }
    return [];
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSelect = (category: Category, path: string[]) => {
    if (!category.hasChildren && (!category.children || category.children.length === 0)) {
      setSelectedPath(path);
      onSelect(category.id);
    }
  };

  const handleNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCategory(true);
    setError(null);

    try {
      if (currentCategoryCount >= categoryLimit) {
        throw new Error(`Você atingiu o limite de ${categoryLimit} categorias do seu plano.`);
      }

      const slug = newCategory.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .eq('store_id', storeId)
        .eq('slug', slug)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingCategory) {
        throw new Error('Já existe uma categoria com este nome.');
      }

      const { data: category, error: insertError } = await supabase
        .from('categories')
        .insert([{
          store_id: storeId,
          name: newCategory.name,
          slug,
          parent_id: newCategory.parent_id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      await loadCategories();
      setShowNewCategoryForm(false);
      setNewCategory({ name: '', parent_id: null });

      if (category) {
        onSelect(category.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const renderCategory = (category: Category, path: string[] = [], level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedPath[selectedPath.length - 1] === category.id;
    const hasChildren = category.hasChildren || (category.children && category.children.length > 0);
    const currentPath = [...path, category.id];
    const isSelectable = !hasChildren && (!category.children || category.children.length === 0);

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          } ${!isSelectable ? 'opacity-75' : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 mr-2"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}
          <div
            className={`flex-1 ${isSelectable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={() => isSelectable && handleSelect(category, currentPath)}
          >
            {category.name}
            {!isSelectable && (
              <span className="ml-2 text-xs text-gray-500">
                (tem subcategorias)
              </span>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {category.children!.map(child =>
              renderCategory(child, currentPath, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full relative">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full relative max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Selecionar Categoria</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
            {error}
          </div>
        )}

        {showNewCategoryForm ? (
          <form onSubmit={handleNewCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Categoria</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria Pai</label>
              <select
                value={newCategory.parent_id || ''}
                onChange={(e) => setNewCategory({ ...newCategory, parent_id: e.target.value || null })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Nenhuma (categoria raiz)</option>
                {categories.map(category => (
                  <React.Fragment key={category.id}>
                    <option value={category.id}>{category.name}</option>
                    {category.children?.map(child => (
                      <option key={child.id} value={child.id}>
                        &nbsp;&nbsp;└ {child.name}
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={savingCategory}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50"
              >
                {savingCategory ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span>Salvando...</span>
                  </div>
                ) : (
                  'Salvar Categoria'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowNewCategoryForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma categoria cadastrada
                </div>
              ) : (
                categories.map(category => renderCategory(category))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                {selectedPath.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Categoria selecionada:
                    </div>
                    <div className="font-medium">
                      {selectedPath
                        .map(id => {
                          const findCategory = (cats: Category[]): Category | undefined => {
                            for (const cat of cats) {
                              if (cat.id === id) return cat;
                              if (cat.children) {
                                const found = findCategory(cat.children);
                                if (found) return found;
                              }
                            }
                            return undefined;
                          };
                          return findCategory(categories)?.name;
                        })
                        .filter(Boolean)
                        .join(' > ')}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowNewCategoryForm(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Categoria</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}