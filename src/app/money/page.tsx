'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Minus, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/module-header';
import { withAuth } from '@/components/Auth/with-auth';
import { ErrorNote, Hero, IconBadge, ListGroup, LoadingNote, MonthSwitcher, Section, StatTile } from '@/components/apps/shared';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import {
  deleteMoneyEntry,
  getBillPayments,
  getBills,
  getMoneyMonth,
  type Bill,
  type BillPayment,
  type MoneyEntry,
} from '@/firebase/apps/household';
import { dayLabel, monthKey, monthLabel, rupees } from '@/lib/dates';
import { logger } from '@/lib/logger';

function MoneyPage() {
  const { user } = useAuthUser();
  const [month, setMonth] = useState(monthKey);
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [e, b, p] = await Promise.all([getMoneyMonth(user.uid, month), getBills(user.uid), getBillPayments(user.uid, month)]);
      setEntries(e);
      setBills(b);
      setPayments(p);
    } catch (err) {
      logger.error('Loading money failed', err);
      setError('This month could not be loaded. Check the internet connection.');
    } finally {
      setLoading(false);
    }
  }, [user, month]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const spentEntries = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const billsPaid = payments.reduce((s, p) => s + p.amount, 0);
    const paidIds = new Set(payments.map((p) => p.billId));
    const unpaid = bills.filter((b) => !paidIds.has(b.id));
    return {
      income,
      spent: spentEntries + billsPaid,
      billsPaid,
      unpaidCount: unpaid.length,
      unpaidAmount: unpaid.reduce((s, b) => s + b.amount, 0),
    };
  }, [entries, payments, bills]);
  const balance = totals.income - totals.spent;

  const remove = async (entry: MoneyEntry) => {
    if (!user) return;
    if (!window.confirm(`Delete ${entry.category} ${rupees(entry.amount)}?`)) return;
    setError('');
    try {
      await deleteMoneyEntry(user.uid, entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (err) {
      logger.error('Deleting money entry failed', err);
      setError('Not deleted. Check the internet connection and try again.');
    }
  };

  const heroButton = 'flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-base font-bold shadow-sm active:scale-[0.98]';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleHeader title="Money" subtitle="வரவு செலவு" />

      <main className="mx-auto max-w-md space-y-6 p-4">
        <MonthSwitcher month={month} onChange={setMonth} />
        {error && <ErrorNote message={error} onRetry={load} />}

        {loading ? (
          <LoadingNote />
        ) : (
          <>
            <Hero
              icon={Wallet}
              eyebrow={balance >= 0 ? `Left in ${monthLabel(month).split(' ')[0]}` : 'Spent more than came in'}
              title={rupees(Math.abs(balance))}
            >
              <div className="flex gap-2">
                <Link href={`/money/add?type=income&month=${month}`} className={`${heroButton} text-brand-green`}>
                  <Plus className="h-5 w-5" aria-hidden /> Came in
                </Link>
                <Link href={`/money/add?type=expense&month=${month}`} className={`${heroButton} text-destructive`}>
                  <Minus className="h-5 w-5" aria-hidden /> Spent
                </Link>
              </div>
            </Hero>

            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Came in" value={rupees(totals.income)} tone="good" />
              <StatTile label="Spent" value={rupees(totals.spent)} tone="bad" />
            </div>

            <ListGroup>
              <li>
                <Link href="/money/bills" className="flex min-h-[4.5rem] items-center gap-3 px-4 py-3 active:bg-secondary">
                  <IconBadge icon={Receipt} tone={bills.length && totals.unpaidCount ? 'bad' : 'primary'} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold">Bills</span>
                    <span className="block text-base text-muted-foreground">
                      {bills.length === 0
                        ? 'Add your monthly bills (EB, gas, rent…)'
                        : totals.unpaidCount === 0
                          ? `All ${bills.length} paid · ${rupees(totals.billsPaid)}`
                          : `${totals.unpaidCount} to pay · ${rupees(totals.unpaidAmount)}`}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            </ListGroup>

            <Section title="Entries">
              {entries.length === 0 ? (
                <p className="rounded-3xl bg-card p-5 text-base text-muted-foreground shadow-soft ring-1 ring-border/60">
                  Nothing entered this month. Use Came in or Spent above.
                </p>
              ) : (
                <ListGroup>
                  {entries.map((e) => (
                    <li key={e.id} className="flex min-h-[4.5rem] items-center gap-3 py-2 pl-4 pr-2">
                      <IconBadge icon={e.type === 'income' ? ArrowDownLeft : ArrowUpRight} tone={e.type === 'income' ? 'good' : 'bad'} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold">{e.category}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {dayLabel(e.date)}
                          {e.note ? ` · ${e.note}` : ''}
                        </span>
                      </span>
                      <span className={`shrink-0 text-lg font-bold tabular-nums ${e.type === 'income' ? 'text-brand-green' : 'text-foreground'}`}>
                        {e.type === 'income' ? '+' : '−'}
                        {rupees(e.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(e)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-secondary"
                        aria-label={`Delete ${e.category}`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ListGroup>
              )}
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

export default withAuth(MoneyPage);
