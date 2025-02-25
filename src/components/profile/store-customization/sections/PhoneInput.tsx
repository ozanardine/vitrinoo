import React, { useState, useEffect } from 'react';
import { AsYouType, isValidPhoneNumber, CountryCode, getExampleNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import { Country, fetchCountries } from '../../../../lib/countries';

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
  const [localError, setLocalError] = useState(false);
  const [maxLength, setMaxLength] = useState<number>(20);

  useEffect(() => {
    const getCountries = async () => {
      const fetchedCountries = await fetchCountries();
      setCountryList(fetchedCountries);
      const selCountry = fetchedCountries.find(c => c.code === countryCode);
      setSelectedCountry(selCountry || null);

      // Set max length based on example number for the country
      if (selCountry) {
        try {
          const example = getExampleNumber(selCountry.code as CountryCode, examples);
          if (example) {
            const nationalNumberLength = example.nationalNumber.length;
            // Add extra space for formatting characters (spaces, parentheses, dashes)
            const formattingBuffer = 5;
            setMaxLength(nationalNumberLength + formattingBuffer);
          }
        } catch (err) {
          setMaxLength(15); // Fallback to standard international phone number length
        }
      }
    };
    getCountries();
  }, [countryCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only allow digits, spaces, and common phone number characters
    if (/^[\d\s()+-]*$/.test(newValue)) {
      // Only update if within maxLength counting just the digits
      const digitsOnly = newValue.replace(/\D/g, '');
      if (digitsOnly.length <= maxLength - 5) { // Subtract formatting buffer
        setPhoneNumber(newValue);
      }
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = e.target.value;
    onCountryChange(newCountryCode);
    
    // Clear the phone number when changing country
    setPhoneNumber('');
    setLocalError(false);
  };

  // Get the placeholder based on the selected country
  const getPlaceholder = () => {
    if (!selectedCountry) return placeholder;
    
    try {
      const formatter = new AsYouType(selectedCountry.code as CountryCode);
      return formatter.input('123456789').replace(/\d/g, '#');
    } catch {
      return placeholder;
    }
  };

  // Format and validate phone number when it changes
  useEffect(() => {
    if (!phoneNumber || !selectedCountry) return;

    try {
      // Format the number as the user types
      const formatter = new AsYouType(selectedCountry.code as CountryCode);
      const formattedNumber = formatter.input(phoneNumber);

      // Validate the number
      const isValid = isValidPhoneNumber(formattedNumber, selectedCountry.code as CountryCode);
      setLocalError(!isValid && phoneNumber.length > 0);

      // Only update if the number is different
      if (formattedNumber !== value) {
        onChange(formattedNumber);
      }
    } catch (err) {
      setLocalError(true);
    }
  }, [phoneNumber, selectedCountry, onChange, value]);

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
      <input
        type="tel"
        value={phoneNumber}
        onChange={handleInputChange}
        placeholder={getPlaceholder()}
        maxLength={maxLength}
        className={`flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${(error || localError) ? 'border-red-500' : ''} ${className}`}
      />
    </div>
  );
};

export default PhoneInput;
