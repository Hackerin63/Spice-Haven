import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/customerController';

const router = Router();

router.get('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.listCustomers);
router.get('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.getCustomer);

export default router;
