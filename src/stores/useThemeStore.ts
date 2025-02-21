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
}

interface ThemeStore extends ThemeState {
  updateColor: (key: keyof Omit<ThemeState, 'selectedPreset' | 'headerStyle'>, value: string) => void;
  updateHeaderStyle: (style: 'solid' | 'gradient' | 'image') => void;
  applyPreset: (presetKey: string) => void;
  initializeTheme: (formData: any) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
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

  updateColor: (key, value) => set(state => ({ ...state, [key]: value })),

  updateHeaderStyle: (style) => set(state => ({ 
    ...state, 
    headerStyle: style,
    headerBackground: style === 'solid' ? state.primaryColor : state.headerBackground
  })),

  applyPreset: (presetKey) => {
    const preset = COLOR_THEMES[presetKey];
    if (!preset) return;

    set({
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      background: preset.colors.primary,
      headerBackground: preset.colors.header.background,
      headerStyle: 'solid',
      selectedPreset: presetKey
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
      selectedPreset: null
    });
  }
}));