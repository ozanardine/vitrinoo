import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Package, Store as StoreIcon, ThumbsUp, Grid, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../lib/types';
import { StoreHeader } from '../components/store/StoreHeader';
import { StoreSearch, SearchFilters } from '../components/store/StoreSearch';
import { ProductCard } from '../components/store/ProductCard';
import { ProductModal } from '../components/store/ProductModal';
import { ThemeToggle } from '../components/ThemeToggle';

// Interfaces atualizadas
interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface HeaderVisibility {
  logo: boolean;
  title: boolean;
  description: boolean;
  socialLinks: boolean;
}

interface SocialSettings {
  contacts_position: 'above' | 'below';
  display_format: 'username' | 'network';
}

interface StoreData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  
  // Cores e tema
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  
  // Configurações do cabeçalho
  header_style: 'solid' | 'gradient' | 'image';
  header_height: string;
  header_image: string | null;
  header_gradient: string;
  header_overlay_opacity: string;
  header_alignment: 'left' | 'center' | 'right';
  header_visibility: HeaderVisibility;
  
  // Configurações de tipografia
  logo_size: string;
  title_size: string;
  description_size: string;
  title_font: string;
  body_font: string;
  
  // Configurações de layout
  product_card_style: 'default' | 'compact' | 'minimal';
  grid_columns: string;
  grid_gap: string;
  container_width: string;
  
  // Configurações sociais
  social_links: Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>;
  social_settings: SocialSettings;
}

// Valores padrão para configurações
const DEFAULT_STORE_CONFIG = {
  header_visibility: {
    logo: true,
    title: true,
    description: true,
    socialLinks: true
  },
  social_settings: {
    contacts_position: 'above' as const,
    display_format: 'username' as const
  },
  grid_columns: '4',
  grid_gap: '24',
  product_card_style: 'default' as const,
  container_width: 'max-w-7xl',
  primary_color: '#ffffff',
  secondary_color: '#000000',
  accent_color: '#3B82F6'
};

// Componente de Loading otimizado
const LoadingState: React.FC<{ accentColor?: string }> = ({ accentColor }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div 
      className="animate-spin rounded-full h-12 w-12 border-b-2 transition-colors"
      style={{ borderColor: accentColor || '#3B82F6' }}
    />
  </div>
);

