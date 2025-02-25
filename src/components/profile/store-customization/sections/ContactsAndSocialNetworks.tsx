import { useState } from 'react';
import { X, Check, Plus, AlertCircle } from 'lucide-react';
import { useStoreCustomization } from '../StoreCustomizationContext';
import { SectionHeader } from '../forms/SectionHeader';
import { DisplaySettings } from './contacts/DisplaySettings';
import { SOCIAL_NETWORKS } from '../../../../lib/constants';
import { validateSocialLink, getDisplayValue } from './contacts/utils';
import { AddNetworkMenu } from './contacts/AddNetworkMenu';

// Função para formatar números de telefone brasileiros
function formatPhoneNumber(value: string): string {
  // Remove tudo exceto dígitos
  const digitsOnly = value.replace(/\D/g, '');
  
  // Se não tiver dígitos, retorna valor vazio
  if (!digitsOnly) return '';
  
  // Formata conforme a quantidade de dígitos
  if (digitsOnly.length <= 2) {
    return `(${digitsOnly}`;
  } else if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
  } else if (digitsOnly.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 6)}-${digitsOnly.slice(6, 10)}`;
  } else {
    // Celular: (XX) XXXXX-XXXX
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7, 11)}`;
  }
}

export function ContactsAndSocialNetworks() {
  const { previewData, updatePreview, stagePendingChanges } = useStoreCustomization();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddNetwork = (type: string) => {
    const network = SOCIAL_NETWORKS[type as keyof typeof SOCIAL_NETWORKS];
    
    if (previewData.socialLinks.some(link => link.type === type)) {
      setError(`Você já adicionou ${network.label}`);
      return;
    }
    
    // Valor inicial dependendo do tipo
    let initialValue = '';
    if (network.type === 'username') initialValue = '@';
    
    const newLinks = [
      ...previewData.socialLinks,
      { type, url: initialValue }
    ];
    
    updatePreview({ socialLinks: newLinks }, 'contacts');
    stagePendingChanges({ socialLinks: newLinks }, 'contacts');
    setShowAddMenu(false);
    setError(null);
  };
  
  const handleUpdateLink = (index: number, value: string) => {
    const newLinks = [...previewData.socialLinks];
    const link = newLinks[index];
    const network = SOCIAL_NETWORKS[link.type as keyof typeof SOCIAL_NETWORKS];
    
    // Formatação específica por tipo
    if (network.type === 'phone') {
      newLinks[index] = {
        ...link,
        url: formatPhoneNumber(value)
      };
    } else if (network.type === 'username' && value && !value.startsWith('@')) {
      newLinks[index] = {
        ...link,
        url: `@${value}`
      };
    } else {
      newLinks[index] = {
        ...link,
        url: value
      };
    }
    
    updatePreview({ socialLinks: newLinks }, 'contacts');
    stagePendingChanges({ socialLinks: newLinks }, 'contacts');
  };
  
  const handleRemoveLink = (index: number) => {
    const newLinks = previewData.socialLinks.filter((_, i) => i !== index);
    
    updatePreview({ socialLinks: newLinks }, 'contacts');
    stagePendingChanges({ socialLinks: newLinks }, 'contacts');
  };
  
  const handleSettingsChange = (updates: Partial<{
    contactsPosition: 'above' | 'below';
    displayFormat: 'username' | 'network';
  }>) => {
    const newSettings = {
      ...previewData.socialSettings,
      ...updates
    };
    
    updatePreview({ socialSettings: newSettings }, 'contacts');
    stagePendingChanges({ socialSettings: newSettings }, 'contacts');
  };
  
  // Tipos de redes já utilizados
  const usedTypes = new Set(previewData.socialLinks.map(link => link.type));

  // Renderiza um contato individual
  const renderSocialLink = (link: { type: string; url: string }, index: number) => {
    const network = SOCIAL_NETWORKS[link.type as keyof typeof SOCIAL_NETWORKS];
    if (!network) return null;
    
    const Icon = network.icon;
    const isValid = validateSocialLink(link.type, link.url);
    const showError = !isValid && link.url.length > 0;
    
    return (
      <div key={`${link.type}-${index}`} className="space-y-2">
        <div className="flex items-start space-x-2">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <input
                type={network.type === 'email' ? 'email' : 'text'}
                value={link.url}
                onChange={(e) => handleUpdateLink(index, e.target.value)}
                placeholder={network.placeholder}
                className={`flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${
                  showError ? 'border-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => handleRemoveLink(index)}
                className="p-2 text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {showError && (
              <p className="text-sm text-red-500 mt-1">
                Formato inválido para {network.label}
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
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Contatos e Redes Sociais"
        description="Adicione informações de contato e links para suas redes sociais. Os visitantes poderão entrar em contato diretamente pelo seu catálogo."
      />

      <DisplaySettings
        settings={previewData.socialSettings}
        onSettingsChange={handleSettingsChange}
      />

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800 text-red-300 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {previewData.socialLinks.map(renderSocialLink)}
        
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
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
  );
}