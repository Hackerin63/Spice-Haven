import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';

export const listCoupons = asyncHandler(async (req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: coupons });
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.coupon.findUnique({ where: { code: req.body.code } });
  if (existing) throw AppError.conflict('A coupon with this code already exists', 'CODE_EXISTS');
  const coupon = await prisma.coupon.create({ data: req.body });
  res.status(201).json({ success: true, data: coupon });
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Coupon not found');
  const coupon = await prisma.coupon.update({ where: { id }, data: req.body });
  res.json({ success: true, data: coupon });
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Coupon deleted' });
});

// Public: validate a coupon code against a subtotal without creating an order
export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, subtotal } = req.query as Record<string, string>;
  const coupon = await prisma.coupon.findUnique({ where: { code: (code ?? '').toUpperCase() } });
  if (!coupon || !coupon.isActive) throw AppError.badRequest('Invalid or inactive coupon code', 'INVALID_COUPON');

  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) throw AppError.badRequest('Coupon is not yet active', 'COUPON_NOT_STARTED');
  if (coupon.endDate && now > coupon.endDate) throw AppError.badRequest('Coupon has expired', 'COUPON_EXPIRED');
  if (coupon.usageLimit !== null && coupon.timesUsed >= (coupon.usageLimit ?? 0)) {
    throw AppError.badRequest('Coupon usage limit reached', 'COUPON_LIMIT_REACHED');
  }
  const sub = Number(subtotal ?? 0);
  if (coupon.minOrderAmount && sub < Number(coupon.minOrderAmount)) {
    throw AppError.badRequest(`Minimum order of ${coupon.minOrderAmount} required`, 'COUPON_MIN_ORDER_NOT_MET');
  }

  res.json({ success: true, data: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, maxDiscountAmount: coupon.maxDiscountAmount } });
});
