import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MessageCircle, Instagram, Facebook, 
  Youtube, Store as TikTok, Twitter, Link2, Plus, X, Check 
} from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { SectionHeader } from '../forms/SectionHeader';
import PhoneInput from './PhoneInput';
import { 
  countries, 
  fetchCountries,
  validatePhoneNumber, 
  getPhoneNumberDisplay 
} from '../../../../lib/countries';

interface SocialNetwork {
  id: string;
  name: string;
  icon: any;
  placeholder: string;
  type: 'phone' | 'email' | 'whatsapp' | 'telegram' | 'social';
  prefix?: string;
  pattern?: string;
  format?: (value: string, countryCode?: string) => string;
  validate?: (value: string, countryCode?: string) => boolean;
}

interface ContactsSettings {
  contactsPosition: 'above' | 'below';
  displayFormat: 'username' | 'network';
}

const SOCIAL_NETWORKS: SocialNetwork[] = [
  {
    id: 'phone',
    name: 'Telefone',
    icon: Phone,
    type: 'phone',
    placeholder: 'Digite o número',
    format: (value, countryCode) => {
      const country = countries.find(c => c.code === countryCode);
      return country ? formatPhoneNumber(value, country) : value;
    },
    validate: (value, countryCode) => {
      const country = countries.find(c => c.code === countryCode);
      return country ? validatePhoneNumber(value, country) : false;
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    type: 'whatsapp',
    placeholder: 'Digite o número',
    format: (value, countryCode) => {
      const country = countries.find(c => c.code === countryCode);
      return country ? formatPhoneNumber(value, country) : value;
    },
    validate: (value, countryCode) => {
      const country = countries.find(c => c.code === countryCode);
      return country ? validatePhoneNumber(value, country) : false;
    }
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: MessageCircle,
    type: 'telegram',
    placeholder: '@seuusuario',
    prefix: '@',
    validate: (value) => /^@[a-zA-Z0-9_]{5,32}$/.test(value)
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    type: 'email',
    placeholder: 'seu@email.com',
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    type: 'social',
    placeholder: '@seuinstagram',
    prefix: '@',
    validate: (value) => /^@[a-zA-Z0-9._]{1,30}$/.test(value)
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    type: 'social',
    placeholder: '@suapagina',
    prefix: '@',
    validate: (value) => /^@[a-zA-Z0-9._-]{1,50}$/.test(value)
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    type: 'social',
    placeholder: '@seucanal',
    prefix: '@',
    validate: (value) => /^@[a-zA-Z0-9_-]{1,30}$/.test(value)
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: TikTok,
    type: 'social',
    placeholder: '@seutiktok',
    prefix: '@',
    validate: (value) => /^@[a-zA-Z0-9._]{1,24}$/.test(value)
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    type: 'social',
    placeholder: '@seutwitter',
    prefix: '@',
    validate: (value) => /^@[a-zA-Z0-9_]{1,15}$/.test(value)
  }
];

export function ContactsAndSocialNetworks() {
  const { formData, updateFormData } = useStoreCustomization();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCountries, setAvailableCountries] = useState(countries);

  // Initialize settings from formData instead of local state
  const settings = formData.socialSettings || {
    contactsPosition: 'above',
    displayFormat: 'username'
  };

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

  const handleAddNetwork = (network: SocialNetwork) => {
    const existingNetwork = formData.socialLinks.find(link => link.type === network.id);
    if (existingNetwork) {
      setError(`Você já adicionou ${network.name}`);
      return;
    }

    updateFormData({
      socialLinks: [
        ...formData.socialLinks,
        { 
          type: network.id, 
          url: network.prefix || '',
          countryCode: network.type === 'phone' || network.type === 'whatsapp' ? 'BR' : undefined
        }
      ]
    });
    setShowAddMenu(false);
    setError(null);
  };

  const handleUpdateLink = (index: number, value: string, countryCode?: string) => {
    const network = SOCIAL_NETWORKS.find(n => n.id === formData.socialLinks[index].type);
    if (!network) return;

    let formattedValue = value;
    if (network.format && (network.type === 'phone' || network.type === 'whatsapp')) {
      // Remove formatação existente antes de aplicar nova
      const cleanValue = value.replace(/\D/g, '');
      const country = availableCountries.find(c => c.code === countryCode);
      if (country) {
        formattedValue = formatPhoneNumber(cleanValue, country);
      }
    }

    const newLinks = [...formData.socialLinks];
    newLinks[index] = { 
      ...newLinks[index], 
      url: formattedValue,
      countryCode: countryCode || newLinks[index].countryCode
    };
    updateFormData({ socialLinks: newLinks });
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    updateFormData({ socialLinks: newLinks });
  };

  const validateLink = (type: string, value: string, countryCode?: string): boolean => {
    const network = SOCIAL_NETWORKS.find(n => n.id === type);
    if (!network?.validate) return true;

    // Se for telefone ou whatsapp, passa o código do país
    if (network.type === 'phone' || network.type === 'whatsapp') {
      return network.validate(value, countryCode);
    }

    return network.validate(value);
  };

  const getDisplayValue = (link: any) => {
    const network = SOCIAL_NETWORKS.find(n => n.id === link.type);
    if (!network) return '';

    if (network.type === 'phone' || network.type === 'whatsapp') {
      const country = availableCountries.find(c => c.code === link.countryCode);
      if (country) {
        return getPhoneNumberDisplay(link.url, country);
      }
    }

    return link.url;
  };

  const handleSettingsChange = (updates: Partial<typeof settings>) => {
    // Update formData directly instead of local state
    updateFormData({
      socialSettings: {
        ...settings,
        ...updates
      }
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Contatos e Redes Sociais"
        description="Adicione suas informações de contato e redes sociais para que seus clientes possam te encontrar facilmente."
      />

      {/* Display Settings */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg border border-blue-100 dark:border-gray-700">
        <h4 className="text-lg font-semibold mb-6 text-blue-900 dark:text-blue-100">
          Configurações de Exibição
        </h4>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Position Settings */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
              Posição dos Contatos
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                ${settings.contactsPosition === 'above'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                }
              `}>
                <input
                  type="radio"
                  name="contactsPosition"
                  value="above"
                  checked={settings.contactsPosition === 'above'}
                  onChange={(e) => handleSettingsChange({ contactsPosition: e.target.value as 'above' | 'below' })}
                  className="sr-only"
                />
                <div className="w-full h-24 mb-2 relative">
                  <div className="absolute inset-x-0 top-0 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="absolute inset-x-4 top-8 space-y-2">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
                  </div>
                </div>
                <span className="text-sm">Acima das Redes</span>
                {settings.contactsPosition === 'above' && (
                  <div className="absolute top-2 right-2 w-4 h-4 text-blue-500">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </label>

              <label className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                ${settings.contactsPosition === 'below'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                }
              `}>
                <input
                  type="radio"
                  name="contactsPosition"
                  value="below"
                  checked={settings.contactsPosition === 'below'}
                  onChange={(e) => handleSettingsChange({ contactsPosition: e.target.value as 'above' | 'below' })}
                  className="sr-only"
                />
                <div className="w-full h-24 mb-2 relative">
                  <div className="absolute inset-x-4 top-2 space-y-2">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <span className="text-sm">Abaixo das Redes</span>
                {settings.contactsPosition === 'below' && (
                  <div className="absolute top-2 right-2 w-4 h-4 text-blue-500">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Display Format Settings */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
              Formato de Exibição
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                ${settings.displayFormat === 'username'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                }
              `}>
                <input
                  type="radio"
                  name="displayFormat"
                  value="username"
                  checked={settings.displayFormat === 'username'}
                  onChange={(e) => handleSettingsChange({ displayFormat: e.target.value as 'username' | 'network' })}
                  className="sr-only"
                />
                <div className="w-full h-24 mb-2 flex items-center justify-center">
                  <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    @exemplo
                  </div>
                </div>
                <span className="text-sm">Nome de Usuário</span>
                {settings.displayFormat === 'username' && (
                  <div className="absolute top-2 right-2 w-4 h-4 text-blue-500">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </label>

              <label className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                ${settings.displayFormat === 'network'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                }
              `}>
                <input
                  type="radio"
                  name="displayFormat"
                  value="network"
                  checked={settings.displayFormat === 'network'}
                  onChange={(e) => handleSettingsChange({ displayFormat: e.target.value as 'username' | 'network' })}
                  className="sr-only"
                />
                <div className="w-full h-24 mb-2 flex items-center justify-center">
                  <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    Instagram
                  </div>
                </div>
                <span className="text-sm">Nome da Rede</span>
                {settings.displayFormat === 'network' && (
                  <div className="absolute top-2 right-2 w-4 h-4 text-blue-500">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {formData.socialLinks.map((link, linkIndex) => {
          const network = SOCIAL_NETWORKS.find(n => n.id === link.type);
          if (!network) return null;

          const Icon = network.icon;
          const isValid = validateLink(link.type, link.url, link.countryCode);
          const showError = link.url.length > 0 && !isValid;

          return (
            <div key={`${link.type}-${linkIndex}`} className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {(network.type === 'phone' || network.type === 'whatsapp') ? (
                      <div className="flex-1">
                        <PhoneInput
                          value={link.url}
                          countryCode={link.countryCode || 'BR'}
                          onChange={(value) => handleUpdateLink(linkIndex, value, link.countryCode)}
                          onCountryChange={(countryCode) => handleUpdateLink(linkIndex, link.url, countryCode)}
                          placeholder={network.placeholder}
                          error={showError}
                        />
                      </div>
                    ) : (
                      <input
                        type={network.type === 'email' ? 'email' : 'text'}
                        value={link.url}
                        onChange={(e) => handleUpdateLink(linkIndex, e.target.value, link.countryCode)}
                        placeholder={network.placeholder}
                        className={`flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${
                          showError ? 'border-red-500' : ''
                        }`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(linkIndex)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {showError && (
                    <p className="text-sm text-red-500 mt-1">
                      Formato inválido para {network.name}
                    </p>
                  )}
                </div>
              </div>

              {isValid && link.url && (
                <div className="ml-9 text-sm text-gray-500 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{getDisplayValue(link)}</span>
                </div>
              )}
            </div>
          );
        })}

        <div>
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Contato ou Rede Social</span>
          </button>

          {showAddMenu && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium mb-2">Escolha o tipo de contato</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {SOCIAL_NETWORKS.map((network) => {
                  const isUsed = formData.socialLinks.some(link => link.type === network.id);
                  const Icon = network.icon;
                  return (
                    <button
                      key={network.id}
                      onClick={() => handleAddNetwork(network)}
                      disabled={isUsed}
                      className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isUsed ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{network.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}