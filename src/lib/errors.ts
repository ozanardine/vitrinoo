/**
 * Biblioteca centralizada para tratamento de erros
 * 
 * Fornece:
 * - Classes de erro padronizadas
 * - Funções auxiliares para tratamento de erros
 * - Categorização de erros
 * - Sistema de tradução de erros
 */

import { toast } from 'react-toastify';

/**
 * Categorias de erro
 */
export enum ErrorCategory {
  PAYMENT = 'payment',          // Erros relacionados a pagamentos e Stripe
  NETWORK = 'network',          // Erros de rede e comunicação
  AUTHENTICATION = 'authentication', // Erros de autenticação e autorização
  VALIDATION = 'validation',    // Erros de validação
  SERVER = 'server',            // Erros internos do servidor
  CLIENT = 'client',            // Erros do lado do cliente
  UNKNOWN = 'unknown',          // Erros não categorizados
}

/**
 * Códigos de erro padronizados
 */
export enum ErrorCode {
  // Erros de pagamento (1000-1999)
  PAYMENT_FAILED = 'PAYMENT_FAILED_1000',
  PAYMENT_METHOD_INVALID = 'PAYMENT_METHOD_INVALID_1001',
  PAYMENT_CARD_DECLINED = 'PAYMENT_CARD_DECLINED_1002',
  PAYMENT_CARD_EXPIRED = 'PAYMENT_CARD_EXPIRED_1003',
  PAYMENT_INSUFFICIENT_FUNDS = 'PAYMENT_INSUFFICIENT_FUNDS_1004',
  PAYMENT_SUBSCRIPTION_CANCELED = 'PAYMENT_SUBSCRIPTION_CANCELED_1005',
  PAYMENT_SUBSCRIPTION_CREATION_FAILED = 'PAYMENT_SUBSCRIPTION_CREATION_FAILED_1006',
  PAYMENT_SUBSCRIPTION_UPDATE_FAILED = 'PAYMENT_SUBSCRIPTION_UPDATE_FAILED_1007',
  PAYMENT_CUSTOMER_CREATION_FAILED = 'PAYMENT_CUSTOMER_CREATION_FAILED_1008',
  PAYMENT_CHECKOUT_SESSION_FAILED = 'PAYMENT_CHECKOUT_SESSION_FAILED_1009',
  
  // Erros de rede (2000-2999)
  NETWORK_CONNECTION_FAILED = 'NETWORK_CONNECTION_FAILED_2000',
  NETWORK_REQUEST_TIMEOUT = 'NETWORK_REQUEST_TIMEOUT_2001',
  NETWORK_SERVER_UNREACHABLE = 'NETWORK_SERVER_UNREACHABLE_2002',
  NETWORK_RESPONSE_INVALID = 'NETWORK_RESPONSE_INVALID_2003',
  
  // Erros de autenticação (3000-3999)
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED_3000',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED_3001',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN_3002',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND_3003',
  AUTH_CREDENTIALS_INVALID = 'AUTH_CREDENTIALS_INVALID_3004',
  
  // Erros de validação (4000-4999)
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD_4000',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT_4001',
  VALIDATION_INCORRECT_DATA = 'VALIDATION_INCORRECT_DATA_4002',
  VALIDATION_ENTITY_EXISTS = 'VALIDATION_ENTITY_EXISTS_4003',
  VALIDATION_ENTITY_NOT_FOUND = 'VALIDATION_ENTITY_NOT_FOUND_4004',
  
  // Erros de servidor (5000-5999)
  SERVER_INTERNAL_ERROR = 'SERVER_INTERNAL_ERROR_5000',
  SERVER_DATABASE_ERROR = 'SERVER_DATABASE_ERROR_5001',
  SERVER_FUNCTION_ERROR = 'SERVER_FUNCTION_ERROR_5002',
  SERVER_DEPENDENCY_ERROR = 'SERVER_DEPENDENCY_ERROR_5003',
  SERVER_TIMEOUT = 'SERVER_TIMEOUT_5004',
  
