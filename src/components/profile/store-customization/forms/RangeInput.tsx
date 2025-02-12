import React from 'react';

interface RangeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: string;
  max: string;
  step?: string;
  unit?: string;
  description?: string;
}

export function RangeInput({
  label,
  value,
  onChange,
  min,
  max,
  step = "1",
  unit,
  description
}: RangeInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          min={min}
          max={max}
          step={step}
        />
        {unit && <span className="text-gray-500">{unit}</span>}
      </div>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
}