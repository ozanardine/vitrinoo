import React from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../lib/types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
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
      </div>
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{product.brand}</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 h-10">
          {product.description}
        </p>
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