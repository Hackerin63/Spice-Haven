import { api } from './client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

export const getRazorpayStatus = () =>
  api.get<{ success: true; data: { configured: boolean } }>('/payments/razorpay/status').then((r) => r.data.data);

/**
 * Opens the Razorpay checkout modal for an already-created internal order,
 * then verifies the resulting signature server-side before resolving.
 * The amount is never taken from the frontend — createRazorpayOrder on the
 * backend re-reads it from the order record itself.
 */
export async function payWithRazorpay(params: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  restaurantName: string;
}): Promise<void> {
  await loadRazorpayScript();

  const { data: createResp } = await api.post('/payments/razorpay/create-order', { orderId: params.orderId });
  const { razorpayOrderId, amount, currency, keyId } = createResp.data;

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      name: params.restaurantName,
      description: `Order #${params.orderNumber}`,
      order_id: razorpayOrderId,
      prefill: {
        name: params.customerName,
        contact: params.customerPhone,
        email: params.customerEmail,
      },
      theme: { color: '#ea580c' },
      handler: async (response: any) => {
        try {
          await api.post('/payments/razorpay/verify', {
            orderId: params.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled')),
      },
    });
    rzp.open();
  });
}
