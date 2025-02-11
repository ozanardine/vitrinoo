import React from 'react';
import { ProductDescriptionGenerator } from '../../ProductDescriptionGenerator';

interface DescriptionProps {
  form: any;
  setForm: (form: any) => void;
  title: string;
  brand: string;
  category: string;
  planType: string;
}

export function Description({
  form,
  setForm,
  title,
  brand,
  category,
  planType
}: DescriptionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Descrição</h3>
      
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
        rows={4}
      />
      
      <ProductDescriptionGenerator
        title={title}
        brand={brand}
        category={category}
        onGenerate={(description) => setForm({ ...form, description })}
        disabled={planType !== 'plus'}
      />
    </div>
  );
}