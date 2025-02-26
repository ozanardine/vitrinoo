import { SubscriptionStatus } from '../subscription/subscription-lifecycle';
import { subscriptionLogger } from '../subscription/subscription-logger';
import { supabase } from '../supabase';
import { PlanType } from '../plans';

/**
 * Utilitário para processar eventos do webhook do Stripe no lado do cliente.
 * Complementa o processamento principal que acontece nas Edge Functions.
 */
export class StripeWebhookHandler {
  /**
   * Processa eventos de assinatura localmente
   * @param event Evento recebido
   * @param storeId ID da loja 
   */
  static async handleSubscriptionEvent(
    eventType: string,
    data: any,
    storeId: string
  ) {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(data, storeId);
        break;
        
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(data, storeId);
        break;
        
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(data, storeId);
        break;
        
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(data, storeId);
        break;
    }
  }
  
  /**
   * Processa atualizações de assinatura
   */
  private static async handleSubscriptionUpdate(data: any, storeId: string) {
    try {
      const subscription = data.object;
      const status = subscription.status as SubscriptionStatus;
      const isActive = ['active', 'trialing'].includes(status);
      
      // Determinar o tipo de plano
      let planType: PlanType = 'starter';
      
      // Tentar obter o tipo de plano dos metadados do produto
      if (subscription.items?.data?.[0]?.price?.product?.metadata?.plan_type) {
        const productPlanType = subscription.items.data[0].price.product.metadata.plan_type;
        if (['starter', 'pro', 'enterprise'].includes(productPlanType)) {
          planType = productPlanType as PlanType;
        }
      }
      
      // Atualizar registro da assinatura na loja
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status,
          active: isActive,
          plan_type: planType,
          updated_at: new Date().toISOString()
        })
        .eq('store_id', storeId);
      
      if (error) {
        throw error;
      }
      
      subscriptionLogger.info('Assinatura atualizada no cliente', {
        storeId,
        status,
        planType
      });
    } catch (error) {
      subscriptionLogger.error('Erro ao processar atualização de assinatura', {
        error: error instanceof Error ? error.message : String(error),
        storeId
      });
    }
  }
  
  /**
   * Processa cancelamento de assinatura
   */
  private static async handleSubscriptionCanceled(data: any, storeId: string) {
    try {
      // Atualizar registro na loja
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('store_id', storeId);
      
      if (error) {
        throw error;
      }
      
      subscriptionLogger.info('Assinatura cancelada no cliente', {
        storeId
      });
    } catch (error) {
      subscriptionLogger.error('Erro ao processar cancelamento de assinatura', {
        error: error instanceof Error ? error.message : String(error),
        storeId
      });
    }
  }
  
  /**
   * Processa falha de pagamento
   */
  private static async handlePaymentFailed(data: any, storeId: string) {
    try {
      const invoice = data.object;
      
      if (!invoice.subscription) {
        return; // Ignorar invoices sem subscription
      }
      
      // Atualizar status para past_due
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('store_id', storeId);
      
      if (error) {
        throw error;
      }
      
      // Exibir notificação para o usuário no próximo acesso
      localStorage.setItem('payment_failed_at', new Date().toISOString());
      localStorage.setItem('payment_failed_store', storeId);
      
      subscriptionLogger.warn('Falha no pagamento processada no cliente', {
        storeId,
        invoiceId: invoice.id
      });
    } catch (error) {
      subscriptionLogger.error('Erro ao processar falha de pagamento', {
        error: error instanceof Error ? error.message : String(error),
        storeId
      });
    }
  }
  
  /**
   * Processa pagamento bem-sucedido
   */
  private static async handlePaymentSucceeded(data: any, storeId: string) {
    try {
      const invoice = data.object;
      
      if (!invoice.subscription) {
        return; // Ignorar invoices sem subscription
      }
      
      // Atualizar status para active
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          active: true,
          updated_at: new Date().toISOString()
        })
        .eq('store_id', storeId);
      
      if (error) {
        throw error;
      }
      
      // Limpar notificações pendentes
      localStorage.removeItem('payment_failed_at');
      localStorage.removeItem('payment_failed_store');
      
      subscriptionLogger.info('Pagamento bem-sucedido processado no cliente', {
        storeId,
        invoiceId: invoice.id
      });
    } catch (error) {
      subscriptionLogger.error('Erro ao processar pagamento bem-sucedido', {
        error: error instanceof Error ? error.message : String(error),
        storeId
      });
    }
  }
}