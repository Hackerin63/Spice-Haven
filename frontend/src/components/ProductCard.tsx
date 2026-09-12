import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { formatCurrency } from '@/utils/format';
import { useCartStore } from '@/contexts/cartStore';
import toast from 'react-hot-toast';
import { Plus, Star } from 'lucide-react';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const effectivePrice = Number(product.discountPrice ?? product.price);
  const outOfStock = product.inventory?.status === 'OUT_OF_STOCK';

  function handleAdd() {
    if (outOfStock) return;
    addItem({
      key: product.id,
      productId: product.id,
      name: product.name,
      unitPrice: effectivePrice,
      quantity: 1,
      imageUrl: product.images[0]?.url,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <div className="card group overflow-hidden flex flex-col">
      <Link to={`/food/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-charcoal/5">
        {product.images[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].altText ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-charcoal/30">No image</div>
        )}
        <span
          className={`absolute top-2 left-2 h-4 w-4 rounded-sm border-2 flex items-center justify-center ${
            product.isVeg ? 'border-green-600' : 'border-red-600'
          } bg-white`}
        >
          <span className={`h-2 w-2 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
        </span>
        {product.discountPrice && (
          <span className="absolute top-2 right-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
            {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-semibold">
            Out of Stock
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/food/${product.slug}`} className="font-semibold text-charcoal hover:text-brand-700">
          {product.name}
        </Link>
        {product.description && <p className="mt-1 text-sm text-charcoal/60 line-clamp-2">{product.description}</p>}
        {product.ratingCount > 0 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-charcoal/60">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {product.ratingAvg.toFixed(1)} ({product.ratingCount})
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-charcoal">{formatCurrency(effectivePrice)}</span>
            {product.discountPrice && (
              <span className="text-xs text-charcoal/40 line-through">{formatCurrency(product.price)}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
