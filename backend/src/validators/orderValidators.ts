import { z } from 'zod';

export const cartLineSchema = z.object({
  productId: z.string().uuid().optional(),
  comboId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  addonIds: z.array(z.string().uuid()).optional(),
  specialInstructions: z.string().max(300).optional(),
}).refine(d => Boolean(d.productId) !== Boolean(d.comboId) ? true : Boolean(d.productId) || Boolean(d.comboId), {
  message: 'Provide exactly one of productId or comboId',
});

export const quoteCartSchema = z.object({
  items: z.array(cartLineSchema).min(1),
  orderType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
  couponCode: z.string().optional(),
  customerId: z.string().uuid().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(cartLineSchema).min(1),
  orderType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
  couponCode: z.string().optional(),
  specialInstructions: z.string().max(500).optional(),
  paymentMethod: z.enum(['COD', 'PAY_AT_RESTAURANT', 'UPI', 'CARD', 'CASH', 'ONLINE', 'OTHER']),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8).max(15),
    email: z.string().email().optional(),
  }),
  address: z.object({
    line1: z.string().min(3),
    landmark: z.string().optional(),
    city: z.string().min(1),
    pincode: z.string().min(3),
  }).optional(),
  tableNumber: z.string().optional(),
}).refine(d => d.orderType !== 'DELIVERY' || Boolean(d.address), {
  message: 'Delivery address is required for delivery orders',
  path: ['address'],
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED']),
  note: z.string().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3).transform(s => s.toUpperCase()),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const offerSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().positive().optional(),
  scopeProductId: z.string().uuid().optional(),
  scopeCategoryId: z.string().uuid().optional(),
  scopeComboId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createRazorpayOrderSchema = z.object({
  orderId: z.string().uuid(),
});

export const verifyRazorpayPaymentSchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
