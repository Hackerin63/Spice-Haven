import { useQuery } from '@tanstack/react-query';
import { getOffers } from '@/api/services';
import { Tag } from 'lucide-react';

export default function Offers() {
  const { data: offers, isLoading } = useQuery({ queryKey: ['offers'], queryFn: getOffers });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Current Offers</h1>
      <p className="mt-2 text-charcoal/60">Applied automatically at checkout when eligible, or use a coupon code.</p>

      <div className="mt-8 space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20" />)}
        {!isLoading && offers?.length === 0 && <p className="text-charcoal/50">No active offers right now.</p>}
        {offers?.map((o: any) => (
          <div key={o.id} className="card flex items-start gap-4 p-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{o.title}</h3>
              {o.description && <p className="mt-1 text-sm text-charcoal/60">{o.description}</p>}
              <p className="mt-1 text-xs text-charcoal/50">
                {o.discountType === 'PERCENTAGE' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
                {o.minOrderAmount ? ` on orders above ₹${o.minOrderAmount}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
