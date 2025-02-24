import { create } from 'zustand';
import { COLOR_THEMES } from '../constants/theme';

interface ThemeState {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  background: string;
  headerBackground: string;
  headerStyle: 'solid' | 'gradient' | 'image';
  selectedPreset: string | null;
  surfaceColor: string;
  borderColor: string;
  mutedColor: string;
  
  // Estado para controlar mudanças
  isDirty: boolean;
  originalValues: Partial<{
    [K in keyof Omit<ThemeState, 'isDirty' | 'originalValues'>]: K extends 'selectedPreset' ? string | null : string;
  }>;
}

interface ThemeStore extends ThemeState {
  updateColor: (key: keyof Omit<ThemeState, 'selectedPreset' | 'headerStyle' | 'isDirty' | 'originalValues'>, value: string) => void;
  updateHeaderStyle: (style: 'solid' | 'gradient' | 'image') => void;
  applyPreset: (presetKey: string) => void;
  initializeTheme: (formData: any) => void;
  resetToOriginal: () => void;
  commitChanges: () => void;
  hasChanges: () => boolean;
  getStateValues: () => ThemeState;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  primaryColor: '#ffffff',
  secondaryColor: '#000000',
  accentColor: '#3b82f6',
  background: '#ffffff',
  headerBackground: '#ffffff',
  headerStyle: 'solid',
  selectedPreset: null,
  surfaceColor: '#ffffff',
  borderColor: '#e5e7eb',
  mutedColor: '#6b7280',
  
  // Inicialização das propriedades de controle de mudanças
  isDirty: false,
  originalValues: {},

  updateColor: (key, value) => set(state => {
    // Armazenamos o valor original na primeira mudança para essa propriedade
    const originalValues = {
      ...state.originalValues,
      ...(state.isDirty && state.originalValues[key] !== undefined ? {} : { [key]: state[key] })
    };
    
    return { 
      ...state,
      [key]: value,
      isDirty: true,
      originalValues,
      // Limpar preset quando cores são alteradas manualmente
      selectedPreset: null 
    };
  }),

  updateHeaderStyle: (style) => set(state => {
    // Armazenamos o valor original na primeira mudança
    const originalValues = {
      ...state.originalValues,
      ...(state.isDirty && state.originalValues.headerStyle !== undefined ? {} : { 
        headerStyle: state.headerStyle,
        headerBackground: state.headerBackground 
      })
    };
    
    return { 
      ...state, 
      headerStyle: style,
      headerBackground: style === 'solid' ? state.primaryColor : state.headerBackground,
      isDirty: true,
      originalValues
    };
  }),

  applyPreset: (presetKey) => {
    const preset = COLOR_THEMES[presetKey];
    if (!preset) return;

    set(state => {
      // Armazenamos os valores originais na primeira aplicação de preset
      const originalValues = state.isDirty ? state.originalValues : {
        primaryColor: state.primaryColor,
        secondaryColor: state.secondaryColor,
        accentColor: state.accentColor,
        background: state.background,
        headerBackground: state.headerBackground,
        surfaceColor: state.surfaceColor,
        borderColor: state.borderColor,
        mutedColor: state.mutedColor,
        selectedPreset: state.selectedPreset
      };

      return {
        ...state,
        primaryColor: preset.colors.primary,
        secondaryColor: preset.colors.secondary,
        accentColor: preset.colors.accent,
        background: preset.colors.primary,
        headerBackground: preset.colors.header.background,
        surfaceColor: preset.colors.surface,
        borderColor: preset.colors.border,
        mutedColor: preset.colors.muted,
        headerStyle: 'solid',
        selectedPreset: presetKey,
        isDirty: true,
        originalValues
      };
    });
  },

  initializeTheme: (formData) => {
    set({
      primaryColor: formData.primaryColor || '#ffffff',
      secondaryColor: formData.secondaryColor || '#000000',
      accentColor: formData.accentColor || '#3b82f6',
      background: formData.background || '#ffffff',
      headerBackground: formData.headerBackground || '#ffffff',
      headerStyle: formData.headerStyle || 'solid',
      surfaceColor: formData.surfaceColor || '#ffffff',
      borderColor: formData.borderColor || '#e5e7eb',
      mutedColor: formData.mutedColor || '#6b7280',
      selectedPreset: null,
      isDirty: false,
      originalValues: {}
    });
  },
  
  // Nova função para resetar para os valores originais
  resetToOriginal: () => set(state => {
    if (!state.isDirty) return state;
    
    const resetState = { ...state };
    
    // Restaurar valores originais
    Object.entries(state.originalValues).forEach(([key, value]) => {
      if (key in resetState && typeof value === 'string') {
        (resetState as any)[key] = value;
      }
    });
    
    return { 
      ...resetState,
      isDirty: false,
      originalValues: {} 
    };
  }),
  
  // Nova função para confirmar as mudanças
  commitChanges: () => set({ 
    isDirty: false,
    originalValues: {} 
  }),
  
  // Nova função para verificar se há mudanças pendentes
  hasChanges: () => {
    return get().isDirty;
  },
  
  // Função para obter o estado atual
  getStateValues: () => {
    return get();
  }
}));