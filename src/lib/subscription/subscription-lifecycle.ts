/**
 * Sistema para gerenciamento do ciclo de vida de assinaturas
 * 
 * Responsável por:
 * - Gerenciar transições de estado da assinatura
 * - Detectar e responder a eventos importantes (renovação, cancelamento, etc)
 * - Coordenar notificações para o usuário
 * - Facilitar acesso a informações de assinatura em um formato padronizado
 */

import { supabase } from '../supabase';
import { AppError, ErrorCategory, ErrorCode } from '../errors';
import { PlanType, getPlanLimits } from '../plans-service';

// Estados possíveis para assinatura
export type SubscriptionStatus = 
  | 'inactive'    // Sem assinatura ativa
  | 'trialing'    // Período de teste 
  | 'active'      // Assinatura ativa
  | 'past_due'    // Pagamento atrasado
  | 'unpaid'      // Pagamento não efetuado após período de carência
  | 'canceled'    // Assinatura cancelada
  | 'incomplete'  // Aguardando primeiro pagamento
  | 'incomplete_expired'; // Primeiro pagamento falhou

// Eventos possíveis no ciclo de vida
export type SubscriptionEvent =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_renewed'
  | 'subscription_canceled'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'trial_started'
  | 'trial_ending'
  | 'trial_ended'
  | 'plan_changed'
  | 'past_due'
  | 'unpaid';

// Tipos de notificação para o usuário
export type NotificationType =
  | 'payment_success'
  | 'payment_failed'
  | 'payment_past_due'
  | 'payment_unpaid'
  | 'subscription_canceled'
  | 'subscription_created'
  | 'subscription_renewed'
  | 'trial_started'
  | 'trial_ending'
  | 'trial_ended'
  | 'plan_changed'
  | 'subscription_cancellation_scheduled'
  | 'subscription_ended';

// Detalhes de uma assinatura
export interface SubscriptionDetails {
  id: string;                      // ID da assinatura no Stripe
  storeId: string;                 // ID da loja associada
  status: SubscriptionStatus;      // Status atual
  planType: PlanType;              // Tipo de plano
  planName: string;                // Nome do plano
  isActive: boolean;               // Se está ativa atualmente
  createdAt: string;               // Data de criação
  periodStart: string;             // Início do período atual
  periodEnd: string;               // Fim do período atual
  trialEnd: string | null;         // Fim do período de teste (se aplicável)
  cancelAtPeriodEnd: boolean;      // Se será cancelada no fim do período
  price: number;                   // Preço em centavos
  currency: string;                // Moeda (default: BRL)
  canceledAt: string | null;       // Data de cancelamento (se aplicável)
  canceledReason: string | null;   // Motivo do cancelamento (se aplicável)
  interval: 'month' | 'year';      // Intervalo de cobrança
  daysUntilDue: number | null;     // Dias até o próximo pagamento
  daysUntilTrialEnd: number | null;// Dias até o fim do período de teste
  pausedAt: string | null;         // Data de pausa (se aplicável)
}

/**
 * Obtém os detalhes de uma assinatura pelo storeId
 * 
 * @param storeId ID da loja
 * @returns Detalhes da assinatura
 */
