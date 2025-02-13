import React from 'react';
import { countries, formatPhoneNumber } from '../../../../lib/countries';

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

  const extractNumbersOnly = (input: string): string => {
    return input.replace(/\D/g, '');
  };

  const removeCountryCode = (number: string, countryDialCode: string): string => {
    if (number.startsWith(countryDialCode)) {
      return number.slice(countryDialCode.length);
    }
    return number;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove tudo que não for número
    const numericValue = extractNumbersOnly(inputValue);
    
    // Formata o número
    const formattedValue = formatPhoneNumber(numericValue, selectedCountry);
    
    onChange(formattedValue);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    const newCountry = countries.find(c => c.code === newCountryCode) || countries[0];
    
    // Formata com o novo padrão do país
    const formattedValue = formatPhoneNumber('', newCountry);
    
    onCountryChange(newCountryCode);
    onChange(formattedValue);
  };

  // Prepara o valor para exibição no input
  const displayValue = value.replace(new RegExp(`^\\+${selectedCountry.dialCode}\\s*`), '').trim();

  return (
    <div className="flex gap-2">
      <select
        value={countryCode}
        onChange={handleCountryChange}
        className="w-40 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
      >
        {countries.map((country) => (
          <option key={`${country.code}-${country.dialCode}`} value={country.code}>
            {country.name} (+{country.dialCode})
          </option>
        ))}
      </select>
      <div className="flex-1 relative">
        <div className="flex items-center">
          <span className="absolute left-2 z-10 text-gray-500 select-none bg-transparent">
            +{selectedCountry.dialCode}
          </span>
          <input
            type="tel"
            value={displayValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`w-full p-2 pl-[calc(${selectedCountry.dialCode.length}ch+2ch)] border rounded dark:bg-gray-700 dark:border-gray-600 ${
              error ? 'border-red-500' : ''
            } ${className}`}
          />
        </div>
      </div>
    </div>
  );
};

export default PhoneInput;
