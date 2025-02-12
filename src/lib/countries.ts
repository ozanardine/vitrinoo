import { Phone, Instagram, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Mail, Globe, GitBranch as BrandTiktok } from 'lucide-react';

// List of countries with calling codes
export interface Country {
  name: string;
  code: string;
  dialCode: string;
  format: string;
  priority?: number;
}

// Default countries list
export const defaultCountries: Country[] = [
  {
    name: 'Brasil',
    code: 'BR',
    dialCode: '55',
    format: '+## (##) #####-####',
    priority: 1
  },
  {
    name: 'Portugal',
    code: 'PT',
    dialCode: '351',
    format: '+### ### ### ###'
  },
  {
    name: 'Estados Unidos',
    code: 'US',
    dialCode: '1',
    format: '+# (###) ###-####'
  },
  {
    name: 'Argentina',
    code: 'AR',
    dialCode: '54',
    format: '+## (##) ####-####'
  },
  {
    name: 'Chile',
    code: 'CL',
    dialCode: '56',
    format: '+## # #### ####'
  },
  {
    name: 'Colômbia',
    code: 'CO',
    dialCode: '57',
    format: '+## ### ### ####'
  },
  {
    name: 'México',
    code: 'MX',
    dialCode: '52',
    format: '+## (##) #### ####'
  },
  {
    name: 'Peru',
    code: 'PE',
    dialCode: '51',
    format: '+## ### ### ###'
  },
  {
    name: 'Uruguai',
    code: 'UY',
    dialCode: '598',
    format: '+### #### ####'
  },
  {
    name: 'Paraguai',
    code: 'PY',
    dialCode: '595',
    format: '+### (###) ### ###'
  }
].sort((a, b) => {
  if (a.priority && !b.priority) return -1;
  if (!a.priority && b.priority) return 1;
  return a.name.localeCompare(b.name);
});

// Export countries as the default list initially
export const countries = [...defaultCountries];

// Fetch countries from REST Countries API
export async function fetchCountries(): Promise<Country[]> {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,idd');
    const data = await response.json();
    
    const fetchedCountries = data
      .filter((country: any) => country.idd.root && country.idd.suffixes)
      .map((country: any) => ({
        name: country.name.common,
        code: country.cca2,
        dialCode: country.idd.root.replace('+', '') + country.idd.suffixes[0],
        format: `+${country.idd.root.replace('+', '')}${country.idd.suffixes[0]} ### ### ###`,
        priority: country.cca2 === 'BR' ? 1 : undefined
      }))
      .sort((a: Country, b: Country) => {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        return a.name.localeCompare(b.name);
      });

    // Update the countries array with fetched data
    countries.length = 0;
    countries.push(...fetchedCountries);
    
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return defaultCountries;
  }
}

export function formatPhoneNumber(value: string, country: Country): string {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, '');
  
  // Se não tiver números, retorna vazio
  if (!numbers) return '';

  // Aplica a máscara do país
  let format = country.format;
  let result = '';
  let numberIndex = 0;

  // Para cada caractere no formato
  for (let i = 0; i < format.length && numberIndex < numbers.length; i++) {
    if (format[i] === '#') {
      result += numbers[numberIndex];
      numberIndex++;
    } else {
      result += format[i];
      // Se ainda tiver números, adiciona o próximo separador
      if (numberIndex < numbers.length) {
        format = format.substring(0, i + 1) + format.substring(i + 1);
      }
    }
  }

  return result;
}

export function validatePhoneNumber(value: string, country: Country): boolean {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, '');
  
  // Verifica se tem o número mínimo de dígitos para o país
  const minLength = country.format.split('#').length - 1;
  const maxLength = minLength + 2; // Permite até 2 dígitos extras para flexibilidade
  
  return numbers.length >= minLength && numbers.length <= maxLength;
}

export function getPhoneNumberDisplay(value: string, country: Country): string {
  const formattedNumber = formatPhoneNumber(value, country);
  return `${country.name} (+${country.dialCode}) ${formattedNumber}`;
}

export function parsePhoneNumber(formattedNumber: string): { countryCode: string; number: string } | null {
  // Remove tudo que não for número
  const numbers = formattedNumber.replace(/\D/g, '');
  
  if (!numbers) return null;

  // Procura o país pelo código de discagem
  for (const country of defaultCountries) {
    if (numbers.startsWith(country.dialCode)) {
      return {
        countryCode: country.code,
        number: numbers.substring(country.dialCode.length)
      };
    }
  }

  return null;
}

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