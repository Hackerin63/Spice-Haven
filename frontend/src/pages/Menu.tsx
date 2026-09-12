import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories } from '@/api/services';
import ProductCard from '@/components/ProductCard';
import clsx from 'clsx';
import { Search } from 'lucide-react';

export default function Menu() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [veg, setVeg] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [sort, setSort] = useState<'price_asc' | 'price_desc' | 'rating' | undefined>(undefined);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', { search, category, veg, sort }],
    queryFn: () =>
      getProducts({
        search: search || undefined,
        category,
        veg: veg === 'all' ? undefined : veg === 'veg' ? 'true' : 'false',
        sort,
        pageSize: 60,
      }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Our Menu</h1>

      {/* Search + filters */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className="w-full rounded-full border border-charcoal/15 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory(undefined)}
            className={clsx('rounded-full px-4 py-1.5 text-sm font-medium', !category ? 'bg-brand-600 text-white' : 'bg-charcoal/5 hover:bg-charcoal/10')}
          >
            All
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.slug)}
              className={clsx('rounded-full px-4 py-1.5 text-sm font-medium', category === c.slug ? 'bg-brand-600 text-white' : 'bg-charcoal/5 hover:bg-charcoal/10')}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-full border border-charcoal/15 p-1 text-sm">
            {(['all', 'veg', 'nonveg'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVeg(v)}
                className={clsx('rounded-full px-3 py-1', veg === v ? 'bg-charcoal text-white' : 'text-charcoal/70')}
              >
                {v === 'all' ? 'All' : v === 'veg' ? 'Veg' : 'Non-Veg'}
              </button>
            ))}
          </div>

          <select
            value={sort ?? ''}
            onChange={(e) => setSort((e.target.value || undefined) as any)}
            className="rounded-full border border-charcoal/15 px-3 py-1.5 text-sm"
          >
            <option value="">Sort: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3]" />)}
        {!isLoading && products?.data.length === 0 && (
          <p className="col-span-full py-16 text-center text-charcoal/50">No dishes match your filters.</p>
        )}
        {products?.data.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
