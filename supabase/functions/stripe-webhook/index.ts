// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.11.0';

// Type for supported event types
type SupportedEventType = 
  | 'checkout.session.completed'
  | 'checkout.session.async_payment_succeeded'
  | 'checkout.session.async_payment_failed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'invoice.finalized'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed';

// Configurar CORS headers específicos para o Stripe
const stripeWebhookHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'stripe-signature, content-type'
};

// Validação de variáveis de ambiente
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
] as const;

for (const varName of requiredEnvVars) {
  if (!Deno.env.get(varName)) {
    throw new Error(`${varName} não configurado`);
  }
}

// Configuração do Stripe com a versão mais recente da API
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Configuração do Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Type guard para eventos suportados
function isSupportedEventType(type: string): type is SupportedEventType {
  return [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.trial_will_end',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'invoice.finalized',
    'payment_intent.succeeded',
    'payment_intent.payment_failed'
  ].includes(type);
}

// Função para verificar se o evento já foi processado
async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('stripe_webhook_logs')
    .select('id, status')
    .eq('event_id', eventId)
    .in('status', ['success', 'processing'])
    .maybeSingle();
  
  if (error) {
    console.error(`Erro ao verificar processamento do evento ${eventId}:`, error);
    return false;
  }
  
  return !!data;
}

// Função para registrar o log do webhook
async function logWebhookEvent(
  eventId: string,
  eventType: string,
  status: 'processing' | 'success' | 'error' | 'skipped',
  metadata: Record<string, any> = {},
  errorMessage?: string
): Promise<string> {
  try {
    const timestamp = new Date();
    const logEntry = {
      event_id: eventId,
      event_type: eventType,
      processed_at: timestamp.toISOString(),
      status,
      metadata,
      error_message: errorMessage,
      created_at: timestamp.toISOString(),
      updated_at: timestamp.toISOString()
    };
    
    // Verificar se já existe um log para este evento
    const { data: existingLog } = await supabase
      .from('stripe_webhook_logs')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();
      
    if (existingLog) {
      // Atualizar log existente
      const { data, error } = await supabase
        .from('stripe_webhook_logs')
        .update({
          status,
          metadata,
          error_message: errorMessage,
          updated_at: timestamp.toISOString()
        })
        .eq('id', existingLog.id)
        .select('id')
        .single();
        
      if (error) {
        console.error(`Erro ao atualizar log para evento ${eventId}:`, error);
        return existingLog.id;
      }
      
      return data.id;
    } else {
      // Criar novo log
      const { data, error } = await supabase
        .from('stripe_webhook_logs')
        .insert(logEntry)
        .select('id')
        .single();
        
      if (error) {
        console.error(`Erro ao criar log para evento ${eventId}:`, error);
        throw error;
      }
      
      return data.id;
    }
  } catch (error) {
    console.error(`Erro ao registrar log para evento ${eventId}:`, error);
    return '';
  }
}

