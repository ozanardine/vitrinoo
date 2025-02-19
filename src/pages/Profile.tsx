import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Package, Grid, Link, Palette, Store, CreditCard } from 'lucide-react';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Store as StoreType } from '../lib/types';
import { ProfileTab } from '../components/profile/ProfileTab';
import { ProductsTab } from '../components/profile/ProductsTab';
import { CategoriesTab } from '../components/profile/CategoriesTab';
import { IntegrationsTab } from '../components/profile/IntegrationsTab';
import { StoreCustomizationTab } from '../components/profile/StoreCustomizationTab';
import { PlansTab } from '../components/profile/PlansTab';
import { StoreModal } from '../components/StoreModal';
import { getPlans } from '../lib/stripe';
import { PLAN_LIMITS } from '../lib/store';

type TabType = 'profile' | 'catalog' | 'products' | 'categories' | 'integrations' | 'plans';

interface TabButtonProps {
  tab: TabType;
  icon: any;
  label: string;
  activeTab: TabType;
  onClick: (tab: TabType) => void;
}

const TabButton = ({ tab, icon: Icon, label, activeTab, onClick }: TabButtonProps) => (
  <button
    onClick={() => onClick(tab)}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

export function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useStore();
  const [store, setStore] = useState<StoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'profile'
  );
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadData();
  }, [user, navigate]);

  // Atualizar URL quando a aba mudar
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadData = async () => {
    try {
      await loadStoreData();
      const plansData = await getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadStoreData = async () => {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select(`
          *,
          subscriptions!inner(
            id, 
            plan_type,
            active,
            status,
            trial_ends_at,
            next_payment_at
          )
        `)
        .eq('user_id', user?.id)
        .eq('subscriptions.active', true)
        .maybeSingle();

      if (storeError) throw storeError;

      if (!storeData) {
        setStore(null);
        setLoading(false);
        return;
      }

      const [productsCount, categoriesCount] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeData.id),
        supabase
          .from('categories')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeData.id)
          .is('parent_id', null)
      ]);

      const subscription = storeData.subscriptions[0];
      const planType = subscription.plan_type as keyof typeof PLAN_LIMITS;
      const planLimits = PLAN_LIMITS[planType];
      const isTrialing = subscription.status === 'trialing';
      const trialEndsAt = isTrialing ? subscription.trial_ends_at : null;
      const nextPaymentAt = subscription.next_payment_at;

      setStore({
        ...storeData,
        subscription: {
          ...subscription,
          status: isTrialing ? 'trialing' : subscription.status || 'active',
          trial_ends_at: trialEndsAt,
          next_payment_at: nextPaymentAt
        },
        products_count: productsCount.count || 0,
        product_limit: planLimits.products,
        categories_count: categoriesCount.count || 0,
        category_limit: planLimits.categories
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para renderizar mensagem de trial
  const renderTrialMessage = () => {
    if (!store.subscription.trial_ends_at) return null;

    const trialEnd = new Date(store.subscription.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Seu período de demonstração terminou
          </h4>
          <p className="text-yellow-700 dark:text-yellow-300">
            Escolha um plano para continuar aproveitando todos os recursos ou continue gratuitamente com recursos limitados.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleTabChange('plans')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
            >
              Ver Planos
            </button>
            <button
              onClick={() => handleTabChange('profile')}
              className="px-4 py-2 border border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
            >
              Continuar Grátis
            </button>
          </div>
        </div>
      );
    }

    if (daysLeft <= 2) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Seu período de demonstração está acabando!
          </h4>
          <p className="text-yellow-700 dark:text-yellow-300">
            Faltam apenas {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'} para o fim do seu período de demonstração.
            Escolha um plano agora para não perder acesso aos recursos premium.
          </p>
          <button
            onClick={() => handleTabChange('plans')}
            className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
          >
            Ver Planos
          </button>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
          Período de Demonstração
        </h4>
        <p className="text-blue-700 dark:text-blue-300">
          Aproveite todos os recursos do plano Plus gratuitamente por mais {daysLeft} dias.
          Seu período de demonstração termina em {trialEnd.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}.
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Store className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Crie sua primeira loja</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Para começar a usar o Catálogo Digital, você precisa criar uma loja.
          </p>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            onClick={() => setShowStoreModal(true)}
          >
            Criar Loja
          </button>
        </div>

        {showStoreModal && (
          <StoreModal
            onSuccess={() => {
              setShowStoreModal(false);
              loadStoreData();
            }}
          />
        )}
      </div>
    );
  }

  const planType = store.subscription.plan_type as keyof typeof PLAN_LIMITS;
  const planLimits = PLAN_LIMITS[planType];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">
          URL catálogo: <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" > {window.location.origin}/{store.slug} </a>
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8 space-y-4">
              <h2 className="text-xl font-semibold mb-4">
                Plano {planLimits.name}
                {store.subscription.status === 'trialing' && (
                  <span className="ml-2 text-sm font-normal bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                    Demonstração
                  </span>
                )}
              </h2>
              
              {renderTrialMessage()}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Produtos:</span>
                    <span>{store.products_count} de {planLimits.products.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((store.products_count / planLimits.products) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Categorias Principais:</span>
                    <span>{store.categories_count} de {planLimits.categories.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((store.categories_count / planLimits.categories) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Imagens por Produto:</span>
                    <span>Até {planLimits.images_per_product}</span>
                  </div>
                </div>
              </div>
            </div>
            {store.subscription.plan_type !== 'plus' && store.subscription.status !== 'trialing' && (
              <button 
                onClick={() => handleTabChange('plans')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Fazer Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 p-4">
            <TabButton
              tab="profile"
              icon={User}
              label="Perfil"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              tab="catalog"
              icon={Palette}
              label="Catálogo"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              tab="products"
              icon={Package}
              label="Produtos"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              tab="categories"
              icon={Grid}
              label="Categorias"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              tab="integrations"
              icon={Link}
              label="Integrações"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
            <TabButton
              tab="plans"
              icon={CreditCard}
              label="Planos"
              activeTab={activeTab}
              onClick={handleTabChange}
            />
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab store={store} onStoreUpdate={loadStoreData} />}
          {activeTab === 'catalog' && <StoreCustomizationTab store={store} onUpdate={loadStoreData} />}
          {activeTab === 'products' && <ProductsTab store={store} onUpdate={loadStoreData} />}
          {activeTab === 'categories' && <CategoriesTab store={store} onUpdate={loadStoreData} />}
          {activeTab === 'integrations' && <IntegrationsTab store={store} />}
          {activeTab === 'plans' && <PlansTab store={store} plans={plans} />}
        </div>
      </div>
    </div>
  );
}