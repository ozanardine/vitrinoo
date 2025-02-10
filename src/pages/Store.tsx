import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { StoreHeader } from '../components/store/StoreHeader';
import { StoreSearch, SearchFilters } from '../components/store/StoreSearch';
import { ProductCard } from '../components/store/ProductCard';
import { ProductModal } from '../components/store/ProductModal';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface StoreData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  primary_color: string;
  secondary_color: string;
  social_links: Array<{
    type: string;
    url: string;
  }>;
}

export function Store() {
  const { slug } = useParams();
  const [store, setStore] = useState<StoreData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

      // Carregar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Carregar produtos para extrair marcas e tags únicas
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('status', true);

      if (productsError) throw productsError;

      const uniqueBrands = [...new Set(productsData?.map(p => p.brand) || [])];
      const uniqueTags = [...new Set(productsData?.flatMap(p => p.tags) || [])];

      setBrands(uniqueBrands);
      setTags(uniqueTags);
      setProducts(productsData || []);

    } catch (err: any) {
      console.error('Erro ao carregar dados da loja:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters: SearchFilters) => {
    if (!store) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('search_products', {
        p_store_id: store.id,
        p_search: filters.search || null,
        p_category_id: filters.categoryId,
        p_min_price: filters.minPrice,
        p_max_price: filters.maxPrice,
        p_has_promotion: filters.hasPromotion,
        p_tags: filters.selectedTags.length > 0 ? filters.selectedTags : null,
        p_brand: filters.brand
      });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loja não encontrada</h1>
          <p className="text-gray-600 dark:text-gray-400">
            A loja que você está procurando não existe ou foi removida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StoreHeader
        name={store.name}
        description={store.description}
        logoUrl={store.logo_url}
        primaryColor={store.primary_color}
        secondaryColor={store.secondary_color}
        socialLinks={store.social_links}
      />

      <main className="container mx-auto px-4 py-8">
        <StoreSearch
          onSearch={handleSearch}
          categories={categories}
          brands={brands}
          tags={tags}
        />

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum produto encontrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}