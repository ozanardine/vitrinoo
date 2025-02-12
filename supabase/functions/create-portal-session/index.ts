import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.11.0';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Você precisa estar logado para acessar o portal de pagamento');
    }

    // Buscar customer
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id) 
      .single();

    if (customerError) {
      console.error('Customer error:', customerError);
      throw new Error('Você ainda não tem uma assinatura ativa');
    }

    if (!customer) {
      throw new Error('Você ainda não tem uma assinatura ativa');
    }

    // Verify if customer exists in Stripe
    try {
      await stripe.customers.retrieve(customer.customer_id);
    } catch (stripeError) {
      console.error('Stripe customer error:', stripeError);
      throw new Error('Erro ao verificar assinatura. Por favor, entre em contato com o suporte.');
    }

    try {
      // Criar portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.customer_id,
        return_url: `${req.headers.get('origin')}/profile`,
        configuration: {
          business_profile: {
            headline: 'Gerencie sua assinatura',
            privacy_policy_url: `${req.headers.get('origin')}/privacy`,
            terms_of_service_url: `${req.headers.get('origin')}/terms`
          },
          features: {
            subscription_cancel: {
              enabled: true,
              mode: 'at_period_end',
              proration_behavior: 'none'
            },
            subscription_pause: {
              enabled: false
            },
            payment_method_update: {
              enabled: true
            },
            customer_update: {
              enabled: true,
              allowed_updates: ['email', 'tax_id']
            },
            invoice_history: {
              enabled: true
            }
          }
        }
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      
      // Handle specific Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        if (stripeError.message.includes('No configuration provided')) {
          throw new Error('Portal do cliente não está configurado. Por favor, entre em contato com o suporte.');
        }
      }
      
      throw new Error('Erro ao criar sessão do portal. Por favor, tente novamente.');
    }
  } catch (error: any) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: error.message.includes('não está logado') ? 401 : 400
      }
    );
  }
});