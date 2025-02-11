import { supabase } from './supabase';
import _ from 'lodash';
import pRetry from 'p-retry';
import pQueue from 'p-queue';

// Constants
const TINY_AUTH_URL = 'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth';
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
  tiny_plan?: 'basic' | 'essential' | 'enterprise';
}

interface TinyProductBase {
  id: number;
  sku: string;
  descricao: string;
  tipo: 'S' | 'P' | 'K' | 'V'; // Serviço, Produto, Kit, Variação
  situacao: 'A' | 'I'; // Ativo, Inativo
  dataCriacao: string;
  dataAlteracao: string;
  unidade: string;
  gtin: string;
  precos: {
    preco: number;
    precoPromocional: number;
    precoCusto: number;
    precoCustoMedio: number;
  };
}

interface TinyProductDetail extends TinyProductBase {
  descricaoComplementar: string;
  categoria: {
    id: number;
    nome: string;
    caminhoCompleto: string;
  };
  marca: {
    id: number;
    nome: string;
  };
  seo: {
    titulo: string;
    descricao: string;
    keywords: string[];
    slug: string;
  };
  anexos: Array<{
    url: string;
    externo: boolean;
  }>;
  variacoes?: Array<{
    id: number;
    sku: string;
    descricao: string;
    precos: {
      preco: number;
      precoPromocional: number;
    };
    grade: Array<{
      chave: string;
      valor: string;
    }>;
  }>;
  kit?: Array<{
    produto: {
      id: number;
      sku: string;
      descricao: string;
    };
    quantidade: number;
  }>;
}

interface TinyProductListResponse {
  itens: TinyProductBase[];
  paginacao: {
    limit: number;
    offset: number;
    total: number;
  };
}

// Rate limiting configuration
const RATE_LIMITS = {
  basic: { total: 60, write: 30 },
  essential: { total: 120, write: 60 },
  enterprise: { total: 240, write: 100 }
};

// Authentication functions
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
    const { data: keyData, error: keyError } = await supabase
      .from('function_keys')
      .select('key')
      .eq('name', 'tiny-token-exchange')
      .single();

    if (keyError) throw new Error('Erro ao obter chave de função');
    if (!keyData?.key) throw new Error('Chave de função não encontrada');

    let cleanToken = keyData.key.replace(/[\n\r\s]+/g, '');
    if (cleanToken.includes('base64,')) {
      cleanToken = cleanToken.split('base64,')[1];
    }

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiny-token-exchange`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify({
        code: String(code),
        clientId: String(clientId),
        clientSecret: String(clientSecret),
        redirectUri: String(redirectUri),
        grantType: 'authorization_code'
      })
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

export async function checkTinyIntegrationStatus(storeId: string) {
  try {
    const credentials = await getTinyCredentials(storeId);
    if (!credentials) return false;

    const expiresAt = new Date(credentials.expires_at);
    const now = new Date();
    return expiresAt > now && credentials.active;
  } catch (error) {
    return false;
  }
}

// Product Synchronization Class
class TinyProductSync {
  private storeId: string;
  private rateLimit: typeof RATE_LIMITS.basic;
  private queue: pQueue;

  constructor(storeId: string, plan: 'basic' | 'essential' | 'enterprise' = 'basic') {
    this.storeId = storeId;
    this.rateLimit = RATE_LIMITS[plan];
    
    // Initialize queue with rate limiting
    this.queue = new pQueue({
      concurrency: 1,
      interval: 60000, // 1 minute
      intervalCap: this.rateLimit.total // Max requests per minute
    });
  }

  private async callTinyApi<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tiny-api`;
    const url = new URL(functionUrl);
    url.searchParams.set('endpoint', endpoint);
    url.searchParams.set('storeId', this.storeId);

    return this.queue.add(async () => {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro na API do Tiny');
      }

      return response.json();
    });
  }

  private async listProducts(offset: number, limit: number): Promise<TinyProductListResponse> {
    return this.callTinyApi<TinyProductListResponse>(
      `produtos?situacao=A&limit=${limit}&offset=${offset}`
    );
  }

  private async getProductDetails(productId: number): Promise<TinyProductDetail> {
    return this.callTinyApi<TinyProductDetail>(`produtos/${productId}`);
  }

  private mapProductToCatalog(product: TinyProductDetail) {
    const baseProduct = {
      store_id: this.storeId,
      title: product.descricao,
      description: product.descricaoComplementar || product.descricao,
      sku: product.sku,
      price: product.precos.preco || 0,
      promotional_price: product.precos.precoPromocional || null,
      brand: product.marca?.nome || '',
      category: product.categoria?.caminhoCompleto || '',
      meta_title: product.seo?.titulo || product.descricao,
      meta_description: product.seo?.descricao || '',
      meta_keywords: product.seo?.keywords?.join(',') || '',
      status: product.situacao === 'A',
      images: product.anexos
        ?.filter(anexo => anexo.externo)
        .map(anexo => anexo.url) || [],
      updated_at: new Date().toISOString()
    };

    // Se for produto com variações
    if (product.variacoes?.length) {
      return {
        ...baseProduct,
        type: 'variable',
        variations: product.variacoes.map(v => ({
          sku: v.sku,
          title: v.descricao,
          price: v.precos.preco || 0,
          promotional_price: v.precos.precoPromocional || null,
          attributes: v.grade.map(g => ({
            name: g.chave,
            value: g.valor
          }))
        }))
      };
    }

    // Se for kit/combo
    if (product.kit?.length) {
      return {
        ...baseProduct,
        type: 'kit',
        kit_items: product.kit.map(k => ({
          product_id: k.produto.id,
          sku: k.produto.sku,
          quantity: k.quantidade
        }))
      };
    }

    // Produto simples
    return {
      ...baseProduct,
      type: 'simple'
    };
  }

  public async syncProducts(): Promise<{
    total: number;
    success: number;
    errors: number;
  }> {
    try {
      let offset = 0;
      const limit = 50;
      let allProducts: TinyProductDetail[] = [];
      let hasMore = true;
      let stats = { total: 0, success: 0, errors: 0 };

      // Buscar lista inicial de produtos
      while (hasMore) {
        const { itens, paginacao } = await this.listProducts(offset, limit);
        
        if (!itens?.length) break;

        // Buscar detalhes dos produtos
        const detailedProducts = await Promise.all(
          itens.map(produto =>
            pRetry(
              () => this.getProductDetails(produto.id),
              {
                retries: 3,
                onFailedAttempt: error => {
                  console.warn(`Erro ao buscar produto ${produto.id}: ${error.message}. Tentando novamente...`);
                }
              }
            ).catch(error => {
              console.error(`Falha ao buscar produto ${produto.id}:`, error);
              stats.errors++;
              return null;
            })
          )
        );

        allProducts = [...allProducts, ...detailedProducts.filter((p): p is TinyProductDetail => !!p)];
        stats.success += detailedProducts.filter(p => p !== null).length;
        
        offset += limit;
        hasMore = offset < paginacao.total;
        stats.total = paginacao.total;

        // Log de progresso
        console.log(`Progresso: ${offset}/${paginacao.total} produtos processados`);
      }

      // Mapear e salvar produtos em lotes
      const mappedProducts = allProducts.map(p => this.mapProductToCatalog(p));
      const batchSize = 50;

      for (let i = 0; i < mappedProducts.length; i += batchSize) {
        const batch = mappedProducts.slice(i, i + batchSize);
        
        try {
          const { error } = await supabase
            .from('products')
            .upsert(batch, {
              onConflict: 'store_id,sku',
              ignoreDuplicates: false
            });

          if (error) {
            console.error('Erro ao salvar lote de produtos:', error);
            stats.errors += batch.length;
            stats.success -= batch.length;
          }
        } catch (error) {
          console.error('Erro ao processar lote:', error);
          stats.errors += batch.length;
          stats.success -= batch.length;
        }

        // Log de progresso do salvamento
        console.log(`Salvos ${i + batch.length}/${mappedProducts.length} produtos`);
      }

      return stats;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }
}

