import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
  presets?: readonly string[];
  error?: string;
}

export function ColorPicker({ 
  label, 
  value = '#000000', // Valor padrão para evitar input uncontrolled
  onChange, 
  description, 
  presets,
  error 
}: ColorPickerProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // Sincroniza o input local com o valor da prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fecha o menu de presets ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Valida e formata a cor
  const validateColor = useCallback((color: string): string | null => {
    // Aceita cores em hex com ou sem #
    const hexRegex = /^#?([0-9A-Fa-f]{6})$/;
    const match = color.match(hexRegex);
    
    if (match) {
      return `#${match[1]}`;
    }
    return null;
  }, []);

  // Handler para mudança do input
  const handleInputChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    
    // Remove espaços e força lowercase
    const cleanValue = newValue.trim().toLowerCase();
    
    // Adiciona # se necessário
    const colorValue = cleanValue.startsWith('#') ? cleanValue : `#${cleanValue}`;
    
    // Valida e atualiza apenas se for uma cor válida
    const validColor = validateColor(colorValue);
    if (validColor) {
      onChange(validColor);
    }
  }, [onChange, validateColor]);

  // Handler para o color picker nativo
  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    onChange(newColor);
  }, [onChange]);

  return (
    <div className="relative" ref={pickerRef}>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 
            overflow-hidden shadow-sm hover:shadow-md transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: validateColor(inputValue) || value }}
          aria-label="Abrir seletor de cores"
        />
        
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`w-full p-2 pr-8 border rounded dark:bg-gray-700 dark:border-gray-600
              transition-colors duration-200
              ${error ? 'border-red-500' : 'focus:border-blue-500'} 
              focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            placeholder="#000000"
          />
          
          {inputValue && (
            <button
              type="button"
              onClick={() => handleInputChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 
                text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      )}

      {showPresets && presets && presets.length > 0 && (
        <div className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg 
          shadow-lg border border-gray-200 dark:border-gray-700 w-full">
          <div className="grid grid-cols-6 gap-2">
            {presets.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  handleInputChange(preset);
                  setShowPresets(false);
                }}
                className="relative w-8 h-8 rounded-lg border border-gray-200 
                  dark:border-gray-700 overflow-hidden hover:scale-110 
                  transition-transform duration-200 focus:outline-none 
                  focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: preset }}
                aria-label={`Selecionar cor ${preset}`}
              >
                {inputValue.toLowerCase() === preset.toLowerCase() && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={validateColor(inputValue) || value}
                onChange={handleColorPickerChange}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Ou escolha uma cor personalizada
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}