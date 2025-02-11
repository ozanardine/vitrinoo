import React from 'react';
import { generateHeaderStyles } from '../../lib/colors';

interface StoreHeaderProps {
  name: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  socialLinks: Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>;
  customization?: {
    headerStyle?: 'solid' | 'gradient' | 'image';
    headerHeight?: string;
    headerImage?: string;
    headerGradient?: string;
    logoSize?: string;
    titleSize?: string;
    descriptionSize?: string;
  };
}

export function StoreHeader({
  name,
  description,
  logoUrl,
  primaryColor,
  secondaryColor,
  socialLinks,
  customization = {}
}: StoreHeaderProps) {
  const {
    headerStyle = 'solid',
    headerHeight = '400px',
    headerImage = '',
    headerGradient = 'to bottom',
    logoSize = '160px',
    titleSize = '48px',
    descriptionSize = '18px'
  } = customization;

  // Generate base styles
  const baseStyles = generateHeaderStyles(primaryColor, secondaryColor, headerStyle, headerGradient);

  // Create separate style objects to avoid conflicts
  const headerStyles = {
    ...baseStyles,
    minHeight: headerHeight,
    ...(headerStyle === 'image' && {
      backgroundImage: `url(${headerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    })
  };

  return (
    <header 
      className="relative"
      style={headerStyles}
    >
      <div 
        className="container mx-auto px-4 py-12 flex flex-col items-center text-center relative z-10"
      >
        {logoUrl && (
          <div 
            className="mb-8 rounded-lg overflow-hidden bg-white/10 p-4 flex items-center justify-center backdrop-blur-sm"
            style={{ width: logoSize, height: logoSize }}
          >
            <img 
              src={logoUrl} 
              alt={name}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          </div>
        )}
        
        <h1 
          className="font-bold mb-4"
          style={{ fontSize: titleSize }}
        >
          {name}
        </h1>
        
        {description && (
          <p 
            className="max-w-2xl mx-auto mb-8 opacity-90"
            style={{ fontSize: descriptionSize }}
          >
            {description}
          </p>
        )}

        {socialLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {socialLinks.map((link, index) => (
              <a
                key={`${link.type}-${index}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors backdrop-blur-sm bg-white/10 hover:bg-white/20"
              >
                <span>{link.type}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}