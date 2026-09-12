import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/contexts/cartStore';
import { quoteCart } from '@/api/services';
import { formatCurrency } from '@/utils/format';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { PriceBreakdown } from '@/types';
import { getErrorMessage } from '@/api/client';
import clsx from 'clsx';

export default function Cart() {
  const navigate = useNavigate();
  const { items, incrementItem, decrementItem, removeItem, couponCode, setCouponCode, orderType, setOrderType } = useCartStore();
  const [couponInput, setCouponInput] = useState(couponCode ?? '');
  const [quote, setQuote] = useState<PriceBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    setLoading(true);
    setError(null);
    quoteCart({
      items: items.map((i) => ({
        productId: i.productId,
        comboId: i.comboId,
        quantity: i.quantity,
        addonIds: i.addonIds,
        specialInstructions: i.specialInstructions,
      })),
      orderType,
      couponCode: couponCode || undefined,
    })
      .then(setQuote)
      .catch((e) => {
        setError(getErrorMessage(e));
        setQuote(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items), orderType, couponCode]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-charcoal/60">Looks like you haven't added anything yet.</p>
        <Link to="/menu" className="btn-primary mt-6 inline-flex">Browse Menu</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Your Cart</h1>

      {/* Order type selector */}
      <div className="mt-6 flex gap-2 rounded-full border border-charcoal/15 p-1 w-fit">
        {(['DELIVERY', 'PICKUP', 'DINE_IN'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={clsx('rounded-full px-4 py-1.5 text-sm font-medium', orderType === t ? 'bg-charcoal text-white' : 'text-charcoal/70')}
          >
            {t === 'DELIVERY' ? 'Delivery' : t === 'PICKUP' ? 'Pickup' : 'Dine-in'}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.key} className="card flex items-center gap-4 p-4">
            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />}
            <div className="flex-1">
              <p className="font-semibold">{item.name}</p>
              {item.addonNames && item.addonNames.length > 0 && (
                <p className="text-xs text-charcoal/50">+ {item.addonNames.join(', ')}</p>
              )}
              {item.specialInstructions && <p className="text-xs text-charcoal/50 italic">"{item.specialInstructions}"</p>}
              <p className="mt-1 text-sm text-charcoal/70">{formatCurrency(item.unitPrice)} each</p>
            </div>
            <div className="flex items-center rounded-full border border-charcoal/15">
              <button onClick={() => decrementItem(item.key)} className="flex h-8 w-8 items-center justify-center" aria-label="Decrease">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
              <button onClick={() => incrementItem(item.key)} className="flex h-8 w-8 items-center justify-center" aria-label="Increase">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => removeItem(item.key)} className="text-charcoal/40 hover:text-red-600" aria-label="Remove">
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div className="mt-6 flex gap-2">
        <input
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          className="flex-1 rounded-full border border-charcoal/15 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button onClick={() => setCouponCode(couponInput || undefined)} className="btn-secondary !px-5 !py-2 text-sm">
          Apply
        </button>
        {couponCode && (
          <button onClick={() => { setCouponCode(undefined); setCouponInput(''); }} className="text-sm text-charcoal/50 underline">
            Remove
          </button>
        )}
      </div>

      {/* Totals */}
      <div className="card mt-6 p-5">
        {loading && <p className="text-sm text-charcoal/50">Calculating totals...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {quote && !loading && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(quote.subtotal)}</span></div>
            {quote.productDiscount > 0 && (
              <div className="flex justify-between text-green-700"><span>Item Discount</span><span>-{formatCurrency(quote.productDiscount)}</span></div>
            )}
            {quote.couponDiscount > 0 && (
              <div className="flex justify-between text-green-700"><span>Coupon Discount</span><span>-{formatCurrency(quote.couponDiscount)}</span></div>
            )}
            <div className="flex justify-between"><span>Tax ({quote.taxPercent}%)</span><span>{formatCurrency(quote.taxAmount)}</span></div>
            {orderType === 'DELIVERY' && (
              <div className="flex justify-between"><span>Delivery Fee</span><span>{quote.deliveryFee === 0 ? 'FREE' : formatCurrency(quote.deliveryFee)}</span></div>
            )}
            <div className="flex justify-between border-t border-charcoal/10 pt-2 text-base font-bold"><span>Total</span><span>{formatCurrency(quote.grandTotal)}</span></div>
          </div>
        )}
        <button
          onClick={() => navigate('/checkout')}
          disabled={!quote || loading || Boolean(error)}
          className="btn-primary mt-5 w-full"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
