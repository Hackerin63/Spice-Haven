import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListCoupons, adminCreateCoupon, adminDeleteCoupon } from '@/api/adminServices';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const { data: coupons, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: adminListCoupons });
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !discountValue) return;
    setSaving(true);
    try {
      await adminCreateCoupon({
        code,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        perCustomerLimit: 1,
      });
      setCode(''); setDiscountValue(''); setMinOrderAmount('');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return;
    try {
      await adminDeleteCoupon(id);
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold">Coupons</h1>

      <form onSubmit={handleCreate} className="card mt-4 grid grid-cols-2 gap-3 p-5 sm:grid-cols-5">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" />
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="rounded-lg border border-charcoal/15 p-2 text-sm">
          <option value="PERCENTAGE">%</option>
          <option value="FIXED">₹</option>
        </select>
        <input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="Value" type="number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
        <input value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} placeholder="Min order" type="number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
        <button type="submit" disabled={saving} className="btn-primary sm:col-span-5">{saving ? 'Saving...' : 'Create Coupon'}</button>
      </form>

      <div className="card mt-6 divide-y divide-charcoal/5 p-2">
        {isLoading && <p className="p-4 text-sm text-charcoal/40">Loading...</p>}
        {coupons?.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between p-3 text-sm">
            <span className="font-mono font-semibold">{c.code}</span>
            <span className="text-charcoal/60">
              {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`} off · used {c.timesUsed}{c.usageLimit ? `/${c.usageLimit}` : ''}
            </span>
            <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline text-xs">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
