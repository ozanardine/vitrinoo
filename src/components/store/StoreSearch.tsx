import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Tag, Package, Star, DollarSign, Filter, ChevronDown } from 'lucide-react';
import { debounce } from 'lodash';

const STORE_FILTERS_KEY = 'store-filters';

interface StoreSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: Category[];
  brands: string[];
  tags: string[];
  searchResults?: any[];
  loading?: boolean;
  storeId: string;
}

interface SearchFilters {
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

export function StoreSearch({
  onSearch,
  categories,
  brands,
  tags,
  searchResults = [],
  loading = false,
  storeId
}: StoreSearchProps) {
  // Recupera filtros salvos ou usa iniciais
  const getSavedFilters = () => {
    try {
      const saved = localStorage.getItem(`${STORE_FILTERS_KEY}-${storeId}`);
      return saved ? JSON.parse(saved) : initialFilters;
    } catch {
      return initialFilters;
    }
  };

  const [filters, setFilters] = useState<SearchFilters>(getSavedFilters());
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [showBrandsDropdown, setShowBrandsDropdown] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Persiste filtros no localStorage
  useEffect(() => {
    localStorage.setItem(`${STORE_FILTERS_KEY}-${storeId}`, JSON.stringify(filters));
  }, [filters, storeId]);

  // Calcula filtros ativos
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

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
        setShowCategoryDropdown(false);
        setShowTagsDropdown(false);
        setShowBrandsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca com debounce
  const debouncedSearch = useCallback(
    debounce((newFilters: SearchFilters) => {
      onSearch(newFilters);
    }, 300),
    [onSearch]
  );

  // Atualiza filtros e dispara busca
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      debouncedSearch(newFilters);
      return newFilters;
    });
  }, [debouncedSearch]);

  // Limpa todos os filtros
  const clearFilters = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setFilters(initialFilters);
    debouncedSearch(initialFilters);
    setShowFilterDropdown(false);
    localStorage.removeItem(`${STORE_FILTERS_KEY}-${storeId}`);
  }, [debouncedSearch, storeId]);

  // Toggle tag selecionada
  const toggleTag = useCallback((tag: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setFilters(prev => {
      const newTags = prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag];
      
      const newFilters = { ...prev, selectedTags: newTags };
      debouncedSearch(newFilters);
      return newFilters;
    });
  }, [debouncedSearch]);

  // Previne submit do form
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Fecha outros dropdowns ao abrir um novo
  const handleDropdownToggle = useCallback((dropdown: string) => {
    setShowFilterDropdown(prev => dropdown === 'filter' ? !prev : false);
    setShowCategoryDropdown(prev => dropdown === 'category' ? !prev : false);
    setShowTagsDropdown(prev => dropdown === 'tags' ? !prev : false);
    setShowBrandsDropdown(prev => dropdown === 'brands' ? !prev : false);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" ref={filterRef}>
      {/* Barra de Busca e Filtros Rápidos */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Input de Busca */}
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Buscar produtos..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" aria-hidden="true" />
          {filters.search && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                updateFilters({ search: '' });
              }}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Botões de Filtro Rápido */}
        <div className="flex gap-2 items-center">
          {/* Categorias */}
          <div className="relative">
            <button
              type="button"
              onClick={() => handleDropdownToggle('category')}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors
                ${filters.categoryId ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
            >
              <Package className="w-5 h-5" />
              <span>{filters.categoryId ? categories.find(c => c.id === filters.categoryId)?.name : 'Categorias'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        updateFilters({ categoryId: category.id });
                        handleDropdownToggle('');
                      }}
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
            )}
          </div>

          {/* Marcas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => handleDropdownToggle('brands')}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors
                ${filters.brand ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
            >
              <Star className="w-5 h-5" />
              <span>{filters.brand || 'Marcas'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showBrandsDropdown && (
              <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  {brands.map(brand => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        updateFilters({ brand });
                        handleDropdownToggle('');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        filters.brand === brand
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="relative">
            <button
              type="button"
              onClick={() => handleDropdownToggle('tags')}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors
                ${filters.selectedTags.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
            >
              <Tag className="w-5 h-5" />
              <span>Tags {filters.selectedTags.length > 0 && `(${filters.selectedTags.length})`}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showTagsDropdown && (
              <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(e) => toggleTag(tag, e)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Outros Filtros */}
          <div className="relative">
            <button
              type="button"
              onClick={() => handleDropdownToggle('filter')}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors relative
                ${showFilterDropdown ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' : 
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 space-y-4">
                  {/* Filtro de Preço */}
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
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

                      {/* Checkbox Promoção */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasPromotion === true}
                          onChange={(e) => {
                            updateFilters({ hasPromotion: e.target.checked ? true : null });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Somente produtos em promoção</span>
                      </label>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Limpar filtros
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDropdownToggle('')}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center py-2">
          {filters.categoryId && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm">
              <Package className="w-4 h-4" />
              {categories.find(c => c.id === filters.categoryId)?.name}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  updateFilters({ categoryId: null });
                }}
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  updateFilters({ brand: null });
                }}
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
                type="button"
                onClick={(e) => toggleTag(tag, e)}
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
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
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  updateFilters({ hasPromotion: null });
                }}
                className="ml-1 hover:text-red-800 dark:hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Limpar todos
          </button>
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
            type="button"
            onClick={clearFilters}
            className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Limpar filtros e tentar novamente
          </button>
        </div>
      )}
    </form>
  );
}