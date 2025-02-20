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
    name: 'Minimalista',
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
    description: 'Design limpo e moderno com alto contraste'
  },
  
  warmLight: {
    id: 'warmLight',
    name: 'Aconchegante',
    category: 'light',
    colors: {
      primary: '#FFFBF5',
      secondary: '#2D1810',
      accent: '#D97706',
      surface: '#FFF7ED',
      border: '#FDDCAB',
      muted: '#92400E',
      header: {
        background: '#FEF3C7',
        text: '#2D1810'
      }
    },
    description: 'Tons quentes e acolhedores'
  },

  coolLight: {
    id: 'coolLight',
    name: 'Sereno',
    category: 'light',
    colors: {
      primary: '#F0F9FF',
      secondary: '#0C4A6E',
      accent: '#0284C7',
      surface: '#F0FDFF',
      border: '#BAE6FD',
      muted: '#0369A1',
      header: {
        background: '#E0F2FE',
        text: '#0C4A6E'
      }
    },
    description: 'Tons suaves de azul com ótima legibilidade'
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

  darkLuxury: {
    id: 'darkLuxury',
    name: 'Dark Luxury',
    category: 'dark',
    colors: {
      primary: '#18181B',
      secondary: '#FAFAFA',
      accent: '#EAB308',
      surface: '#27272A',
      border: '#3F3F46',
      muted: '#A1A1AA',
      header: {
        background: '#09090B',
        text: '#FAFAFA'
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
    description: 'Inspirado em tons naturais'
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
        text: '#164E63'
      }
    },
    description: 'Tons relaxantes de azul'
  }
};

// Color presets para cada tipo de cor
export const COLOR_PRESETS = {
  primary: [
    // Backgrounds claros
    '#FFFFFF', '#F8FAFC', '#F0F9FF', '#F0FDFF', '#F5F3FF',
    // Backgrounds escuros
    '#0F172A', '#18181B', '#1E293B', '#1E1E1E', '#0C0A09'
  ],
  
  secondary: [
    // Texto em fundos claros
    '#0F172A', '#18181B', '#1E293B', '#1A1A1A', '#0C0A09',
    // Texto em fundos escuros
    '#F8FAFC', '#F1F5F9', '#FAFAFA', '#FFFFFF', '#F5F5F5'
  ],
  
  accent: [
    // Cores de destaque com bom contraste
    '#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626',
    '#6D28D9', '#BE185D', '#EA580C', '#65A30D', '#0284C7'
  ],

  surface: [
    // Superfícies elevadas claras
    '#FFFFFF', '#F8FAFC', '#F0F9FF', '#FEFCE8', '#F5F3FF',
    // Superfícies elevadas escuras
    '#1E293B', '#27272A', '#292524', '#1F2937', '#18181B'
  ],

  border: [
    // Bordas para temas claros
    '#E2E8F0', '#D1D5DB', '#BAE6FD', '#FDE68A', '#DDD6FE',
    // Bordas para temas escuros
    '#334155', '#3F3F46', '#44403C', '#374151', '#27272A'
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