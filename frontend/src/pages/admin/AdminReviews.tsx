import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminListAllReviews, adminApproveReview, adminRejectReview } from '@/api/adminServices';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/api/client';

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useQuery({ queryKey: ['admin-reviews'], queryFn: adminListAllReviews });

  async function approve(id: string) {
    try {
      await adminApproveReview(id);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review approved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function reject(id: string) {
    if (!confirm('Remove this review?')) return;
    try {
      await adminRejectReview(id);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Reviews</h1>

      <div className="mt-6 space-y-3">
        {isLoading && <div className="skeleton h-24" />}
        {reviews?.map((r: any) => (
          <div key={r.id} className="card flex items-center justify-between p-4">
            <div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-charcoal/20'}`} />
                ))}
              </div>
              <p className="mt-1 text-sm font-semibold">{r.name}</p>
              <p className="text-sm text-charcoal/60">{r.comment}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${r.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {r.isApproved ? 'Approved' : 'Pending'}
              </span>
            </div>
            <div className="flex gap-2">
              {!r.isApproved && <button onClick={() => approve(r.id)} className="btn-primary !px-3 !py-1.5 text-xs">Approve</button>}
              <button onClick={() => reject(r.id)} className="btn-secondary !px-3 !py-1.5 text-xs text-red-600">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
