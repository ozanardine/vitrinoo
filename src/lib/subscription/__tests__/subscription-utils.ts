import { supabase } from '../../supabase';
import { PlanType } from '../../plans';
import { SubscriptionStatus } from '../subscription-lifecycle';

/**
 * Utilitários para testar o sistema de assinaturas
 * ATENÇÃO: Estes utilitários são apenas para ambiente de desenvolvimento!
 */
export const SubscriptionTestUtils = {
  /**
   * Cria uma assinatura de teste
   */
  async createTestSubscription(
    storeId: string, 
    planType: PlanType = 'enterprise',
    status: SubscriptionStatus = 'trialing',
    daysUntilEnd: number = 7
  ) {
    if (process.env.NODE_ENV === 'production') {
      console.error('SubscriptionTestUtils não devem ser usados em produção!');
      return null;
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + daysUntilEnd);
    
    const subscriptionId = `test_${storeId}_${Date.now()}`;
    
    try {
      // Verificar se já existe uma assinatura
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('store_id', storeId)
        .maybeSingle();
      
      if (existingSubscription) {
        console.log('Já existe uma assinatura para esta loja:', existingSubscription);
        return { success: false, error: 'Já existe uma assinatura' };
      }
      
      // Criar uma nova assinatura
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          store_id: storeId,
          stripe_subscription_id: subscriptionId,
          plan_type: planType,
          active: status === 'active' || status === 'trialing',
          status,
          trial_ends_at: status === 'trialing' ? endDate.toISOString() : null,
          next_payment_at: endDate.toISOString(),
          plan_name: this.getPlanName(planType),
          amount: this.getPlanPrice(planType),
          currency: 'brl',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          metadata: {
            is_test: true,
            created_by: 'test_utils'
          }
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar assinatura de teste:', error);
        return { success: false, error };
      }
      
      return { success: true, subscription: data };
    } catch (error) {
      console.error('Erro ao criar assinatura de teste:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Remove todas as assinaturas de teste
   */
  async cleanupTestSubscriptions() {
    if (process.env.NODE_ENV === 'production') {
      console.error('SubscriptionTestUtils não devem ser usados em produção!');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .delete()
        .like('stripe_subscription_id', 'test_%')
        .select('id');
      
      if (error) {
        console.error('Erro ao limpar assinaturas de teste:', error);
        return { success: false, error };
      }
      
      return { success: true, deleted: data?.length || 0 };
    } catch (error) {
      console.error('Erro ao limpar assinaturas de teste:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Simula expiração de período de teste
   */
  async simulateTrialExpiration(storeId: string) {
    if (process.env.NODE_ENV === 'production') {
      console.error('SubscriptionTestUtils não devem ser usados em produção!');
      return null;
    }
    
    try {
      // Buscar assinatura
      const { data: subscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('id, stripe_subscription_id')
        .eq('store_id', storeId)
        .eq('status', 'trialing')
        .single();
      
      if (fetchError || !subscription) {
        console.error('Assinatura de trial não encontrada:', fetchError);
        return { success: false, error: 'Assinatura não encontrada' };
      }
      
      // Atualizar para expirada
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          trial_ends_at: yesterday.toISOString(),
          status: 'incomplete_expired',
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
      
      if (updateError) {
        console.error('Erro ao expirar trial:', updateError);
        return { success: false, error: updateError };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao simular expiração de trial:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Retorna o nome do plano
   */
  getPlanName(planType: PlanType): string {
    switch (planType) {
      case 'starter': return 'Starter';
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      default: return 'Desconhecido';
    }
  },
  
  /**
   * Retorna o preço do plano em centavos
   */
  getPlanPrice(planType: PlanType): number {
    switch (planType) {
      case 'starter': return 4900; // R$ 49,00
      case 'pro': return 9900;     // R$ 99,00
      case 'enterprise': return 19900; // R$ 199,00
      default: return 0;
    }
  }
};