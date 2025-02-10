import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export interface Plan {
  id: string;
  name: string;
  description: string;
  features: {
    products: number;
    categories: number;
    images_per_product: number;
    custom_domain: boolean;
    analytics: boolean;
    support: string;
    erp_integration: boolean;
  };
  price: {
    id: string;
    amount: number;
    currency: string;
    interval: string;
  };
}

export async function getPlans(): Promise<Plan[]> {
  const { data: products, error: productsError } = await supabase
    .from('stripe_products')
    .select(`
      id,
      name,
      description,
      features,
      stripe_prices (
        id,
        price_id,
        unit_amount,
        currency,
        interval
      )
    `)
    .eq('active', true)
    .order('name');

  if (productsError) throw productsError;

  return products.map(product => ({
    id: product.stripe_prices[0].price_id,
    name: product.name,
    description: product.description,
    features: product.features,
    price: {
      id: product.stripe_prices[0].price_id,
      amount: product.stripe_prices[0].unit_amount,
      currency: product.stripe_prices[0].currency,
      interval: product.stripe_prices[0].interval
    }
  }));
}

export async function createCheckoutSession(priceId: string, storeId: string) {
  try {
    const { data: session, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, storeId },
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) throw error;

    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe não inicializado');

    const result = await stripe.redirectToCheckout({
      sessionId: session.id
    });

    if (result.error) throw result.error;
  } catch (error: any) {
    console.error('Erro ao criar sessão:', error);
    throw new Error(error.message || 'Erro ao processar pagamento');
  }
}

export async function createPortalSession() {
  try {
    const { data: session, error } = await supabase.functions.invoke('create-portal-session', {
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) throw error;

    window.location.href = session.url;
  } catch (error: any) {
    console.error('Erro ao criar sessão do portal:', error);
    throw new Error(error.message || 'Erro ao acessar portal de pagamento');
  }
}