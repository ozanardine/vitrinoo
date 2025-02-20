import { memo } from 'react';
import { ColorPicker } from '../ColorPicker';

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
  presets?: readonly string[];
}

export const ColorPickerField = memo(function ColorPickerField({
  label,
  value,
  onChange,
  description,
  presets
}: ColorPickerFieldProps) {
  return (
    <ColorPicker
      label={label}
      value={value}
      onChange={onChange}
      description={description}
      presets={presets}
    />
  );
});