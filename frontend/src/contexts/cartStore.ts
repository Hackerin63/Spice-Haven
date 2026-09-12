import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  key: string; // productId or comboId + addon signature, for uniqueness in the cart UI
  productId?: string;
  comboId?: string;
  name: string;
  unitPrice: number; // display price only - server re-derives the authoritative price
  quantity: number;
  imageUrl?: string;
  addonIds?: string[];
  addonNames?: string[];
  specialInstructions?: string;
}

interface CartState {
  items: CartItem[];
  couponCode?: string;
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  incrementItem: (key: string) => void;
  decrementItem: (key: string) => void;
  updateInstructions: (key: string, text: string) => void;
  setCouponCode: (code?: string) => void;
  setOrderType: (type: 'DELIVERY' | 'PICKUP' | 'DINE_IN') => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: undefined,
      orderType: 'DELIVERY',
      addItem: (item) => {
        const existing = get().items.find((i) => i.key === item.key);
        if (existing) {
          set({
            items: get().items.map((i) => (i.key === item.key ? { ...i, quantity: i.quantity + item.quantity } : i)),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      incrementItem: (key) =>
        set({ items: get().items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i)) }),
      decrementItem: (key) =>
        set({
          items: get()
            .items.map((i) => (i.key === key ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0),
        }),
      updateInstructions: (key, text) =>
        set({ items: get().items.map((i) => (i.key === key ? { ...i, specialInstructions: text } : i)) }),
      setCouponCode: (code) => set({ couponCode: code }),
      setOrderType: (type) => set({ orderType: type }),
      clearCart: () => set({ items: [], couponCode: undefined }),
    }),
    { name: 'spice-haven-cart' }
  )
);

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