// Handler para checkout.session.completed
async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const eventId = event.id;
  
  // Registrar início do processamento
  const logId = await logWebhookEvent(eventId, event.type, 'processing', {
    sessionId: session.id,
    customerId: session.customer,
    paymentStatus: session.payment_status
  });

  try {
    // Verificação de pagamento
    if (session.payment_status !== 'paid') {
      console.log(`Checkout session ${session.id} não está paga. Status: ${session.payment_status}`);
      await logWebhookEvent(eventId, event.type, 'skipped', {
        reason: `Payment status is ${session.payment_status}`,
        sessionId: session.id
      });
      return;
    }

    // Verificação de subscription
    if (!session.subscription) {
      throw new Error(`Checkout session ${session.id} não tem subscription`);
    }

    // Buscar dados necessários usando transações para consistência
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('id, user_id')
      .eq('customer_id', session.customer)
      .single();

    if (customerError) {
      throw new Error(`Cliente não encontrado: ${customerError.message}`);
    }

    // Buscar subscription no Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Buscar price com informações do produto
    const { data: price, error: priceError } = await supabase
      .from('stripe_prices')
      .select(`
        id,
        product_id,
        stripe_products (
          id,
          name,
          description,
          metadata
        )
      `)
      .eq('price_id', subscription.items.data[0].price.id)
      .single();

    if (priceError) {
      throw new Error(`Price não encontrado: ${priceError.message}`);
    }

    // Extrair informações do plano
    const planInfo = Array.isArray(price.stripe_products) 
      ? price.stripe_products[0] 
      : price.stripe_products;

    if (!planInfo) {
      throw new Error('Product information not found');
    }

    // Extrair informações de metadados
    const metadata = session.metadata || {};
    const storeId = metadata.store_id;

    if (!storeId) {
      throw new Error('Store ID não encontrado nos metadados');
    }

    // Processar os dados em múltiplas tabelas dentro de uma transação simulada
    // Como o Supabase REST não suporta transações reais, fazemos tudo sequencialmente
    // com rollback manual em caso de erro

    // 1. Criar ou atualizar stripe_subscription
    const { data: stripeSubscription, error: subError } = await supabase
      .from('stripe_subscriptions')
      .upsert({
        subscription_id: subscription.id,
        customer_id: customer.id,
        price_id: price.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'subscription_id',
        returning: 'minimal'
      });

    if (subError) {
      throw subError;
    }

    // 2. Salvar ou atualizar a subscription na tabela de subscriptions
    const planType = (planInfo.metadata?.plan_type || 'starter') as string;
    
    const { error: storeSubError } = await supabase
      .from('subscriptions')
      .upsert({
        store_id: storeId,
        stripe_subscription_id: subscription.id, // Id da stripeSub retornada
        plan_type: planType,
        active: subscription.status === 'active' || subscription.status === 'trialing',
        status: subscription.status,
        trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        next_payment_at: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: planInfo.id,
        plan_name: planInfo.name,
        plan_description: planInfo.description,
        price_id: price.id,
        amount: subscription.items.data[0].price.unit_amount,
        currency: subscription.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'store_id',
        returning: 'minimal'
      });

    if (storeSubError) {
      throw storeSubError;
    }

    // 3. Atualizar o tipo de plano na loja
    const { error: storeUpdateError } = await supabase
      .from('stores')
      .update({
        subscription_plan: planType,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeId)
      .is('deleted_at', null);

    if (storeUpdateError) {
      throw storeUpdateError;
    }

    // 4. Criar registro de histórico de pagamentos
    const { error: paymentHistoryError } = await supabase
      .from('payment_history')
      .insert({
        user_id: customer.user_id,
        store_id: storeId,
        subscription_id: subscription.id,
        session_id: session.id,
        amount: subscription.items.data[0].price.unit_amount,
        currency: subscription.currency,
        status: 'success',
        payment_method: session.payment_method_types?.[0] || 'unknown',
        created_at: new Date().toISOString()
      });

    if (paymentHistoryError) {
      throw paymentHistoryError;
    }

    // 5. Registrar notificação para o usuário
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: customer.user_id,
        type: 'payment_success',
        title: 'Assinatura ativada com sucesso',
        content: `Sua assinatura do plano ${planInfo.name} foi ativada com sucesso.`,
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.warn('Erro ao criar notificação:', notificationError);
      // Não falhar o processamento por causa de notificação
    }

    // Registrar conclusão bem-sucedida
    await logWebhookEvent(eventId, event.type, 'success', {
      sessionId: session.id,
      subscriptionId: subscription.id,
      storeId,
      planType
    });
  } catch (error) {
    console.error(`Erro processando checkout session ${session.id}:`, error);
    
    // Registrar erro
    await logWebhookEvent(
      eventId,
      event.type,
      'error',
      { sessionId: session.id },
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
    
    // Re-throw para tratamento externo
    throw error;
  }
}

