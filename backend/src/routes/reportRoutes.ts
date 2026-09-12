import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/reportController';

const router = Router();

router.get('/dashboard', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.getDashboardSummary);
router.get('/sales', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.getSalesReport);
router.get('/export/orders.csv', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.exportOrdersCsv);

export default router;
