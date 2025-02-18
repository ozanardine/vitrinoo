import { useMemo } from 'react';
import { Product } from '../types';

export type SortType = 'recent' | 'price-asc' | 'price-desc';

export function useProductSort(products: Product[], currentSort: SortType) {
  const sortedProducts = useMemo(() => {
    switch (currentSort) {
      case 'price-asc':
        return [...products].sort((a, b) => 
          (a.promotional_price || a.price) - (b.promotional_price || b.price));
      case 'price-desc':
        return [...products].sort((a, b) => 
          (b.promotional_price || b.price) - (a.promotional_price || a.price));
      default:
        return [...products].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, currentSort]);

  return sortedProducts;
}