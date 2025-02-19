import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export interface Plan {
  id: string;
  name: string;
  description: string;
  metadata: {
    is_trial: boolean;
    plan_type: 'free' | 'basic' | 'plus';
    trial_days?: number;
  };
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
      *,
      stripe_prices!inner(*)
    `)
    .eq('active', true)
    .eq('stripe_prices.active', true);

  if (productsError) throw productsError;
  
  if (!products || products.length === 0) {
    throw new Error('Nenhum plano disponível no momento');
  }

  return products.map(product => {
    const price = product.stripe_prices?.[0];
    return {
      id: price?.price_id,
      name: product.name,
      description: product.description,
      metadata: product.metadata,
      features: product.features,
      price: price ? {
        id: price.price_id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.interval
      } : {
        id: '',
        amount: 0,
        currency: 'brl',
        interval: 'month'
      }
    };
  });
}

export async function createCheckoutSession(priceId: string, storeId: string) {
  try {
    console.log('Creating checkout session:', { priceId, storeId });

    if (!priceId || !storeId) {
      throw new Error('ID do plano e ID da loja são obrigatórios');
    }

    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Erro ao inicializar Stripe');
    }

    console.log('Using Stripe public key:', 
      `${import.meta.env.VITE_STRIPE_PUBLIC_KEY.slice(0, 8)}...`
    );

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, storeId }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    console.log('Checkout session response:', data);

    if ('url' in data) {
      window.location.href = data.url;
      return data;
    }

    if ('id' in data) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: checkoutError } = await stripe.redirectToCheckout({
        sessionId: data.id
      });

      if (checkoutError) {
        console.error('Stripe checkout error:', checkoutError);
        throw checkoutError;
      }

      return data;
    }

    throw new Error('Resposta inválida do servidor');
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(
      error.message || 
      'Erro ao processar pagamento. Por favor, tente novamente.'
    );
  }
}

export async function createPortalSession() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado');
    }

    console.log('Creating portal session');
    const { data, error } = await supabase.functions.invoke('create-portal-session');

    if (error) {
      console.error('Portal session error:', error);
      throw error;
    }

    if (!data?.url) {
      throw new Error('Erro ao acessar portal de pagamento. Por favor, tente novamente.');
    }

    console.log('Portal session created:', data);

    window.location.href = data.url;
    return data;
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    
    throw new Error(
      error.message === 'Cliente não encontrado' 
        ? 'Você precisa ter uma assinatura ativa para acessar o portal de pagamento'
        : 'Erro ao acessar portal de pagamento. Por favor, tente novamente.'
    );
  }
}