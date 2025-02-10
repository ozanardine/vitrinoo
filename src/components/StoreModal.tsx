import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';

interface StoreModalProps {
  onSuccess: () => void;
}

export function StoreModal({ onSuccess }: StoreModalProps) {
  const { user } = useStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSlugChange = (value: string) => {
    // Remove special characters and spaces, convert to lowercase
    const formattedSlug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(formattedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Criar a loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            user_id: user?.id,
            name,
            slug,
          }
        ])
        .select()
        .single();

      if (storeError) throw storeError;

      // Criar a assinatura gratuita
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([
          {
            store_id: store.id,
            plan_type: 'free',
            active: true,
          }
        ]);

      if (subscriptionError) throw subscriptionError;

      onSuccess();
    } catch (err: any) {
      if (err.code === '23505') {
        setError('Esta URL já está em uso. Por favor, escolha outra.');
      } else {
        setError('Erro ao criar loja. Por favor, tente novamente.');
        console.error('Erro:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full relative">
        <h2 className="text-2xl font-bold mb-6">Criar Nova Loja</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Loja</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  handleSlugChange(e.target.value);
                }
              }}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL da Loja</label>
            <div className="flex items-center">
              <span className="text-gray-500 dark:text-gray-400 mr-1">
                {window.location.origin}/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                required
                pattern="[a-z0-9-]+"
                title="Apenas letras minúsculas, números e hífens são permitidos"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Esta será a URL pública do seu catálogo
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Loja'}
          </button>
        </form>
      </div>
    </div>
  );
}