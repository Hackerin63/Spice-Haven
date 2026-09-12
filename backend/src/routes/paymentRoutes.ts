import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createRazorpayOrderSchema, verifyRazorpayPaymentSchema } from '../validators/orderValidators';
import * as ctrl from '../controllers/paymentController';

const router = Router();

router.get('/razorpay/status', ctrl.paymentGatewayStatus);
router.post('/razorpay/create-order', validate(createRazorpayOrderSchema), ctrl.createRazorpayOrder);
router.post('/razorpay/verify', validate(verifyRazorpayPaymentSchema), ctrl.verifyRazorpayPayment);

export default router;
