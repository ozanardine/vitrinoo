import { useState, useEffect } from 'react';
import { SubscriptionManager } from '../subscription/subscription-manager';
import { SubscriptionDetails } from '../subscription/subscription-lifecycle';
import { toast } from 'react-toastify';

/**
 * Hook para gerenciar assinaturas em componentes React
 * 
 * @param storeId ID da loja
 * @returns Objeto com métodos e estados para gerenciar assinaturas
 */
export function useSubscription(storeId: string) {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  const subscriptionManager = new SubscriptionManager();
  
  // Carregar dados da assinatura
  useEffect(() => {
    let isMounted = true;
    
    const loadSubscription = async () => {
      try {
        setLoading(true);
        const data = await subscriptionManager.getSubscription(storeId);
        
        if (isMounted) {
          setSubscription(data);
          setError(null);
        }
      } catch (err) {
        console.error('Erro ao carregar assinatura:', err);
        
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
          // Não limpar o subscription aqui, manter o último valor válido se houver
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadSubscription();
    
    // Limpar ao desmontar
    return () => {
      isMounted = false;
    };
  }, [storeId]);
  
  // Função para atualizar plano
  const upgradeToPlan = async (priceId: string) => {
    try {
      setProcessingAction(true);
      
      // Verificar se já tem o plano
      if (subscription?.id && subscription.price > 0) {
        return await subscriptionManager.manageSubscription();
      }
      
      // Iniciar processo de checkout
      await subscriptionManager.startSubscription(storeId, priceId);
      
      // O redirecionamento é feito pelo startSubscription
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar assinatura';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Função para gerenciar assinatura existente
  const manageSubscription = async () => {
    try {
      setProcessingAction(true);
      return await subscriptionManager.manageSubscription();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar portal de assinatura';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Verificar se trial está acabando
  const isTrialEndingSoon = async (thresholdDays: number = 3) => {
    if (!storeId) return false;
    return subscriptionManager.isTrialEndingSoon(storeId, thresholdDays);
  };
  
  // Verificar acesso a recursos
  const canAccessFeature = async (featureName: string) => {
    if (!storeId) return false;
    return subscriptionManager.canAccessFeature(storeId, featureName);
  };
  
  // Verificar se é assinatura de teste
  const isTrialSubscription = () => {
    return subscription?.status === 'trialing';
  };
  
  // Obter dias restantes do trial
  const getTrialDaysRemaining = () => {
    if (!subscription || !subscription.trialEnd) return 0;
    
    const now = new Date();
    const trialEnd = new Date(subscription.trialEnd);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };
  
  return {
    subscription,
    loading,
    error,
    processingAction,
    upgradeToPlan,
    manageSubscription,
    isTrialEndingSoon,
    canAccessFeature,
    isTrialSubscription,
    getTrialDaysRemaining
  };
}