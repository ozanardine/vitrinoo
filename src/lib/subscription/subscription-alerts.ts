/**
 * Serviço de alertas para notificar equipe sobre problemas críticos
 */
export enum AlertSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
  }
  
  export const subscriptionAlerts = {
    /**
     * Envia alerta para equipe
     */
    send(
      title: string, 
      message: string, 
      severity: AlertSeverity, 
      context: Record<string, any> = {}
    ): void {
      const alert = {
        title,
        message,
        severity,
        context,
        timestamp: new Date().toISOString()
      };
      
      console.log(`ALERTA [${severity}]: ${title}`, alert);
      // No futuro: integração com PagerDuty, Slack, etc.
    },
    
    /**
     * Alerta sobre taxa alta de falha nos pagamentos
     */
    highPaymentFailureRate(failureRate: number, planType: string): void {
      if (failureRate > 0.1) { // 10% de falha
        const severity = failureRate > 0.3 ? 
          AlertSeverity.CRITICAL : 
          failureRate > 0.2 ? 
            AlertSeverity.ERROR : 
            AlertSeverity.WARNING;
            
        this.send(
          'Taxa Alta de Falha nos Pagamentos',
          `A taxa de falha nos pagamentos atingiu ${(failureRate * 100).toFixed(1)}% para o plano ${planType}`,
          severity,
          { failureRate, planType }
        );
      }
    },
    
    /**
     * Alerta sobre taxa alta de cancelamento
     */
    highCancellationRate(cancellationRate: number, planType: string): void {
      if (cancellationRate > 0.05) { // 5% de cancelamento
        this.send(
          'Taxa Alta de Cancelamentos',
          `A taxa de cancelamentos atingiu ${(cancellationRate * 100).toFixed(1)}% para o plano ${planType}`,
          cancellationRate > 0.15 ? AlertSeverity.ERROR : AlertSeverity.WARNING,
          { cancellationRate, planType }
        );
      }
    }
  };