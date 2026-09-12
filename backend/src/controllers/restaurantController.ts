import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/AppError';

export const getRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) throw AppError.notFound('Restaurant is not configured yet');
  res.json({ success: true, data: restaurant });
});

export const updateRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.restaurant.findFirst();
  const restaurant = existing
    ? await prisma.restaurant.update({ where: { id: existing.id }, data: req.body })
    : await prisma.restaurant.create({ data: req.body });
  res.json({ success: true, data: restaurant });
});
