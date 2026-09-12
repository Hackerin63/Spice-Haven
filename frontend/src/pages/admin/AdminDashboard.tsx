import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '@/api/adminServices';
import { formatCurrency } from '@/utils/format';
import { Link } from 'react-router-dom';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-charcoal/50">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: getDashboardSummary, refetchInterval: 30000 });

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Today's Sales" value={formatCurrency(data?.todaysSales ?? 0)} />
          <StatCard label="Today's Orders" value={data?.todaysOrders ?? 0} />
          <StatCard label="Pending Orders" value={data?.pendingOrders ?? 0} />
          <StatCard label="Completed Today" value={data?.completedToday ?? 0} />
          <StatCard label="Cancelled Today" value={data?.cancelledToday ?? 0} />
          <StatCard label="Avg. Order Value" value={formatCurrency(data?.averageOrderValue ?? 0)} />
          <StatCard label="Low Stock Items" value={data?.lowStockCount ?? 0} />
        </div>
      )}

      <div className="mt-8 card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-brand-600 hover:underline">View all →</Link>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-charcoal/50">
              <th className="py-2">Order #</th>
              <th>Customer</th>
              <th>Status</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.recentOrders?.map((o: any) => (
              <tr key={o.id} className="border-t border-charcoal/5">
                <td className="py-2">
                  <Link to={`/admin/orders/${o.id}`} className="text-brand-600 hover:underline">{o.orderNumber}</Link>
                </td>
                <td>{o.customer?.name}</td>
                <td>
                  <span className="rounded-full bg-charcoal/5 px-2 py-0.5 text-xs">{o.status}</span>
                </td>
                <td className="text-right">{formatCurrency(o.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
