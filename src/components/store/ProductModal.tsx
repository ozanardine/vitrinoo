import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Package, Tag, Clock, MapPin } from 'lucide-react';
import { Product } from '../../lib/types';
import ReactMarkdown from 'react-markdown';
import { Modal } from '../Modal';

// Styles para o scrollbar customizado
const getScrollbarStyles = (accentColor: string, secondaryColor: string) => `
  [data-product-modal-content] ::-webkit-scrollbar,
  [data-product-modal-content] *::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  [data-product-modal-content] ::-webkit-scrollbar-track,
  [data-product-modal-content] *::-webkit-scrollbar-track {
    background: ${secondaryColor}10;
    border-radius: 5px;
  }

  [data-product-modal-content] ::-webkit-scrollbar-thumb,
  [data-product-modal-content] *::-webkit-scrollbar-thumb {
    background-color: ${accentColor}40;
    border-radius: 5px;
    transition: all 0.3s ease;
  }

  [data-product-modal-content] ::-webkit-scrollbar-thumb:hover,
  [data-product-modal-content] *::-webkit-scrollbar-thumb:hover {
    background-color: ${accentColor}60;
  }
`;

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  accentColor?: string;
  secondaryColor?: string;
  primaryColor?: string;
  fontFamily?: string;
  style?: 'default' | 'compact' | 'minimal';
}

