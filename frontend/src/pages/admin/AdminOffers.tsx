import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListOffers, adminCreateOffer, adminDeleteOffer } from '@/api/adminServices';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';

export default function AdminOffers() {
  const queryClient = useQueryClient();
  const { data: offers, isLoading } = useQuery({ queryKey: ['admin-offers'], queryFn: adminListOffers });
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !discountValue) return;
    try {
      await adminCreateOffer({ title, discountType, discountValue: Number(discountValue) });
      setTitle(''); setDiscountValue('');
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      toast.success('Offer created');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this offer?')) return;
    try {
      await adminDeleteOffer(id);
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold">Offers</h1>

      <form onSubmit={handleCreate} className="card mt-4 grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Offer title" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" />
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="rounded-lg border border-charcoal/15 p-2 text-sm">
          <option value="PERCENTAGE">%</option>
          <option value="FIXED">₹</option>
        </select>
        <input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="Value" type="number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
        <button type="submit" className="btn-primary sm:col-span-4">Create Offer</button>
      </form>

      <div className="card mt-6 divide-y divide-charcoal/5 p-2">
        {isLoading && <p className="p-4 text-sm text-charcoal/40">Loading...</p>}
        {offers?.map((o: any) => (
          <div key={o.id} className="flex items-center justify-between p-3 text-sm">
            <span>{o.title}</span>
            <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:underline text-xs">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
