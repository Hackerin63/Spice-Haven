import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getProductBySlug } from '@/api/services';
import { useCartStore } from '@/contexts/cartStore';
import { formatCurrency } from '@/utils/format';
import toast from 'react-hot-toast';
import { Minus, Plus, Star } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: Boolean(slug),
  });
  const addItem = useCartStore((s) => s.addItem);

  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-charcoal/60">Dish not found.</p>
        <Link to="/menu" className="btn-primary mt-4 inline-flex">Back to Menu</Link>
      </div>
    );
  }

  const effectivePrice = Number(product.discountPrice ?? product.price);
  const addonsTotal = (product.addons ?? [])
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((s, a) => s + Number(a.price), 0);
  const lineTotal = (effectivePrice + addonsTotal) * quantity;
  const outOfStock = product.inventory?.status === 'OUT_OF_STOCK';

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  function handleAdd() {
    if (!product) return;
    const addonNames = (product.addons ?? []).filter((a) => selectedAddons.includes(a.id)).map((a) => a.name);
    addItem({
      key: `${product.id}-${selectedAddons.sort().join(',')}-${instructions}`,
      productId: product.id,
      name: product.name,
      unitPrice: effectivePrice,
      quantity,
      imageUrl: product.images[0]?.url,
      addonIds: selectedAddons,
      addonNames,
      specialInstructions: instructions || undefined,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-charcoal/5">
          {product.images[0]?.url && (
            <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className={`h-4 w-4 rounded-sm border-2 flex items-center justify-center ${product.isVeg ? 'border-green-600' : 'border-red-600'}`}>
              <span className={`h-2 w-2 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
            </span>
            {product.isBestseller && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Bestseller</span>}
            {product.specialTag && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{product.specialTag.replaceAll('_', ' ')}</span>}
          </div>

          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          {product.ratingCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-charcoal/60">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {product.ratingAvg.toFixed(1)} ({product.ratingCount} reviews)
            </div>
          )}
          <p className="mt-3 text-charcoal/70">{product.description}</p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{formatCurrency(effectivePrice)}</span>
            {product.discountPrice && <span className="text-charcoal/40 line-through">{formatCurrency(product.price)}</span>}
          </div>

          {product.ingredients && (
            <p className="mt-2 text-sm text-charcoal/60"><span className="font-semibold">Ingredients: </span>{product.ingredients}</p>
          )}
          {product.allergens && (
            <p className="mt-1 text-sm text-charcoal/60"><span className="font-semibold">Allergens: </span>{product.allergens}</p>
          )}
          <p className="mt-1 text-sm text-charcoal/60">Prep time: ~{product.prepTimeMinutes} mins</p>

          {product.addons && product.addons.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold">Add-ons</h3>
              <div className="mt-2 space-y-2">
                {product.addons.map((a) => (
                  <label key={a.id} className="flex items-center justify-between rounded-xl border border-charcoal/10 px-4 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedAddons.includes(a.id)} onChange={() => toggleAddon(a.id)} />
                      {a.name}
                    </span>
                    <span className="text-charcoal/60">+{formatCurrency(a.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="text-sm font-semibold">Special instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. less spicy, no onions..."
              className="mt-1 w-full rounded-xl border border-charcoal/15 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              rows={2}
            />
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-charcoal/15">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center" aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="flex h-10 w-10 items-center justify-center" aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleAdd} disabled={outOfStock} className="btn-primary flex-1">
              {outOfStock ? 'Out of Stock' : `Add to Cart — ${formatCurrency(lineTotal)}`}
            </button>
          </div>
        </div>
      </div>

      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold">Reviews</h2>
          <div className="mt-4 space-y-4">
            {product.reviews.map((r: any) => (
              <div key={r.id} className="card p-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-charcoal/20'}`} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-charcoal/70">{r.comment}</p>
                <p className="mt-1 text-xs font-semibold text-charcoal/50">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
