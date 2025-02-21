import { Store as StoreIcon } from 'lucide-react';
import { Store } from '../../lib/types';

interface StoreFooterProps {
  store: Store;
}

export function StoreFooter({ store }: StoreFooterProps) {
  return (
    <footer 
      className="border-t py-8 mt-12 transition-colors duration-200"
      style={{
        backgroundColor: store.primary_color,
        borderColor: `${store.secondary_color}20`
      }}
    >
      <div className={store.container_width === 'max-w-full' 
        ? 'container-fluid px-4'
        : `container mx-auto px-4 ${store.container_width}`}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <StoreIcon 
            className="w-8 h-8 mb-2" 
            style={{ color: store.accent_color }}
          />
          <p 
            className="mb-4 text-sm"
            style={{ color: `${store.secondary_color}80` }}
          >
            Catálogo criado com Vitryno Digital
          </p>
          <a
            href="/"
            className="px-6 py-2.5 rounded-lg font-medium
              transition-all duration-300 hover:opacity-90"
            style={{ 
              backgroundColor: store.accent_color,
              color: '#FFFFFF'
            }}
          >
            Crie seu próprio catálogo digital
          </a>
        </div>
      </div>
    </footer>
  );
}