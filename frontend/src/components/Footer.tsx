import { Link } from 'react-router-dom';
import { Restaurant } from '@/types';

export default function Footer({ restaurant }: { restaurant: Restaurant | null }) {
  return (
    <footer className="bg-charcoal text-white/80 mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-xl font-bold text-white">{restaurant?.name ?? 'Spice Haven'}</h3>
          <p className="mt-3 text-sm leading-relaxed">{restaurant?.description}</p>
        </div>
        <div>
          <h4 className="font-semibold text-white">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/menu" className="hover:text-white">Menu</Link></li>
            <li><Link to="/combos" className="hover:text-white">Combos</Link></li>
            <li><Link to="/offers" className="hover:text-white">Offers</Link></li>
            <li><Link to="/gallery" className="hover:text-white">Gallery</Link></li>
            <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {restaurant?.phone && <li>{restaurant.phone}</li>}
            {restaurant?.email && <li>{restaurant.email}</li>}
            {restaurant?.addressLine && <li>{restaurant.addressLine}, {restaurant.city}</li>}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white">Opening Hours</h4>
          <ul className="mt-3 space-y-1 text-sm">
            {restaurant?.openingHours &&
              Object.entries(restaurant.openingHours).map(([day, hours]) => (
                <li key={day} className="flex justify-between gap-4">
                  <span className="capitalize">{day}</span>
                  <span>{hours}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {restaurant?.name ?? 'Spice Haven'}. All rights reserved.
      </div>
    </footer>
  );
}
