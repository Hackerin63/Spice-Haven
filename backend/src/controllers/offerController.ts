import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';

export const listOffers = asyncHandler(async (req: Request, res: Response) => {
  const activeOnly = req.query.all !== 'true';
  const now = new Date();
  const offers = await prisma.offer.findMany({
    where: activeOnly
      ? {
          isActive: true,
          OR: [{ startDate: null }, { startDate: { lte: now } }],
          AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
        }
      : {},
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: offers });
});

export const createOffer = asyncHandler(async (req: Request, res: Response) => {
  const offer = await prisma.offer.create({ data: req.body });
  res.status(201).json({ success: true, data: offer });
});

export const updateOffer = asyncHandler(async (req: Request, res: Response) => {
  const offer = await prisma.offer.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: offer });
});

export const deleteOffer = asyncHandler(async (req: Request, res: Response) => {
  await prisma.offer.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Offer deleted' });
});
