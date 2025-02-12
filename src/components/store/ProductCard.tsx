import React from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../lib/types';
import ReactMarkdown from 'react-markdown';

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  onClick: () => void;
  view?: 'grid' | 'list';
  style?: 'default' | 'compact' | 'minimal';
}

export function ProductCard({ product, onClick, view = 'grid', style = 'default', className, ...props }: ProductCardProps) {
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
        {...props}
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group flex ${className || ''}`}
      >
        <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 ${
          style === 'compact' ? 'w-32 h-32' : 'w-48 h-48'
        }`}>
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
      {...props}
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group w-full
        ${style === 'minimal' ? 'border-0' : 'border border-gray-200 dark:border-gray-700'}
        ${className || ''}
      `}
    >
      <div className={`
        relative overflow-hidden bg-gray-100 dark:bg-gray-700
        ${style === 'minimal' ? 'aspect-[4/5]' : style === 'compact' ? 'aspect-[3/2]' : 'aspect-square'}
      `}>
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
      <div className={`
        ${style === 'minimal' ? 'p-3 text-center' : 'p-4'}
        ${style === 'compact' ? 'flex items-center justify-between' : ''}
        ${style === 'minimal' ? 'space-y-2' : ''}
      `}>
        <div className={`${style !== 'minimal' ? 'mb-2' : ''}`}>
          <h3 className={`
            font-semibold line-clamp-1
            ${style === 'minimal' ? 'text-base' : 'text-lg'}
          `}>{product.title}</h3>
          <p className={`
            text-sm text-gray-500 dark:text-gray-400
            ${style === 'minimal' ? 'text-center' : ''}
          `}>{product.brand}</p>
        </div>
        <div className={`
          prose prose-sm dark:prose-invert line-clamp-2 mb-3
          ${style === 'minimal' ? 'h-8 text-sm' : 'h-10'}
          ${style === 'compact' ? 'hidden' : ''}
          ${style === 'minimal' ? 'text-center' : ''}
        `}>
          <ReactMarkdown>{product.description}</ReactMarkdown>
        </div>
        <div className={`
          flex flex-wrap gap-1 mb-3
          ${style === 'minimal' ? 'justify-center' : ''}
          ${style === 'compact' ? 'hidden' : ''}
        `}>
          {product.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`
                text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full
                ${style === 'minimal' ? 'inline-block mx-1' : ''}
              `}
            >
              {tag}
            </span>
          ))}
          {product.tags.length > 3 && (
            <span className={`
              text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full
              ${style === 'minimal' ? 'inline-block mx-1' : ''}
            `}>
              +{product.tags.length - 3}
            </span>
          )}
        </div>
        <div className={`
          ${style === 'minimal' ? 'text-center' : 'mt-auto'}
          ${style === 'compact' ? 'text-right' : ''}
        `}>
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