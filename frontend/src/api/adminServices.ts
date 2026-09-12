import { api } from './client';
import { Order, Product, Category, Combo } from '@/types';

// ---------------- Dashboard / Reports ----------------
export const getDashboardSummary = () => api.get('/reports/dashboard').then((r) => r.data.data);
export const getSalesReport = (from?: string, to?: string) =>
  api.get('/reports/sales', { params: { from, to } }).then((r) => r.data.data);
export const exportOrdersCsvUrl = (from?: string, to?: string) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return `/api/reports/export/orders.csv?${params.toString()}`;
};

// ---------------- Orders (admin/POS) ----------------
export const adminListOrders = (params: Record<string, string> = {}) =>
  api.get<{ success: true; data: Order[]; meta: any }>('/orders', { params }).then((r) => r.data);

export const adminGetOrder = (id: string) => api.get<{ success: true; data: Order }>(`/orders/${id}`).then((r) => r.data.data);

export const adminUpdateOrderStatus = (id: string, status: string, note?: string) =>
  api.patch(`/orders/${id}/status`, { status, note }).then((r) => r.data.data);

export const placePosOrder = (payload: any) => api.post<{ success: true; data: Order }>('/orders/pos', payload).then((r) => r.data.data);

export const getOrderWhatsAppLink = (id: string) =>
  api.get<{ success: true; data: { link: string; message: string } }>(`/orders/${id}/whatsapp-link`).then((r) => r.data.data);

// ---------------- Products (admin) ----------------
export const adminListProducts = (params: Record<string, string> = {}) =>
  api.get<{ success: true; data: Product[]; meta: any }>('/products', { params: { ...params, all: 'true' } }).then((r) => r.data);

export const adminCreateProduct = (payload: any) => api.post('/products', payload).then((r) => r.data.data);
export const adminUpdateProduct = (id: string, payload: any) => api.put(`/products/${id}`, payload).then((r) => r.data.data);
export const adminDeleteProduct = (id: string) => api.delete(`/products/${id}`).then((r) => r.data);
export const adminToggleProductAvailability = (id: string) => api.patch(`/products/${id}/toggle-availability`).then((r) => r.data.data);

// ---------------- Categories (admin) ----------------
export const adminListCategories = () => api.get<{ success: true; data: Category[] }>('/categories', { params: { all: 'true' } }).then((r) => r.data.data);
export const adminCreateCategory = (payload: any) => api.post('/categories', payload).then((r) => r.data.data);
export const adminUpdateCategory = (id: string, payload: any) => api.put(`/categories/${id}`, payload).then((r) => r.data.data);
export const adminDeleteCategory = (id: string) => api.delete(`/categories/${id}`).then((r) => r.data);

// ---------------- Combos (admin) ----------------
export const adminListCombos = () => api.get<{ success: true; data: Combo[] }>('/combos', { params: { all: 'true' } }).then((r) => r.data.data);
export const adminCreateCombo = (payload: any) => api.post('/combos', payload).then((r) => r.data.data);
export const adminUpdateCombo = (id: string, payload: any) => api.put(`/combos/${id}`, payload).then((r) => r.data.data);
export const adminDeleteCombo = (id: string) => api.delete(`/combos/${id}`).then((r) => r.data);

// ---------------- Coupons ----------------
export const adminListCoupons = () => api.get('/coupons').then((r) => r.data.data);
export const adminCreateCoupon = (payload: any) => api.post('/coupons', payload).then((r) => r.data.data);
export const adminUpdateCoupon = (id: string, payload: any) => api.put(`/coupons/${id}`, payload).then((r) => r.data.data);
export const adminDeleteCoupon = (id: string) => api.delete(`/coupons/${id}`).then((r) => r.data);

// ---------------- Offers ----------------
export const adminListOffers = () => api.get('/offers', { params: { all: 'true' } }).then((r) => r.data.data);
export const adminCreateOffer = (payload: any) => api.post('/offers', payload).then((r) => r.data.data);
export const adminUpdateOffer = (id: string, payload: any) => api.put(`/offers/${id}`, payload).then((r) => r.data.data);
export const adminDeleteOffer = (id: string) => api.delete(`/offers/${id}`).then((r) => r.data);

// ---------------- Inventory ----------------
export const adminListInventory = (lowStockOnly = false) =>
  api.get('/inventory', { params: lowStockOnly ? { lowStock: 'true' } : {} }).then((r) => r.data.data);
export const adminAdjustStock = (productId: string, quantity: number, type: string, note?: string) =>
  api.post(`/inventory/${productId}/adjust`, { quantity, type, note }).then((r) => r.data.data);

// ---------------- Customers ----------------
export const adminListCustomers = (params: Record<string, string> = {}) => api.get('/customers', { params }).then((r) => r.data);
export const adminGetCustomer = (id: string) => api.get(`/customers/${id}`).then((r) => r.data.data);

// ---------------- Gallery / Reviews (admin) ----------------
export const adminCreateGalleryImage = (payload: any) => api.post('/gallery', payload).then((r) => r.data.data);
export const adminDeleteGalleryImage = (id: string) => api.delete(`/gallery/${id}`).then((r) => r.data);
export const adminListAllReviews = () => api.get('/reviews/admin/all').then((r) => r.data.data);
export const adminApproveReview = (id: string) => api.patch(`/reviews/${id}/approve`).then((r) => r.data.data);
export const adminRejectReview = (id: string) => api.delete(`/reviews/${id}`).then((r) => r.data);

// ---------------- Restaurant settings (admin) ----------------
export const adminUpdateRestaurant = (payload: any) => api.put('/restaurant', payload).then((r) => r.data.data);

// ---------------- Uploads ----------------
export const getUploadStatus = () => api.get<{ success: true; data: { configured: boolean } }>('/uploads/status').then((r) => r.data.data);

export const uploadImage = (file: File, folder: 'products' | 'gallery' | 'branding' | 'banners' = 'general' as any) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post<{ success: true; data: { url: string; publicId: string } }>(`/uploads?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data.data);
};
export const adminListUsers = () => api.get('/auth/users').then((r) => r.data.data);
export const adminCreateUser = (payload: any) => api.post('/auth/users', payload).then((r) => r.data.data);
export const adminToggleUserActive = (id: string) => api.patch(`/auth/users/${id}/toggle-active`).then((r) => r.data.data);
export const changeOwnPassword = (payload: { currentPassword: string; newPassword: string }) =>
  api.post('/auth/change-password', payload).then((r) => r.data);
export const adminResetUserPassword = (id: string, newPassword: string) =>
  api.patch(`/auth/users/${id}/password`, { newPassword }).then((r) => r.data);
export const adminDeleteUser = (id: string) => api.delete(`/auth/users/${id}`).then((r) => r.data);
