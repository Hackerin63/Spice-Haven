import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { offerSchema } from '../validators/orderValidators';
import * as ctrl from '../controllers/offerController';

const router = Router();

router.get('/', ctrl.listOffers);
router.post('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), validate(offerSchema), ctrl.createOffer);
router.put('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.updateOffer);
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.deleteOffer);

export default router;
