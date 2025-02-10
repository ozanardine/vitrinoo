import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

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
          className={`p-2 rounded-lg border ${
            showFilters 
              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900 dark:border-blue-800' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Filtros</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value || null })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Marca</label>
              <select
                value={filters.brand || ''}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value || null })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Todas as marcas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preço</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Mín"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  step="0.01"
                />
                <span>até</span>
                <input
                  type="number"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Máx"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = filters.selectedTags.includes(tag)
                      ? filters.selectedTags.filter(t => t !== tag)
                      : [...filters.selectedTags, tag];
                    setFilters({ ...filters, selectedTags: newTags });
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.hasPromotion === true}
                onChange={(e) => setFilters({ ...filters, hasPromotion: e.target.checked ? true : null })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Em promoção</span>
            </label>
          </div>

          <button
            onClick={handleSearch}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
          >
            Aplicar Filtros
          </button>
        </div>
      )}
    </div>
  );
}