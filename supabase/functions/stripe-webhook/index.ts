import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
if (!endpointSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No signature');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    console.log('Received event:', event.id, event.type);

    // Check if event has already been processed
    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('event_id', event.id)
      .single();

    if (existingEvent) {
      console.log('Event already processed:', event.id);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const customerId = session.customer as string;
        const priceId = subscription.items.data[0].price.id;
        const storeId = session.metadata.store_id;

        // Buscar customer no banco
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('id, user_id')
          .eq('customer_id', customerId)
          .single();

        if (!customer) {
          throw new Error('Customer not found');
        }

        // Buscar price no banco
        const { data: price } = await supabase
          .from('stripe_prices')
          .select('id, product_id')
          .eq('price_id', priceId)
          .single();

        if (!price) {
          throw new Error('Price not found');
        }

        // Salvar subscription
        const { data: stripeSubscription } = await supabase
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
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
          })
          .select()
          .single();

        // Atualizar subscription da loja
        await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: stripeSubscription.id,
            status: subscription.status,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            next_payment_at: new Date(subscription.current_period_end * 1000)
          })
          .eq('store_id', storeId);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Atualizar subscription no banco
        await supabase
          .from('stripe_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
          })
          .eq('subscription_id', subscription.id);

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Marcar subscription como cancelada
        await supabase
          .from('stripe_subscriptions')
          .update({
            status: 'canceled',
            ended_at: new Date()
          })
          .eq('subscription_id', subscription.id);

        break;
      }
    }

    // Save event to database
    await supabase
      .from('stripe_events')
      .insert({
        event_id: event.id,
        type: event.type,
        data: event.data
      });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
