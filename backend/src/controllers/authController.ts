import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[login] no active user found for email: "${normalizedEmail}"`);
    }
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[login] password mismatch for email: "${normalizedEmail}"`);
    }
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const token = signAuthToken({ userId: user.id, role: user.role, email: user.email });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw AppError.notFound('User not found');
  res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, password, role } = req.body;
  const email = String(req.body.email).trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw AppError.conflict('A user with this email already exists', 'USER_EXISTS');

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

  res.status(201).json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: users });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw AppError.notFound('User not found');

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw AppError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  res.json({ success: true, message: 'Password updated' });
});

export const toggleUserActive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User not found');
  const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  res.json({ success: true, data: { id: updated.id, isActive: updated.isActive } });
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User not found');

  const passwordHash = await hashPassword(req.body.newPassword);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  res.json({ success: true, message: 'User password updated' });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === req.user!.userId) throw AppError.badRequest('You cannot delete your own account', 'SELF_DELETE_FORBIDDEN');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw AppError.notFound('User not found');

  await prisma.$transaction([
    prisma.order.updateMany({ where: { handledById: id }, data: { handledById: null } }),
    prisma.invoice.updateMany({ where: { cashierId: id }, data: { cashierId: null } }),
    prisma.user.delete({ where: { id } }),
  ]);

  res.json({ success: true, message: 'User deleted' });
});
