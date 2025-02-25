import { Check } from 'lucide-react';

interface DisplaySettings {
  contactsPosition: 'above' | 'below';
  displayFormat: 'username' | 'network';
}

interface DisplaySettingsProps {
  settings: DisplaySettings;
  onSettingsChange: (updates: Partial<DisplaySettings>) => void;
}

export function DisplaySettings({ settings, onSettingsChange }: DisplaySettingsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h4 className="text-lg font-semibold mb-6 text-white">
        Configurações de Exibição
      </h4>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Position Settings */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-white mb-3">
            Posição dos Contatos
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`
              relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
              ${settings.contactsPosition === 'above'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-blue-800'
              }
            `}>
              <input
                type="radio"
                name="contactsPosition"
                value="above"
                checked={settings.contactsPosition === 'above'}
                onChange={(e) => onSettingsChange({ contactsPosition: e.target.value as 'above' | 'below' })}
                className="sr-only"
              />
              <div className="w-full h-24 mb-2 relative">
                <div className="absolute inset-x-0 top-0 h-6 bg-gray-700 rounded" />
                <div className="absolute inset-x-4 top-8 space-y-2">
                  <div className="h-3 bg-gray-600 rounded w-3/4" />
                  <div className="h-3 bg-gray-600 rounded w-1/2" />
                </div>
              </div>
              <span className="text-sm text-white">Acima das Redes</span>
              {settings.contactsPosition === 'above' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </label>

            <label className={`
              relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
              ${settings.contactsPosition === 'below'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-blue-800'
              }
            `}>
              <input
                type="radio"
                name="contactsPosition"
                value="below"
                checked={settings.contactsPosition === 'below'}
                onChange={(e) => onSettingsChange({ contactsPosition: e.target.value as 'above' | 'below' })}
                className="sr-only"
              />
              <div className="w-full h-24 mb-2 relative">
                <div className="absolute inset-x-4 top-2 space-y-2">
                  <div className="h-3 bg-gray-600 rounded w-3/4" />
                  <div className="h-3 bg-gray-600 rounded w-1/2" />
                </div>
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gray-700 rounded" />
              </div>
              <span className="text-sm text-white">Abaixo das Redes</span>
              {settings.contactsPosition === 'below' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Display Format Settings */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-white mb-3">
            Formato de Exibição
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`
              relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
              ${settings.displayFormat === 'username'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-blue-800'
              }
            `}>
              <input
                type="radio"
                name="displayFormat"
                value="username"
                checked={settings.displayFormat === 'username'}
                onChange={(e) => onSettingsChange({ displayFormat: e.target.value as 'username' | 'network' })}
                className="sr-only"
              />
              <div className="w-full h-24 mb-2 flex items-center justify-center">
                <div className="px-4 py-2 bg-gray-700 rounded-full">
                  @exemplo
                </div>
              </div>
              <span className="text-sm text-white">Nome de Usuário</span>
              {settings.displayFormat === 'username' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </label>

            <label className={`
              relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
              ${settings.displayFormat === 'network'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-blue-800'
              }
            `}>
              <input
                type="radio"
                name="displayFormat"
                value="network"
                checked={settings.displayFormat === 'network'}
                onChange={(e) => onSettingsChange({ displayFormat: e.target.value as 'username' | 'network' })}
                className="sr-only"
              />
              <div className="w-full h-24 mb-2 flex items-center justify-center">
                <div className="px-4 py-2 bg-gray-700 rounded-full">
                  Instagram
                </div>
              </div>
              <span className="text-sm text-white">Nome da Rede</span>
              {settings.displayFormat === 'network' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}