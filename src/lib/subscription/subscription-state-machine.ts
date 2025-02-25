/**
 * Máquina de estados para gerenciar transições de assinatura
 * 
 * Implementa o padrão State Machine para garantir transições
 * válidas entre os diferentes estados de uma assinatura.
 */
import { SubscriptionStatus, SubscriptionDetails } from './subscription-lifecycle';
import { subscriptionLogger } from './subscription-logger';
import { SubscriptionService } from './subscription-service';
import { DatabaseTransaction } from './database-transaction';
import { AppError, ErrorCategory, ErrorCode } from './errors';

// Tipos de eventos que podem provocar transições
export enum SubscriptionTrigger {
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  TRIAL_ENDED = 'trial_ended',
  MANUAL_CANCEL = 'manual_cancel',
  AUTO_CANCEL = 'auto_cancel',
  PLAN_CHANGED = 'plan_changed',
  PAYMENT_RETRY_FAILED = 'payment_retry_failed',
  PAYMENT_RETRY_SUCCEEDED = 'payment_retry_succeeded',
  REACTIVATE = 'reactivate',
  CREATE = 'create'
}

// Mapeamento de transições válidas
const VALID_TRANSITIONS: Record<SubscriptionStatus, Partial<Record<SubscriptionTrigger, SubscriptionStatus>>> = {
  'inactive': {
    [SubscriptionTrigger.CREATE]: 'trialing',
  },
  'trialing': {
    [SubscriptionTrigger.PAYMENT_SUCCEEDED]: 'active',
    [SubscriptionTrigger.PAYMENT_FAILED]: 'incomplete',
    [SubscriptionTrigger.TRIAL_ENDED]: 'incomplete',
    [SubscriptionTrigger.MANUAL_CANCEL]: 'canceled',
  },
  'active': {
    [SubscriptionTrigger.PAYMENT_SUCCEEDED]: 'active', // renew
    [SubscriptionTrigger.PAYMENT_FAILED]: 'past_due',
    [SubscriptionTrigger.MANUAL_CANCEL]: 'canceled',
    [SubscriptionTrigger.AUTO_CANCEL]: 'canceled',
    [SubscriptionTrigger.PLAN_CHANGED]: 'active',
  },
  'past_due': {
    [SubscriptionTrigger.PAYMENT_RETRY_SUCCEEDED]: 'active',
    [SubscriptionTrigger.PAYMENT_RETRY_FAILED]: 'unpaid',
    [SubscriptionTrigger.MANUAL_CANCEL]: 'canceled',
  },
  'unpaid': {
    [SubscriptionTrigger.PAYMENT_RETRY_SUCCEEDED]: 'active',
    [SubscriptionTrigger.MANUAL_CANCEL]: 'canceled',
    [SubscriptionTrigger.AUTO_CANCEL]: 'canceled',
    [SubscriptionTrigger.REACTIVATE]: 'active',
  },
  'canceled': {
    [SubscriptionTrigger.REACTIVATE]: 'active',
    [SubscriptionTrigger.CREATE]: 'trialing',
  },
  'incomplete': {
    [SubscriptionTrigger.PAYMENT_SUCCEEDED]: 'active',
    [SubscriptionTrigger.PAYMENT_FAILED]: 'incomplete_expired',
    [SubscriptionTrigger.MANUAL_CANCEL]: 'canceled',
  },
  'incomplete_expired': {
    [SubscriptionTrigger.MANUAL_CANCEL]: 'canceled',
    [SubscriptionTrigger.CREATE]: 'trialing',
  }
};

/**
 * Gerencia as transições de estado das assinaturas
 */
export class SubscriptionStateMachine {
  private subscriptionService: SubscriptionService;
  
  constructor(subscriptionService?: SubscriptionService) {
    this.subscriptionService = subscriptionService || new SubscriptionService();
  }
  
  /**
   * Verifica se uma transição é válida
   * 
   * @param currentStatus - Status atual
   * @param trigger - Gatilho da transição
   * @returns Se a transição é válida
   */
  isValidTransition(currentStatus: SubscriptionStatus, trigger: SubscriptionTrigger): boolean {
    const transitions = VALID_TRANSITIONS[currentStatus];
    return !!transitions && transitions[trigger] !== undefined;
  }
  
  /**
   * Obtém o próximo status com base na transição
   * 
   * @param currentStatus - Status atual
   * @param trigger - Gatilho da transição
   * @returns Próximo status ou null se a transição for inválida
   */
  getNextStatus(currentStatus: SubscriptionStatus, trigger: SubscriptionTrigger): SubscriptionStatus | null {
    if (!this.isValidTransition(currentStatus, trigger)) {
      return null;
    }
    
    return VALID_TRANSITIONS[currentStatus][trigger] as SubscriptionStatus;
  }
  
