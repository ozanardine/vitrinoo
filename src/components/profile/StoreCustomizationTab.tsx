import React, { useState } from 'react';
import { Store, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Store as StoreType } from '../../lib/types';
import { ImageUploader } from '../ImageUploader';
import { countries, formatPhoneNumber } from '../../lib/countries';
import { SOCIAL_NETWORKS } from '../../lib/constants';
import { StoreHeader } from '../store/StoreHeader';

interface StoreCustomizationTabProps {
  store: StoreType;
  onUpdate: () => void;
}

interface SocialLink {
  type: string;
  url: string;
  countryCode?: string;
}

export function StoreCustomizationTab({ store, onUpdate }: StoreCustomizationTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState({
    name: store.name,
    slug: store.slug,
    description: store.description || '',
    logoUrl: store.logo_url || '',
    primaryColor: store.primary_color || '#000000',
    secondaryColor: store.secondary_color || '#ffffff'
  });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    store.social_links || []
  );

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(() => {
      if (type === 'success') setSuccess(null);
      else setError(null);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verificar se o slug já existe (exceto para a loja atual)
      const { data: existingStores, error: checkError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', storeForm.slug)
        .neq('id', store.id);

      if (checkError) throw checkError;

      if (existingStores && existingStores.length > 0) {
        throw new Error('Esta URL já está em uso. Por favor, escolha outra.');
      }

      // Validar links sociais
      for (const link of socialLinks) {
        if (link.type === 'email' && !link.url.includes('@')) {
          throw new Error('Email inválido');
        }
        if ((link.type === 'whatsapp' || link.type === 'telegram') && !link.url) {
          throw new Error('Número de telefone inválido');
        }
      }

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          name: storeForm.name,
          slug: storeForm.slug,
          description: storeForm.description || null,
          logo_url: storeForm.logoUrl || null,
          primary_color: storeForm.primaryColor,
          secondary_color: storeForm.secondaryColor,
          social_links: socialLinks,
          updated_at: new Date().toISOString()
        })
        .eq('id', store.id);

      if (updateError) throw updateError;

      showAlert('Loja atualizada com sucesso!', 'success');
      onUpdate();
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addSocialNetwork = (type: string) => {
    const defaultCountryCode = 'BR';
    setSocialLinks([
      ...socialLinks,
      { 
        type, 
        url: '',
        ...(type === 'whatsapp' || type === 'telegram' ? { countryCode: defaultCountryCode } : {})
      }
    ]);
  };

  const updateSocialNetwork = (index: number, value: string, countryCode?: string) => {
    const newLinks = [...socialLinks];
    if (countryCode) {
      const country = countries.find(c => c.code === countryCode) || countries[0];
      const numbers = value.replace(/\D/g, '');
      const formatted = formatPhoneNumber(numbers, country);
      newLinks[index] = { 
        ...newLinks[index], 
        url: formatted.substring(country.dialCode.length + 1), // Remove o código do país e o +
        countryCode 
      };
    } else {
      newLinks[index] = { ...newLinks[index], url: value };
    }
    setSocialLinks(newLinks);
  };

  const removeSocialNetwork = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const getAvailableNetworks = () => {
    const usedTypes = new Set(socialLinks.map(link => link.type));
    return Object.entries(SOCIAL_NETWORKS).filter(([type]) => !usedTypes.has(type));
  };

  return (
    <div className="space-y-8">
      {(error || success) && (
        <div className={`p-4 rounded-lg ${
          error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Loja</label>
              <input
                type="text"
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL da Loja</label>
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 mr-1">
                  {window.location.origin}/
                </span>
                <input
                  type="text"
                  value={storeForm.slug}
                  onChange={(e) => setStoreForm({ ...storeForm, slug: e.target.value })}
                  className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                  pattern="[a-z0-9-]+"
                  title="Apenas letras minúsculas, números e hífens são permitidos"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={storeForm.description}
                onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                rows={3}
                placeholder="Uma breve descrição sobre sua loja..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo</label>
              <ImageUploader
                onImageUrl={(url) => setStoreForm({ ...storeForm, logoUrl: url })}
                currentUrl={storeForm.logoUrl}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Cores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cor Principal</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={storeForm.primaryColor}
                  onChange={(e) => setStoreForm({ ...storeForm, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={storeForm.primaryColor}
                  onChange={(e) => setStoreForm({ ...storeForm, primaryColor: e.target.value })}
                  className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="Código de cor hexadecimal válido (ex: #000000)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cor Secundária</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={storeForm.secondaryColor}
                  onChange={(e) => setStoreForm({ ...storeForm, secondaryColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={storeForm.secondaryColor}
                  onChange={(e) => setStoreForm({ ...storeForm, secondaryColor: e.target.value })}
                  className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="Código de cor hexadecimal válido (ex: #000000)"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Prévia</h4>
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <StoreHeader
                name={storeForm.name}
                description={storeForm.description}
                logoUrl={storeForm.logoUrl}
                primaryColor={storeForm.primaryColor}
                secondaryColor={storeForm.secondaryColor}
                socialLinks={socialLinks}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Redes Sociais</h3>
          <div className="space-y-4">
            {socialLinks.map((link, index) => {
              const network = SOCIAL_NETWORKS[link.type];
              const Icon = network.icon;
              const isPhoneNumber = link.type === 'phone' || link.type === 'whatsapp' || (link.type === 'telegram' && !link.url.startsWith('@'));
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-gray-500" />
                  {isPhoneNumber ? (
                    <div className="flex-1 flex space-x-2">
                      <select
                        value={link.countryCode || 'BR'}
                        onChange={(e) => {
                          const country = countries.find(c => c.code === e.target.value);
                          if (country) {
                            updateSocialNetwork(index, '', e.target.value);
                          }
                        }}
                        className="w-40 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        {countries.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name} (+{country.dialCode})
                          </option>
                        ))}
                      </select>
                      <div className="flex-1 relative">
                        <input
                          type="tel"
                          value={link.url}
                          onChange={(e) => {
                            const country = countries.find(c => c.code === link.countryCode) || countries[0];
                            const numbers = e.target.value.replace(/\D/g, '');
                            updateSocialNetwork(index, numbers, link.countryCode);
                          }}
                          className="w-full p-2 pl-12 border rounded dark:bg-gray-700 dark:border-gray-600"
                          placeholder="00000-0000"
                        />
                        <span className="absolute left-2 top-2 text-gray-500 text-sm select-none">
                          +{(countries.find(c => c.code === link.countryCode) || countries[0]).dialCode}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type={link.type === 'email' ? 'email' : 'text'}
                      value={link.url}
                      onChange={(e) => updateSocialNetwork(index, e.target.value)}
                      className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      placeholder={network.placeholder}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeSocialNetwork(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}

            {getAvailableNetworks().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getAvailableNetworks().map(([type, network]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addSocialNetwork(type)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <network.icon className="w-4 h-4" />
                    <span>Adicionar {network.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}