import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Check, AlertCircle, CreditCard, AlertTriangle } from 'lucide-react';

/**
 * Componente para exibir notificações relacionadas a pagamentos
 * Detecta parâmetros de URL após redirecionamentos do Stripe
 */
export const PaymentNotifications: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar parâmetros após redirecionamento do Stripe
    const sessionId = searchParams.get('session_id');
    const paymentSuccess = searchParams.get('payment_success');
    const paymentCancelled = searchParams.get('payment_cancelled');
    const error = searchParams.get('error');

    let toastShown = false;

    // Processar resultado de sucesso
    if (sessionId || paymentSuccess === 'true') {
      toast.success(
        <div className="flex items-start">
          <Check className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" />
          <div>
            <p className="font-medium">Pagamento processado com sucesso!</p>
            <p className="text-sm mt-1">Sua assinatura foi ativada.</p>
          </div>
        </div>,
        { autoClose: 6000 }
      );
      toastShown = true;

      // Salvar sessão no histórico para feedback posterior
      localStorage.setItem('lastPaymentSessionId', sessionId || 'success');
      localStorage.setItem('lastPaymentTimestamp', Date.now().toString());
    }

    // Processar cancelamento
    if (paymentCancelled === 'true') {
      toast.info(
        <div className="flex items-start">
          <CreditCard className="w-5 h-5 mr-2 flex-shrink-0 text-blue-500" />
          <div>
            <p className="font-medium">Processo de pagamento cancelado</p>
            <p className="text-sm mt-1">Você pode retomar o processo quando desejar.</p>
          </div>
        </div>,
        { autoClose: 5000 }
      );
      toastShown = true;
    }

    // Processar erro
    if (error) {
      const errorMessage = decodeURIComponent(error);
      toast.error(
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-medium">Erro no processamento do pagamento</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
        </div>,
        { autoClose: 8000 }
      );
      toastShown = true;
    }

    // Verificar se uma assinatura expirou
    const checkSubscriptionExpiry = () => {
      const expiryParam = searchParams.get('subscription_expired');
      if (expiryParam === 'true') {
        toast.warning(
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-yellow-500" />
            <div>
              <p className="font-medium">Sua assinatura expirou</p>
              <p className="text-sm mt-1">
                Os recursos premium foram desativados. Atualize sua assinatura para continuar.
              </p>
            </div>
          </div>,
          { autoClose: false }
        );
        toastShown = true;
      }
    };

    // Verificar se o trial está acabando
    const checkTrialEnding = () => {
      const trialDaysLeft = searchParams.get('trial_days_left');
      if (trialDaysLeft && parseInt(trialDaysLeft) <= 3) {
        const days = parseInt(trialDaysLeft);
        toast.info(
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-yellow-500" />
            <div>
              <p className="font-medium">Seu período de avaliação está terminando</p>
              <p className="text-sm mt-1">
                {days === 0
                  ? 'Seu período de avaliação termina hoje.'
                  : days === 1
                  ? 'Seu período de avaliação termina amanhã.'
                  : `Seu período de avaliação termina em ${days} dias.`}
              </p>
            </div>
          </div>,
          { autoClose: 10000 }
        );
        toastShown = true;
      }
    };

    // Verificar se é o primeiro acesso após ativação
    const checkFirstAccessAfterActivation = () => {
      const planActivated = searchParams.get('plan_activated');
      if (planActivated === 'true') {
        toast.success(
          <div className="flex items-start">
            <Check className="w-5 h-5 mr-2 flex-shrink-0 text-green-500" />
            <div>
              <p className="font-medium">Seu plano foi ativado!</p>
              <p className="text-sm mt-1">
                Aproveite todos os benefícios do seu plano {searchParams.get('plan_name') || 'premium'}.
              </p>
            </div>
          </div>,
          { autoClose: 8000 }
        );
        toastShown = true;
      }
    };

    // Chamar todas as verificações
    checkSubscriptionExpiry();
    checkTrialEnding();
    checkFirstAccessAfterActivation();

    // Limpar parâmetros da URL se exibimos algum toast
    if (toastShown) {
      // Remove os parâmetros processados para não mostrar novamente
      const params = new URLSearchParams(searchParams);
      params.delete('session_id');
      params.delete('payment_success');
      params.delete('payment_cancelled');
      params.delete('error');
      params.delete('subscription_expired');
      params.delete('trial_days_left');
      params.delete('plan_activated');
      params.delete('plan_name');
      
      // Mantém outros parâmetros úteis
      const newParams = params.toString();
      const path = window.location.pathname + (newParams ? `?${newParams}` : '');
      
      // Substitui a URL sem recarregar a página
      navigate(path, { replace: true });
    }
  }, [searchParams, navigate]);

  // Este componente não renderiza nada visualmente
  return null;
};

/**
 * Hook para detectar o estado de pagamento em componentes
 * @returns Estado atual do pagamento baseado em parâmetros ou histórico local
 */
export const usePaymentStatus = () => {
  const [searchParams] = useSearchParams();
  
  const isAfterSuccessfulPayment = () => {
    // Verifica parâmetros de URL primeiro
    if (searchParams.get('session_id') || searchParams.get('payment_success') === 'true') {
      return true;
    }
    
    // Caso contrário, verifica histórico armazenado
    const lastSessionId = localStorage.getItem('lastPaymentSessionId');
    const lastTimestamp = localStorage.getItem('lastPaymentTimestamp');
    
    if (lastSessionId && lastTimestamp) {
      // Considera válido por 1 hora após o pagamento
      const timestampValid = 
        Date.now() - parseInt(lastTimestamp) < 60 * 60 * 1000; // 1 hora
      
      if (timestampValid) {
        return true;
      } else {
        // Limpar se expirado
        localStorage.removeItem('lastPaymentSessionId');
        localStorage.removeItem('lastPaymentTimestamp');
      }
    }
    
    return false;
  };
  
  const isAfterCancelledPayment = () => {
    return searchParams.get('payment_cancelled') === 'true';
  };
  
  const hasPaymentError = () => {
    return !!searchParams.get('error');
  };
  
  const getPaymentErrorMessage = () => {
    const error = searchParams.get('error');
    return error ? decodeURIComponent(error) : null;
  };
  
  return {
    isAfterSuccessfulPayment,
    isAfterCancelledPayment,
    hasPaymentError,
    getPaymentErrorMessage,
  };
};