import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListCombos, adminDeleteCombo, adminCreateCombo, adminListProducts } from '@/api/adminServices';
import { formatCurrency, slugify } from '@/utils/format';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/client';

export default function AdminCombos() {
  const queryClient = useQueryClient();
  const { data: combos, isLoading } = useQuery({ queryKey: ['admin-combos'], queryFn: adminListCombos });
  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: () => adminListProducts() });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number }>>([]);

  function addItem() {
    if (!selectedProductId) return toast.error('Select a product');
    setItems((current) => {
      const existing = current.find((item) => item.productId === selectedProductId);
      if (existing) return current.map((item) => item.productId === selectedProductId ? { ...item, quantity: item.quantity + Number(quantity || 1) } : item);
      return [...current, { productId: selectedProductId, quantity: Number(quantity || 1) }];
    });
    setSelectedProductId('');
    setQuantity('1');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !originalPrice || !comboPrice || items.length === 0) return toast.error('Enter prices and add at least one product');
    if (Number(comboPrice) >= Number(originalPrice)) return toast.error('Combo price must be lower than original price');
    try {
      await adminCreateCombo({
        name, slug: slugify(name) + '-' + Date.now().toString().slice(-4), description,
        imageUrl: imageUrl || undefined, originalPrice: Number(originalPrice), comboPrice: Number(comboPrice), items,
      });
      setName(''); setDescription(''); setImageUrl(''); setOriginalPrice(''); setComboPrice(''); setItems([]); setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-combos'] });
      toast.success('Combo created');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this combo?')) return;
    try {
      await adminDeleteCombo(id);
      queryClient.invalidateQueries({ queryKey: ['admin-combos'] });
      toast.success('Done');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Combos</h1>
        <button onClick={() => setShowForm((value) => !value)} className="btn-primary !px-4 !py-2 text-sm">{showForm ? 'Cancel' : '+ Add Combo'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mt-4 grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Combo name" required className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" type="url" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Original price" type="number" min="0.01" step="0.01" required className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={comboPrice} onChange={(e) => setComboPrice(e.target.value)} placeholder="Combo price" type="number" min="0.01" step="0.01" required className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" />
          <div className="flex gap-2 sm:col-span-2">
            <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-charcoal/15 p-2 text-sm">
              <option value="">Select product</option>
              {products?.data.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min="1" className="w-20 rounded-lg border border-charcoal/15 p-2 text-sm" />
            <button type="button" onClick={addItem} className="rounded-lg border border-charcoal/15 px-3 text-sm">Add item</button>
          </div>
          <div className="text-sm text-charcoal/70 sm:col-span-2">
            {items.length === 0 ? 'No products added yet.' : items.map((item) => {
              const product = products?.data.find((candidate) => candidate.id === item.productId);
              return <div key={item.productId} className="flex justify-between border-b border-charcoal/5 py-1"><span>{product?.name} x {item.quantity}</span><button type="button" onClick={() => setItems(items.filter((current) => current.productId !== item.productId))} className="text-red-600">Remove</button></div>;
            })}
          </div>
          <button type="submit" className="btn-primary sm:col-span-2">Create Combo</button>
        </form>
      )}

      <div className="card mt-6 overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-charcoal/50">
              <th className="py-2">Name</th>
              <th>Items</th>
              <th>Price</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="py-8 text-center text-charcoal/40">Loading...</td></tr>}
            {combos?.map((c) => (
              <tr key={c.id} className="border-t border-charcoal/5">
                <td className="py-2"><div className="flex items-center gap-2">{c.imageUrl && <img src={c.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />}{c.name}</div></td>
                <td>{c.items.map((i) => i.product.name).join(', ')}</td>
                <td>{formatCurrency(c.comboPrice)}</td>
                <td>{c.isAvailable ? 'Available' : 'Unavailable'}</td>
                <td className="text-right"><button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
