import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
  accentColor: string;
  secondaryColor: string;
  primaryColor: string;
  style?: 'default' | 'compact' | 'minimal';
}

export function ImageGallery({
  images,
  title,
  accentColor,
  secondaryColor,
  primaryColor,
  style = 'default'
}: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image loaded state when changing images
  useEffect(() => {
    setImageLoaded(false);
  }, [currentImageIndex]);

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/api/placeholder/400/400';
    e.currentTarget.alt = 'Imagem não disponível';
  };

  // Image navigation
  const navigateImage = (direction: 'prev' | 'next') => {
    if (!images?.length) return;
    
    if (direction === 'prev') {
      setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    } else {
      setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div className={`
      w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-fit
      ${style === 'minimal' ? 'lg:w-2/3' : ''}
      ${style === 'compact' ? 'lg:w-1/3' : ''}
    `}>
      <div className={`
        relative overflow-hidden shadow-lg
        ${style === 'minimal' ? 'rounded-lg' : 'rounded-2xl'}
        ${style === 'compact' ? 'aspect-[4/3]' : 'aspect-square'}
      `}
        style={{ backgroundColor: `${secondaryColor}10` }}>
        {images && images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]}
              alt={`${title} - Imagem ${currentImageIndex + 1}`}
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
            {images.length > 1 && (
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
                  disabled={currentImageIndex === (images?.length || 0) - 1}
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
      {images && images.length > 1 && (
        <div className={`
          flex gap-3 mt-4 pb-2 overflow-x-auto custom-scrollbar
          ${style === 'minimal' ? 'gap-2' : ''}
          ${style === 'compact' ? 'mt-2 gap-1' : ''}
        `}>
          {images.map((image: string, index: number) => (
            <button
              key={`thumb-${index}`}
              onClick={() => setCurrentImageIndex(index)}
              className={`
                relative flex-shrink-0 overflow-hidden transition-all duration-300 hover:scale-105
                ${index === currentImageIndex ? 'ring-2 shadow-lg' : 'opacity-70 hover:opacity-100'}
                ${style === 'minimal' ? 'w-16 h-16 rounded-lg' : ''}
                ${style === 'compact' ? 'w-14 h-14 rounded-md' : 'w-20 h-20 rounded-xl'}
              `}
              style={{
                border: index === currentImageIndex ? `2px solid ${accentColor}` : 'none'
              }}
              aria-label={`Ver imagem ${index + 1}`}
              aria-pressed={index === currentImageIndex}
            >
              <img
                src={image}
                alt={`${title} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}