export interface ImageValidation {
    maxSizeMB?: number;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: string;
    acceptedFormats?: string[];
  }
  
  export interface BaseImageUploaderProps extends ImageValidation {
    onError?: (error: string) => void;
    disabled?: boolean;
    className?: string;
  }
  
  export interface SingleImageUploaderProps extends BaseImageUploaderProps {
    onImageUrl: (url: string) => void;
    currentUrl?: string;
  }
  
  export interface GalleryImageUploaderProps extends BaseImageUploaderProps {
    onImagesChange: (urls: string[]) => void;
    currentImages?: string[];
    maxImages?: number;
    planType: 'free' | 'basic' | 'plus';
  }
  
  export interface ImageUploaderValidationResult {
    isValid: boolean;
    error?: string;
  }
  
  export interface ImageUploaderState {
    loading: boolean;
    error: string | null;
  }