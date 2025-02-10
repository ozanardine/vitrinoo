// List of countries with calling codes
export interface Country {
  name: string;
  code: string;
  dialCode: string;
  format: string;
  priority?: number;
}

export const countries: Country[] = [
  {
    name: 'Brasil',
    code: 'BR',
    dialCode: '55',
    format: '+## (##) #####-####',
    priority: 1
  },
  {
    name: 'Estados Unidos',
    code: 'US',
    dialCode: '1',
    format: '+# (###) ###-####'
  },
  {
    name: 'Portugal',
    code: 'PT',
    dialCode: '351',
    format: '+### ### ### ###'
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
  },
  {
    name: 'Bolívia',
    code: 'BO',
    dialCode: '591',
    format: '+### # ### ####'
  },
  {
    name: 'Equador',
    code: 'EC',
    dialCode: '593',
    format: '+### ## ### ####'
  },
  {
    name: 'Venezuela',
    code: 'VE',
    dialCode: '58',
    format: '+## (###) ### ####'
  },
  {
    name: 'Espanha',
    code: 'ES',
    dialCode: '34',
    format: '+## ### ### ###'
  },
  {
    name: 'Reino Unido',
    code: 'GB',
    dialCode: '44',
    format: '+## #### ######'
  },
  {
    name: 'França',
    code: 'FR',
    dialCode: '33',
    format: '+## # ## ## ## ##'
  },
  {
    name: 'Alemanha',
    code: 'DE',
    dialCode: '49',
    format: '+## ### #######'
  },
  {
    name: 'Itália',
    code: 'IT',
    dialCode: '39',
    format: '+## ### ### ####'
  },
  {
    name: 'Canadá',
    code: 'CA',
    dialCode: '1',
    format: '+# (###) ###-####'
  },
  {
    name: 'Austrália',
    code: 'AU',
    dialCode: '61',
    format: '+## ### ### ###'
  }
].sort((a, b) => {
  // Prioridade primeiro
  if (a.priority && !b.priority) return -1;
  if (!a.priority && b.priority) return 1;
  if (a.priority && b.priority) {
    if (a.priority < b.priority) return -1;
    if (a.priority > b.priority) return 1;
  }
  // Depois ordem alfabética
  return a.name.localeCompare(b.name);
});

export function formatPhoneNumber(value: string, country: Country): string {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, '');
  
  // Se não tiver números, retorna vazio
  if (!numbers) return '';

  // Aplica a máscara do país
  let format = country.format;
  let result = `+${country.dialCode}`;
  let numberIndex = 0;

  // Para cada caractere no formato
  for (let i = country.dialCode.length + 1; i < format.length && numberIndex < numbers.length; i++) {
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

export function parsePhoneNumber(formattedNumber: string): { countryCode: string; number: string } | null {
  // Remove tudo que não for número
  const numbers = formattedNumber.replace(/\D/g, '');
  
  if (!numbers) return null;

  // Procura o país pelo código de discagem
  for (const country of countries) {
    if (numbers.startsWith(country.dialCode)) {
      return {
        countryCode: country.code,
        number: numbers.substring(country.dialCode.length)
      };
    }
  }

  return null;
}