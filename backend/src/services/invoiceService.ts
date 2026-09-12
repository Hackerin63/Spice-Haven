import PDFDocument from 'pdfkit';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { PassThrough } from 'stream';

function money(n: number | string | { toString(): string }, symbol: string): string {
  return `${symbol}${Number(n.toString()).toFixed(2)}`;
}

/**
 * Generates a professional A4 invoice PDF for a completed/any order.
 * Returns a Buffer so the controller can stream it directly as a download.
 */
export async function generateInvoicePdf(orderId: string): Promise<Buffer> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { addons: true } },
      customer: true,
      address: true,
      payment: true,
      invoice: true,
      handledBy: true,
    },
  });
  if (!order) throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');

  const restaurant = await prisma.restaurant.findFirst();
  const symbol = restaurant?.currencySymbol ?? '₹';

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];
  stream.on('data', (chunk) => chunks.push(chunk));
  doc.pipe(stream);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text(restaurant?.name ?? 'Restaurant', { align: 'left' });
  doc.fontSize(9).font('Helvetica').fillColor('#555');
  if (restaurant?.addressLine) doc.text(`${restaurant.addressLine}, ${restaurant.city ?? ''}`);
  if (restaurant?.phone) doc.text(`Phone: ${restaurant.phone}`);
  if (restaurant?.gstNumber) doc.text(`GSTIN: ${restaurant.gstNumber}`);
  doc.fillColor('#000');

  doc.moveDown(1);
  doc.fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', { align: 'right' });
  doc.fontSize(9).font('Helvetica');
  doc.text(`Invoice #: ${order.invoice?.invoiceNumber ?? 'N/A'}`, { align: 'right' });
  doc.text(`Order #: ${order.orderNumber}`, { align: 'right' });
  doc.text(`Date: ${order.createdAt.toLocaleString('en-IN')}`, { align: 'right' });
  if (order.handledBy) doc.text(`Cashier: ${order.handledBy.name}`, { align: 'right' });

  doc.moveDown(1.5);
  doc.strokeColor('#ddd').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  // Bill to
  doc.fontSize(10).font('Helvetica-Bold').text('Bill To:');
  doc.font('Helvetica').fontSize(9);
  doc.text(order.customer.name);
  doc.text(order.customer.phone);
  if (order.address) {
    doc.text(`${order.address.line1}, ${order.address.city} - ${order.address.pincode}`);
  }
  doc.text(`Order Type: ${order.orderType}`);

  doc.moveDown(1);

  // Table header
  const tableTop = doc.y;
  const col = { name: 50, qty: 320, price: 380, total: 470 };
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Item', col.name, tableTop);
  doc.text('Qty', col.qty, tableTop);
  doc.text('Price', col.price, tableTop);
  doc.text('Total', col.total, tableTop);
  doc.moveDown(0.3);
  doc.strokeColor('#000').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(9);
  for (const item of order.items) {
    const y = doc.y;
    doc.text(item.nameSnapshot, col.name, y, { width: 260 });
    doc.text(String(item.quantity), col.qty, y);
    doc.text(money(item.unitPrice, symbol), col.price, y);
    doc.text(money(item.lineTotal, symbol), col.total, y);
    doc.moveDown(0.4);
    for (const addon of item.addons) {
      const ay = doc.y;
      doc.fontSize(8).fillColor('#666').text(`+ ${addon.nameSnapshot}`, col.name + 10, ay);
      doc.text(money(addon.priceSnapshot, symbol), col.total, ay);
      doc.fillColor('#000').fontSize(9);
      doc.moveDown(0.3);
    }
  }

  doc.moveDown(0.3);
  doc.strokeColor('#ddd').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  // Totals
  const totalsX = 380;
  function totalRow(label: string, value: string, bold = false) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9);
    doc.text(label, totalsX, doc.y, { continued: false, width: 90 });
    doc.text(value, col.total, doc.y - (bold ? 13 : 11));
  }

  totalRow('Subtotal', money(order.subtotal, symbol));
  doc.moveDown(0.3);
  if (Number(order.productDiscount) > 0) {
    totalRow('Item Discount', `-${money(order.productDiscount, symbol)}`);
    doc.moveDown(0.3);
  }
  if (Number(order.couponDiscount) > 0) {
    totalRow('Coupon Discount', `-${money(order.couponDiscount, symbol)}`);
    doc.moveDown(0.3);
  }
  totalRow(`Tax (${order.taxPercent}%)`, money(order.taxAmount, symbol));
  doc.moveDown(0.3);
  if (Number(order.deliveryFee) > 0) {
    totalRow('Delivery Fee', money(order.deliveryFee, symbol));
    doc.moveDown(0.3);
  }
  doc.moveDown(0.2);
  doc.strokeColor('#000').moveTo(totalsX, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.3);
  totalRow('Grand Total', money(order.grandTotal, symbol), true);

  doc.moveDown(2);
  doc.fontSize(9).font('Helvetica').fillColor('#555');
  doc.text(`Payment Method: ${order.payment?.method ?? 'N/A'} (${order.payment?.status ?? 'N/A'})`, 50);
  doc.moveDown(1);
  doc.fontSize(9).fillColor('#888').text('Thank you for your order!', 50, doc.y, { align: 'center', width: 495 });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
