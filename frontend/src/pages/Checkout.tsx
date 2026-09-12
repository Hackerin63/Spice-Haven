import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/contexts/cartStore';
import { quoteCart, placeOrder, getRestaurant } from '@/api/services';
import { getRazorpayStatus, payWithRazorpay } from '@/api/razorpay';
import { formatCurrency } from '@/utils/format';
import { PriceBreakdown } from '@/types';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, orderType, couponCode, clearCart } = useCartStore();

  const [quote, setQuote] = useState<PriceBreakdown | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [line1, setLine1] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'PAY_AT_RESTAURANT' | 'UPI' | 'CARD'>('COD');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);

  useEffect(() => {
    getRazorpayStatus().then((s) => setRazorpayConfigured(s.configured)).catch(() => setRazorpayConfigured(false));
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    quoteCart({
      items: items.map((i) => ({ productId: i.productId, comboId: i.comboId, quantity: i.quantity, addonIds: i.addonIds, specialInstructions: i.specialInstructions })),
      orderType,
      couponCode,
    }).then(setQuote).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return toast.error('Please enter your name and phone number');
    if (orderType === 'DELIVERY' && (!line1.trim() || !city.trim() || !pincode.trim())) {
      return toast.error('Please complete your delivery address');
    }

    setSubmitting(true);
    try {
      const order = await placeOrder({
        items: items.map((i) => ({ productId: i.productId, comboId: i.comboId, quantity: i.quantity, addonIds: i.addonIds, specialInstructions: i.specialInstructions })),
        orderType,
        couponCode,
        specialInstructions: specialInstructions || undefined,
        paymentMethod,
        customer: { name, phone, email: email || undefined },
        address: orderType === 'DELIVERY' ? { line1, landmark: landmark || undefined, city, pincode } : undefined,
        tableNumber: orderType === 'DINE_IN' ? tableNumber || undefined : undefined,
      });

      if ((paymentMethod === 'UPI' || paymentMethod === 'CARD') && razorpayConfigured) {
        const restaurant = await getRestaurant().catch(() => null);
        try {
          await payWithRazorpay({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: name,
            customerPhone: phone,
            customerEmail: email || undefined,
            restaurantName: restaurant?.name ?? 'Restaurant',
          });
          toast.success('Payment successful! Order confirmed.');
        } catch (payErr) {
          toast.error('Payment was not completed. Your order is saved as pending — you can pay at delivery/pickup, or contact us.');
        }
      }

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/order/${order.orderNumber}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold">Your Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="rounded-xl border border-charcoal/15 p-3 text-sm" />
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="rounded-xl border border-charcoal/15 p-3 text-sm" />
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-xl border border-charcoal/15 p-3 text-sm" />
        </div>

        {orderType === 'DELIVERY' && (
          <div className="card space-y-4 p-6">
            <h2 className="font-semibold">Delivery Address</h2>
            <input required value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address line" className="w-full rounded-xl border border-charcoal/15 p-3 text-sm" />
            <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark (optional)" className="w-full rounded-xl border border-charcoal/15 p-3 text-sm" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-xl border border-charcoal/15 p-3 text-sm" />
              <input required value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" className="rounded-xl border border-charcoal/15 p-3 text-sm" />
            </div>
          </div>
        )}

        {orderType === 'DINE_IN' && (
          <div className="card space-y-4 p-6">
            <h2 className="font-semibold">Table Number</h2>
            <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Table number" className="w-full rounded-xl border border-charcoal/15 p-3 text-sm" />
          </div>
        )}

        <div className="card space-y-4 p-6">
          <h2 className="font-semibold">Special Instructions</h2>
          <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} rows={2} placeholder="Any notes for the kitchen or delivery?" className="w-full rounded-xl border border-charcoal/15 p-3 text-sm" />
        </div>

        <div className="card space-y-3 p-6">
          <h2 className="font-semibold">Payment Method</h2>
          {([
            ['COD', orderType === 'DELIVERY' ? 'Cash on Delivery' : 'Cash'],
            ['PAY_AT_RESTAURANT', 'Pay at Restaurant'],
            ['UPI', 'UPI'],
            ['CARD', 'Card'],
          ] as const).map(([value, label]) => {
            const isOnlineMethod = value === 'UPI' || value === 'CARD';
            const disabled = isOnlineMethod && !razorpayConfigured;
            return (
              <label key={value} className={`flex items-center justify-between gap-3 rounded-xl border border-charcoal/10 p-3 text-sm ${disabled ? 'opacity-50' : ''}`}>
                <span className="flex items-center gap-3">
                  <input type="radio" name="payment" checked={paymentMethod === value} disabled={disabled} onChange={() => setPaymentMethod(value)} />
                  {label}
                </span>
                {isOnlineMethod && (
                  <span className="text-xs text-charcoal/40">{razorpayConfigured ? 'Pay securely via Razorpay' : 'Not available yet'}</span>
                )}
              </label>
            );
          })}
          {!razorpayConfigured && (
            <p className="text-xs text-charcoal/50">
              Online UPI/Card payment isn't set up yet — the restaurant will collect payment via cash or UPI at delivery/pickup.
            </p>
          )}
        </div>

        {quote && (
          <div className="card p-6 text-sm space-y-2">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(quote.taxAmount)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{quote.deliveryFee ? formatCurrency(quote.deliveryFee) : 'FREE'}</span></div>
            <div className="flex justify-between border-t border-charcoal/10 pt-2 text-base font-bold"><span>Total</span><span>{formatCurrency(quote.grandTotal)}</span></div>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Placing order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
