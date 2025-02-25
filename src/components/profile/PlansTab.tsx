import React, { useState, useEffect } from 'react';
import { Check, Loader2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Store } from '../../lib/types';
import { createCheckoutSession, createPortalSession, Plan } from '../../lib/stripe-improved';
import { PlanType, getPlanLimits } from '../../lib/plans';
import { AppError, ErrorCategory } from '../../lib/errors';
import { toast } from 'react-toastify';

interface PlansTabProps {
  store: Store;
  plans: Plan[];
}

interface PlanFeature {
  text: string;
  plans: ('gratuito' | 'básico' | 'plus')[];
  getLimit?: (type: string) => string;
}

interface AlertState {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  details?: string;
  autoHide?: boolean;
}

const PLAN_FEATURES: PlanFeature[] = [
  {
    text: "Produtos",
    plans: ['gratuito', 'básico', 'plus'],
    getLimit: (type: string) => getPlanLimits(type as PlanType).products.toLocaleString()
  },
  {
    text: "Categorias principais",
    plans: ['gratuito', 'básico', 'plus'],
    getLimit: (type: string) => getPlanLimits(type as PlanType).categories.toLocaleString()
  },
  {
    text: "Imagens por produto",
    plans: ['gratuito', 'básico', 'plus'],
    getLimit: (type: string) => getPlanLimits(type as PlanType).images_per_product.toString()
  },
  {
    text: "Link compartilhável",
    plans: ['gratuito', 'básico', 'plus']
  },
  {
    text: "Upload de imagens",
    plans: ['gratuito', 'básico', 'plus']
  },
  {
    text: "Suporte prioritário",
    plans: ['básico', 'plus']
  },
  {
    text: "Integração com ERP",
    plans: ['plus']
  },
  {
    text: "Geração de descrições com IA",
    plans: ['plus']
  }
];

