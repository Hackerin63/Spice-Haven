import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSalesReport, exportOrdersCsvUrl } from '@/api/adminServices';
import { formatCurrency } from '@/utils/format';

export default function AdminReports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['sales-report', from, to], queryFn: () => getSalesReport(from || undefined, to || undefined) });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-charcoal/50">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block rounded-lg border border-charcoal/15 p-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-charcoal/50">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block rounded-lg border border-charcoal/15 p-2 text-sm" />
        </div>
        <a href={exportOrdersCsvUrl(from || undefined, to || undefined)} className="btn-secondary !px-4 !py-2 text-sm" target="_blank" rel="noreferrer">
          Export CSV
        </a>
      </div>

      {isLoading && <div className="skeleton mt-6 h-40" />}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="card p-4"><p className="text-xs text-charcoal/50">Gross Sales</p><p className="mt-1 text-xl font-bold">{formatCurrency(data.grossSales)}</p></div>
            <div className="card p-4"><p className="text-xs text-charcoal/50">Discounts</p><p className="mt-1 text-xl font-bold">{formatCurrency(data.totalDiscount)}</p></div>
            <div className="card p-4"><p className="text-xs text-charcoal/50">Tax Collected</p><p className="mt-1 text-xl font-bold">{formatCurrency(data.totalTax)}</p></div>
            <div className="card p-4"><p className="text-xs text-charcoal/50">Net Sales</p><p className="mt-1 text-xl font-bold">{formatCurrency(data.netSales)}</p></div>
          </div>

          <div className="card mt-6 p-5">
            <h2 className="font-semibold">Best Sellers</h2>
            <table className="mt-3 w-full text-sm">
              <thead><tr className="text-left text-charcoal/50"><th>Item</th><th>Qty Sold</th><th className="text-right">Revenue</th></tr></thead>
              <tbody>
                {data.bestSellers.map((b: any, i: number) => (
                  <tr key={i} className="border-t border-charcoal/5">
                    <td className="py-1">{b.name}</td>
                    <td>{b.qty}</td>
                    <td className="text-right">{formatCurrency(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card mt-6 p-5">
            <h2 className="font-semibold">Payment Method Breakdown</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {Object.entries(data.paymentBreakdown).map(([method, amount]) => (
                <li key={method} className="flex justify-between"><span>{method}</span><span>{formatCurrency(amount as number)}</span></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
