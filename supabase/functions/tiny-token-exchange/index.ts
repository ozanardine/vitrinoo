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

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== FUNCTION_KEY) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    
    // Verificar se é uma chamada de token ou API
    if (url.pathname.endsWith('/tiny-token-exchange')) {
      let requestBody;
      try {
        requestBody = await req.json();
      } catch (e) {
        throw new Error('Invalid request body');
      }

      const { code, clientId, clientSecret, redirectUri, grantType, refreshToken } = requestBody;

      // Validações para troca de token
      if (!clientId || !clientSecret) {
        throw new Error('Client ID e Client Secret são obrigatórios');
      }

      if (grantType === 'authorization_code' && (!code || !redirectUri)) {
        throw new Error('Code e Redirect URI são obrigatórios para authorization_code');
      }

      if (grantType === 'refresh_token' && !refreshToken) {
        throw new Error('Refresh token é obrigatório para refresh_token');
      }

      // Preparar parâmetros do token
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

      // Fazer request para o Tiny
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
    // Se não for troca de token, é chamada da API
    else {
      const storeId = url.searchParams.get('storeId');
      const endpoint = url.searchParams.get('endpoint');
      const method = req.method;

      if (!storeId || !endpoint) {
        throw new Error('storeId e endpoint são obrigatórios');
      }

      // Fazer request para a API do Tiny
      const tinyUrl = `${TINY_API_URL}/${endpoint}`;
      const token = url.searchParams.get('token');

      if (!token) {
        throw new Error('Token é obrigatório');
      }

      const response = await fetch(tinyUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
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
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Function error:', error);
    
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