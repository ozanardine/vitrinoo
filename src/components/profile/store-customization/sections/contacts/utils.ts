import { SOCIAL_NETWORKS } from '../../../../../lib/constants';

export function validateSocialLink(type: string, value: string): boolean {
  // Regex for validation
  const REGEX_PATTERNS = {
    phone: /^\((\d{2})\)\s\d{4,5}-\d{4}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    username: /^@?[\w.-]+$/,
    website: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/
  };

  if (!value || !value.trim()) return false;
  
  const network = SOCIAL_NETWORKS[type as keyof typeof SOCIAL_NETWORKS];
  if (!network) return false;
  
  switch (network.type) {
    case 'phone':
      return REGEX_PATTERNS.phone.test(value);
    case 'email':
      return REGEX_PATTERNS.email.test(value);
    case 'username':
      return REGEX_PATTERNS.username.test(value);
    case 'url':
      return REGEX_PATTERNS.website.test(value) || value.length > 4;
    default:
      return true;
  }
}

export function getDisplayValue(link: { type: string; url: string }): string {
  const network = SOCIAL_NETWORKS[link.type as keyof typeof SOCIAL_NETWORKS];
  if (!network) return '';
  
  // Just return the formatted URL or value
  return link.url;
}