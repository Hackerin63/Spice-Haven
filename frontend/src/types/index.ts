export interface Restaurant {
  id: string;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  mapLat?: number | null;
  mapLng?: number | null;
  openingHours?: Record<string, string> | null;
  socialLinks?: Record<string, string> | null;
  currencySymbol: string;
  taxPercent: number;
  deliveryCharge: number;
  freeDeliveryAbove?: number | null;
  minimumOrder: number;
  announcementText?: string | null;
  heroTitle?: string | null;
  heroDescription?: string | null;
  heroImageUrl?: string | null;
  aboutContent?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  categoryId: string;
  category?: Category;
  price: number;
  discountPrice?: number | null;
  isVeg: boolean;
  spicyLevel: number;
  ingredients?: string | null;
  allergens?: string | null;
  prepTimeMinutes: number;
  isAvailable: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  specialTag?: string | null;
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
  images: ProductImage[];
  addons?: Addon[];
  inventory?: { currentStock: number; status: string } | null;
  reviews?: Array<{ id: string; name: string; rating: number; comment?: string | null; createdAt: string }>;
}

export interface ComboItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  originalPrice: number;
  comboPrice: number;
  isAvailable: boolean;
  isFeatured: boolean;
  items: ComboItem[];
}

export type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';

export interface PricedAddon {
  addonId: string;
  name: string;
  price: number;
}

export interface PricedLine {
  productId?: string;
  comboId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  addons: PricedAddon[];
  lineTotal: number;
  specialInstructions?: string;
}

export interface PriceBreakdown {
  lines: PricedLine[];
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  couponId?: string;
  taxPercent: number;
  taxAmount: number;
  deliveryFee: number;
  grandTotal: number;
}

export interface OrderItemView {
  id: string;
  nameSnapshot: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  specialInstructions?: string | null;
  addons: Array<{ nameSnapshot: string; priceSnapshot: number }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  taxPercent: number;
  taxAmount: number;
  deliveryFee: number;
  grandTotal: number;
  specialInstructions?: string | null;
  createdAt: string;
  items: OrderItemView[];
  statusHistory?: Array<{ status: OrderStatus; note?: string | null; createdAt: string }>;
  payment?: { method: string; status: string };
}

export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'CASHIER';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
