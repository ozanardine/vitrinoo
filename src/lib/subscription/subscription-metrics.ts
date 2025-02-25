/**
 * Serviço de métricas para monitorar operações relacionadas a assinaturas
 */
export const subscriptionMetrics = {
    // Contadores
    counters: {
      /**
       * Incrementa contador de eventos
       */
      increment(metric: string, value: number = 1, tags: Record<string, string> = {}): void {
        console.log(`MÉTRICA [contador]: ${metric} +${value}`, tags);
        // No futuro: integração com StatsD, Prometheus, etc.
      },
      
      /**
       * Registra falha de pagamento
       */
      paymentFailure(planType: string): void {
        this.increment('subscription.payment.failure', 1, { plan_type: planType });
      },
      
      /**
       * Registra sucesso de pagamento
       */
      paymentSuccess(planType: string): void {
        this.increment('subscription.payment.success', 1, { plan_type: planType });
      },
      
      /**
       * Registra nova assinatura
       */
      newSubscription(planType: string): void {
        this.increment('subscription.new', 1, { plan_type: planType });
      },
      
      /**
       * Registra cancelamento de assinatura
       */
      canceledSubscription(planType: string, reason?: string): void {
        this.increment('subscription.canceled', 1, { 
          plan_type: planType,
          reason: reason || 'unknown'
        });
      }
    },
    
    // Histogramas para distribuições
    histograms: {
      /**
       * Registra duração de operação
       */
      recordDuration(operation: string, durationMs: number, tags: Record<string, string> = {}): void {
        console.log(`MÉTRICA [histograma]: ${operation} ${durationMs}ms`, tags);
        // No futuro: integração com sistemas de métricas
      },
      
      /**
       * Registra duração de assinatura (lifetime)
       */
      subscriptionDuration(planType: string, durationDays: number): void {
        this.recordDuration('subscription.lifetime', durationDays * 86400000, { 
          plan_type: planType,
          unit: 'days'
        });
      }
    },
    
    // Gauges para valores instantâneos
    gauges: {
      /**
       * Registra valor atual
       */
      set(metric: string, value: number, tags: Record<string, string> = {}): void {
        console.log(`MÉTRICA [gauge]: ${metric} = ${value}`, tags);
        // No futuro: integração com sistemas de métricas
      },
      
      /**
       * Registra número de assinaturas ativas por plano
       */
      activeSubscriptions(planType: string, count: number): void {
        this.set('subscription.active', count, { plan_type: planType });
      }
    }
  };