const PlanFeatures = ({ plan }: { plan: Plan }) => {
  const getPlanType = (plan: Plan): 'gratuito' | 'básico' | 'plus' => {
    const planType = plan.metadata.plan_type as PlanType;
    switch (planType) {
      case 'free': return 'gratuito';
      case 'basic': return 'básico';
      case 'plus': return 'plus';
      default: return 'gratuito';
    }
  };

  const planType = getPlanType(plan);

  return (
    <ul className="space-y-3 mb-8">
      {PLAN_FEATURES.map((feature, index) => {
        if (!feature.plans.includes(planType as any)) return null;

        return (
          <li key={index} className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            <span>
              {feature.getLimit 
                ? `Até ${feature.getLimit(plan.metadata.plan_type)} ${feature.text}`
                : feature.text
              }
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export function PlansTab({ store, plans }: PlansTabProps) {
  const [loading, setLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [showTrialAlert, setShowTrialAlert] = useState(false);
  const [processingState, setProcessingState] = useState<
    'idle' | 'preparing' | 'redirecting' | 'processing'
  >('idle');

  // Limpar alertas após um tempo
  useEffect(() => {
    if (alert?.autoHide) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleUpgrade = async (priceId: string) => {
    // Se estiver em trial, perguntar antes
    if (store.subscription.status === 'trialing') {
      setShowTrialAlert(true);
      return;
    }

    try {
      // Atualizar estado de loading e identificar qual plano está sendo processado
      setLoading(true);
      setLoadingPlanId(priceId);
      setProcessingState('preparing');
      setAlert(null);
      
      // Mostrar toast durante o processo
      const loadingToast = toast.loading('Preparando checkout...');
      
      // Chamar API com timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 15000);
      });
      
      const sessionPromise = createCheckoutSession(priceId, store.id);
      
      // Race entre timeout e resposta real
      await Promise.race([sessionPromise, timeoutPromise]);
      
      // Atualizar estado antes do redirecionamento
      toast.update(loadingToast, { 
        render: 'Redirecionando para o checkout...', 
        type: 'info',
        isLoading: true
      });
      
      setProcessingState('redirecting');
      
      // Continuar com o processamento (isso vai redirecionar via stripe-improved.ts)
      await sessionPromise;
      
      // Limpar toast após sucesso
      toast.dismiss(loadingToast);

    } catch (error) {
      // Converter para AppError se necessário
      const appError = error instanceof AppError ? error : new AppError({
        category: ErrorCategory.PAYMENT,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        originalError: error
      });
      
      // Mostrar erro no console
      console.error('Erro ao iniciar upgrade:', appError);
      
      // Atualizar UI com erro
      setAlert({
        type: 'error',
        message: appError.message,
        details: appError.category === ErrorCategory.PAYMENT 
          ? 'Problema com o processamento do pagamento' 
          : 'Não foi possível iniciar o processo de pagamento'
      });
      
      // Mostrar toast de erro
      toast.error(appError.message);
    } finally {
      setLoading(false);
      setLoadingPlanId(null);
      setProcessingState('idle');
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      setProcessingState('preparing');
      setAlert(null);
      
      // Mostrar toast durante o processo
      const loadingToast = toast.loading('Acessando portal de pagamento...');
      
      // Chamar portal com timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 15000);
      });
      
      const portalPromise = createPortalSession();
      
      // Race entre timeout e resposta real
      await Promise.race([portalPromise, timeoutPromise]);
      
      // Atualizar estado antes do redirecionamento
      toast.update(loadingToast, { 
        render: 'Redirecionando para o portal...', 
        type: 'info',
        isLoading: true
      });
      
      setProcessingState('redirecting');
      
      // Continuar com o processamento (isso vai redirecionar)
      await portalPromise;
      
      // Limpar toast após sucesso
      toast.dismiss(loadingToast);
      
    } catch (error) {
      // Converter para AppError
      const appError = error instanceof AppError ? error : new AppError({
        category: ErrorCategory.PAYMENT,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        originalError: error
      });
      
      console.error('Erro ao acessar portal:', appError);
      
      setAlert({
        type: 'error',
        message: appError.message,
        details: 'Problema ao acessar o portal de pagamento'
      });
      
      toast.error(appError.message);
    } finally {
      setLoading(false);
      setProcessingState('idle');
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const sortPlans = (plans: Plan[]) => {
    const planOrder = {
      'free': 0,
      'basic': 1,
      'plus': 2
    };

    return plans.sort((a, b) => {
      const aOrder = planOrder[a.metadata.plan_type];
      const bOrder = planOrder[b.metadata.plan_type];
      return aOrder - bOrder;
    });
  };

  // Renderizar ícone de alerta apropriado
  const renderAlertIcon = () => {
    switch(alert?.type) {
      case 'success': return <Check className="w-5 h-5 flex-shrink-0" />;
      case 'error': return <AlertCircle className="w-5 h-5 flex-shrink-0" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
      case 'info': return <Info className="w-5 h-5 flex-shrink-0" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Alertas */}
      {alert && (
        <div className={`p-4 rounded-lg flex items-start space-x-3 ${
          alert.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-100 border border-green-200 dark:border-green-800' 
            : alert.type === 'error'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-100 border border-red-200 dark:border-red-800'
            : alert.type === 'warning'
            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-100 border border-yellow-200 dark:border-yellow-800'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
        }`}>
          {renderAlertIcon()}
          <div className="flex-1">
            <span className="font-medium">{alert.message}</span>
            {alert.details && (
              <p className="text-sm mt-1 opacity-80">{alert.details}</p>
            )}
          </div>
          <button 
            onClick={() => setAlert(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal de confirmação para usuários em trial */}
      {showTrialAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl transform transition-transform duration-300 scale-100">
            <h3 className="text-xl font-semibold mb-4">Você está no período de demonstração</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você já está usando todos os recursos do plano Plus gratuitamente durante o período de demonstração.
              Após o término do período de demonstração, você poderá escolher um plano para continuar.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTrialAlert(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
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

      {/* Cards de Planos */}
      <div className="grid md:grid-cols-3 gap-8">
        {Array.isArray(plans) && sortPlans(plans)
          .filter(plan => !plan.metadata.is_trial)
          .map((plan) => {
            const isCurrentPlan = store.subscription.plan_type === plan.metadata.plan_type;
            const isLoading = loading && loadingPlanId === plan.price?.id;

            return (
              <div
                key={`plan-${plan.price?.id || plan.metadata.plan_type}`}
                className={`rounded-lg border transition-all duration-300 ${
                  isCurrentPlan
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
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

                  <PlanFeatures plan={plan} />

                  {isCurrentPlan ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={loading || processingState !== 'idle'}
                      className={`w-full py-2 px-4 border rounded-lg font-medium transition-all ${
                        store.subscription.status === 'trialing'
                          ? 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processando...</span>
                        </div>
                      ) : store.subscription.status === 'trialing' 
                        ? 'Plano de Demonstração Ativo' 
                        : 'Gerenciar Assinatura'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.price?.id)}
                      disabled={!plan.price?.id || loading || plan.price.amount === 0 || processingState !== 'idle'}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                        !plan.price?.amount || plan.price.amount === 0
                          ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            {processingState === 'preparing' ? 'Preparando...' : 
                             processingState === 'redirecting' ? 'Redirecionando...' : 
                             'Processando...'}
                          </span>
                        </div>
                      ) : (!plan.price?.amount || plan.price.amount === 0) 
                        ? 'Começar Grátis' 
                        : 'Fazer Upgrade'}
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

      {/* Overlay de carregamento global */}
      {loading && processingState === 'redirecting' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg flex flex-col items-center space-y-4 max-w-sm text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Redirecionando para pagamento</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Você será redirecionado para a página de pagamento em instantes...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}