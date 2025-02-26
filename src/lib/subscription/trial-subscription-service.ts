import { supabase } from '../supabase';
import { subscriptionLogger } from './subscription-logger';
import { subscriptionMetrics } from './subscription-metrics';
import { SubscriptionStateMachine, SubscriptionTrigger } from './subscription-state-machine';
import { AppError, ErrorCategory, ErrorCode } from '../errors';

/**
 * Serviço para gerenciar o provisionamento automático de período de teste
 */
export class TrialSubscriptionService {
  /**
   * Cria uma assinatura de teste do plano Enterprise para um novo usuário
   * 
   * @param userId - ID do usuário
   * @param storeId - ID da loja
   * @returns Objeto com resultado da operação
   */
  async createTrialSubscription(userId: string, storeId: string): Promise<{
    success: boolean;
    subscriptionId?: string;
    error?: string;
    trialEndsAt?: string;
  }> {
    try {
      subscriptionLogger.info('Iniciando criação de assinatura de teste', {
        userId,
        storeId
      });

      // Verificar se já existe uma assinatura para esta loja
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id, stripe_subscription_id, status')
        .eq('store_id', storeId)
        .maybeSingle();

      if (existingSubscription) {
        subscriptionLogger.info('Assinatura já existe para esta loja', {
          storeId,
          subscriptionId: existingSubscription.id
        });
        
        return {
          success: false,
          error: 'Uma assinatura já existe para esta loja'
        };
      }

      // Calcular data de término do trial (7 dias a partir de agora)
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(now.getDate() + 7); // 7 dias de trial
      
      const trialEndsAt = trialEndDate.toISOString();

      // Criar um ID de assinatura interno fictício
      const subscriptionId = `trial_${storeId}_${Date.now()}`;

      // Criar registro na tabela de assinaturas
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          store_id: storeId,
          stripe_subscription_id: subscriptionId, // ID interno para trials
          plan_type: 'enterprise', // Plano Enterprise para trial
          active: true,
          status: 'trialing',
          trial_ends_at: trialEndsAt,
          next_payment_at: trialEndsAt, // Próximo pagamento será no fim do trial
          plan_name: 'Enterprise',
          plan_id: 'enterprise_trial',
          amount: 19900, // Preço do plano Enterprise em centavos
          currency: 'brl',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          metadata: {
            is_auto_trial: true,
            created_by: 'system',
            trial_start: now.toISOString(),
            trial_end: trialEndsAt
          }
        })
        .select('id')
        .single();

      if (subscriptionError) {
        throw new AppError({
          code: ErrorCode.SERVER_DATABASE_ERROR,
          category: ErrorCategory.SERVER,
          message: 'Erro ao criar assinatura de teste',
          originalError: subscriptionError,
        });
      }

      // Atualizar a loja com o tipo de plano
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          subscription_plan: 'enterprise',
          updated_at: now.toISOString()
        })
        .eq('id', storeId);

      if (storeError) {
        subscriptionLogger.warn('Erro ao atualizar loja com o plano de teste', {
          storeId,
          error: storeError.message
        });
        // Continuar mesmo com erro, apenas logando
      }

      // Criar notificação para o usuário
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'trial_started',
          title: 'Boas-vindas! Seu período de teste começou',
          content: 'Você tem acesso ao plano Enterprise gratuitamente por 7 dias. Aproveite todos os recursos premium!',
          read: false,
          created_at: now.toISOString(),
          metadata: {
            trial_end: trialEndsAt,
            plan_type: 'enterprise'
          }
        });

      if (notificationError) {
        subscriptionLogger.warn('Erro ao criar notificação de início de trial', {
          userId,
          error: notificationError.message
        });
        // Continuar mesmo com erro, apenas logando
      }

      // Registrar a transição de estado na máquina de estados
      const stateMachine = new SubscriptionStateMachine();
      await stateMachine.transition(subscriptionId, SubscriptionTrigger.CREATE, {
        userId,
        storeId,
        trialEndsAt
      });

      // Registrar métricas
      subscriptionMetrics.counters.newSubscription('enterprise');
      
      subscriptionLogger.info('Assinatura de teste criada com sucesso', {
        userId,
        storeId,
        subscriptionId,
        trialEndsAt
      });

      return {
        success: true,
        subscriptionId,
        trialEndsAt
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      
      subscriptionLogger.error('Erro ao criar assinatura de teste', {
        userId,
        storeId,
        error: message
      });

      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Configura o processamento para criar automaticamente um trial quando uma nova loja for criada
   * 
   * @param onUserRegistered - Função para anexar ao evento de registro de usuário
   */
  setupAutoTrialOnRegistration(onUserRegistered: (userId: string, storeId: string) => Promise<void>): void {
    // Esta função seria chamada durante a inicialização da aplicação 
    // para configurar os listeners de eventos necessários
    
    // Exemplo de implementação:
    onUserRegistered = async (userId: string, storeId: string) => {
      await this.createTrialSubscription(userId, storeId);
    };
  }
}