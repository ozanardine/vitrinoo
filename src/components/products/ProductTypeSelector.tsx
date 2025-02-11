import React from 'react';
import { Package, Layers, Box, Cog, Briefcase } from 'lucide-react';

interface ProductTypeSelectorProps {
  value: 'simple' | 'variable' | 'kit' | 'manufactured' | 'service';
  onChange: (type: 'simple' | 'variable' | 'kit' | 'manufactured' | 'service') => void;
  disabled?: boolean;
}

export function ProductTypeSelector({ value, onChange, disabled }: ProductTypeSelectorProps) {
  const types = [
    {
      id: 'simple',
      name: 'Produto Simples',
      description: 'Produto único sem variações',
      icon: Package
    },
    {
      id: 'variable',
      name: 'Produto com Variações',
      description: 'Produto com diferentes opções (cor, tamanho, etc)',
      icon: Layers
    },
    {
      id: 'kit',
      name: 'Kit/Combo',
      description: 'Conjunto de produtos vendidos juntos',
      icon: Box
    },
    {
      id: 'manufactured',
      name: 'Produto Fabricado',
      description: 'Produto montado a partir de componentes',
      icon: Cog
    },
    {
      id: 'service',
      name: 'Serviço',
      description: 'Serviço prestado com duração e disponibilidade',
      icon: Briefcase
    }
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {types.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.id;
        
        return (
          <button
            key={type.id}
            onClick={() => onChange(type.id)}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium">{type.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {type.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}