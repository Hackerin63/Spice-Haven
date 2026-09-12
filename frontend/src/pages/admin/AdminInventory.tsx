import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListInventory, adminAdjustStock } from '@/api/adminServices';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const { data: inventory, isLoading } = useQuery({ queryKey: ['admin-inventory', lowStockOnly], queryFn: () => adminListInventory(lowStockOnly) });

  async function adjust(productId: string, delta: number) {
    try {
      await adminAdjustStock(productId, Math.abs(delta), delta > 0 ? 'RESTOCK' : 'ADJUSTMENT', 'Manual adjustment from admin panel');
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} /> Low stock only
        </label>
      </div>

      <div className="card mt-6 overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-charcoal/50">
              <th className="py-2">Product</th>
              <th>Current Stock</th>
              <th>Min Stock</th>
              <th>Status</th>
              <th className="text-right">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="py-8 text-center text-charcoal/40">Loading...</td></tr>}
            {inventory?.map((inv: any) => (
              <tr key={inv.id} className="border-t border-charcoal/5">
                <td className="py-2">{inv.product.name}</td>
                <td>{inv.currentStock}</td>
                <td>{inv.minStock}</td>
                <td>
                  <span className={clsx('rounded-full px-2 py-0.5 text-xs', {
                    'bg-green-100 text-green-700': inv.status === 'IN_STOCK',
                    'bg-amber-100 text-amber-700': inv.status === 'LOW_STOCK',
                    'bg-red-100 text-red-700': inv.status === 'OUT_OF_STOCK',
                  })}>
                    {inv.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => adjust(inv.product.id, -5)} className="rounded bg-charcoal/5 px-2 py-1 text-xs">-5</button>
                    <button onClick={() => adjust(inv.product.id, 5)} className="rounded bg-charcoal/5 px-2 py-1 text-xs">+5</button>
                    <button onClick={() => adjust(inv.product.id, 20)} className="rounded bg-charcoal/5 px-2 py-1 text-xs">+20</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
