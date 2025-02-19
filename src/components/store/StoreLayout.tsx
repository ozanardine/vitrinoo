import React from 'react';
import { StoreHeader } from './StoreHeader';
import { StoreFooter } from './StoreFooter';
import { Store } from '../../lib/types';
import { useStoreTheme } from '../../lib/store-theme';

interface StoreLayoutProps {
  store: Store;
  children: React.ReactNode;
}

export function StoreLayout({ store, children }: StoreLayoutProps) {
  const { theme } = useStoreTheme();

  // Theme-aware styles
  const themeStyles = {
    background: theme === 'dark' ? '#111827' : `${store?.primary_color}10`,
    text: theme === 'dark' ? '#ffffff' : store?.secondary_color,
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: themeStyles.background,
        color: themeStyles.text
      }}
    >
      {/* Store Header */}
      <StoreHeader
        name={store.name}
        description={store.description}
        logoUrl={store.logo_url}
        primaryColor={store.primary_color}
        secondaryColor={store.secondary_color}
        accentColor={store.accent_color}
        socialLinks={store.social_links}
        customization={{
          headerStyle: store.header_style,
          headerHeight: store.header_height,
          headerImage: store.header_image,
          headerGradient: store.header_gradient,
          headerAlignment: store.header_alignment,
          headerOverlayOpacity: store.header_overlay_opacity,
          headerVisibility: store.header_visibility,
          logoSize: store.logo_size,
          titleSize: store.title_size,
          descriptionSize: store.description_size,
          titleFont: store.title_font,
          bodyFont: store.body_font,
          socialSettings: store.social_settings
        }}
      />

      {/* Main Content */}
      <main 
        className={`${store.container_width === 'max-w-full' 
          ? 'container-fluid px-4'
          : `container mx-auto px-4 ${store.container_width}`} transition-all duration-200`}
        style={{ fontFamily: store.body_font }}
      >
        {children}
      </main>

      {/* Store Footer */}
      <StoreFooter
        store={store}
        theme={theme}
      />
    </div>
  );
}