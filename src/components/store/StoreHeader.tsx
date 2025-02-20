import React, { useMemo } from 'react';
import { 
  Phone, Mail, MessageCircle, Instagram, Facebook, 
  Youtube, Store as TikTok, Twitter, Link2 
} from 'lucide-react';
import { adjustColorBrightness } from '../../lib/colors';
import { generateSocialUrl } from '../../lib/constants';
import { useStoreTheme } from '../../lib/store-theme';
import { StoreHeaderCustomization } from '../../lib/types';

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

const DEFAULT_SOCIAL_SETTINGS = {
  contactsPosition: 'above' as const,
  displayFormat: 'username' as const
};

interface StoreHeaderProps {
  name: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  socialLinks: Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>;
  customization: StoreHeaderCustomization;
}

export function StoreHeader({
  name,
  description,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor,
  socialLinks,
  customization,
}: StoreHeaderProps) {
  const { theme } = useStoreTheme();

  // Gerar estilos do header
  const headerStyles = useMemo(() => {
    let backgroundColor;
    let backgroundImage;
    
    switch (customization.headerStyle) {
      case 'gradient':
        backgroundImage = `linear-gradient(${customization.headerGradient}, ${customization.headerBackground || primaryColor}, ${adjustColorBrightness(customization.headerBackground || primaryColor, -30)})`;
        break;
      case 'image':
        backgroundImage = customization.headerImage 
          ? `url(${customization.headerImage})`
          : 'none';
        backgroundColor = primaryColor;
        break;
      default: // solid
        backgroundColor = customization.headerBackground || primaryColor;
        backgroundImage = 'none';
    }

    return {
      minHeight: customization.headerHeight,
      backgroundColor,
      backgroundImage,
      backgroundSize: customization.headerStyle === 'image' ? 'cover' : undefined,
      backgroundPosition: customization.headerStyle === 'image' ? 'center' : undefined,
      backgroundRepeat: customization.headerStyle === 'image' ? 'no-repeat' : undefined,
      position: customization.headerStyle === 'image' ? 'relative' : 'static',
      transition: 'all 0.3s ease-in-out'
    } as const;
  }, [customization, primaryColor]);

  // Estilos do overlay para imagens
  const overlayStyles = useMemo(() => {
    if (customization.headerStyle !== 'image') return {};

    return {
      position: 'absolute' as const,
      inset: 0,
      backgroundColor: theme === 'dark' ? '#000000' : '#000000',
      opacity: Number(customization.headerOverlayOpacity) / 100,
      zIndex: 1,
      transition: 'opacity 0.3s ease-in-out'
    };
  }, [customization.headerStyle, customization.headerOverlayOpacity, theme]);

  // Cores do tema
  const themeColors = useMemo(() => ({
    text: secondaryColor,
    muted: `${secondaryColor}80`,
    accent: accentColor
  }), [secondaryColor, accentColor]);

  // Estilos do container de conteúdo
  const contentStyles = useMemo(() => ({
    textAlign: customization.headerAlignment as 'left' | 'center' | 'right',
    alignItems: {
      left: 'flex-start',
      center: 'center',
      right: 'flex-end'
    }[customization.headerAlignment],
    position: 'relative' as const,
    zIndex: 2,
    color: themeColors.text,
    transition: 'all 0.3s ease-in-out'
  }), [customization.headerAlignment, themeColors.text]);

  // Separar links sociais e contatos
  const { contactInfo, socialMediaLinks } = useMemo(() => ({
    contactInfo: socialLinks.filter(link => ['phone', 'email'].includes(link.type)),
    socialMediaLinks: socialLinks.filter(link => !['phone', 'email'].includes(link.type))
  }), [socialLinks]);

  // Tratamento de erro para imagens
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    img.src = '/api/placeholder/400/400';
    img.alt = 'Imagem indisponível';
  };

  // Função para obter fonte correta
  const getFontFamily = (font: string) => ({
    roboto: 'Roboto, ui-sans-serif, system-ui, sans-serif',
    'open-sans': 'Open Sans, ui-sans-serif, system-ui, sans-serif',
    lato: 'Lato, ui-sans-serif, system-ui, sans-serif',
    montserrat: 'Montserrat, ui-sans-serif, system-ui, sans-serif',
    playfair: 'Playfair Display, ui-serif, Georgia, serif',
    merriweather: 'Merriweather, ui-serif, Georgia, serif',
    'source-code-pro': 'Source Code Pro, ui-monospace, monospace',
    'fira-mono': 'Fira Mono, ui-monospace, monospace'
  }[font] || 'Roboto, ui-sans-serif, system-ui, sans-serif');

  // Renderizar informações de contato
  const renderContactInfo = () => {
    if (!contactInfo.length) return null;

    return (
      <div className="text-center mb-2">
        {contactInfo.map((link, index) => (
          <React.Fragment key={`${link.type}-${index}`}>
            {link.type === 'email' ? (
              <a 
                href={`mailto:${link.url}`}
                className="hover:underline transition-colors duration-200"
                style={{ color: themeColors.text }}
              >
                {link.url}
              </a>
            ) : (
              <span style={{ color: themeColors.text }}>
                {link.url}
              </span>
            )}
            {index < contactInfo.length - 1 && (
              <span 
                className="mx-2"
                style={{ color: themeColors.muted }}
              >
                |
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Renderizar links de redes sociais
  const renderSocialLinks = () => {
    if (!socialMediaLinks.length) return null;

    const settings = customization.socialSettings || DEFAULT_SOCIAL_SETTINGS;

    return (
      <div className="flex flex-wrap justify-center gap-4">
        {socialMediaLinks.map((link, index) => {
          const Icon = SOCIAL_ICONS[link.type as keyof typeof SOCIAL_ICONS] || Link2;
          const url = generateSocialUrl(link.type, link.url, link.countryCode);
          const displayText = settings.displayFormat === 'network' 
            ? SOCIAL_NAMES[link.type as keyof typeof SOCIAL_NAMES]
            : link.url;
          
          return (
            <a
              key={`${link.type}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full 
                transition-all duration-300 backdrop-blur-sm hover:scale-105
                hover:shadow-md"
              style={{
                backgroundColor: `${themeColors.text}15`,
                color: themeColors.text
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

  // Renderização do componente
  return (
    <header 
      className="relative transition-all duration-300"
      style={headerStyles}
      role="banner"
    >
      {/* Overlay para background com imagem */}
      {customization.headerStyle === 'image' && (
        <div 
          style={overlayStyles} 
          aria-hidden="true"
          className="transition-opacity duration-300" 
        />
      )}
      
      {/* Container principal */}
      <div 
        className="container mx-auto px-4 py-12 flex flex-col transition-all duration-300"
        style={contentStyles}
      >
        {/* Logo */}
        {customization.headerVisibility.logo && logoUrl && (
          <div 
            className="mx-auto mb-8 rounded-lg overflow-hidden bg-white/10 
              flex items-center justify-center backdrop-blur-sm 
              transition-all duration-300"
            style={{ 
              width: customization.logoSize,
              height: customization.logoSize,
              backgroundColor: `${themeColors.text}10`
            }}
          >
            <img 
              src={logoUrl} 
              alt={`${name} logo`}
              className="max-w-full max-h-full w-auto h-auto object-contain 
                transition-opacity duration-300"
              onError={handleImageError}
              loading="eager"
            />
          </div>
        )}
        
        {/* Título da Loja */}
        {customization.headerVisibility.title && (
          <h1 
            className="font-bold mb-4 transition-all duration-300"
            style={{ 
              fontSize: customization.titleSize,
              fontFamily: getFontFamily(customization.titleFont),
              color: themeColors.text
            }}
          >
            {name}
          </h1>
        )}
        
        {/* Descrição da Loja */}
        {customization.headerVisibility.description && description && (
          <p 
            className="max-w-2xl mx-auto mb-8 transition-all duration-300"
            style={{ 
              fontSize: customization.descriptionSize,
              fontFamily: getFontFamily(customization.bodyFont),
              color: themeColors.muted
            }}
          >
            {description}
          </p>
        )}

        {/* Links Sociais e Contatos */}
        {customization.headerVisibility.socialLinks && (
          <div className="flex flex-col items-center gap-4 transition-all duration-300">
            {(customization.socialSettings?.contactsPosition || DEFAULT_SOCIAL_SETTINGS.contactsPosition) === 'above' ? (
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

export default StoreHeader;