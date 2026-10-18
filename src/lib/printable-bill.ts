import type { Customer, Rental } from '@/firebase/kirayabook/firestore-service';
import { calcSettlement, round2 } from '@/lib/rental-calculations';
import { formatMobile } from '@/lib/phone';
import { SHOP } from '@/lib/shop-info';
import { billNo, date, daysBetween } from '@/lib/bill';
import { amountInWords } from '@/lib/amount-in-words';

export type BillLineView = {
  sno: number;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type BillSettlementState = 'due' | 'refund' | 'paid' | 'estimate';

export interface PrintableBillView {
  shop: typeof SHOP;
  customer: { name: string; mobile: string; profession: string };
  billNo: string;
  billDate: string;
  from: string;
  till: string;
  days: number | null;
  items: BillLineView[];
  total: string;
  advance: string;
  amountInWords: string;
  damageNotes: string;
  finalLabel: { ta: string; en: string };
  finalAmount: string;
  state: BillSettlementState;
  stampLabel: { ta: string; en: string };
}

const FINAL_LABELS: Record<Exclude<BillSettlementState, 'estimate'>, { ta: string; en: string }> = {
  due: { ta: 'பாக்கி', en: 'Balance Due' },
  refund: { ta: 'திரும்ப தர வேண்டியது', en: 'Refund To You' },
  paid: { ta: 'செலுத்தப்பட்டது', en: 'Paid' },
};

const STAMP_LABELS: Record<BillSettlementState, { ta: string; en: string }> = {
  ...FINAL_LABELS,
  estimate: { ta: 'மதிப்பீடு', en: 'ESTIMATE' },
};

/** Builds everything the printable A5 bill needs to render, from Firestore rental + customer records. */
export function buildPrintableBill(rental: Rental, customer?: Customer | null): PrintableBillView {
  const active = rental.status === 'Active' || rental.status === 'Overdue';
  const { balanceDue, refundDue } = calcSettlement(rental.totalAmount || 0, rental.advanceAmount || 0);
  const days = daysBetween(rental.rentalFrom, active ? new Date() : rental.rentalTo);

  const state: BillSettlementState = balanceDue > 0 ? 'due' : refundDue > 0 ? 'refund' : 'paid';

  const items: BillLineView[] = (rental.items ?? []).map((item, i) => ({
    sno: i + 1,
    name: item.name,
    quantity: item.quantity || 0,
    rate: item.rate || 0,
    amount: round2((item.quantity || 0) * (item.rate || 0)),
  }));

  return {
    shop: SHOP,
    customer: {
      name: customer?.name || '—',
      mobile: customer?.mobile ? formatMobile(customer.mobile) : '—',
      profession: customer?.profession || '—',
    },
    billNo: billNo(rental.id),
    billDate: date(new Date()),
    from: date(rental.rentalFrom),
    till: active ? '—' : rental.rentalTo ? date(rental.rentalTo) : '—',
    days,
    items,
    total: `Rs. ${round2(rental.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    advance: `Rs. ${round2(rental.advanceAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    amountInWords: amountInWords(rental.totalAmount || 0),
    damageNotes: rental.damageNotes?.trim() || '',
    finalLabel: FINAL_LABELS[state],
    finalAmount:
      state === 'paid'
        ? 'NIL'
        : `Rs. ${round2(state === 'refund' ? refundDue : balanceDue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    state: active ? 'estimate' : state,
    stampLabel: STAMP_LABELS[active ? 'estimate' : state],
  };
}
