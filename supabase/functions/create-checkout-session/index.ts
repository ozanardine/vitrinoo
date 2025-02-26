import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.11.0';

interface CorsHeaders {
  [key: string]: string;
}

const corsHeaders: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Códigos de erro padronizados
const ERROR_CODES = {
  AUTHENTICATION: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  STRIPE: 'STRIPE_ERROR',
  DATABASE: 'DATABASE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Estrutura padronizada para respostas de erro
 */
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  requestId?: string;
}

/**
 * Inicialização do Stripe com validação
 */
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  console.error('STRIPE_SECRET_KEY não configurada');
  throw new Error('Configuração de ambiente incompleta');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Inicialização do Supabase com validação
 */
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas');
  throw new Error('Configuração de ambiente incompleta');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Gera um ID de requisição único para rastreamento
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formata uma resposta de erro padronizada
 */
function formatErrorResponse(message: string, code: string, details?: any): ErrorResponse {
  const requestId = generateRequestId();
  
  // Logar o erro para referência
  console.error(`[${requestId}] [${code}] ${message}`, details);
  
  return {
    error: message,
    code,
    details,
    requestId
  };
}

/**
 * Handler principal da função
 */
serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] Processando requisição`);
  
  // Tratamento de OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Validar conteúdo da requisição
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify(formatErrorResponse(
          'Método não suportado', 
          ERROR_CODES.VALIDATION,
          { method: req.method }
        )),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse do corpo da requisição
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify(formatErrorResponse(
          'Corpo da requisição inválido', 
          ERROR_CODES.VALIDATION
        )),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { priceId, storeId } = requestBody;
    console.log(`[${requestId}] Criando checkout session:`, { priceId, storeId });

    // Validar parâmetros obrigatórios
    if (!priceId || !storeId) {
      return new Response(
        JSON.stringify(formatErrorResponse(
          'ID do plano e ID da loja são obrigatórios',
          ERROR_CODES.VALIDATION,
          { priceId, storeId }
        )),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify(formatErrorResponse(
          'Não autorizado',
          ERROR_CODES.AUTHENTICATION
        )),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar token JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error(`[${requestId}] Erro de autenticação:`, userError);
      return new Response(
        JSON.stringify(formatErrorResponse(
          'Usuário não autenticado',
          ERROR_CODES.AUTHENTICATION,
          { details: userError?.message }
        )),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar preço no Stripe com tratamento de erro adequado
    let price;
    try {
      price = await stripe.prices.retrieve(priceId);
      
      console.log(`[${requestId}] Preço recuperado:`, { 
        id: price.id, 
        active: price.active,
        type: price.type
      });

      if (!price.active) {
        return new Response(
          JSON.stringify(formatErrorResponse(
            'Plano não está ativo',
            ERROR_CODES.VALIDATION,
            { priceId }
          )),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      console.error(`[${requestId}] Erro ao recuperar preço:`, error);
      return new Response(
        JSON.stringify(formatErrorResponse(
          'Plano não encontrado ou inativo',
          ERROR_CODES.STRIPE,
          { error: error.message }
        )),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar se a loja pertence ao usuário
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
      console.error(`[${requestId}] Erro ao buscar loja:`, storeError);
      return new Response(
        JSON.stringify(formatErrorResponse(
          'Loja não encontrada ou não pertence ao usuário',
          ERROR_CODES.DATABASE,
          { storeId, userId: user.id }
        )),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar ou criar registro de cliente no Stripe
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId;

    if (!customer) {
      console.log(`[${requestId}] Criando novo cliente Stripe para usuário:`, user.id);
      
      try {
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
            email: user.email,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (customerError) {
          console.error(`[${requestId}] Erro ao criar cliente:`, customerError);
          throw new Error('Erro ao criar cliente');
        }

        customerId = stripeCustomer.id;
      } catch (error) {
        console.error(`[${requestId}] Erro ao criar cliente Stripe:`, error);
        return new Response(
          JSON.stringify(formatErrorResponse(
            'Erro ao criar cliente',
            ERROR_CODES.STRIPE,
            { error: error.message }
          )),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      customerId = customer.customer_id;
    }

    // Verificar se já existe uma assinatura, redirecionando para o portal se houver
    const currentSubscription = store.subscriptions?.[0]?.stripe_subscriptions?.subscription_id;
    if (currentSubscription) {
      console.log(`[${requestId}] Criando portal para assinatura existente:`, currentSubscription);
      
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.get('origin')}/profile`,
        });

        return new Response(
          JSON.stringify({ url: session.url }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      } catch (error) {
        console.error(`[${requestId}] Erro ao criar sessão de portal:`, error);
        return new Response(
          JSON.stringify(formatErrorResponse(
            'Erro ao criar sessão do portal',
            ERROR_CODES.STRIPE,
            { error: error.message }
          )),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }
    }

    // Criar checkout session com idempotência
    console.log(`[${requestId}] Criando nova checkout session`);
    const idempotencyKey = `checkout_${storeId}_${priceId}_${Date.now()}`;

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/profile?session_id={CHECKOUT_SESSION_ID}&plan_activated=true`,
        cancel_url: `${req.headers.get('origin')}/profile?payment_cancelled=true`,
        allow_promotion_codes: true,
        metadata: {
          store_id: storeId,
          request_id: requestId
        },
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto'
        },
        subscription_data: {
          // Não fornecemos trial_period_days aqui, pois o usuário já teve um trial automático
          metadata: {
            store_id: storeId,
            created_via: 'checkout_session',
            is_conversion_from_trial: isTrialActive ? 'true' : 'false'
          }
        }
      }, {
        idempotencyKey
      });

      console.log(`[${requestId}] Session criada com sucesso:`, { 
        id: session.id,
        url: session.url,
        status: session.status
      });

      // Registra log da sessão criada
      await supabase.from('stripe_checkout_logs').insert({
        checkout_session_id: session.id,
        user_id: user.id,
        store_id: storeId,
        price_id: priceId,
        created_at: new Date().toISOString(),
        status: 'created',
        request_id: requestId,
        metadata: {
          is_conversion_from_trial: isTrialActive ? 'true' : 'false',
          origin: req.headers.get('origin') || 'unknown'
        }
      });

      return new Response(
        JSON.stringify({ 
          id: session.id,
          url: session.url,
          success: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (error) {
      console.error(`[${requestId}] Erro ao criar checkout session:`, error);
      
      // Registrar o erro no banco de dados para análise
      await supabase.from('stripe_checkout_logs').insert({
        user_id: user.id,
        store_id: storeId,
        price_id: priceId,
        created_at: new Date().toISOString(),
        status: 'error',
        error_message: error.message,
        request_id: requestId
      });
      
      return new Response(
        JSON.stringify(formatErrorResponse(
          'Erro ao criar sessão de checkout',
          ERROR_CODES.STRIPE,
          { 
            error: error.message,
            stripeError: error.type || error.code
          }
        )),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
});