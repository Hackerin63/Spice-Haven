import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    search, category, veg, minPrice, maxPrice, bestseller, featured, special, available,
    sort, page = '1', pageSize = '20', all,
  } = req.query as Record<string, string>;

  const where: Prisma.ProductWhereInput = {};
  if (!all) where.isAvailable = true;
  if (available === 'true') where.isAvailable = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search.toLowerCase() } },
    ];
  }
  if (category) where.category = { slug: category };
  if (veg === 'true') where.isVeg = true;
  if (veg === 'false') where.isVeg = false;
  if (bestseller === 'true') where.isBestseller = true;
  if (featured === 'true') where.isFeatured = true;
  if (special === 'true') where.specialTag = { not: null };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price_asc' ? { price: 'asc' } :
    sort === 'price_desc' ? { price: 'desc' } :
    sort === 'rating' ? { ratingAvg: 'desc' } :
    { createdAt: 'desc' };

  const take = Math.min(Number(pageSize) || 20, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take,
      skip,
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, inventory: true },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ success: true, data: items, meta: { total, page: Number(page), pageSize: take } });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      addons: { where: { isActive: true } },
      inventory: true,
      reviews: { where: { isApproved: true }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!product) throw AppError.notFound('Product not found');
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { images, addons, initialStock, minStock, ...data } = req.body;

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) throw AppError.conflict('A product with this slug already exists', 'SLUG_EXISTS');

  const product = await prisma.product.create({
    data: {
      ...data,
      images: images?.length ? { create: images } : undefined,
      addons: addons?.length ? { create: addons } : undefined,
      inventory: {
        create: {
          currentStock: initialStock ?? 0,
          minStock: minStock ?? 5,
          status: (initialStock ?? 0) <= 0 ? 'OUT_OF_STOCK' : (initialStock ?? 0) <= (minStock ?? 5) ? 'LOW_STOCK' : 'IN_STOCK',
        },
      },
    },
    include: { images: true, addons: true, inventory: true },
  });

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { images, addons, initialStock, minStock, ...data } = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Product not found');

  const product = await prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({ data: images.map((image: any) => ({ ...image, productId: id })) });
    }
    return tx.product.update({ where: { id }, data, include: { images: true, addons: true, inventory: true } });
  });

  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
  if (orderItemCount > 0) {
    // Preserve order history integrity - soft delete instead of hard delete
    await prisma.product.update({ where: { id }, data: { isAvailable: false } });
    return res.json({ success: true, message: 'Product has existing orders; it was deactivated instead of deleted.' });
  }
  await prisma.product.delete({ where: { id } });
  res.json({ success: true, message: 'Product deleted' });
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw AppError.notFound('Product not found');
  const updated = await prisma.product.update({ where: { id }, data: { isAvailable: !product.isAvailable } });
  res.json({ success: true, data: { id: updated.id, isAvailable: updated.isAvailable } });
});
