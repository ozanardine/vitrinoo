import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Tag, Package, Star, DollarSign, ChevronRight } from 'lucide-react';
import { debounce } from '../../lib/utils';

interface StoreSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: Category[];
  brands: string[];
  tags: string[];
  searchResults?: any[]; // Assuming the search results are an array of products
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

// Add new helper function to build category tree
const buildCategoryTree = (categories: Category[]): Category[] => {
  console.log("categories:", categories);
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // First pass: create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    const currentCategory = categoryMap.get(category.id)!;
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(currentCategory);
      }
    } else {
      rootCategories.push(currentCategory);
    }
  });

  // Sort categories alphabetically at each level
  const sortCategories = (cats: Category[]): Category[] => {
    return cats.map(cat => ({
      ...cat,
      children: cat.children ? sortCategories(cat.children) : []
    })).sort((a, b) => a.name.localeCompare(b.name));
  };

  return sortCategories(rootCategories);
};

// Add new component for rendering category tree
const CategoryTree = ({ 
  categories,
  selectedId,
  onSelect,
  level = 0 
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  level?: number;
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpand = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-1">
      {categories.map(category => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedId === category.id;

        return (
          <div key={category.id}>
            <div 
              className={`
                flex items-center py-2 px-3 rounded-lg transition-colors cursor-pointer
                ${isSelected
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
              style={{ paddingLeft: `${level * 16 + 12}px` }}
              onClick={() => !hasChildren && onSelect(category.id)}
            >
              {hasChildren && (
                <div
                  onClick={(e) => toggleExpand(category.id, e)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 mr-2 cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              )}
              <span className="flex-1">{category.name}</span>
            </div>
            {hasChildren && isExpanded && (
              <CategoryTree
                categories={category.children || []}
                selectedId={selectedId}
                onSelect={onSelect}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export function StoreSearch({ onSearch, categories, brands, tags, searchResults }: StoreSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    hasPromotion: null,
    selectedTags: [],
    brand: null
  });

  const debouncedSearch = React.useCallback(
    debounce((filters: SearchFilters) => {
      onSearch(filters);
    }, 500),
    [onSearch]
  );

  // Load saved filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('store_search_filters');
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      setFilters(parsedFilters);
      setSearchTerm(parsedFilters.search);
      // Trigger initial search with saved filters
      onSearch(parsedFilters);
    }
  }, []);

  // Build category tree once when component mounts
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const updateFilters = (updates: Partial<SearchFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    // Save filters to localStorage
    localStorage.setItem('store_search_filters', JSON.stringify(newFilters));
    debouncedSearch(newFilters);
  };

  const handleSearchInput = (term: string) => {
    const searchValue = term ?? searchTerm;
    setSearchTerm(searchValue);
    updateFilters({ search: searchValue });
  };

  const clearFilters = () => {
    // Clear filters from localStorage
    localStorage.removeItem('store_search_filters');
    setFilters({
      search: '',
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      hasPromotion: null,
      selectedTags: [],
      brand: null
    });
    setSearchTerm('');
    debouncedSearch({
      search: '',
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      hasPromotion: null,
      selectedTags: [],
      brand: null
    });
  };

  return (
    <div className="space-y-4">
      <div ref={searchRef} className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                handleSearchInput(e.target.value);
              }}
              placeholder="Buscar produtos por nome, marca, categoria..."
              className="w-full pl-10 pr-4 py-3 border rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" aria-hidden="true" />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleSearchInput('');
                }}
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
              px-4 py-2 rounded-md border flex items-center space-x-2 transition-colors
              ${showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            aria-expanded={showFilters}
          >
            <Filter className="w-5 h-5" aria-hidden="true" />
            <span>Filtros</span>
            {showFilters ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {(filters.categoryId || filters.brand || filters.selectedTags.length > 0 || filters.hasPromotion || filters.minPrice || filters.maxPrice) && (
        <div className="flex flex-wrap gap-2 items-center py-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Filtros ativos:</span>
          {filters.categoryId && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm">
              <Package className="w-4 h-4" />
              {categories.find(c => c.id === filters.categoryId)?.name}
              <button
                onClick={() => updateFilters({ categoryId: null })}
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
                onClick={() => updateFilters({ brand: null })}
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
                onClick={() => updateFilters({
                  selectedTags: filters.selectedTags.filter(t => t !== tag)
                })}
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
                onClick={() => updateFilters({ minPrice: null, maxPrice: null })}
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
                onClick={() => updateFilters({ hasPromotion: null })}
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
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {categoryTree && (
                <CategoryTree
                  categories={categoryTree}
                  selectedId={filters.categoryId}
                  onSelect={(id) => updateFilters({ categoryId: id })}
                />
              )}
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
                      if (value === null || !isNaN(value)) {
                        updateFilters({ minPrice: value });
                      }
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
                      if (value === null || !isNaN(value)) {
                        updateFilters({ maxPrice: value });
                      }
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
                  onClick={() => {
                    const newTags = filters.selectedTags.includes(tag)
                      ? filters.selectedTags.filter(t => t !== tag)
                      : [...filters.selectedTags, tag];
                    updateFilters({ selectedTags: newTags });
                  }}
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

      {/* Display "No products found" message */}
      {searchResults && searchResults.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400">
          Nenhum produto encontrado.
        </div>
      )}
    </div>
  );
}
