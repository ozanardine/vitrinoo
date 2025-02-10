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

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: 'app-storage',
    }
  )
);