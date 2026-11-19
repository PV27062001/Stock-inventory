'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Plus, Receipt } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/module-header';
import { HeaderButton } from '@/components/ui/page-header';
import { withAuth } from '@/components/Auth/with-auth';
import { ErrorNote, LoadingNote, MonthSwitcher, NumberDialog, StatTile } from '@/components/apps/shared';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { getBillPayments, getBills, payBill, unpayBill, type Bill, type BillPayment } from '@/firebase/apps/household';
import { dayKey, dayLabel, daysInMonth, monthKey, rupees } from '@/lib/dates';
import { logger } from '@/lib/logger';

/** The bill's due date in a month, moved to the last day when the month is shorter. */
const dueDate = (bill: Bill, month: string) =>
  `${month}-${String(Math.min(bill.dueDay, daysInMonth(month))).padStart(2, '0')}`;

function BillsPage() {
  const { user } = useAuthUser();
  const [month, setMonth] = useState(monthKey);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState<Bill | null>(null);
  const today = dayKey();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [b, p] = await Promise.all([getBills(user.uid), getBillPayments(user.uid, month)]);
      setBills(b);
      setPayments(p);
    } catch (err) {
      logger.error('Loading bills failed', err);
      setError('Bills could not be loaded. Check the internet connection.');
    } finally {
      setLoading(false);
    }
  }, [user, month]);

  useEffect(() => {
    load();
  }, [load]);

  const paidBy = useMemo(() => new Map(payments.map((p) => [p.billId, p])), [payments]);
  const toPay = bills.filter((b) => !paidBy.has(b.id));
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);

  const pay = async (bill: Bill, amount: number) => {
    if (!user) return;
    setError('');
    try {
      await payBill(user.uid, bill.id, month, amount);
      setPayments((prev) => [...prev.filter((p) => p.billId !== bill.id), { id: `${bill.id}_${month}`, billId: bill.id, month, amount }]);
      setPaying(null);
    } catch (err) {
      logger.error('Paying bill failed', err);
      setError(`${bill.name} was not saved. Check the internet connection and try again.`);
    }
  };

  const undo = async (bill: Bill) => {
    if (!user || !window.confirm(`Mark ${bill.name} as not paid?`)) return;
    setError('');
    try {
      await unpayBill(user.uid, bill.id, month);
      setPayments((prev) => prev.filter((p) => p.billId !== bill.id));
    } catch (err) {
      logger.error('Undoing bill payment failed', err);
      setError('Not changed. Check the internet connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleHeader title="Bills" subtitle="Money" right={<HeaderButton icon={Plus} label="Add" href="/money/bill" />} />

      <main className="mx-auto max-w-md space-y-5 p-4">
        <MonthSwitcher month={month} onChange={setMonth} />
        {error && <ErrorNote message={error} onRetry={load} />}

        {loading ? (
          <LoadingNote label="Loading bills…" />
        ) : bills.length === 0 ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
              <Receipt className="h-10 w-10 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-lg font-semibold">No bills yet</p>
            <p className="text-base text-muted-foreground">Add each monthly bill once (EB, gas, rent, school fees). Every month you just tap Pay.</p>
            <Link href="/money/bill" className="mx-auto flex h-14 max-w-xs items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              <Plus className="h-6 w-6" aria-hidden /> Add bill
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="To pay" value={rupees(toPay.reduce((s, b) => s + b.amount, 0))} tone={toPay.length ? 'bad' : 'good'} />
              <StatTile label="Paid" value={rupees(paidTotal)} tone="good" />
            </div>
            <ul className="space-y-2">
              {bills.map((b) => {
                const paid = paidBy.get(b.id);
                const due = dueDate(b, month);
                const late = !paid && due < today;
                return (
                  <li key={b.id} className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 bg-card p-3 ${paid ? 'border-brand-green/50' : late ? 'border-destructive/60' : 'border-border'}`}>
                    <Link href={`/money/bill?id=${b.id}`} className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-semibold">{b.name}</span>
                      <span className={`block text-base ${late ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                        {paid ? `Paid ${rupees(paid.amount)}` : `${late ? 'Was due' : 'Due'} ${dayLabel(due)} · ${rupees(b.amount)}`}
                      </span>
                    </Link>
                    {paid ? (
                      <button type="button" onClick={() => undo(b)} className="flex h-12 shrink-0 items-center gap-1 rounded-xl bg-brand-green px-3 text-base font-bold text-white">
                        <Check className="h-5 w-5" aria-hidden /> Paid
                      </button>
                    ) : (
                      <button type="button" onClick={() => setPaying(b)} className="h-12 shrink-0 rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground">
                        Pay
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-muted-foreground">Tap a bill's name to change it. Paid bills count in this month's Spent.</p>
          </>
        )}
      </main>

      <NumberDialog
        open={paying !== null}
        title={paying ? `Pay ${paying.name}` : ''}
        description="Change the amount if this month's bill is different."
        initial={paying?.amount}
        unit="₹"
        saveLabel="Paid"
        onSave={(v) => (paying ? pay(paying, v) : undefined)}
        onClose={() => setPaying(null)}
      />
    </div>
  );
}

export default withAuth(BillsPage);
