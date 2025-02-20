import { create } from 'zustand';
import { COLOR_THEMES } from '../constants/theme';

interface GradientState {
  direction: string;
  startColor: string;
  endColor: string;
}

interface ThemeState {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  background: string;
  headerBackground: string;
  headerStyle: 'solid' | 'gradient';
  gradient: GradientState;
  selectedPreset: string | null;
}

interface ThemeStore extends ThemeState {
  updateColor: (key: keyof Omit<ThemeState, 'gradient' | 'selectedPreset'>, value: string) => void;
  updateGradient: (prop: keyof GradientState, value: string) => void;
  updateHeaderStyle: (style: 'solid' | 'gradient') => void;
  applyPreset: (presetKey: string) => void;
  initializeTheme: (formData: any) => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  primaryColor: '#ffffff',
  secondaryColor: '#000000',
  accentColor: '#3b82f6',
  background: '#ffffff',
  headerBackground: '#ffffff',
  headerStyle: 'solid',
  gradient: {
    direction: 'to bottom',
    startColor: '#ffffff',
    endColor: '#f8fafc'
  },
  selectedPreset: null,

  updateColor: (key, value) => set(state => ({ ...state, [key]: value })),

  updateGradient: (prop, value) => set(state => ({
    ...state,
    gradient: { ...state.gradient, [prop]: value }
  })),

  updateHeaderStyle: (style) => set(state => ({ 
    ...state, 
    headerStyle: style,
    headerBackground: style === 'solid' ? state.primaryColor : 
      `linear-gradient(${state.gradient.direction}, ${state.gradient.startColor}, ${state.gradient.endColor})`
  })),

  applyPreset: (presetKey) => {
    const preset = COLOR_THEMES[presetKey];
    if (!preset) return;

    set({
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      background: preset.colors.background,
      headerBackground: preset.colors.headerBackground,
      headerStyle: 'solid',
      selectedPreset: presetKey
    });
  },

  initializeTheme: (formData) => {
    const gradientMatch = formData.headerBackground.match(/linear-gradient\((.*?),(.*?),(.*?)\)/);
    
    set({
      primaryColor: formData.primaryColor || '#ffffff',
      secondaryColor: formData.secondaryColor || '#000000',
      accentColor: formData.accentColor || '#3b82f6',
      background: formData.background || '#ffffff',
      headerBackground: formData.headerBackground || '#ffffff',
      headerStyle: (formData.headerStyle === 'image' ? 'solid' : formData.headerStyle) || 'solid',
      gradient: {
        direction: gradientMatch?.[1]?.trim() || 'to bottom',
        startColor: gradientMatch?.[2]?.trim() || '#ffffff',
        endColor: gradientMatch?.[3]?.trim() || '#f8fafc'
      },
      selectedPreset: null
    });
  }
}));