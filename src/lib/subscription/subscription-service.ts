/**
 * Camada de serviço para gerenciamento de assinaturas
 */
import { supabase } from '../supabase';
import { AppError, ErrorCategory, ErrorCode } from '../errors';
import { subscriptionLogger } from './subscription-logger';
import { subscriptionMetrics } from './subscription-metrics';
import { 
  SubscriptionStatus, 
  SubscriptionDetails, 
  NotificationType 
} from './subscription-lifecycle';
import { PlanType, getPlanLimits } from '../plans';

export class SubscriptionService {
  /**
   * Cria uma nova instância do serviço
   */
  constructor(private readonly userId?: string) {}

  /**
   * Obtém os detalhes de uma assinatura pelo ID da loja
   * 
   * @param storeId - ID da loja
   * @returns Detalhes da assinatura ou null se não existir
   * @throws AppError se ocorrer um erro no banco de dados
   */
  async getSubscriptionByStore(storeId: string): Promise<SubscriptionDetails | null> {
    const startTime = Date.now();
    
    try {
      subscriptionLogger.info('Buscando assinatura pelo ID da loja', { 
        storeId,
        userId: this.userId
      });
      
      // Buscar o registro de assinatura na loja
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

      // Se não tiver assinatura, retorna null
      if (!subscription) {
        subscriptionLogger.info('Nenhuma assinatura encontrada para loja', { storeId });
        return null;
      }

      // Buscar mais detalhes no stripe_subscriptions se tiver um ID do Stripe
      let stripeSubscription = null;

      if (subscription.stripe_subscription_id) {
        const { data: stripeSub, error: stripeError } = await supabase
          .from('stripe_subscriptions')
          .select('*')
          .eq('subscription_id', subscription.stripe_subscription_id)
          .maybeSingle();

        if (stripeError) {
          subscriptionLogger.warn('Erro ao buscar detalhes do Stripe, continuando com dados básicos', {
            storeId,
            subscriptionId: subscription.id,
            error: stripeError.message
          });
        } else {
          stripeSubscription = stripeSub;
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

      // Organizar e retornar os detalhes
      const result: SubscriptionDetails = {
        id: subscription.stripe_subscription_id || subscription.id,
        storeId: subscription.store_id,
        status: (subscription.status as SubscriptionStatus) || 'inactive',
        planType: (subscription.plan_type as PlanType) || 'free',
        planName: subscription.plan_name || 'Gratuito',
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
      
      // Registrar métricas
      const duration = Date.now() - startTime;
      subscriptionMetrics.histograms.recordDuration('subscription.get', duration, {
        storeId,
        status: result.status
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      subscriptionLogger.error('Erro ao buscar assinatura', {
        storeId,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
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
   * Verifica se uma assinatura está em um estado específico
   * 
   * @param subscription - Detalhes da assinatura
   * @param status - Status a verificar (pode ser um único status ou um array)
   * @returns Se está no status especificado
   */
  isSubscriptionInStatus(
    subscription: SubscriptionDetails | null, 
    status: SubscriptionStatus | SubscriptionStatus[]
  ): boolean {
    if (!subscription) {
      return status === 'inactive' || (Array.isArray(status) && status.includes('inactive'));
    }
    
    if (Array.isArray(status)) {
      return status.includes(subscription.status);
    }
    
    return subscription.status === status;
  }

  /**
   * Verifica se uma assinatura está elegível para um determinado recurso
   * 
   * @param subscription - Detalhes da assinatura
   * @param feature - Nome do recurso
   * @returns Se o recurso está disponível
   */
  async isFeatureAvailable(
    subscription: SubscriptionDetails | null,
    feature: string
  ): Promise<boolean> {
    // Logar a checagem
    subscriptionLogger.debug('Verificando disponibilidade de recurso', {
      feature,
      subscriptionId: subscription?.id,
      planType: subscription?.planType || 'free'
    });
    
    // Se não tem assinatura, usa o plano gratuito
    const planType = subscription?.planType || 'free';
    
    // Verificar se o plano tem o recurso (via metadados)
    const planLimits = await getPlanLimits(planType);
    
    let isAvailable = false;
    
    switch (feature) {
      case 'imgur_upload':
        isAvailable = !!planLimits.metadata.imgur_enabled;
        break;
      case 'priority_support':
        isAvailable = !!planLimits.metadata.priority_support;
        break;
      case 'erp_integration':
        isAvailable = !!planLimits.metadata.erp_integration;
        break;
      case 'ai_descriptions':
        isAvailable = !!planLimits.metadata.ai_features_enabled;
        break;
      case 'custom_domain':
        isAvailable = !!planLimits.metadata.custom_domain_enabled;
        break;
      case 'api_access':
        isAvailable = !!planLimits.metadata.api_access;
        break;
      case 'analytics':
        isAvailable = !!planLimits.metadata.analytics_enabled;
        break;
      default:
        isAvailable = false;
    }
    
    // Registrar métrica para uso de recursos
    subscriptionMetrics.counters.increment('subscription.feature.check', 1, {
      feature,
      planType,
      available: isAvailable ? 'true' : 'false'
    });
    
    return isAvailable;
  }

  /**
   * Cria uma notificação para o usuário
   * 
   * @param userId - ID do usuário
   * @param type - Tipo de notificação
   * @param title - Título da notificação
   * @param content - Conteúdo da notificação
   * @param metadata - Metadados adicionais
   * @returns ID da notificação criada
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          content,
          metadata,
          read: false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        subscriptionLogger.error('Erro ao criar notificação', {
          userId,
          type,
          error: error.message
        });
        return '';
      }

      subscriptionLogger.info('Notificação criada', {
        userId,
        type,
        notificationId: data.id
      });

      return data.id;
    } catch (error) {
      subscriptionLogger.error('Erro ao criar notificação', {
        userId,
        type,
        error: error instanceof Error ? error.message : String(error)
      });
      return '';
    }
  }
  
  /**
   * Atualiza o status de uma assinatura
   * 
   * @param subscriptionId - ID da assinatura
   * @param newStatus - Novo status
   * @param metadata - Metadados adicionais
   * @returns Se a atualização foi bem-sucedida
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    newStatus: SubscriptionStatus,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Buscar status atual para registro de transição
      const { data: currentSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('status, store_id, plan_type')
        .eq('stripe_subscription_id', subscriptionId)
        .single();
        
      if (fetchError) {
        throw new AppError({
          code: ErrorCode.VALIDATION_ENTITY_NOT_FOUND,
          category: ErrorCategory.VALIDATION,
          message: 'Assinatura não encontrada',
          originalError: fetchError
        });
      }
      
      const oldStatus = currentSub.status as SubscriptionStatus;
      const storeId = currentSub.store_id;
      const planType = currentSub.plan_type as PlanType;
      
      // Atualizar status na tabela subscriptions
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: newStatus,
          active: ['active', 'trialing'].includes(newStatus),
          updated_at: new Date().toISOString(),
          metadata: {
            ...metadata,
            previous_status: oldStatus,
            transition_date: new Date().toISOString()
          }
        })
        .eq('stripe_subscription_id', subscriptionId);
        
      if (updateError) {
        throw updateError;
      }
      
      // Atualizar status na tabela stripe_subscriptions
      const { error: stripeSubError } = await supabase
        .from('stripe_subscriptions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', subscriptionId);
        
      if (stripeSubError) {
        subscriptionLogger.warn('Erro ao atualizar status na tabela stripe_subscriptions', {
          subscriptionId,
          error: stripeSubError.message
        });
        // Não falhar a operação principal por causa disso
      }
      
      // Registrar logs e métricas
      subscriptionLogger.stateTransition(subscriptionId, oldStatus, newStatus, {
        storeId,
        planType,
        metadata
      });
      
      subscriptionMetrics.counters.increment('subscription.status.change', 1, {
        from_status: oldStatus,
        to_status: newStatus,
        plan_type: planType
      });
      
      return true;
    } catch (error) {
      subscriptionLogger.error('Erro ao atualizar status da assinatura', {
        subscriptionId,
        newStatus,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError({
        code: ErrorCode.SERVER_DATABASE_ERROR,
        category: ErrorCategory.SERVER,
        message: 'Erro ao atualizar status da assinatura',
        originalError: error
      });
    }
  }
}