export async function getSubscriptionByStore(storeId: string): Promise<SubscriptionDetails | null> {
  try {
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
        console.error('Erro ao buscar detalhes do Stripe:', stripeError);
        // Continua mesmo com erro, usando apenas os dados da tabela subscriptions
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
    return {
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
 * Obtém os detalhes de uma assinatura pelo ID do Stripe
 * 
 * @param subscriptionId ID da assinatura no Stripe
 * @returns Detalhes da assinatura
 */
export async function getSubscriptionByStripeId(subscriptionId: string): Promise<SubscriptionDetails | null> {
  try {
    // Buscar o subscription_id na tabela de subscriptions
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('store_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (error || !subscription) {
      console.error('Erro ou assinatura não encontrada:', error);
      return null;
    }

    // Reutilizar a função getSubscriptionByStore
    return getSubscriptionByStore(subscription.store_id);
  } catch (error) {
    console.error('Erro ao buscar assinatura por ID do Stripe:', error);
    return null;
  }
}

/**
 * Verifica se uma assinatura está em um estado específico
 * 
 * @param subscription Detalhes da assinatura
 * @param status Status a verificar
 * @returns Se está no status especificado
 */
export function isSubscriptionInStatus(
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
 * @param subscription Detalhes da assinatura
 * @param feature Nome do recurso
 * @returns Se o recurso está disponível
 */
export async function isFeatureAvailable(
  subscription: SubscriptionDetails | null,
  feature: string
): Promise<boolean> {
  // Se não tem assinatura, usa o plano gratuito
  const planType = subscription?.planType || 'free';
  
  // Verificar se o plano tem o recurso (via metadados)
  const planLimits = await getPlanLimits(planType);
  
  switch (feature) {
    case 'imgur_upload':
      return planLimits.metadata.imgur_enabled || false;
    case 'priority_support':
      return planLimits.metadata.priority_support || false;
    case 'erp_integration':
      return planLimits.metadata.erp_integration || false;
    case 'ai_descriptions':
      return planLimits.metadata.ai_features_enabled || false;
    case 'custom_domain':
      return planLimits.metadata.custom_domain_enabled || false;
    case 'api_access':
      return planLimits.metadata.api_access || false;
    case 'analytics':
      return planLimits.metadata.analytics_enabled || false;
    default:
      return false;
  }
}

/**
 * Cria uma notificação para o usuário
 * 
 * @param userId ID do usuário
 * @param type Tipo de notificação
 * @param title Título da notificação
 * @param content Conteúdo da notificação
 * @param metadata Metadados adicionais
 * @returns ID da notificação criada
 */
export async function createNotification(
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
      console.error('Erro ao criar notificação:', error);
      return '';
    }

    return data.id;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return '';
  }
}

/**
 * Obtém o período de tentativa novamente para pagamentos
 * com base no status e no número de tentativas anteriores
 * 
 * @param status Status atual
 * @param attemptCount Número de tentativas anteriores
 * @returns Dias até a próxima tentativa
 */
export function getRetryPeriod(status: SubscriptionStatus, attemptCount: number): number {
  if (status === 'past_due') {
    // Período inicial de carência para pagamentos atrasados
    const basePeriod = attemptCount === 0 ? 3 : 5;
    // Aumentar o período exponencialmente com o número de tentativas
    return basePeriod * Math.pow(1.5, attemptCount);
  }
  
  if (status === 'unpaid') {
    // Períodos mais longos para assinaturas já marcadas como não pagas
    return 7 * Math.pow(1.5, attemptCount);
  }
  
  // Para outros estados, período padrão de 3 dias
  return 3;
}

/**
 * Verifica se uma assinatura está em período de carência
 * (após um pagamento falhar, mas antes de ser cancelada)
 * 
 * @param subscription Detalhes da assinatura
 * @returns Se está em período de carência
 */
export function isInGracePeriod(subscription: SubscriptionDetails | null): boolean {
  if (!subscription) {
    return false;
  }
  
  return subscription.status === 'past_due';
}

/**
 * Calcula o número de dias para o próximo evento importante
 * 
 * @param subscription Detalhes da assinatura
 * @returns Objeto com eventos próximos e dias restantes
 */
export function getUpcomingEvents(subscription: SubscriptionDetails | null): Record<string, number> {
  if (!subscription) {
    return {};
  }
  
  const events: Record<string, number> = {};
  
  // Dias até o fim do período atual
  if (subscription.daysUntilDue !== null) {
    events.next_payment = subscription.daysUntilDue;
  }
  
  // Dias até o fim do período de teste
  if (subscription.daysUntilTrialEnd !== null) {
    events.trial_end = subscription.daysUntilTrialEnd;
  }
  
  // Se vai ser cancelada no fim do período
  if (subscription.cancelAtPeriodEnd && subscription.daysUntilDue !== null) {
    events.cancellation = subscription.daysUntilDue;
  }
  
  return events;
}

/**
 * Retorna informações resumidas sobre a assinatura
 * para exibição em dashboards e relatórios
 * 
 * @param subscription Detalhes da assinatura
 * @returns Resumo da assinatura
 */
export function getSubscriptionSummary(subscription: SubscriptionDetails | null): {
  status: string;
  statusText: string;
  planName: string;
  planType: PlanType;
  nextPayment: string | null;
  trialEnd: string | null;
  price: string;
} {
  if (!subscription) {
    return {
      status: 'inactive',
      statusText: 'Inativo',
      planName: 'Gratuito',
      planType: 'free',
      nextPayment: null,
      trialEnd: null,
      price: 'Grátis'
    };
  }
  
  // Mapear status para texto amigável
  const statusMap: Record<SubscriptionStatus, string> = {
    'inactive': 'Inativo',
    'trialing': 'Em Período de Teste',
    'active': 'Ativo',
    'past_due': 'Pagamento Pendente',
    'unpaid': 'Pagamento Não Efetuado',
    'canceled': 'Cancelado',
    'incomplete': 'Incompleto',
    'incomplete_expired': 'Expirado'
  };
  
  // Formatar preço
  const formattedPrice = subscription.price > 0 
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: subscription.currency.toUpperCase()
      }).format(subscription.price / 100)
    : 'Grátis';
  
  // Informações adicionais sobre próximos eventos
  const nextPaymentDate = subscription.periodEnd 
    ? new Date(subscription.periodEnd).toLocaleDateString('pt-BR')
    : null;
    
  const trialEndDate = subscription.trialEnd
    ? new Date(subscription.trialEnd).toLocaleDateString('pt-BR')
    : null;
  
  return {
    status: subscription.status,
    statusText: statusMap[subscription.status] || 'Desconhecido',
    planName: subscription.planName,
    planType: subscription.planType,
    nextPayment: nextPaymentDate,
    trialEnd: trialEndDate,
    price: `${formattedPrice}/${subscription.interval === 'month' ? 'mês' : 'ano'}`
  };
}

