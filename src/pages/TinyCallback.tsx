import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { exchangeCodeForToken, saveTinyCredentials } from '../lib/tiny';

export function TinyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code) {
          throw new Error('Código de autorização não encontrado');
        }

        // Recuperar e validar state
        const tempCredentials = sessionStorage.getItem('tiny_temp_credentials');
        if (!tempCredentials) {
          throw new Error('Credenciais temporárias não encontradas');
        }

        const { clientId, clientSecret, storeId, savedState } = JSON.parse(tempCredentials);
        
        if (state !== savedState) {
          throw new Error('Estado inválido - possível ataque CSRF');
        }

        // Limpar credenciais temporárias
        sessionStorage.removeItem('tiny_temp_credentials');

        // Trocar código por tokens
        const redirectUri = `${window.location.origin}/tiny-callback`;
        
        try {
          const { 
            access_token, 
            refresh_token, 
            expires_in 
          } = await exchangeCodeForToken(
            code,
            clientId,
            clientSecret,
            redirectUri
          );

          // Salvar credenciais
          await saveTinyCredentials(
            storeId,
            clientId,
            clientSecret,
            access_token,
            refresh_token,
            expires_in
          );

          // Redirecionar de volta para o perfil
          navigate('/profile?tab=integrations&success=true');
        } catch (tokenError: any) {
          throw new Error(`Erro na autenticação: ${tokenError.message}`);
        }
      } catch (err: any) {
        console.error('Erro no callback:', err);
        setError(err.message || 'Erro ao processar autenticação');
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Erro na Integração
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/profile?tab=integrations')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
          >
            Voltar para Integrações
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Processando autenticação com Tiny ERP...
        </p>
      </div>
    </div>
  );
}