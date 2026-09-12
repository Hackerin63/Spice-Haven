import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import { Role } from '@/types';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}
