import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaysOrders, pending, completed, cancelled, todaysSales, lowStock] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] } } }),
    prisma.order.count({ where: { status: 'COMPLETED', createdAt: { gte: today, lt: tomorrow } } }),
    prisma.order.count({ where: { status: 'CANCELLED', createdAt: { gte: today, lt: tomorrow } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
      _sum: { grandTotal: true },
      _avg: { grandTotal: true },
    }),
    prisma.inventory.count({ where: { status: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { customer: true, items: true },
  });

  res.json({
    success: true,
    data: {
      todaysOrders,
      pendingOrders: pending,
      completedToday: completed,
      cancelledToday: cancelled,
      todaysSales: todaysSales._sum.grandTotal ?? 0,
      averageOrderValue: todaysSales._avg.grandTotal ?? 0,
      lowStockCount: lowStock,
      recentOrders,
    },
  });
});

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const orders = await prisma.order.findMany({
    where: { createdAt: Object.keys(dateFilter).length ? dateFilter : undefined, status: { not: 'CANCELLED' } },
    include: { items: true, payment: true },
  });

  type OrderWithRelations = (typeof orders)[number];
  const grossSales = orders.reduce((s: number, o: OrderWithRelations) => s + Number(o.subtotal), 0);
  const totalDiscount = orders.reduce((s: number, o: OrderWithRelations) => s + Number(o.productDiscount) + Number(o.couponDiscount), 0);
  const totalTax = orders.reduce((s: number, o: OrderWithRelations) => s + Number(o.taxAmount), 0);
  const netSales = orders.reduce((s: number, o: OrderWithRelations) => s + Number(o.grandTotal), 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount ? netSales / orderCount : 0;

  const productTotals = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const key = item.productId ?? item.comboId ?? item.nameSnapshot;
      const existing = productTotals.get(key) ?? { name: item.nameSnapshot, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += Number(item.lineTotal);
      productTotals.set(key, existing);
    }
  }
  const bestSellers = Array.from(productTotals.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);

  const paymentBreakdown = new Map<string, number>();
  for (const o of orders) {
    if (o.payment) {
      paymentBreakdown.set(o.payment.method, (paymentBreakdown.get(o.payment.method) ?? 0) + Number(o.grandTotal));
    }
  }

  res.json({
    success: true,
    data: {
      grossSales,
      totalDiscount,
      totalTax,
      netSales,
      orderCount,
      avgOrderValue,
      bestSellers,
      paymentBreakdown: Object.fromEntries(paymentBreakdown),
    },
  });
});

// Simple CSV export of orders in range
export const exportOrdersCsv = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as Record<string, string>;
  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  const orders = await prisma.order.findMany({
    where: { createdAt: Object.keys(dateFilter).length ? dateFilter : undefined },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  const header = 'Order Number,Date,Customer,Phone,Type,Status,Subtotal,Discount,Tax,Delivery,Total\n';
  const rows = orders.map((o: (typeof orders)[number]) =>
    [
      o.orderNumber,
      o.createdAt.toISOString(),
      o.customer.name,
      o.customer.phone,
      o.orderType,
      o.status,
      o.subtotal,
      Number(o.productDiscount) + Number(o.couponDiscount),
      o.taxAmount,
      o.deliveryFee,
      o.grandTotal,
    ].join(',')
  );

  const csv = header + rows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="orders-report.csv"');
  res.send(csv);
});
