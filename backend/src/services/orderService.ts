import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { priceCart, CartLineInput } from './pricingService';
import { generateOrderNumber, generateInvoiceNumber } from '../utils/numberGenerator';
import { OrderType, PaymentMethod, OrderStatus, StockStatus, InventoryTxnType } from '@prisma/client';
import { sendOrderNotifications } from './notificationService';

export interface CreateOrderInput {
  items: CartLineInput[];
  orderType: OrderType;
  couponCode?: string;
  specialInstructions?: string;
  paymentMethod: PaymentMethod;
  customer: { name: string; phone: string; email?: string };
  address?: { line1: string; landmark?: string; city: string; pincode: string };
  tableNumber?: string;
  source?: 'WEB' | 'POS' | 'WHATSAPP';
  handledById?: string;
}

/**
 * Creates an order end-to-end:
 *  1. Upsert customer by phone
 *  2. Re-price the entire cart server-side (never trusts client totals)
 *  3. Validate coupon + stock again inside the transaction (race-condition safe)
 *  4. Persist order + items + addons + payment + invoice
 *  5. Deduct inventory transactionally
 *  6. Record coupon usage
 *  7. Fire notifications (WhatsApp/email) - best effort, non-blocking for the response
 */
export async function createOrder(input: CreateOrderInput) {
  // Step 1: price the cart authoritatively (outside the transaction is fine for reads,
  // but we re-validate critical invariants again inside the transaction below).
  const priced = await priceCart(input.items, {
    orderType: input.orderType,
    couponCode: input.couponCode,
    customerId: undefined, // resolved after upsert; per-customer coupon re-checked inside txn
  });

  const order = await prisma.$transaction(async (tx: any) => {
    // Upsert customer
    const customer = await tx.customer.upsert({
      where: { phone: input.customer.phone },
      update: { name: input.customer.name, email: input.customer.email },
      create: { name: input.customer.name, phone: input.customer.phone, email: input.customer.email },
    });

    // Re-check per-customer coupon limit now that we know the customer
    if (priced.couponId) {
      const coupon = await tx.coupon.findUnique({ where: { id: priced.couponId } });
      if (!coupon || !coupon.isActive) throw AppError.badRequest('Coupon is no longer valid', 'INVALID_COUPON');
      if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
        throw AppError.badRequest('Coupon usage limit reached', 'COUPON_LIMIT_REACHED');
      }
      if (coupon.perCustomerLimit) {
        const used = await tx.couponUsage.count({ where: { couponId: coupon.id, customerId: customer.id } });
        if (used >= coupon.perCustomerLimit) {
          throw AppError.badRequest('You have already used this coupon', 'COUPON_PER_CUSTOMER_LIMIT');
        }
      }
    }

    // Address (delivery only)
    let addressId: string | undefined;
    if (input.orderType === 'DELIVERY' && input.address) {
      const address = await tx.address.create({
        data: {
          customerId: customer.id,
          line1: input.address.line1,
          landmark: input.address.landmark,
          city: input.address.city,
          pincode: input.address.pincode,
        },
      });
      addressId = address.id;
    }

    // Re-validate stock inside the transaction (race safe) and deduct
    for (const line of priced.lines) {
      if (!line.productId) continue;
      const inventory = await tx.inventory.findUnique({ where: { productId: line.productId } });
      if (inventory) {
        if (inventory.currentStock < line.quantity) {
          throw AppError.badRequest(`Insufficient stock for ${line.name}`, 'INSUFFICIENT_STOCK');
        }
        const newStock = inventory.currentStock - line.quantity;
        const status: StockStatus =
          newStock <= 0 ? StockStatus.OUT_OF_STOCK : newStock <= inventory.minStock ? StockStatus.LOW_STOCK : StockStatus.IN_STOCK;

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { currentStock: newStock, status },
        });
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: InventoryTxnType.SALE_DEDUCTION,
            quantity: -line.quantity,
            note: `Order deduction: ${line.name} x${line.quantity}`,
          },
        });
      }
    }

    const orderNumber = generateOrderNumber();

    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        orderType: input.orderType,
        status: OrderStatus.PENDING,
        addressId,
        tableNumber: input.tableNumber,
        subtotal: priced.subtotal,
        productDiscount: priced.productDiscount,
        couponId: priced.couponId,
        couponDiscount: priced.couponDiscount,
        taxPercent: priced.taxPercent,
        taxAmount: priced.taxAmount,
        deliveryFee: priced.deliveryFee,
        grandTotal: priced.grandTotal,
        specialInstructions: input.specialInstructions,
        source: input.source ?? 'WEB',
        handledById: input.handledById,
        items: {
          create: priced.lines.map((line) => ({
            productId: line.productId,
            comboId: line.comboId,
            nameSnapshot: line.name,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            specialInstructions: line.specialInstructions,
            lineTotal: line.lineTotal,
            addons: line.addons.length
              ? {
                  create: line.addons.map((a) => ({
                    addonId: a.addonId,
                    nameSnapshot: a.name,
                    priceSnapshot: a.price,
                  })),
                }
              : undefined,
          })),
        },
        statusHistory: {
          create: { status: OrderStatus.PENDING, note: 'Order placed' },
        },
      },
      include: { items: { include: { addons: true } }, customer: true, address: true },
    });

    await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        method: input.paymentMethod,
        status: input.paymentMethod === 'COD' || input.paymentMethod === 'PAY_AT_RESTAURANT' || input.paymentMethod === 'CASH'
          ? 'PENDING'
          : 'PENDING',
        amount: priced.grandTotal,
      },
    });

    await tx.invoice.create({
      data: {
        orderId: createdOrder.id,
        invoiceNumber: generateInvoiceNumber(),
        cashierId: input.handledById,
      },
    });

    if (priced.couponId) {
      await tx.couponUsage.create({
        data: { couponId: priced.couponId, customerId: customer.id, orderId: createdOrder.id },
      });
      await tx.coupon.update({ where: { id: priced.couponId }, data: { timesUsed: { increment: 1 } } });
    }

    return createdOrder;
  });

  // Best-effort notification, does not block/rollback order creation
  sendOrderNotifications(order.id).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[notification] failed to send order notification', err);
  });

  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');

  const terminalStates: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];
  if (terminalStates.includes(order.status)) {
    throw AppError.badRequest(`Cannot change status of an order that is already ${order.status}`, 'ORDER_ALREADY_FINAL');
  }

  const updated = await prisma.$transaction(async (tx: any) => {
    const u = await tx.order.update({ where: { id: orderId }, data: { status } });
    await tx.orderStatusHistory.create({ data: { orderId, status, note } });

    // If cancelled, restock inventory
    if (status === OrderStatus.CANCELLED) {
      const items = await tx.orderItem.findMany({ where: { orderId }, include: { product: true } });
      for (const item of items) {
        if (!item.productId) continue;
        const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
        if (inv) {
          const newStock = inv.currentStock + item.quantity;
          await tx.inventory.update({
            where: { id: inv.id },
            data: {
              currentStock: newStock,
              status: newStock <= 0 ? StockStatus.OUT_OF_STOCK : newStock <= inv.minStock ? StockStatus.LOW_STOCK : StockStatus.IN_STOCK,
            },
          });
          await tx.inventoryTransaction.create({
            data: { inventoryId: inv.id, type: InventoryTxnType.ADJUSTMENT, quantity: item.quantity, note: `Restock from cancelled order ${orderId}` },
          });
        }
      }
    }
    return u;
  });

  return updated;
}
