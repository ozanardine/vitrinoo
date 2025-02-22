import { useMemo } from 'react';
import { Product } from '../types';

export type SortType = 'recent' | 'price-asc' | 'price-desc';

export function useProductSort(products: Product[], currentSort: SortType) {
  const sortedProducts = useMemo(() => {
    const getLowestPrice = (product: Product) => {
      const prices = [
        product.promotional_price || product.price,
        ...(product.children?.map(child => child.promotional_price || child.price) || [])
      ];
      return Math.min(...prices);
    };

    const getHighestPrice = (product: Product) => {
      const prices = [
        product.promotional_price || product.price,
        ...(product.children?.map(child => child.promotional_price || child.price) || [])
      ];
      return Math.max(...prices);
    };

    switch (currentSort) {
      case 'price-asc':
        return [...products].sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
      case 'price-desc':
        return [...products].sort((a, b) => getHighestPrice(b) - getHighestPrice(a));
      default:
        return [...products].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, currentSort]);

  return sortedProducts;
}