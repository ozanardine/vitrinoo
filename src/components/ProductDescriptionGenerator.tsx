import React, { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { generateProductDescription } from '../lib/gemini';

interface ProductDescriptionGeneratorProps {
  title: string;
  brand: string;
  category: string;
  onGenerate: (description: string) => void;
  disabled?: boolean;
}

export function ProductDescriptionGenerator({
  title,
  brand,
  category,
  onGenerate,
  disabled
}: ProductDescriptionGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleGenerate = async () => {
    if (!title || !brand) {
      setError('Preencha o título e a marca do produto primeiro.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const description = await generateProductDescription(
        title,
        brand,
        category,
        additionalInfo
      );
      onGenerate(description);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Wand2 className="w-5 h-5" />
            <span>Geração automática de descrição</span>
          </div>
          <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
            Plus
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Disponível apenas para assinantes do plano Plus
        </p>
      </div>
    );
  }

  return (
    <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Gerar descrição com IA</span>
        </div>
        <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
          Plus
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Informações adicionais para melhorar a descrição (opcional)"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
            rows={2}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !title || !brand}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gerando...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>Gerar Descrição</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}