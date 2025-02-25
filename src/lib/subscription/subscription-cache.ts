/**
 * Sistema de cache para reduzir consultas ao banco de dados
 * e melhorar o desempenho das operações relacionadas a assinaturas
 */
import { SubscriptionDetails } from './subscription-lifecycle';
import { subscriptionLogger } from './subscription-logger';
import { subscriptionMetrics } from './subscription-metrics';

// Definição de tipos para o cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface CacheConfig {
  defaultTtlMs: number; // Tempo de vida padrão em milissegundos
  maxSize: number;      // Número máximo de itens no cache
}

/**
 * Cache em memória para assinaturas
 */
export class SubscriptionCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;
  private lastCleanupTime = Date.now();
  
  /**
   * Cria uma nova instância do cache
   */
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtlMs: 5 * 60 * 1000, // 5 minutos por padrão
      maxSize: 1000, // Máximo de 1000 itens
      ...config
    };
    
    // Registrar métricas periodicamente
    setInterval(() => this.reportMetrics(), 60000);
  }
  
  /**
   * Busca um item no cache
   * 
   * @param key - Chave do item
   * @returns Item ou null se não encontrado ou expirado
   */
  get<T>(key: string): T | null {
    // Executar limpeza se necessário
    this.maybeCleanup();
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      // Cache miss
      this.missCount++;
      return null;
    }
    
    // Verificar se expirou
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }
    
    // Cache hit
    this.hitCount++;
    return entry.data as T;
  }
  
  /**
   * Armazena um item no cache
   * 
   * @param key - Chave do item
   * @param data - Dados a serem armazenados
   * @param ttlMs - Tempo de vida em milissegundos (opcional)
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    // Executar limpeza se necessário
    this.maybeCleanup();
    
    // Verificar limite de tamanho
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.cleanup();
    }
    
    const ttl = ttlMs !== undefined ? ttlMs : this.config.defaultTtlMs;
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }
  
  /**
   * Remove um item do cache
   * 
   * @param key - Chave do item
   * @returns Se o item foi removido
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Remove um grupo de itens do cache por prefixo
   * 
   * @param prefix - Prefixo das chaves
   * @returns Número de itens removidos
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Verifica se é necessário executar a limpeza
   */
  private maybeCleanup(): void {
    // Limpar a cada 5 minutos ou se estiver 20% acima do limite
    const now = Date.now();
    const timeThreshold = 5 * 60 * 1000; // 5 minutos
    const sizeThreshold = this.config.maxSize * 1.2;
    
    if (now - this.lastCleanupTime > timeThreshold || this.cache.size > sizeThreshold) {
      this.cleanup();
    }
  }
  
  /**
   * Remove itens expirados do cache
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    // Remover itens expirados
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    // Se ainda estamos acima do limite, remover os itens mais antigos
    if (this.cache.size > this.config.maxSize) {
      // Ordenar por tempo de expiração
      const entries = [...this.cache.entries()]
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      
      // Remover os que expiram primeiro até ficar abaixo do limite
      const toRemove = this.cache.size - this.config.maxSize;
      
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
    
    this.lastCleanupTime = now;
    
    // Registrar métricas da limpeza
    subscriptionLogger.debug('Cache limpeza executada', {
      expiredRemoved: expiredCount,
      totalItems: this.cache.size
    });
  }
  
  /**
   * Reporta métricas sobre uso do cache
   */
  private reportMetrics(): void {
    const hitRate = this.getTotalRequests() > 0 
      ? this.hitCount / this.getTotalRequests() 
      : 0;
      
    subscriptionMetrics.gauges.set('subscription.cache.size', this.cache.size);
    subscriptionMetrics.gauges.set('subscription.cache.hit_rate', hitRate * 100);
    subscriptionMetrics.counters.increment('subscription.cache.hit', this.hitCount, { reset: true });
    subscriptionMetrics.counters.increment('subscription.cache.miss', this.missCount, { reset: true });
    
    // Resetar contadores após reportar
    this.hitCount = 0;
    this.missCount = 0;
  }
  
  /**
   * Obtém o total de requisições ao cache
   */
  private getTotalRequests(): number {
    return this.hitCount + this.missCount;
  }
}

