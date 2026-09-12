import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import prisma from '../config/prisma';

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw AppError.badRequest(
      'Online payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend .env to accept UPI/card payments.',
      'PAYMENTS_NOT_CONFIGURED'
    );
  }
  if (!client) {
    client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  }
  return client;
}

export function isPaymentGatewayConfigured(): boolean {
  return Boolean(env.razorpay.keyId && env.razorpay.keySecret);
}

/**
 * Creates a Razorpay order for an existing internal order. Amount is always
 * re-read from our own database (order.grandTotal) — never trusted from the
 * client — so a tampered frontend amount can never reach the payment gateway.
 */
export async function createRazorpayOrderForOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
  if (order.payment?.status === 'PAID') {
    throw AppError.badRequest('This order has already been paid', 'ALREADY_PAID');
  }

  const rzp = getClient();
  const amountInPaise = Math.round(Number(order.grandTotal) * 100);

  const rzpOrder = await rzp.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { internalOrderId: order.id },
  });

  return {
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: env.razorpay.keyId,
  };
}

/**
 * Verifies the HMAC-SHA256 signature Razorpay returns after checkout, per
 * their documented verification flow. This is the ONLY way a payment is ever
 * marked PAID in our system — the frontend cannot set payment status itself.
 */
export async function verifyAndRecordPayment(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  if (!env.razorpay.keySecret) {
    throw AppError.badRequest('Online payments are not configured', 'PAYMENTS_NOT_CONFIGURED');
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== params.razorpaySignature) {
    throw AppError.badRequest('Payment verification failed — signature mismatch', 'PAYMENT_SIGNATURE_INVALID');
  }

  const payment = await prisma.payment.update({
    where: { orderId: params.orderId },
    data: {
      status: 'PAID',
      providerRef: params.razorpayPaymentId,
      verifiedAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: params.orderId },
    data: { status: 'CONFIRMED' },
  });

  return payment;
}
