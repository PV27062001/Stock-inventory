import type { Rental } from '@/firebase/kirayabook/firestore-service';

/** Minimal shape needed to price a rental line. */
export interface PricedItem {
  quantity: number;
  rate: number;
}

/** Sum of quantity × rate across all rental items. */
export function calcItemsTotal(items: PricedItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

/** Balance still owed = total − advance − amount paid today. */
export function calcBalanceDue(totalAmount: number, advanceAmount: number, amountPaidToday = 0): number {
  return totalAmount - advanceAmount - amountPaidToday;
}

/** Never store a negative balance. */
export function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value;
}

/** Round to paise so float drift never shows up as 49.999999. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface Settlement {
  /** Customer still owes this much. */
  balanceDue: number;
  /** Shop must hand this much back (advance exceeded the bill). */
  refundDue: number;
}

/**
 * Net position after today's cash movement.
 * Positive net = customer owes; negative net = advance was more than the bill.
 */
export function calcSettlement(
  totalAmount: number,
  advanceAmount: number,
  paidToday = 0,
  returnedToday = 0,
): Settlement {
  const net = round2(totalAmount - advanceAmount - paidToday + returnedToday);
  return {
    balanceDue: net > 0 ? net : 0,
    refundDue: net < 0 ? round2(-net) : 0,
  };
}

/** A rental is closed once it is completed or settled. */
export function isRentalClosed(status: string | undefined): boolean {
  return status === 'Completed' || status === 'Settled';
}
