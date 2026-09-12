import prisma from '../config/prisma';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

/**
 * NOTIFICATION ARCHITECTURE
 * -------------------------
 * `sendOrderNotifications` is the single entry point called after an order is
 * created or its status changes. It logs a Notification row (auditable) and
 * dispatches to whichever providers are configured via env vars.
 *
 * WhatsApp: without WhatsApp Business API credentials we cannot push a message
 * server-side (that requires a paid, approved Business API account). What we
 * CAN and DO implement fully is:
 *   - buildWhatsAppOrderMessage() - structured, correctly URL-encoded message
 *   - buildWhatsAppLink() - a wa.me click-to-chat link the frontend uses for
 *     the floating WhatsApp button / "Order via WhatsApp" CTA / share buttons
 * The provider adapter below (`WhatsAppProvider`) is where a real Business API
 * call would go once credentials exist (see .env.example) — it is isolated
 * behind one interface so swapping it in later touches no calling code.
 */

interface NotificationProvider {
  send(toAddress: string, subject: string | undefined, body: string): Promise<{ success: boolean; ref?: string }>;
}

class WhatsAppProvider implements NotificationProvider {
  async send(toAddress: string, _subject: string | undefined, body: string) {
    // Placeholder adapter: real integration requires WhatsApp Business API
    // (Meta Cloud API) credentials. Wire them in here when available:
    //
    //   const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${WHATSAPP_BUSINESS_TOKEN}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ messaging_product: 'whatsapp', to: toAddress, type: 'text', text: { body } }),
    //   });
    //
    // Until then we do NOT fake a "sent" status — we mark it queued so the
    // click-to-WhatsApp flow (frontend) is the actual delivery path.
    return { success: false };
  }
}

class EmailProvider implements NotificationProvider {
  async send(_toAddress: string, _subject: string | undefined, _body: string) {
    // Wire an actual provider (SES/SendGrid/Postmark) here using env vars.
    return { success: false };
  }
}

const providers: Record<NotificationChannel, NotificationProvider | null> = {
  WHATSAPP: new WhatsAppProvider(),
  EMAIL: new EmailProvider(),
  SMS: null,
  BROWSER: null,
};

export function buildWhatsAppOrderMessage(params: {
  restaurantName: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; customization?: string }>;
  subtotal: number;
  discount: number;
  total: number;
  orderType: string;
  address?: string;
  specialInstructions?: string;
}): string {
  const lines = [
    `*${params.restaurantName}* — New Order`,
    `Order #: ${params.orderNumber}`,
    `Customer: ${params.customerName}`,
    '',
    'Items:',
    ...params.items.map((i) => `• ${i.name} x${i.quantity}${i.customization ? ` (${i.customization})` : ''}`),
    '',
    `Subtotal: ${params.subtotal.toFixed(2)}`,
    `Discount: ${params.discount.toFixed(2)}`,
    `Total: ${params.total.toFixed(2)}`,
    `Order Type: ${params.orderType}`,
  ];
  if (params.address) lines.push(`Address: ${params.address}`);
  if (params.specialInstructions) lines.push(`Notes: ${params.specialInstructions}`);
  return lines.join('\n');
}

export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export async function sendOrderNotifications(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true, address: true },
  });
  if (!order) return;

  const restaurant = await prisma.restaurant.findFirst();

  const message = buildWhatsAppOrderMessage({
    restaurantName: restaurant?.name ?? 'Restaurant',
    customerName: order.customer.name,
    orderNumber: order.orderNumber,
    items: order.items.map((i: (typeof order.items)[number]) => ({ name: i.nameSnapshot, quantity: i.quantity })),
    subtotal: Number(order.subtotal),
    discount: Number(order.productDiscount) + Number(order.couponDiscount),
    total: Number(order.grandTotal),
    orderType: order.orderType,
    address: order.address ? `${order.address.line1}, ${order.address.city} - ${order.address.pincode}` : undefined,
    specialInstructions: order.specialInstructions ?? undefined,
  });

  // Log an auditable notification record regardless of provider availability
  const provider = providers.WHATSAPP;
  const result = provider ? await provider.send(restaurant?.whatsappNumber ?? '', undefined, message) : { success: false };

  await prisma.notification.create({
    data: {
      channel: NotificationChannel.WHATSAPP,
      toAddress: restaurant?.whatsappNumber ?? '',
      body: message,
      status: result.success ? NotificationStatus.SENT : NotificationStatus.QUEUED,
      meta: { orderId, orderNumber: order.orderNumber },
      sentAt: result.success ? new Date() : null,
    },
  });
}
