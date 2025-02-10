interface RateLimitOptions {
    windowMs: number;  // Janela de tempo em milissegundos
    max: number;       // Número máximo de requisições permitidas na janela
  }
  
  interface RateLimitStore {
    [key: string]: {
      count: number;
      resetTime: number;
    };
  }
  
  export function rateLimit(options: RateLimitOptions) {
    const store: RateLimitStore = {};
  
    return {
      async check(req: Request, ip: string): Promise<void> {
        const now = Date.now();
        
        // Limpa entradas antigas
        Object.keys(store).forEach(key => {
          if (store[key].resetTime <= now) {
            delete store[key];
          }
        });
  
        // Inicializa ou atualiza o contador para o IP
        if (!store[ip] || store[ip].resetTime <= now) {
          store[ip] = {
            count: 1,
            resetTime: now + options.windowMs
          };
        } else {
          store[ip].count++;
        }
  
        // Verifica se excedeu o limite
        if (store[ip].count > options.max) {
          throw new Error('Rate limit exceeded');
        }
      }
    };
  }