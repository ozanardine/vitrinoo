/**
 * Sistema de idempotência para operações críticas
 * 
 * Garante que operações são executadas apenas uma vez, mesmo se forem chamadas múltiplas vezes.
 * Util para operações de pagamento, onde duplicação pode causar problemas graves.
 */

/**
 * Registro de uma requisição idempotente
 */
interface IdempotentRequest {
    key: string;
    operation: string;
    payload: any;
    status: 'pending' | 'complete' | 'failed';
    result?: any;
    error?: any;
    timestamp: number;
    attempts: number;
    lastAttempt: number;
  }
  
  /**
   * Opções para execução de operação idempotente
   */
  interface IdempotencyOptions {
    // Tempo de expiração da chave em ms (padrão: 15 minutos)
    expirationMs?: number;
    // Número máximo de tentativas (padrão: 3)
    maxAttempts?: number;
    // Tempo entre tentativas em ms (padrão: 1000ms)
    retryDelay?: number;
    // Estratégia de backoff (padrão: exponential)
    backoffStrategy?: 'linear' | 'exponential';
    // Função para gerar a chave (por padrão usa os parâmetros da operação)
    keyGenerator?: (operation: string, params: any) => string;
    // Função para armazenar o resultado para debug
    onComplete?: (key: string, result: any) => void;
    // Função para registro de erros
    onError?: (key: string, error: any) => void;
  }
  
  // Armazenamento em memória para requisições idempotentes
  // Em produção, isso deveria ser um armazenamento persistente (Redis, banco de dados)
  const requestStore = new Map<string, IdempotentRequest>();
  
  // Intervalo de limpeza para registros expirados em ms (15 minutos)
  const CLEANUP_INTERVAL = 15 * 60 * 1000;
  
  // Limpeza periódica de registros expirados
  setInterval(() => {
    const now = Date.now();
    const defaultExpiration = 15 * 60 * 1000; // 15 minutos
    
    requestStore.forEach((request, key) => {
      // Remove requests que foram completados há mais de 15 minutos
      if (
        (request.status === 'complete' || request.status === 'failed') &&
        now - request.lastAttempt > defaultExpiration
      ) {
        requestStore.delete(key);
      }
    });
  }, CLEANUP_INTERVAL);
  
  /**
   * Gera uma chave de idempotência baseada na operação e parâmetros
   */
  function generateKey(operation: string, params: any): string {
    // Cria um hash do nome da operação + parâmetros serializados
    const paramString = JSON.stringify(params || {});
    
    // Poderíamos usar um algoritmo de hash real aqui, mas para simplicidade:
    return `${operation}_${btoa(paramString)}_${Date.now()}`;
  }
  
  /**
   * Executa uma operação de forma idempotente
   * 
   * @param operation Nome da operação
   * @param params Parâmetros da operação
   * @param fn Função que realiza a operação
   * @param options Opções de idempotência
   * @returns Resultado da operação
   */
  export async function executeIdempotent<T>(
    operation: string,
    params: any,
    fn: () => Promise<T>,
    options: IdempotencyOptions = {}
  ): Promise<T> {
    // Opções com valores padrão
    const {
      expirationMs = 15 * 60 * 1000, // 15 minutos
      maxAttempts = 3,
      retryDelay = 1000,
      backoffStrategy = 'exponential',
      keyGenerator = generateKey,
      onComplete,
      onError
    } = options;
  
    // Gerar chave de idempotência
    const key = keyGenerator(operation, params);
    
    // Verificar se já existe um request com esta chave
    let request = requestStore.get(key);
    
    // Se já existe e foi completado com sucesso, retorna o resultado armazenado
    if (request && request.status === 'complete') {
      return request.result as T;
    }
    
    // Se já existe mas é antigo, remover e criar um novo
    if (request && Date.now() - request.timestamp > expirationMs) {
      requestStore.delete(key);
      request = undefined;
    }
    
    // Se já existe mas falhou, verificar se podemos tentar novamente
    if (request && request.status === 'failed') {
      // Se atingiu o número máximo de tentativas, lança o erro armazenado
      if (request.attempts >= maxAttempts) {
        throw request.error;
      }
    }
    
    // Criar um novo registro ou atualizar o existente
    if (!request) {
      request = {
        key,
        operation,
        payload: params,
        status: 'pending',
        timestamp: Date.now(),
        attempts: 0,
        lastAttempt: Date.now()
      };
      requestStore.set(key, request);
    }
    
    try {
      // Incrementar contagem de tentativas
      request.attempts += 1;
      request.lastAttempt = Date.now();
      
      // Executar a operação
      const result = await fn();
      
      // Armazenar o resultado e marcar como completo
      request.status = 'complete';
      request.result = result;
      
      // Callback de conclusão
      if (onComplete) {
        onComplete(key, result);
      }
      
      return result;
    } catch (error) {
      // Armazenar o erro e marcar como falha
      request.status = 'failed';
      request.error = error;
      
      // Callback de erro
      if (onError) {
        onError(key, error);
      }
      
      // Calcular atraso para nova tentativa
      let delay = retryDelay;
      if (backoffStrategy === 'exponential') {
        delay = retryDelay * Math.pow(2, request.attempts - 1);
      } else if (backoffStrategy === 'linear') {
        delay = retryDelay * request.attempts;
      }
      
      // Se ainda temos tentativas disponíveis, tentar novamente após o atraso
      if (request.attempts < maxAttempts) {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              // Tentativa recursiva
              const result = await executeIdempotent(operation, params, fn, options);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          }, delay);
        });
      }
      
      // Se chegamos aqui, todas as tentativas falharam
      throw error;
    }
  }
  
  /**
   * Hook para criar uma versão idempotente de uma função
   * 
   * @param fn Função original
   * @param operationPrefix Prefixo para o nome da operação (opcional)
   * @param options Opções de idempotência
   * @returns Função idempotente
   */
  export function makeIdempotent<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    operationPrefix: string = '',
    options: IdempotencyOptions = {}
  ): T {
    // Retorna uma função com a mesma assinatura, mas que usa executeIdempotent internamente
    return ((...args: any[]) => {
      const operationName = operationPrefix + (fn.name || 'anonymous');
      return executeIdempotent(
        operationName,
        args,
        () => fn(...args),
        options
      );
    }) as T;
  }