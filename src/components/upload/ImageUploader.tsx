import { SingleImageUploaderProps } from './types';
import { BaseImageUploader } from './BaseImageUploader';

export function ImageUploader({
  onImageUrl,
  currentUrl,
  minWidth = 200,
  minHeight = 200,
  ...props
}: SingleImageUploaderProps) {
  return (
    <div className="space-y-4">
      <BaseImageUploader
        onSuccess={onImageUrl}
        onClear={() => onImageUrl('')}
        currentUrl={currentUrl}
        minWidth={minWidth}
        minHeight={minHeight}
        {...props}
      />

      {currentUrl && (
        <div className="relative w-[200px] h-[200px] border border-gray-200 dark:border-gray-600 rounded overflow-hidden">
          <img
            src={currentUrl}
            alt="Preview"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        </div>
      )}
    </div>
  );
}