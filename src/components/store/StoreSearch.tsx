import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface StoreSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: Category[];
  brands: string[];
  tags: string[];
}

export interface SearchFilters {
  search: string;
  categoryId: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  hasPromotion: boolean | null;
  selectedTags: string[];
  brand: string | null;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  children?: Category[];
}

export function StoreSearch({ onSearch, categories, brands, tags }: StoreSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    hasPromotion: null,
    selectedTags: [],
    brand: null
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    onSearch(filters);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      hasPromotion: null,
      selectedTags: [],
      brand: null
    });
    onSearch({
      search: '',
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      hasPromotion: null,
      selectedTags: [],
      brand: null
    });
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = filters.categoryId === category.id;

    return (
      <div key={category.id}>
        <div 
          className={`
            flex items-center py-2 cursor-pointer
            ${isSelected ? 'text-blue-600 font-medium' : ''}
            hover:text-blue-600
          `}
          style={{ paddingLeft: `${level * 20}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleCategory(category.id)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
              />
            </button>
          )}
          <div
            className="flex-1"
            onClick={() => setFilters({ ...filters, categoryId: category.id })}
          >
            {category.name}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {category.children!.map(child =>
              renderCategory(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              if (!e.target.value) handleSearch();
            }}
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            p-2 rounded-lg border
            ${showFilters 
              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900 dark:border-blue-800' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Active Filters */}
      {(filters.categoryId || filters.brand || filters.selectedTags.length > 0 || filters.hasPromotion) && (
        <div className="flex flex-wrap gap-2">
          {filters.categoryId && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {categories.find(c => c.id === filters.categoryId)?.name}
              <button
                onClick={() => setFilters({ ...filters, categoryId: null })}
                className="ml-1 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {filters.brand && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {filters.brand}
              <button
                onClick={() => setFilters({ ...filters, brand: null })}
                className="ml-1 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {filters.selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => setFilters({
                  ...filters,
                  selectedTags: filters.selectedTags.filter(t => t !== tag)
                })}
                className="ml-1 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
          {filters.hasPromotion && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
              Em promoção
              <button
                onClick={() => setFilters({ ...filters, hasPromotion: null })}
                className="ml-1 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {showFilters && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Categories */}
          <div>
            <h3 className="font-medium mb-4">Categorias</h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {categories
                .filter(c => !c.parent_id)
                .map(category => renderCategory(category))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-medium mb-4">Preço</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    minPrice: e.target.value ? Number(e.target.value) : null
                  })}
                  placeholder="Mínimo"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  step="0.01"
                />
                <span>até</span>
                <input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    maxPrice: e.target.value ? Number(e.target.value) : null
                  })}
                  placeholder="Máximo"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  step="0.01"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasPromotion === true}
                  onChange={(e) => setFilters({
                    ...filters,
                    hasPromotion: e.target.checked ? true : null
                  })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span>Em promoção</span>
              </label>
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="font-medium mb-4">Marcas</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {brands.map(brand => (
                <label key={brand} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="brand"
                    checked={filters.brand === brand}
                    onChange={() => setFilters({ ...filters, brand })}
                    className="text-blue-600"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-medium mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = filters.selectedTags.includes(tag)
                      ? filters.selectedTags.filter(t => t !== tag)
                      : [...filters.selectedTags, tag];
                    setFilters({ ...filters, selectedTags: newTags });
                  }}
                  className={`
                    px-3 py-1 rounded-full text-sm
                    ${filters.selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}