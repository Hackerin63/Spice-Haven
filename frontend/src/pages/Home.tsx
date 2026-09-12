import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRestaurant, getProducts, getCombos, getPublicReviews, getGallery } from '@/api/services';
import ProductCard from '@/components/ProductCard';
import { Star, MapPin, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton aspect-[4/3]" />
      ))}
    </div>
  );
}

export default function Home() {
  const { data: restaurant } = useQuery({ queryKey: ['restaurant'], queryFn: getRestaurant });
  const { data: featured, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', { featured: 'true' }],
    queryFn: () => getProducts({ featured: 'true', pageSize: 8 }),
  });
  const { data: bestsellers, isLoading: loadingBest } = useQuery({
    queryKey: ['products', { bestseller: 'true' }],
    queryFn: () => getProducts({ bestseller: 'true', pageSize: 4 }),
  });
  const { data: combos } = useQuery({ queryKey: ['combos'], queryFn: getCombos });
  const { data: reviews } = useQuery({ queryKey: ['reviews', 'featured'], queryFn: getPublicReviews });
  const { data: gallery } = useQuery({ queryKey: ['gallery'], queryFn: getGallery });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal">
        <img
          src={restaurant?.heroImageUrl ?? 'https://picsum.photos/seed/hero/1600/900'}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <h1 className="max-w-2xl text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            {restaurant?.heroTitle ?? 'Flavors That Feel Like Home'}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            {restaurant?.heroDescription ?? 'Freshly prepared food, delivered hot, every time.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/menu" className="btn-primary">Order Now</Link>
            <Link to="/menu" className="btn-secondary bg-white/10 text-white border-white/30 hover:bg-white/20">
              Explore Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Featured dishes */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Featured Dishes</h2>
          <Link to="/menu" className="text-sm font-semibold text-brand-600 hover:underline">View full menu →</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {loadingFeatured ? <SectionSkeleton /> : featured?.data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-charcoal/[0.03] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Customer Favorites</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {loadingBest ? <SectionSkeleton /> : bestsellers?.data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Combos */}
      {combos && combos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">Value Combos</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {combos.slice(0, 3).map((combo) => (
              <Link key={combo.id} to={`/combos`} className="card overflow-hidden flex flex-col sm:flex-row">
                <img src={combo.imageUrl ?? ''} alt={combo.name} className="h-40 w-full sm:w-40 object-cover" />
                <div className="p-4 flex-1">
                  <h3 className="font-semibold">{combo.name}</h3>
                  <p className="mt-1 text-sm text-charcoal/60 line-clamp-2">{combo.description}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-semibold text-brand-700">{formatCurrency(combo.comboPrice)}</span>
                    <span className="text-xs text-charcoal/40 line-through">{formatCurrency(combo.originalPrice)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why choose us */}
      <section className="bg-charcoal/[0.03] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
          <div>
            <Clock className="mx-auto h-8 w-8 text-brand-600" />
            <h3 className="mt-3 font-semibold">Fast Delivery</h3>
            <p className="mt-1 text-sm text-charcoal/60">Hot food, delivered fast to your doorstep.</p>
          </div>
          <div>
            <Star className="mx-auto h-8 w-8 text-brand-600" />
            <h3 className="mt-3 font-semibold">Quality Ingredients</h3>
            <p className="mt-1 text-sm text-charcoal/60">Fresh, quality ingredients in every dish.</p>
          </div>
          <div>
            <MapPin className="mx-auto h-8 w-8 text-brand-600" />
            <h3 className="mt-3 font-semibold">Visit Us</h3>
            <p className="mt-1 text-sm text-charcoal/60">{restaurant?.addressLine}, {restaurant?.city}</p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">What Our Customers Say</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {reviews.slice(0, 3).map((r: any) => (
              <div key={r.id} className="card p-5">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-charcoal/20'}`} />
                  ))}
                </div>
                <p className="mt-3 text-sm text-charcoal/70">{r.comment}</p>
                <p className="mt-3 text-sm font-semibold">{r.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery preview */}
      {gallery && gallery.length > 0 && (
        <section className="bg-charcoal/[0.03] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold sm:text-3xl">Gallery</h2>
              <Link to="/gallery" className="text-sm font-semibold text-brand-600 hover:underline">View all →</Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {gallery.slice(0, 4).map((g: any) => (
                <img key={g.id} src={g.imageUrl} alt={g.caption ?? ''} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
