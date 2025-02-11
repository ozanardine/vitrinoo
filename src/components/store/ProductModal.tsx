import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Package, Tag, Clock } from 'lucide-react';
import { Product } from '../../lib/types';
import ReactMarkdown from 'react-markdown';
import { Modal } from '../Modal';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  const handleVariationSelect = (variation: any) => {
    setSelectedVariation(variation);
  };

  const formatDuration = (duration: string) => {
    const [hours, minutes] = duration.split(':');
    return `${hours}h${minutes ? ` ${minutes}min` : ''}`;
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title=""
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2">
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]}
                  alt={`${product.title} - Imagem ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white"
                      disabled={currentImageIndex === 0}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => Math.min(product.images!.length - 1, prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white"
                      disabled={currentImageIndex === product.images.length - 1}
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

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`
                    relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden
                    ${index === currentImageIndex ? 'ring-2 ring-blue-500' : ''}
                  `}
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

        {/* Product Info */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">{product.brand}</p>
              {product.sku && (
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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

          {/* Description */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>

          {/* Service Info */}
          {product.type === 'service' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span>Duração: {formatDuration(product.duration || '')}</span>
              </div>

              {product.service_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span>{product.service_location}</span>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Disponibilidade</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-1">Dias</h5>
                    <div className="flex flex-wrap gap-1">
                      {product.availability?.weekdays.map(day => (
                        <span key={day} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-1">Horários</h5>
                    <div className="space-y-1">
                      {product.availability?.hours.map((hour, index) => (
                        <div key={index} className="text-sm">
                          {hour.start} - {hour.end}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Variations */}
          {product.type === 'variable' && product.variation_attributes && (
            <div className="space-y-4">
              {product.variation_attributes.map(attr => (
                <div key={attr}>
                  <h4 className="font-medium mb-2">{attr}</h4>
                  <div className="flex flex-wrap gap-2">
                    {/* Add variation options */}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                  >
                    <Tag className="w-4 h-4" />
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