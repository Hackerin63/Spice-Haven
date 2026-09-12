import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';

export const listGallery = asyncHandler(async (req: Request, res: Response) => {
  const images = await prisma.gallery.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ success: true, data: images });
});

export const createGalleryImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await prisma.gallery.create({ data: req.body });
  res.status(201).json({ success: true, data: image });
});

export const updateGalleryImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await prisma.gallery.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, data: image });
});

export const deleteGalleryImage = asyncHandler(async (req: Request, res: Response) => {
  await prisma.gallery.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Image deleted' });
});
