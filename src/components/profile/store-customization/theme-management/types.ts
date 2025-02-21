export interface ThemePreviewData {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headerBackground: string;
    background: string;
  }
  
  export interface ThemeData extends ThemePreviewData {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    header_background: string;
  }
  
  export interface ThemeChanges {
    section: string;
    data: Partial<ThemeData>;
    timestamp: number;
  }