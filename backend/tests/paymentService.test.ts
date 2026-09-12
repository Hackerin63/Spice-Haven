import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

vi.mock('../src/config/prisma', () => ({
  default: {
    payment: { update: vi.fn() },
    order: { update: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock('razorpay', () => ({
  default: vi.fn().mockImplementation(() => ({
    orders: { create: vi.fn() },
  })),
}));

vi.mock('../src/config/env', () => ({
  env: {
    razorpay: { keyId: 'test_key_id', keySecret: 'test_razorpay_secret' },
  },
}));

import prisma from '../src/config/prisma';
import { verifyAndRecordPayment } from '../src/services/paymentService';

const TEST_SECRET = 'test_razorpay_secret';

describe('paymentService.verifyAndRecordPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.payment.update as any).mockResolvedValue({ id: 'pay-1', status: 'PAID' });
    (prisma.order.update as any).mockResolvedValue({ id: 'order-1', status: 'CONFIRMED' });
  });

  function sign(orderId: string, paymentId: string, secret: string) {
    return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  }

  it('accepts a correctly signed payment and marks it PAID', async () => {
    const razorpayOrderId = 'order_abc123';
    const razorpayPaymentId = 'pay_xyz789';
    const validSignature = sign(razorpayOrderId, razorpayPaymentId, TEST_SECRET);

    const result = await verifyAndRecordPayment({
      orderId: 'internal-order-1',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: validSignature,
    });

    expect(result.status).toBe('PAID');
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: 'internal-order-1' },
        data: expect.objectContaining({ status: 'PAID', providerRef: razorpayPaymentId }),
      })
    );
  });

  it('rejects a payment with a forged/incorrect signature', async () => {
    await expect(
      verifyAndRecordPayment({
        orderId: 'internal-order-1',
        razorpayOrderId: 'order_abc123',
        razorpayPaymentId: 'pay_xyz789',
        razorpaySignature: 'clearly-forged-signature',
      })
    ).rejects.toMatchObject({ code: 'PAYMENT_SIGNATURE_INVALID' });

    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('rejects a signature computed with the wrong secret (simulated tampering)', async () => {
    const razorpayOrderId = 'order_abc123';
    const razorpayPaymentId = 'pay_xyz789';
    const signatureFromWrongSecret = sign(razorpayOrderId, razorpayPaymentId, 'attacker_guessed_secret');

    await expect(
      verifyAndRecordPayment({
        orderId: 'internal-order-1',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: signatureFromWrongSecret,
      })
    ).rejects.toMatchObject({ code: 'PAYMENT_SIGNATURE_INVALID' });
  });
});