  // Erros do cliente (6000-6999)
  CLIENT_JAVASCRIPT_ERROR = 'CLIENT_JAVASCRIPT_ERROR_6000',
  CLIENT_BROWSER_UNSUPPORTED = 'CLIENT_BROWSER_UNSUPPORTED_6001',
  CLIENT_FEATURE_UNSUPPORTED = 'CLIENT_FEATURE_UNSUPPORTED_6002',
  CLIENT_STORAGE_ERROR = 'CLIENT_STORAGE_ERROR_6003',
  
  // Erros desconhecidos (9000-9999)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR_9000',
}

/**
 * Mapeamento de mensagens de erro amigáveis por código
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Erros de pagamento
  [ErrorCode.PAYMENT_FAILED]: 'O pagamento falhou. Por favor, tente novamente.',
  [ErrorCode.PAYMENT_METHOD_INVALID]: 'Método de pagamento inválido.',
  [ErrorCode.PAYMENT_CARD_DECLINED]: 'Cartão recusado. Por favor, tente outro método de pagamento.',
  [ErrorCode.PAYMENT_CARD_EXPIRED]: 'O cartão está expirado. Por favor, verifique a data de validade.',
  [ErrorCode.PAYMENT_INSUFFICIENT_FUNDS]: 'Fundos insuficientes para concluir a transação.',
  [ErrorCode.PAYMENT_SUBSCRIPTION_CANCELED]: 'A assinatura foi cancelada.',
  [ErrorCode.PAYMENT_SUBSCRIPTION_CREATION_FAILED]: 'Não foi possível criar sua assinatura. Por favor, tente novamente.',
  [ErrorCode.PAYMENT_SUBSCRIPTION_UPDATE_FAILED]: 'Não foi possível atualizar sua assinatura. Por favor, tente novamente.',
  [ErrorCode.PAYMENT_CUSTOMER_CREATION_FAILED]: 'Não foi possível criar seu perfil de cliente. Por favor, tente novamente.',
  [ErrorCode.PAYMENT_CHECKOUT_SESSION_FAILED]: 'Erro ao iniciar o processo de pagamento. Por favor, tente novamente.',
  
  // Erros de rede
  [ErrorCode.NETWORK_CONNECTION_FAILED]: 'Falha na conexão. Verifique sua internet.',
  [ErrorCode.NETWORK_REQUEST_TIMEOUT]: 'A requisição excedeu o tempo limite. Por favor, tente novamente.',
  [ErrorCode.NETWORK_SERVER_UNREACHABLE]: 'Não foi possível acessar o servidor. Tente novamente mais tarde.',
  [ErrorCode.NETWORK_RESPONSE_INVALID]: 'Resposta inválida do servidor. Por favor, tente novamente.',
  
  // Erros de autenticação
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Não autorizado. Por favor, faça login para continuar.',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Sua sessão expirou. Por favor, faça login novamente.',
  [ErrorCode.AUTH_FORBIDDEN]: 'Você não tem permissão para acessar esse recurso.',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'Usuário não encontrado.',
  [ErrorCode.AUTH_CREDENTIALS_INVALID]: 'Credenciais inválidas. Verifique seu email e senha.',
  
  // Erros de validação
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Campo obrigatório não preenchido.',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Formato inválido.',
  [ErrorCode.VALIDATION_INCORRECT_DATA]: 'Os dados fornecidos são inválidos.',
  [ErrorCode.VALIDATION_ENTITY_EXISTS]: 'Este item já existe.',
  [ErrorCode.VALIDATION_ENTITY_NOT_FOUND]: 'Item não encontrado.',
  
  // Erros de servidor
  [ErrorCode.SERVER_INTERNAL_ERROR]: 'Erro interno do servidor. Por favor, tente novamente mais tarde.',
  [ErrorCode.SERVER_DATABASE_ERROR]: 'Erro no banco de dados. Por favor, tente novamente mais tarde.',
  [ErrorCode.SERVER_FUNCTION_ERROR]: 'Erro na função do servidor. Por favor, tente novamente mais tarde.',
  [ErrorCode.SERVER_DEPENDENCY_ERROR]: 'Erro em um serviço dependente. Por favor, tente novamente mais tarde.',
  [ErrorCode.SERVER_TIMEOUT]: 'Tempo limite excedido no servidor. Por favor, tente novamente.',
  
  // Erros do cliente
  [ErrorCode.CLIENT_JAVASCRIPT_ERROR]: 'Erro no JavaScript do cliente. Por favor, atualize a página e tente novamente.',
  [ErrorCode.CLIENT_BROWSER_UNSUPPORTED]: 'Seu navegador não é suportado. Por favor, use um navegador mais recente.',
  [ErrorCode.CLIENT_FEATURE_UNSUPPORTED]: 'Este recurso não é suportado no seu dispositivo ou navegador.',
  [ErrorCode.CLIENT_STORAGE_ERROR]: 'Erro ao acessar o armazenamento local. Verifique as permissões do navegador.',
  
  // Erros desconhecidos
  [ErrorCode.UNKNOWN_ERROR]: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
};

/**
 * Interface base para todos os erros estruturados
 */
