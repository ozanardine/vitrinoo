import { Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Product } from '../../../lib/types';

const getUniqueAttributes = (variations: Product[]): Record<string, string[]> => {
  const attributeMap: Record<string, Set<string>> = {};

  variations.forEach(variation => {
    Object.entries(variation.attributes || {}).forEach(([key, value]) => {
      if (!attributeMap[key]) {
        attributeMap[key] = new Set();
      }
      attributeMap[key].add(value as string);
    });
  });

  return Object.entries(attributeMap).reduce((acc, [key, values]) => {
    acc[key] = Array.from(values);
    return acc;
  }, {} as Record<string, string[]>);
};

interface ProductInfoProps {
  product: Product;
  selectedVariation: Product | null;
  onVariationSelect: (attribute: string, value: string) => void;
  selectedAttributes: Record<string, string>;
  accentColor: string;
  secondaryColor: string;
  primaryColor: string;
  textColor: string;
  mutedTextColor: string;
  surfaceColor: string;
  borderColor: string;
  style?: 'default' | 'compact' | 'minimal';
}

export function ProductInfo({
  product,
  selectedVariation,
  onVariationSelect,
  selectedAttributes,
  accentColor,
  secondaryColor,
  primaryColor,
  textColor,
  mutedTextColor,
  surfaceColor,
  borderColor,
  style = 'default'
}: ProductInfoProps) {
  // Get current price and calculate discount
  const getCurrentPrice = () => {
    const currentProduct = selectedVariation || product;
    const regular = currentProduct.price || 0;
    const promotional = currentProduct.promotional_price || null;

    // Calculate discount percentage
    const discountPercentage = promotional 
      ? Math.round(((regular - promotional) / regular) * 100)
      : 0;

    return {
      regular,
      promotional,
      discountPercentage
    };
  };

  const { regular, promotional, discountPercentage } = getCurrentPrice();

  return (
    <div className={`
      w-full lg:w-1/2 space-y-6
      ${style === 'minimal' ? 'space-y-4' : ''}
      ${style === 'compact' ? 'space-y-3' : ''}
    `}>
      {/* Header with badges */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {product.type !== 'simple' && (
            <span 
              className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${style === 'minimal' ? 'text-[10px]' : ''}
                ${style === 'compact' ? 'text-[11px] px-2' : ''}
              `}
              style={{ 
                backgroundColor: `${accentColor}20`,
                color: accentColor 
              }}
            >
              {product.type === 'variable' ? 'Com Variações' : 
               product.type === 'kit' ? 'Kit/Combo' : 
               product.type === 'service' ? 'Serviço' : 'Fabricado'}
            </span>
          )}
        </div>
        <h2 className={`
          font-bold mb-3
          ${style === 'minimal' ? 'text-2xl' : ''}
          ${style === 'compact' ? 'text-xl mb-2' : 'text-3xl'}
        `}>{product.title}</h2>
        <div className="flex items-center justify-between">
          <p style={{ color: mutedTextColor }} className={`
            ${style === 'minimal' ? 'text-base' : ''}
            ${style === 'compact' ? 'text-sm' : 'text-lg'}
          `}>{product.brand}</p>
          {product.sku && (
            <p className={`
              px-3 py-1 rounded-full
              ${style === 'minimal' || style === 'compact' ? 'text-xs px-2' : 'text-sm'}
            `}
              style={{ 
                backgroundColor: `${secondaryColor}10`,
                color: mutedTextColor 
              }}
            >
              SKU: {product.sku}
            </p>
          )}
        </div>
      </div>

      {/* Price with improved design */}
      <div className={`
        rounded-2xl
        ${style === 'minimal' ? 'p-4 rounded-xl' : ''}
        ${style === 'compact' ? 'p-3 rounded-lg' : 'p-6'}
      `}
        style={{ 
          backgroundColor: surfaceColor,
          border: `1px solid ${borderColor}`
        }}
      >
        {promotional ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <p className={`
                line-through
                ${style === 'minimal' || style === 'compact' ? 'text-base' : 'text-lg'}
              `} style={{ color: mutedTextColor }}>
                R$ {regular.toFixed(2)}
              </p>
              <span className={`
                px-3 py-1 rounded-full font-medium
                ${style === 'minimal' || style === 'compact' ? 'text-xs px-2' : 'text-sm'}
              `}
                style={{ backgroundColor: accentColor, color: primaryColor }}>
                {discountPercentage}% OFF
              </span>
            </div>
            <p className={`
              font-bold
              ${style === 'minimal' ? 'text-3xl' : ''}
              ${style === 'compact' ? 'text-2xl' : 'text-4xl'}
            `} style={{ color: accentColor }}>
              R$ {promotional.toFixed(2)}
            </p>
          </div>
        ) : (
          <p className={`
            font-bold
            ${style === 'minimal' ? 'text-3xl' : ''}
            ${style === 'compact' ? 'text-2xl' : 'text-4xl'}
          `}>
            R$ {regular.toFixed(2)}
          </p>
        )}
      </div>

      {/* Description */}
      <div 
        className="prose prose-lg max-w-none max-h-80 overflow-y-auto custom-scrollbar pr-4 space-y-4" 
        style={{ 
          backgroundColor: surfaceColor,
          border: `1px solid ${borderColor}`,
          padding: '1rem',
          borderRadius: '0.75rem'
        }}
      >
        <ReactMarkdown>{product.description}</ReactMarkdown>
      </div>

      {/* Variations */}
      {product.type === 'variable' && product.children && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Variações</h3>
          <div className="space-y-4">
            {Object.entries(getUniqueAttributes(product.children)).map(([attribute, values]) => (
              <div key={attribute}>
                <label className="block text-sm font-medium mb-2">{attribute}</label>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <button
                      key={value}
                      onClick={() => onVariationSelect(attribute, value)}
                      className="px-4 py-2 rounded-lg text-sm transition-all"
                      style={{
                        backgroundColor: selectedAttributes[attribute] === value 
                          ? accentColor 
                          : `${secondaryColor}10`,
                        color: selectedAttributes[attribute] === value 
                          ? primaryColor 
                          : textColor
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 text-lg">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:scale-105"
                style={{ 
                  backgroundColor: `${secondaryColor}10`,
                  color: textColor
                }}
              >
                <Tag className="w-4 h-4" style={{ color: accentColor }} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}