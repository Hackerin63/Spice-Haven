import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { InventoryTxnType, StockStatus } from '@prisma/client';

export const listInventory = asyncHandler(async (req: Request, res: Response) => {
  const lowStockOnly = req.query.lowStock === 'true';
  const inventory = await prisma.inventory.findMany({
    where: lowStockOnly ? { status: { in: [StockStatus.LOW_STOCK, StockStatus.OUT_OF_STOCK] } } : {},
    include: { product: { select: { id: true, name: true, slug: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ success: true, data: inventory });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { quantity, type, note } = req.body as { quantity: number; type: keyof typeof InventoryTxnType; note?: string };

  const inventory = await prisma.inventory.findUnique({ where: { productId } });
  if (!inventory) throw AppError.notFound('Inventory record not found for this product');

  const delta = type === 'RESTOCK' ? Math.abs(quantity) : -Math.abs(quantity);
  const newStock = Math.max(inventory.currentStock + delta, 0);
  const status: StockStatus =
    newStock <= 0 ? StockStatus.OUT_OF_STOCK : newStock <= inventory.minStock ? StockStatus.LOW_STOCK : StockStatus.IN_STOCK;

  const updated = await prisma.$transaction(async (tx: any) => {
    const u = await tx.inventory.update({ where: { id: inventory.id }, data: { currentStock: newStock, status } });
    await tx.inventoryTransaction.create({
      data: { inventoryId: inventory.id, type: type as InventoryTxnType, quantity: delta, note },
    });
    return u;
  });

  res.json({ success: true, data: updated });
});

export const getStockHistory = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const inventory = await prisma.inventory.findUnique({ where: { productId } });
  if (!inventory) throw AppError.notFound('Inventory record not found');
  const history = await prisma.inventoryTransaction.findMany({
    where: { inventoryId: inventory.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: history });
});
