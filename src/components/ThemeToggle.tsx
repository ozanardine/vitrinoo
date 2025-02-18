import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../lib/store';

interface ThemeToggleProps {
  className?: string;
  accentColor?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '',
  accentColor
}) => {
  const { theme, setTheme } = useStore();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2.5 rounded-full 
        backdrop-blur-sm
        hover:scale-110
        active:scale-95
        transition-all duration-200
        ${className}
      `}
      style={{
        backgroundColor: theme === 'light' 
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.2)',
        boxShadow: `0 0 20px ${accentColor || '#3b82f6'}20`,
        border: `1px solid ${
          theme === 'light' 
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.1)'
        }`
      }}
      aria-label={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-800" />
      ) : (
        <Sun className="w-5 h-5 text-white" />
      )}
    </button>
  );
};
