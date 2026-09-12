import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGallery } from '@/api/services';
import { adminCreateGalleryImage, adminDeleteGalleryImage, getUploadStatus, uploadImage } from '@/api/adminServices';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';
import { UploadCloud } from 'lucide-react';

export default function AdminGallery() {
  const queryClient = useQueryClient();
  const { data: images, isLoading } = useQuery({ queryKey: ['gallery'], queryFn: getGallery });
  const { data: uploadStatus } = useQuery({ queryKey: ['upload-status'], queryFn: getUploadStatus });
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAddByUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl) return;
    try {
      await adminCreateGalleryImage({ imageUrl, caption });
      setImageUrl(''); setCaption('');
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      toast.success('Image added');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleFileSelected(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadImage(file, 'gallery');
      await adminCreateGalleryImage({ imageUrl: url, caption });
      setCaption('');
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this image?')) return;
    try {
      await adminDeleteGalleryImage(id);
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Gallery</h1>

      {uploadStatus?.configured ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileSelected(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-charcoal/20 p-8 text-center hover:border-brand-400"
        >
          <UploadCloud className="h-8 w-8 text-charcoal/40" />
          <p className="text-sm text-charcoal/60">{uploading ? 'Uploading...' : 'Drag & drop an image, or click to select a file'}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
            }}
          />
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-charcoal/50">
            Direct file upload requires Cloudinary credentials in the backend .env (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).
            Until then, paste an image URL below.
          </p>
          <form onSubmit={handleAddByUrl} className="mt-4 flex flex-wrap gap-2">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="flex-1 min-w-[240px] rounded-lg border border-charcoal/15 p-2 text-sm" />
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" className="flex-1 min-w-[160px] rounded-lg border border-charcoal/15 p-2 text-sm" />
            <button type="submit" className="btn-primary !px-4 !py-2 text-sm">Add</button>
          </form>
        </>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32" />)}
        {images?.map((g: any) => (
          <div key={g.id} className="relative overflow-hidden rounded-xl">
            <img src={g.imageUrl} alt={g.caption ?? ''} className="h-32 w-full object-cover" />
            <button onClick={() => handleDelete(g.id)} className="absolute top-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

