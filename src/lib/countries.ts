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

  // Garante que o número não comece com o código do país
  const numberWithoutCountryCode = numbers.startsWith(country.dialCode) 
    ? numbers.slice(country.dialCode.length)
    : numbers;

  // Aplica a máscara do país
  let format = country.format;
  let result = '';
  let numberIndex = 0;

  // Para cada caractere no formato
  for (let i = 0; i < format.length && numberIndex < numberWithoutCountryCode.length; i++) {
    if (format[i] === '#') {
      result += numberWithoutCountryCode[numberIndex];
      numberIndex++;
    } else {
      result += format[i];
      // Se ainda tiver números, adiciona o próximo separador
      if (numberIndex < numberWithoutCountryCode.length) {
        format = format.substring(0, i + 1) + format.substring(i + 1);
      }
    }
  }

  // Garante que o resultado sempre comece com o código do país
  if (!result.startsWith('+')) {
    result = `+${country.dialCode}${result.startsWith(' ') ? '' : ' '}${result}`;
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
