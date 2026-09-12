import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRestaurant } from '@/api/services';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFloatButton from '@/components/WhatsAppFloatButton';

export default function CustomerLayout() {
  const { data: restaurant } = useQuery({ queryKey: ['restaurant'], queryFn: getRestaurant });

  return (
    <div className="flex min-h-screen flex-col">
      {restaurant?.announcementText && (
        <div className="bg-brand-600 text-white text-center text-sm py-2 px-4">
          {restaurant.announcementText}
        </div>
      )}
      <Header restaurantName={restaurant?.name ?? 'Spice Haven'} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer restaurant={restaurant ?? null} />
      <WhatsAppFloatButton />
    </div>
  );
}
