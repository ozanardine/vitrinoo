import React, { useMemo } from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../lib/types';
import ReactMarkdown from 'react-markdown';

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  onClick: () => void;
  view?: 'grid' | 'list';
  style?: 'default' | 'compact' | 'minimal';
  accentColor?: string;
  secondaryColor?: string;
  primaryColor?: string;
  fontFamily?: string;
}

export function ProductCard({ 
  product, 
  onClick, 
  view = 'grid', 
  style = 'default', 
  className = '',
  accentColor = '#3B82F6',
  secondaryColor = '#1F2937',
  primaryColor = '#FFFFFF',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  ...props 
}: ProductCardProps) {
  // Memoize type label
  const typeLabel = useMemo(() => {
    switch (product.type) {
      case 'variable': return 'Produto com Variações';
      case 'kit': return 'Kit/Combo';
      case 'manufactured': return 'Produto Fabricado';
      case 'service': return 'Serviço';
      default: return 'Produto Simples';
    }
  }, [product.type]);

  // Memoize discount percentage
  const discountPercentage = useMemo(() => {
    if (!product.promotional_price) return 0;
    return Math.round(((product.price - product.promotional_price) / product.price) * 100);
  }, [product.price, product.promotional_price]);

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/api/placeholder/400/400';
    e.currentTarget.alt = 'Imagem não disponível';
  };

  // List view component
  if (view === 'list') {
    return (
      <div 
        {...props}
        onClick={onClick}
        className={`
          relative overflow-hidden rounded-lg shadow-sm hover:shadow-md 
          transition-all duration-300 cursor-pointer group flex
          ${className}
        `}
        style={{
          backgroundColor: primaryColor,
          color: secondaryColor,
          fontFamily
        }}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes de ${product.title}`}
      >
        <div className={`
          relative overflow-hidden flex-shrink-0
          ${style === 'compact' ? 'w-32 h-32' : 'w-48 h-48'}
        `}
        style={{ backgroundColor: `${secondaryColor}10` }}>
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12" style={{ color: `${secondaryColor}40` }} />
            </div>
          )}
          {product.promotional_price && (
            <div 
              className="absolute top-2 right-2 px-2 py-1 rounded-full text-sm font-medium"
              style={{ backgroundColor: accentColor, color: primaryColor }}
            >
              {discountPercentage}% OFF
            </div>
          )}
        </div>

        <div className="flex-1 p-6">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                <p className="text-sm mb-2" style={{ color: `${secondaryColor}80` }}>
                  {product.brand}
                </p>
              </div>
              <div className="text-right">
                {product.promotional_price ? (
                  <div>
                    <p className="text-sm line-through" style={{ color: `${secondaryColor}60` }}>
                      R$ {product.price.toFixed(2)}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: accentColor }}>
                      R$ {product.promotional_price.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold" style={{ color: secondaryColor }}>
                    R$ {product.price.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 prose-sm line-clamp-3" style={{ color: `${secondaryColor}90` }}>
              <ReactMarkdown>{product.description}</ReactMarkdown>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${secondaryColor}10`,
                    color: secondaryColor
                  }}
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

  // Grid view component
  return (
    <div 
      {...props}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg shadow-sm hover:shadow-md 
        transition-all duration-300 cursor-pointer group w-full
        ${style === 'minimal' ? 'border-0' : 'border border-opacity-10'}
        ${className}
      `}
      style={{
        backgroundColor: primaryColor,
        color: secondaryColor,
        borderColor: secondaryColor,
        fontFamily
      }}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${product.title}`}
    >
      <div className={`
        relative overflow-hidden
        ${style === 'minimal' ? 'aspect-[4/5]' : 
          style === 'compact' ? 'aspect-[3/2]' : 
          'aspect-square'}
      `}
      style={{ backgroundColor: `${secondaryColor}10` }}>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12" style={{ color: `${secondaryColor}40` }} />
          </div>
        )}
        {product.promotional_price && (
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: accentColor, color: primaryColor }}
          >
            {discountPercentage}% OFF
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <span 
            className="px-2 py-1 text-xs rounded-full"
            style={{ backgroundColor: accentColor, color: primaryColor }}
          >
            {typeLabel}
          </span>
        </div>
      </div>

      <div className={`
        ${style === 'minimal' ? 'p-3 text-center' : 'p-4'}
        ${style === 'compact' ? 'flex items-center justify-between' : ''}
        ${style === 'minimal' ? 'space-y-2' : ''}
      `}>
        <div className={style !== 'minimal' ? 'mb-2' : ''}>
          <h3 className={`
            font-semibold line-clamp-1
            ${style === 'minimal' ? 'text-base' : 'text-lg'}
          `}>
            {product.title}
          </h3>
          <p className={`
            text-sm
            ${style === 'minimal' ? 'text-center' : ''}
          `}
          style={{ color: `${secondaryColor}80` }}>
            {product.brand}
          </p>
        </div>

        {style !== 'compact' && (
          <div className={`
            prose-sm line-clamp-2 mb-3
            ${style === 'minimal' ? 'h-8 text-sm' : 'h-10'}
            ${style === 'minimal' ? 'text-center' : ''}
          `}
          style={{ color: `${secondaryColor}90` }}>
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>
        )}

        {style !== 'compact' && (
          <div className={`
            flex flex-wrap gap-1 mb-3
            ${style === 'minimal' ? 'justify-center' : ''}
          `}>
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`
                  text-xs px-2 py-1 rounded-full
                  ${style === 'minimal' ? 'inline-block mx-1' : ''}
                `}
                style={{ 
                  backgroundColor: `${secondaryColor}10`,
                  color: secondaryColor
                }}
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span
                className={`
                  text-xs px-2 py-1 rounded-full
                  ${style === 'minimal' ? 'inline-block mx-1' : ''}
                `}
                style={{ 
                  backgroundColor: `${secondaryColor}10`,
                  color: secondaryColor
                }}
              >
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className={`
          ${style === 'minimal' ? 'text-center' : 'mt-auto'}
          ${style === 'compact' ? 'text-right' : ''}
        `}>
          {product.promotional_price ? (
            <div className="space-y-1">
              <p className="text-sm line-through" style={{ color: `${secondaryColor}60` }}>
                R$ {product.price.toFixed(2)}
              </p>
              <p className="text-lg font-bold" style={{ color: accentColor }}>
                R$ {product.promotional_price.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-lg font-bold" style={{ color: secondaryColor }}>
              R$ {product.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}