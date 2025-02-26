import { supabase } from '../supabase';
import { SubscriptionStatus, SubscriptionDetails } from './subscription-lifecycle';
import { subscriptionLogger } from './subscription-logger';
import { PlanType } from '../plans';
import { AppError, ErrorCategory, ErrorCode } from '../errors';
import { StripeService } from '../stripe/stripe-service';

/**
 * Gerenciador central para operações relacionadas a assinaturas
 */
export class SubscriptionManager {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = new StripeService();
  }

  /**
   * Obtém detalhes da assinatura de uma loja
   * 
   * @param storeId ID da loja
   * @returns Detalhes da assinatura ou null se não encontrada
   */
  async getSubscription(storeId: string): Promise<SubscriptionDetails | null> {
    try {
      // Buscar assinatura no banco de dados
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          id,
          store_id,
          stripe_subscription_id,
          plan_type,
          active,
          status,
          trial_ends_at,
          next_payment_at,
          plan_name,
          amount,
          currency,
          created_at,
          updated_at
        `)
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        throw new AppError({
          code: ErrorCode.SERVER_DATABASE_ERROR,
          category: ErrorCategory.SERVER,
          message: 'Erro ao buscar assinatura',
          originalError: error,
        });
      }

      // Se não encontrou assinatura
      if (!subscription) {
        return null;
      }

      // Buscar detalhes adicionais no Stripe se houver ID do Stripe
      let stripeSubscription = null;
      if (subscription.stripe_subscription_id && !subscription.stripe_subscription_id.startsWith('trial_')) {
        try {
          const { data: stripeSub } = await supabase
            .from('stripe_subscriptions')
            .select('*')
            .eq('subscription_id', subscription.stripe_subscription_id)
            .maybeSingle();

          stripeSubscription = stripeSub;
        } catch (e) {
          // Apenas log do erro, continuamos com os dados que temos
          subscriptionLogger.warn('Erro ao buscar detalhes do Stripe', {
            subscriptionId: subscription.stripe_subscription_id,
            error: e instanceof Error ? e.message : String(e)
          });
        }
      }

      // Calcular datas relativas
      const now = new Date();
      const trialEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
      const periodEnd = subscription.next_payment_at ? new Date(subscription.next_payment_at) : null;

      let daysUntilDue = null;
      if (periodEnd) {
        daysUntilDue = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      let daysUntilTrialEnd = null;
      if (trialEnd) {
        daysUntilTrialEnd = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      // Construir objeto de detalhes
      const result: SubscriptionDetails = {
        id: subscription.stripe_subscription_id || subscription.id,
        storeId: subscription.store_id,
        status: (subscription.status as SubscriptionStatus) || 'inactive',
        planType: (subscription.plan_type as PlanType) || 'starter',
        planName: subscription.plan_name || 'Starter',
        isActive: subscription.active || false,
        createdAt: subscription.created_at,
        periodStart: stripeSubscription?.current_period_start || subscription.created_at,
        periodEnd: stripeSubscription?.current_period_end || subscription.next_payment_at || null,
        trialEnd: subscription.trial_ends_at,
        cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end || false,
        price: subscription.amount || 0,
        currency: subscription.currency || 'brl',
        canceledAt: stripeSubscription?.canceled_at || null,
        canceledReason: stripeSubscription?.metadata?.cancel_reason || null,
        interval: (stripeSubscription?.metadata?.interval || 'month') as 'month' | 'year',
        daysUntilDue,
        daysUntilTrialEnd,
        pausedAt: stripeSubscription?.metadata?.paused_at || null
      };

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError({
        code: ErrorCode.SERVER_DATABASE_ERROR,
        category: ErrorCategory.SERVER,
        message: 'Erro ao buscar detalhes da assinatura',
        originalError: error,
      });
    }
  }

  /**
   * Iniciar assinatura a partir de um plano
   * 
   * @param storeId ID da loja
   * @param priceId ID do preço no Stripe
   * @returns Resposta da sessão de checkout
   */
  async startSubscription(storeId: string, priceId: string) {
    return this.stripeService.createCheckoutSession(priceId, storeId);
  }

  /**
   * Gerenciar assinatura existente no portal do Stripe
   * 
   * @returns URL do portal de gerenciamento
   */
  async manageSubscription() {
    return this.stripeService.createPortalSession();
  }

  /**
   * Cancelar assinatura
   * 
   * @param subscriptionId ID da assinatura
   * @param atPeriodEnd Se deve cancelar ao final do período atual
   * @returns Status da operação
   */
  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true) {
    try {
      // Verificar se é uma assinatura de teste interna
      if (subscriptionId.startsWith('trial_')) {
        // Assinaturas de teste são canceladas diretamente no banco
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            active: false,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          throw new AppError({
            code: ErrorCode.SERVER_DATABASE_ERROR,
            category: ErrorCategory.SERVER,
            message: 'Erro ao cancelar assinatura de teste',
            originalError: error,
          });
        }

        return { success: true };
      }

      // Para assinaturas do Stripe, usar o portal
      return await this.manageSubscription();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError({
        code: ErrorCode.PAYMENT_SUBSCRIPTION_UPDATE_FAILED,
        category: ErrorCategory.PAYMENT,
        message: 'Erro ao cancelar assinatura',
        originalError: error,
      });
    }
  }

  /**
   * Verifica se o trial está expirando em breve
   * 
   * @param storeId ID da loja
   * @param thresholdDays Número de dias para considerar como "expirando em breve"
   * @returns Se o trial está expirando em breve
   */
  async isTrialEndingSoon(storeId: string, thresholdDays: number = 3): Promise<boolean> {
    const subscription = await this.getSubscription(storeId);
    
    if (!subscription) return false;
    
    // Verificar se está em período de trial
    if (subscription.status !== 'trialing' || !subscription.trialEnd) {
      return false;
    }
    
    // Calcular dias restantes
    const trialEndDate = new Date(subscription.trialEnd);
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= thresholdDays && diffDays >= 0;
  }

  /**
   * Verifica se o usuário tem acesso a um recurso específico
   * 
   * @param storeId ID da loja
   * @param featureName Nome do recurso
   * @returns Se o usuário tem acesso ao recurso
   */
  async canAccessFeature(storeId: string, featureName: string): Promise<boolean> {
    const subscription = await this.getSubscription(storeId);
    
    if (!subscription) return false;
    
    // Se não estiver ativo, não tem acesso a recursos
    if (!subscription.isActive) return false;
    
    // Verificar qual o plano e se o recurso está disponível
    const planType = subscription.planType;
    
    switch (featureName) {
      // Recursos disponíveis em todos os planos
      case 'basic_analytics':
      case 'product_management':
      case 'category_management':
      case 'image_upload':
      case 'custom_domain':
        return true;
        
      // Recursos disponíveis em Pro e Enterprise
      case 'advanced_analytics':
      case 'priority_support':
      case 'ai_features':
        return ['pro', 'enterprise'].includes(planType);
        
      // Recursos exclusivos do Enterprise
      case 'erp_integration':
      case 'api_access':
        return planType === 'enterprise';
        
      // Recurso não reconhecido
      default:
        return false;
    }
  }
}