import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { loginSchema, createUserSchema, changePasswordSchema, resetUserPasswordSchema } from '../validators/authValidators';
import * as authController from '../controllers/authController';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.', code: 'RATE_LIMITED' },
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);
router.post('/change-password', requireAuth, validate(changePasswordSchema), authController.changePassword);

// User management - SUPER_ADMIN only
router.post('/users', requireAuth, requireRole('SUPER_ADMIN'), validate(createUserSchema), authController.createUser);
router.get('/users', requireAuth, requireRole('SUPER_ADMIN'), authController.listUsers);
router.patch('/users/:id/toggle-active', requireAuth, requireRole('SUPER_ADMIN'), authController.toggleUserActive);
router.patch('/users/:id/password', requireAuth, requireRole('SUPER_ADMIN'), validate(resetUserPasswordSchema), authController.resetUserPassword);
router.delete('/users/:id', requireAuth, requireRole('SUPER_ADMIN'), authController.deleteUser);

export default router;
