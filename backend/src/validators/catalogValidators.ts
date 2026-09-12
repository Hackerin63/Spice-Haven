import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional().nullable(),
  isVeg: z.boolean().optional(),
  spicyLevel: z.number().int().min(0).max(3).optional(),
  ingredients: z.string().optional(),
  allergens: z.string().optional(),
  prepTimeMinutes: z.number().int().positive().optional(),
  isAvailable: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  specialTag: z.enum(['CHEF_SPECIAL', 'TODAYS_SPECIAL', 'WEEKEND_SPECIAL', 'SEASONAL_SPECIAL', 'BESTSELLER']).optional().nullable(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().optional(), sortOrder: z.number().optional() })).optional(),
  addons: z.array(z.object({ name: z.string(), price: z.number().nonnegative() })).optional(),
  initialStock: z.number().int().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
}).refine(d => !d.discountPrice || d.discountPrice < d.price, {
  message: 'Discount price must be lower than the regular price',
  path: ['discountPrice'],
});

export const comboSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  originalPrice: z.number().positive(),
  comboPrice: z.number().positive(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  validFrom: z.string().datetime().optional().nullable(),
  validTo: z.string().datetime().optional().nullable(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() })).min(1),
}).refine(d => d.comboPrice < d.originalPrice, {
  message: 'Combo price must be less than the original combined price',
  path: ['comboPrice'],
});
