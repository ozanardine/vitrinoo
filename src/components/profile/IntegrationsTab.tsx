import React, { useState, useEffect } from 'react';
import { Link2, Check, AlertCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Store } from '../../lib/types';
import { checkTinyIntegrationStatus, syncTinyProducts, disconnectTinyIntegration } from '../../lib/tiny';
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
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

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

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectTinyIntegration(store.id);
      showAlert({
        type: 'success',
        text: 'Integração desconectada com sucesso!'
      });
      setIsIntegrated(false);
      setShowDisconnectConfirm(false);
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.message || 'Erro ao desconectar integração'
      });
    } finally {
      setLoading(false);
    }
  };

  if (store.subscription.plan_type !== 'plus') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
          Integrações com ERPs - Recurso Exclusivo Plus
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          As integrações com ERPs estarão disponíveis exclusivamente para assinantes do plano Plus.
          Esta funcionalidade está em desenvolvimento.
        </p>
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <ArrowRight className="w-5 h-5" />
            <span>Tiny ERP - Sem previsão</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <ArrowRight className="w-5 h-5" />
            <span>Bling - Sem previsão</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <ArrowRight className="w-5 h-5" />
            <span>Conta Azul - Sem previsão</span>
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
            Fazer Upgrade
          </button>
          <button className="px-4 py-2 border border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg">
            Receber Notificação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Integrações em Desenvolvimento
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          Nossas integrações com ERPs estão em fase final de desenvolvimento. 
          Como assinante Plus, você terá acesso prioritário assim que forem lançadas.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <ArrowRight className="w-5 h-5" />
            <span>Tiny ERP - Lançamento em Março/2024</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <ArrowRight className="w-5 h-5" />
            <span>Bling - Lançamento em Abril/2024</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <ArrowRight className="w-5 h-5" />
            <span>Conta Azul - Lançamento em Maio/2024</span>
          </div>
        </div>
      </div>

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
            <h3 className="text-lg font-semibold">Integrações com ERPs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sincronize seus produtos automaticamente com os principais sistemas de gestão
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
            Em Desenvolvimento
          </h4>
          <p className="text-yellow-700 dark:text-yellow-300 mb-6">
            Nossas integrações com ERPs estão em fase final de desenvolvimento.
            Como assinante Plus, você terá acesso prioritário assim que forem lançadas.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <ArrowRight className="w-5 h-5" />
              <span>Tiny ERP - Lançamento em Março/2024</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <ArrowRight className="w-5 h-5" />
              <span>Bling - Lançamento em Abril/2024</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <ArrowRight className="w-5 h-5" />
              <span>Conta Azul - Lançamento em Maio/2024</span>
            </div>
          </div>
          <button
            className="mt-6 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
          >
            Receber Notificação
          </button>
        </div>
      </div>
    </div>
  );
}