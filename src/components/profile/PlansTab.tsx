import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
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

  const handleUpgrade = async (priceId: string) => {
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

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Planos e Preços</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o plano ideal para o seu negócio
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
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
                  {formatPrice(plan.price.amount / 100)}
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                    /mês
                  </span>
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>
                      {plan.features.products === Infinity
                        ? 'Produtos ilimitados'
                        : `Até ${plan.features.products.toLocaleString()} produtos`}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>
                      {plan.features.categories === Infinity
                        ? 'Categorias ilimitadas'
                        : `Até ${plan.features.categories.toLocaleString()} categorias`}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>
                      Até {plan.features.images_per_product} imagens por produto
                    </span>
                  </li>
                  {plan.features.custom_domain && (
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      <span>Domínio personalizado</span>
                    </li>
                  )}
                  {plan.features.erp_integration && (
                    <>
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
                        <span>Suporte prioritário</span>
                      </li>
                    </>
                  )}
                </ul>

                {isCurrentPlan ? (
                  <button
                    onClick={handleManageSubscription}
                    className="w-full py-2 px-4 border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg font-medium disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : 'Gerenciar Assinatura'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.price?.id)}
                    disabled={!plan.price?.id || loading || plan.price.amount === 0}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      plan.price.amount === 0
                        ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Processando...' : plan.price.amount === 0 ? 'Começar Grátis' : 'Fazer Upgrade'}
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