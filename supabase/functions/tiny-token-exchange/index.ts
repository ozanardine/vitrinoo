import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { rateLimit } from './rateLimit.ts';

const TINY_TOKEN_URL = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';
const TINY_API_URL = 'https://api.tiny.com.br/public-api/v3';
const FUNCTION_KEY = Deno.env.get('FUNCTION_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vitrinoo.netlify.app',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

async function handleAPIRequest(url: URL, method: string, token: string, reqBody?: string) {
  try {
    const endpoint = url.searchParams.get('endpoint');
    if (!endpoint) {
      throw new Error('Endpoint é obrigatório');
    }

    console.log('Fazendo requisição para Tiny API:', {
      url: `${TINY_API_URL}/${endpoint}`,
      method,
      hasBody: !!reqBody
    });

    const response = await fetch(`${TINY_API_URL}/${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: method !== 'GET' ? reqBody : undefined
    });

    console.log('Resposta da Tiny API:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers)
    });

    const responseText = await response.text();
    console.log('Corpo da resposta:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Erro ao fazer parse do JSON:', e);
      throw new Error(`Erro ao processar resposta da API: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(data.message || 'Erro na API do Tiny');
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erro na chamada da API:', error);
    throw error;
  }
}

async function handleTokenRequest(req: Request) {
  const requestBody = await req.json();
  const { code, clientId, clientSecret, redirectUri, grantType, refreshToken } = requestBody;

  if (!clientId || !clientSecret) {
    throw new Error('Client ID e Client Secret são obrigatórios');
  }

  if (grantType === 'authorization_code' && (!code || !redirectUri)) {
    throw new Error('Code e Redirect URI são obrigatórios para authorization_code');
  }

  if (grantType === 'refresh_token' && !refreshToken) {
    throw new Error('Refresh token é obrigatório para refresh_token');
  }

  const params = new URLSearchParams();
  params.append('grant_type', grantType);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  if (grantType === 'authorization_code') {
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
  } else if (grantType === 'refresh_token') {
    params.append('refresh_token', refreshToken);
  }

  const response = await fetch(TINY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || 'Erro na comunicação com o Tiny ERP');
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers)
  });

  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  
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
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== FUNCTION_KEY) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const reqBody = req.method !== 'GET' ? await req.text() : undefined;

    // Se não tiver token nos parâmetros, é uma requisição de token
    const token = url.searchParams.get('token');
    if (!token) {
      return handleTokenRequest(new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: reqBody
      }));
    }

    // Se tiver token, é uma requisição para a API
    return await handleAPIRequest(url, req.method, token, reqBody);

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        type: error.name
      }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});