import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { categorySchema } from '../validators/catalogValidators';
import * as ctrl from '../controllers/categoryController';

const router = Router();

router.get('/', ctrl.listCategories);
router.get('/:slug', ctrl.getCategory);
router.post('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), validate(categorySchema), ctrl.createCategory);
router.put('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.updateCategory);
router.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.deleteCategory);

export default router;
