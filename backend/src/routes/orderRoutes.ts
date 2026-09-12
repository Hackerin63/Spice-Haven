import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { quoteCartSchema, createOrderSchema, updateOrderStatusSchema } from '../validators/orderValidators';
import * as ctrl from '../controllers/orderController';

const router = Router();

// Public customer-facing endpoints
router.post('/quote', validate(quoteCartSchema), ctrl.quoteCart);
router.post('/', validate(createOrderSchema), ctrl.placeOrder);
router.get('/track/:orderNumber', ctrl.trackOrderByNumber);
router.get('/track/:orderNumber/invoice.pdf', ctrl.downloadInvoiceByOrderNumber);

// Admin/POS endpoints
router.post('/pos', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), validate(createOrderSchema), ctrl.placePosOrder);
router.get('/', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), ctrl.listOrders);
router.get('/:id', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), ctrl.getOrder);
router.patch('/:id/status', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), validate(updateOrderStatusSchema), ctrl.changeOrderStatus);
router.get('/:id/whatsapp-link', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), ctrl.getOrderWhatsAppLink);
router.get('/:id/invoice.pdf', requireAuth, requireRole('SUPER_ADMIN', 'MANAGER', 'CASHIER'), ctrl.downloadInvoice);

export default router;
