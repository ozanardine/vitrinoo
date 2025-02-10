import { supabase } from './supabase';
import pRetry from 'p-retry';
import pQueue from 'p-queue';

// Constants
const TINY_AUTH_URL = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth';
const TINY_TOKEN_URL = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token';
const TINY_API_URL = 'https://api.tiny.com.br/public-api/v3';

// Queue for API calls during token refresh
const apiQueue = new pQueue({ concurrency: 1 });
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Types
interface TinyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface TinyCredentials {
  store_id: string;
  client_id: string;
  client_secret: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export function getTinyAuthUrl(clientId: string, redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid',
    state
  });

  return `${TINY_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TinyTokenResponse> {
  try {
    // Log inicial dos parâmetros
    console.log('Iniciando troca de código por token:', {
      hasCode: !!code,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri
    });

    // Verificar URL do Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    console.log('Supabase URL:', supabaseUrl);
    
    // Obter chave da função
    const { data: keyData, error: keyError } = await supabase
      .from('function_keys')
      .select('key')
      .eq('name', 'tiny-token-exchange')
      .single();

    if (keyError) {
      console.error('Erro ao obter chave da função:', keyError);
      throw new Error('Erro ao obter chave de função');
    }

    // Construir URL da função
    const functionUrl = `${supabaseUrl}/functions/v1/tiny-token-exchange`;
    console.log('Function URL:', functionUrl);

    // Preparar payload com validação de tipos
    const payload = {
      code: String(code),
      clientId: String(clientId),
      clientSecret: String(clientSecret),
      redirectUri: String(redirectUri),
      grantType: 'authorization_code'
    };

    // Log do payload (sem dados sensíveis)
    console.log('Payload preparado:', {
      ...payload,
      clientSecret: '[REDACTED]'
    });

    // Log da chave (sem expor o valor completo)
    console.log('Auth header preparado:', `Bearer ${keyData.key.substring(0, 5)}...`);

    try {
      // Fazer requisição para a função Edge com validação explícita
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyData.key}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Resposta não-OK da função Edge:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        throw new Error(data.error || 'Erro na troca de token');
      }

      console.log('Token obtido com sucesso');
      return data;
    } catch (fetchError) {
      console.error('Erro no fetch:', {
        name: fetchError.name,
        message: fetchError.message,
        type: typeof fetchError
      });
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Erro detalhado na troca de token:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export async function saveTinyCredentials(
  storeId: string,
  clientId: string,
  clientSecret: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  const { error } = await supabase
    .from('erp_integrations')
    .upsert({
      store_id: storeId,
      provider: 'tiny',
      client_id: clientId,
      client_secret: clientSecret,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      active: true,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

async function getTinyCredentials(storeId: string): Promise<TinyCredentials | null> {
  const { data, error } = await supabase
    .from('erp_integrations')
    .select('*')
    .eq('store_id', storeId)
    .eq('provider', 'tiny')
    .eq('active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getValidTinyToken(storeId: string): Promise<string> {
  const credentials = await getTinyCredentials(storeId);
  
  if (!credentials) {
    throw new Error('Integração com Tiny ERP não encontrada');
  }

  // Se o token atual ainda é válido (com margem de 5 minutos)
  const expiresAt = new Date(credentials.expires_at);
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);

  if (expiresAt > now) {
    return credentials.access_token;
  }

  // Se já está renovando, aguarda a renovação atual
  if (isRefreshing) {
    return refreshPromise!;
  }

  // Inicia processo de renovação
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const { data: keyData, error: keyError } = await supabase
        .from('function_keys')
        .select('key')
        .eq('name', 'tiny-token-exchange')
        .single();

      if (keyError) throw new Error('Erro ao obter chave de função');

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiny-token-exchange`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyData.key}`
        },
        body: JSON.stringify({
          refreshToken: credentials.refresh_token,
          clientId: credentials.client_id,
          clientSecret: credentials.client_secret,
          grantType: 'refresh_token'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao renovar token');
      }

      const { access_token, refresh_token, expires_in } = await response.json();

      // Salva novos tokens
      await saveTinyCredentials(
        storeId,
        credentials.client_id,
        credentials.client_secret,
        access_token,
        refresh_token,
        expires_in
      );

      return access_token;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function callTinyApi(
  storeId: string,
  endpoint: string,
  method: string = 'GET',
  body?: any
) {
  return apiQueue.add(async () => {
    const token = await getValidTinyToken(storeId);
    const apiUrl = `${TINY_API_URL}/${endpoint}`;
    
    const response = await fetch(apiUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Tiny: ${response.statusText}`);
    }

    return response.json();
  });
}

export async function checkTinyIntegrationStatus(storeId: string) {
  try {
    const credentials = await getTinyCredentials(storeId);
    if (!credentials) return false;

    await callTinyApi(storeId, 'info');
    return true;
  } catch (error) {
    console.error('Error checking Tiny integration status:', error);
    return false;
  }
}

export async function syncTinyProducts(storeId: string) {
  try {
    const { data } = await callTinyApi(storeId, 'produtos');

    const detailedProducts = await Promise.all(
      data.map(async (produto: any) => {
        const { data: details } = await callTinyApi(
          storeId,
          `produtos/${produto.id}`
        );
        return details;
      })
    );

    const mappedProducts = detailedProducts.map((produto: any) => ({
      title: produto.nome,
      description: produto.descricao || '',
      brand: produto.marca || '',
      sku: produto.codigo || produto.sku,
      price: parseFloat(produto.preco),
      promotional_price: produto.preco_promocional ? parseFloat(produto.preco_promocional) : null,
      images: produto.imagens?.map((img: any) => img.url) || [],
      tags: produto.tags?.split(',').map((tag: string) => tag.trim()) || [],
      status: produto.situacao === 'A',
      store_id: storeId
    }));

    const { error } = await supabase
      .from('products')
      .upsert(
        mappedProducts,
        {
          onConflict: 'store_id,sku',
          ignoreDuplicates: false
        }
      );

    if (error) throw error;

    return mappedProducts.length;
  } catch (error) {
    console.error('Error syncing Tiny products:', error);
    throw error;
  }
}