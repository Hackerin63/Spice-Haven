import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.all === 'true';
  const categories = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { displayOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json({ success: true, data: categories });
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!category) throw AppError.notFound('Category not found');
  res.json({ success: true, data: category });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.category.findUnique({ where: { slug: req.body.slug } });
  if (existing) throw AppError.conflict('A category with this slug already exists', 'SLUG_EXISTS');
  const category = await prisma.category.create({ data: req.body });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Category not found');
  const category = await prisma.category.update({ where: { id }, data: req.body });
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw AppError.badRequest('Cannot delete a category that has products. Deactivate it instead.', 'CATEGORY_HAS_PRODUCTS');
  }
  await prisma.category.delete({ where: { id } });
  res.json({ success: true, message: 'Category deleted' });
});
