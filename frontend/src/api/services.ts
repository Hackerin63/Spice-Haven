import { api } from './client';
import { Restaurant, Category, Product, Combo, PriceBreakdown, Order, AdminUser } from '@/types';

// ---------------- Restaurant ----------------
export const getRestaurant = () => api.get<{ success: true; data: Restaurant }>('/restaurant').then((r) => r.data.data);

// ---------------- Categories ----------------
export const getCategories = () => api.get<{ success: true; data: Category[] }>('/categories').then((r) => r.data.data);

// ---------------- Products ----------------
export interface ProductFilters {
  search?: string;
  category?: string;
  veg?: 'true' | 'false';
  bestseller?: 'true';
  featured?: 'true';
  special?: 'true';
  sort?: 'price_asc' | 'price_desc' | 'rating';
  page?: number;
  pageSize?: number;
}

export const getProducts = (filters: ProductFilters = {}) =>
  api.get<{ success: true; data: Product[]; meta: { total: number } }>('/products', { params: filters }).then((r) => r.data);

export const getProductBySlug = (slug: string) =>
  api.get<{ success: true; data: Product }>(`/products/${slug}`).then((r) => r.data.data);

// ---------------- Combos ----------------
export const getCombos = () => api.get<{ success: true; data: Combo[] }>('/combos').then((r) => r.data.data);

// ---------------- Offers ----------------
export const getOffers = () => api.get<{ success: true; data: any[] }>('/offers').then((r) => r.data.data);

// ---------------- Gallery / Reviews ----------------
export const getGallery = () => api.get<{ success: true; data: any[] }>('/gallery').then((r) => r.data.data);
export const getPublicReviews = () => api.get<{ success: true; data: any[] }>('/reviews').then((r) => r.data.data);
export const submitReview = (payload: { name: string; rating: number; comment?: string; productId?: string }) =>
  api.post('/reviews', payload).then((r) => r.data);

// ---------------- Cart pricing / Orders ----------------
export interface CartLinePayload {
  productId?: string;
  comboId?: string;
  quantity: number;
  addonIds?: string[];
  specialInstructions?: string;
}

export const quoteCart = (payload: {
  items: CartLinePayload[];
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  couponCode?: string;
}) => api.post<{ success: true; data: PriceBreakdown }>('/orders/quote', payload).then((r) => r.data.data);

export interface PlaceOrderPayload {
  items: CartLinePayload[];
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  couponCode?: string;
  specialInstructions?: string;
  paymentMethod: 'COD' | 'PAY_AT_RESTAURANT' | 'UPI' | 'CARD' | 'CASH' | 'ONLINE' | 'OTHER';
  customer: { name: string; phone: string; email?: string };
  address?: { line1: string; landmark?: string; city: string; pincode: string };
  tableNumber?: string;
}

export const placeOrder = (payload: PlaceOrderPayload) =>
  api.post<{ success: true; data: Order }>('/orders', payload).then((r) => r.data.data);

export const trackOrder = (orderNumber: string) =>
  api.get<{ success: true; data: Order }>(`/orders/track/${orderNumber}`).then((r) => r.data.data);

// ---------------- Auth ----------------
export const login = (email: string, password: string) =>
  api.post<{ success: true; data: { token: string; user: AdminUser } }>('/auth/login', { email, password }).then((r) => r.data.data);

export const getMe = () => api.get<{ success: true; data: AdminUser }>('/auth/me').then((r) => r.data.data);
