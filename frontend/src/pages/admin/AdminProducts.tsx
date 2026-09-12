import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListProducts, adminCreateProduct, adminUpdateProduct, adminToggleProductAvailability, adminDeleteProduct, adminListCategories, getUploadStatus, uploadImage } from '@/api/adminServices';
import { formatCurrency, slugify } from '@/utils/format';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: () => adminListProducts() });
  const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: adminListCategories });
  const { data: uploadStatus } = useQuery({ queryKey: ['upload-status'], queryFn: getUploadStatus });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !categoryId || !price) return toast.error('Please fill in all required fields');
    setSaving(true);
    try {
      await adminCreateProduct({
        name,
        slug: slugify(name) + '-' + Date.now().toString().slice(-4),
        categoryId,
        price: Number(price),
        isVeg,
        images: imageUrl ? [{ url: imageUrl, sortOrder: 0 }] : undefined,
        initialStock: 50,
        minStock: 5,
      });
      toast.success('Product created');
      setName(''); setPrice(''); setImageUrl(''); setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    try {
      const result = await uploadImage(file, 'products');
      setImageUrl(result.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function setExistingProductImage(id: string) {
    const url = window.prompt('Enter product image URL');
    if (!url) return;
    try {
      await adminUpdateProduct(id, { images: [{ url, sortOrder: 0 }] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product image updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function toggleAvailability(id: string) {
    try {
      await adminToggleProductAvailability(id);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product? If it has past orders it will be deactivated instead.')) return;
    try {
      await adminDeleteProduct(id);
      toast.success('Done');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary !px-4 !py-2 text-sm">
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mt-4 grid grid-cols-1 gap-3 p-5 sm:grid-cols-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-lg border border-charcoal/15 p-2 text-sm">
            <option value="">Category</option>
            {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" type="number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" type="url" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" />
          {uploadStatus?.configured && <><button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-charcoal/15 p-2 text-sm">Upload image</button><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} /></>}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} /> Vegetarian
          </label>
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2">{saving ? 'Saving...' : 'Create Product'}</button>
        </form>
      )}

      <div className="card mt-6 overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-charcoal/50">
              <th className="py-2">Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="py-8 text-center text-charcoal/40">Loading...</td></tr>}
            {products?.data.map((p) => (
              <tr key={p.id} className="border-t border-charcoal/5">
                <td className="py-2">{p.name}</td>
                <td>{p.category?.name}</td>
                <td>{formatCurrency(p.discountPrice ?? p.price)}</td>
                <td>{p.inventory?.currentStock ?? '-'}</td>
                <td>
                  <button onClick={() => toggleAvailability(p.id)} className={`rounded-full px-2 py-0.5 text-xs ${p.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </td>
                <td className="text-right">
                  <button onClick={() => setExistingProductImage(p.id)} className="mr-3 text-brand-700 hover:underline text-xs">Set Image</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
