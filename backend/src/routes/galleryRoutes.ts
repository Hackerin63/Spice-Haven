import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/galleryController';

const router = Router();

router.get('/', ctrl.listGallery);
router.post('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.createGalleryImage);
router.put('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.updateGalleryImage);
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.deleteGalleryImage);

export default router;
