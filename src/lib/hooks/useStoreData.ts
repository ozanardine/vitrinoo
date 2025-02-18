import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { StoreData, Category, Product } from '../types';

interface UseStoreDataReturn {
  store: StoreData | null;
  categories: Category[];
  products: Product[];
  brands: string[];
  tags: string[];
  loading: boolean;
  error: string | null;
  loadProducts: () => Promise<void>;
}

export function useStoreData(slug: string): UseStoreDataReturn {
  const [store, setStore] = useState<StoreData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoreData();
  }, [slug]);

  const loadStoreData = async () => {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .single();

      if (storeError) throw storeError;
      if (!storeData) throw new Error('Loja não encontrada');

      setStore(storeData);

      // Carregar dados em paralelo
      await Promise.all([
        loadCategories(storeData.id),
        loadProducts(storeData.id)
      ]);
    } catch (err: any) {
      console.error('Erro ao carregar dados da loja:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const loadProducts = async (storeId?: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId || store?.id || '')
        .eq('status', true);

      if (error) throw error;

      const uniqueBrands = [...new Set(data?.map(p => p.brand) || [])];
      const uniqueTags = [...new Set(data?.flatMap(p => p.tags) || [])];

      setBrands(uniqueBrands);
      setTags(uniqueTags);
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  return {
    store,
    categories,
    products,
    brands,
    tags,
    loading,
    error,
    loadProducts
  };
}