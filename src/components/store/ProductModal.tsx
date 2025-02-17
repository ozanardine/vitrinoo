import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Package, Tag, Clock, MapPin } from 'lucide-react';
import { Product } from '../../lib/types';
import ReactMarkdown from 'react-markdown';
import { Modal } from '../Modal';

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
  style = 'default'
}: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Formatação de duração memorizada
  const formattedDuration = useMemo(() => {
    if (!product.duration) return '';
    const [hours, minutes] = product.duration.split(':');
    return `${hours}h${minutes ? ` ${minutes}min` : ''}`;
  }, [product.duration]);

  // Cálculo de desconto memorizado
  const discountPercentage = useMemo(() => {
    if (!product.promotional_price) return 0;
    return Math.round(((product.price - product.promotional_price) / product.price) * 100);
  }, [product.price, product.promotional_price]);

  // Handler para erro de imagem
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/api/placeholder/400/400';
    e.currentTarget.alt = 'Imagem não disponível';
  };

  // Navegação de imagens
  const navigateImage = (direction: 'prev' | 'next') => {
    setImageLoaded(false);
    if (direction === 'prev') {
      setCurrentImageIndex(prev => Math.max(0, prev - 1));
    } else {
      setCurrentImageIndex(prev => Math.min((product.images?.length || 1) - 1, prev + 1));
    }
  };

  // Navegação por teclado
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      navigateImage('prev');
    } else if (e.key === 'ArrowRight') {
      navigateImage('next');
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title=""
      maxWidth="max-w-6xl"
      className="bg-opacity-90 backdrop-blur-sm"
    >
      <div 
        className="flex flex-col lg:flex-row gap-8"
        style={{ 
          color: secondaryColor,
          fontFamily
        }}
        onKeyDown={handleKeyNavigation}
        tabIndex={0}
        role="dialog"
        aria-label={`Detalhes do produto ${product.title}`}
      >
        {/* Galeria de Imagens */}
        <div className="w-full lg:w-1/2">
          <div className="relative aspect-square rounded-lg overflow-hidden"
            style={{ backgroundColor: `${secondaryColor}10` }}>
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]}
                  alt={`${product.title} - Imagem ${currentImageIndex + 1}`}
                  className={`
                    w-full h-full object-cover transition-opacity duration-300
                    ${imageLoaded ? 'opacity-100' : 'opacity-0'}
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
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16" style={{ color: `${secondaryColor}40` }} />
              </div>
            )}
          </div>

          {/* Miniaturas */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`
                    relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden 
                    transition-transform hover:scale-105
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

        {/* Informações do Produto */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
            <div className="flex items-center justify-between">
              <p style={{ color: `${secondaryColor}80` }}>{product.brand}</p>
              {product.sku && (
                <p className="text-sm" style={{ color: `${secondaryColor}60` }}>
                  SKU: {product.sku}
                </p>
              )}
            </div>
          </div>

          {/* Preço */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: `${secondaryColor}05` }}>
            {product.promotional_price ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="line-through" style={{ color: `${secondaryColor}60` }}>
                    R$ {product.price.toFixed(2)}
                  </p>
                  <span className="text-sm px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: accentColor, color: primaryColor }}>
                    {discountPercentage}% OFF
                  </span>
                </div>
                <p className="text-3xl font-bold" style={{ color: accentColor }}>
                  R$ {product.promotional_price.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-3xl font-bold">
                R$ {product.price.toFixed(2)}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="prose prose-sm max-w-none" style={{ color: `${secondaryColor}90` }}>
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>

          {/* Informações de Serviço */}
          {product.type === 'service' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: `${secondaryColor}60` }} />
                <span>Duração: {formattedDuration}</span>
              </div>

              {product.service_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: `${secondaryColor}60` }} />
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

          {/* Variações */}
          {product.type === 'variable' && product.variation_attributes && (
            <div className="space-y-4">
              {product.variation_attributes.map(attr => (
                <div key={attr}>
                  <h4 className="font-medium mb-2">{attr}</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.children?.map(child => {
                      const value = child.attributes?.[attr];
                      if (!value) return null;
                      const isSelected = selectedVariation?.attributes?.[attr] === value;

                      return (
                        <button
                          key={`${child.id}-${value}`}
                          onClick={() => setSelectedVariation(child)}
                          className="px-3 py-1 rounded-full text-sm transition-colors"
                          style={{ 
                            backgroundColor: isSelected ? accentColor : `${secondaryColor}10`,
                            color: isSelected ? primaryColor : secondaryColor
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
                      color: secondaryColor
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