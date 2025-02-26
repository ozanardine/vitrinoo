import { useState } from 'react';
import { TrialSubscriptionService } from '../subscription/trial-subscription-service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * Hook para gerenciar a criação de assinatura de teste
 */
export function useTrialSubscription() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const trialService = new TrialSubscriptionService();

  /**
   * Cria uma assinatura de teste para uma nova loja
   * 
   * @param userId - ID do usuário
   * @param storeId - ID da loja
   * @param redirectTo - Rota para redirecionar após a criação (opcional)
   */
  const createTrialForNewStore = async (
    userId: string, 
    storeId: string,
    redirectTo?: string
  ) => {
    setIsCreating(true);
    setError(null);
    
    try {
      const result = await trialService.createTrialSubscription(userId, storeId);
      
      if (result.success) {
        // Mostrar mensagem de sucesso
        toast.success(
          <div>
            <p className="font-medium">Bem-vindo ao período de teste!</p>
            <p className="text-sm">Você tem acesso ao plano Enterprise por 7 dias.</p>
          </div>, 
          { autoClose: 8000 }
        );
        
        // Salvar informação sobre o trial no localStorage
        localStorage.setItem('trial_active', 'true');
        localStorage.setItem('trial_plan', 'enterprise');
        localStorage.setItem('trial_ends_at', result.trialEndsAt || '');
        
        // Redirecionar se necessário
        if (redirectTo) {
          navigate(redirectTo);
        }
        
        return true;
      } else {
        setError(result.error || 'Erro ao criar assinatura de teste');
        
        // Mostrar mensagem de erro apenas se for algo diferente de "já existe"
        if (result.error && !result.error.includes('já existe')) {
          toast.error('Não foi possível ativar seu período de teste. Por favor, entre em contato com o suporte.');
        }
        
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Mostrar mensagem de erro
      toast.error('Ocorreu um erro ao configurar seu período de teste');
      
      return false;
    } finally {
      setIsCreating(false);
    }
  };
  
  /**
   * Verifica se o período de teste está ativo
   */
  const isTrialActive = (): boolean => {
    const trialActive = localStorage.getItem('trial_active');
    const trialEndsAt = localStorage.getItem('trial_ends_at');
    
    if (trialActive === 'true' && trialEndsAt) {
      const endDate = new Date(trialEndsAt);
      const now = new Date();
      
      return endDate > now;
    }
    
    return false;
  };
  
  /**
   * Obtém o número de dias restantes no período de teste
   */
  const getTrialDaysRemaining = (): number => {
    const trialEndsAt = localStorage.getItem('trial_ends_at');
    
    if (trialEndsAt) {
      const endDate = new Date(trialEndsAt);
      const now = new Date();
      
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays);
    }
    
    return 0;
  };
  
  return {
    createTrialForNewStore,
    isTrialActive,
    getTrialDaysRemaining,
    isCreating,
    error
  };
}