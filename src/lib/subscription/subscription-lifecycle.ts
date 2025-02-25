/**
 * @module subscription-lifecycle
 * @description
 * Sistema para gerenciamento do ciclo de vida de assinaturas do Stripe.
 * 
 * Este módulo é responsável por:
 * - Gerenciar transições de estado das assinaturas
 * - Processar eventos de pagamento
 * - Verificar elegibilidade para recursos específicos
 * - Fornecer informações sobre assinaturas ativas
 * - Gerar notificações para os usuários
 * 
 * Fluxo principal:
 * 1. Criação de assinatura (checkout.session.completed)
 * 2. Monitoramento de pagamentos (invoice.payment_succeeded/failed)
 * 3. Gerenciamento de estados (active, past_due, etc)
 * 4. Cancelamento/Renovação
 */

import { supabase } from '../supabase';
import { AppError, ErrorCategory, ErrorCode } from '../errors';
import { PlanType, getPlanLimits } from '../plans';

/**
 * Estados possíveis para assinatura
 * 
 * @remarks
 * Estes estados correspondem principalmente aos estados do Stripe,
 * com algumas adições específicas da aplicação.
 * 
 * Fluxo típico dos estados:
 * 1. trialing → active → canceled
 * OU
 * 2. trialing → active → past_due → unpaid → canceled
 */
export type SubscriptionStatus = 
  /** Sem assinatura ativa */
  | 'inactive'    
  /** Período de teste em andamento */
  | 'trialing'    
  /** Assinatura ativa e paga */
  | 'active'      
  /** Pagamento atrasado, período de carência */
  | 'past_due'    
  /** Pagamento não efetuado após período de carência */
  | 'unpaid'      
  /** Assinatura cancelada */
  | 'canceled'    
  /** Aguardando primeiro pagamento */
  | 'incomplete'  
  /** Primeiro pagamento falhou */
  | 'incomplete_expired';

/**
 * Eventos possíveis no ciclo de vida
 */
export type SubscriptionEvent =
  /** Assinatura criada */
  | 'subscription_created'
  /** Assinatura atualizada */
  | 'subscription_updated'
  /** Assinatura renovada automaticamente */
  | 'subscription_renewed'
  /** Assinatura cancelada */
  | 'subscription_canceled'
  /** Pagamento bem-sucedido */
  | 'payment_succeeded'
  /** Falha no pagamento */
  | 'payment_failed'
  /** Início do período de teste */
  | 'trial_started'
  /** Alerta de fim próximo do período de teste */
  | 'trial_ending'
  /** Fim do período de teste */
  | 'trial_ended'
  /** Mudança de plano */
  | 'plan_changed'
  /** Transição para pagamento atrasado */
  | 'past_due'
  /** Transição para pagamento não efetuado */
  | 'unpaid';

/**
 * Tipos de notificação para o usuário
 */
export type NotificationType =
  /** Pagamento realizado com sucesso */
  | 'payment_success'
  /** Falha no pagamento */
  | 'payment_failed'
  /** Pagamento atrasado */
  | 'payment_past_due'
  /** Pagamento não efetuado */
  | 'payment_unpaid'
  /** Assinatura cancelada */
  | 'subscription_canceled'
  /** Assinatura criada */
  | 'subscription_created'
  /** Assinatura renovada */
  | 'subscription_renewed'
  /** Início do período de teste */
  | 'trial_started'
  /** Alerta de fim próximo do período de teste */
  | 'trial_ending'
  /** Fim do período de teste */
  | 'trial_ended'
  /** Plano alterado */
  | 'plan_changed'
  /** Cancelamento agendado para fim do período */
  | 'subscription_cancellation_scheduled'
  /** Assinatura encerrada */
  | 'subscription_ended';

/**
 * Detalhes de uma assinatura
 */
