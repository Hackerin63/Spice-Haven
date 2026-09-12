import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminListOrders } from '@/api/adminServices';
import { formatCurrency } from '@/utils/format';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];

export default function AdminOrders() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () => adminListOrders(status ? { status } : {}),
    refetchInterval: 15000,
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-charcoal/15 px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card mt-6 overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-charcoal/50">
              <th className="py-2">Order #</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Source</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="py-8 text-center text-charcoal/40">Loading...</td></tr>
            )}
            {data?.data.map((o: any) => (
              <tr key={o.id} className="border-t border-charcoal/5">
                <td className="py-2"><Link to={`/admin/orders/${o.id}`} className="text-brand-600 hover:underline">{o.orderNumber}</Link></td>
                <td>{o.customer?.name}</td>
                <td>{o.orderType}</td>
                <td><span className="rounded-full bg-charcoal/5 px-2 py-0.5 text-xs">{o.status}</span></td>
                <td>{o.source}</td>
                <td className="text-right">{formatCurrency(o.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
