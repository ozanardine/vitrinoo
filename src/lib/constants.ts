import { Phone, Instagram, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Mail, Globe, GitBranch as BrandTiktok } from 'lucide-react';

export const SOCIAL_NETWORKS = {
  phone: {
    label: 'Telefone',
    icon: Phone,
    placeholder: '(00) 0000-0000',
    type: 'phone',
    urlTemplate: 'tel:+55'
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    placeholder: '(00) 00000-0000',
    type: 'phone',
    urlTemplate: 'https://wa.me/55'
  },
  telegram: {
    label: 'Telegram',
    icon: MessageCircle,
    placeholder: '(00) 00000-0000',
    type: 'phone',
    urlTemplate: 'https://t.me/+55'
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

type SocialNetworkKey = keyof typeof SOCIAL_NETWORKS;
type SocialNetworkType = typeof SOCIAL_NETWORKS[SocialNetworkKey];

export function generateSocialUrl(type: string, value: string): string {
  // Early return if type is not valid
  if (!Object.keys(SOCIAL_NETWORKS).includes(type)) return value;
  
  // Safe assertion since we've checked type exists in SOCIAL_NETWORKS
  const network = SOCIAL_NETWORKS[type as SocialNetworkKey] as SocialNetworkType;

  // Handle phone numbers
  if (network.type === 'phone') {
    const cleanNumber = value.replace(/\D/g, '');
    if (typeof network.urlTemplate === 'string') {
      return network.urlTemplate + cleanNumber;
    } else if (typeof network.urlTemplate === 'function') {
      return network.urlTemplate(cleanNumber);
    }
  }

  // Handle usernames
  if (network.type === 'username') {
    const username = value.startsWith('@') ? value.substring(1) : value;
    if (typeof network.urlTemplate === 'string') {
      return network.urlTemplate + username;
    } else if (typeof network.urlTemplate === 'function') {
      return network.urlTemplate(username);
    }
  }

  // Handle email and website
  if (typeof network.urlTemplate === 'string') {
    return network.urlTemplate + value;
  } else if (typeof network.urlTemplate === 'function') {
    return network.urlTemplate(value);
  }

  // Fallback
  return value;
}