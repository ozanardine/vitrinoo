import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStoreTheme } from '../../lib/store-theme';

interface StoreThemeToggleProps {
  className?: string;
  accentColor?: string;
  preview?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowPreviewToggle?: boolean;
  storeId?: string;
}

export const StoreThemeToggle: React.FC<StoreThemeToggleProps> = ({ 
  className = '',
  accentColor = '#3b82f6',
  preview = false,
  size = 'md',
  allowPreviewToggle = false,
  storeId
}) => {
  const { theme, setTheme, getTheme } = useStoreTheme();
  const [previewTheme, setPreviewTheme] = useState('light');
  const currentTheme = storeId ? getTheme(storeId) : theme;
  const isDark = preview ? previewTheme === 'dark' : currentTheme === 'dark';

  const toggleTheme = () => {
    if (preview) {
      if (allowPreviewToggle) {
        setPreviewTheme(prev => prev === 'dark' ? 'light' : 'dark');
      }
      return;
    }
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    // Update both store theme and document class
    setTheme(newTheme, storeId);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3.5'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        rounded-full 
        backdrop-blur-sm
        ${!preview && 'hover:scale-110 hover:shadow-lg active:scale-95'}
        transition-all duration-300 ease-in-out
        ${preview && !allowPreviewToggle ? 'cursor-default pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        backgroundColor: isDark 
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.2)',
        boxShadow: `0 0 20px ${accentColor}30`,
        border: `1px solid ${
          isDark 
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0.3)'
        }`,
        transform: `rotate(${isDark ? '180deg' : '0deg'})`,
      }}
      aria-label={preview ? 'Theme button (preview)' : `Switch to ${isDark ? 'light' : 'dark'} theme`}
      disabled={preview && !allowPreviewToggle}
      title={preview ? undefined : `Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <div className="transition-transform duration-300" style={{ transform: `rotate(${isDark ? '-180deg' : '0deg'})` }}>
        {isDark ? (
          <Sun className={`${iconSizes[size]} text-white`} />
        ) : (
          <Moon className={`${iconSizes[size]} text-gray-800`} />
        )}
      </div>
    </button>
  );
};
