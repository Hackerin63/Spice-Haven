import { useQuery } from '@tanstack/react-query';
import { getRestaurant } from '@/api/services';

export default function About() {
  const { data: restaurant } = useQuery({ queryKey: ['restaurant'], queryFn: getRestaurant });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">About {restaurant?.name ?? 'Us'}</h1>
      <p className="mt-6 whitespace-pre-line leading-relaxed text-charcoal/70">
        {restaurant?.aboutContent ?? 'We are a family-run restaurant dedicated to serving fresh, delicious food.'}
      </p>
    </div>
  );
}
