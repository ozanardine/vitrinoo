import React, { useState } from 'react';
import { Store, Globe, AlertCircle, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';

interface FormData {
  name: string;
  slug: string;
  description: string;
}

interface StoreModalProps {
  onSuccess: () => void;
}

export function StoreModal({ onSuccess }: StoreModalProps) {
  const { user } = useStore();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleSlugChange = (value: string) => {
    // Remove special characters and spaces, convert to lowercase
    const formattedSlug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setFormData(prev => ({ ...prev, slug: formattedSlug }));
    checkSlugAvailability(formattedSlug);
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) {
      setSlugAvailable(null);
      return;
    }

    setSlugChecking(true);
    try {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      setSlugAvailable(!data);
    } catch (err) {
      console.error('Erro ao verificar slug:', err);
    } finally {
      setSlugChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name || !formData.slug) {
        throw new Error('Nome e URL são obrigatórios');
      }

      if (!slugAvailable) {
        throw new Error('Esta URL já está em uso. Por favor, escolha outra.');
      }

      // Criar a loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            user_id: user?.id,
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null
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
      setError(err.message || 'Erro ao criar loja. Por favor, tente novamente.');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Store className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Criar Nova Loja</h2>
          </div>
          <p className="text-blue-100">
            {step === 1 
              ? 'Vamos começar! Primeiro, escolha um nome para sua loja.'
              : 'Ótimo! Agora, vamos configurar a URL da sua loja.'}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step > 1 ? <Check className="w-5 h-5" /> : '1'}
                </div>
                <div className="flex-1 h-1 mx-2 bg-gray-200">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: step === 1 ? '0%' : '100%' }}
                  />
                </div>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  2
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm font-medium">Informações Básicas</span>
                <span className="text-sm font-medium">URL da Loja</span>
              </div>
            </div>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 1) {
                setStep(2);
              } else {
                handleSubmit(e);
              }
            }} 
            className="space-y-6"
          >
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Loja</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ex: Minha Loja Incrível"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Descreva sua loja em poucas palavras..."
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">URL da Loja</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`
                    w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                    ${slugAvailable === true ? 'border-green-500 dark:border-green-500' : 
                      slugAvailable === false ? 'border-red-500 dark:border-red-500' : 
                      'border-gray-200 dark:border-gray-600'}
                  `}
                  placeholder="minha-loja"
                  required
                  pattern="[a-z0-9-]+"
                  title="Apenas letras minúsculas, números e hífens são permitidos"
                />
                
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>
                    URL da sua loja: {window.location.origin}/{formData.slug || 'minha-loja'}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2 h-6">
                  {slugChecking ? (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando disponibilidade...
                    </div>
                  ) : slugAvailable === true ? (
                    <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      URL disponível!
                    </div>
                  ) : slugAvailable === false ? (
                    <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      URL já está em uso
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Voltar
                </button>
              )}
              <div className={step === 1 ? 'ml-auto' : ''}>
                {step === 1 ? (
                  <button
                    type="submit"
                    disabled={!formData.name}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !slugAvailable}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Criando...</span>
                      </>
                    ) : (
                      'Criar Loja'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}