import { Phone, Instagram, Facebook, Twitter, Youtube, Linkedin, MessageCircle, Mail, Globe, GitBranch as BrandTiktok } from 'lucide-react';
import { getCountryCallingCode, AsYouType, CountryCode } from 'libphonenumber-js'

// List of countries with calling codes
export interface Country {
  name: string;
  code: string;
  dialCode: string;
  format?: string;
}

// Default countries list
export const defaultCountries: Country[] = [
  {
    name: 'Brasil',
    code: 'BR',
    dialCode: '55',
    format: '(##) #####-####'
  },
  {
    name: 'Portugal',
    code: 'PT',
    dialCode: '351',
    format: '### ### ###'
  },
  {
    name: 'Estados Unidos',
    code: 'US',
    dialCode: '1',
    format: '(###) ###-####'
  }
];

// Export countries as the default list initially
export let countries: Country[] = [...defaultCountries];

// Fetch countries from REST Countries API
export async function fetchCountries(): Promise<Country[]> {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd');
    const data = await response.json();

    const fetchedCountries = data.map((country: any) => ({
      name: country.name.common,
      code: country.cca2,
      dialCode: country.idd.root.replace('+', '') + (country.idd.suffixes ? country.idd.suffixes[0] : ''),
      format: '' // Placeholder for format
    }));

    // Update the countries array with fetched data
    countries = fetchedCountries;

    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return defaultCountries;
  }
}

export function formatPhoneNumber(value: string, country: Country): string {
  const formatter = new AsYouType(country.code as CountryCode)
  return formatter.input(value)
}

export function validatePhoneNumber(value: string, country: Country): boolean {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, '');
  
  // Verifica se tem o número mínimo de dígitos para o país
  const minLength = (country.format || '').split('#').length - 1;
  const maxLength = minLength + 2; // Permite até 2 dígitos extras para flexibilidade
  
  return numbers.length >= minLength && numbers.length <= maxLength;
}

export function getPhoneNumberDisplay(value: string, country: Country): string {
  return `(+${country.dialCode}) ${value}`;
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
