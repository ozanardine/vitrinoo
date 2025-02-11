import React, { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { countries, fetchCountries, formatPhoneNumber, SOCIAL_NETWORKS, generateSocialUrl } from '../../lib/countries';

interface SocialNetworksFormProps {
  links: Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>;
  onChange: (links: Array<{
    type: string;
    url: string;
    countryCode?: string;
  }>) => void;
}

export function SocialNetworksForm({ links, onChange }: SocialNetworksFormProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState(countries);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const countries = await fetchCountries();
      setAvailableCountries(countries);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const validateUrl = (type: string, value: string): boolean => {
    const network = SOCIAL_NETWORKS[type as keyof typeof SOCIAL_NETWORKS];
    
    switch (network.type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(value) ||
               /^https?:\/\//.test(value);
      case 'username':
        return /^@?[a-zA-Z0-9._-]+$/.test(value);
      case 'phone': {
        const cleanNumber = value.replace(/\D/g, '');
        return cleanNumber.length >= 8 && cleanNumber.length <= 15;
      }
      case 'mixed':
        return /^@[a-zA-Z0-9._-]+$/.test(value) || 
               (/^\+\d{1,3}[\s-]?\d{1,14}$/.test(value) && value.replace(/\D/g, '').length >= 8);
      default:
        return true;
    }
  };

  const handleAddNetwork = (type: string) => {
    const network = SOCIAL_NETWORKS[type as keyof typeof SOCIAL_NETWORKS];
    const newLink = {
      type,
      url: '',
      ...(network.type === 'phone' ? { countryCode: 'BR' } : {})
    };

    onChange([...links, newLink]);
    setShowAddMenu(false);
  };

  const handleUpdateLink = (index: number, updates: Partial<{
    type: string;
    url: string;
    countryCode?: string;
  }>) => {
    const newLinks = [...links];
    const link = { ...newLinks[index], ...updates };
    
    // Format phone numbers
    const network = SOCIAL_NETWORKS[link.type as keyof typeof SOCIAL_NETWORKS];
    if (network.type === 'phone' && updates.url) {
      const country = availableCountries.find(c => c.code === link.countryCode);
      if (country) {
        link.url = formatPhoneNumber(updates.url, country);
      }
    }

    // Validate URL format
    if (validateUrl(link.type, link.url)) {
      newLinks[index] = link;
      onChange(newLinks);
      setError(null);
    } else {
      setError(`Formato inválido para ${network.label}`);
    }
  };

  const handleRemoveLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const getAvailableNetworks = () => {
    const usedTypes = new Set(links.map(link => link.type));
    return Object.entries(SOCIAL_NETWORKS).filter(([type]) => !usedTypes.has(type));
  };

  const getGeneratedUrl = (link: { type: string; url: string; countryCode?: string }) => {
    return generateSocialUrl(link.type, link.url, link.countryCode);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Redes Sociais</h3>
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Rede Social</span>
        </button>
      </div>

      {showAddMenu && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium mb-2">Escolha uma rede social</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {getAvailableNetworks().map(([type, network]) => {
              const Icon = network.icon;
              return (
                <button
                  key={type}
                  onClick={() => handleAddNetwork(type)}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Icon className="w-4 h-4" />
                  <span>{network.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {links.map((link, index) => {
          const network = SOCIAL_NETWORKS[link.type as keyof typeof SOCIAL_NETWORKS];
          const Icon = network.icon;
          const isPhoneType = network.type === 'phone';
          const isTelegram = link.type === 'telegram';
          const generatedUrl = getGeneratedUrl(link);

          return (
            <div key={`${link.type}-${index}`} className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  {isPhoneType ? (
                    <div className="flex space-x-2">
                      <select
                        value={link.countryCode || 'BR'}
                        onChange={(e) => handleUpdateLink(index, { countryCode: e.target.value })}
                        className="w-40 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        {availableCountries.map(country => (
                          <option key={`${country.code}-${country.dialCode}`} value={country.code}>
                            {country.name} (+{country.dialCode})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={link.url.replace(/^\+\d+\s*/, '')}
                        onChange={(e) => {
                          const country = availableCountries.find(c => c.code === link.countryCode);
                          if (country) {
                            handleUpdateLink(index, { url: e.target.value });
                          }
                        }}
                        placeholder={network.placeholder}
                        className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  ) : isTelegram ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(index, { url: e.target.value })}
                          placeholder={network.placeholder}
                          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        {link.url.startsWith('@') ? (
                          <span className="text-green-500 flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            Username
                          </span>
                        ) : (
                          <span>Use @ para username</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <input
                      type={network.type === 'email' ? 'email' : 'text'}
                      value={link.url}
                      onChange={(e) => handleUpdateLink(index, { url: e.target.value })}
                      placeholder={network.placeholder}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {link.url && (
                <div className="ml-9 text-sm text-gray-500">
                  URL gerada: <a href={generatedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{generatedUrl}</a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}