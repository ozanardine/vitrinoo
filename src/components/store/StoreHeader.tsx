import React, { useMemo } from 'react';
import { 
  Phone, Mail, MessageCircle, Instagram, Facebook, 
  Youtube, Store as TikTok, Twitter, Link2 
} from 'lucide-react';
import { generateHeaderStyles } from '../../lib/colors';
import { generateSocialUrl } from '../../lib/constants';
import { useStoreTheme } from '../../lib/store-theme';
import { StoreThemeToggle } from './StoreThemeToggle';

// Cores padrão por tema
const THEME_PRESETS = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      muted: '#6b7280'
    }
  },
  dark: {
    background: '#111827',
    surface: '#1f2937',
    text: {
      primary: '#f9fafb',
      secondary: '#e5e7eb',
      muted: '#9ca3af'
    }
  }
} as const;

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
  customization: {
    headerStyle: 'solid' | 'gradient' | 'image';
    headerHeight: string;
    headerImage: string | null;
    headerGradient: string;
    headerAlignment: 'left' | 'center' | 'right';
    headerOverlayOpacity: string;
    headerVisibility: {
      logo: boolean;
      title: boolean;
      description: boolean;
      socialLinks: boolean;
    };
    logoSize: string;
    titleSize: string;
    descriptionSize: string;
    titleFont: string;
    bodyFont: string;
    socialSettings?: {
      contactsPosition: 'above' | 'below';
      displayFormat: 'username' | 'network';
    };
    allowThemeToggle?: boolean;
  };
  preview?: boolean;
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
  preview = false
}: StoreHeaderProps) {
  const { theme } = useStoreTheme();
  
  // Calcular cores baseadas no tema atual
  const themeColors = useMemo(() => {
    const baseColors = THEME_PRESETS[theme];
    return {
      background: customization.headerStyle === 'solid' ? primaryColor : baseColors.background,
      text: secondaryColor || baseColors.text.primary,
      accent: accentColor,
      muted: baseColors.text.muted,
      border: theme === 'light' ? '#e5e7eb' : '#374151'
    };
  }, [theme, primaryColor, secondaryColor, accentColor, customization.headerStyle]);

  // Gerar estilos do header
  const headerStyles = useMemo(() => {
    const baseStyles = generateHeaderStyles(
      themeColors.background,
      themeColors.text,
      customization.headerStyle,
      customization.headerGradient
    );

    return {
      ...baseStyles,
      minHeight: customization.headerHeight,
      transition: 'all 0.3s ease-in-out',
      ...(customization.headerStyle === 'image' && {
        backgroundImage: customization.headerImage ? `url(${customization.headerImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative' as const,
        backgroundRepeat: 'no-repeat'
      })
    };
  }, [customization, themeColors]);

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
    sans: 'ui-sans-serif, system-ui, sans-serif',
    serif: 'ui-serif, Georgia, serif',
    mono: 'ui-monospace, monospace'
  }[font] || 'ui-sans-serif, system-ui, sans-serif');

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
      {/* Theme Toggle */}
      {customization.allowThemeToggle && (
        <div className="absolute top-4 right-4 z-50">
          <StoreThemeToggle 
            accentColor={themeColors.accent}
            preview={true}
          />
        </div>
      )}

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

      {/* Barra de destaque opcional no topo ou base */}
      {customization.headerStyle === 'solid' && (
        <div 
          className="absolute left-0 right-0 h-1 transition-colors duration-300"
          style={{ 
            backgroundColor: themeColors.accent,
            bottom: 0
          }}
        />
      )}
    </header>
  );
}

export default React.memo(StoreHeader);
