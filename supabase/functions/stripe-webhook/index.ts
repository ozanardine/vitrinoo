import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.11.0';

// Configuração do Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
if (!endpointSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
}

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`
    }
  }
});

serve(async (req: Request) => {
  // Bypass Supabase auth for webhook
  req.headers.set('Authorization', `Bearer ${supabaseServiceKey}`);
  // Log da requisição
  console.log('Webhook request received:', {
    method: req.method,
    url: req.url
  });

  // Tratamento de OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Verificar assinatura do Stripe
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Webhook Error: Assinatura não fornecida');
      throw new Error('Assinatura não fornecida');
    }

    const body = await req.text();
    
    // Construir evento do Stripe
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    console.log('Processing webhook event:', {
      id: event.id,
      type: event.type,
      created: event.created
    });

    // Registrar recebimento do webhook
    await supabase
      .from('stripe_webhook_logs')
      .insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date(),
        status: 'processing'
      });

    // Processar eventos específicos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing completed checkout session:', {
          id: session.id,
          customer: session.customer,
          status: session.status,
          payment_status: session.payment_status
        });

        if (session.payment_status !== 'paid') {
          console.log('Payment not completed yet:', session.payment_status);
          return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }

        // Buscar assinatura no Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log('Retrieved subscription:', {
          id: subscription.id,
          status: subscription.status
        });

        // Buscar customer
        const { data: customer, error: customerError } = await supabase
          .from('stripe_customers')
          .select('id, user_id')
          .eq('customer_id', session.customer)
          .single();

        if (customerError) {
          throw new Error(`Customer not found: ${customerError.message}`);
        }

        // Buscar price
        const { data: price, error: priceError } = await supabase
          .from('stripe_prices')
          .select('id, product_id')
          .eq('price_id', subscription.items.data[0].price.id)
          .single();

        if (priceError) {
          throw new Error(`Price not found: ${priceError.message}`);
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

        // Atualizar subscription da loja
        const { error: storeSubError } = await supabase
          .from('subscriptions')
          .upsert({
            store_id: session.metadata.store_id,
            stripe_subscription_id: stripeSubscription.id,
            status: subscription.status,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            next_payment_at: new Date(subscription.current_period_end * 1000),
            updated_at: new Date()
          });

        if (storeSubError) {
          throw storeSubError;
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
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
            updated_at: new Date()
          })
          .eq('stripe_subscription_id', existingSub.id);

        if (storeSubError) {
          throw storeSubError;
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

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

        break;
      }
    }

    // Atualizar log com sucesso
    await supabase
      .from('stripe_webhook_logs')
      .update({ 
        status: 'success',
        updated_at: new Date()
      })
      .eq('event_id', event.id);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Webhook Error:', {
      message: error.message,
      stack: error.stack
    });

    // Registrar erro no log
    try {
      await supabase
        .from('stripe_webhook_logs')
        .insert({
          event_id: `error_${Date.now()}`,
          event_type: 'error',
          processed_at: new Date(),
          status: 'error',
          error_message: error.message
        });
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
