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
    // Primeiro obter a chave da função
    const { data: keyData, error: keyError } = await supabase
      .from('function_keys')
      .select('key')
      .eq('name', 'tiny-token-exchange')
      .single();

    if (keyError) throw new Error('Erro ao obter chave de função');
    if (!keyData?.key) throw new Error('Chave de função não encontrada');

    // Limpar e validar o token
    let cleanToken = keyData.key;
    cleanToken = cleanToken.replace(/[\n\r\s]+/g, '');
    
    if (cleanToken.includes('base64,')) {
      cleanToken = cleanToken.split('base64,')[1];
    }

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiny-token-exchange`;
    
    const payload = {
      code: String(code),
      clientId: String(clientId),
      clientSecret: String(clientSecret),
      redirectUri: String(redirectUri),
      grantType: 'authorization_code'
    };

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro na requisição');
    }

    return response.json();
  } catch (error: any) {
    throw new Error(`Erro na troca de token: ${error.message}`);
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

    // Apenas verifica se há credenciais válidas, sem fazer chamada à API
    const expiresAt = new Date(credentials.expires_at);
    const now = new Date();
    return expiresAt > now && credentials.active;
  } catch (error) {
    // Retorna false silenciosamente em caso de erro
    return false;
  }
}

export async function syncTinyProducts(storeId: string) {
  try {
    // Verificar se a integração está ativa
    const isActive = await checkTinyIntegrationStatus(storeId);
    if (!isActive) {
      throw new Error('Integração com Tiny ERP não está ativa');
    }

    // Buscar lista de produtos
    const { data: productsList } = await callTinyApi(storeId, 'produtos');
    if (!productsList?.length) {
      return 0; // Retorna 0 se não houver produtos
    }

    // Buscar detalhes dos produtos com retry
    const detailedProducts = await pRetry(
      async () => {
        return Promise.all(
          productsList.map(async (produto: any) => {
            try {
              const { data: details } = await callTinyApi(
                storeId,
                `produtos/${produto.id}`
              );
              return details;
            } catch (error) {
              throw new Error(`Erro ao buscar detalhes do produto ${produto.id}`);
            }
          })
        );
      },
      {
        retries: 3,
        onFailedAttempt: error => {
          throw new Error(`Falha ao sincronizar produtos após ${error.attemptNumber} tentativas`);
        }
      }
    );

    // Mapear produtos para o formato do banco
    const mappedProducts = detailedProducts
      .filter(produto => produto) // Remove produtos sem detalhes
      .map(produto => ({
        title: produto.nome,
        description: produto.descricao || '',
        brand: produto.marca || '',
        sku: produto.codigo || produto.sku,
        price: parseFloat(produto.preco) || 0,
        promotional_price: produto.preco_promocional ? parseFloat(produto.preco_promocional) : null,
        images: produto.imagens?.map((img: any) => img.url).filter(Boolean) || [],
        tags: produto.tags?.split(',').map((tag: string) => tag.trim()).filter(Boolean) || [],
        status: produto.situacao === 'A',
        store_id: storeId
      }));

    // Salvar produtos em lotes
    const batchSize = 100;
    for (let i = 0; i < mappedProducts.length; i += batchSize) {
      const batch = mappedProducts.slice(i, i + batchSize);
      const { error } = await supabase
        .from('products')
        .upsert(batch, {
          onConflict: 'store_id,sku',
          ignoreDuplicates: false
        });

      if (error) throw error;
    }

    return mappedProducts.length;
  } catch (error: any) {
    // Lança o erro com uma mensagem mais amigável
    throw new Error(
      error.message === 'Integração com Tiny ERP não está ativa'
        ? 'A integração com o Tiny ERP não está ativa. Por favor, configure a integração primeiro.'
        : 'Erro ao sincronizar produtos. Por favor, tente novamente mais tarde.'
    );
  }
}