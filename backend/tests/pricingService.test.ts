import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Prisma singleton before importing the service that uses it
vi.mock('../src/config/prisma', () => {
  return {
    default: {
      restaurant: { findFirst: vi.fn() },
      product: { findUnique: vi.fn() },
      addon: { findMany: vi.fn() },
      combo: { findUnique: vi.fn() },
      coupon: { findUnique: vi.fn() },
      couponUsage: { count: vi.fn() },
    },
  };
});

// The real @prisma/client enum values only exist once `prisma generate` has
// run against our schema (see README section 9). Mocking the enum's runtime
// shape here lets pricing-logic tests run correctly even before that step,
// and remains harmless afterwards since the values are identical.
vi.mock('@prisma/client', async () => {
  const actual = await vi.importActual<typeof import('@prisma/client')>('@prisma/client');
  return {
    ...actual,
    DiscountType: { PERCENTAGE: 'PERCENTAGE', FIXED: 'FIXED' },
  };
});

import prisma from '../src/config/prisma';
import { priceCart } from '../src/services/pricingService';

const mockRestaurant = {
  taxPercent: 5,
  deliveryCharge: 40,
  freeDeliveryAbove: 500,
  minimumOrder: 0,
};

const mockProduct = {
  id: 'prod-1',
  name: 'Chicken Biryani',
  price: 260,
  discountPrice: 240,
  isAvailable: true,
  inventory: { currentStock: 10, minStock: 5 },
};

describe('pricingService.priceCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.restaurant.findFirst as any).mockResolvedValue(mockRestaurant);
    (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
    (prisma.addon.findMany as any).mockResolvedValue([]);
  });

  it('computes subtotal using the discounted price, not the list price', async () => {
    const result = await priceCart(
      [{ productId: 'prod-1', quantity: 2 }],
      { orderType: 'PICKUP' }
    );
    // 240 (discount price) * 2 = 480
    expect(result.subtotal).toBe(480);
    // product discount = (260 - 240) * 2 = 40
    expect(result.productDiscount).toBe(40);
  });

  it('applies delivery fee for DELIVERY orders below the free-delivery threshold', async () => {
    const result = await priceCart(
      [{ productId: 'prod-1', quantity: 1 }],
      { orderType: 'DELIVERY' }
    );
    expect(result.deliveryFee).toBe(40);
  });

  it('waives delivery fee once subtotal crosses the free-delivery threshold', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({
      ...mockProduct,
      inventory: { currentStock: 10, minStock: 5 },
    });
    const result = await priceCart(
      [{ productId: 'prod-1', quantity: 3 }], // 240*3 = 720 > 500 threshold
      { orderType: 'DELIVERY' }
    );
    expect(result.deliveryFee).toBe(0);
  });

  it('rejects an order that exceeds available stock', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({
      ...mockProduct,
      inventory: { currentStock: 1, minStock: 5 },
    });
    await expect(
      priceCart([{ productId: 'prod-1', quantity: 5 }], { orderType: 'PICKUP' })
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
  });

  it('rejects an unavailable product', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({ ...mockProduct, isAvailable: false });
    await expect(
      priceCart([{ productId: 'prod-1', quantity: 1 }], { orderType: 'PICKUP' })
    ).rejects.toMatchObject({ code: 'PRODUCT_UNAVAILABLE' });
  });

  it('applies a percentage coupon capped by maxDiscountAmount', async () => {
    (prisma.coupon.findUnique as any).mockResolvedValue({
      id: 'coupon-1',
      code: 'SPICE20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: 100,
      maxDiscountAmount: 50,
      startDate: null,
      endDate: null,
      usageLimit: null,
      timesUsed: 0,
      perCustomerLimit: null,
      isActive: true,
    });
    // subtotal = 240 * 2 = 480; 20% = 96, but capped at 50
    const result = await priceCart(
      [{ productId: 'prod-1', quantity: 2 }],
      { orderType: 'PICKUP', couponCode: 'SPICE20' }
    );
    expect(result.couponDiscount).toBe(50);
  });

  it('rejects an expired coupon', async () => {
    (prisma.coupon.findUnique as any).mockResolvedValue({
      id: 'coupon-1',
      code: 'OLD10',
      discountType: 'FIXED',
      discountValue: 10,
      minOrderAmount: null,
      maxDiscountAmount: null,
      startDate: null,
      endDate: new Date('2020-01-01'),
      usageLimit: null,
      timesUsed: 0,
      perCustomerLimit: null,
      isActive: true,
    });
    await expect(
      priceCart([{ productId: 'prod-1', quantity: 1 }], { orderType: 'PICKUP', couponCode: 'OLD10' })
    ).rejects.toMatchObject({ code: 'COUPON_EXPIRED' });
  });

  it('computes tax on the post-discount taxable amount and rounds the grand total to 2 decimals', async () => {
    const result = await priceCart(
      [{ productId: 'prod-1', quantity: 1 }],
      { orderType: 'PICKUP' }
    );
    // subtotal = 240, tax 5% = 12, grand total = 240 + 12 = 252 (no delivery on pickup)
    expect(result.taxAmount).toBe(12);
    expect(result.grandTotal).toBe(252);
  });

  it('throws EMPTY_CART for an empty line list', async () => {
    await expect(priceCart([], { orderType: 'PICKUP' })).rejects.toMatchObject({ code: 'EMPTY_CART' });
  });
});
