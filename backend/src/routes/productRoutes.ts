import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { productSchema } from '../validators/catalogValidators';
import * as ctrl from '../controllers/productController';

const router = Router();

router.get('/', ctrl.listProducts);
router.get('/:slug', ctrl.getProductBySlug);
router.post('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), validate(productSchema), ctrl.createProduct);
router.put('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.updateProduct);
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.deleteProduct);
router.patch('/:id/toggle-availability', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.toggleAvailability);

export default router;
