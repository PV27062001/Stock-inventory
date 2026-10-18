import type { Customer, Rental } from '@/firebase/kirayabook/firestore-service';
import { calcSettlement, round2 } from '@/lib/rental-calculations';
import { formatMobile, toWhatsAppNumber } from '@/lib/phone';
import { SHOP } from '@/lib/shop-info';

const RULE = '━━━━━━━━━━━━━━━━━━━━━';

export const money = (n: number) => `₹${round2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const date = (d?: Date) =>
  d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Inclusive day count, so a same-day rental still counts as one day. */
export const daysBetween = (from?: Date, to?: Date) => {
  if (!from || !to) return null;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
};

export const billNo = (id?: string) => (id ? id.slice(-6).toUpperCase() : '------');

/** Right-aligned column widths inside the monospace block. */
const row = (name: string, qty: string, rate: string, amt: string) =>
  `${name.slice(0, 12).padEnd(12)}${qty.padStart(3)}${rate.padStart(7)}${amt.padStart(9)}`;

export function buildBillText(rental: Rental, customer?: Customer | null): string {
  const { balanceDue, refundDue } = calcSettlement(rental.totalAmount || 0, rental.advanceAmount || 0);
  const days = daysBetween(rental.rentalFrom, rental.rentalTo);
  const closed = rental.status === 'Completed' || rental.status === 'Settled';

  const lines: string[] = [];

  lines.push(`*${SHOP.nameTa}*`);
  lines.push(`*${SHOP.name}*`);
  lines.push(SHOP.taglineTa);
  lines.push(`_${SHOP.tagline}_`);
  if (SHOP.address) lines.push(`📍 ${SHOP.address}`);
  if (SHOP.phone) lines.push(`📞 ${formatMobile(SHOP.phone)}`);

  lines.push(RULE);
  lines.push(`*${closed ? 'RENTAL BILL' : 'RENTAL ESTIMATE'}*`);
  lines.push(`Bill No : #${billNo(rental.id)}`);
  lines.push(`Date    : ${date(new Date())}`);

  lines.push(RULE);
  lines.push('*Customer*');
  lines.push(`Name    : ${customer?.name || '—'}`);
  if (customer?.mobile) lines.push(`Mobile  : ${formatMobile(customer.mobile)}`);

  lines.push(RULE);
  lines.push('*Rental Period*');
  lines.push(`From    : ${date(rental.rentalFrom)}`);
  lines.push(`To      : ${rental.rentalTo ? date(rental.rentalTo) : 'Not returned'}`);
  if (days) lines.push(`Days    : ${days}`);

  lines.push(RULE);
  lines.push('*Items*');
  lines.push('```');
  lines.push(row('Item', 'Qty', 'Rate', 'Amount'));
  lines.push('-'.repeat(31));
  for (const item of rental.items ?? []) {
    const amount = (item.quantity || 0) * (item.rate || 0);
    lines.push(row(item.name, String(item.quantity ?? 0), String(item.rate ?? 0), String(round2(amount))));
  }
  lines.push('```');

  lines.push(RULE);
  lines.push(`Total      : ${money(rental.totalAmount || 0)}`);
  if (rental.advanceAmount) lines.push(`Advance    : -${money(rental.advanceAmount)}`);

  if (refundDue > 0) {
    lines.push(`*To Return : ${money(refundDue)}*`);
  } else {
    lines.push(`*Balance   : ${money(balanceDue)}*`);
    if (balanceDue === 0) lines.push('_Fully paid. Thank you!_');
  }

  if (rental.damageNotes?.trim()) {
    lines.push(RULE);
    lines.push(`*Note:* ${rental.damageNotes.trim()}`);
  }

  lines.push(RULE);
  lines.push('🙏 Thank you for your business!');

  return lines.join('\n');
}

/** Opens WhatsApp with the bill pre-filled, addressed to the customer when known. */
export function shareBillOnWhatsApp(rental: Rental, customer?: Customer | null) {
  const text = encodeURIComponent(buildBillText(rental, customer));
  const to = customer?.mobile ? toWhatsAppNumber(customer.mobile) : '';
  const url = to ? `https://wa.me/${to}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
