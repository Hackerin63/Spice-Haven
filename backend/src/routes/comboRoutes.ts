import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { comboSchema } from '../validators/catalogValidators';
import * as ctrl from '../controllers/comboController';

const router = Router();

router.get('/', ctrl.listCombos);
router.get('/:slug', ctrl.getComboBySlug);
router.post('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), validate(comboSchema), ctrl.createCombo);
router.put('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.updateCombo);
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.deleteCombo);

export default router;
