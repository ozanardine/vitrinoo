import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface StoreThemeState {
  theme: Theme;
  storeThemes: Record<string, Theme>;
  setTheme: (theme: Theme, storeId?: string) => void;
  getTheme: (storeId: string) => Theme;
}

export const useStoreTheme = create<StoreThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      storeThemes: {},
      setTheme: (theme: Theme, storeId?: string) => {
        if (storeId) {
          // Update specific store theme
          set((state) => ({
            storeThemes: {
              ...state.storeThemes,
              [storeId]: theme
            }
          }));
          // Also store in localStorage for persistence
          localStorage.setItem(`store-theme-${storeId}`, theme);
        } else {
          // Update default theme
          set({ theme });
        }
      },
      getTheme: (storeId: string) => {
        const state = get();
        if (storeId) {
          // First check the store-specific theme in state
          const storeTheme = state.storeThemes[storeId];
          if (storeTheme) return storeTheme;
          
          // Then check localStorage
          const storedTheme = localStorage.getItem(`store-theme-${storeId}`) as Theme;
          if (storedTheme) {
            // Update state with stored theme
            set((state) => ({
              storeThemes: {
                ...state.storeThemes,
                [storeId]: storedTheme
              }
            }));
            return storedTheme;
          }
        }
        // Fallback to default theme
        return state.theme;
      }
    }),
    {
      name: 'store-theme-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        storeThemes: state.storeThemes
      })
    }
  )
);
