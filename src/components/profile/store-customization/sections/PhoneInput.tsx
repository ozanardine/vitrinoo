import React from 'react';
import { countries, formatPhoneNumber, validatePhoneNumber } from '../../../../lib/countries';

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onChange: (value: string) => void;
  onCountryChange: (countryCode: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

const PhoneInput = ({
  value,
  countryCode,
  onChange,
  onCountryChange,
  placeholder = 'Digite o número',
  className = '',
  error = false
}: PhoneInputProps) => {
  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove o prefixo do input se presente
    const prefixToRemove = `+${selectedCountry.dialCode}`;
    const valueWithoutPrefix = inputValue.startsWith(prefixToRemove) 
      ? inputValue.slice(prefixToRemove.length) 
      : inputValue;
    
    // Remove tudo que não for número
    let numericValue = valueWithoutPrefix.replace(/\D/g, '');
    
    // Formata o número conforme o padrão do país
    const formattedValue = formatPhoneNumber(numericValue, selectedCountry);
    
    onChange(formattedValue);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    const newCountry = countries.find(c => c.code === newCountryCode) || countries[0];
    
    // Remove a formatação atual
    const numericValue = value.replace(/\D/g, '');
    
    // Remove o código do país antigo se presente
    const prefixToRemove = selectedCountry.dialCode;
    const valueWithoutOldCode = numericValue.startsWith(prefixToRemove) 
      ? numericValue.slice(prefixToRemove.length)
      : numericValue;
    
    // Formata com o novo padrão do país
    const formattedValue = formatPhoneNumber(valueWithoutOldCode, newCountry);
    
    onCountryChange(newCountryCode);
    onChange(formattedValue);
  };

  // Prepara o valor para exibição no input
  const displayValue = value;

  return (
    <div className="flex gap-2 relative">
      <select
        value={countryCode}
        onChange={handleCountryChange}
        className="w-40 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name} (+{country.dialCode})
          </option>
        ))}
      </select>
      <div className="flex-1 relative">
        <input
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full p-2 pl-14 border rounded dark:bg-gray-700 dark:border-gray-600 ${
            error ? 'border-red-500' : ''
          } ${className}`}
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
          +{selectedCountry.dialCode}
        </span>
      </div>
    </div>
  );
};

export default PhoneInput;