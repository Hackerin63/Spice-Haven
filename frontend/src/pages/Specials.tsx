import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/services';
import ProductCard from '@/components/ProductCard';

export default function Specials() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', { special: 'true' }],
    queryFn: () => getProducts({ special: 'true', pageSize: 40 }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Chef & Today's Specials</h1>
      <p className="mt-2 text-charcoal/60">Hand-picked dishes our chefs are proud of.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading && Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3]" />)}
        {!isLoading && products?.data.length === 0 && (
          <p className="col-span-full py-16 text-center text-charcoal/50">No specials right now — check back soon!</p>
        )}
        {products?.data.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
