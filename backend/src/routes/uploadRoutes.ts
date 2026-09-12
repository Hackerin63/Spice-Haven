import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth';
import * as ctrl from '../controllers/uploadController';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.get('/status', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), ctrl.uploadStatus);
router.post('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER'), upload.single('file'), ctrl.uploadImage);

export default router;
