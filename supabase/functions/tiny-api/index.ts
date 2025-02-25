import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

interface ErrorResponse {
  error: string;
  type: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vitrinoo.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

const TINY_API_URL = 'https://api.tiny.com.br/public-api/v3';

serve(async (req) => {
  // Handle CORS preflight
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

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const storeId = url.searchParams.get('storeId');
    const method = req.method;

    if (!endpoint || !storeId) {
      throw new Error('Endpoint e storeId são obrigatórios');
    }

    // Verificar autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se a loja pertence ao usuário
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      throw new Error('Loja não encontrada ou não pertence ao usuário');
    }

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
      // Renovar token
      const functionUrl = `${supabaseUrl}/functions/v1/tiny-token-exchange`;
      const { data: keyData } = await supabase
        .from('function_keys')
        .select('key')
        .eq('name', 'tiny-token-exchange')
        .single();

      if (!keyData?.key) {
        throw new Error('Erro ao obter chave de função');
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyData.key}`
        },
        body: JSON.stringify({
          refreshToken: integration.refresh_token,
          clientId: integration.client_id,
          clientSecret: integration.client_secret,
          grantType: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao renovar token');
      }

      const { access_token } = await response.json();
      integration.access_token = access_token;
    }

    // Fazer requisição para o Tiny
    const tinyUrl = `${TINY_API_URL}/${endpoint}`;
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
        status: error.message === 'Não autorizado' ? 401 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});