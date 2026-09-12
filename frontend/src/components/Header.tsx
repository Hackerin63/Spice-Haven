import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu as MenuIcon, X, ShoppingCart } from 'lucide-react';
import { useCartStore, cartItemCount } from '@/contexts/cartStore';
import clsx from 'clsx';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/combos', label: 'Combos' },
  { to: '/specials', label: 'Specials' },
  { to: '/offers', label: 'Offers' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Header({ restaurantName }: { restaurantName: string }) {
  const [open, setOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const count = cartItemCount(items);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-charcoal/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-xl font-bold text-brand-700">
          {restaurantName}
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx('text-sm font-medium transition hover:text-brand-600', isActive ? 'text-brand-600' : 'text-charcoal/80')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-charcoal/5" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link to="/menu" className="btn-primary hidden sm:inline-flex">
            Order Now
          </Link>
          <button
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-charcoal/5"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-charcoal/10 bg-white px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx('rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-brand-50 text-brand-700' : 'text-charcoal/80 hover:bg-charcoal/5')
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/menu" onClick={() => setOpen(false)} className="btn-primary mt-2 justify-center">
            Order Now
          </Link>
        </nav>
      )}
    </header>
  );
}
