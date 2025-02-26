import { StripeService, Plan, StripeSessionResponse } from './stripe-service';

// Exportar o serviço e tipos
export {
  StripeService,
  Plan,
  StripeSessionResponse
};

// Criar uma instância pré-configurada do serviço
const stripeService = new StripeService();

// Exportar métodos para uso direto
export const getPlans = () => stripeService.getPlans();
export const createCheckoutSession = (priceId: string, storeId: string) => 
  stripeService.createCheckoutSession(priceId, storeId);
export const createPortalSession = () => stripeService.createPortalSession();
export const checkSubscriptionStatus = (subscriptionId: string) => 
  stripeService.checkSubscriptionStatus(subscriptionId);