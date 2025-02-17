import React, { useMemo } from 'react';
import { 
  Phone, Mail, MessageCircle, Instagram, Facebook, 
  Youtube, Store as TikTok, Twitter, Link2 
} from 'lucide-react';
import { generateHeaderStyles } from '../../lib/colors';
import { generateSocialUrl } from '../../lib/constants';

interface HeaderVisibility {
  logo: boolean;
  title: boolean;
  description: boolean;
  socialLinks: boolean;
}

interface SocialSettings {
  contactsPosition: 'above' | 'below';
  displayFormat: 'username' | 'network';
}

interface CustomGradient {
  colors: string[];
  direction: string;
}

interface StoreHeaderProps {
  name: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  socialLinks: Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>;
  customization: {
    headerStyle: 'solid' | 'gradient' | 'image';
    headerHeight: string;
    headerImage: string | null;
    headerGradient?: CustomGradient;
    headerAlignment: 'left' | 'center' | 'right';
    headerOverlayOpacity: string;
    headerVisibility: HeaderVisibility;
    logoSize: string;
    titleSize: string;
    descriptionSize: string;
    titleFont: string;
    bodyFont: string;
    socialSettings: SocialSettings;
  };
}

const SOCIAL_ICONS = {
  phone: Phone,
  whatsapp: MessageCircle,
  telegram: MessageCircle,
  email: Mail,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: TikTok,
  twitter: Twitter,
  website: Link2
} as const;

const SOCIAL_NAMES = {
  phone: 'Telefone',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  email: 'Email',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  twitter: 'Twitter',
  website: 'Website'
} as const;

