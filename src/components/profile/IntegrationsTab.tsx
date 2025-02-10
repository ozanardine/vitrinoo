import React, { useState, useEffect } from 'react';
import { Link2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Store } from '../../lib/types';
import { checkTinyIntegrationStatus, syncTinyProducts } from '../../lib/tiny';
import { TinyConfigForm } from './TinyConfigForm';

interface IntegrationsTabProps {
  store: Store;
}

interface AlertMessage {
  type: 'success' | 'error';
  text: string;
}

export function IntegrationsTab({ store }: IntegrationsTabProps) {
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isIntegrated, setIsIntegrated] = useState(false);

  useEffect(() => {
    checkIntegrationStatus();
  }, [store.id]);

  const checkIntegrationStatus = async () => {
    try {
      const status = await checkTinyIntegrationStatus(store.id);
      setIsIntegrated(status);
    } catch (error) {
      console.error('Erro ao verificar status da integração:', error);
    }
  };

  const showAlert = (message: AlertMessage) => {
    setAlert(message);
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const count = await syncTinyProducts(store.id);
      showAlert({
        type: 'success',
        text: `${count} produtos sincronizados com sucesso!`
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.message || 'Erro ao sincronizar produtos'
      });
    } finally {
      setSyncing(false);
    }
  };

  if (store.subscription.plan_type !== 'plus') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Recurso Exclusivo Plus
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          A integração com ERPs está disponível apenas para assinantes do plano Plus.
          Faça upgrade do seu plano para acessar este recurso.
        </p>
        <button className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
          Fazer Upgrade
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {alert && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          alert.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100' 
            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100'
        }`}>
          {alert.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{alert.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Link2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Tiny ERP</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sincronize seus produtos automaticamente com o Tiny ERP
            </p>
          </div>
        </div>

        {isIntegrated ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <Check className="w-5 h-5" />
              <span>Integração ativa</span>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sincronizando produtos...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  <span>Sincronizar Produtos</span>
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Os produtos serão atualizados automaticamente a cada hora
            </p>
          </div>
        ) : (
          <TinyConfigForm
            storeId={store.id}
            loading={loading}
            onError={(message) => showAlert({ type: 'error', text: message })}
          />
        )}
      </div>
    </div>
  );
}