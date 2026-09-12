import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';

export const listPublicReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId, featured } = req.query as Record<string, string>;
  const reviews = await prisma.review.findMany({
    where: {
      isApproved: true,
      ...(productId ? { productId } : {}),
      ...(featured === 'true' ? { isFeatured: true } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ success: true, data: reviews });
});

export const submitReview = asyncHandler(async (req: Request, res: Response) => {
  const { name, rating, comment, productId, customerId } = req.body;
  if (rating < 1 || rating > 5) throw AppError.badRequest('Rating must be between 1 and 5');
  const review = await prisma.review.create({
    data: { name, rating, comment, productId, customerId, isApproved: false },
  });
  res.status(201).json({ success: true, data: review, message: 'Thanks! Your review will appear after approval.' });
});

export const listAllReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: reviews });
});

export const approveReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { isApproved: true } });

  // Recalculate product rating aggregate if tied to a product
  if (review.productId) {
    const agg = await prisma.review.aggregate({
      where: { productId: review.productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.product.update({
      where: { id: review.productId },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
    });
  }

  res.json({ success: true, data: review });
});

export const rejectReview = asyncHandler(async (req: Request, res: Response) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Review rejected/removed' });
});

export const toggleFeatureReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw AppError.notFound('Review not found');
  const updated = await prisma.review.update({ where: { id: review.id }, data: { isFeatured: !review.isFeatured } });
  res.json({ success: true, data: updated });
});
