import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
  presets?: string[];
}

export function ColorPicker({ label, value, onChange, description, presets }: ColorPickerProps) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: value }}
          aria-label="Abrir seletor de cores"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          pattern="^#[0-9A-Fa-f]{6}$"
          placeholder="#000000"
        />
      </div>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      )}

      {showPresets && presets && presets.length > 0 && (
        <div className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-full">
          <div className="grid grid-cols-6 gap-2">
            {presets.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onChange(preset);
                  setShowPresets(false);
                }}
                className="relative w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:scale-110 transition-transform"
                style={{ backgroundColor: preset }}
                aria-label={`Selecionar cor ${preset}`}
              >
                {value.toLowerCase() === preset.toLowerCase() && (
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
                value={value}
                onChange={(e) => onChange(e.target.value)}
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
