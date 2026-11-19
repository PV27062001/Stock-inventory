'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Plus, Receipt } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/module-header';
import { HeaderButton } from '@/components/ui/page-header';
import { withAuth } from '@/components/Auth/with-auth';
import { EmptyState, ErrorNote, Hero, IconBadge, ListGroup, LoadingNote, MonthSwitcher, NumberDialog, Section } from '@/components/apps/shared';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { getBillPayments, getBills, payBill, unpayBill, type Bill, type BillPayment } from '@/firebase/apps/household';
import { dayKey, dayLabel, daysInMonth, monthKey, monthLabel, rupees } from '@/lib/dates';
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
  const toPayAmount = toPay.reduce((s, b) => s + b.amount, 0);
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

      <main className="mx-auto max-w-md space-y-6 p-4">
        <MonthSwitcher month={month} onChange={setMonth} />
        {error && <ErrorNote message={error} onRetry={load} />}

        {loading ? (
          <LoadingNote label="Loading bills…" />
        ) : bills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No bills yet"
            text="Add each monthly bill once (EB, gas, rent, school fees). Every month you just tap Pay."
            action={{ label: 'Add bill', href: '/money/bill' }}
          />
        ) : (
          <>
            <Hero
              icon={Receipt}
              eyebrow={`To pay in ${monthLabel(month).split(' ')[0]}`}
              title={toPay.length ? rupees(toPayAmount) : 'All paid'}
              subtitle={`${toPay.length} of ${bills.length} bills left · ${rupees(paidTotal)} paid`}
            />

            <Section title="This month">
              <ListGroup>
                {bills.map((b) => {
                  const paid = paidBy.get(b.id);
                  const due = dueDate(b, month);
                  const late = !paid && due < today;
                  return (
                    <li key={b.id} className="flex min-h-[4.5rem] items-center gap-3 px-4 py-3">
                      <IconBadge icon={paid ? Check : Receipt} tone={paid ? 'good' : late ? 'bad' : 'primary'} />
                      <Link href={`/money/bill?id=${b.id}`} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center">
                        <span className="block truncate text-lg font-semibold">{b.name}</span>
                        {/* Amount first and allowed to wrap, so it is never cut off. */}
                        <span className={`block text-base ${late ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                          {paid ? `Paid ${rupees(paid.amount)}` : `${rupees(b.amount)} · ${late ? 'was due' : 'due'} ${dayLabel(due)}`}
                        </span>
                      </Link>
                      {paid ? (
                        <button type="button" onClick={() => undo(b)} className="flex h-12 shrink-0 items-center gap-1 rounded-full bg-brand-green/15 px-4 text-base font-bold text-brand-green">
                          <Check className="h-5 w-5" aria-hidden /> Paid
                        </button>
                      ) : (
                        <button type="button" onClick={() => setPaying(b)} className="h-12 shrink-0 rounded-full bg-primary px-5 text-base font-bold text-primary-foreground shadow-sm">
                          Pay
                        </button>
                      )}
                    </li>
                  );
                })}
              </ListGroup>
              <p className="mt-2 px-1 text-sm text-muted-foreground">Tap a bill's name to change it. Paid bills count in this month's Spent.</p>
            </Section>
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
