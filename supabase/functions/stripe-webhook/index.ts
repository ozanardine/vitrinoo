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
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Webhook Error: No signature provided');
      throw new Error('No signature');
    }

    const body = await req.text();
    console.log('Webhook received body:', body.slice(0, 500)); // Log primeiros 500 caracteres

    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    console.log('Webhook event:', { id: event.id, type: event.type });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing checkout session:', {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          metadata: session.metadata
        });

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log('Retrieved subscription:', {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end
        });

        const customerId = session.customer as string;
        const priceId = subscription.items.data[0].price.id;
        const storeId = session.metadata.store_id;

        // Buscar customer
        const { data: customer, error: customerError } = await supabase
          .from('stripe_customers')
          .select('id, user_id')
          .eq('customer_id', customerId)
          .single();

        if (customerError) {
          console.error('Customer lookup error:', customerError);
          throw new Error(`Customer not found: ${customerError.message}`);
        }

        // Buscar price
        const { data: price, error: priceError } = await supabase
          .from('stripe_prices')
          .select('id, product_id')
          .eq('price_id', priceId)
          .single();

        if (priceError) {
          console.error('Price lookup error:', priceError);
          throw new Error(`Price not found: ${priceError.message}`);
        }

        // Salvar subscription
        const { data: stripeSubscription, error: subscriptionError } = await supabase
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

        if (subscriptionError) {
          console.error('Error saving stripe subscription:', subscriptionError);
          throw subscriptionError;
        }

        console.log('Saved stripe subscription:', stripeSubscription);

        // Atualizar subscription da loja
        const { error: storeSubError } = await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: stripeSubscription.id,
            status: subscription.status,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            next_payment_at: new Date(subscription.current_period_end * 1000)
          })
          .eq('store_id', storeId);

        if (storeSubError) {
          console.error('Error updating store subscription:', storeSubError);
          throw storeSubError;
        }

        console.log('Successfully processed checkout session');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Processing subscription update:', {
          id: subscription.id,
          status: subscription.status
        });

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
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
          })
          .eq('subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          throw updateError;
        }

        console.log('Successfully updated subscription');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Processing subscription deletion:', { id: subscription.id });

        const { error: deleteError } = await supabase
          .from('stripe_subscriptions')
          .update({
            status: 'canceled',
            ended_at: new Date()
          })
          .eq('subscription_id', subscription.id);

        if (deleteError) {
          console.error('Error marking subscription as canceled:', deleteError);
          throw deleteError;
        }

        console.log('Successfully marked subscription as canceled');
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    console.error('Webhook Error:', {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});