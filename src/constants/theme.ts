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
      secondary: '#18181B',
      accent: '#2563EB',
      surface: '#F8FAFC',
      border: '#CBD5E1',
      muted: '#475569',
      header: {
        background: '#FFFFFF',
        text: '#18181B'
      }
    },
    description: 'Design minimalista com alto contraste e clareza'
  },
  
  softLight: {
    id: 'softLight',
    name: 'Suave',
    category: 'light',
    colors: {
      primary: '#F8FAFC',
      secondary: '#1E293B',
      accent: '#4F46E5',
      surface: '#FFFFFF',
      border: '#CBD5E1',
      muted: '#475569',
      header: {
        background: '#EEF2FF',
        text: '#1E293B'
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
      secondary: '#431407',
      accent: '#B45309',
      surface: '#FFFFFF',
      border: '#FED7AA',
      muted: '#9A3412',
      header: {
        background: '#FEF3C7',
        text: '#431407'
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
      secondary: '#F1F5F9',
      accent: '#3B82F6',
      surface: '#1E293B',
      border: '#475569',
      muted: '#94A3B8',
      header: {
        background: '#020617',
        text: '#F1F5F9'
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
      secondary: '#F4F4F5',
      accent: '#9333EA',
      surface: '#27272A',
      border: '#52525B',
      muted: '#A1A1AA',
      header: {
        background: '#09090B',
        text: '#F4F4F5'
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
      accent: '#CA8A04',
      surface: '#292524',
      border: '#57534E',
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
      secondary: '#1B4332',
      accent: '#047857',
      surface: '#FFFFFF',
      border: '#D1E4D9',
      muted: '#2D6A4F',
      header: {
        background: '#047857',
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
      muted: '#155E75',
      header: {
        background: '#0E7490',
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
      accent: '#4F46E5',
      surface: '#FFFFFF',
      border: '#E4E4E7',
      muted: '#52525B',
      header: {
        background: '#4338CA',
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
    '#FFFFFF', '#F8FAFC', '#FFFBF5', '#F1F5F2', '#F0FDFF', '#FAFAFA',
    // Backgrounds escuros
    '#0F172A', '#18181B', '#1C1917', '#020617', '#09090B', '#0C0A09'
  ],
  
  secondary: [
    // Texto em fundos claros
    '#18181B', '#1E293B', '#431407', '#1B4332', '#164E63', '#18181B',
    // Texto em fundos escuros
    '#F1F5F9', '#F4F4F5', '#FAFAF9', '#FFFFFF', '#F8FAFC', '#FAFAFA'
  ],
  
  accent: [
    // Cores de destaque com bom contraste
    '#2563EB', '#4F46E5', '#B45309', '#047857', '#0891B2', '#4338CA',
    '#9333EA', '#CA8A04', '#BE185D', '#059669', '#EA580C', '#7C3AED'
  ],

  surface: [
    // Superfícies elevadas claras
    '#FFFFFF', '#F8FAFC', '#FFFBF5', '#F1F5F2', '#F0FDFF', '#FAFAFA',
    // Superfícies elevadas escuras
    '#1E293B', '#27272A', '#292524', '#1F2937', '#18181B', '#1C1917'
  ],

  border: [
    // Bordas para temas claros
    '#CBD5E1', '#E4E4E7', '#FED7AA', '#D1E4D9', '#A5F3FC', '#E4E4E7',
    // Bordas para temas escuros
    '#475569', '#52525B', '#57534E', '#374151', '#3F3F46', '#44403C'
  ],

  muted: [
    // Texto secundário para temas claros
    '#475569', '#475569', '#9A3412', '#2D6A4F', '#155E75', '#52525B',
    // Texto secundário para temas escuros
    '#94A3B8', '#A1A1AA', '#A8A29E', '#9CA3AF', '#A1A1AA', '#A8A29E'
  ]
} as const;