import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Plan, getPlans } from '../lib/stripe';
import { subscriptionLogger } from '../lib/subscription/subscription-logger';

interface StripePlansContextType {
  plans: Plan[];
  loading: boolean;
  error: Error | null;
  refetchPlans: () => Promise<void>;
}

// Criar o contexto com valor padrão
const StripePlansContext = createContext<StripePlansContextType>({
  plans: [],
  loading: false,
  error: null,
  refetchPlans: async () => {}
});

interface StripePlansProviderProps {
  children: ReactNode;
}

/**
 * Provider que disponibiliza os planos do Stripe para a aplicação
 */
export const StripePlansProvider: React.FC<StripePlansProviderProps> = ({ children }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPlans = await getPlans();
      
      // Ordenar por preço
      const sortedPlans = [...fetchedPlans].sort((a, b) => {
        return (a.price?.amount || 0) - (b.price?.amount || 0);
      });
      
      setPlans(sortedPlans);
    } catch (err) {
      subscriptionLogger.error('Erro ao buscar planos do Stripe', {
        error: err instanceof Error ? err.message : String(err)
      });
      setError(err instanceof Error ? err : new Error('Erro ao buscar planos'));
    } finally {
      setLoading(false);
    }
  };

  // Buscar planos ao montar o componente
  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <StripePlansContext.Provider value={{ plans, loading, error, refetchPlans: fetchPlans }}>
      {children}
    </StripePlansContext.Provider>
  );
};

/**
 * Hook para acessar os planos do Stripe
 */
export const useStripePlans = () => useContext(StripePlansContext);