export interface SubscriptionDetails {
  /** ID da assinatura no Stripe */
  id: string;                      
  /** ID da loja associada */
  storeId: string;                 
  /** Status atual */
  status: SubscriptionStatus;      
  /** Tipo de plano */
  planType: PlanType;              
  /** Nome do plano */
  planName: string;                
  /** Se está ativa atualmente */
  isActive: boolean;               
  /** Data de criação */
  createdAt: string;               
  /** Início do período atual */
  periodStart: string;             
  /** Fim do período atual */
  periodEnd: string | null;        
  /** Fim do período de teste (se aplicável) */
  trialEnd: string | null;         
  /** Se será cancelada no fim do período */
  cancelAtPeriodEnd: boolean;      
  /** Preço em centavos */
  price: number;                   
  /** Moeda (default: BRL) */
  currency: string;                
  /** Data de cancelamento (se aplicável) */
  canceledAt: string | null;       
  /** Motivo do cancelamento (se aplicável) */
  canceledReason: string | null;   
  /** Intervalo de cobrança */
  interval: 'month' | 'year';      
  /** Dias até o próximo pagamento */
  daysUntilDue: number | null;     
  /** Dias até o fim do período de teste */
  daysUntilTrialEnd: number | null;
  /** Data de pausa (se aplicável) */
  pausedAt: string | null;         
}

/**
 * Obtém os detalhes de uma assinatura pelo storeId
 * 
 * @param storeId ID da loja
 * @returns Detalhes da assinatura
 * @throws AppError se ocorrer um erro no banco de dados
 */
export async function getSubscriptionByStore(storeId: string): Promise<SubscriptionDetails | null> {
  const startTime = Date.now();
  
  try {
    console.info(`[SUBSCRIPTION] Buscando assinatura para loja ${storeId}`);

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
      console.info(`[SUBSCRIPTION] Nenhuma assinatura encontrada para loja ${storeId}`);
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
        console.warn(
          `[SUBSCRIPTION] Erro ao buscar detalhes do Stripe para assinatura ${subscription.stripe_subscription_id}`, 
          stripeError
        );
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
    
    // Registrar métrica de tempo para diagnóstico de performance
    const duration = Date.now() - startTime;
    console.debug(`[SUBSCRIPTION] Consulta de assinatura completada em ${duration}ms`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(
      `[SUBSCRIPTION] Erro ao buscar assinatura para loja ${storeId} (${duration}ms)`, 
      error instanceof Error ? error.message : String(error)
    );
    
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
      console.error(
        `[SUBSCRIPTION] Assinatura ${subscriptionId} não encontrada`,
        error
      );
      return null;
    }

    // Reutilizar a função getSubscriptionByStore
    return getSubscriptionByStore(subscription.store_id);
  } catch (error) {
    console.error(
      `[SUBSCRIPTION] Erro ao buscar assinatura por ID do Stripe ${subscriptionId}`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * Verifica se uma assinatura está em um estado específico
 * 
 * @param subscription Detalhes da assinatura
 * @param status Status a verificar (único ou array)
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
  console.debug(
    `[SUBSCRIPTION] Verificando disponibilidade de recurso '${feature}' para assinatura`,
    subscription?.id
  );
  
  // Se não tem assinatura ou não está ativa, usa o plano gratuito
  const planType = (subscription && subscription.isActive) ? subscription.planType : 'free';
  
  // Verificar se o plano tem o recurso (via metadados)
  const planLimits = await getPlanLimits(planType);
  
  let isAvailable = false;
  
  switch (feature) {
    case 'imgur_upload':
      isAvailable = !!planLimits.metadata.imgur_enabled;
      break;
    case 'priority_support':
      isAvailable = ['basic', 'plus'].includes(planType);
      break;
    case 'erp_integration':
      isAvailable = planType === 'plus';
      break;
    case 'ai_descriptions':
      isAvailable = planType === 'plus';
      break;
    case 'custom_domain':
      isAvailable = ['basic', 'plus'].includes(planType);
      break;
    case 'api_access':
      isAvailable = planType === 'plus';
      break;
    case 'analytics':
      isAvailable = ['basic', 'plus'].includes(planType);
      break;
    default:
      isAvailable = false;
  }
  
  return isAvailable;
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
      console.error(
        `[SUBSCRIPTION] Erro ao criar notificação de tipo ${type} para usuário ${userId}`,
        error
      );
      return '';
    }

    console.info(
      `[SUBSCRIPTION] Notificação ${data.id} de tipo ${type} criada para usuário ${userId}`
    );

    return data.id;
  } catch (error) {
    console.error(
      `[SUBSCRIPTION] Erro ao criar notificação de tipo ${type} para usuário ${userId}`,
      error instanceof Error ? error.message : String(error)
    );
    return '';
  }
}

