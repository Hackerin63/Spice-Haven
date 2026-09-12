import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/inventoryController';

const router = Router();

router.get('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.listInventory);
router.post('/:productId/adjust', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.adjustStock);
router.get('/:productId/history', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.getStockHistory);

export default router;
