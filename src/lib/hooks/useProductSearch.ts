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

      // Modificar a consulta para incluir as variações dos produtos
      const { data: parentProducts, error } = await supabase
        .from('products')
        .select(`
          *,
          children:products(*)
        `)
        .eq('store_id', storeId)
        .eq('status', true)
        .is('parent_id', null)
        .or(`title.ilike.%${filters.search || ''}%,description.ilike.%${filters.search || ''}%,sku.ilike.%${filters.search || ''}%`)
        .eq(filters.categoryId ? 'category_id' : 'status', filters.categoryId || true)
        .gte(filters.minPrice ? 'price' : 'status', filters.minPrice || true)
        .lte(filters.maxPrice ? 'price' : 'status', filters.maxPrice || true)
        .eq(filters.hasPromotion ? 'has_promotion' : 'status', filters.hasPromotion || true)
        .eq(filters.brand ? 'brand' : 'status', filters.brand || true)
        .contains('tags', filters.selectedTags.length > 0 ? filters.selectedTags : [])
        .limit(100);

      if (error) throw error;

      // Processar produtos e suas variações
      const processedProducts = (parentProducts || []).map(product => ({
        ...product,
        children: product.children || []
      }));

      setSearchResults(processedProducts);
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