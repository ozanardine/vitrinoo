import { Phone, Instagram, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Mail, Globe, GitBranch as BrandTiktok } from 'lucide-react';

export const SOCIAL_NETWORKS = {
  phone: {
    label: 'Telefone',
    icon: Phone,
    placeholder: 'Número de telefone',
    type: 'phone',
    urlTemplate: 'tel:+'
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    placeholder: 'Número do WhatsApp',
    type: 'phone',
    urlTemplate: 'https://wa.me/'
  },
  telegram: {
    label: 'Telegram',
    icon: MessageCircle,
    placeholder: '@usuario ou número',
    type: 'mixed',
    urlTemplate: (value: string) => value.startsWith('@') ? 
      `https://t.me/${value.substring(1)}` : 
      `https://t.me/+${value.replace(/\D/g, '')}`
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    placeholder: '@seuinstagram',
    type: 'username',
    urlTemplate: 'https://instagram.com/'
  },
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    placeholder: '@suapagina',
    type: 'username',
    urlTemplate: 'https://facebook.com/'
  },
  twitter: {
    label: 'Twitter',
    icon: Twitter,
    placeholder: '@seutwitter',
    type: 'username',
    urlTemplate: 'https://twitter.com/'
  },
  youtube: {
    label: 'YouTube',
    icon: Youtube,
    placeholder: '@seucanal',
    type: 'username',
    urlTemplate: 'https://youtube.com/@'
  },
  tiktok: {
    label: 'TikTok',
    icon: BrandTiktok,
    placeholder: '@seutiktok',
    type: 'username',
    urlTemplate: 'https://tiktok.com/@'
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: '@seuperfil',
    type: 'username',
    urlTemplate: 'https://linkedin.com/in/'
  },
  email: {
    label: 'Email',
    icon: Mail,
    placeholder: 'seuemail@exemplo.com',
    type: 'email',
    urlTemplate: 'mailto:'
  },
  website: {
    label: 'Website',
    icon: Globe,
    placeholder: 'seusite.com',
    type: 'url',
    urlTemplate: (url: string) => url.startsWith('http') ? url : `https://${url}`
  }
} as const;

export function generateSocialUrl(type: string, value: string, countryCode?: string): string {
  const network = SOCIAL_NETWORKS[type as keyof typeof SOCIAL_NETWORKS];
  
  if (!network) return value;

  // Handle phone numbers
  if (network.type === 'phone') {
    const cleanNumber = value.replace(/\D/g, '');
    return typeof network.urlTemplate === 'string' ? 
      network.urlTemplate + cleanNumber :
      network.urlTemplate(cleanNumber);
  }

  // Handle usernames
  if (network.type === 'username') {
    const username = value.startsWith('@') ? value.substring(1) : value;
    return typeof network.urlTemplate === 'string' ? 
      network.urlTemplate + username :
      network.urlTemplate(username);
  }

  // Handle mixed (Telegram)
  if (network.type === 'mixed') {
    return typeof network.urlTemplate === 'string' ? 
      network.urlTemplate + value :
      network.urlTemplate(value);
  }

  // Handle email and website
  return typeof network.urlTemplate === 'string' ? 
    network.urlTemplate + value :
    network.urlTemplate(value);
}