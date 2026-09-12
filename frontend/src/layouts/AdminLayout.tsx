import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import clsx from 'clsx';
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Layers, Tag, Ticket, Image as ImageIcon,
  Star, Users, Boxes, BarChart3, Settings, LogOut, ShoppingCart,
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'] },
  { to: '/admin/pos', label: 'POS', icon: ShoppingCart, roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'] },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'] },
  { to: '/admin/products', label: 'Products', icon: UtensilsCrossed, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/categories', label: 'Categories', icon: Layers, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/combos', label: 'Combos', icon: Layers, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/offers', label: 'Offers', icon: Tag, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/customers', label: 'Customers', icon: Users, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/gallery', label: 'Gallery', icon: ImageIcon, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN'] },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  const visibleItems = navItems.filter((i) => !user || i.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-charcoal/[0.02]">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-charcoal/10 bg-white lg:flex">
        <div className="p-6">
          <h1 className="font-display text-lg font-bold text-brand-700">Spice Haven Admin</h1>
          {user && <p className="mt-1 text-xs text-charcoal/50">{user.name} · {user.role}</p>}
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-charcoal/70 hover:bg-charcoal/5'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>

      <div className="flex-1 overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
