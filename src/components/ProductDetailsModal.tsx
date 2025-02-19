import { useState } from 'react';
import { X, Edit2, Trash2, Tag, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../lib/types';
import ReactMarkdown from 'react-markdown';

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'variable': return 'Produto com Variações';
      case 'kit': return 'Kit/Combo';
      case 'manufactured': return 'Produto Fabricado';
      default: return 'Produto Simples';
    }
  };

  const nextImage = () => {
    if (product.images && currentImageIndex < product.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const selectImage = (index: number) => {
    setCurrentImageIndex(index);
  };

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
                  src={product.images[currentImageIndex]}
                  alt={`${product.title} - Imagem ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      disabled={currentImageIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white disabled:opacity-50"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={currentImageIndex === product.images.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white disabled:opacity-50"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                      {product.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => selectImage(index)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex 
                              ? 'border-blue-500' 
                              : 'border-transparent hover:border-blue-300'
                          }`}
                        >
                          <img
                            src={product.images[index]}
                            alt={`${product.title} - Miniatura ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-96 md:h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-gray-400" />
              </div>
            )}
          </div>

          {/* Detalhes do Produto */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
                <div className="flex items-center space-x-4">
                  <p className="text-gray-600 dark:text-gray-400">{product.brand}</p>
                  {product.sku && (
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  )}
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {getTypeLabel(product.type)}
                  </span>
                </div>
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
              {/* Preço */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {product.promotional_price ? (
                  <div className="space-y-1">
                    <p className="text-gray-500 line-through">
                      R$ {product.price.toFixed(2)}
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      R$ {product.promotional_price.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600">
                      {Math.round(((product.price - product.promotional_price) / product.price) * 100)}% de desconto
                    </p>
                  </div>
                ) : (
                  <p className="text-3xl font-bold">
                    R$ {product.price.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{product.description}</ReactMarkdown>
                </div>
              </div>

              {/* Variações */}
              {product.type === 'variable' && product.variation_attributes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Variações</h3>
                  <div className="space-y-2">
                    {product.variation_attributes.map((attr) => (
                      <div key={attr} className="flex items-center space-x-2">
                        <span className="font-medium">{attr}:</span>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(
                            (product.children || [])
                              .map(child => child.attributes?.[attr])
                              .filter(Boolean)
                          )).map((value) => (
                            <span
                              key={String(value)}
                              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                            >
                              {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Componentes do Kit/Produto Fabricado */}
              {(product.type === 'kit' || product.type === 'manufactured') && product.components && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {product.type === 'kit' ? 'Produtos do Kit' : 'Matéria-Prima'}
                  </h3>
                  <div className="space-y-2">
                    {product.components.map((component) => (
                      <div
                        key={component.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{component.title}</p>
                          {component.sku && (
                            <p className="text-sm text-gray-500">SKU: {component.sku}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {component.quantity} {component.unit}
                          </p>
                          {component.notes && (
                            <p className="text-sm text-gray-500">{component.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
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