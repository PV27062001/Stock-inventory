'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Minus, Plus, Trash2 } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/module-header';
import { withAuth } from '@/components/Auth/with-auth';
import { ErrorNote, LoadingNote, MonthSwitcher, StatTile } from '@/components/apps/shared';
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
import { dayLabel, monthKey, rupees } from '@/lib/dates';
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleHeader title="Money" subtitle="வரவு செலவு" />

      <main className="mx-auto max-w-md space-y-5 p-4">
        <MonthSwitcher month={month} onChange={setMonth} />
        {error && <ErrorNote message={error} onRetry={load} />}

        {loading ? (
          <LoadingNote />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Came in" value={rupees(totals.income)} tone="good" />
              <StatTile label="Spent" value={rupees(totals.spent)} tone="bad" />
            </div>
            <div className={`rounded-2xl border-2 p-4 ${balance >= 0 ? 'border-brand-green/40 bg-brand-green/10' : 'border-destructive/40 bg-destructive/10'}`}>
              <p className="text-base font-semibold text-muted-foreground">{balance >= 0 ? 'Left this month' : 'Spent more than came in'}</p>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-brand-green' : 'text-destructive'}`}>{rupees(Math.abs(balance))}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href={`/money/add?type=income&month=${month}`} className="flex h-16 items-center justify-center gap-2 rounded-xl bg-brand-green text-lg font-bold text-white">
                <Plus className="h-6 w-6" aria-hidden /> Came in
              </Link>
              <Link href={`/money/add?type=expense&month=${month}`} className="flex h-16 items-center justify-center gap-2 rounded-xl bg-destructive text-lg font-bold text-white">
                <Minus className="h-6 w-6" aria-hidden /> Spent
              </Link>
            </div>

            <Link href="/money/bills" className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
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
              <ChevronRight className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
            </Link>

            <section>
              <h2 className="mb-2 text-lg font-bold">Entries</h2>
              {entries.length === 0 ? (
                <p className="rounded-2xl bg-card p-4 text-base text-muted-foreground">Nothing entered this month. Use the buttons above.</p>
              ) : (
                <ul className="space-y-2">
                  {entries.map((e) => (
                    <li key={e.id} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold">{e.category}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {dayLabel(e.date)}
                          {e.note ? ` · ${e.note}` : ''}
                        </span>
                      </span>
                      <span className={`shrink-0 text-lg font-bold ${e.type === 'income' ? 'text-brand-green' : 'text-destructive'}`}>
                        {e.type === 'income' ? '+' : '−'}
                        {rupees(e.amount)}
                      </span>
                      <button type="button" onClick={() => remove(e)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground ring-1 ring-border" aria-label={`Delete ${e.category}`}>
                        <Trash2 className="h-5 w-5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default withAuth(MoneyPage);
