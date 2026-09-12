import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createRazorpayOrderForOrder, verifyAndRecordPayment, isPaymentGatewayConfigured } from '../services/paymentService';

export const paymentGatewayStatus = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: { configured: isPaymentGatewayConfigured() } });
});

export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const result = await createRazorpayOrderForOrder(orderId);
  res.json({ success: true, data: result });
});

export const verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const payment = await verifyAndRecordPayment({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature });
  res.json({ success: true, data: payment, message: 'Payment verified successfully' });
});
