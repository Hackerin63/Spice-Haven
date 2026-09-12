import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRestaurant, submitReview } from '@/api/services';
import { Phone, Mail, MapPin, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contact() {
  const { data: restaurant } = useQuery({ queryKey: ['restaurant'], queryFn: getRestaurant });
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your name');
    setSubmitting(true);
    try {
      await submitReview({ name, rating, comment });
      toast.success('Thanks for your review! It will appear after approval.');
      setName('');
      setComment('');
      setRating(5);
    } catch {
      toast.error('Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Contact Us</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {restaurant?.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-brand-600" /> <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
            </div>
          )}
          {restaurant?.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-brand-600" /> <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
            </div>
          )}
          {restaurant?.addressLine && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-brand-600" /> {restaurant.addressLine}, {restaurant.city}
            </div>
          )}
          {restaurant?.mapLat && restaurant?.mapLng && (
            <iframe
              title="Location"
              className="mt-4 h-64 w-full rounded-xl border-0"
              src={`https://www.google.com/maps?q=${restaurant.mapLat},${restaurant.mapLng}&z=15&output=embed`}
              loading="lazy"
            />
          )}
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <h2 className="font-semibold">Leave a Review</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-charcoal/15 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} type="button" onClick={() => setRating(i + 1)}>
                <Star className={`h-6 w-6 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-charcoal/20'}`} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            rows={4}
            className="w-full rounded-xl border border-charcoal/15 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
