import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { search, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }] }
    : {};

  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  // Total spend per customer (only counting completed orders for accuracy)
  const withSpend = await Promise.all(
    customers.map(async (c: (typeof customers)[number]) => {
      const spend = await prisma.order.aggregate({
        where: { customerId: c.id, status: 'COMPLETED' },
        _sum: { grandTotal: true },
      });
      return { ...c, totalSpend: spend._sum.grandTotal ?? 0 };
    })
  );

  res.json({ success: true, data: withSpend, meta: { total, page: Number(page), pageSize: take } });
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      addresses: true,
      orders: { orderBy: { createdAt: 'desc' }, include: { items: true, payment: true } },
    },
  });
  if (!customer) throw AppError.notFound('Customer not found');
  res.json({ success: true, data: customer });
});
