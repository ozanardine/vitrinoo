import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { rateLimit } from './rateLimit.ts';

const TINY_API_URL = 'https://api.tiny.com.br/public-api/v3';
const FUNCTION_KEY = Deno.env.get('FUNCTION_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vitrinoo.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

serve(async (req) => {
  // Log da requisição recebida
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers)
  });

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Handle CORS preflight requests primeiro
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: {
        ...corsHeaders,
        'Content-Length': '0',
        'Content-Type': 'text/plain'
      }
    });
  }

  // Apply rate limiting
  try {
    await limiter.check(req, clientIp);
  } catch (error) {
    console.log('Rate limit exceeded for IP:', clientIp);
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { 
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': '900'
        }
      }
    );
  }

  try {
    // Verificar autorização
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header recebido:', authHeader?.substring(0, 20) + '...');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Header de autorização inválido');
      throw new Error('Unauthorized');
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extraído:', token.substring(0, 20) + '...');

    if (token !== FUNCTION_KEY) {
      console.error('Token não corresponde à chave da função');
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const storeId = url.searchParams.get('storeId');
    const method = req.method;

    if (!endpoint || !storeId) {
      throw new Error('Endpoint e storeId são obrigatórios');
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar credenciais do Tiny
    const { data: integration, error: integrationError } = await supabase
      .from('erp_integrations')
      .select('*')
      .eq('store_id', storeId)
      .eq('provider', 'tiny')
      .eq('active', true)
      .single();

    if (integrationError || !integration) {
      throw new Error('Integração não encontrada ou inativa');
    }

    // Verificar se o token está expirado
    const expiresAt = new Date(integration.expires_at);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // 5 minutos de margem

    if (expiresAt <= now) {
      // Renovar token usando a mesma lógica do tiny-token-exchange
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', integration.client_id);
      params.append('client_secret', integration.client_secret);
      params.append('refresh_token', integration.refresh_token);

      const tokenResponse = await fetch('https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      if (!tokenResponse.ok) {
        throw new Error('Erro ao renovar token');
      }

      const tokenData = await tokenResponse.json();

      // Atualizar tokens no banco
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

      await supabase
        .from('erp_integrations')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('store_id', storeId)
        .eq('provider', 'tiny');

      integration.access_token = tokenData.access_token;
    }

    // Fazer requisição para o Tiny
    const tinyUrl = `${TINY_API_URL}/${endpoint}`;
    console.log('Fazendo requisição para:', tinyUrl);

    const response = await fetch(tinyUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: method !== 'GET' ? await req.text() : undefined
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na API do Tiny:', data);
      throw new Error(data.message || 'Erro na API do Tiny');
    }

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error: any) {
    console.error('Erro na função tiny-api:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        type: error.name
      }),
      {
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});