/**
 * Encapsula as operações de cache para assinaturas
 */
export class SubscriptionCacheManager {
  private cache: SubscriptionCache;
  
  constructor(cache?: SubscriptionCache) {
    this.cache = cache || new SubscriptionCache();
  }
  
  /**
   * Gera chave de cache para assinatura por loja
   */
  private getStoreSubscriptionKey(storeId: string): string {
    return `subscription:store:${storeId}`;
  }
  
  /**
   * Gera chave de cache para assinatura por ID
   */
  private getSubscriptionKey(subscriptionId: string): string {
    return `subscription:id:${subscriptionId}`;
  }
  
  /**
   * Gera chave de cache para elegibilidade de recurso
   */
  private getFeatureEligibilityKey(subscriptionId: string, feature: string): string {
    return `subscription:feature:${subscriptionId}:${feature}`;
  }
  
  /**
   * Busca assinatura por ID da loja no cache
   */
  getSubscriptionByStore(storeId: string): SubscriptionDetails | null {
    return this.cache.get<SubscriptionDetails>(this.getStoreSubscriptionKey(storeId));
  }
  
  /**
   * Armazena assinatura por ID da loja no cache
   */
  setSubscriptionByStore(storeId: string, subscription: SubscriptionDetails): void {
    this.cache.set(this.getStoreSubscriptionKey(storeId), subscription);
    
    // Também armazenar pelo ID da assinatura
    this.cache.set(this.getSubscriptionKey(subscription.id), subscription);
  }
  
  /**
   * Busca assinatura por ID no cache
   */
  getSubscriptionById(subscriptionId: string): SubscriptionDetails | null {
    return this.cache.get<SubscriptionDetails>(this.getSubscriptionKey(subscriptionId));
  }
  
  /**
   * Armazena assinatura por ID no cache
   */
  setSubscriptionById(subscriptionId: string, subscription: SubscriptionDetails): void {
    this.cache.set(this.getSubscriptionKey(subscriptionId), subscription);
    
    // Também armazenar pelo ID da loja
    this.cache.set(this.getStoreSubscriptionKey(subscription.storeId), subscription);
  }
  
  /**
   * Busca elegibilidade de recurso no cache
   */
  getFeatureEligibility(subscriptionId: string, feature: string): boolean | null {
    return this.cache.get<boolean>(this.getFeatureEligibilityKey(subscriptionId, feature));
  }
  
  /**
   * Armazena elegibilidade de recurso no cache
   */
  setFeatureEligibility(subscriptionId: string, feature: string, eligible: boolean): void {
    this.cache.set(this.getFeatureEligibilityKey(subscriptionId, feature), eligible);
  }
  
  /**
   * Invalida cache de assinatura por ID da loja
   */
  invalidateByStore(storeId: string): void {
    const subscription = this.getSubscriptionByStore(storeId);
    
    this.cache.delete(this.getStoreSubscriptionKey(storeId));
    
    if (subscription) {
      this.cache.delete(this.getSubscriptionKey(subscription.id));
      this.cache.deleteByPrefix(`subscription:feature:${subscription.id}:`);
    }
  }
  
  /**
   * Invalida cache de assinatura por ID
   */
  invalidateById(subscriptionId: string): void {
    const subscription = this.getSubscriptionById(subscriptionId);
    
    this.cache.delete(this.getSubscriptionKey(subscriptionId));
    this.cache.deleteByPrefix(`subscription:feature:${subscriptionId}:`);
    
    if (subscription) {
      this.cache.delete(this.getStoreSubscriptionKey(subscription.storeId));
    }
  }
  
  /**
   * Limpa todo o cache de assinaturas
   */
  clearAll(): void {
    this.cache.clear();
  }
}