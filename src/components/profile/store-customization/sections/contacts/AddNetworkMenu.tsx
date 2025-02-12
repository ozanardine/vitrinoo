import React from 'react';
import { SOCIAL_NETWORKS } from '../../../../../lib/constants';

interface AddNetworkMenuProps {
  onSelect: (type: string) => void;
  usedTypes: Set<string>;
}

export function AddNetworkMenu({ onSelect, usedTypes }: AddNetworkMenuProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium mb-2">Escolha o tipo de contato</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {Object.entries(SOCIAL_NETWORKS).map(([type, network]) => {
          const isUsed = usedTypes.has(type);
          const Icon = network.icon;
          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              disabled={isUsed}
              className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isUsed ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{network.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}