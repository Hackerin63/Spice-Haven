import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/restaurantController';

const router = Router();

router.get('/', ctrl.getRestaurant);
router.put('/', requireAuth, requireRole('SUPER_ADMIN'), ctrl.updateRestaurant);

export default router;
