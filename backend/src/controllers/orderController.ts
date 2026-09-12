import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { priceCart } from '../services/pricingService';
import { createOrder, updateOrderStatus } from '../services/orderService';
import { buildWhatsAppLink, buildWhatsAppOrderMessage } from '../services/notificationService';
import { generateInvoicePdf } from '../services/invoiceService';

// Public: price a cart without creating an order (used by the cart page live totals)
export const quoteCart = asyncHandler(async (req: Request, res: Response) => {
  const { items, orderType, couponCode, customerId } = req.body;
  const priced = await priceCart(items, { orderType, couponCode, customerId });
  res.json({ success: true, data: priced });
});

export const placeOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await createOrder({ ...req.body, source: 'WEB' });
  res.status(201).json({ success: true, data: order });
});

// POS order creation - attributes the order to the logged-in cashier
export const placePosOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await createOrder({ ...req.body, source: 'POS', handledById: req.user!.userId });
  res.status(201).json({ success: true, data: order });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { addons: true } },
      customer: true,
      address: true,
      payment: true,
      invoice: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      coupon: true,
    },
  });
  if (!order) throw AppError.notFound('Order not found');
  res.json({ success: true, data: order });
});

export const trackOrderByNumber = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: {
      items: { include: { addons: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
      payment: true,
    },
  });
  if (!order) throw AppError.notFound('Order not found');
  res.json({ success: true, data: order });
});

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, orderType, source, from, to, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const where: any = {};
  if (status) where.status = status;
  if (orderType) where.orderType = orderType;
  if (source) where.source = source;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: { customer: true, items: true, payment: true },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: { total, page: Number(page), pageSize: take } });
});

export const changeOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const order = await updateOrderStatus(req.params.id, status, note);
  res.json({ success: true, data: order });
});

// Returns a ready-to-open WhatsApp link + structured message for a given order
export const getOrderWhatsAppLink = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, customer: true, address: true },
  });
  if (!order) throw AppError.notFound('Order not found');
  const restaurant = await prisma.restaurant.findFirst();

  const message = buildWhatsAppOrderMessage({
    restaurantName: restaurant?.name ?? 'Restaurant',
    customerName: order.customer.name,
    orderNumber: order.orderNumber,
    items: order.items.map((i: (typeof order.items)[number]) => ({ name: i.nameSnapshot, quantity: i.quantity })),
    subtotal: Number(order.subtotal),
    discount: Number(order.productDiscount) + Number(order.couponDiscount),
    total: Number(order.grandTotal),
    orderType: order.orderType,
    address: order.address ? `${order.address.line1}, ${order.address.city}` : undefined,
    specialInstructions: order.specialInstructions ?? undefined,
  });

  const link = buildWhatsAppLink(restaurant?.whatsappNumber ?? '', message);
  res.json({ success: true, data: { link, message } });
});

// Streams a professional A4 PDF invoice for the given order
export const downloadInvoice = asyncHandler(async (req: Request, res: Response) => {
  const pdfBuffer = await generateInvoicePdf(req.params.id);
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { orderNumber: true } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order?.orderNumber ?? req.params.id}.pdf"`);
  res.send(pdfBuffer);
});

// Public: customer downloads their own invoice by order number (no auth needed,
// mirroring the public order-tracking endpoint's access model)
export const downloadInvoiceByOrderNumber = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { orderNumber: req.params.orderNumber } });
  if (!order) throw AppError.notFound('Order not found');
  const pdfBuffer = await generateInvoicePdf(order.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
  res.send(pdfBuffer);
});
