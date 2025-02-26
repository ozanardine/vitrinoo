import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';

type Theme = 'light' | 'dark';

interface StoreState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

// Plan limits configuration
export const PLAN_LIMITS = {
  starter: {
    products: 1000,
    categories: 50,
    images_per_product: 5,
    name: "Starter",
    price: 4900,
    metadata: {
      plan_type: 'starter',
      imgur_enabled: true,
      priority_support: false,
      erp_integration: false,
      ai_features_enabled: false,
      custom_domain_enabled: true,
      api_access: false,
      analytics_enabled: true
    }
  },
  
  // Plano Pro (novo intermediário)
  pro: {
    products: 5000,
    categories: 100,
    images_per_product: 8,
    name: "Pro",
    price: 9900,
    metadata: {
      plan_type: 'pro',
      imgur_enabled: true,
      priority_support: true,
      erp_integration: false,
      ai_features_enabled: true,
      custom_domain_enabled: true,
      api_access: false,
      analytics_enabled: true
    }
  },
  
  // Plano Enterprise (antigo Plus)
  enterprise: {
    products: 15000,
    categories: 300,
    images_per_product: 15,
    name: "Enterprise",
    price: 19900,
    metadata: {
      plan_type: 'enterprise',
      imgur_enabled: true,
      priority_support: true,
      erp_integration: true,
      ai_features_enabled: true,
      custom_domain_enabled: true,
      api_access: true,
      analytics_enabled: true
    }
  }
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        // Update document class when theme changes
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(theme);
        }
      },
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'app-storage',
      // Persist both theme and user
      partialize: (state) => ({
        theme: state.theme,
        user: state.user
      }),
    }
  )
);

// Initialize theme on app load
if (typeof document !== 'undefined') {
  const stored = localStorage.getItem('app-storage');
  const theme = stored ? JSON.parse(stored).state?.theme || 'light' : 'light';
  document.documentElement.classList.add(theme);
}