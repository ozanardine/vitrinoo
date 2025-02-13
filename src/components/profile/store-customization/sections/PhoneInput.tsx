import React, { useState, useEffect } from 'react';
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
  const [phoneNumber, setPhoneNumber] = useState(value);

  useEffect(() => {
    onChange(phoneNumber);
  }, [phoneNumber, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    onCountryChange(newCountryCode);
    setPhoneNumber('');
  };

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
        <input
          type="tel"
          value={formatPhoneNumber(phoneNumber, selectedCountry)}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${
            error ? 'border-red-500' : ''
          } ${className}`}
        />
      </div>
    </div>
  );
};

export default PhoneInput;
