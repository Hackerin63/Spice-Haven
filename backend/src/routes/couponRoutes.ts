import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { couponSchema } from '../validators/orderValidators';
import * as ctrl from '../controllers/couponController';

const router = Router();

router.get('/validate', ctrl.validateCoupon);
router.get('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.listCoupons);
router.post('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), validate(couponSchema), ctrl.createCoupon);
router.put('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.updateCoupon);
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.deleteCoupon);

export default router;
