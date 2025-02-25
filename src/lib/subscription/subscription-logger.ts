/**
 * Sistema de logs estruturados para melhor rastreabilidade
 * das operações relacionadas a assinaturas
 */
import { AppError } from '../errors';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, any>;

interface SubscriptionLog {
  level: LogLevel;
  message: string;
  subscriptionId?: string;
  storeId?: string;
  userId?: string;
  context: LogContext;
  timestamp: string;
}

export const subscriptionLogger = {
  debug(message: string, context: LogContext = {}): void {
    logEvent('debug', message, context);
  },
  
  info(message: string, context: LogContext = {}): void {
    logEvent('info', message, context);
  },
  
  warn(message: string, context: LogContext = {}): void {
    logEvent('warn', message, context);
  },
  
  error(message: string, context: LogContext = {}): void {
    logEvent('error', message, context);
  },
  
  /**
   * Registra transição de estado da assinatura
   */
  stateTransition(
    subscriptionId: string, 
    fromState: string, 
    toState: string, 
    context: LogContext = {}
  ): void {
    logEvent('info', `Assinatura ${subscriptionId} mudou de ${fromState} para ${toState}`, {
      ...context,
      subscriptionId,
      transitionType: 'state_change',
      fromState,
      toState
    });
  },
  
  /**
   * Registra tentativa de pagamento
   */
  paymentAttempt(
    subscriptionId: string, 
    success: boolean, 
    context: LogContext = {}
  ): void {
    logEvent(
      success ? 'info' : 'warn',
      `Tentativa de pagamento ${success ? 'bem-sucedida' : 'falhou'} para assinatura ${subscriptionId}`,
      {
        ...context,
        subscriptionId,
        transactionType: 'payment_attempt',
        success
      }
    );
  }
};

// Função interna para registrar eventos
function logEvent(level: LogLevel, message: string, context: LogContext = {}): void {
  const log: SubscriptionLog = {
    level,
    message,
    subscriptionId: context.subscriptionId,
    storeId: context.storeId,
    userId: context.userId,
    context,
    timestamp: new Date().toISOString()
  };
  
  // Aqui podemos enviar para um serviço de logs ou analytics
  console[level](JSON.stringify(log));
  
  // No futuro, conectar com sistemas como Datadog, NewRelic, etc
  // sendToMonitoringService(log);
}