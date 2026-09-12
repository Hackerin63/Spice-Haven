import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminGetOrder, adminUpdateOrderStatus, getOrderWhatsAppLink } from '@/api/adminServices';
import { formatCurrency } from '@/utils/format';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED'];

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery({ queryKey: ['admin-order', id], queryFn: () => adminGetOrder(id!), enabled: Boolean(id) });

  async function updateStatus(status: string) {
    try {
      await adminUpdateOrderStatus(id!, status);
      toast.success(`Order marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function openWhatsApp() {
    try {
      const { link } = await getOrderWhatsAppLink(id!);
      window.open(link, '_blank');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (isLoading || !order) return <div className="p-8"><div className="skeleton h-64" /></div>;

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = order.status === 'CANCELLED' || order.status === 'COMPLETED' ? null : STATUS_FLOW[currentIdx + 1];

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
        <span className="rounded-full bg-charcoal/5 px-3 py-1 text-sm">{order.status}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {nextStatus && (
          <button onClick={() => updateStatus(nextStatus)} className="btn-primary !px-4 !py-2 text-sm">Mark as {nextStatus}</button>
        )}
        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
          <button onClick={() => updateStatus('CANCELLED')} className="btn-secondary !px-4 !py-2 text-sm text-red-600">Cancel Order</button>
        )}
        <button onClick={openWhatsApp} className="btn-secondary !px-4 !py-2 text-sm">Send WhatsApp Update</button>
        <a href={`/api/orders/${order.id}/invoice.pdf`} target="_blank" rel="noreferrer" className="btn-secondary !px-4 !py-2 text-sm">
          Download Invoice (PDF)
        </a>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="font-semibold">Items</h2>
        <div className="mt-3 space-y-2 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.nameSnapshot} x{item.quantity}</span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-charcoal/10 pt-3 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(order.productDiscount + order.couponDiscount)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>
          <div className="flex justify-between"><span>Delivery Fee</span><span>{formatCurrency(order.deliveryFee)}</span></div>
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(order.grandTotal)}</span></div>
        </div>
      </div>

      {order.statusHistory && (
        <div className="card mt-6 p-5">
          <h2 className="font-semibold">Status History</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.statusHistory.map((h, i) => (
              <li key={i} className="flex justify-between text-charcoal/60">
                <span>{h.status}{h.note ? ` — ${h.note}` : ''}</span>
                <span>{new Date(h.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
