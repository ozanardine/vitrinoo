import React, { useState, useEffect } from 'react';
import {ChevronLeft, ChevronRight, Package, Tag, Clock, MapPin } from 'lucide-react';
import { Product } from '../../lib/types';
import ReactMarkdown from 'react-markdown';
import { Modal } from '../Modal';
import { calculateTextColor } from '../../lib/colors';

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
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Reset image loaded state when changing images
  useEffect(() => {
    setImageLoaded(false);
  }, [currentImageIndex]);

  // Calculate text colors for better contrast
  const textColor = calculateTextColor(primaryColor) === 'light' ? '#FFFFFF' : secondaryColor;
  const mutedTextColor = calculateTextColor(primaryColor) === 'light' 
    ? 'rgba(255, 255, 255, 0.7)' 
    : `${secondaryColor}80`;

  // Calculate discount percentage
  const discountPercentage = product.promotional_price
    ? Math.round(((product.price - product.promotional_price) / product.price) * 100)
    : 0;

  // Format duration for services
  const formatDuration = (duration: string) => {
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
        regular: selectedVariation.price,
        promotional: selectedVariation.promotional_price
      };
    }
    return {
      regular: product.price,
      promotional: product.promotional_price
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
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2">
          <div className="relative aspect-square rounded-lg overflow-hidden"
            style={{ backgroundColor: `${secondaryColor}10` }}>
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]}
                  alt={`${product.title} - Imagem ${currentImageIndex + 1}`}
                  className={`
                    w-full h-full object-cover transition-all duration-300
                    ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                  `}
                  onError={handleImageError}
                  onLoad={() => setImageLoaded(true)}
                  loading="lazy"
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
                      style={{ borderColor: `${accentColor}40`, borderTopColor: 'transparent' }}
                    />
                  </div>
                )}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                      style={{ 
                        backgroundColor: `${primaryColor}80`,
                        color: secondaryColor
                      }}
                      disabled={currentImageIndex === product.images.length - 1}
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
                {product.promotional_price && (
                  <div 
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ backgroundColor: accentColor, color: primaryColor }}
                  >
                    {discountPercentage}% OFF
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16" style={{ color: `${secondaryColor}40` }} />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`
                    relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden 
                    transition-all duration-300 hover:scale-105
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

        {/* Product Details */}
        <div className="w-full lg:w-1/2 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
            <div className="flex items-center justify-between">
              <p style={{ color: mutedTextColor }}>{product.brand}</p>
              {product.sku && (
                <p className="text-sm" style={{ color: mutedTextColor }}>
                  SKU: {product.sku}
                </p>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: `${secondaryColor}05` }}>
            {getCurrentPrice().promotional ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="line-through" style={{ color: mutedTextColor }}>
                    R$ {getCurrentPrice().regular.toFixed(2)}
                  </p>
                  <span className="text-sm px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: accentColor, color: primaryColor }}>
                    {discountPercentage}% OFF
                  </span>
                </div>
                <p className="text-3xl font-bold" style={{ color: accentColor }}>
                  R$ {getCurrentPrice().promotional.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-3xl font-bold">
                R$ {getCurrentPrice().regular.toFixed(2)}
              </p>
            )}
          </div>

          {/* Variations */}
          {product.type === 'variable' && product.variation_attributes && (
            <div className="space-y-4">
              {product.variation_attributes.map(attr => (
                <div key={attr}>
                  <h4 className="font-medium mb-2">{attr}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(
                      product.children?.map(child => child.attributes?.[attr])
                    )).map(value => {
                      if (!value) return null;
                      const isSelected = selectedAttributes[attr] === value;

                      return (
                        <button
                          key={value}
                          onClick={() => handleVariationSelect(attr, value)}
                          className={`
                            px-4 py-2 rounded-lg transition-all duration-200
                            ${isSelected ? 'scale-105' : 'hover:scale-105'}
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

          {/* Description */}
          <div 
            className="prose prose-sm max-w-none max-h-60 overflow-y-auto custom-scrollbar pr-4" 
            style={{ color: mutedTextColor }}
          >
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>

          {/* Service Information */}
          {product.type === 'service' && (
            <div className="space-y-4">
              {product.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: mutedTextColor }} />
                  <span>Duração: {formatDuration(product.duration)}</span>
                </div>
              )}

              {product.service_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: mutedTextColor }} />
                  <span>{product.service_location}</span>
                </div>
              )}

              {product.availability && (
                <div className="space-y-4">
                  <h4 className="font-medium">Disponibilidade</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Dias</h5>
                      <div className="flex flex-wrap gap-1">
                        {product.availability.weekdays.map(day => (
                          <span 
                            key={day} 
                            className="px-2 py-1 rounded text-sm"
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
                      <h5 className="text-sm font-medium mb-2">Horários</h5>
                      <div className="space-y-1">
                        {product.availability.hours.map((hour, index) => (
                          <div key={index} className="text-sm">
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

          {/* Tags */}
          {product.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                    style={{ 
                      backgroundColor: `${secondaryColor}10`,
                      color: textColor
                    }}
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