// Main synchronization function
export async function syncTinyProducts(storeId: string): Promise<{
  total: number;
  success: number;
  errors: number;
}> {
  try {
    // Verificar se a integração está ativa
    const isActive = await checkTinyIntegrationStatus(storeId);
    if (!isActive) {
      throw new Error('Integração com Tiny ERP não está ativa');
    }

    // Buscar plano do Tiny
    const { data: integration } = await supabase
      .from('erp_integrations')
      .select('tiny_plan')
      .eq('store_id', storeId)
      .eq('provider', 'tiny')
      .single();

    const sync = new TinyProductSync(
      storeId,
      (integration?.tiny_plan as 'basic' | 'essential' | 'enterprise') || 'basic'
    );

    const result = await sync.syncProducts();
    console.log('Sincronização concluída:', result);
    return result;
  } catch (error: any) {
    console.error('Erro na sincronização:', error);
    throw new Error(
      error.message === 'Integração com Tiny ERP não está ativa'
        ? 'A integração com o Tiny ERP não está ativa. Por favor, configure a integração primeiro.'
        : 'Erro ao sincronizar produtos. Por favor, tente novamente mais tarde.'
    );
  }
}

export async function disconnectTinyIntegration(storeId: string) {
  try {
    // Primeiro desativa a integração
    const { error: integrationError } = await supabase
      .from('erp_integrations')
      .update({
        active: false,
        access_token: null,
        refresh_token: null,
        expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('store_id', storeId)
      .eq('provider', 'tiny');

    if (integrationError) throw integrationError;

    // Remove todos os produtos sincronizados
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .eq('store_id', storeId)
      .not('sku', 'is', null); // Remove apenas produtos com SKU (que vieram do Tiny)

    if (productsError) throw productsError;

    return true;
  } catch (error: any) {
    console.error('Erro ao desconectar integração:', error);
    throw new Error('Erro ao desconectar integração com Tiny ERP. Por favor, tente novamente.');
  }
}