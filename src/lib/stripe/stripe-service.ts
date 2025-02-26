import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../supabase';
import { AppError, ErrorCategory, ErrorCode, handleStripeError, logErrorToMonitoring } from '../errors';
import { withRetry } from '../errors';

// Configuração do Stripe com handling de erros aprimorado
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!STRIPE_PUBLIC_KEY) {
  throw new AppError({
    code: ErrorCode.CLIENT_FEATURE_UNSUPPORTED,
    category: ErrorCategory.CLIENT,
    message: 'Chave pública do Stripe não configurada',
  });
}

// Inicialização do Stripe com tratamento de erros
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY).catch(error => {
  const appError = handleStripeError(error);
  logErrorToMonitoring(appError);
  throw appError;
});

/**
 * Interface para resposta do Stripe
 */
export interface StripeSessionResponse {
  id?: string;
  url?: string;
  status?: string;
}

/**
 * Interface para planos do Stripe
 */
export interface Plan {
  id: string;
  name: string;
  description: string;
  metadata: {
    is_trial: boolean;
    plan_type: 'starter' | 'pro' | 'enterprise';
    trial_days?: number;
  };
  features: {
    products: number;
    categories: number;
    images_per_product: number;
    custom_domain: boolean;
    analytics: boolean;
    support: string;
    erp_integration: boolean;
    ai_features_enabled?: boolean;
    custom_domain_enabled?: boolean;
    api_access?: boolean;
  };
  price: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
  };
}

/**
 * Classe para gerenciar integração com Stripe
 */
