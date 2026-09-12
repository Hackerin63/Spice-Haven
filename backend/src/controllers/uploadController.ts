import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../utils/AppError';
import { uploadImageBuffer, isUploadConfigured } from '../services/uploadService';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const uploadStatus = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: { configured: isUploadConfigured() } });
});

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) throw AppError.badRequest('No file was uploaded', 'NO_FILE');

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw AppError.badRequest('Only JPEG, PNG, WEBP, and GIF images are allowed', 'INVALID_FILE_TYPE');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw AppError.badRequest('Image must be smaller than 5MB', 'FILE_TOO_LARGE');
  }

  const folder = (req.query.folder as string) || 'general';
  const allowedFolders = ['products', 'gallery', 'branding', 'banners', 'general'];
  const safeFolder = allowedFolders.includes(folder) ? folder : 'general';

  const result = await uploadImageBuffer(file.buffer, safeFolder);
  if (result.url.startsWith('/uploads/')) {
    result.url = `${req.protocol}://${req.get('host')}${result.url}`;
  }
  res.status(201).json({ success: true, data: result });
});
