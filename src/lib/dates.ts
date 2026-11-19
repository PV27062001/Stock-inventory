// Day and month keys in the phone's local time. Never use toISOString() for these: it is UTC, so an
// entry made before 5:30 am in India would land on the previous day.

const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' for the given date (default: today), local time. */
export const dayKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM' for the given date (default: this month), local time. */
export const monthKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** Date for the first day of a 'YYYY-MM' month. */
export const monthStart = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1);
};

/** Month key moved by `delta` months. */
export const shiftMonth = (month: string, delta: number) => {
  const d = monthStart(month);
  d.setMonth(d.getMonth() + delta);
  return monthKey(d);
};

export const daysInMonth = (month: string) => {
  const d = monthStart(month);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
};

/** "November 2026" */
export const monthLabel = (month: string) =>
  monthStart(month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

/** "Thu, 19 Nov" */
export const dayLabel = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

/** "₹1,425" or "₹1,425.50" (paise always as two digits) */
export const rupees = (amount: number) => {
  const whole = Math.round(amount * 100) % 100 === 0;
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
};

/** "9:00 am" from "09:00" */
export const timeLabel = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  return new Date(2000, 0, 1, h, m || 0).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};