// Componente principal Store
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
  const [searchLoading, setSearchLoading] = useState(false);

  // Carregar dados da loja
  useEffect(() => {
    loadStoreData();
  }, [slug]);

  // Garantir valores padrão para a loja
  useEffect(() => {
    if (store) {
      setStore({
        ...store,
        header_visibility: store.header_visibility || DEFAULT_STORE_CONFIG.header_visibility,
        social_settings: store.social_settings || DEFAULT_STORE_CONFIG.social_settings,
        grid_columns: store.grid_columns || DEFAULT_STORE_CONFIG.grid_columns,
        grid_gap: store.grid_gap || DEFAULT_STORE_CONFIG.grid_gap,
        product_card_style: store.product_card_style || DEFAULT_STORE_CONFIG.product_card_style,
        container_width: store.container_width || DEFAULT_STORE_CONFIG.container_width,
        primary_color: store.primary_color || DEFAULT_STORE_CONFIG.primary_color,
        secondary_color: store.secondary_color || DEFAULT_STORE_CONFIG.secondary_color,
        accent_color: store.accent_color || DEFAULT_STORE_CONFIG.accent_color
      });
    }
  }, [store]);

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

  const loadProducts = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
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

  // Função de busca otimizada
  const handleSearch = useCallback(async (filters: SearchFilters) => {
    if (!store) return;

    try {
      setSearchLoading(true);

      const { data, error } = await supabase.rpc('search_products_v2', {
        p_store_id: store.id,
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
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setSearchLoading(false);
    }
  }, [store]);

  // Ordenação de produtos memorizada
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

  // Configuração do grid memorizada
  const gridConfig = useMemo(() => {
    const columns = {
      '2': 'sm:grid-cols-2',
      '3': 'sm:grid-cols-2 lg:grid-cols-3',
      '4': 'sm:grid-cols-2 lg:grid-cols-4',
      '5': 'sm:grid-cols-2 lg:grid-cols-5'
    };

    return {
      gridTemplateColumns: currentView === 'grid' 
        ? columns[store?.grid_columns as keyof typeof columns] || columns['4']
        : 'grid-cols-1',
      gap: currentView === 'grid' ? `${store?.grid_gap || 24}px` : '1rem'
    };
  }, [store?.grid_columns, store?.grid_gap, currentView]);

  // Container class memorizada
  const containerClass = useMemo(() => {
    const width = store?.container_width || 'max-w-7xl';
    return width === 'max-w-full' 
      ? 'container-fluid px-4'
      : `container mx-auto px-4 ${width}`;
  }, [store?.container_width]);

  if (loading) {
    return <LoadingState accentColor={store?.accent_color} />;
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
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: `${store.primary_color}10`,
        color: store.secondary_color
      }}
    >
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Store Header */}
      <StoreHeader
        name={store.name}
        description={store.description}
        logoUrl={store.logo_url}
        primaryColor={store.primary_color}
        secondaryColor={store.secondary_color}
        socialLinks={store.social_links}
        customization={{
          headerStyle: store.header_style,
          headerHeight: store.header_height,
          headerImage: store.header_image,
          headerGradient: store.header_gradient,
          headerAlignment: store.header_alignment,
          headerOverlayOpacity: store.header_overlay_opacity,
          headerVisibility: store.header_visibility,
          logoSize: store.logo_size,
          titleSize: store.title_size,
          descriptionSize: store.description_size,
          titleFont: store.title_font,
          bodyFont: store.body_font,
          socialSettings: store.social_settings
        }}
      />

      {/* Main Content */}
      <main 
        className={`${containerClass} transition-all duration-200`}
        style={{ fontFamily: store.body_font }}
      >
        {/* Search Section */}
        <div className="py-8">
          <StoreSearch
            onSearch={handleSearch}
            categories={categories}
            brands={brands}
            tags={tags}
            loading={searchLoading}
            searchResults={products}
            accentColor={store.accent_color}
            secondaryColor={store.secondary_color}
          />
        </div>

        {/* View Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            {/* Sort Dropdown */}
            <select
              value={currentSort}
              onChange={(e) => setCurrentSort(e.target.value as typeof currentSort)}
              className="p-2 border rounded transition-colors w-full sm:w-auto
                focus:ring-2 focus:outline-none dark:bg-gray-800 dark:border-gray-700"
              style={{
                borderColor: `${store.accent_color}40`,
                color: store.secondary_color,
                backgroundColor: `${store.primary_color}05`
              }}
            >
              <option value="recent">Mais recentes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
            </select>

            {/* View Toggle Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentView('grid')}
                className={`p-2 rounded transition-all duration-200 ${
                  currentView === 'grid' 
                    ? 'bg-opacity-20' 
                    : 'bg-opacity-0 hover:bg-opacity-10'
                }`}
                style={{ backgroundColor: store.accent_color }}
                aria-label="Visualização em grade"
              >
                <Grid className="w-5 h-5" style={{ color: store.secondary_color }} />
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`p-2 rounded transition-all duration-200 ${
                  currentView === 'list' 
                    ? 'bg-opacity-20' 
                    : 'bg-opacity-0 hover:bg-opacity-10'
                }`}
                style={{ backgroundColor: store.accent_color }}
                aria-label="Visualização em lista"
              >
                <List className="w-5 h-5" style={{ color: store.secondary_color }} />
              </button>
            </div>
          </div>

          {/* Products Count */}
          <div 
            className="text-sm"
            style={{ color: `${store.secondary_color}80` }}
          >
            {products.length} {products.length === 1 ? 'produto' : 'produtos'}
          </div>
        </div>

        {/* Products Grid/List */}
        {searchLoading ? (
          <LoadingState accentColor={store.accent_color} />
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package 
              className="w-16 h-16 mx-auto mb-4" 
              style={{ color: `${store.secondary_color}40` }}
            />
            <p style={{ color: `${store.secondary_color}80` }}>
              Nenhum produto encontrado
            </p>
          </div>
        ) : (
          <div 
            className={`grid ${gridConfig.gridTemplateColumns} transition-all duration-300`}
            style={{ 
              gap: gridConfig.gap,
              opacity: searchLoading ? '0.5' : '1'
            }}
          >
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                view={currentView}
                style={store.product_card_style}
                accentColor={store.accent_color}
                secondaryColor={store.secondary_color}
                primaryColor={store.primary_color}
                className="transition-all duration-300 hover:scale-[1.02]"
                fontFamily={store.body_font}
              />
            ))}
          </div>
        )}

        {/* Empty State with No Filters */}
        {products.length === 0 && !searchLoading && (
          <div className="mt-8 p-6 bg-opacity-5 rounded-lg text-center"
            style={{ backgroundColor: store.accent_color }}>
            <p className="text-lg font-medium mb-2" style={{ color: store.secondary_color }}>
              Nenhum produto encontrado
            </p>
            <p style={{ color: `${store.secondary_color}80` }}>
              Tente ajustar seus filtros ou fazer uma nova busca
            </p>
          </div>
        )}
      </main>

      {/* Platform Footer */}
      <footer 
        className="border-t py-8 mt-12 transition-colors duration-200"
        style={{
          backgroundColor: store.primary_color,
          borderColor: `${store.secondary_color}20`
        }}
      >
        <div className={containerClass}>
          <div className="flex flex-col items-center justify-center text-center">
            <StoreIcon 
              className="w-8 h-8 mb-2" 
              style={{ color: store.accent_color }}
            />
            <p 
              className="mb-4"
              style={{ color: `${store.secondary_color}80` }}
            >
              Catálogo criado com Catálogo Digital
            </p>
            <a
              href="/"
              className="inline-flex items-center space-x-2 transition-colors duration-200 hover:opacity-80"
              style={{ color: store.accent_color }}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Crie seu catálogo digital</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          accentColor={store.accent_color}
          secondaryColor={store.secondary_color}
          primaryColor={store.primary_color}
          fontFamily={store.body_font}
          style={store.product_card_style}
        />
      )}
    </div>
  );
}