export class StripeService {
  /**
   * Obtém os planos disponíveis do Stripe
   * 
   * @returns Lista de planos disponíveis
   */
  async getPlans(): Promise<Plan[]> {
    try {
      const { data: products, error: productsError } = await supabase
        .from('stripe_products')
        .select(`
          *,
          stripe_prices!inner(*)
        `)
        .eq('active', true)
        .eq('stripe_prices.active', true);

      if (productsError) {
        throw new AppError({
          code: ErrorCode.SERVER_DATABASE_ERROR,
          category: ErrorCategory.SERVER,
          message: 'Erro ao buscar planos no banco de dados',
          details: productsError,
          originalError: productsError,
        });
      }
      
      if (!products || products.length === 0) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ENTITY_NOT_FOUND,
          category: ErrorCategory.VALIDATION,
          message: 'Nenhum plano disponível no momento',
        });
      }

      return products.map(product => {
        const price = product.stripe_prices?.[0];
        return {
          id: price?.price_id,
          name: product.name,
          description: product.description,
          metadata: product.metadata,
          features: product.features,
          price: price ? {
            id: price.price_id,
            amount: price.unit_amount,
            currency: price.currency,
            interval: price.interval
          } : {
            id: '',
            amount: 0,
            currency: 'brl',
            interval: 'month'
          }
        };
      });
    } catch (error) {
      // Se já for um AppError, repassamos
      if (error instanceof AppError) {
        throw error;
      }
      
      // Caso contrário, normalizamos o erro
      const appError = new AppError({
        code: ErrorCode.SERVER_DEPENDENCY_ERROR,
        category: ErrorCategory.SERVER,
        message: 'Erro ao buscar planos',
        originalError: error,
      });
      
      logErrorToMonitoring(appError);
      throw appError;
    }
  }

  /**
   * Cria uma sessão de checkout do Stripe
   * 
   * @param priceId ID do preço do Stripe
   * @param storeId ID da loja
   * @returns Resposta da sessão de checkout
   */
  async createCheckoutSession(
    priceId: string, 
    storeId: string
  ): Promise<StripeSessionResponse> {
    // Validar parâmetros de entrada
    if (!priceId) {
      throw new AppError({
        code: ErrorCode.VALIDATION_REQUIRED_FIELD,
        category: ErrorCategory.VALIDATION,
        message: 'ID do plano é obrigatório',
      });
    }
    
    if (!storeId) {
      throw new AppError({
        code: ErrorCode.VALIDATION_REQUIRED_FIELD,
        category: ErrorCategory.VALIDATION,
        message: 'ID da loja é obrigatório',
      });
    }

    // Usar withRetry para tentar novamente em caso de falhas de rede
    try {
      return await withRetry(
        async () => {
          // Verificar estado de autenticação
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new AppError({
              code: ErrorCode.AUTH_UNAUTHORIZED,
              category: ErrorCategory.AUTHENTICATION,
              message: 'Usuário não autenticado',
              originalError: sessionError,
            });
          }
          
          console.log('Creating checkout session:', { priceId, storeId });

          // Chamar a função Supabase para criar a sessão de checkout
          const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { priceId, storeId }
          });

          if (error) {
            throw new AppError({
              code: ErrorCode.PAYMENT_CHECKOUT_SESSION_FAILED,
              category: ErrorCategory.PAYMENT,
              message: 'Erro ao criar sessão de checkout',
              details: { priceId, storeId },
              originalError: error,
            });
          }

          console.log('Checkout session response:', data);

          // Verificar e processar a resposta
          if ('url' in data) {
            window.location.href = data.url;
            return data;
          }

          if ('id' in data) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Carregar Stripe e redirecionar
            const stripe = await stripePromise;
            if (!stripe) {
              throw new AppError({
                code: ErrorCode.PAYMENT_CHECKOUT_SESSION_FAILED,
                category: ErrorCategory.PAYMENT,
                message: 'Erro ao inicializar Stripe',
              });
            }
            
            const { error: checkoutError } = await stripe.redirectToCheckout({
              sessionId: data.id
            });

            if (checkoutError) {
              throw handleStripeError(checkoutError);
            }

            return data;
          }

          throw new AppError({
            code: ErrorCode.NETWORK_RESPONSE_INVALID,
            category: ErrorCategory.NETWORK,
            message: 'Resposta inválida do servidor',
            details: data,
          });
        },
        {
          maxRetries: 2,
          delay: 1000,
          onRetry: (error, attempt) => {
            console.warn(`Tentativa ${attempt} falhou: ${error.message}`);
          },
          shouldRetry: (error) => 
            error.category === ErrorCategory.NETWORK || 
            (error.category === ErrorCategory.PAYMENT && error.retryable)
        }
      );
    } catch (error) {
      // Garantir que tratamos adequadamente o erro
      const appError = error instanceof AppError ? error : handleStripeError(error);
      
      // Logar o erro para monitoramento
      logErrorToMonitoring(appError);
      
      // Repassar o erro estruturado
      throw appError;
    }
  }

  /**
   * Cria uma sessão do portal de clientes do Stripe
   * 
   * @returns URL do portal de clientes
   */
  async createPortalSession(): Promise<{ url: string }> {
    try {
      return await withRetry(
        async () => {
          // Verificar sessão de autenticação
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new AppError({
              code: ErrorCode.AUTH_UNAUTHORIZED,
              category: ErrorCategory.AUTHENTICATION,
              message: 'Usuário não autenticado',
              originalError: sessionError,
            });
          }

          console.log('Creating portal session');
          const { data, error } = await supabase.functions.invoke('create-portal-session');

          if (error) {
            // Tratar especificamente o erro de cliente não encontrado
            if (error.message === 'Cliente não encontrado') {
              throw new AppError({
                code: ErrorCode.VALIDATION_ENTITY_NOT_FOUND,
                category: ErrorCategory.VALIDATION,
                message: 'Você precisa ter uma assinatura ativa para acessar o portal de pagamento',
                originalError: error,
              });
            }
            
            throw new AppError({
              code: ErrorCode.PAYMENT_FAILED,
              category: ErrorCategory.PAYMENT,
              message: 'Erro ao acessar portal de pagamento',
              originalError: error,
            });
          }

          if (!data?.url) {
            throw new AppError({
              code: ErrorCode.NETWORK_RESPONSE_INVALID,
              category: ErrorCategory.NETWORK,
              message: 'Erro ao acessar portal de pagamento. Por favor, tente novamente.',
              details: data,
            });
          }

          console.log('Portal session created:', data);
          
          // Redirecionar para o portal
          window.location.href = data.url;
          return data;
        },
        {
          maxRetries: 2,
          delay: 1000,
          shouldRetry: (error) => error.category === ErrorCategory.NETWORK,
        }
      );
    } catch (error) {
      // Garantir que tratamos adequadamente o erro
      const appError = error instanceof AppError ? error : handleStripeError(error);
      
      // Logar o erro para monitoramento
      logErrorToMonitoring(appError);
      
      // Repassar o erro estruturado
      throw appError;
    }
  }

  /**
   * Verificar status da assinatura
   * 
   * @param subscriptionId ID da assinatura
   * @returns Status da assinatura 
   */
  async checkSubscriptionStatus(subscriptionId: string): Promise<{
    status: string;
    active: boolean;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .single();
        
      if (error) {
        throw new AppError({
          code: ErrorCode.SERVER_DATABASE_ERROR,
          category: ErrorCategory.SERVER,
          message: 'Erro ao verificar status da assinatura',
          originalError: error,
        });
      }
      
      if (!data) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ENTITY_NOT_FOUND,
          category: ErrorCategory.VALIDATION,
          message: 'Assinatura não encontrada',
        });
      }
      
      return {
        status: data.status,
        active: ['active', 'trialing'].includes(data.status),
        trialEndsAt: data.trial_end,
        currentPeriodEnd: data.current_period_end,
      };
    } catch (error) {
      // Garantir que tratamos adequadamente o erro
      const appError = error instanceof AppError ? error : handleStripeError(error);
      
      // Logar o erro para monitoramento
      logErrorToMonitoring(appError);
      
      // Repassar o erro estruturado
      throw appError;
    }
  }
}