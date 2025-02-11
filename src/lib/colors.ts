export function calculateTextColor(backgroundColor: string): 'light' | 'dark' {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return light text for dark backgrounds and vice versa
  return luminance > 0.5 ? 'dark' : 'light';
}

export function generateContrastColor(color: string): string {
  const textColor = calculateTextColor(color);
  return textColor === 'light' ? '#FFFFFF' : '#000000';
}

export function adjustColorBrightness(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export function generateHeaderStyles(primaryColor: string, secondaryColor: string, style: string, gradient?: string) {
  const textColor = calculateTextColor(primaryColor);
  const baseStyles = {
    color: secondaryColor,
    textShadow: textColor === 'light' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
  };

  if (style === 'gradient') {
    return {
      ...baseStyles,
      background: `linear-gradient(${gradient}, ${primaryColor}, ${adjustColorBrightness(primaryColor, -30)})`
    };
  }

  if (style === 'solid') {
    return {
      ...baseStyles,
      backgroundColor: primaryColor
    };
  }

  return baseStyles;
}