interface StructuredError {
  code: ErrorCode;
  message: string;
  category: ErrorCategory;
  details?: any;
  originalError?: any;
  timestamp: string;
  retryable: boolean;
}

/**
 * Classe de erro personalizada com informações estruturadas
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly details?: any;
  readonly originalError?: any;
  readonly timestamp: string;
  readonly retryable: boolean;

  constructor({
    code = ErrorCode.UNKNOWN_ERROR,
    message,
    category = ErrorCategory.UNKNOWN,
    details,
    originalError,
    retryable = false
  }: Partial<StructuredError> & { message?: string }) {
    // Use a mensagem personalizada ou a mensagem padrão para o código
    const errorMessage = message || ERROR_MESSAGES[code];
    super(errorMessage);

    this.name = 'AppError';
    this.code = code;
    this.category = category;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    this.retryable = retryable;

    // Para compatibilidade com Error nativo em TypeScript
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Converte o erro para um objeto estruturado
   */
  toJSON(): StructuredError {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      details: this.details,
      originalError: this.originalError instanceof Error 
        ? { 
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack
          } 
        : this.originalError,
      timestamp: this.timestamp,
      retryable: this.retryable
    };
  }

  /**
   * Exibe uma notificação de erro na UI
   */
  notify() {
    toast.error(this.message, {
      position: "bottom-right",
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    return this; // Para encadeamento
  }

  /**
   * Registra o erro no console com detalhes completos
   */
  log() {
    console.error(`[${this.category}] ${this.code}: ${this.message}`, {
      details: this.details,
      originalError: this.originalError,
      timestamp: this.timestamp,
      stack: this.stack
    });
    return this; // Para encadeamento
  }
}

/**
 * Converte erros genéricos em AppError com categorização
 */
export function normalizeError(error: any): AppError {
  // Já é um AppError, retorna diretamente
  if (error instanceof AppError) {
    return error;
  }

  // Mensagem de erro padrão caso não seja possível extrair uma
  let message = 'Ocorreu um erro desconhecido';
  let code = ErrorCode.UNKNOWN_ERROR;
  let category = ErrorCategory.UNKNOWN;
  let details;
  let retryable = false;

  // Extract error message and categorize
  if (error instanceof Error) {
    message = error.message;
    
    // Categorizar baseado na mensagem ou tipo de erro
    if (error.name === 'NetworkError' || message.includes('network') || message.includes('connection')) {
      category = ErrorCategory.NETWORK;
      code = ErrorCode.NETWORK_CONNECTION_FAILED;
      retryable = true;
    } else if (error.name === 'TimeoutError' || message.includes('timeout')) {
      category = ErrorCategory.NETWORK;
      code = ErrorCode.NETWORK_REQUEST_TIMEOUT;
      retryable = true;
    } else if (message.includes('unauthorized') || message.includes('not logged in')) {
      category = ErrorCategory.AUTHENTICATION;
      code = ErrorCode.AUTH_UNAUTHORIZED;
    } else if (message.includes('forbidden') || message.includes('permission')) {
      category = ErrorCategory.AUTHENTICATION;
      code = ErrorCode.AUTH_FORBIDDEN;
    } else if (message.includes('not found')) {
      category = ErrorCategory.VALIDATION;
      code = ErrorCode.VALIDATION_ENTITY_NOT_FOUND;
    } else if (message.includes('required')) {
      category = ErrorCategory.VALIDATION;
      code = ErrorCode.VALIDATION_REQUIRED_FIELD;
    }
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null) {
    // Extract error message from object
    message = error.message || error.error || error.errorMessage || message;
    details = error;
  }

  // Criar um AppError estruturado
  return new AppError({
    code,
    message,
    category,
    details,
    originalError: error,
    retryable
  });
}

/**
 * Função auxiliar para classificar erros específicos do Stripe
 */
export function handleStripeError(error: any): AppError {
  const normalizedError = normalizeError(error);
  
  // Já processou como AppError mas não é específico para Stripe ainda
  if (normalizedError.category !== ErrorCategory.PAYMENT) {
    let code = ErrorCode.PAYMENT_FAILED;
    let message = ERROR_MESSAGES[code];
    let retryable = false;

    // Analisa o erro original para determinar o código específico
    const stripeError = error.originalError || error;
    
    if (typeof stripeError === 'object' && stripeError !== null) {
      const errorType = stripeError.type;
      const errorCode = stripeError.code;
      
      if (errorType === 'StripeCardError') {
        if (errorCode === 'card_declined') {
          code = ErrorCode.PAYMENT_CARD_DECLINED;
        } else if (errorCode === 'expired_card') {
          code = ErrorCode.PAYMENT_CARD_EXPIRED;
        } else if (errorCode === 'insufficient_funds') {
          code = ErrorCode.PAYMENT_INSUFFICIENT_FUNDS;
        }
      } else if (errorType === 'StripeInvalidRequestError') {
        if (stripeError.message && stripeError.message.includes('subscription')) {
          code = ErrorCode.PAYMENT_SUBSCRIPTION_UPDATE_FAILED;
        } else if (stripeError.message && stripeError.message.includes('customer')) {
          code = ErrorCode.PAYMENT_CUSTOMER_CREATION_FAILED;
        }
      }
      
      // Use a mensagem original do Stripe se estiver disponível
      if (stripeError.message) {
        message = stripeError.message;
      }
      
      // Alguns erros de rede podem ser tentados novamente
      if (errorType === 'StripeConnectionError' || errorType === 'StripeAPIError') {
        retryable = true;
      }
    }
    
    // Retorna um novo AppError com categorização correta para Stripe
    return new AppError({
      code,
      message,
      category: ErrorCategory.PAYMENT,
      details: normalizedError.details,
      originalError: error,
      retryable
    });
  }
  
  return normalizedError;
}

/**
 * Hook para manipular errors com retry automático
 * 
 * @param fn Função assíncrona que pode falhar
 * @param options Opções de retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (error: AppError, retryCount: number) => void;
    shouldRetry?: (error: AppError) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    onRetry = () => {},
    shouldRetry = (error) => error.retryable
  } = options;

  let lastError: AppError | null = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const appError = normalizeError(error);
      lastError = appError;

      // Verificar se devemos tentar novamente
      if (retryCount >= maxRetries || !shouldRetry(appError)) {
        break;
      }

      // Notificar sobre a tentativa
      onRetry(appError, retryCount + 1);

      // Esperar antes de tentar novamente (com exponential backoff)
      const backoffDelay = delay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      retryCount++;
    }
  }

  // Se chegamos aqui, todas as tentativas falharam
  throw lastError!;
}

/**
 * Registra um erro em serviços de monitoramento (simulado)
 */
export function logErrorToMonitoring(error: AppError): void {
  // Simula o envio para um serviço de monitoramento
  console.log(`[MONITORING] Error logged: ${error.code}`, error.toJSON());
  
  // No futuro, esta função enviaria para Sentry, LogRocket, etc.
  // Exemplo:
  // Sentry.captureException(error.originalError || error, {
  //   extra: error.toJSON()
  // });
}