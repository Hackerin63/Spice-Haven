import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/reviewController';

const router = Router();

router.get('/', ctrl.listPublicReviews);
router.post('/', ctrl.submitReview);
router.get('/admin/all', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.listAllReviews);
router.patch('/:id/approve', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.approveReview);
router.patch('/:id/feature', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.toggleFeatureReview);
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.rejectReview);

export default router;