/**
 * Atualiza o status de uma assinatura
 * 
 * @param subscriptionId ID da assinatura
 * @param newStatus Novo status
 * @param userId ID do usuário (opcional, para notificações)
 * @param metadata Metadados adicionais
 * @returns Se a atualização foi bem-sucedida
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  newStatus: SubscriptionStatus,
  userId?: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    // Buscar status atual para registro de transição
    const { data: currentSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('status, store_id, plan_type, user_id')
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
    const ownerUserId = userId || currentSub.user_id;
    
    // Não atualizar se não houve alteração
    if (oldStatus === newStatus) {
      console.info(
        `[SUBSCRIPTION] Status já é ${newStatus} para assinatura ${subscriptionId}, nenhuma alteração necessária`
      );
      return true;
    }
    
    console.info(
      `[SUBSCRIPTION] Atualizando status de assinatura ${subscriptionId} de ${oldStatus} para ${newStatus}`
    );
    
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
      console.warn(
        `[SUBSCRIPTION] Erro ao atualizar status na tabela stripe_subscriptions para ${subscriptionId}`,
        stripeSubError.message
      );
      // Não falhar a operação principal por causa disso
    }
    
    // Registrar na tabela de transições para histórico
    const { error: transitionError } = await supabase
      .from('subscription_transitions')
      .insert({
        subscription_id: subscriptionId,
        from_status: oldStatus,
        to_status: newStatus,
        metadata,
        created_at: new Date().toISOString()
      });
      
    if (transitionError) {
      console.warn(
        `[SUBSCRIPTION] Erro ao registrar transição para ${subscriptionId}`,
        transitionError.message
      );
      // Não falhar a operação principal por causa disso  
    }
    
    // Criar notificação baseada na transição
    await handleStatusChangeNotification(
      subscriptionId,
      oldStatus,
      newStatus,
      ownerUserId,
      planType
    );
    
    return true;
  } catch (error) {
    console.error(
      `[SUBSCRIPTION] Erro ao atualizar status da assinatura ${subscriptionId} para ${newStatus}`,
      error instanceof Error ? error.message : String(error)
    );
    
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

/**
 * Cria notificações apropriadas após mudança de status
 * 
 * @param subscriptionId ID da assinatura
 * @param oldStatus Status anterior
 * @param newStatus Novo status
 * @param userId ID do usuário
 * @param planType Tipo do plano
 */