/**
 * Calcula a próxima data de renovação de uma assinatura
 * 
 * @param subscription Detalhes da assinatura
 * @returns Data da próxima renovação ou null
 */
export function getNextRenewalDate(subscription: SubscriptionDetails | null): Date | null {
  if (!subscription || !subscription.periodEnd) {
    return null;
  }
  
  // Se estiver cancelada e não for renovar
  if (subscription.status === 'canceled' || 
      (subscription.cancelAtPeriodEnd && subscription.status !== 'trialing')) {
    return null;
  }
  
  // Se estiver em período de teste, usar a data de fim do teste
  if (subscription.status === 'trialing' && subscription.trialEnd) {
    return new Date(subscription.trialEnd);
  }
  
  // Caso contrário, usar o fim do período atual
  return new Date(subscription.periodEnd);
}

/**
 * Calcula quanto tempo o usuário está assinando
 * 
 * @param subscription Detalhes da assinatura
 * @returns Objeto com duração em dias, meses e anos
 */
export function getSubscriptionDuration(subscription: SubscriptionDetails | null): {
  days: number;
  months: number;
  years: number;
} | null {
  if (!subscription || !subscription.createdAt) {
    return null;
  }
  
  const start = new Date(subscription.createdAt);
  const now = new Date();
  
  // Calcular diferença em milissegundos
  const diffMs = now.getTime() - start.getTime();
  
  // Converter para dias
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Calcular meses aproximados (30 dias)
  const months = Math.floor(days / 30);
  
  // Calcular anos
  const years = Math.floor(months / 12);
  
  return { days, months, years };
}

/**
 * Verifica se a assinatura está em período de teste
 * 
 * @param subscription Detalhes da assinatura
 * @returns Se está em período de teste
 */
export function isInTrialPeriod(subscription: SubscriptionDetails | null): boolean {
  if (!subscription) {
    return false;
  }
  
  return subscription.status === 'trialing';
}

/**
 * Verifica se o período de teste está próximo do fim
 * 
 * @param subscription Detalhes da assinatura
 * @param thresholdDays Dias para considerar próximo do fim
 * @returns Se o período de teste está próximo do fim
 */
export function isTrialEndingSoon(
  subscription: SubscriptionDetails | null, 
  thresholdDays: number = 3
): boolean {
  if (!subscription || !isInTrialPeriod(subscription) || subscription.daysUntilTrialEnd === null) {
    return false;
  }
  
  return subscription.daysUntilTrialEnd <= thresholdDays;
}

/**
 * Verifica se a assinatura foi recém-criada
 * 
 * @param subscription Detalhes da assinatura
 * @param thresholdDays Dias para considerar recém-criada
 * @returns Se a assinatura é recente
 */
export function isNewSubscription(
  subscription: SubscriptionDetails | null,
  thresholdDays: number = 7
): boolean {
  if (!subscription || !subscription.createdAt) {
    return false;
  }
  
  const createdAt = new Date(subscription.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays <= thresholdDays;
}