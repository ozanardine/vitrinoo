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
        primary: '#ffffff',
        secondary: '#18181b',
        accent: '#3b82f6',
        background: '#fafafa',
        headerBackground: '#ffffff'
      },
      description: 'Design limpo e moderno com foco no conteúdo'
    },
    // ... outros temas
  };
  
  export const COLOR_PRESETS = {
    primary: [
      '#ffffff', '#f8fafc', '#f0f9ff', '#faf5ff', '#fff1f2', '#f7fee7'
    ],
    secondary: [
      '#1f2937', '#1e3a8a', '#365314', '#3b0764', '#881337', '#422006'
    ],
    accent: [
      '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b'
    ],
    background: [
      '#ffffff', '#f8fafc', '#f1f5f9', '#f9fafb', '#f5f3ff', '#fef2f2'
    ],
    headerBackground: [
      '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#f59e0b'
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