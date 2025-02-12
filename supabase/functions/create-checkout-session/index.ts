import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { priceId, storeId } = await req.json();
    console.log('Creating checkout session:', { priceId, storeId });

    if (!priceId || !storeId) {
      throw new Error('ID do plano e ID da loja são obrigatórios');
    }

    // Log da chave Stripe sendo usada (parcial)
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
    console.log('Using Stripe key:', `${stripeKey.slice(0, 8)}...`);

    // Verificar price no Stripe
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log('Retrieved price:', { 
        id: price.id, 
        active: price.active,
        type: price.type
      });

      if (!price.active) {
        throw new Error('Plano não está ativo');
      }
    } catch (error) {
      console.error('Error retrieving price from Stripe:', error);
      throw new Error('Plano não encontrado ou inativo no Stripe');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Usuário não autenticado');
    }

    // Verificar loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select(`
        id,
        subscriptions (
          id,
          stripe_subscription_id,
          stripe_subscriptions (
            subscription_id,
            status
          )
        )
      `)
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single();

    if (storeError) {
      console.error('Store error:', storeError);
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

    // Verificar customer
    let { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customer) {
      console.log('Creating new Stripe customer for user:', user.id);
      
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });

      const { data: newCustomer, error: customerError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: stripeCustomer.id,
          email: user.email
        })
        .select()
        .single();

      if (customerError) {
        console.error('Customer creation error:', customerError);
        throw new Error('Erro ao criar cliente');
      }

      customer = newCustomer;
    }

    // Verificar subscription existente
    const currentSubscription = store.subscriptions?.[0]?.stripe_subscriptions?.subscription_id;
    if (currentSubscription) {
      console.log('Creating portal session for existing subscription:', currentSubscription);
      
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.customer_id,
        return_url: `${req.headers.get('origin')}/profile`,
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Criar checkout session
    console.log('Creating new checkout session');
    const session = await stripe.checkout.sessions.create({
      customer: customer.customer_id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/profile`,
      allow_promotion_codes: true,
      metadata: {
        store_id: storeId
      },
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    });

    console.log('Checkout session created:', { 
      id: session.id,
      url: session.url,
      status: session.status
    });

    return new Response(
      JSON.stringify({ id: session.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});