async function handleStatusChangeNotification(
  subscriptionId: string,
  oldStatus: SubscriptionStatus,
  newStatus: SubscriptionStatus,
  userId: string,
  planType: PlanType
): Promise<void> {
  if (!userId) return;
  
  // Criar notificação apropriada
  try {
    // Determinar o tipo de notificação e mensagem
    let notificationType: NotificationType;
    let title: string;
    let content: string;
    
    switch (newStatus) {
      case 'active':
        if (oldStatus === 'trialing') {
          notificationType = 'trial_ended';
          title = 'Período de avaliação concluído';
          content = 'Seu período de avaliação foi concluído e sua assinatura foi ativada com sucesso.';
        } else if (oldStatus === 'past_due' || oldStatus === 'unpaid') {
          notificationType = 'payment_success';
          title = 'Pagamento realizado com sucesso';
          content = 'Seu pagamento foi processado e sua assinatura está ativa novamente.';
        } else if (oldStatus === 'canceled' || oldStatus === 'inactive') {
          notificationType = 'subscription_created';
          title = 'Assinatura ativada';
          content = `Sua assinatura do plano ${planNameForType(planType)} foi ativada com sucesso.`;
        } else {
          // Para outros casos, não precisa notificar
          return;
        }
        break;
        
      case 'past_due':
        notificationType = 'payment_past_due';
        title = 'Pagamento pendente';
        content = 'Seu pagamento está pendente. Por favor, atualize sua forma de pagamento para evitar a suspensão do serviço.';
        break;
        
      case 'unpaid':
        notificationType = 'payment_unpaid';
        title = 'Pagamento não efetuado';
        content = 'Não recebemos seu pagamento. Sua assinatura será suspensa em breve se o pagamento não for regularizado.';
        break;
        
      case 'canceled':
        notificationType = 'subscription_canceled';
        title = 'Assinatura cancelada';
        content = 'Sua assinatura foi cancelada. Esperamos vê-lo novamente em breve!';
        break;
        
      case 'trialing':
        notificationType = 'trial_started';
        title = 'Período de avaliação iniciado';
        content = `Seu período de avaliação do plano ${planNameForType(planType)} foi iniciado. Aproveite todos os recursos!`;
        break;
        
      default:
        // Outros estados não precisam de notificação
        return;
    }
    
    // Criar notificação
    await createNotification(
      userId,
      notificationType,
      title,
      content,
      {
        subscriptionId,
        oldStatus,
        newStatus,
        planType
      }
    );
  } catch (error) {
    console.error(
      `[SUBSCRIPTION] Erro ao criar notificação para mudança de status ${oldStatus} -> ${newStatus}`,
      error instanceof Error ? error.message : String(error)
    );
    // Não propagar o erro, apenas registrá-lo
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

/**
 * Retorna o nome amigável do plano com base no tipo
 * 
 * @param planType Tipo do plano
 * @returns Nome amigável do plano
 */
function planNameForType(planType: PlanType): string {
  switch (planType) {
    case 'free':
      return 'Gratuito';
    case 'basic':
      return 'Básico';
    case 'plus':
      return 'Plus';
    default:
      return 'Desconhecido';
  }
}

/**
 * Verifica se uma assinatura será renovada automaticamente
 * 
 * @param subscription Detalhes da assinatura
 * @returns Se a assinatura será renovada
 */
export function willAutoRenew(subscription: SubscriptionDetails | null): boolean {
  if (!subscription) {
    return false;
  }
  
  // Se o status não for ativo ou trial, não renova
  if (!['active', 'trialing'].includes(subscription.status)) {
    return false;
  }
  
  // Se estiver configurada para cancelar no fim do período, não renova
  if (subscription.cancelAtPeriodEnd) {
    return false;
  }
  
  return true;
}

/**
 * Verifica se uma assinatura está com pagamento atrasado
 * 
 * @param subscription Detalhes da assinatura
 * @returns Se o pagamento está atrasado
 */
export function isPaymentOverdue(subscription: SubscriptionDetails | null): boolean {
  if (!subscription) {
    return false;
  }
  
  return ['past_due', 'unpaid'].includes(subscription.status);
}

/**
 * Determina se uma loja pode usar um recurso específico com base
 * no plano atual e no estado da assinatura
 * 
 * @param storeId ID da loja
 * @param feature Nome do recurso a verificar
 * @returns Se a loja pode usar o recurso
 */
export async function canStoreUseFeature(storeId: string, feature: string): Promise<boolean> {
  // Obter assinatura da loja
  const subscription = await getSubscriptionByStore(storeId);
  
  // Verificar se está ativa
  const isActive = subscription && (
    subscription.status === 'active' || 
    subscription.status === 'trialing'
  );
  
  // Se não estiver ativa, só pode usar features do plano gratuito
  if (!isActive) {
    return await isFeatureAvailable({ ...subscription, planType: 'free', isActive: false } as SubscriptionDetails, feature);
  }
  
  // Verificar elegibilidade para o recurso
  return await isFeatureAvailable(subscription, feature);
}