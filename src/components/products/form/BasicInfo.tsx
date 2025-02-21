import { Search } from 'lucide-react';
import { ProductTypeSelector } from '../ProductTypeSelector';

interface BasicInfoProps {
  form: any;
  setForm: (form: any) => void;
  productType: 'simple' | 'variable' | 'kit' | 'manufactured' | 'service';
  setProductType: (type: 'simple' | 'variable' | 'kit' | 'manufactured' | 'service') => void;
  categories: any[];
  onOpenCategoryModal: () => void;
  disabled?: boolean;
}

export function BasicInfo({
  form,
  setForm,
  productType,
  setProductType,
  categories,
  onOpenCategoryModal,
  disabled
}: BasicInfoProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Informações Básicas</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Tipo do Produto</label>
        <ProductTypeSelector
          value={productType}
          onChange={setProductType}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenCategoryModal}
              className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-left"
            >
              {categories.find(c => c.id === form.category_id)?.name || 'Selecionar categoria'}
            </button>
            <button
              type="button"
              onClick={onOpenCategoryModal}
              className="p-2 border rounded dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Marca</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Preço</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">R$</span>
            <input
              type="number"
              value={form.price || ''}
              onChange={(e) => setForm({ ...form, price: e.target.value ? parseFloat(e.target.value) : 0 })}
              className="w-full p-2 pl-10 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Preço Promocional</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">R$</span>
            <input
              type="number"
              value={form.promotional_price || ''}
              onChange={(e) => setForm({ ...form, promotional_price: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full p-2 pl-10 border rounded dark:bg-gray-700 dark:border-gray-600"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>
    </div>
  );
}