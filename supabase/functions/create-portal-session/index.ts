import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import Stripe from 'https://esm.sh/stripe@13.11.0';
import { corsHeaders } from '../_shared/cors.ts';

// Validação das variáveis de ambiente
const REQUIRED_ENV_VARS = ['STRIPE_SECRET_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

for (const varName of REQUIRED_ENV_VARS) {
  if (!Deno.env.get(varName)) {
    console.error(`Variável de ambiente ${varName} não configurada`);
    throw new Error(`Configuração incompleta: ${varName} não definido`);
  }
}

// Inicialização do Stripe e Supabase
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Códigos de erro padronizados
const ErrorCode = {
  AUTH: 'auth_error',
  VALIDATION: 'validation_error',
  NOT_FOUND: 'not_found',
  STRIPE: 'stripe_error',
  INTERNAL: 'internal_error'
};

/**
 * Gera um ID de requisição único para rastreamento
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Handler principal da função
 */
serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] Iniciando processamento de requisição`);

  // Tratamento de OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Verificar autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log(`[${requestId}] Requisição sem token de autorização`);
      return new Response(
        JSON.stringify({ 
          error: 'Não autorizado',
          code: ErrorCode.AUTH,
          requestId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    // Verificar token JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error(`[${requestId}] Erro ao validar usuário:`, userError);
      return new Response(
        JSON.stringify({ 
          error: 'Você precisa estar logado para acessar o portal de pagamento',
          code: ErrorCode.AUTH,
          details: userError?.message,
          requestId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    console.log(`[${requestId}] Criando portal session para usuário: ${user.id}`);

    // Buscar customer do Stripe
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id, created_at')
      .eq('user_id', user.id) 
      .single();

    if (customerError) {
      console.error(`[${requestId}] Customer não encontrado:`, customerError);
      return new Response(
        JSON.stringify({ 
          error: 'Você ainda não tem uma assinatura ativa',
          code: ErrorCode.NOT_FOUND,
          requestId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Verificar customer no Stripe
    try {
      const stripeCustomer = await stripe.customers.retrieve(customer.customer_id);
      console.log(`[${requestId}] Cliente Stripe recuperado:`, {
        id: stripeCustomer.id,
        email: stripeCustomer.email,
        created: stripeCustomer.created
      });
      
      // Garantir que não é um cliente excluído
      if (stripeCustomer.deleted) {
        throw new Error('Cliente excluído no Stripe');
      }
    } catch (stripeError) {
      console.error(`[${requestId}] Erro ao verificar cliente Stripe:`, stripeError);
      
      // Registrar o erro no log
      await supabase.from('stripe_portal_logs').insert({
        user_id: user.id,
        customer_id: customer.customer_id,
        status: 'error',
        error_message: stripeError.message || 'Erro desconhecido',
        created_at: new Date().toISOString(),
        request_id: requestId
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao verificar assinatura. Por favor, entre em contato com o suporte.',
          code: ErrorCode.STRIPE,
          details: stripeError.message,
          requestId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Criar portal session com idempotência
    try {
      console.log(`[${requestId}] Criando portal session`);
      const idempotencyKey = `portal_${user.id}_${Date.now()}`;
      
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
      }, {
        idempotencyKey
      });

      console.log(`[${requestId}] Portal session criada:`, {
        id: session.id,
        url: session.url
      });

      // Registrar sessão criada
      await supabase.from('stripe_portal_logs').insert({
        user_id: user.id,
        customer_id: customer.customer_id,
        session_id: session.id,
        status: 'created',
        created_at: new Date().toISOString(),
        request_id: requestId
      });

      return new Response(
        JSON.stringify({ 
          url: session.url,
          sessionId: session.id,
          success: true,
          requestId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (stripeError) {
      console.error(`[${requestId}] Erro Stripe:`, stripeError);
      
      // Registrar o erro no log
      await supabase.from('stripe_portal_logs').insert({
        user_id: user.id,
        customer_id: customer.customer_id,
        status: 'error',
        error_message: stripeError.message || 'Erro desconhecido',
        created_at: new Date().toISOString(),
        request_id: requestId
      });
      
      let errorMessage = 'Erro ao criar sessão do portal. Por favor, tente novamente.';
      let errorCode = ErrorCode.STRIPE;
      
      if (stripeError.type === 'StripeInvalidRequestError') {
        if (stripeError.message.includes('No configuration provided')) {
          errorMessage = 'Portal do cliente não está configurado. Por favor, entre em contato com o suporte.';
          errorCode = ErrorCode.VALIDATION;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: errorCode,
          details: stripeError.message,
          requestId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] Erro não tratado:`, error);
    
    // Registrar erro não tratado
    try {
      await supabase.from('error_logs').insert({
        function_name: 'create-portal-session',
        error_message: error.message || 'Erro desconhecido',
        stack_trace: error.stack,
        created_at: new Date().toISOString(),
        request_id: requestId
      });
    } catch (logError) {
      console.error(`[${requestId}] Erro ao registrar log:`, logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno no servidor. Por favor, tente novamente mais tarde.',
        code: ErrorCode.INTERNAL,
        requestId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});