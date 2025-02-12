import { SOCIAL_NETWORKS } from '../../../../../lib/constants';
import { countries, validatePhoneNumber, getPhoneNumberDisplay } from '../../../../../lib/countries';

export function validateSocialLink(type: string, value: string, countryCode?: string): boolean {
  const network = SOCIAL_NETWORKS[type as keyof typeof SOCIAL_NETWORKS];
  if (!network) return false;

  switch (network.type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(value) ||
             /^https?:\/\//.test(value);
    case 'username':
      return /^@?[a-zA-Z0-9._-]+$/.test(value);
    case 'phone': {
      const country = countries.find(c => c.code === countryCode);
      if (!country) return false;
      return validatePhoneNumber(value, country);
    }
    case 'mixed':
      return /^@[a-zA-Z0-9._-]+$/.test(value) || 
             (/^\+\d{1,3}[\s-]?\d{1,14}$/.test(value) && value.replace(/\D/g, '').length >= 8);
    default:
      return true;
  }
}

export function getDisplayValue(link: { type: string; url: string; countryCode?: string }): string {
  const network = SOCIAL_NETWORKS[link.type as keyof typeof SOCIAL_NETWORKS];
  if (!network) return '';

  if (network.type === 'phone') {
    const country = countries.find(c => c.code === link.countryCode);
    if (country) {
      return getPhoneNumberDisplay(link.url, country);
    }
  }

  return link.url;
}