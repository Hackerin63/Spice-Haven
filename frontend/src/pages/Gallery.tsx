import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGallery } from '@/api/services';
import { X } from 'lucide-react';

export default function Gallery() {
  const { data: images, isLoading } = useQuery({ queryKey: ['gallery'], queryFn: getGallery });
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Gallery</h1>

      <div className="mt-8 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-48 break-inside-avoid" />)}
        {images?.map((g: any) => (
          <button key={g.id} onClick={() => setActive(g.imageUrl)} className="block w-full break-inside-avoid overflow-hidden rounded-xl">
            <img src={g.imageUrl} alt={g.caption ?? ''} loading="lazy" className="w-full transition hover:scale-105" />
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setActive(null)}>
          <button className="absolute top-6 right-6 text-white" aria-label="Close">
            <X className="h-8 w-8" />
          </button>
          <img src={active} alt="" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
