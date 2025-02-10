import React from 'react';
import { SOCIAL_NETWORKS } from '../../lib/constants';
import { parsePhoneNumber } from '../../lib/countries';

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
}

export function StoreHeader({ 
  name, 
  description, 
  logoUrl, 
  primaryColor, 
  secondaryColor,
  socialLinks 
}: StoreHeaderProps) {
  const getSocialLink = (type: string, url: string, countryCode?: string) => {
    switch (type) {
      case 'whatsapp': {
        const parsed = parsePhoneNumber(url);
        if (parsed) {
          return `https://wa.me/${parsed.countryCode}${parsed.number}`;
        }
        return `https://wa.me/${url.replace(/\D/g, '')}`;
      }
      case 'telegram': {
        if (url.startsWith('@')) {
          return `https://t.me/${url.substring(1)}`;
        }
        const parsed = parsePhoneNumber(url);
        if (parsed) {
          return `https://t.me/+${parsed.countryCode}${parsed.number}`;
        }
        return `https://t.me/${url}`;
      }
      case 'email':
        return `mailto:${url}`;
      case 'phone':
        return `tel:${url.replace(/\D/g, '')}`;
      default:
        return url.startsWith('http') ? url : `https://${url}`;
    }
  };

  // Separar links de telefone dos outros links sociais
  const phoneLinks = socialLinks.filter(link => link.type === 'phone');
  const otherLinks = socialLinks.filter(link => link.type !== 'phone');

  return (
    <header 
      className="relative bg-gradient-to-b from-gray-900/50 to-transparent"
      style={{
        backgroundColor: primaryColor,
        color: secondaryColor
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center relative z-10">
          {logoUrl && (
            <div className="mb-6 w-40 h-40 rounded-lg overflow-hidden bg-white/10 p-4 flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt={name}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>
          )}
          
          <h1 className="text-4xl font-bold mb-4 text-shadow">{name}</h1>
          
          {description && (
            <p className="max-w-2xl mx-auto mb-6 text-lg opacity-90 text-shadow">
              {description}
            </p>
          )}

          {phoneLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {phoneLinks.map((link, index) => {
                const network = SOCIAL_NETWORKS[link.type];
                const Icon = network.icon;
                return (
                  <div
                    key={`phone-${index}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{link.url}</span>
                  </div>
                );
              })}
            </div>
          )}

          {otherLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4">
              {otherLinks.map((link, index) => {
                const network = SOCIAL_NETWORKS[link.type];
                if (!network) return null;

                const Icon = network.icon;
                const href = getSocialLink(link.type, link.url, link.countryCode);

                return (
                  <a
                    key={`social-${index}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                    style={{ color: secondaryColor }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{network.label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}