import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { rateLimit } from './rateLimit.ts';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface TokenRequest {
  code?: string;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  grantType: 'authorization_code' | 'refresh_token';
  refreshToken?: string;
}

const TINY_TOKEN_URL = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';
const FUNCTION_KEY = Deno.env.get('FUNCTION_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://vitrinoo.netlify.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid request body');
    }

    const { code, clientId, clientSecret, redirectUri, grantType, refreshToken } = requestBody;

    console.log(`Processing ${grantType} request for client ${clientId}`);

    // Validação de parâmetros obrigatórios
    if (!clientId || !clientSecret) {
      throw new Error('Client ID e Client Secret são obrigatórios');
    }

    if (grantType === 'authorization_code' && (!code || !redirectUri)) {
      throw new Error('Code e Redirect URI são obrigatórios para authorization_code');
    }

    if (grantType === 'refresh_token' && !refreshToken) {
      throw new Error('Refresh token é obrigatório para refresh_token');
    }

    // Prepare parameters based on grant type
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

    console.log('Making request to Tiny API');

    // Make request to Tiny
    const response = await fetch(TINY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });

    console.log('Tiny API response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('Tiny API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      throw new Error(data.error_description || 'Erro na comunicação com o Tiny ERP');
    }

    // Log success (sem dados sensíveis)
    console.log(`Successfully processed ${grantType} request for client ${clientId}`);

    // Return response with appropriate CORS headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Function error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
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