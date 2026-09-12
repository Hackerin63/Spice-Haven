import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRestaurant } from '@/api/services';
import {
  adminUpdateRestaurant,
  adminListUsers,
  adminCreateUser,
  adminToggleUserActive,
  changeOwnPassword,
  adminResetUserPassword,
  adminDeleteUser,
} from '@/api/adminServices';
import { useAuthStore } from '@/contexts/authStore';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { data: restaurant } = useQuery({ queryKey: ['restaurant'], queryFn: getRestaurant });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: adminListUsers });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (restaurant) setForm(restaurant); }, [restaurant]);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'MANAGER' | 'CASHIER'>('CASHIER');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminUpdateRestaurant({
        name: form.name,
        description: form.description,
        phone: form.phone,
        whatsappNumber: form.whatsappNumber,
        email: form.email,
        addressLine: form.addressLine,
        city: form.city,
        taxPercent: Number(form.taxPercent),
        deliveryCharge: Number(form.deliveryCharge),
          freeDeliveryAbove: form.freeDeliveryAbove === '' || form.freeDeliveryAbove === null ? null : Number(form.freeDeliveryAbove),
        minimumOrder: Number(form.minimumOrder),
        gstNumber: form.gstNumber,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        heroTitle: form.heroTitle,
        heroDescription: form.heroDescription,
        announcementText: form.announcementText,
      });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminCreateUser({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole });
      setNewUserName(''); setNewUserEmail(''); setNewUserPassword('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function toggleUser(id: string) {
    try {
      await adminToggleUserActive(id);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function updateOwnPassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await changeOwnPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Your password was changed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function resetPasswordForUser(e: React.FormEvent, id: string) {
    e.preventDefault();
    try {
      await adminResetUserPassword(id, resetPassword);
      setResetUserId(null);
      setResetPassword('');
      toast.success('User password changed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await adminDeleteUser(id);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Restaurant Settings</h1>
        <form onSubmit={saveSettings} className="card mt-4 grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Restaurant name" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.whatsappNumber ?? ''} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="WhatsApp number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.addressLine ?? ''} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} placeholder="Address" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.gstNumber ?? ''} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} placeholder="GST Number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.taxPercent ?? ''} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} placeholder="Tax %" type="number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.deliveryCharge ?? ''} onChange={(e) => setForm({ ...form, deliveryCharge: e.target.value })} placeholder="Delivery Charge" type="number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.freeDeliveryAbove ?? ''} onChange={(e) => setForm({ ...form, freeDeliveryAbove: e.target.value })} placeholder="Free delivery above" type="number" min="0" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.minimumOrder ?? ''} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} placeholder="Minimum Order" type="number" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={form.announcementText ?? ''} onChange={(e) => setForm({ ...form, announcementText: e.target.value })} placeholder="Announcement bar text" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" />
          <textarea value={form.heroDescription ?? ''} onChange={(e) => setForm({ ...form, heroDescription: e.target.value })} placeholder="Hero description" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" rows={2} />
          <input value={form.seoTitle ?? ''} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="SEO Title" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" />
          <textarea value={form.seoDescription ?? ''} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} placeholder="SEO Description" className="rounded-lg border border-charcoal/15 p-2 text-sm sm:col-span-2" rows={2} />
          <button type="submit" className="btn-primary sm:col-span-2">Save Settings</button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold">My Password</h2>
        <form onSubmit={updateOwnPassword} className="card mt-4 grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" type="password" minLength={6} required className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" minLength={8} required className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <button type="submit" className="btn-primary text-sm">Change My Password</button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold">Users & Roles</h2>
        <form onSubmit={createUser} className="card mt-4 grid grid-cols-2 gap-3 p-5 sm:grid-cols-5">
          <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Name" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email" type="email" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Password" type="password" className="rounded-lg border border-charcoal/15 p-2 text-sm" />
          <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as any)} className="rounded-lg border border-charcoal/15 p-2 text-sm">
            <option value="MANAGER">Manager</option>
            <option value="CASHIER">Cashier</option>
          </select>
          <button type="submit" className="btn-primary text-sm">Add User</button>
        </form>

        <div className="card mt-4 divide-y divide-charcoal/5 p-2">
          {users?.map((u: any) => (
            <div key={u.id} className="flex flex-col gap-3 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{u.name} · {u.email} · <span className="text-charcoal/50">{u.role}</span></span>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => toggleUser(u.id)} className={`rounded-full px-2 py-0.5 text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </button>
                {u.id !== currentUser?.id && (
                  <>
                    <button onClick={() => { setResetUserId(resetUserId === u.id ? null : u.id); setResetPassword(''); }} className="rounded-lg border border-charcoal/15 px-2 py-1 text-xs hover:bg-charcoal/5">
                      Change Password
                    </button>
                    <button onClick={() => deleteUser(u.id, u.name)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </>
                )}
              </div>
              {resetUserId === u.id && (
                <form onSubmit={(e) => resetPasswordForUser(e, u.id)} className="flex w-full gap-2 sm:ml-auto sm:w-auto">
                  <input value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="New password" type="password" minLength={8} required className="min-w-0 flex-1 rounded-lg border border-charcoal/15 p-2 text-xs sm:w-40" />
                  <button type="submit" className="btn-primary text-xs">Save</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
