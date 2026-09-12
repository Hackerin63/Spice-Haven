import { Routes, Route } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

import Home from '@/pages/Home';
import Menu from '@/pages/Menu';
import ProductDetail from '@/pages/ProductDetail';
import Combos from '@/pages/Combos';
import Specials from '@/pages/Specials';
import Offers from '@/pages/Offers';
import Gallery from '@/pages/Gallery';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderTracking from '@/pages/OrderTracking';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';

import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Pos from '@/pages/admin/Pos';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminOrderDetail from '@/pages/admin/AdminOrderDetail';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminCombos from '@/pages/admin/AdminCombos';
import AdminOffers from '@/pages/admin/AdminOffers';
import AdminCoupons from '@/pages/admin/AdminCoupons';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminCustomers from '@/pages/admin/AdminCustomers';
import AdminGallery from '@/pages/admin/AdminGallery';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminReports from '@/pages/admin/AdminReports';
import AdminSettings from '@/pages/admin/AdminSettings';

export default function App() {
  return (
    <Routes>
      {/* Customer-facing site */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/category/:slug" element={<Menu />} />
        <Route path="/food/:slug" element={<ProductDetail />} />
        <Route path="/combos" element={<Combos />} />
        <Route path="/specials" element={<Specials />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:orderNumber" element={<OrderTracking />} />
        <Route path="/orders" element={<OrderTracking />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>

      {/* Admin auth */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin area - protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/pos" element={<Pos />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER']} />}>
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/combos" element={<AdminCombos />} />
            <Route path="/admin/offers" element={<AdminOffers />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/gallery" element={<AdminGallery />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Page not found</h1></div>} />
    </Routes>
  );
}
