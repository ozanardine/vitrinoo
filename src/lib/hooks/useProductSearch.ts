import { useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { Product } from '../types';

export interface SearchFilters {
  search: string;
  categoryId: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  hasPromotion: boolean | null;
  selectedTags: string[];
  brand: string | null;
}

interface UseProductSearchReturn {
  searchProducts: (filters: SearchFilters) => Promise<void>;
  searchLoading: boolean;
  searchResults: Product[];
}

export function useProductSearch(storeId: string): UseProductSearchReturn {
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  const searchProducts = useCallback(async (filters: SearchFilters) => {
    try {
      setSearchLoading(true);

      const { data, error } = await supabase.rpc('search_products_v2', {
        p_store_id: storeId,
        p_search: filters.search || null,
        p_category_id: filters.categoryId,
        p_min_price: filters.minPrice,
        p_max_price: filters.maxPrice,
        p_has_promotion: filters.hasPromotion,
        p_tags: filters.selectedTags.length > 0 ? filters.selectedTags : null,
        p_brand: filters.brand,
        p_limit: 100,
        p_offset: 0
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [storeId]);

  return {
    searchProducts,
    searchLoading,
    searchResults
  };
}