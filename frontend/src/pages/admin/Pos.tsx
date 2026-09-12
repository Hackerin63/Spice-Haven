import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getProducts } from '@/api/services';
import { placePosOrder } from '@/api/adminServices';
import { formatCurrency } from '@/utils/format';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';
import { Search, Trash2, Printer } from 'lucide-react';
import { Order } from '@/types';

interface PosLine {
  key: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export default function Pos() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [cart, setCart] = useState<PosLine[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('0000000000');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'PICKUP'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: products } = useQuery({
    queryKey: ['pos-products', search, category],
    queryFn: () => getProducts({ search: search || undefined, category, pageSize: 60 }),
  });

  function addToCart(productId: string, name: string, price: number) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { key: productId, productId, name, unitPrice: price, quantity: 1 }];
    });
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l)).filter((l) => l.quantity > 0));
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  function holdOrder() {
    localStorage.setItem('pos_held_order', JSON.stringify(cart));
    setCart([]);
    toast.success('Order held');
  }

  function resumeOrder() {
    const held = localStorage.getItem('pos_held_order');
    if (held) {
      setCart(JSON.parse(held));
      localStorage.removeItem('pos_held_order');
      toast.success('Order resumed');
    } else {
      toast.error('No held order found');
    }
  }

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0), [cart]);

  async function completeSale() {
    if (cart.length === 0) return toast.error('Cart is empty');
    setSubmitting(true);
    try {
      const order = await placePosOrder({
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        orderType,
        paymentMethod,
        customer: { name: customerName, phone: customerPhone },
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
      });
      setLastOrder(order);
      setCart([]);
      toast.success('Sale completed!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'F2') { e.preventDefault(); document.getElementById('pos-search')?.focus(); }
      if (e.key === 'F4') { e.preventDefault(); completeSale(); }
      if (e.key === 'F6') { e.preventDefault(); holdOrder(); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, customerName, customerPhone, orderType, paymentMethod, tableNumber]);

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
            <input
              id="pos-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products (F2)"
              className="w-full rounded-full border border-charcoal/15 py-2.5 pl-9 pr-4 text-sm"
            />
          </div>
          <button onClick={resumeOrder} className="btn-secondary !px-4 !py-2 text-sm whitespace-nowrap">Resume (F6)</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setCategory(undefined)} className={`rounded-full px-3 py-1 text-xs ${!category ? 'bg-charcoal text-white' : 'bg-charcoal/5'}`}>All</button>
          {categories?.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.slug)} className={`rounded-full px-3 py-1 text-xs ${category === c.slug ? 'bg-charcoal text-white' : 'bg-charcoal/5'}`}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {products?.data.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p.id, p.name, p.discountPrice ?? p.price)}
              disabled={p.inventory?.status === 'OUT_OF_STOCK'}
              className="card p-3 text-left hover:ring-2 hover:ring-brand-500 disabled:opacity-40"
            >
              <p className="text-sm font-semibold line-clamp-1">{p.name}</p>
              <p className="mt-1 text-sm text-brand-700 font-bold">{formatCurrency(p.discountPrice ?? p.price)}</p>
              {p.inventory?.status === 'LOW_STOCK' && <p className="text-xs text-amber-600 mt-0.5">Low stock</p>}
              {p.inventory?.status === 'OUT_OF_STOCK' && <p className="text-xs text-red-600 mt-0.5">Out of stock</p>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col border-t border-charcoal/10 bg-white p-4 lg:w-96 lg:border-l lg:border-t-0 lg:p-6">
        <h2 className="font-semibold">Current Order</h2>

        <div className="mt-3 flex gap-2">
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="flex-1 rounded-lg border border-charcoal/15 p-2 text-sm" />
        </div>
        <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className="mt-2 rounded-lg border border-charcoal/15 p-2 text-sm" />

        <div className="mt-2 flex gap-2">
          <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)} className="flex-1 rounded-lg border border-charcoal/15 p-2 text-sm">
            <option value="DINE_IN">Dine-in</option>
            <option value="PICKUP">Pickup</option>
          </select>
          {orderType === 'DINE_IN' && (
            <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Table #" className="w-24 rounded-lg border border-charcoal/15 p-2 text-sm" />
          )}
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 && <p className="text-sm text-charcoal/40 py-8 text-center">No items yet — tap a product to add.</p>}
          {cart.map((line) => (
            <div key={line.key} className="flex items-center justify-between rounded-lg bg-charcoal/[0.03] p-2 text-sm">
              <div className="flex-1">
                <p className="font-medium">{line.name}</p>
                <p className="text-charcoal/50">{formatCurrency(line.unitPrice)} x {line.quantity}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => changeQty(line.key, -1)} className="h-6 w-6 rounded bg-white text-xs">−</button>
                <span className="w-5 text-center">{line.quantity}</span>
                <button onClick={() => changeQty(line.key, 1)} className="h-6 w-6 rounded bg-white text-xs">+</button>
                <button onClick={() => removeLine(line.key)} className="ml-1 text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-charcoal/10 pt-3 text-sm">
          <div className="flex justify-between font-bold text-base"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <p className="mt-1 text-xs text-charcoal/40">Final total (tax + any discounts) is calculated by the server at checkout.</p>
        </div>

        <div className="mt-3 flex gap-2">
          {(['CASH', 'UPI', 'CARD'] as const).map((m) => (
            <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 rounded-lg border py-2 text-xs font-semibold ${paymentMethod === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-charcoal/15'}`}>
              {m}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={holdOrder} className="btn-secondary flex-1 !py-2 text-sm">Hold (F6)</button>
          <button onClick={completeSale} disabled={submitting} className="btn-primary flex-1 !py-2 text-sm">
            {submitting ? 'Processing...' : 'Complete Sale (F4)'}
          </button>
        </div>
      </div>

      {lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:static print:bg-white">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 print:shadow-none">
            <div id="receipt" className="font-mono text-xs">
              <p className="text-center font-bold">SPICE HAVEN</p>
              <p className="text-center">Order #{lastOrder.orderNumber}</p>
              <p className="text-center">{new Date(lastOrder.createdAt).toLocaleString()}</p>
              <hr className="my-2" />
              {lastOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.nameSnapshot} x{item.quantity}</span>
                  <span>{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
              <hr className="my-2" />
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(lastOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(lastOrder.taxAmount)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(lastOrder.grandTotal)}</span></div>
              <p className="mt-2 text-center">Thank you for dining with us!</p>
            </div>
            <div className="mt-4 flex gap-2 print:hidden">
              <button onClick={() => window.print()} className="btn-primary flex-1 !py-2 text-sm"><Printer className="h-4 w-4" /> Print</button>
              <button onClick={() => setLastOrder(null)} className="btn-secondary flex-1 !py-2 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
