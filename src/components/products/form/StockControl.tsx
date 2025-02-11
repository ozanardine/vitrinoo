import React from 'react';

interface StockControlProps {
  form: any;
  setForm: (form: any) => void;
}

export function StockControl({ form, setForm }: StockControlProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Controle de Estoque</h3>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="stock_control"
          checked={form.stock_control}
          onChange={(e) => setForm({ ...form, stock_control: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="stock_control" className="text-sm">
          Controlar estoque
        </label>
      </div>

      {form.stock_control && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Atual</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="0"
              step="0.001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estoque Mínimo</label>
            <input
              type="number"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="0"
              step="0.001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estoque Máximo</label>
            <input
              type="number"
              value={form.max_stock || ''}
              onChange={(e) => setForm({ ...form, max_stock: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="0"
              step="0.001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unidade</label>
            <select
              value={form.stock_unit}
              onChange={(e) => setForm({ ...form, stock_unit: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="un">Unidade (un)</option>
              <option value="kg">Quilograma (kg)</option>
              <option value="g">Grama (g)</option>
              <option value="l">Litro (l)</option>
              <option value="ml">Mililitro (ml)</option>
              <option value="m">Metro (m)</option>
              <option value="cm">Centímetro (cm)</option>
              <option value="m2">Metro Quadrado (m²)</option>
              <option value="m3">Metro Cúbico (m³)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}