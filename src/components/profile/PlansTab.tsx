import React from 'react';
import { Check, X } from 'lucide-react';
import { Store } from '../../lib/types';
import { createCheckoutSession, createPortalSession, Plan } from '../../lib/stripe';

interface PlansTabProps {
  store: Store;
  plans: Plan[];
}

export function PlansTab({ store, plans }: PlansTabProps) {
  const handleUpgrade = async (priceId: string) => {
    try {
      await createCheckoutSession(priceId, store.id);
    } catch (error: any) {
      console.error('Erro ao iniciar upgrade:', error);
      alert(error.message);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await createPortalSession();
    } catch (error: any) {
      console.error('Erro ao acessar portal:', error);
      alert(error.message);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Planos e Preços</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Escolha o plano ideal para o seu negócio
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = store.subscription.plan_type === plan.name.toLowerCase();
          const features = plan.features;

          return (
            <div
              key={plan.id}
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
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <p className="text-4xl font-bold">
                    {plan.price.amount === 0 ? (
                      'Grátis'
                    ) : (
                      <>
                        {formatPrice(plan.price.amount)}
                        <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                          /mês
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>
                      {features.products === -1
                        ? 'Produtos ilimitados'
                        : `Até ${features.products} produtos`}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>
                      {features.categories === -1
                        ? 'Categorias ilimitadas'
                        : `Até ${features.categories} categorias`}
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>
                      Até {features.images_per_product} imagens por produto
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    {features.custom_domain ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    <span>Domínio personalizado</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    {features.analytics ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    <span>Analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    {features.erp_integration ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    <span>Integração com ERP</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>
                      Suporte {features.support === 'priority' ? 'prioritário' : 'por email'}
                    </span>
                  </li>
                </ul>

                {isCurrentPlan ? (
                  <button
                    onClick={handleManageSubscription}
                    className="w-full py-2 px-4 border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg font-medium"
                  >
                    Gerenciar Assinatura
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full py-2 px-4 rounded-lg font-medium ${
                      plan.price.amount === 0
                        ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {plan.price.amount === 0 ? 'Começar Grátis' : 'Fazer Upgrade'}
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
    </div>
  );
}