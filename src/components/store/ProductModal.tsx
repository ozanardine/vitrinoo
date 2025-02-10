import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Product } from '../../lib/types';
import { Modal } from '../Modal';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title=""
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]}
                  alt={`${product.title} - Imagem ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Imagem+não+disponível';
                  }}
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
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                    index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} - Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">{product.brand}</p>
            {product.sku && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                SKU: {product.sku}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Descrição</h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Preço</h3>
            {product.promotional_price ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 line-through">
                    R$ {product.price.toFixed(2)}
                  </p>
                  <span className="bg-red-100 text-red-700 text-sm px-2 py-0.5 rounded-full">
                    {Math.round(((product.price - product.promotional_price) / product.price) * 100)}% OFF
                  </span>
                </div>
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
              <h3 className="font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}