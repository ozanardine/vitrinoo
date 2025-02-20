import { ImageValidation, ImageUploaderValidationResult } from './types';

export const DEFAULT_VALIDATION: Required<ImageValidation> = {
  maxSizeMB: 10,
  minWidth: 200,
  minHeight: 200,
  aspectRatio: '1:1',
  acceptedFormats: ['image/jpeg', 'image/png', 'image/webp']
};

export async function validateImage(
  file: File,
  validation: ImageValidation = {}
): Promise<ImageUploaderValidationResult> {
  const settings = { ...DEFAULT_VALIDATION, ...validation };

  // Validar tipo
  if (!settings.acceptedFormats.includes(file.type)) {
    return {
      isValid: false,
      error: `Formato não suportado. Use: ${settings.acceptedFormats.join(', ')}`
    };
  }

  // Validar tamanho
  const maxSize = settings.maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `A imagem deve ter no máximo ${settings.maxSizeMB}MB`
    };
  }

  // Validar dimensões
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < settings.minWidth || dimensions.height < settings.minHeight) {
      return {
        isValid: false,
        error: `A imagem deve ter no mínimo ${settings.minWidth}x${settings.minHeight} pixels`
      };
    }

    if (settings.aspectRatio) {
      const [targetWidth, targetHeight] = settings.aspectRatio.split(':').map(Number);
      const ratio = dimensions.width / dimensions.height;
      const targetRatio = targetWidth / targetHeight;

      if (Math.abs(ratio - targetRatio) > 0.01) {
        return {
          isValid: false,
          error: `A proporção da imagem deve ser ${settings.aspectRatio}`
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Erro ao validar dimensões da imagem'
    };
  }
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}