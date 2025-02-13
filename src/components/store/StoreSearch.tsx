import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Tag, Package, Star, DollarSign } from 'lucide-react';
import { debounce } from '../../lib/utils';

interface StoreSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: Category[];
  brands: string[];
  tags: string[];
  searchResults?: any[];
  loading?: boolean;
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

const initialFilters: SearchFilters = {
  search: '',
  categoryId: null,
  minPrice: null,
  maxPrice: null,
  hasPromotion: null,
  selectedTags: [],
  brand: null
};

export function StoreSearch({ onSearch, categories, brands, tags, searchResults = [], loading = false }: StoreSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Calcular número de filtros ativos
  useEffect(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.categoryId) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.hasPromotion) count++;
    if (filters.selectedTags.length > 0) count++;
    if (filters.brand) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  // Debounce search function
  const debouncedSearch = useCallback(
    debounce((newFilters: SearchFilters) => {
      onSearch(newFilters);
    }, 300),
    [onSearch]
  );

  // Update filters and trigger search
  const updateFilters = (updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters(initialFilters);
    debouncedSearch(initialFilters);
  };

  // Clear specific filter
  const clearFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    if (key === 'selectedTags') {
      newFilters.selectedTags = [];
    } else {
      newFilters[key] = null;
    }
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];
    updateFilters({ selectedTags: newTags });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Buscar produtos por nome, marca, categoria..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" aria-hidden="true" />
            {filters.search && (
              <button
                onClick={() => updateFilters({ search: '' })}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Limpar pesquisa"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-4 py-2 rounded-lg border flex items-center space-x-2 transition-colors relative
              ${showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            aria-expanded={showFilters}
          >
            <Filter className="w-5 h-5" aria-hidden="true" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                {activeFiltersCount}
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center py-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtros ativos:</span>
          
          {filters.categoryId && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm">
              <Package className="w-4 h-4" />
              {categories.find(c => c.id === filters.categoryId)?.name}
              <button
                onClick={() => clearFilter('categoryId')}
                className="ml-1 hover:text-blue-800 dark:hover:text-blue-200"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          {filters.brand && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-sm">
              <Star className="w-4 h-4" />
              {filters.brand}
              <button
                onClick={() => clearFilter('brand')}
                className="ml-1 hover:text-green-800 dark:hover:text-green-200"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          {filters.selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full text-sm"
            >
              <Tag className="w-4 h-4" />
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-purple-800 dark:hover:text-purple-200"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}

          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-sm">
              <DollarSign className="w-4 h-4" />
              {filters.minPrice && filters.maxPrice
                ? `R$ ${filters.minPrice} - R$ ${filters.maxPrice}`
                : filters.minPrice
                ? `A partir de R$ ${filters.minPrice}`
                : `Até R$ ${filters.maxPrice}`
              }
              <button
                onClick={() => {
                  updateFilters({ minPrice: null, maxPrice: null });
                }}
                className="ml-1 hover:text-yellow-800 dark:hover:text-yellow-200"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          {filters.hasPromotion && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full text-sm">
              <DollarSign className="w-4 h-4" />
              Em promoção
              <button
                onClick={() => clearFilter('hasPromotion')}
                className="ml-1 hover:text-red-800 dark:hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Categories */}
          <div>
            <h3 className="font-medium mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-500" />
              Categorias
            </h3>
            <div className="space-y-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => updateFilters({ categoryId: category.id })}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    filters.categoryId === category.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-medium mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              Preço
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-gray-500">R$</span>
                  <input
                    type="number"
                    value={filters.minPrice ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      updateFilters({ minPrice: value });
                    }}
                    placeholder="Mínimo"
                    className="w-full pl-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    min="0"
                    step="0.01"
                  />
                </div>
                <span className="text-gray-500">até</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-gray-500">R$</span>
                  <input
                    type="number"
                    value={filters.maxPrice ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      updateFilters({ maxPrice: value });
                    }}
                    placeholder="Máximo"
                    className="w-full pl-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasPromotion === true}
                  onChange={(e) => {
                    updateFilters({ hasPromotion: e.target.checked ? true : null });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Produtos em promoção</span>
              </label>
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="font-medium mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Marcas
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {brands.map(brand => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    checked={filters.brand === brand}
                    onChange={() => updateFilters({ brand })}
                    className="text-yellow-500 focus:ring-yellow-500"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-medium mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-purple-500" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`
                    px-3 py-1 rounded-full text-sm transition-colors
                    ${filters.selectedTags.includes(tag)
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* No Results */}
      {!loading && searchResults.length === 0 && activeFiltersCount > 0 && (
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum produto encontrado com os filtros selecionados
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Limpar filtros e tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}