import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { DiscountType } from '@prisma/client';

/**
 * CENTRAL FINANCIAL CALCULATION SERVICE
 * -------------------------------------
 * Every money calculation in the system (customer checkout, POS, invoice
 * regeneration, reports) MUST go through this service. Nothing here trusts
 * client-supplied prices, discounts, or totals — every number is re-derived
 * from the database on every call.
 *
 * Formula (spec section 51):
 *   Subtotal - productDiscounts - couponDiscount + tax + deliveryFee = grandTotal
 */

export interface CartLineInput {
  productId?: string;
  comboId?: string;
  quantity: number;
  addonIds?: string[];
  specialInstructions?: string;
}

export interface PricedAddon {
  addonId: string;
  name: string;
  price: number;
}

export interface PricedLine {
  productId?: string;
  comboId?: string;
  name: string;
  unitPrice: number; // effective price used (after item-level discount), addons excluded
  quantity: number;
  addons: PricedAddon[];
  lineTotal: number; // (unitPrice + sum(addon prices)) * quantity
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

function toNum(d: Decimal | number | null | undefined): number {
  if (d === null || d === undefined) return 0;
  return typeof d === 'number' ? d : Number(d);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function priceCart(
  lines: CartLineInput[],
  opts: { orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN'; couponCode?: string; customerId?: string }
): Promise<PriceBreakdown> {
  if (!lines.length) {
    throw AppError.badRequest('Cart is empty', 'EMPTY_CART');
  }

  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) throw AppError.internal('Restaurant configuration not found', 'RESTAURANT_NOT_CONFIGURED');

  const pricedLines: PricedLine[] = [];
  let subtotal = 0;
  let productDiscount = 0;

  for (const line of lines) {
    if (line.quantity < 1) throw AppError.badRequest('Quantity must be at least 1', 'INVALID_QUANTITY');

    if (line.productId) {
      const product = await prisma.product.findUnique({
        where: { id: line.productId },
        include: { inventory: true },
      });
      if (!product) throw AppError.notFound(`Product not found: ${line.productId}`, 'PRODUCT_NOT_FOUND');
      if (!product.isAvailable) {
        throw AppError.badRequest(`${product.name} is currently unavailable`, 'PRODUCT_UNAVAILABLE');
      }
      if (product.inventory && product.inventory.currentStock < line.quantity) {
        throw AppError.badRequest(`${product.name} is out of stock`, 'INSUFFICIENT_STOCK');
      }

      const basePrice = toNum(product.price);
      const effectivePrice = product.discountPrice ? toNum(product.discountPrice) : basePrice;
      productDiscount += (basePrice - effectivePrice) * line.quantity;

      const addons: PricedAddon[] = [];
      if (line.addonIds?.length) {
        const addonRecords = await prisma.addon.findMany({
          where: { id: { in: line.addonIds }, productId: product.id, isActive: true },
        });
        if (addonRecords.length !== line.addonIds.length) {
          throw AppError.badRequest('One or more add-ons are invalid', 'INVALID_ADDON');
        }
        for (const a of addonRecords) {
          addons.push({ addonId: a.id, name: a.name, price: toNum(a.price) });
        }
      }

      const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
      const lineTotal = round2((effectivePrice + addonsTotal) * line.quantity);
      subtotal += lineTotal;

      pricedLines.push({
        productId: product.id,
        name: product.name,
        unitPrice: effectivePrice,
        quantity: line.quantity,
        addons,
        lineTotal,
        specialInstructions: line.specialInstructions,
      });
    } else if (line.comboId) {
      const combo = await prisma.combo.findUnique({ where: { id: line.comboId } });
      if (!combo) throw AppError.notFound(`Combo not found: ${line.comboId}`, 'COMBO_NOT_FOUND');
      if (!combo.isAvailable) throw AppError.badRequest(`${combo.name} is currently unavailable`, 'COMBO_UNAVAILABLE');

      const now = new Date();
      if (combo.validFrom && now < combo.validFrom) throw AppError.badRequest(`${combo.name} is not yet available`, 'COMBO_NOT_STARTED');
      if (combo.validTo && now > combo.validTo) throw AppError.badRequest(`${combo.name} has expired`, 'COMBO_EXPIRED');

      const comboPrice = toNum(combo.comboPrice);
      const originalPrice = toNum(combo.originalPrice);
      productDiscount += (originalPrice - comboPrice) * line.quantity;

      const lineTotal = round2(comboPrice * line.quantity);
      subtotal += lineTotal;

      pricedLines.push({
        comboId: combo.id,
        name: combo.name,
        unitPrice: comboPrice,
        quantity: line.quantity,
        addons: [],
        lineTotal,
        specialInstructions: line.specialInstructions,
      });
    } else {
      throw AppError.badRequest('Each cart line requires productId or comboId', 'INVALID_LINE');
    }
  }

  subtotal = round2(subtotal);
  productDiscount = round2(productDiscount);

  // ---- Coupon validation & discount (server-authoritative) ----
  let couponDiscount = 0;
  let couponId: string | undefined;

  if (opts.couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: opts.couponCode.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      throw AppError.badRequest('Invalid or inactive coupon code', 'INVALID_COUPON');
    }
    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) throw AppError.badRequest('Coupon is not yet active', 'COUPON_NOT_STARTED');
    if (coupon.endDate && now > coupon.endDate) throw AppError.badRequest('Coupon has expired', 'COUPON_EXPIRED');
    if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
      throw AppError.badRequest('Coupon usage limit reached', 'COUPON_LIMIT_REACHED');
    }
    const minOrder = toNum(coupon.minOrderAmount);
    if (minOrder && subtotal < minOrder) {
      throw AppError.badRequest(`Minimum order of ${minOrder} required for this coupon`, 'COUPON_MIN_ORDER_NOT_MET');
    }
    if (opts.customerId && coupon.perCustomerLimit) {
      const usageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, customerId: opts.customerId },
      });
      if (usageCount >= coupon.perCustomerLimit) {
        throw AppError.badRequest('You have already used this coupon the maximum number of times', 'COUPON_PER_CUSTOMER_LIMIT');
      }
    }

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      couponDiscount = (subtotal * toNum(coupon.discountValue)) / 100;
    } else {
      couponDiscount = toNum(coupon.discountValue);
    }
    if (coupon.maxDiscountAmount) {
      couponDiscount = Math.min(couponDiscount, toNum(coupon.maxDiscountAmount));
    }
    couponDiscount = Math.min(round2(couponDiscount), subtotal);
    couponId = coupon.id;
  }

  const taxableAmount = Math.max(subtotal - couponDiscount, 0);
  const taxPercent = toNum(restaurant.taxPercent);
  const taxAmount = round2((taxableAmount * taxPercent) / 100);

  let deliveryFee = 0;
  if (opts.orderType === 'DELIVERY') {
    deliveryFee = toNum(restaurant.deliveryCharge);
    const freeAbove = restaurant.freeDeliveryAbove ? toNum(restaurant.freeDeliveryAbove) : null;
    if (freeAbove !== null && subtotal >= freeAbove) {
      deliveryFee = 0;
    }
  }

  const minimumOrder = toNum(restaurant.minimumOrder);
  if (minimumOrder && subtotal < minimumOrder) {
    throw AppError.badRequest(`Minimum order amount is ${minimumOrder}`, 'MINIMUM_ORDER_NOT_MET');
  }

  const grandTotal = round2(taxableAmount + taxAmount + deliveryFee);

  return {
    lines: pricedLines,
    subtotal,
    productDiscount,
    couponDiscount,
    couponId,
    taxPercent,
    taxAmount,
    deliveryFee,
    grandTotal,
  };
}
