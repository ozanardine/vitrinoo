import React, { useState, useEffect } from 'react';
import { Plus, FolderTree, ChevronRight, ChevronDown, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Store } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { CategoryModal } from '../CategoryModal';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  children?: Category[];
  level?: number;
}

interface CategoriesTabProps {
  store: Store;
  onUpdate: () => void;
}

export function CategoriesTab({ store, onUpdate }: CategoriesTabProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [parentCategoriesCount, setParentCategoriesCount] = useState(0);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, [store.id]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('name');

      if (error) throw error;

      // Contar apenas categorias pai
      const parentCount = data?.filter(cat => !cat.parent_id).length || 0;
      setParentCategoriesCount(parentCount);

      // Construir árvore de categorias
      const buildCategoryTree = (categories: Category[], parentId: string | null = null, level: number = 0): Category[] => {
        return categories
          .filter(category => category.parent_id === parentId)
          .map(category => ({
            ...category,
            level,
            children: buildCategoryTree(categories, category.id, level + 1)
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      };

      const categoryTree = buildCategoryTree(data || []);
      setCategories(categoryTree);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      loadCategories();
      onUpdate();
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
    }
  };

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setShowCategoryModal(true);
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

  const renderCategory = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const paddingLeft = (category.level || 0) * 24 + 16;

    return (
      <div key={category.id}>
        <div 
          className={`flex items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group ${
            hasChildren ? 'font-medium' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div className="flex-1 flex items-center">
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
            <span className="flex-1">{category.name}</span>
            {!category.parent_id && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full mr-4">
                Principal
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
              <button
                onClick={() => handleEdit(category)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="Editar categoria"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryToDelete(category);
                }}
                className="p-1 text-red-500 hover:text-red-700"
                title="Excluir categoria"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {category.children!.map(child => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Categorias</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {parentCategoriesCount} de {store.category_limit === Infinity ? 'Ilimitado' : store.category_limit} categorias principais
          </p>
        </div>
        <button
          onClick={() => {
            setCategoryToEdit(null);
            setShowCategoryModal(true);
          }}
          disabled={parentCategoriesCount >= store.category_limit}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma categoria cadastrada ainda
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {showCategoryModal && (
        <CategoryModal
          storeId={store.id}
          onClose={() => {
            setShowCategoryModal(false);
            setCategoryToEdit(null);
          }}
          onSuccess={() => {
            setShowCategoryModal(false);
            setCategoryToEdit(null);
            loadCategories();
            onUpdate();
          }}
          categoryLimit={store.category_limit}
          currentCategoryCount={parentCategoriesCount}
          categoryToEdit={categoryToEdit}
        />
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {categoryToDelete.children && categoryToDelete.children.length > 0 ? (
                <>
                  Tem certeza que deseja excluir a categoria "{categoryToDelete.name}" e todas as suas subcategorias? 
                  Esta ação não pode ser desfeita.
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir a categoria "{categoryToDelete.name}"? 
                  Esta ação não pode ser desfeita.
                </>
              )}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(categoryToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}