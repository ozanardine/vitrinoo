import React from 'react';
import { X, Check } from 'lucide-react';
import { SOCIAL_NETWORKS } from '../../../../../lib/constants';

interface SocialLinkProps {
  link: {
    type: string;
    url: string;
  };
  index: number;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  isValid: boolean;
  showError: boolean;
  displayValue: string;
}

export function SocialLinkItem({
  link,
  index,
  onUpdate,
  onRemove,
  isValid,
  showError,
  displayValue
}: SocialLinkProps) {
  const network = SOCIAL_NETWORKS[link.type as keyof typeof SOCIAL_NETWORKS];
  if (!network) return null;

  const Icon = network.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <input
              type={network.type === 'email' ? 'email' : 'text'}
              value={link.url}
              onChange={(e) => onUpdate(index, e.target.value)}
              placeholder={network.placeholder}
              className={`flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 ${
                showError ? 'border-red-500' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
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
          <span>{displayValue}</span>
        </div>
      )}
    </div>
  );
}