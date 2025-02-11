import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Store as StoreIcon, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { StoreHeader } from '../components/store/StoreHeader';
import { StoreSearch, SearchFilters } from '../components/store/StoreSearch';
import { ProductCard } from '../components/store/ProductCard';
import { ProductModal } from '../components/store/ProductModal';
import { ThemeToggle } from '../components/ThemeToggle';

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
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [currentSort, setCurrentSort] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

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

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load products
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

  const sortProducts = (products: Product[]) => {
    switch (currentSort) {
      case 'price-asc':
        return [...products].sort((a, b) => (a.promotional_price || a.price) - (b.promotional_price || b.price));
      case 'price-desc':
        return [...products].sort((a, b) => (b.promotional_price || b.price) - (a.promotional_price || a.price));
      default:
        return [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <StoreHeader
        name={store.name}
        description={store.description}
        logoUrl={store.logo_url}
        primaryColor={store.primary_color}
        secondaryColor={store.secondary_color}
        socialLinks={store.social_links}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <StoreSearch
            onSearch={handleSearch}
            categories={categories}
            brands={brands}
            tags={tags}
          />
        </div>

        {/* View Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={currentSort}
              onChange={(e) => setCurrentSort(e.target.value as typeof currentSort)}
              className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="recent">Mais recentes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentView('grid')}
                className={`p-2 rounded ${currentView === 'grid' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`p-2 rounded ${currentView === 'list' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {products.length} {products.length === 1 ? 'produto' : 'produtos'}
          </div>
        </div>

        {/* Products Grid/List */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhum produto encontrado
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            currentView === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {sortProducts(products).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                view={currentView}
              />
            ))}
          </div>
        )}
      </main>

      {/* Platform Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center">
            <StoreIcon className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Catálogo criado com Catálogo Digital
            </p>
            <a
              href="/"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Crie seu catálogo digital</span>
            </a>
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}