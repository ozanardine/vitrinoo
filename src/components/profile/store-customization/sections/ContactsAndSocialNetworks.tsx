import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { SectionHeader } from '../forms/SectionHeader';
import { DisplaySettings } from './contacts/DisplaySettings';
import { SocialLinkItem } from './contacts/SocialLinkItem';
import { AddNetworkMenu } from './contacts/AddNetworkMenu';
import { validateSocialLink, getDisplayValue } from './contacts/utils';
import { SOCIAL_NETWORKS } from '../../../../lib/constants';
import { formatPhoneNumber, countries } from '../../../../lib/countries';

export function ContactsAndSocialNetworks() {
  const { previewData, updatePreview, stagePendingChanges } = useStoreCustomization();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddNetwork = (type: string) => {
    const network = SOCIAL_NETWORKS[type as keyof typeof SOCIAL_NETWORKS];
    const existingNetwork = previewData.socialLinks.find(link => link.type === type);
    
    if (existingNetwork) {
      setError(`Você já adicionou ${network.label}`);
      return;
    }

    const newLink = {
      type,
      url: network.type === 'username' ? '@' : '',
      countryCode: network.type === 'phone' ? 'BR' : undefined
    };

    const newLinks = [...previewData.socialLinks, newLink];

    // Atualiza preview
    updatePreview({
      socialLinks: newLinks
    }, 'contacts');

    // Aplica mudanças
    stagePendingChanges({
      socialLinks: newLinks
    }, 'contacts');

    setShowAddMenu(false);
    setError(null);
  };

  const handleUpdateLink = (index: number, value: string, countryCode?: string) => {
    const newLinks = [...previewData.socialLinks];
    const link = newLinks[index];
    const network = SOCIAL_NETWORKS[link.type as keyof typeof SOCIAL_NETWORKS];

    // Se for telefone, formatar o número de acordo com o país
    if (network.type === 'phone' && countryCode) {
      const country = countries.find(c => c.code === countryCode);
      if (country) {
        const formattedValue = formatPhoneNumber(value.replace(/\D/g, ''), country);
        newLinks[index] = { 
          ...link, 
          url: formattedValue,
          countryCode
        };
      }
    } else {
      newLinks[index] = { 
        ...link, 
        url: value,
        countryCode: link.countryCode
      };
    }

    // Atualiza preview
    updatePreview({
      socialLinks: newLinks
    }, 'contacts');

    // Aplica mudanças
    stagePendingChanges({
      socialLinks: newLinks
    }, 'contacts');
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = previewData.socialLinks.filter((_, i) => i !== index);
    
    // Atualiza preview
    updatePreview({
      socialLinks: newLinks
    }, 'contacts');

    // Aplica mudanças
    stagePendingChanges({
      socialLinks: newLinks
    }, 'contacts');
  };

  const handleSettingsChange = (updates: Partial<typeof previewData.socialSettings>) => {
    const newSettings = {
      ...previewData.socialSettings,
      ...updates
    };

    // Atualiza preview
    updatePreview({
      socialSettings: newSettings
    }, 'contacts');

    // Aplica mudanças
    stagePendingChanges({
      socialSettings: newSettings
    }, 'contacts');
  };

  const usedTypes = new Set(previewData.socialLinks.map(link => link.type));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Contatos e Redes Sociais"
        description="Adicione suas informações de contato e redes sociais para que seus clientes possam te encontrar facilmente."
      />

      <DisplaySettings
        settings={previewData.socialSettings}
        onSettingsChange={handleSettingsChange}
      />

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {previewData.socialLinks.map((link, index) => {
          const isValid = validateSocialLink(link.type, link.url, link.countryCode);
          const showError = link.url.length > 0 && !isValid;
          
          return (
            <SocialLinkItem
              key={`${link.type}-${index}`}
              link={link}
              index={index}
              onUpdate={handleUpdateLink}
              onRemove={handleRemoveLink}
              isValid={isValid}
              showError={showError}
              displayValue={getDisplayValue(link)}
            />
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
            <AddNetworkMenu
              onSelect={handleAddNetwork}
              usedTypes={usedTypes}
            />
          )}
        </div>
      </div>
    </div>
  );
}