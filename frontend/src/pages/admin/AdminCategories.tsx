import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListCategories, adminCreateCategory, adminDeleteCategory } from '@/api/adminServices';
import { slugify } from '@/utils/format';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: adminListCategories });
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await adminCreateCategory({ name, slug: slugify(name), displayOrder: (categories?.length ?? 0) + 1 });
      setName('');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category created');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category?')) return;
    try {
      await adminDeleteCategory(id);
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Categories</h1>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="flex-1 rounded-lg border border-charcoal/15 p-2 text-sm" />
        <button type="submit" disabled={saving} className="btn-primary !px-4 !py-2 text-sm">Add</button>
      </form>

      <div className="card mt-6 divide-y divide-charcoal/5 p-2">
        {isLoading && <p className="p-4 text-sm text-charcoal/40">Loading...</p>}
        {categories?.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between p-3 text-sm">
            <span>{c.name} <span className="text-charcoal/40">({c._count?.products ?? 0} products)</span></span>
            <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-xs">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
