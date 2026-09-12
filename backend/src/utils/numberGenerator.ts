/**
 * Generates human-friendly, sortable order/invoice numbers.
 * Format: SH-YYYYMMDD-XXXX (XXXX = random 4-digit segment to avoid collisions
 * within the same millisecond; DB unique constraint is the real guarantee).
 */
function pad(num: number, size: number): string {
  return num.toString().padStart(size, '0');
}

export function generateOrderNumber(prefix = 'ORD'): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`;
  const randomPart = pad(Math.floor(Math.random() * 10000), 4);
  const msPart = pad(now.getMilliseconds(), 3);
  return `${prefix}-${datePart}-${randomPart}${msPart}`;
}

export function generateInvoiceNumber(): string {
  return generateOrderNumber('INV');
}
