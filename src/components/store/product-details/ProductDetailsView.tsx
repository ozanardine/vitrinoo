import { useState, useEffect } from 'react';
import { Product } from '../../../lib/types';
import { Modal } from '../../Modal';
import { ImageGallery } from './ImageGallery';
import { ProductInfo } from './ProductInfo';

interface ProductDetailsViewProps {
  product: Product;
  onClose: () => void;
  accentColor?: string;
  secondaryColor?: string;
  primaryColor?: string;
  fontFamily?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export function ProductDetailsView({ 
  product, 
  onClose,
  accentColor = '#3B82F6',
  secondaryColor = '#1F2937',
  primaryColor = '#FFFFFF',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  variant = 'default'
}: ProductDetailsViewProps) {
  const [selectedVariation, setSelectedVariation] = useState<Product | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Cores do tema
  const surfaceColor = `${secondaryColor}10`;
  const mutedTextColor = `${secondaryColor}80`;
  const borderColor = `${secondaryColor}10`;

  // Event listeners para fechar o modal
  useEffect(() => {
    const handleEscPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscPress);
    return () => {
      document.removeEventListener('keydown', handleEscPress);
    };
  }, [onClose]);

  // Handle click outside
  const handleClickOutside = (e: MouseEvent) => {
    const modalContent = document.querySelector('[data-product-modal-content]');
    if (modalContent && !modalContent.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle variation selection
  const handleVariationSelect = (attribute: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attribute]: value };
    setSelectedAttributes(newAttributes);

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
        className="relative flex flex-col lg:flex-row gap-8 p-6 rounded-xl"
        style={{ 
          backgroundColor: primaryColor,
          color: secondaryColor,
          fontFamily
        }}
        role="dialog"
        aria-label={`Detalhes do produto ${product.title}`}
      >
        <ImageGallery
          images={product.images || []}
          title={product.title}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          primaryColor={primaryColor}
          style={variant}
        />
      
        <ProductInfo
          product={product}
          selectedVariation={selectedVariation}
          onVariationSelect={handleVariationSelect}
          selectedAttributes={selectedAttributes}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          primaryColor={primaryColor}
          textColor={secondaryColor}
          mutedTextColor={mutedTextColor}
          surfaceColor={surfaceColor}
          borderColor={borderColor}
          style={variant}
        />
      </div>
    </Modal>
  );
}