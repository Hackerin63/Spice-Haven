import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';

export const listCombos = asyncHandler(async (req: Request, res: Response) => {
  const all = req.query.all === 'true';
  const combos = await prisma.combo.findMany({
    where: all ? {} : { isAvailable: true },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: combos });
});

export const getComboBySlug = asyncHandler(async (req: Request, res: Response) => {
  const combo = await prisma.combo.findUnique({
    where: { slug: req.params.slug },
    include: { items: { include: { product: true } } },
  });
  if (!combo) throw AppError.notFound('Combo not found');
  res.json({ success: true, data: combo });
});

export const createCombo = asyncHandler(async (req: Request, res: Response) => {
  const { items, ...data } = req.body;
  const existing = await prisma.combo.findUnique({ where: { slug: data.slug } });
  if (existing) throw AppError.conflict('A combo with this slug already exists', 'SLUG_EXISTS');

  const combo = await prisma.combo.create({
    data: { ...data, items: { create: items } },
    include: { items: { include: { product: true } } },
  });
  res.status(201).json({ success: true, data: combo });
});

export const updateCombo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items, ...data } = req.body;
  const existing = await prisma.combo.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Combo not found');

  const combo = await prisma.$transaction(async (tx: any) => {
    if (items) {
      await tx.comboItem.deleteMany({ where: { comboId: id } });
      await tx.comboItem.createMany({ data: items.map((i: any) => ({ ...i, comboId: id })) });
    }
    return tx.combo.update({ where: { id }, data, include: { items: { include: { product: true } } } });
  });

  res.json({ success: true, data: combo });
});

export const deleteCombo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const orderItemCount = await prisma.orderItem.count({ where: { comboId: id } });
  if (orderItemCount > 0) {
    await prisma.combo.update({ where: { id }, data: { isAvailable: false } });
    return res.json({ success: true, message: 'Combo has existing orders; it was deactivated instead of deleted.' });
  }
  await prisma.combo.delete({ where: { id } });
  res.json({ success: true, message: 'Combo deleted' });
});
