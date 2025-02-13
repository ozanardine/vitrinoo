import React, { useState, useEffect } from 'react';
import { formatPhoneNumber, Country, fetchCountries, countries } from '../../../../lib/countries';

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
  const [phoneNumber, setPhoneNumber] = useState(value);
  const [countryList, setCountryList] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    const getCountries = async () => {
      const fetchedCountries = await fetchCountries();
      setCountryList(fetchedCountries);
      const selCountry = fetchedCountries.find(c => c.code === countryCode);
      setSelectedCountry(selCountry || null);
    };
    getCountries();
  }, [countryCode]);

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
        {countryList && countryList.map((country: Country) => (
          <option key={`${country.code}-${country.dialCode}`} value={country.code}>
            {country.name} (+{country.dialCode})
          </option>
        ))}
      </select>
      <div className="flex-1 relative">
        <input
          type="tel"
          value={selectedCountry ? formatPhoneNumber(phoneNumber, selectedCountry) : phoneNumber}
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
