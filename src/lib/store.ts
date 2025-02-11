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
  free: {
    products: 100,
    categories: 10,
    images_per_product: 3,
    name: 'Gratuito',
    price: 0
  },
  basic: {
    products: 1000,
    categories: 50,
    images_per_product: 5,
    name: 'Básico',
    price: 47
  },
  plus: {
    products: 10000,
    categories: 200,
    images_per_product: 10,
    name: 'Plus',
    price: 97
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