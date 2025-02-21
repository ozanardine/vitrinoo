import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Search, X, Tag, Package, Star, DollarSign, Filter, 
  ChevronDown, ChevronUp
} from 'lucide-react';
import { debounce } from 'lodash';

// Types
interface StoreSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: Category[];
  brands: string[];
  tags: string[];
  searchResults?: any[];
  storeId: string;
  initialProducts?: any[];
  accentColor?: string;
  secondaryColor?: string;
  primaryColor?: string;
  surfaceColor?: string;
  borderColor?: string;
  mutedColor?: string;
  fontFamily?: string;
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

interface DropdownState {
  filter: boolean;
  categories: boolean;
  tags: boolean;
  brands: boolean;
}

// Constants
const STORE_FILTERS_KEY = 'store-filters';
const INITIAL_FILTERS: SearchFilters = {
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
  storeId,
  initialProducts = [],
  accentColor = '#3B82F6',
  secondaryColor = '#1F2937',
  primaryColor = '#FFFFFF',
  surfaceColor = '#FFFFFF',
  borderColor = '#E5E7EB',
  mutedColor = '#6B7280',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif'
}: StoreSearchProps) {
  // States
  const [filters, setFilters] = useState<SearchFilters>(getSavedFilters());
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [dropdowns, setDropdowns] = useState<DropdownState>({
    filter: false,
    categories: false,
    tags: false,
    brands: false
  });
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs
  const filterRef = useRef<HTMLFormElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get saved filters
  function getSavedFilters(): SearchFilters {
    try {
      const saved = localStorage.getItem(`${STORE_FILTERS_KEY}-${storeId}`);
      return saved ? JSON.parse(saved) : INITIAL_FILTERS;
    } catch {
      return INITIAL_FILTERS;
    }
  }

  // Persist filters
  useEffect(() => {
    localStorage.setItem(
      `${STORE_FILTERS_KEY}-${storeId}`, 
      JSON.stringify(filters)
    );
  }, [filters, storeId]);

  // Calculate active filters
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setDropdowns({
          filter: false,
          categories: false,
          tags: false,
          brands: false
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((newFilters: SearchFilters) => {
      setIsSearching(true);
      
      // Local filtering
      initialProducts.filter(product => {
        // Text search
        if (newFilters.search && 
            !product.title.toLowerCase().includes(newFilters.search.toLowerCase())) {
          return false;
        }

        // Category filter
        if (newFilters.categoryId && product.category_id !== newFilters.categoryId) {
          return false;
        }

        // Brand filter
        if (newFilters.brand && product.brand !== newFilters.brand) {
          return false;
        }

        // Tags filter
        if (newFilters.selectedTags.length > 0 && 
            !newFilters.selectedTags.every(tag => product.tags.includes(tag))) {
          return false;
        }

        // Price range
        const price = product.promotional_price || product.price;
        if (newFilters.minPrice && price < newFilters.minPrice) {
          return false;
        }
        if (newFilters.maxPrice && price > newFilters.maxPrice) {
          return false;
        }

        // Promotion filter
        if (newFilters.hasPromotion && !product.promotional_price) {
          return false;
        }

        return true;
      });

      onSearch(newFilters);
      
      searchTimeoutRef.current = setTimeout(() => {
        setIsSearching(false);
      }, 300);
    }, 300),
    [onSearch, initialProducts]
  );

  // Update filters
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      debouncedSearch(newFilters);
      return newFilters;
    });
  }, [debouncedSearch]);

  // Clear filters
  const clearFilters = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setFilters(INITIAL_FILTERS);
    debouncedSearch(INITIAL_FILTERS);
    setDropdowns(prev => ({ ...prev, filter: false }));
    localStorage.removeItem(`${STORE_FILTERS_KEY}-${storeId}`);
    
    // Focus search input
    searchInputRef.current?.focus();
  }, [debouncedSearch, storeId]);

  // Toggle dropdown
  const toggleDropdown = useCallback((dropdown: keyof DropdownState) => {
    setDropdowns(prev => ({
      filter: dropdown === 'filter' ? !prev.filter : false,
      categories: dropdown === 'categories' ? !prev.categories : false,
      tags: dropdown === 'tags' ? !prev.tags : false,
      brands: dropdown === 'brands' ? !prev.brands : false
    }));
  }, []);

  // Toggle tag
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

  // Styles
  const styles = useMemo(() => ({
    input: {
      backgroundColor: surfaceColor,
      color: secondaryColor,
      borderColor: `${borderColor}`
    },
    button: {
      backgroundColor: `${secondaryColor}15`,
      color: mutedColor,
      hoverBackgroundColor: `${secondaryColor}25`
    },
    activeButton: {
      backgroundColor: `${accentColor}25`,
      color: accentColor
    },
    tag: {
      backgroundColor: `${borderColor}40`,
      color: mutedColor
    },
    activeTag: {
      backgroundColor: `${accentColor}25`,
      color: accentColor
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '0.5rem',
      backgroundColor: surfaceColor,
      borderColor: borderColor,
      boxShadow: `0 10px 25px -5px ${secondaryColor}10, 0 8px 10px -6px ${secondaryColor}10`
    }
  }), [accentColor, secondaryColor, primaryColor, surfaceColor, borderColor, mutedColor]);

  return (
    <form 
      onSubmit={(e) => e.preventDefault()} 
      className="space-y-4" 
      ref={filterRef}
      style={{ fontFamily }}
    >
      {/* Search Bar and Quick Filters */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <input
            ref={searchInputRef}
            type="text"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Buscar produtos..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl shadow-sm focus:ring-2 
              focus:ring-opacity-50 transition-all duration-300 hover:shadow-md
              group-hover:shadow-md"
            style={{
              ...styles.input,
              outlineColor: accentColor,
              boxShadow: `0 4px 6px -1px ${secondaryColor}20, 0 2px 4px -1px ${secondaryColor}20`
            }}
          />
          <Search 
            className="absolute left-4 top-4 w-5 h-5 transition-opacity duration-300
              group-hover:opacity-80" 
            style={{ color: `${secondaryColor}80` }}
            aria-hidden="true"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => updateFilters({ search: '' })}
              className="absolute right-4 top-4 hover:opacity-70 
                transition-all duration-300 hover:scale-110"
              style={{ color: `${secondaryColor}80` }}
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex gap-3 items-center relative">
          {/* Categories */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('categories')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl 
                transition-all duration-300 hover:shadow-md"
              style={filters.categoryId ? styles.activeButton : styles.button}
              aria-expanded={dropdowns.categories}
              aria-haspopup="true"
            >
              <Package className="w-5 h-5" />
              <span>{filters.categoryId 
                ? categories.find(c => c.id === filters.categoryId)?.name 
                : 'Categories'}</span>
              {dropdowns.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Category Dropdown */}
            {dropdowns.categories && (
              <div className="absolute left-0 mt-2 w-64 rounded-lg shadow-lg z-50 overflow-hidden
                transform transition-all duration-300 ease-out origin-top-left
                animate-in fade-in slide-in-from-top-2"
                style={{ 
                  backgroundColor: primaryColor,
                  border: `1px solid ${secondaryColor}30`,
                  boxShadow: `0 10px 15px -3px ${secondaryColor}20, 0 4px 6px -2px ${secondaryColor}20`
                }}
              >
                <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        updateFilters({ categoryId: category.id });
                        toggleDropdown('categories');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg transition-all duration-200
                        hover:scale-[1.02] active:scale-[0.98]"
                      style={filters.categoryId === category.id ? styles.activeButton : styles.button}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Brands */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('brands')}
              className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200"
              style={filters.brand ? styles.activeButton : styles.button}
              aria-expanded={dropdowns.brands}
              aria-haspopup="true"
            >
              <Star className="w-5 h-5" />
              <span>{filters.brand || 'Brands'}</span>
              {dropdowns.brands ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Brands Dropdown */}
            {dropdowns.brands && (
              <div className="absolute left-0 mt-2 w-64 rounded-lg shadow-lg z-50 overflow-hidden
                transform transition-all duration-300 ease-out origin-top-left
                animate-in fade-in slide-in-from-top-2"
                style={{ 
                  backgroundColor: primaryColor,
                  border: `1px solid ${secondaryColor}30`,
                  boxShadow: `0 10px 15px -3px ${secondaryColor}20, 0 4px 6px -2px ${secondaryColor}20`
                }}
              >
                <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                  {brands.map(brand => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => {
                        updateFilters({ brand });
                        toggleDropdown('brands');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg transition-all duration-200
                        hover:scale-[1.02] active:scale-[0.98]"
                      style={filters.brand === brand ? styles.activeButton : styles.button}
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
              onClick={() => toggleDropdown('tags')}
              className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200"
              style={filters.selectedTags.length > 0 ? styles.activeButton : styles.button}
              aria-expanded={dropdowns.tags}
              aria-haspopup="true"
            >
              <Tag className="w-5 h-5" />
              <span>Tags {filters.selectedTags.length > 0 && `(${filters.selectedTags.length})`}</span>
              {dropdowns.tags ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Tags Dropdown */}
            {dropdowns.tags && (
              <div className="absolute left-0 mt-2 w-80 rounded-lg shadow-lg z-50 overflow-hidden"
                style={{ 
                  backgroundColor: primaryColor,
                  border: `1px solid ${secondaryColor}30`,
                  boxShadow: `0 10px 15px -3px ${secondaryColor}20, 0 4px 6px -2px ${secondaryColor}20`
                }}
              >
                <div className="p-3 max-h-80 overflow-y-auto custom-scrollbar">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="px-3 py-1 rounded-full text-sm transition-all duration-200"
                        style={
                          filters.selectedTags.includes(tag)
                            ? styles.activeButton
                            : styles.button
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* More Filters */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('filter')}
              className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 relative"
              style={activeFiltersCount > 0 ? styles.activeButton : styles.button}
              aria-expanded={dropdowns.filter}
              aria-haspopup="true"
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span 
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: accentColor, color: primaryColor }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Advanced Filters Dropdown */}
            {dropdowns.filter && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg shadow-lg z-50 overflow-hidden"
                style={{ 
                  backgroundColor: primaryColor,
                  border: `1px solid ${secondaryColor}30`,
                  boxShadow: `0 10px 15px -3px ${secondaryColor}20, 0 4px 6px -2px ${secondaryColor}20`
                }}
              >
                <div className="p-4 space-y-4">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" style={{ color: accentColor }} />
                      <span style={{ color: secondaryColor }}>Preço</span>
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2" style={{ color: `${secondaryColor}80` }}>
                            R$
                          </span>
                          <input
                            type="number"
                            value={filters.minPrice ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Number(e.target.value);
                              updateFilters({ minPrice: value });
                            }}
                            placeholder="Mínimo"
                            className="w-full pl-10 p-2 rounded transition-all duration-200"
                            style={{
                              ...styles.input,
                              borderColor: `${secondaryColor}30`
                            }}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <span style={{ color: `${secondaryColor}80` }}>até</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2" style={{ color: `${secondaryColor}80` }}>
                            R$
                          </span>
                          <input
                            type="number"
                            value={filters.maxPrice ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : Number(e.target.value);
                              updateFilters({ maxPrice: value });
                            }}
                            placeholder="Máximo"
                            className="w-full pl-10 p-2 rounded transition-all duration-200"
                            style={{
                              ...styles.input,
                              borderColor: `${secondaryColor}30`
                            }}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      {/* Promotion Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasPromotion === true}
                          onChange={(e) => {
                            updateFilters({ hasPromotion: e.target.checked ? true : null });
                          }}
                          className="rounded transition-colors"
                          style={{ 
                            accentColor: accentColor,
                            borderColor: `${secondaryColor}40`
                          }}
                        />
                        <span style={{ color: secondaryColor }}>
                          Apenas produtos em promoção
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full py-2 rounded-lg transition-all duration-200 mt-4"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      color: accentColor
                    }}
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center py-2">
          {/* Category Filter Tag */}
          {filters.categoryId && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={styles.activeButton}
            >
              <Package className="w-4 h-4" />
              {categories.find(c => c.id === filters.categoryId)?.name}
              <button
                type="button"
                onClick={() => updateFilters({ categoryId: null })}
                className="ml-1 hover:opacity-70 transition-opacity"
                aria-label="Remover filtro de categoria"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          {/* Brand Filter Tag */}
          {filters.brand && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={styles.activeButton}
            >
              <Star className="w-4 h-4" />
              {filters.brand}
              <button
                type="button"
                onClick={() => updateFilters({ brand: null })}
                className="ml-1 hover:opacity-70 transition-opacity"
                aria-label="Remover filtro de marca"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          {/* Tags Filter Tags */}
          {filters.selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={styles.activeButton}
            >
              <Tag className="w-4 h-4" />
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:opacity-70 transition-opacity"
                aria-label={`Remover tag ${tag}`}
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}

          {/* Price Filter Tag */}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={styles.activeButton}
            >
              <DollarSign className="w-4 h-4" />
              {filters.minPrice && filters.maxPrice
                ? `R$ ${filters.minPrice} - R$ ${filters.maxPrice}`
                : filters.minPrice
                ? `A partir de R$ ${filters.minPrice}`
                : `Até R$ ${filters.maxPrice}`
              }
              <button
                type="button"
                onClick={() => updateFilters({ minPrice: null, maxPrice: null })}
                className="ml-1 hover:opacity-70 transition-opacity"
                aria-label="Remover filtro de preço"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          {/* Promotion Filter Tag */}
          {filters.hasPromotion && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={styles.activeButton}
            >
              <DollarSign className="w-4 h-4" />
              Em promoção
              <button
                type="button"
                onClick={() => updateFilters({ hasPromotion: null })}
                className="ml-1 hover:opacity-70 transition-opacity"
                aria-label="Remover filtro de promoção"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}

          {/* Clear All Button */}
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: `${secondaryColor}80` }}
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
            style={{ borderColor: accentColor }}
          />
        </div>
      )}

      {/* No Results Message */}
      {!isSearching && searchResults.length === 0 && activeFiltersCount > 0 && (
        <div className="text-center py-8">
          <Package className="w-16 h-16 mx-auto mb-4" style={{ color: `${secondaryColor}40` }} />
          <p className="mb-4" style={{ color: `${secondaryColor}80` }}>
            Nenhum produto encontrado com os filtros selecionados
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="transition-colors"
            style={{ color: accentColor }}
          >
            Limpar filtros e tentar novamente
          </button>
        </div>
      )}
    </form>
  );
}