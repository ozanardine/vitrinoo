import React, { useMemo } from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../lib/types';
import ReactMarkdown from 'react-markdown';

const getFontFamily = (font: string) => {
  const fontMap: Record<string, string> = {
    'roboto': 'Roboto',
    'open-sans': 'Open Sans',
    'lato': 'Lato',
    'montserrat': 'Montserrat',
    'playfair': 'Playfair Display',
    'merriweather': 'Merriweather',
    'source-code-pro': 'Source Code Pro',
    'fira-mono': 'Fira Mono'
  };
  return fontMap[font] || font || 'system-ui';
};

interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  product: Product;
  onClick: () => void;
  view?: 'grid' | 'list';
  variant?: 'default' | 'compact' | 'minimal';
  accentColor?: string;
  secondaryColor?: string;
  primaryColor?: string;
  surfaceColor?: string;
  fontFamily?: string;
}

export function ProductCard({ 
  product, 
  onClick, 
  view = 'grid', 
  variant = 'default', 
  className = '',
  accentColor,
  secondaryColor,
  primaryColor,
  surfaceColor,
  fontFamily,
  ...props 
}: ProductCardProps) {

  // Não renderiza se for uma variação
  if (product.parent_id) {
    return null;
  }

  const discountPercentage = useMemo(() => {
    if (!product.promotional_price) return 0;
    return Math.round(((product.price - product.promotional_price) / product.price) * 100);
  }, [product.price, product.promotional_price]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/api/placeholder/400/400';
    e.currentTarget.alt = 'Imagem não disponível';
  };

  // Renderização dos badges
  const renderBadges = () => (
    <>
      {/* Variable badge on the left */}
      {product.type === 'variable' && (
        <div className="absolute top-2 left-2">
          <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            {product.children?.length || 0} {(product.children?.length || 0) === 1 ? 'variação' : 'variações'}
          </div>
        </div>
      )}
      
      {/* Promotional badge on the right */}
      {product.promotional_price && (
        <div className="absolute top-2 right-2">
          <div 
            className="px-2 py-1 rounded-full text-sm font-medium shadow-sm"
            style={{ backgroundColor: accentColor, color: 'white' }}
          >
            {discountPercentage}% OFF
          </div>
        </div>
      )}
    </>
  );

  // Componente Lista
  if (view === 'list') {
    return (
      <div 
        {...props}
        onClick={onClick}
        className={`
          relative overflow-hidden rounded-lg shadow-sm hover:shadow-md 
          transition-all duration-300 cursor-pointer group
          ${className}
        `}
        style={{
          backgroundColor: surfaceColor,
          color: secondaryColor,
          fontFamily: getFontFamily(fontFamily || ''),
          borderColor: `${secondaryColor}20`
        }}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes de ${product.title}`}
      >
        <div className={`
          relative overflow-hidden flex-shrink-0
          ${variant === 'compact' ? 'w-32 h-32' : 'w-48 h-48'}
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
              <Package className="w-12 h-12" style={{ color: primaryColor }} />
            </div>
          )}
          {renderBadges()}
        </div>

        <div className="flex-1 p-6">
          <div className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: secondaryColor }}>{product.title}</h3>
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

            {product.tags && product.tags.length > 0 && (
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
            )}
          </div>
        </div>
      </div>
    );
  }

  // Componente Grid
  return (
    <div 
      {...props}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg shadow-sm hover:shadow-md 
        transition-all duration-300 cursor-pointer group w-full
        ${variant === 'minimal' ? 'border-0' : 'border'}
        ${className}
      `}
      style={{
        backgroundColor: surfaceColor,
        color: secondaryColor,
        borderColor: `${secondaryColor}20`,
        fontFamily: getFontFamily(fontFamily || '')
      }}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${product.title}`}
    >
      <div className={`
        relative overflow-hidden
        ${variant === 'minimal' ? 'aspect-[4/5]' : 
          variant === 'compact' ? 'aspect-[3/2]' : 
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
            <Package className="w-12 h-12" style={{ color: primaryColor }} />
          </div>
        )}
        {renderBadges()}
      </div>

      <div className={`
        ${variant === 'minimal' ? 'p-3' : 'p-4'}
        ${variant === 'compact' ? 'flex items-center justify-between' : 'flex flex-col'}
        ${variant === 'minimal' ? 'space-y-2' : 'space-y-3'}
        flex flex-col min-h-[120px]
      `}>
        <div className="flex-1 space-y-2">
          <h3 className={`
            font-semibold line-clamp-2
            ${variant === 'minimal' ? 'text-base' : 'text-lg'}
          `}
          style={{ color: secondaryColor }}>
            {product.title}
          </h3>
          <p className={`
            text-sm
            ${variant === 'minimal' ? 'text-center' : ''}
          `}
          style={{ color: `${secondaryColor}80` }}>
            {product.brand}
          </p>

          {variant !== 'compact' && (
            <div className={`
              prose-sm line-clamp-2
              ${variant === 'minimal' ? 'text-sm' : ''}
            `}
            style={{ color: `${secondaryColor}90` }}>
              <ReactMarkdown>{product.description}</ReactMarkdown>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full transition-all hover:scale-105"
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
                  className="text-xs px-2 py-1 rounded-full transition-all hover:scale-105"
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
        </div>

        <div className="mt-auto">
          <div className={`
            ${variant === 'minimal' ? 'text-center' : ''}
            ${variant === 'compact' ? 'text-right' : ''}
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
    </div>
  );
}