export function ProductModal({ 
  product, 
  onClose,
  accentColor = '#3B82F6',
  secondaryColor = '#1F2937',
  primaryColor = '#FFFFFF',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
}: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<Product | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Calculate text colors for better contrast
  const textColor = calculateTextColor(primaryColor) === 'light' ? '#FFFFFF' : secondaryColor;
  const mutedTextColor = calculateTextColor(primaryColor) === 'light' 
    ? 'rgba(255, 255, 255, 0.7)' 
    : `${secondaryColor}80`;
  const surfaceColor = `${secondaryColor}05`;
  const borderColor = `${secondaryColor}10`;

  // Reset image loaded state when changing images
  useEffect(() => {
    setImageLoaded(false);
  }, [currentImageIndex]);

  // Inject scrollbar styles
  useEffect(() => {
    const styleId = 'product-modal-scrollbar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = getScrollbarStyles(accentColor, secondaryColor);
      document.head.appendChild(style);
    }

    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [accentColor, secondaryColor]);

  // Inject scrollbar and prose styles
  useEffect(() => {
    const styleId = 'product-modal-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        ${getScrollbarStyles(accentColor, secondaryColor)}
        [data-product-modal-content] .prose {
          --tw-prose-body: ${mutedTextColor};
          --tw-prose-headings: ${textColor};
          --tw-prose-bold: ${textColor};
          --tw-prose-links: ${accentColor};
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [accentColor, secondaryColor, textColor, mutedTextColor]);

  // Calculate discount percentage
  const discountPercentage = product.promotional_price
    ? Math.round(((product.price - product.promotional_price) / product.price) * 100)
    : 0;

  // Format duration for services
  const formatDuration = (duration: string) => {
    if (!duration) return '';
    const [hours, minutes] = duration.split(':');
    return `${hours}h${minutes ? ` ${minutes}min` : ''}`;
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/api/placeholder/400/400';
    e.currentTarget.alt = 'Imagem não disponível';
  };

  // Image navigation
  const navigateImage = (direction: 'prev' | 'next') => {
    if (!product.images?.length) return;
    
    if (direction === 'prev') {
      setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : product.images!.length - 1));
    } else {
      setCurrentImageIndex(prev => (prev < product.images!.length - 1 ? prev + 1 : 0));
    }
  };

  // Keyboard navigation
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      navigateImage('prev');
    } else if (e.key === 'ArrowRight') {
      navigateImage('next');
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle variation selection
  const handleVariationSelect = (attribute: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attribute]: value };
    setSelectedAttributes(newAttributes);

    // Find matching variation
    if (product.children) {
      const variation = product.children.find(child => 
        Object.entries(child.attributes || {}).every(([key, val]) => 
          newAttributes[key] === val
        )
      );

      if (variation) {
        setSelectedVariation(variation);
      }
    }
  };

  // Get current price
  const getCurrentPrice = () => {
    if (selectedVariation) {
      return {
        regular: selectedVariation.price || 0,
        promotional: selectedVariation.promotional_price || null
      };
    }
    return {
      regular: product.price || 0,
      promotional: product.promotional_price || null
    };
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title=""
      maxWidth="max-w-6xl"
      style={{ backgroundColor: primaryColor }}
    >
      <div 
        data-product-modal-content
        className="flex flex-col lg:flex-row gap-8"
        style={{ 
          color: textColor,
          fontFamily
        }}
        onKeyDown={handleKeyNavigation}
        tabIndex={0}
        role="dialog"
        aria-label={`Detalhes do produto ${product.title}`}
      >
        {/* Image Gallery - Lado Esquerdo */}
        <div className="w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-fit">
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg"
            style={{ backgroundColor: `${secondaryColor}10` }}>
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]}
                  alt={`${product.title} - Imagem ${currentImageIndex + 1}`}
                  className={`
                    w-full h-full object-cover transition-all duration-500
                    ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                  `}
                  onError={handleImageError}
                  onLoad={() => setImageLoaded(true)}
                  loading="lazy"
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
                      style={{ borderColor: `${accentColor}40` }}
                    />
                  </div>
                )}
                {/* Controles de navegação com hover effect */}
                {product.images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => navigateImage('prev')}
                      className="p-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                      style={{ 
                        backgroundColor: `${primaryColor}80`,
                        color: secondaryColor
                      }}
                      disabled={currentImageIndex === 0}
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="p-3 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                      style={{ 
                        backgroundColor: `${primaryColor}80`,
                        color: secondaryColor
                      }}
                      disabled={currentImageIndex === (product.images?.length || 0) - 1}
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20" style={{ color: `${secondaryColor}40` }} />
              </div>
            )}
          </div>

          {/* Thumbnails aprimoradas */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 mt-4 pb-2 overflow-x-auto custom-scrollbar">
              {product.images.map((image: string, index: number) => (
                <button
                  key={`thumb-${index}`}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`
                    relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden 
                    transition-all duration-300 hover:scale-105
                    ${index === currentImageIndex ? 'ring-2 shadow-lg' : 'opacity-70 hover:opacity-100'}
                  `}
                  style={{
                    border: index === currentImageIndex ? `2px solid ${accentColor}` : 'none'
                  }}
                  aria-label={`Ver imagem ${index + 1}`}
                  aria-pressed={index === currentImageIndex}
                >
                  <img
                    src={image}
                    alt={`${product.title} - Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details - Lado Direito */}
        <div className="w-full lg:w-1/2 space-y-6">
          {/* Header com badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.type !== 'simple' && (
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium"
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
            <h2 className="text-3xl font-bold mb-3">{product.title}</h2>
            <div className="flex items-center justify-between">
              <p style={{ color: mutedTextColor }} className="text-lg">{product.brand}</p>
              {product.sku && (
                <p className="text-sm px-3 py-1 rounded-full" 
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

          {/* Preço com design melhorado */}
          <div className="p-6 rounded-2xl" 
            style={{ 
              backgroundColor: surfaceColor,
              border: `1px solid ${borderColor}`
            }}
          >
            {getCurrentPrice().promotional ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <p className="text-lg line-through" style={{ color: mutedTextColor }}>
                    R$ {getCurrentPrice().regular.toFixed(2)}
                  </p>
                  <span className="text-sm px-3 py-1 rounded-full font-medium"
                    style={{ backgroundColor: accentColor, color: primaryColor }}>
                    {discountPercentage}% OFF
                  </span>
                </div>
                <p className="text-4xl font-bold" style={{ color: accentColor }}>
                  R$ {getCurrentPrice().promotional?.toFixed(2) || '0.00'}
                </p>
              </div>
            ) : (
              <p className="text-4xl font-bold">
                R$ {getCurrentPrice().regular.toFixed(2)}
              </p>
            )}
          </div>

          {/* Variações com design aprimorado */}
          {product.type === 'variable' && product.variation_attributes && (
            <div className="space-y-6">
              {product.variation_attributes.map((attr: string) => (
                <div key={attr}>
                  <h4 className="font-medium mb-3 text-lg">{attr}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(
                      product.children?.map(child => child.attributes?.[attr])
                    )).map((value: string) => {
                      if (!value) return null;
                      const isSelected = selectedAttributes[attr] === value;

                      return (
                        <button
                          key={`${attr}-${value}`}
                          onClick={() => handleVariationSelect(attr, value)}
                          className={`
                            px-4 py-2 rounded-lg transition-all duration-300
                            ${isSelected ? 'shadow-lg' : 'hover:shadow'}
                          `}
                          style={{ 
                            backgroundColor: isSelected ? accentColor : `${secondaryColor}10`,
                            color: isSelected ? primaryColor : textColor,
                            transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                          }}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Descrição com scrollbar personalizado */}
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

          {/* Informações de Serviço */}
          {product.type === 'service' && (
            <div className="space-y-6 p-6 rounded-2xl" style={{ backgroundColor: `${secondaryColor}05` }}>
              {product.duration && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full" style={{ backgroundColor: `${accentColor}20` }}>
                    <Clock className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <span className="text-lg">Duração: {formatDuration(product.duration)}</span>
                </div>
              )}

              {product.service_location && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full" style={{ backgroundColor: `${accentColor}20` }}>
                    <MapPin className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <span className="text-lg">{product.service_location}</span>
                </div>
              )}

              {product.availability && (
                <div className="space-y-4 mt-6">
                  <h4 className="font-medium text-lg">Disponibilidade</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium mb-3">Dias</h5>
                      <div className="flex flex-wrap gap-2">
                        {product.availability.weekdays.map((day: string) => (
                          <span 
                            key={day} 
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ 
                              backgroundColor: `${accentColor}20`,
                              color: accentColor
                            }}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-3">Horários</h5>
                      <div className="space-y-2">
                        {product.availability.hours.map((hour: { start: string; end: string }, index: number) => (
                          <div 
                            key={`hour-${index}`}
                            className="text-sm px-3 py-2 rounded-lg"
                            style={{ backgroundColor: `${secondaryColor}10` }}
                          >
                            {hour.start} - {hour.end}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tags com design moderno */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-lg">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string) => (
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
      </div>
    </Modal>
  );
}

// Helper function to calculate text color based on background
function calculateTextColor(backgroundColor: string): 'light' | 'dark' {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'dark' : 'light';
}