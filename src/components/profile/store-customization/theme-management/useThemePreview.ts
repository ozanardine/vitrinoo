import { useState, useCallback } from 'react';
import { ThemePreviewData } from './types';

export function useThemePreview(initialData: ThemePreviewData) {
  const [previewData, setPreviewData] = useState<ThemePreviewData>(initialData);

  const updatePreview = useCallback((updates: Partial<ThemePreviewData>) => {
    setPreviewData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetPreview = useCallback(() => {
    setPreviewData(initialData);
  }, [initialData]);

  return {
    previewData,
    updatePreview,
    resetPreview
  };
}