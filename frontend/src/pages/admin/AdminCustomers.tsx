import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminListCustomers } from '@/api/adminServices';
import { formatCurrency } from '@/utils/format';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin-customers', search], queryFn: () => adminListCustomers(search ? { search } : {}) });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Customers</h1>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or phone..."
        className="mt-4 w-full max-w-sm rounded-full border border-charcoal/15 px-4 py-2 text-sm"
      />

      <div className="card mt-6 overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-charcoal/50">
              <th className="py-2">Name</th>
              <th>Phone</th>
              <th>Orders</th>
              <th className="text-right">Total Spend</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="py-8 text-center text-charcoal/40">Loading...</td></tr>}
            {data?.data.map((c: any) => (
              <tr key={c.id} className="border-t border-charcoal/5">
                <td className="py-2">{c.name}</td>
                <td>{c.phone}</td>
                <td>{c._count?.orders ?? 0}</td>
                <td className="text-right">{formatCurrency(Number(c.totalSpend))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
