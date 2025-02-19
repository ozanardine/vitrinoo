import { Store as StoreIcon, ThumbsUp } from 'lucide-react';
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
            className="mb-4"
            style={{ color: `${store.secondary_color}80` }}
          >
            Catálogo criado com Vitryno Digital
          </p>
          <a
            href="/"
            className="inline-flex items-center space-x-2 transition-colors duration-200 hover:opacity-80"
            style={{ color: store.accent_color }}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Crie seu catálogo digital</span>
          </a>
        </div>
      </div>
    </footer>
  );
}