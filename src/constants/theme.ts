export interface ColorTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    headerBackground: string;
  };
  description: string;
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
  minimal: {
    name: 'Minimalista',
    colors: {
      primary: '#FFFFFF',
      secondary: '#1A1A1A',
      accent: '#2563EB',
      background: '#F8FAFC',
      headerBackground: '#FFFFFF'
    },
    description: 'Design limpo e moderno com foco no conteúdo'
  },
  modern: {
    name: 'Moderno',
    colors: {
      primary: '#F1F5F9',
      secondary: '#0F172A',
      accent: '#4F46E5',
      background: '#F8FAFC',
      headerBackground: '#4F46E5'
    },
    description: 'Visual contemporâneo com tons suaves e elegantes'
  },
  light: {
    name: 'Claro Moderno',
    description: 'Tema claro com cores modernas e minimalistas',
    colors: {
      primary: '#FFFFFF',
      secondary: '#0F172A',
      accent: '#2563EB',
      background: '#FFFFFF',
      headerBackground: '#F1F5F9'
    }
  },
  dark: {
    name: 'Escuro Elegante',
    description: 'Tema escuro com tons sofisticados',
    colors: {
      primary: '#0F172A',
      secondary: '#F8FAFC',
      accent: '#3B82F6',
      background: '#0F172A',
      headerBackground: '#020617'
    }
  },
  nature: {
    name: 'Natureza',
    description: 'Inspirado em tons naturais e orgânicos',
    colors: {
      primary: '#F7F5E8',
      secondary: '#2A2F45',
      accent: '#4D7C6F',
      background: '#F7F5E8',
      headerBackground: '#E5C577'
    }
  },
  ocean: {
    name: 'Oceano',
    description: 'Tons relaxantes de azul e turquesa',
    colors: {
      primary: '#ECFEFF',
      secondary: '#164E63',
      accent: '#0891B2',
      background: '#ECFEFF',
      headerBackground: '#67E8F9'
    }
  },
  darkLuxury: {
    name: 'Luxo Noturno',
    description: 'Tema escuro com detalhes dourados',
    colors: {
      primary: '#0F172A',
      secondary: '#F8FAFC',
      accent: '#EAB308',
      background: '#0F172A',
      headerBackground: '#1E293B'
    }
  },
  darkPurple: {
    name: 'Roxo Profundo',
    description: 'Tema escuro com tons de roxo',
    colors: {
      primary: '#1E1B4B',
      secondary: '#F8FAFC',
      accent: '#8B5CF6',
      background: '#1E1B4B',
      headerBackground: '#312E81'
    }
  },
  sunset: {
    name: 'Pôr do Sol',
    description: 'Cores quentes e acolhedoras',
    colors: {
      primary: '#FFF7ED',
      secondary: '#1E293B',
      accent: '#EA580C',
      background: '#FFF7ED',
      headerBackground: '#FB923C'
    }
  },
  darkForest: {
    name: 'Floresta Noturna',
    description: 'Tema escuro com tons de verde',
    colors: {
      primary: '#0F172A',
      secondary: '#F8FAFC',
      accent: '#22C55E',
      background: '#0F172A',
      headerBackground: '#1E293B'
    }
  }
};

export const EXTENDED_COLOR_PRESETS = {
  primary: [
    '#FFFFFF', '#F8FAFC', '#F1F5F9', '#EFF6FF', '#F0FDFA', '#F7FEE7',
    '#FFFBEB', '#F0FDF4', '#FAF5FF', '#FFF1F2', '#F8FAFC', '#0F172A'
  ],
  secondary: [
    '#0F172A', '#1E293B', '#334155', '#1E1B4B', '#312E81', '#064E3B',
    '#422006', '#7C2D12', '#831843', '#581C87', '#1E1B4B', '#F8FAFC'
  ],
  accent: [
    '#2563EB', '#4F46E5', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
    '#0EA5E9', '#06B6D4', '#8B5CF6', '#EF4444', '#84CC16', '#EAB308'
  ],
  background: [
    '#FFFFFF', '#F8FAFC', '#F1F5F9', '#EFF6FF', '#F0FDFA', '#F7FEE7',
    '#FFFBEB', '#F0FDF4', '#FAF5FF', '#FFF1F2', '#F8FAFC', '#0F172A'
  ],
  headerBackground: [
    '#2563EB', '#4F46E5', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
    '#0EA5E9', '#06B6D4', '#8B5CF6', '#EF4444', '#84CC16', '#EAB308'
  ]
} as const;

export interface GradientDirection {
  value: string;
  label: string;
}

export const GRADIENT_DIRECTIONS: GradientDirection[] = [
  { value: 'to bottom', label: 'De cima para baixo' },
  { value: 'to right', label: 'Da esquerda para direita' },
  { value: 'to bottom right', label: 'Diagonal ↘' },
  { value: 'to bottom left', label: 'Diagonal ↙' },
  { value: 'to top', label: 'De baixo para cima' },
  { value: 'to top right', label: 'Diagonal ↗' },
  { value: 'to top left', label: 'Diagonal ↖' }
];