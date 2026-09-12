import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trackOrder } from '@/api/services';
import { formatCurrency } from '@/utils/format';
import { CheckCircle2, Circle, Download } from 'lucide-react';

const STEPS: Array<{ status: string; label: string }> = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PREPARING', label: 'Preparing' },
  { status: 'READY', label: 'Ready' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { status: 'COMPLETED', label: 'Completed' },
];

export default function OrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => trackOrder(orderNumber!),
    enabled: Boolean(orderNumber),
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="mx-auto max-w-2xl px-4 py-16"><div className="skeleton h-64" /></div>;
  if (!order) return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-charcoal/60">Order not found.</div>;

  const isDelivery = order.orderType === 'DELIVERY';
  const relevantSteps = isDelivery ? STEPS : STEPS.filter((s) => s.status !== 'OUT_FOR_DELIVERY');
  const currentIndex = relevantSteps.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h1 className="mt-4 text-2xl font-bold">Thank you for your order!</h1>
        <p className="mt-1 text-charcoal/60">Order #{order.orderNumber}</p>
      </div>

      {isCancelled ? (
        <div className="mt-8 rounded-xl bg-red-50 p-4 text-center text-red-700">This order has been cancelled.</div>
      ) : (
        <div className="mt-10 flex justify-between">
          {relevantSteps.map((step, idx) => (
            <div key={step.status} className="flex flex-1 flex-col items-center text-center">
              {idx <= currentIndex ? (
                <CheckCircle2 className="h-6 w-6 text-brand-600" />
              ) : (
                <Circle className="h-6 w-6 text-charcoal/20" />
              )}
              <span className={`mt-1 text-xs ${idx <= currentIndex ? 'font-semibold text-charcoal' : 'text-charcoal/40'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card mt-10 p-6">
        <h2 className="font-semibold">Order Summary</h2>
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
          <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(order.grandTotal)}</span></div>
        </div>
        <a
          href={`/api/orders/track/${order.orderNumber}/invoice.pdf`}
          className="btn-secondary mt-4 w-full !py-2 text-sm"
          target="_blank"
          rel="noreferrer"
        >
          <Download className="h-4 w-4" /> Download Invoice (PDF)
        </a>
      </div>
    </div>
  );
}
