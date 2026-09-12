import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminUser } from '@/types';

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  setAuth: (token: string, user: AdminUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        localStorage.setItem('admin_token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('admin_token');
        set({ token: null, user: null });
      },
    }),
    { name: 'spice-haven-admin-auth' }
  )
);
