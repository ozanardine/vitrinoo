import { Globe, Instagram, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Mail, GitBranch as BrandTiktok, Phone } from 'lucide-react';

export const SOCIAL_NETWORKS = {
  phone: {
    label: 'Telefone',
    icon: Phone,
    placeholder: 'Número de telefone'
  },
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    placeholder: '@seuinstagram'
  },
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    placeholder: '@suapagina'
  },
  twitter: {
    label: 'Twitter',
    icon: Twitter,
    placeholder: '@seutwitter'
  },
  youtube: {
    label: 'YouTube',
    icon: Youtube,
    placeholder: '@seucanal'
  },
  tiktok: {
    label: 'TikTok',
    icon: BrandTiktok,
    placeholder: '@seutiktok'
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: '@seuperfil'
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    placeholder: 'Número do WhatsApp'
  },
  telegram: {
    label: 'Telegram',
    icon: MessageCircle,
    placeholder: '@usuario ou número'
  },
  email: {
    label: 'Email',
    icon: Mail,
    placeholder: 'seuemail@exemplo.com'
  },
  website: {
    label: 'Website',
    icon: Globe,
    placeholder: 'seusite.com'
  }
} as const;