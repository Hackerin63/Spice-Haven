import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, AuthTokenPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import prisma from '../config/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw AppError.unauthorized('Authentication token missing');

    const payload = verifyAuthToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account is inactive or no longer exists');
    }

    req.user = payload;
    next();
  } catch (err) {
    next(AppError.unauthorized('Invalid or expired session'));
  }
}

export function requireRole(...roles: Array<'SUPER_ADMIN' | 'MANAGER' | 'CASHIER'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
