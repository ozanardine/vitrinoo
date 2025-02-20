export interface ColorTheme {
  id: string;
  name: string;
  category: 'light' | 'dark' | 'branded';
  colors: {
    primary: string;    // Background color
    secondary: string;  // Text color
    accent: string;     // Interactive elements
    surface: string;    // Cards and elevated elements
    border: string;     // Borders and dividers
    muted: string;      // Secondary text
    header: {
      background: string;
      text: string;
    };
  };
  description: string;
}

export const COLOR_THEMES: Record<string, ColorTheme> = {
  // Light Themes
  minimal: {
    id: 'minimal',
    name: 'Clean Modern',
    category: 'light',
    colors: {
      primary: '#FFFFFF',
      secondary: '#1A1A1A',
      accent: '#2563EB',
      surface: '#F8FAFC',
      border: '#E2E8F0',
      muted: '#64748B',
      header: {
        background: '#FFFFFF',
        text: '#1A1A1A'
      }
    },
    description: 'Design minimalista com alto contraste e clareza'
  },
  
  softLight: {
    id: 'softLight',
    name: 'Suave',
    category: 'light',
    colors: {
      primary: '#F7F9FC',
      secondary: '#334155',
      accent: '#6366F1',
      surface: '#FFFFFF',
      border: '#E2E8F0',
      muted: '#94A3B8',
      header: {
        background: '#EEF2FF',
        text: '#334155'
      }
    },
    description: 'Tons suaves e relaxantes com toques de roxo'
  },

  warmElegant: {
    id: 'warmElegant',
    category: 'light',
    name: 'Elegante',
    colors: {
      primary: '#FFFBF5',
      secondary: '#422006',
      accent: '#C2410C',
      surface: '#FFFFFF',
      border: '#FDDCAB',
      muted: '#92400E',
      header: {
        background: '#FEF3C7',
        text: '#422006'
      }
    },
    description: 'Tons quentes e elegantes com toques terrosos'
  },

  // Dark Themes
  darkPro: {
    id: 'darkPro',
    name: 'Dark Pro',
    category: 'dark',
    colors: {
      primary: '#0F172A',
      secondary: '#F8FAFC',
      accent: '#3B82F6',
      surface: '#1E293B',
      border: '#334155',
      muted: '#94A3B8',
      header: {
        background: '#020617',
        text: '#F8FAFC'
      }
    },
    description: 'Tema escuro profissional com alto contraste'
  },

  darkSoft: {
    id: 'darkSoft',
    name: 'Dark Suave',
    category: 'dark',
    colors: {
      primary: '#18181B',
      secondary: '#FAFAFA',
      accent: '#A855F7',
      surface: '#27272A',
      border: '#3F3F46',
      muted: '#A1A1AA',
      header: {
        background: '#09090B',
        text: '#FAFAFA'
      }
    },
    description: 'Tema escuro com tons suaves de roxo'
  },

  darkLuxury: {
    id: 'darkLuxury',
    name: 'Dark Luxury',
    category: 'dark',
    colors: {
      primary: '#1C1917',
      secondary: '#FAFAF9',
      accent: '#EAB308',
      surface: '#292524',
      border: '#44403C',
      muted: '#A8A29E',
      header: {
        background: '#0C0A09',
        text: '#FAFAF9'
      }
    },
    description: 'Elegante com detalhes dourados'
  },

  // Branded Themes
  nature: {
    id: 'nature',
    name: 'Natureza',
    category: 'branded',
    colors: {
      primary: '#F1F5F2',
      secondary: '#1E3A2B',
      accent: '#2F7A4D',
      surface: '#FFFFFF',
      border: '#D1E4D9',
      muted: '#4B7C5E',
      header: {
        background: '#2F7A4D',
        text: '#FFFFFF'
      }
    },
    description: 'Inspirado em tons naturais e orgânicos'
  },

  ocean: {
    id: 'ocean',
    name: 'Oceano',
    category: 'branded',
    colors: {
      primary: '#F0FDFF',
      secondary: '#164E63',
      accent: '#0891B2',
      surface: '#FFFFFF',
      border: '#A5F3FC',
      muted: '#0E7490',
      header: {
        background: '#06B6D4',
        text: '#FFFFFF'
      }
    },
    description: 'Tons relaxantes de azul'
  },

  tech: {
    id: 'tech',
    name: 'Tech',
    category: 'branded',
    colors: {
      primary: '#FAFAFA',
      secondary: '#18181B',
      accent: '#6366F1',
      surface: '#FFFFFF',
      border: '#E4E4E7',
      muted: '#71717A',
      header: {
        background: '#4F46E5',
        text: '#FFFFFF'
      }
    },
    description: 'Visual moderno e tecnológico'
  }
};

// Color presets para cada tipo de cor
export const COLOR_PRESETS = {
  primary: [
    // Backgrounds claros
    '#FFFFFF', '#F7F9FC', '#FFFBF5', '#F1F5F2', '#F0FDFF', '#FAFAFA',
    // Backgrounds escuros
    '#0F172A', '#18181B', '#1C1917', '#020617', '#09090B', '#0C0A09'
  ],
  
  secondary: [
    // Texto em fundos claros
    '#1A1A1A', '#334155', '#422006', '#1E3A2B', '#164E63', '#18181B',
    // Texto em fundos escuros
    '#F8FAFC', '#FAFAFA', '#FAFAF9', '#FFFFFF', '#F1F5F9', '#F4F4F5'
  ],
  
  accent: [
    // Cores de destaque modernas
    '#2563EB', '#6366F1', '#C2410C', '#2F7A4D', '#0891B2', '#4F46E5',
    '#A855F7', '#EAB308', '#EC4899', '#10B981', '#F97316', '#8B5CF6'
  ],

  surface: [
    // Superfícies elevadas claras
    '#FFFFFF', '#F8FAFC', '#FFFBF5', '#F1F5F2', '#F0FDFF', '#FAFAFA',
    // Superfícies elevadas escuras
    '#1E293B', '#27272A', '#292524', '#1F2937', '#18181B', '#1C1917'
  ],

  border: [
    // Bordas para temas claros
    '#E2E8F0', '#E4E4E7', '#FDDCAB', '#D1E4D9', '#A5F3FC', '#E4E4E7',
    // Bordas para temas escuros
    '#334155', '#3F3F46', '#44403C', '#374151', '#27272A', '#292524'
  ]
} as const;

// Configurações de gradiente melhoradas
export const GRADIENT_PRESETS = [
  {
    name: 'Suave',
    value: 'to bottom',
    stops: ['currentColor', 'color-mix(in srgb, currentColor, #000 20%)']
  },
  {
    name: 'Dramático',
    value: 'to bottom',
    stops: ['currentColor', 'color-mix(in srgb, currentColor, #000 40%)']
  },
  {
    name: 'Diagonal',
    value: 'to bottom right',
    stops: ['currentColor', 'color-mix(in srgb, currentColor, #000 30%)']
  }
];