export function StoreHeader({
  name,
  description,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor = '#3B82F6',
  socialLinks,
  customization
}: StoreHeaderProps) {
  // Memoize header styles
  const headerStyles = useMemo(() => {
    const baseStyles = generateHeaderStyles(
      primaryColor, 
      secondaryColor, 
      customization.headerStyle,
      customization.headerGradient?.direction || 'to bottom'
    );

    return {
      ...baseStyles,
      minHeight: customization.headerHeight,
      ...(customization.headerStyle === 'image' && {
        backgroundImage: `url(${customization.headerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative' as const,
        backgroundRepeat: 'no-repeat'
      })
    };
  }, [
    primaryColor,
    secondaryColor,
    customization.headerStyle,
    customization.headerGradient,
    customization.headerHeight,
    customization.headerImage
  ]);

  // Memoize overlay styles
  const overlayStyles = useMemo(() => {
    if (customization.headerStyle !== 'image') return {};

    return {
      position: 'absolute' as const,
      inset: 0,
      backgroundColor: 'black',
      opacity: Number(customization.headerOverlayOpacity) / 100,
      zIndex: 1,
      transition: 'opacity 0.3s ease-in-out'
    };
  }, [customization.headerStyle, customization.headerOverlayOpacity]);

  // Memoize content styles
  const contentStyles = useMemo(() => {
    const alignmentMap = {
      left: 'flex-start',
      center: 'center',
      right: 'flex-end'
    };

    return {
      textAlign: customization.headerAlignment as any,
      alignItems: alignmentMap[customization.headerAlignment],
      position: 'relative' as const,
      zIndex: 2,
      transition: 'all 0.3s ease-in-out'
    };
  }, [customization.headerAlignment]);

  // Filter and sort social links
  const { contactInfo, socialMediaLinks } = useMemo(() => {
    const contacts = socialLinks.filter(link => 
      link.type === 'phone' || link.type === 'email'
    );
    const socials = socialLinks.filter(link => 
      !['phone', 'email'].includes(link.type)
    );

    return {
      contactInfo: contacts,
      socialMediaLinks: socials
    };
  }, [socialLinks]);

  // Handle image loading error
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/api/placeholder/400/400';
    e.currentTarget.alt = 'Logo não disponível';
  };

  // Render contact information
  const renderContactInfo = () => {
    if (!contactInfo.length) return null;

    return (
      <div className="text-center mb-2 transition-opacity duration-300">
        {contactInfo.map((link, index) => (
          <React.Fragment key={`${link.type}-${index}`}>
            {link.type === 'email' ? (
              <a 
                href={`mailto:${link.url}`}
                className="hover:underline transition-colors duration-200"
                style={{ color: secondaryColor }}
              >
                {link.url}
              </a>
            ) : (
              <span style={{ color: secondaryColor }}>
                {link.url}
              </span>
            )}
            {index < contactInfo.length - 1 && (
              <span 
                className="mx-2"
                style={{ color: `${secondaryColor}60` }}
              >
                |
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render social media links
  const renderSocialLinks = () => {
    if (!socialMediaLinks.length) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4">
        {socialMediaLinks.map((link, index) => {
          const Icon = SOCIAL_ICONS[link.type as keyof typeof SOCIAL_ICONS] || Link2;
          const url = generateSocialUrl(link.type, link.url, link.countryCode);
          const displayText = customization.socialSettings.displayFormat === 'network' 
            ? SOCIAL_NAMES[link.type as keyof typeof SOCIAL_NAMES]
            : link.url;
          
          return (
            <a
              key={`${link.type}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 
                backdrop-blur-sm hover:scale-105"
              style={{
                backgroundColor: `${secondaryColor}20`,
                color: secondaryColor
              }}
              aria-label={`Visite nosso ${SOCIAL_NAMES[link.type as keyof typeof SOCIAL_NAMES]}`}
            >
              <Icon className="w-5 h-5" />
              <span>{displayText}</span>
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <header 
      className="relative transition-all duration-300"
      style={headerStyles}
      role="banner"
    >
      {/* Overlay for image background */}
      {customization.headerStyle === 'image' && (
        <div style={overlayStyles} aria-hidden="true" />
      )}
      
      {/* Main content container */}
      <div 
        className="container mx-auto px-4 py-12 flex flex-col transition-all duration-300"
        style={contentStyles}
      >
        {/* Logo */}
        {customization.headerVisibility.logo && logoUrl && (
          <div 
            className="mb-8 rounded-lg overflow-hidden backdrop-blur-sm 
              flex items-center justify-center transition-all duration-300"
            style={{ 
              width: customization.logoSize,
              height: customization.logoSize,
              backgroundColor: `${secondaryColor}10`
            }}
          >
            <img 
              src={logoUrl} 
              alt={`${name} logo`}
              className="max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-300"
              onError={handleLogoError}
              loading="eager"
            />
          </div>
        )}
        
        {/* Store Title */}
        {customization.headerVisibility.title && (
          <h1 
            className="font-bold mb-4 transition-all duration-300"
            style={{ 
              fontSize: customization.titleSize,
              fontFamily: customization.titleFont === 'sans' 
                ? 'ui-sans-serif, system-ui, sans-serif'
                : customization.titleFont === 'serif' 
                ? 'ui-serif, Georgia, serif'
                : 'ui-monospace, monospace',
              color: secondaryColor
            }}
          >
            {name}
          </h1>
        )}
        
        {/* Store Description */}
        {customization.headerVisibility.description && description && (
          <p 
            className="max-w-2xl mx-auto mb-8 transition-all duration-300"
            style={{ 
              fontSize: customization.descriptionSize,
              fontFamily: customization.bodyFont === 'sans'
                ? 'ui-sans-serif, system-ui, sans-serif'
                : customization.bodyFont === 'serif'
                ? 'ui-serif, Georgia, serif'
                : 'ui-monospace, monospace',
              color: `${secondaryColor}90`
            }}
          >
            {description}
          </p>
        )}

        {/* Social Links */}
        {customization.headerVisibility.socialLinks && (
          <div className="flex flex-col items-center gap-4 transition-all duration-300">
            {customization.socialSettings.contactsPosition === 'above' ? (
              <>
                {renderContactInfo()}
                {renderSocialLinks()}
              </>
            ) : (
              <>
                {renderSocialLinks()}
                {renderContactInfo()}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}