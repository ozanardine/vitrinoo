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
    .select(`*,
      id,
      name,
      description,
      features,
      stripe_prices (
        price_id,
        unit_amount,
        currency,
        interval
      )
    `)
    .eq('active', true)
    .eq('stripe_prices.active', true)
    .order('name');

  if (productsError) throw productsError;
  
  if (!products || products.length === 0) {
    throw new Error('Nenhum plano disponível no momento');
  }

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
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, storeId }
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Erro ao criar sessão:', error);
    let errorMessage = 'Erro ao processar pagamento';
    if (error.message) {
      errorMessage += `: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

export async function createPortalSession() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase.functions.invoke('create-portal-session');

    if (error) {
      console.error('Erro ao criar sessão do portal:', error);
      throw error;
    }

    if (!data?.url) {
      throw new Error('Erro ao acessar portal de pagamento. Por favor, tente novamente.');
    }

    return data;
  } catch (error: any) {
    console.error('Erro ao criar sessão do portal:', error);
    
    throw new Error(
      error.message === 'Cliente não encontrado' 
        ? 'Você precisa ter uma assinatura ativa para acessar o portal de pagamento'
        : 'Erro ao acessar portal de pagamento. Por favor, tente novamente.'
    );
  }
}
