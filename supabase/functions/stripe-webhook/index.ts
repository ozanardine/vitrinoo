// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.11.0';

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

// Type guard para eventos suportados
function isSupportedEventType(type: string): type is SupportedEventType {
  return [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted'
  ].includes(type);
}

// Handler para checkout.session.completed
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  console.log('Processing checkout session:', {
    id: session.id,
    customer: session.customer,
    payment_status: session.payment_status
  });

  if (session.payment_status !== 'paid') {
    console.log('Payment not completed yet:', session.payment_status);
    return;
  }

  if (!session.subscription) {
    throw new Error('No subscription found in session');
  }

  // Buscar assinatura no Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  // Buscar customer
  const { data: customer, error: customerError } = await supabase
    .from('stripe_customers')
    .select('id, user_id')
    .eq('customer_id', session.customer)
    .single();

  if (customerError) {
    throw new Error(`Customer not found: ${customerError.message}`);
  }

  // Buscar price com informações do produto
  const { data: price, error: priceError } = await supabase
    .from('stripe_prices')
    .select(`
      id,
      product_id,
      stripe_products (
        id,
        name,
        description
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
  
  // Salvar stripe_subscription
  const { data: stripeSubscription, error: subError } = await supabase
    .from('stripe_subscriptions')
    .insert({
      subscription_id: subscription.id,
      customer_id: customer.id,
      price_id: price.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      created_at: new Date()
    })
    .select()
    .single();

  if (subError) {
    throw subError;
  }

  // Atualizar subscription da loja com informações completas do plano
  const { error: storeSubError } = await supabase
    .from('subscriptions')
    .upsert({
      store_id: session.metadata.store_id,
      stripe_subscription_id: stripeSubscription.id,
      status: subscription.status,
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      next_payment_at: new Date(subscription.current_period_end * 1000),
      plan_id: planInfo.id,
      plan_name: planInfo.name,
      plan_description: planInfo.description,
      price_id: price.id,
      amount: subscription.items.data[0].price.unit_amount,
      currency: subscription.currency,
      updated_at: new Date()
    });

  if (storeSubError) {
    throw storeSubError;
  }
}

// Handler para customer.subscription.updated
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  // Buscar stripe_subscription existente
  const { data: existingSub, error: existingSubError } = await supabase
    .from('stripe_subscriptions')
    .select('id')
    .eq('subscription_id', subscription.id)
    .single();

  if (existingSubError) {
    throw existingSubError;
  }

  // Buscar price com informações do produto
  const { data: price, error: priceError } = await supabase
    .from('stripe_prices')
    .select(`
      id,
      product_id,
      stripe_products (
        id,
        name,
        description
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

  // Atualizar stripe_subscription
  const { error: updateError } = await supabase
    .from('stripe_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      price_id: price.id,
      updated_at: new Date()
    })
    .eq('id', existingSub.id);

  if (updateError) {
    throw updateError;
  }

  // Atualizar subscription da loja
  const { error: storeSubError } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      next_payment_at: new Date(subscription.current_period_end * 1000),
      plan_id: planInfo.id,
      plan_name: planInfo.name,
      plan_description: planInfo.description,
      price_id: price.id,
      amount: subscription.items.data[0].price.unit_amount,
      currency: subscription.currency,
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', existingSub.id);

  if (storeSubError) {
    throw storeSubError;
  }
}

// Handler para customer.subscription.deleted
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  // Buscar stripe_subscription existente
  const { data: existingSub, error: existingSubError } = await supabase
    .from('stripe_subscriptions')
    .select('id')
    .eq('subscription_id', subscription.id)
    .single();

  if (existingSubError) {
    throw existingSubError;
  }

  // Atualizar stripe_subscription
  const { error: deleteError } = await supabase
    .from('stripe_subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date(),
      updated_at: new Date()
    })
    .eq('id', existingSub.id);

  if (deleteError) {
    throw deleteError;
  }

  // Atualizar subscription da loja
  const { error: storeSubError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', existingSub.id);

  if (storeSubError) {
    throw storeSubError;
  }
}

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

// Tipos de eventos suportados
type SupportedEventType = 
  | 'checkout.session.completed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted';

// Função para verificar se o evento já foi processado
async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('stripe_webhook_logs')
    .select('status')
    .eq('event_id', eventId)
    .eq('status', 'success')
    .single();
  
  return !!data;
}

// Função para registrar o log do webhook
async function logWebhookEvent(
  eventId: string,
  eventType: string,
  status: 'processing' | 'success' | 'error',
  errorMessage?: string
) {
  const timestamp = new Date();
  
  await supabase
    .from('stripe_webhook_logs')
    .upsert({
      event_id: eventId,
      event_type: eventType,
      processed_at: timestamp,
      status,
      error_message: errorMessage,
      updated_at: timestamp
    });
}

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

    // Verificar idempotência
    if (await isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed`);
      return new Response(
        JSON.stringify({ received: true, status: 'already_processed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Registrar início do processamento
    await logWebhookEvent(event.id, event.type, 'processing');
    console.log('Processing webhook event:', {
      id: event.id,
      type: event.type,
      created: event.created
    });


    // Validar tipo do evento
    if (!isSupportedEventType(event.type)) {
      console.log(`Unsupported event type: ${event.type}`);
      return new Response(
        JSON.stringify({ received: true, status: 'unsupported_event' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Processar evento com base no tipo
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          await handleCheckoutSessionCompleted(event);
          break;
        }
        case 'customer.subscription.updated': {
          await handleSubscriptionUpdated(event);
          break;
        }
        case 'customer.subscription.deleted': {
          await handleSubscriptionDeleted(event);
          break;
        }
      }

      // Registrar sucesso
      await logWebhookEvent(event.id, event.type, 'success');

      return new Response(
        JSON.stringify({ received: true, status: 'processed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (error) {
      // Registrar erro específico do processamento
      await logWebhookEvent(
        event.id,
        event.type,
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      // Retornar 200 mesmo com erro para evitar retentativas do Stripe
      return new Response(
        JSON.stringify({ 
          received: true,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
  } catch (error) {
    console.error('Webhook Error:', error);

    // Registrar erro de construção do evento
    await logWebhookEvent(
      `error_${Date.now()}`,
      'error',
      'error',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
