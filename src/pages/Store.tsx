import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { StoreLayout } from '../components/store/StoreLayout';
import { StoreSearch } from '../components/store/StoreSearch';
import { ProductCard } from '../components/store/ProductCard';
import { ProductDetailsView } from '../components/store/product-details/ProductDetailsView';
import { ViewControls } from '../components/store/ViewControls';
import { useStoreData } from '../lib/hooks/useStoreData';
import { useProductSearch } from '../lib/hooks/useProductSearch';
import { useProductSort, SortType } from '../lib/hooks/useProductSort';
import { Product } from '../lib/types';

export function Store() {
  const { slug } = useParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid');
  const [currentSort, setCurrentSort] = useState<SortType>('recent');

  // Load store data
  const {
    store,
    categories,
    products,
    brands,
    tags,
    loading,
    error
  } = useStoreData(slug!);

  // Product search
  const {
    searchProducts,
    searchLoading,
    searchResults
  } = useProductSearch(store?.id || '');

  // Sort products
  const sortedProducts = useProductSort(searchResults.length > 0 ? searchResults : products, currentSort);

  // Count only parent products and standalone products
  const mainProductsCount = useMemo(() => {
    return sortedProducts.filter(product => !product.parent_id).length;
  }, [sortedProducts]);

  // Grid configuration
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 transition-colors"
          style={{ borderColor: store?.accent_color || '#3B82F6' }}
        />
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
    <StoreLayout store={store}>
      {/* Search Section */}
      <div className="py-8">
        <StoreSearch
          onSearch={searchProducts}
          categories={categories}
          brands={brands}
          tags={tags}
          searchResults={products}
          accentColor={store.accent_color}
          secondaryColor={store.secondary_color}
          storeId={store.id}
          initialProducts={products}
        />
      </div>

      {/* View Controls */}
      <ViewControls
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentSort={currentSort}
        setCurrentSort={setCurrentSort}
        productsCount={mainProductsCount}
        accentColor={store.accent_color}
        secondaryColor={store.secondary_color}
        primaryColor={store.primary_color}
      />

      {/* Products Grid/List */}
      {searchLoading ? (
        <div className="flex items-center justify-center py-12">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: store.accent_color }}
          />
        </div>
      ) : sortedProducts.length === 0 ? (
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
        <div data-store-content className="min-h-screen">
          <style>
            {getScrollbarStyles(store.accent_color, store.secondary_color)}
          </style>
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
                variant={store.product_card_style}
                accentColor={store.accent_color}
                secondaryColor={store.secondary_color}
                primaryColor={store.primary_color}
                className="transition-all duration-300 hover:scale-[1.02]"
                fontFamily={store.body_font}
              />
            ))}
          </div>
        </div>
      )}

      {/* Product Details View */}
      {selectedProduct && (
        <ProductDetailsView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          accentColor={store.accent_color}
          secondaryColor={store.secondary_color}
          primaryColor={store.primary_color}
          fontFamily={store.body_font}
          variant={store.product_card_style}
        />
      )}
    </StoreLayout>
  );
}

const getScrollbarStyles = (accentColor: string, secondaryColor: string) => `
  [data-store-content] ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  [data-store-content] ::-webkit-scrollbar-track {
    background: ${secondaryColor}10;
    border-radius: 5px;
  }

  [data-store-content] ::-webkit-scrollbar-thumb {
    background-color: ${accentColor}40;
    border-radius: 5px;
    transition: all 0.3s ease;
  }

  [data-store-content] ::-webkit-scrollbar-thumb:hover {
    background-color: ${accentColor}60;
  }
`;