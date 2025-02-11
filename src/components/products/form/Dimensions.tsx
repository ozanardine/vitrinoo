import React from 'react';

interface DimensionsProps {
  form: any;
  setForm: (form: any) => void;
}

export function Dimensions({ form, setForm }: DimensionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Dimensões e Peso</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Comprimento</label>
          <input
            type="number"
            value={form.dimensions.length}
            onChange={(e) => setForm({
              ...form,
              dimensions: {
                ...form.dimensions,
                length: parseFloat(e.target.value)
              }
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Largura</label>
          <input
            type="number"
            value={form.dimensions.width}
            onChange={(e) => setForm({
              ...form,
              dimensions: {
                ...form.dimensions,
                width: parseFloat(e.target.value)
              }
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Altura</label>
          <input
            type="number"
            value={form.dimensions.height}
            onChange={(e) => setForm({
              ...form,
              dimensions: {
                ...form.dimensions,
                height: parseFloat(e.target.value)
              }
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unidade</label>
          <select
            value={form.dimensions.unit}
            onChange={(e) => setForm({
              ...form,
              dimensions: {
                ...form.dimensions,
                unit: e.target.value
              }
            })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="cm">Centímetro (cm)</option>
            <option value="m">Metro (m)</option>
            <option value="mm">Milímetro (mm)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Peso</label>
          <input
            type="number"
            value={form.weight || ''}
            onChange={(e) => setForm({ ...form, weight: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            min="0"
            step="0.001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unidade de Peso</label>
          <select
            value={form.weight_unit}
            onChange={(e) => setForm({ ...form, weight_unit: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="kg">Quilograma (kg)</option>
            <option value="g">Grama (g)</option>
          </select>
        </div>
      </div>
    </div>
  );
}