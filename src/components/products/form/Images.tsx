import { ImageGalleryUploader } from '../../upload/ImageGalleryUploader';

interface ImagesProps {
  form: any;
  setForm: (form: any) => void;
  planType: 'free' | 'basic' | 'plus';
}

export function Images({ form, setForm, planType }: ImagesProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Imagens</h3>
      
      <ImageGalleryUploader
        onImagesChange={(urls) => setForm({ ...form, images: urls })}
        currentImages={form.images}
        maxImages={planType === 'free' ? 3 : planType === 'basic' ? 5 : 10}
        planType={planType}
      />
    </div>
  );
}