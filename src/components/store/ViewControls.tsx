import React from 'react';
import { Grid, List } from 'lucide-react';
import { SortType } from '../../lib/hooks/useProductSort';

interface ViewControlsProps {
  currentView: 'grid' | 'list';
  setCurrentView: (view: 'grid' | 'list') => void;
  currentSort: SortType;
  setCurrentSort: (sort: SortType) => void;
  productsCount: number;
  accentColor: string;
  secondaryColor: string;
  primaryColor: string;
}

export function ViewControls({
  currentView,
  setCurrentView,
  currentSort,
  setCurrentSort,
  productsCount,
  accentColor,
  secondaryColor,
  primaryColor
}: ViewControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      <div className="flex items-center space-x-4 w-full sm:w-auto">
        {/* Sort Dropdown */}
        <select
          value={currentSort}
          onChange={(e) => setCurrentSort(e.target.value as SortType)}
          className="p-2 border rounded transition-colors w-full sm:w-auto
            focus:ring-2 focus:outline-none dark:bg-gray-800 dark:border-gray-700"
          style={{
            borderColor: `${accentColor}40`,
            color: secondaryColor,
            backgroundColor: `${primaryColor}05`
          }}
        >
          <option value="recent">Mais recentes</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>

        {/* View Toggle Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('grid')}
            className={`p-2 rounded transition-all duration-200 ${
              currentView === 'grid' 
                ? 'bg-opacity-20' 
                : 'bg-opacity-0 hover:bg-opacity-10'
            }`}
            style={{ backgroundColor: accentColor }}
            aria-label="Visualização em grade"
          >
            <Grid className="w-5 h-5" style={{ color: secondaryColor }} />
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`p-2 rounded transition-all duration-200 ${
              currentView === 'list' 
                ? 'bg-opacity-20' 
                : 'bg-opacity-0 hover:bg-opacity-10'
            }`}
            style={{ backgroundColor: accentColor }}
            aria-label="Visualização em lista"
          >
            <List className="w-5 h-5" style={{ color: secondaryColor }} />
          </button>
        </div>
      </div>

      {/* Products Count */}
      <div 
        className="text-sm"
        style={{ color: `${secondaryColor}80` }}
      >
        {productsCount} {productsCount === 1 ? 'produto' : 'produtos'}
      </div>
    </div>
  );
}