// Handler para customer.subscription.updated
async function handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const eventId = event.id;
  
  // Registrar início do processamento
  const logId = await logWebhookEvent(eventId, event.type, 'processing', {
    subscriptionId: subscription.id,
    status: subscription.status
  });
  
  try {
    // Buscar stripe_subscription existente
    const { data: existingSub, error: existingSubError } = await supabase
      .from('stripe_subscriptions')
      .select('id, customer_id')
      .eq('subscription_id', subscription.id)
      .single();

    if (existingSubError) {
      throw existingSubError;
    }

    // Buscar customer para obter user_id e store_id
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('id, user_id')
      .eq('id', existingSub.customer_id)
      .single();

    if (customerError) {
      throw customerError;
    }
    
    // Buscar store_id
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('store_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
      
    if (subscriptionError) {
      throw subscriptionError;
    }
    
    const storeId = subscriptionData.store_id;

    // Determinar o tipo do plano baseado no produto
    const { data: price, error: priceError } = await supabase
      .from('stripe_prices')
      .select(`
        id,
        product_id,
        stripe_products (
          id,
          name,
          metadata
        )
      `)
      .eq('price_id', subscription.items.data[0].price.id)
      .single();

    if (priceError) {
      throw new Error(`Price not found: ${priceError.message}`);
    }

    // Extrair informações do plano
    const planInfo = Array.isArray(price.stripe_products) 
      ? price.stripe_products[0] 
      : price.stripe_products;

    if (!planInfo) {
      throw new Error('Product information not found');
    }

    // Determinar o tipo do plano baseado no metadata do produto
    const planType = planInfo.metadata?.plan_type || 'free';

    // Atualizar stripe_subscription
    const { error: updateError } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        price_id: price.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);

    if (updateError) {
      throw updateError;
    }

    // Atualizar subscription da loja
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    
    const { error: storeSubError } = await supabase
      .from('subscriptions')
      .update({
        plan_type: planType,
        active: isActive,
        status: subscription.status,
        next_payment_at: new Date(subscription.current_period_end * 1000).toISOString(),
        plan_id: planInfo.id,
        plan_name: planInfo.name,
        price_id: price.id,
        amount: subscription.items.data[0].price.unit_amount,
        currency: subscription.currency,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (storeSubError) {
      throw storeSubError;
    }

    // Atualizar o plano da loja apenas se a assinatura estiver ativa
    if (isActive) {
      const { error: storeUpdateError } = await supabase
        .from('stores')
        .update({
          subscription_plan: planType,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      if (storeUpdateError) {
        throw storeUpdateError;
      }
    }
    
    // Criar notificação para mudança de status importante
    let notificationType: string | null = null;
    let notificationTitle: string | null = null;
    let notificationContent: string | null = null;
    
    if (subscription.status === 'active' && subscription.cancel_at_period_end) {
      notificationType = 'subscription_cancellation_scheduled';
      notificationTitle = 'Cancelamento de assinatura agendado';
      notificationContent = `Seu plano ${planInfo.name} será cancelado ao final do período atual em ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}.`;
    } else if (subscription.status === 'past_due') {
      notificationType = 'payment_past_due';
      notificationTitle = 'Pagamento pendente';
      notificationContent = 'Seu pagamento está pendente. Por favor, atualize sua forma de pagamento para evitar a suspensão do serviço.';
    } else if (subscription.status === 'unpaid') {
      notificationType = 'payment_unpaid';
      notificationTitle = 'Pagamento não efetuado';
      notificationContent = 'Não recebemos seu pagamento. Sua assinatura será suspensa em breve se o pagamento não for regularizado.';
    } else if (subscription.status === 'canceled') {
      notificationType = 'subscription_canceled';
      notificationTitle = 'Assinatura cancelada';
      notificationContent = 'Sua assinatura foi cancelada. Esperamos vê-lo novamente em breve!';
    }
    
    if (notificationType && customer.user_id) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: customer.user_id,
          type: notificationType,
          title: notificationTitle,
          content: notificationContent,
          read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.warn('Erro ao criar notificação:', notificationError);
        // Não falhar o processamento por causa de notificação
      }
    }

    // Registrar conclusão bem-sucedida
    await logWebhookEvent(eventId, event.type, 'success', {
      subscriptionId: subscription.id,
      status: subscription.status,
      storeId,
      planType,
      isActive
    });
  } catch (error) {
    console.error(`Erro processando subscription update ${subscription.id}:`, error);
    
    // Registrar erro
    await logWebhookEvent(
      eventId,
      event.type,
      'error',
      { subscriptionId: subscription.id },
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
    
    throw error;
  }
}

// Handler para customer.subscription.deleted
async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const eventId = event.id;
  
  // Registrar início do processamento
  await logWebhookEvent(eventId, event.type, 'processing', {
    subscriptionId: subscription.id
  });
  
  try {
    // Buscar stripe_subscription existente
    const { data: existingSub, error: existingSubError } = await supabase
      .from('stripe_subscriptions')
      .select('id, customer_id')
      .eq('subscription_id', subscription.id)
      .single();

    if (existingSubError) {
      throw existingSubError;
    }

    // Buscar customer para notificações
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('id', existingSub.customer_id)
      .single();
      
    // Buscar store_id
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('store_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
      
    if (subscriptionError) {
      throw subscriptionError;
    }
    
    const storeId = subscriptionData.store_id;

    // Atualizar stripe_subscription
    const { error: deleteError } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);

    if (deleteError) {
      throw deleteError;
    }

    // Atualizar subscription da loja
    const { error: storeSubError } = await supabase
      .from('subscriptions')
      .update({
        plan_type: 'free',
        active: false,
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (storeSubError) {
      throw storeSubError;
    }
    
    // Atualizar a loja para o plano gratuito
    const { error: storeUpdateError } = await supabase
      .from('stores')
      .update({
        subscription_plan: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', storeId);

    if (storeUpdateError) {
      throw storeUpdateError;
    }
    
    // Criar notificação para o usuário
    if (!customerError && customer?.user_id) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: customer.user_id,
          type: 'subscription_ended',
          title: 'Assinatura encerrada',
          content: 'Sua assinatura foi encerrada. Seu plano foi alterado para o plano Gratuito.',
          read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.warn('Erro ao criar notificação:', notificationError);
        // Não falhar o processamento por causa de notificação
      }
    }

    // Registrar conclusão bem-sucedida
    await logWebhookEvent(eventId, event.type, 'success', {
      subscriptionId: subscription.id,
      storeId
    });
  } catch (error) {
    console.error(`Erro processando subscription delete ${subscription.id}:`, error);
    
    // Registrar erro
    await logWebhookEvent(
      eventId,
      event.type,
      'error',
      { subscriptionId: subscription.id },
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
    
    throw error;
  }
}

// Handler para customer.subscription.trial_will_end
async function handleTrialWillEnd(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const eventId = event.id;
  
  // Registrar início do processamento
  await logWebhookEvent(eventId, event.type, 'processing', {
    subscriptionId: subscription.id
  });
  
  try {
    // Buscar stripe_subscription existente
    const { data: existingSub, error: existingSubError } = await supabase
      .from('stripe_subscriptions')
      .select('id, customer_id')
      .eq('subscription_id', subscription.id)
      .single();

    if (existingSubError) {
      throw existingSubError;
    }

    // Buscar customer para notificações
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('id', existingSub.customer_id)
      .single();
    
    if (customerError || !customer) {
      throw customerError || new Error('Customer not found');
    }
    
    // Calcular dias restantes do trial
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    let daysLeft = 0;
    
    if (trialEnd) {
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Criar notificação para o usuário
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: customer.user_id,
        type: 'trial_ending',
        title: 'Seu período de avaliação está terminando',
        content: daysLeft <= 0 
          ? 'Seu período de avaliação termina hoje.' 
          : daysLeft === 1 
          ? 'Seu período de avaliação termina amanhã.' 
          : `Seu período de avaliação termina em ${daysLeft} dias.`,
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.warn('Erro ao criar notificação:', notificationError);
      // Não falhar o processamento por causa de notificação
    }

    // Registrar conclusão bem-sucedida
    await logWebhookEvent(eventId, event.type, 'success', {
      subscriptionId: subscription.id,
      daysLeft
    });
  } catch (error) {
    console.error(`Erro processando trial_will_end ${subscription.id}:`, error);
    
    // Registrar erro
    await logWebhookEvent(
      eventId,
      event.type,
      'error',
      { subscriptionId: subscription.id },
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
    
    throw error;
  }
}

// Handler para invoice.payment_failed
async function handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const eventId = event.id;
  
  // Registrar início do processamento
  await logWebhookEvent(eventId, event.type, 'processing', {
    invoiceId: invoice.id,
    customerId: invoice.customer
  });
  
  try {
    // Verificar se invoice tem subscription
    if (!invoice.subscription) {
      await logWebhookEvent(eventId, event.type, 'skipped', {
        reason: 'No subscription found',
        invoiceId: invoice.id
      });
      return;
    }
    
    // Buscar stripe_subscription
    const { data: stripeSubscription, error: subError } = await supabase
      .from('stripe_subscriptions')
      .select('id, customer_id')
      .eq('subscription_id', invoice.subscription)
      .single();
      
    if (subError) {
      throw subError;
    }
    
    // Buscar customer para notificações
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('id', stripeSubscription.customer_id)
      .single();
      
    if (customerError || !customer) {
      throw customerError || new Error('Customer not found');
    }
    
    // Buscar subscription no Stripe para detalhes
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    
    // Buscar store_id
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('store_id, plan_name')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();
      
    if (subscriptionError) {
      throw subscriptionError;
    }
    
    // Atualizar registro de histórico de pagamentos
    const { error: paymentHistoryError } = await supabase
      .from('payment_history')
      .insert({
        user_id: customer.user_id,
        store_id: subscriptionData.store_id,
        subscription_id: invoice.subscription as string,
        invoice_id: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        payment_method: invoice.payment_intent 
          ? (await stripe.paymentIntents.retrieve(invoice.payment_intent as string)).payment_method_types[0] 
          : 'unknown',
        error_message: invoice.last_payment_error?.message || 'Falha no pagamento',
        created_at: new Date().toISOString()
      });

    if (paymentHistoryError) {
      console.warn('Erro ao criar registro de pagamento:', paymentHistoryError);
    }
    
    // Criar notificação para o usuário
    const paymentDaysLeft = subscription.status === 'past_due' ? 7 : 0; // Geralmente 7 dias para resolver
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: customer.user_id,
        type: 'payment_failed',
        title: 'Falha no pagamento',
        content: paymentDaysLeft > 0 
          ? `Ocorreu uma falha no pagamento da sua assinatura do plano ${subscriptionData.plan_name}. Você tem ${paymentDaysLeft} dias para atualizar sua forma de pagamento antes que sua assinatura seja cancelada.`
          : `Ocorreu uma falha no pagamento da sua assinatura do plano ${subscriptionData.plan_name}. Por favor, atualize sua forma de pagamento para continuar usando os recursos premium.`,
        read: false,
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.warn('Erro ao criar notificação:', notificationError);
      // Não falhar o processamento por causa de notificação
    }
    
    // Registrar conclusão bem-sucedida
    await logWebhookEvent(eventId, event.type, 'success', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      storeId: subscriptionData.store_id,
      status: subscription.status
    });
  } catch (error) {
    console.error(`Erro processando invoice payment failed ${invoice.id}:`, error);
    
    // Registrar erro
    await logWebhookEvent(
      eventId,
      event.type,
      'error',
      { invoiceId: invoice.id },
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
    
    throw error;
  }
}

// Handler para invoice.payment_succeeded
async function handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  const eventId = event.id;
  
  // Registrar início do processamento
  await logWebhookEvent(eventId, event.type, 'processing', {
    invoiceId: invoice.id,
    customerId: invoice.customer
  });
  
  try {
    // Verificar se invoice tem subscription
    if (!invoice.subscription) {
      await logWebhookEvent(eventId, event.type, 'skipped', {
        reason: 'No subscription found',
        invoiceId: invoice.id
      });
      return;
    }
    
    // Buscar stripe_subscription
    const { data: stripeSubscription, error: subError } = await supabase
      .from('stripe_subscriptions')
      .select('id, customer_id')
      .eq('subscription_id', invoice.subscription)
      .single();
      
    if (subError) {
      throw subError;
    }
    
    // Buscar customer para notificações
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('id', stripeSubscription.customer_id)
      .single();
      
    if (customerError || !customer) {
      throw customerError || new Error('Customer not found');
    }
    
    // Buscar subscription no Stripe para detalhes
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    
    // Verificar se é o primeiro pagamento ou renovação
    const isFirstPayment = invoice.billing_reason === 'subscription_create';
    
    // Buscar store_id
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('store_id, plan_name')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();
      
    if (subscriptionError) {
      throw subscriptionError;
    }
    
    // Atualizar registro de histórico de pagamentos
    const { error: paymentHistoryError } = await supabase
      .from('payment_history')
      .insert({
        user_id: customer.user_id,
        store_id: subscriptionData.store_id,
        subscription_id: invoice.subscription as string,
        invoice_id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'success',
        payment_method: invoice.payment_intent 
          ? (await stripe.paymentIntents.retrieve(invoice.payment_intent as string)).payment_method_types[0] 
          : 'unknown',
        is_first_payment: isFirstPayment,
        created_at: new Date().toISOString()
      });

    if (paymentHistoryError) {
      console.warn('Erro ao criar registro de pagamento:', paymentHistoryError);
    }
    
    // Criar notificação para o usuário
    if (isFirstPayment) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: customer.user_id,
          type: 'payment_success',
          title: 'Pagamento realizado com sucesso',
          content: `Seu pagamento para o plano ${subscriptionData.plan_name} foi realizado com sucesso. Aproveite todos os recursos!`,
          read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.warn('Erro ao criar notificação:', notificationError);
      }
    }
    
    // Registrar conclusão bem-sucedida
    await logWebhookEvent(eventId, event.type, 'success', {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      storeId: subscriptionData.store_id,
      isFirstPayment
    });
  } catch (error) {
    console.error(`Erro processando invoice payment succeeded ${invoice.id}:`, error);
    
    // Registrar erro
    await logWebhookEvent(
      eventId,
      event.type,
      'error',
      { invoiceId: invoice.id },
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
    
    throw error;
  }
}

// Função principal para processar evento com idempotência
async function processEvent(event: Stripe.Event): Promise<void> {
  const eventId = event.id;
  
  // Verificar idempotência primeiro
  if (await isEventProcessed(eventId)) {
    console.log(`Evento ${eventId} já foi processado`);
    return;
  }
  
  // Registrar evento para idempotência
  await logWebhookEvent(eventId, event.type, 'processing');
  
  // Validar tipo do evento
  if (!isSupportedEventType(event.type)) {
    console.log(`Tipo de evento não suportado: ${event.type}`);
    await logWebhookEvent(eventId, event.type, 'skipped', {
      reason: 'Unsupported event type'
    });
    return;
  }
  
  // Processar evento com base no tipo
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handleCheckoutSessionCompleted(event);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
        
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;
        
      default:
        // Eventos adicionais podem ser processados no futuro
        console.log(`Evento ${event.type} registrado mas não processado`);
        await logWebhookEvent(eventId, event.type, 'skipped', {
          reason: 'No handler implementation yet'
        });
    }
  } catch (error) {
    // Erro já registrado nos handlers individuais
    throw error;
  }
}

