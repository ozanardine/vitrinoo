import React, { useState, useEffect } from 'react';
import { Plus, Package, Search, Filter, AlertTriangle } from 'lucide-react';
import { Store, Product } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { ProductModal } from '../ProductModal';
import { ProductCard } from '../ProductCard';
import { ProductDetailsModal } from '../ProductDetailsModal';

interface ProductsTabProps {
  store: Store;
  onUpdate: () => void;
}

export function ProductsTab({ store, onUpdate }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToView, setProductToView] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [store.id]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setShowProductModal(true);
    setProductToView(null);
  };

  const handleDelete = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== product.id));
      setProductToDelete(null);
      setProductToView(null);
      onUpdate();
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Produtos</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {products.length} de {store.product_limit === Infinity ? 'Ilimitado' : store.product_limit} produtos
          </p>
        </div>
        <button
          onClick={() => {
            setProductToEdit(undefined);
            setShowProductModal(true);
          }}
          disabled={products.length >= store.product_limit}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum produto cadastrado ainda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={setProductToDelete}
              onClick={setProductToView}
            />
          ))}
        </div>
      )}

      {showProductModal && (
        <ProductModal
          storeId={store.id}
          categories={[]}
          onClose={() => {
            setShowProductModal(false);
            setProductToEdit(undefined);
          }}
          onSuccess={() => {
            setShowProductModal(false);
            setProductToEdit(undefined);
            loadProducts();
            onUpdate();
          }}
          product={productToEdit}
          planType={store.subscription.plan_type}
        />
      )}

      {productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja excluir o produto "{productToDelete.title}"? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(productToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {productToView && (
        <ProductDetailsModal
          product={productToView}
          onClose={() => setProductToView(null)}
          onEdit={handleEdit}
          onDelete={setProductToDelete}
        />
      )}
    </div>
  );
}