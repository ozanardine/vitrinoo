import React, { useState } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Store } from '../../lib/types';
import { createCheckoutSession, createPortalSession, Plan } from '../../lib/stripe';
import { PLAN_LIMITS } from '../../lib/store';

interface PlansTabProps {
  store: Store;
  plans: Plan[];
}

export function PlansTab({ store, plans }: PlansTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrialAlert, setShowTrialAlert] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    // Se estiver em trial, mostrar alerta
    if (store.subscription.status === 'trialing') {
      setShowTrialAlert(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createCheckoutSession(priceId, store.id);
    } catch (error: any) {
      console.error('Erro ao iniciar upgrade:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      await createPortalSession();
    } catch (error: any) {
      console.error('Erro ao acessar portal:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const currentPlanType = store.subscription.plan_type as keyof typeof PLAN_LIMITS;
  const currentPlanLimits = PLAN_LIMITS[currentPlanType];

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showTrialAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Você está no período de demonstração</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você já está usando todos os recursos do plano Plus gratuitamente durante o período de demonstração.
              Após o término do período de demonstração, você poderá escolher um plano para continuar.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTrialAlert(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Planos e Preços</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o plano ideal para o seu negócio
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {Array.isArray(plans) && plans
          .filter(plan => !plan.name.toLowerCase().includes('demonstra'))
          .sort((a, b) => {
            const order = { gratuito: 0, básico: 1, plus: 2 };
            const aOrder = order[a.name.toLowerCase() as keyof typeof order] || 0;
            const bOrder = order[b.name.toLowerCase() as keyof typeof order] || 0;
            return aOrder - bOrder;
          })
          .map((plan) => {
          const planType = plan.name.toLowerCase();
          const isCurrentPlan = store.subscription.plan_type === planType;
          
          return (
            <div
              key={`plan-${plan.price?.id || plan.name.toLowerCase()}`}
              className={`rounded-lg border ${
                isCurrentPlan
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800 overflow-hidden`}
            >
              {isCurrentPlan && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                  Plano Atual
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold mb-6">
                  {plan.price?.amount ? formatPrice(plan.price.amount / 100) : 'Grátis'}
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                    /mês
                  </span>
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Até {planType === 'gratuito' ? '100' : planType === 'básico' ? '1.000' : '10.000'} produtos</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Até {planType === 'gratuito' ? '10' : planType === 'básico' ? '50' : '200'} categorias principais</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Até {planType === 'gratuito' ? '3' : planType === 'básico' ? '5' : '10'} imagens por produto</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Link compartilhável</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>SSL gratuito</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Suporte por email</span>
                  </li>
                  {planType === 'básico' && (
                    <>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Domínio personalizado</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Upload de imagens</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Suporte prioritário</span>
                      </li>
                    </>
                  )}
                  {planType === 'plus' && (
                    <>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <span>Domínio personalizado</span>
                    </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Upload de imagens</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Integração com ERP</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>API REST</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Geração de descrições com IA</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Suporte prioritário</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-2" />
                        <span>Análises avançadas</span>
                      </li>
                    </>
                  )}
                </ul>

                {isCurrentPlan ? (
                  <button
                    onClick={handleManageSubscription}
                    className={`w-full py-2 px-4 border rounded-lg font-medium disabled:opacity-50 ${
                      store.subscription.status === 'trialing'
                        ? 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900'
                        : 'border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900'
                    }`}
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : store.subscription.status === 'trialing' ? 'Plano de Demonstração Ativo' : 'Gerenciar Assinatura'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.price?.id)}
                    disabled={!plan.price?.id || loading || plan.price.amount === 0}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      !plan.price?.amount || plan.price.amount === 0
                        ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Processando...' : (!plan.price?.amount || plan.price.amount === 0) ? 'Começar Grátis' : 'Fazer Upgrade'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          Todos os planos incluem SSL gratuito e suporte técnico.
          <br />
          Cancele a qualquer momento sem taxas adicionais.
        </p>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Processando...</span>
          </div>
        </div>
      )}
    </div>
  );
}