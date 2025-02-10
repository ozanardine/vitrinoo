import React from 'react';
import { X, Edit2, Trash2, Tag, Package } from 'lucide-react';
import { Product } from '../lib/types';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductDetailsModal({ 
  product, 
  onClose, 
  onEdit,
  onDelete 
}: ProductDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row h-full">
          {/* Galeria de Imagens */}
          <div className="w-full md:w-1/2 bg-gray-100 dark:bg-gray-700">
            {product.images && product.images.length > 0 ? (
              <div className="relative h-96 md:h-full">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 md:h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-400" />
              </div>
            )}
          </div>

          {/* Detalhes do Produto */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">{product.brand}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(product)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Editar produto"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500"
                  title="Excluir produto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Preço</h3>
                {product.promotional_price ? (
                  <div className="space-y-1">
                    <p className="text-gray-500 line-through">
                      R$ {product.price.toFixed(2)}
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      R$ {product.promotional_price.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">
                    R$ {product.price.toFixed(2)}
                  </p>
                )}
              </div>

              {product.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700"
                      >
                        <Tag className="w-4 h-4 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}