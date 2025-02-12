import React from 'react';
import { 
  Phone, Mail, MessageCircle, Instagram, Facebook, 
  Youtube, Store as TikTok, Twitter, Link2 
} from 'lucide-react';
import { generateHeaderStyles } from '../../lib/colors';
import { generateSocialUrl } from '../../lib/constants';

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
    headerAlignment?: 'left' | 'center' | 'right';
    headerOverlayOpacity?: string;
    headerVisibility?: {
      logo?: boolean;
      title?: boolean;
      description?: boolean;
      socialLinks?: boolean;
    };
    logoSize?: string;
    titleSize?: string;
    descriptionSize?: string;
    titleFont?: string;
    bodyFont?: string;
    socialSettings?: {
      contactsPosition: 'above' | 'below';
      displayFormat: 'username' | 'network';
    };
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
};

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
};

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
    headerAlignment = 'center',
    headerOverlayOpacity = '50',
    headerVisibility = {
      logo: true,
      title: true,
      description: true,
      socialLinks: true
    },
    logoSize = '160px',
    titleSize = '48px',
    descriptionSize = '18px',
    titleFont = 'sans',
    bodyFont = 'sans',
    socialSettings = {
      contactsPosition: 'above',
      displayFormat: 'username'
    }
  } = customization;

  // Generate base styles
  const baseStyles = generateHeaderStyles(primaryColor, secondaryColor, headerStyle, headerGradient);

  // Create header styles
  const headerStyles = {
    ...baseStyles,
    minHeight: headerHeight,
    ...(headerStyle === 'image' && {
      backgroundImage: `url(${headerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative' as const
    })
  };

  // Create overlay styles for image background
  const overlayStyles = headerStyle === 'image' ? {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: 'black',
    opacity: Number(headerOverlayOpacity) / 100,
    zIndex: 1
  } : {};

  // Create content styles
  const contentStyles = {
    textAlign: headerAlignment as any,
    ...(headerAlignment === 'left' ? { alignItems: 'flex-start' } : 
       headerAlignment === 'right' ? { alignItems: 'flex-end' } : 
       { alignItems: 'center' }),
    position: 'relative' as const,
    zIndex: 2
  };

  // Separate contact info from social links
  const contactInfo = socialLinks.filter(link => link.type === 'phone' || link.type === 'email');
  const socialMediaLinks = socialLinks.filter(link => !['phone', 'email'].includes(link.type));

  const renderContactInfo = () => (
    contactInfo.length > 0 && (
      <div className="text-center mb-2">
        {contactInfo.map((link, index) => (
          <React.Fragment key={`${link.type}-${index}`}>
            {link.type === 'email' ? (
              <a 
                href={`mailto:${link.url}`}
                className="hover:underline"
              >
                {link.url}
              </a>
            ) : (
              <span>{link.url}</span>
            )}
            {index < contactInfo.length - 1 && (
              <span className="mx-2">|</span>
            )}
          </React.Fragment>
        ))}
      </div>
    )
  );

  const renderSocialLinks = () => (
    socialMediaLinks.length > 0 && (
      <div className="flex flex-wrap justify-center gap-4">
        {socialMediaLinks.map((link, index) => {
          const Icon = SOCIAL_ICONS[link.type as keyof typeof SOCIAL_ICONS] || Link2;
          const url = generateSocialUrl(link.type, link.url, link.countryCode);
          const displayText = socialSettings.displayFormat === 'network' 
            ? SOCIAL_NAMES[link.type as keyof typeof SOCIAL_NAMES]
            : link.url;
          
          return (
            <a
              key={`${link.type}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors backdrop-blur-sm bg-white/10 hover:bg-white/20"
            >
              <Icon className="w-5 h-5" />
              <span>{displayText}</span>
            </a>
          );
        })}
      </div>
    )
  );

  return (
    <header className="relative" style={headerStyles}>
      {headerStyle === 'image' && <div style={overlayStyles} />}
      
      <div 
        className="container mx-auto px-4 py-12 flex flex-col"
        style={contentStyles}
      >
        {headerVisibility.logo && logoUrl && (
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
        
        {headerVisibility.title && (
          <h1 
            className="font-bold mb-4"
            style={{ 
              fontSize: titleSize,
              fontFamily: titleFont === 'sans' ? 'ui-sans-serif, system-ui, sans-serif' :
                         titleFont === 'serif' ? 'ui-serif, Georgia, serif' :
                         'ui-monospace, monospace'
            }}
          >
            {name}
          </h1>
        )}
        
        {headerVisibility.description && description && (
          <p 
            className="max-w-2xl mx-auto mb-8 opacity-90"
            style={{ 
              fontSize: descriptionSize,
              fontFamily: bodyFont === 'sans' ? 'ui-sans-serif, system-ui, sans-serif' :
                         bodyFont === 'serif' ? 'ui-serif, Georgia, serif' :
                         'ui-monospace, monospace'
            }}
          >
            {description}
          </p>
        )}

        {headerVisibility.socialLinks && (
          <div className="flex flex-col items-center gap-4">
            {socialSettings.contactsPosition === 'above' ? (
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