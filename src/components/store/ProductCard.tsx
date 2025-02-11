import React from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../lib/types';
import ReactMarkdown from 'react-markdown';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  view?: 'grid' | 'list';
}

export function ProductCard({ product, onClick, view = 'grid' }: ProductCardProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'variable': return 'Produto com Variações';
      case 'kit': return 'Kit/Combo';
      case 'manufactured': return 'Produto Fabricado';
      case 'service': return 'Serviço';
      default: return 'Produto Simples';
    }
  };

  if (view === 'list') {
    return (
      <div 
        onClick={onClick}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group flex"
      >
        <div className="w-48 h-48 relative overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Imagem+não+disponível';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
          {product.promotional_price && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
              {Math.round(((product.price - product.promotional_price) / product.price) * 100)}% OFF
            </div>
          )}
        </div>

        <div className="flex-1 p-6">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{product.brand}</p>
              </div>
              <div className="text-right">
                {product.promotional_price ? (
                  <div>
                    <p className="text-sm text-gray-500 line-through">
                      R$ {product.price.toFixed(2)}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {product.promotional_price.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold">
                    R$ {product.price.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert mt-4 line-clamp-3">
              <ReactMarkdown>{product.description}</ReactMarkdown>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-700">
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Imagem+não+disponível';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {product.promotional_price && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
            {Math.round(((product.price - product.promotional_price) / product.price) * 100)}% OFF
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
            {getTypeLabel(product.type)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</p>
        </div>
        <div className="prose prose-sm dark:prose-invert line-clamp-2 mb-3 h-10">
          <ReactMarkdown>{product.description}</ReactMarkdown>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
            >
              {tag}
            </span>
          ))}
          {product.tags.length > 3 && (
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              +{product.tags.length - 3}
            </span>
          )}
        </div>
        <div className="mt-auto">
          {product.promotional_price ? (
            <div className="space-y-1">
              <p className="text-sm text-gray-500 line-through">
                R$ {product.price.toFixed(2)}
              </p>
              <p className="text-lg font-bold text-green-600">
                R$ {product.promotional_price.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-lg font-bold">
              R$ {product.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}