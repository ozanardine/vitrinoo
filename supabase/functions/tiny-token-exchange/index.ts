import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { rateLimit } from './rateLimit.ts';

const TINY_TOKEN_URL = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';
const FUNCTION_KEY = Deno.env.get('FUNCTION_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400'
};

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

serve(async (req) => {
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Apply rate limiting
  try {
    await limiter.check(req, clientIp);
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { 
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': '900' // 15 minutes in seconds
        }
      }
    );
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  // Verify authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== FUNCTION_KEY) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    const { code, clientId, clientSecret, redirectUri, grantType, refreshToken } = await req.json();

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

    // Make request to Tiny
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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack 
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