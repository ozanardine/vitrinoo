import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getTinyAuthUrl } from '../../lib/tiny';

interface TinyConfigFormProps {
  storeId: string;
  onError: (message: string) => void;
  loading?: boolean;
}

export function TinyConfigForm({ storeId, onError, loading = false }: TinyConfigFormProps) {
  const [form, setForm] = useState({
    clientId: '',
    clientSecret: ''
  });

  const handleSubmit = () => {
    try {
      if (!form.clientId || !form.clientSecret) {
        onError('Por favor, preencha o Client ID e Client Secret');
        return;
      }

      // Gerar state aleatório para proteção CSRF
      const state = Math.random().toString(36).substring(7);

      // Salvar credenciais temporariamente
      sessionStorage.setItem('tiny_temp_credentials', JSON.stringify({
        clientId: form.clientId,
        clientSecret: form.clientSecret,
        storeId,
        savedState: state
      }));

      // Redirecionar para autenticação
      const redirectUri = `${window.location.origin}/tiny-callback`;
      const authUrl = getTinyAuthUrl(form.clientId, redirectUri, state);
      window.location.href = authUrl;
    } catch (error: any) {
      onError(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Client ID</label>
        <input
          type="text"
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Client Secret</label>
        <input
          type="password"
          value={form.clientSecret}
          onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Conectando...
          </span>
        ) : (
          'Conectar com Tiny ERP'
        )}
      </button>

      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
        <p>Para obter suas credenciais:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Acesse o painel do Tiny ERP</li>
          <li>Vá em &quot;Configurações &gt; API&quot;</li>
          <li>Crie um novo aplicativo com:
            <ul className="ml-6 mt-1 space-y-1 list-disc">
              <li>URL de Redirecionamento: {window.location.origin}/tiny-callback</li>
              <li>Escopo: openid</li>
            </ul>
          </li>
          <li>Copie o Client ID e Client Secret</li>
        </ol>
      </div>
    </div>
  );
}