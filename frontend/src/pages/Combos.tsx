import { useQuery } from '@tanstack/react-query';
import { getCombos } from '@/api/services';
import { formatCurrency } from '@/utils/format';
import { useCartStore } from '@/contexts/cartStore';
import toast from 'react-hot-toast';

export default function Combos() {
  const { data: combos, isLoading } = useQuery({ queryKey: ['combos'], queryFn: getCombos });
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Combo Meals</h1>
      <p className="mt-2 text-charcoal/60">Great pairings, better prices.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-64" />)}
        {combos?.map((combo) => (
          <div key={combo.id} className="card overflow-hidden flex flex-col">
            <img src={combo.imageUrl ?? ''} alt={combo.name} className="h-48 w-full object-cover" />
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-semibold">{combo.name}</h3>
              <p className="mt-1 text-sm text-charcoal/60">{combo.description}</p>
              <ul className="mt-3 space-y-1 text-sm text-charcoal/70">
                {combo.items.map((item) => (
                  <li key={item.id}>• {item.product.name} x{item.quantity}</li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-brand-700">{formatCurrency(combo.comboPrice)}</span>
                  <span className="text-sm text-charcoal/40 line-through">{formatCurrency(combo.originalPrice)}</span>
                </div>
                <button
                  className="btn-primary !px-4 !py-2 text-sm"
                  disabled={!combo.isAvailable}
                  onClick={() => {
                    addItem({ key: combo.id, comboId: combo.id, name: combo.name, unitPrice: combo.comboPrice, quantity: 1, imageUrl: combo.imageUrl ?? undefined });
                    toast.success(`${combo.name} added to cart`);
                  }}
                >
                  {combo.isAvailable ? 'Add to Cart' : 'Unavailable'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
