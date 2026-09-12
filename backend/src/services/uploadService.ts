import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw AppError.badRequest(
      'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the backend .env to enable uploads.',
      'UPLOAD_NOT_CONFIGURED'
    );
  }
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  configured = true;
}

export function isUploadConfigured(): boolean {
  // Local disk is the development fallback when Cloudinary is not configured.
  return true;
}

/**
 * Uploads a file buffer to Cloudinary and returns the secure URL.
 * Applies automatic format/quality optimization so large originals aren't
 * stored or served unnecessarily (spec section 47/42).
 */
export async function uploadImageBuffer(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    const filename = `${randomUUID()}.webp`;
    const uploadDirectory = path.resolve(__dirname, '../uploads', folder);
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), buffer);
    return { url: `/uploads/${folder}/${filename}`, publicId: filename };
  }

  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `restaurant-platform/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          return reject(AppError.internal('Image upload failed', 'UPLOAD_FAILED'));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  ensureConfigured();
  await cloudinary.uploader.destroy(publicId);
}