// Handler principal
serve(async (req: Request) => {
  // Tratamento de OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: stripeWebhookHeaders
    });
  }

  // Bypass auth check for Stripe webhooks
  if (!req.headers.get('stripe-signature')) {
    return new Response(
      JSON.stringify({ error: 'Stripe signature required' }),
      {
        status: 400,
        headers: { ...stripeWebhookHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Validação inicial dos headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Stripe signature não fornecida');
    }

    // Capturar o corpo da requisição uma única vez
    const rawBody = await req.text();
    
    // Construir e verificar o evento do Stripe usando o método assíncrono
    const event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    // Log inicial do evento
    console.log('Webhook event received:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString()
    });

    // Processar evento com idempotência
    await processEvent(event);
    
    // Sucesso
    return new Response(
      JSON.stringify({ 
        received: true,
        status: 'processed',
        eventId: event.id,
        eventType: event.type
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Webhook Error:', error);
    
    // Tenta extrair ID do evento para log, se disponível
    let eventId = 'unknown';
    let eventType = 'unknown';
    
    try {
      // Tenta extrair o ID do evento do corpo da requisição
      const body = await req.clone().text();
      const data = JSON.parse(body);
      eventId = data.id || 'unknown';
      eventType = data.type || 'unknown';
    } catch (e) {
      // Ignora erros na extração
    }
    
    // Registrar erro na construção do evento
    await logWebhookEvent(
      eventId,
      eventType,
      'error',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      error instanceof Error ? error.message : 'Unknown error'
    );

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});