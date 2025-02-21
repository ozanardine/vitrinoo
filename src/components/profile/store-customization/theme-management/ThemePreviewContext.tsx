import React, { createContext, useContext } from 'react';
import { ThemePreviewData } from './types';
import { useThemePreview } from './useThemePreview';

interface ThemePreviewContextType {
  previewData: ThemePreviewData;
  updatePreview: (updates: Partial<ThemePreviewData>) => void;
  resetPreview: () => void;
}

const ThemePreviewContext = createContext<ThemePreviewContextType | null>(null);

interface ThemePreviewProviderProps {
  initialData: ThemePreviewData;
  children: React.ReactNode;
}

export function ThemePreviewProvider({ initialData, children }: ThemePreviewProviderProps) {
  const { previewData, updatePreview, resetPreview } = useThemePreview(initialData);

  return (
    <ThemePreviewContext.Provider 
      value={{ 
        previewData, 
        updatePreview, 
        resetPreview 
      }}
    >
      {children}
    </ThemePreviewContext.Provider>
  );
}

export function useThemePreviewContext() {
  const context = useContext(ThemePreviewContext);
  if (!context) {
    throw new Error('useThemePreviewContext must be used within ThemePreviewProvider');
  }
  return context;
}