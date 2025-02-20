import { SingleImageUploaderProps } from './types';
import { BaseImageUploader } from './BaseImageUploader';

export function ImageUploader({
  onImageUrl,
  currentUrl,
  ...props
}: SingleImageUploaderProps) {
  return (
    <div className="space-y-4">
      <BaseImageUploader
        onSuccess={onImageUrl}
        onClear={() => onImageUrl('')}
        currentUrl={currentUrl}
        {...props}
      />

      {currentUrl && (
        <img
          src={currentUrl}
          alt="Preview"
          className="w-full h-48 object-cover rounded"
        />
      )}
    </div>
  );
}