  /**
   * Executa uma transição de estado
   * 
   * @param subscriptionId - ID da assinatura
   * @param trigger - Gatilho da transição
   * @param metadata - Metadados adicionais para a transição
   * @returns Resultado da transição
   */
  async transition(
    subscriptionId: string,
    trigger: SubscriptionTrigger,
    metadata: Record<string, any> = {}
  ): Promise<{
    success: boolean;
    previousStatus?: SubscriptionStatus;
    newStatus?: SubscriptionStatus;
    error?: string;
  }> {
    try {
      // Buscar assinatura atual
      const subscription = await this.subscriptionService.getSubscriptionByStore(subscriptionId);
      
      if (!subscription && trigger !== SubscriptionTrigger.CREATE) {
        return {
          success: false,
          error: 'Assinatura não encontrada'
        };
      }
      
      const currentStatus = subscription?.status || 'inactive';
      
      // Verificar se a transição é válida
      if (!this.isValidTransition(currentStatus, trigger)) {
        return {
          success: false,
          previousStatus: currentStatus,
          error: `Transição inválida: ${currentStatus} -> ${trigger}`
        };
      }
      
      // Obter próximo status
      const newStatus = this.getNextStatus(currentStatus, trigger)!;
      
      subscriptionLogger.stateTransition(subscriptionId, currentStatus, newStatus, {
        trigger,
        metadata
      });
      
      // Aplicar transição usando transação do banco
      const transaction = new DatabaseTransaction();
      
      // Atualizar status na tabela de assinaturas
      transaction.update(
        'subscriptions',
        {
          status: newStatus,
          active: ['active', 'trialing'].includes(newStatus),
          updated_at: new Date().toISOString()
        },
        { stripe_subscription_id: subscriptionId }
      );
      
      // Atualizar status na tabela stripe_subscriptions
      transaction.update(
        'stripe_subscriptions',
        {
          status: newStatus,
          updated_at: new Date().toISOString(),
          metadata: {
            ...metadata,
            last_transition: {
              from: currentStatus,
              to: newStatus,
              trigger,
              timestamp: new Date().toISOString()
            }
          }
        },
        { subscription_id: subscriptionId }
      );
      
      // Registrar transição no histórico
      transaction.insert(
        'subscription_transitions',
        {
          subscription_id: subscriptionId,
          from_status: currentStatus,
          to_status: newStatus,
          trigger,
          metadata,
          created_at: new Date().toISOString()
        }
      );
      
      // Executar transação
      await transaction.execute();
      
      return {
        success: true,
        previousStatus: currentStatus,
        newStatus
      };
    } catch (error) {
      subscriptionLogger.error('Erro ao executar transição de assinatura', {
        subscriptionId,
        trigger,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Executa ações relacionadas após uma transição de estado
   * 
   * @param subscriptionId - ID da assinatura
   * @param previousStatus - Status anterior
   * @param newStatus - Novo status
   * @param metadata - Metadados adicionais
   */
  async executePostTransitionActions(
    subscriptionId: string,
    previousStatus: SubscriptionStatus,
    newStatus: SubscriptionStatus,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Buscar informações da assinatura
      const subscription = await this.subscriptionService.getSubscriptionByStore(subscriptionId);
      
      if (!subscription) {
        return;
      }
      
      // Criar notificações baseadas nas transições
      switch (newStatus) {
        case 'active':
          if (previousStatus === 'past_due' || previousStatus === 'unpaid') {
            // Pagamento recuperado após atraso
            await this.subscriptionService.createNotification(
              metadata.userId,
              'payment_success',
              'Pagamento realizado com sucesso',
              'Seu pagamento foi processado e sua assinatura está ativa novamente.',
              { subscriptionId, previousStatus, newStatus }
            );
          } else if (previousStatus === 'trialing') {
            // Fim do trial com pagamento bem-sucedido
            await this.subscriptionService.createNotification(
              metadata.userId,
              'trial_ended',
              'Período de avaliação concluído',
              'Seu período de avaliação foi concluído e sua assinatura foi ativada com sucesso.',
              { subscriptionId, previousStatus, newStatus }
            );
          } else if (previousStatus === 'canceled') {
            // Reativação da assinatura
            await this.subscriptionService.createNotification(
              metadata.userId,
              'subscription_created',
              'Assinatura reativada',
              `Sua assinatura do plano ${subscription.planName} foi reativada com sucesso.`,
              { subscriptionId, previousStatus, newStatus }
            );
          }
          break;
          
        case 'past_due':
          // Pagamento atrasado
          await this.subscriptionService.createNotification(
            metadata.userId,
            'payment_past_due',
            'Pagamento pendente',
            'Seu pagamento está pendente. Por favor, atualize sua forma de pagamento para evitar a suspensão do serviço.',
            { subscriptionId, previousStatus, newStatus }
          );
          break;
          
        case 'unpaid':
          // Pagamento não efetuado
          await this.subscriptionService.createNotification(
            metadata.userId,
            'payment_unpaid',
            'Pagamento não efetuado',
            'Não recebemos seu pagamento. Sua assinatura será suspensa em breve se o pagamento não for regularizado.',
            { subscriptionId, previousStatus, newStatus }
          );
          break;
          
        case 'canceled':
          // Assinatura cancelada
          await this.subscriptionService.createNotification(
            metadata.userId,
            'subscription_canceled',
            'Assinatura cancelada',
            'Sua assinatura foi cancelada. Esperamos vê-lo novamente em breve!',
            { subscriptionId, previousStatus, newStatus }
          );
          break;
      }
    } catch (error) {
      subscriptionLogger.error('Erro ao executar ações pós-transição', {
        subscriptionId,
        previousStatus,
        newStatus,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}