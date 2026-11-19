'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { withAuth } from '@/components/Auth/with-auth';
import { BrandLoader } from '@/components/app/brand-loader';
import { ErrorNote, fieldClass } from '@/components/apps/shared';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { addMoneyEntry, type MoneyType } from '@/firebase/apps/household';
import { dayKey, monthKey } from '@/lib/dates';
import { logger } from '@/lib/logger';

const CATEGORIES: Record<MoneyType, string[]> = {
  income: ['Salary', 'Shop sales', 'Rent received', 'Pension', 'Interest', 'Gift', 'Other'],
  expense: ['Groceries', 'Vegetables', 'Milk', 'Medicine', 'Hospital', 'Travel', 'Petrol', 'School', 'Clothes', 'Function', 'Shop', 'Other'],
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
};

function AddMoneyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuthUser();
  const [type, setType] = useState<MoneyType>(params?.get('type') === 'income' ? 'income' : 'expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  // Adding from a past month (via the month switcher) starts on that month's last day.
  const [date, setDate] = useState(() => {
    const m = params?.get('month');
    if (m && /^\d{4}-\d{2}$/.test(m) && m < monthKey()) {
      const [y, mo] = m.split('-').map(Number);
      return dayKey(new Date(y, mo, 0));
    }
    return dayKey();
  });
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const value = Number(amount);
  const valid = value > 0 && category !== '' && date !== '' && date <= dayKey();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await addMoneyEntry(user.uid, { type, amount: Math.round(value * 100) / 100, category, date, ...(note.trim() ? { note: note.trim() } : {}) });
      router.push('/money');
    } catch (err) {
      logger.error('Saving money entry failed', err);
      setError('Not saved. Check the internet connection and try again.');
      setSaving(false);
    }
  };

  const chip = (active: boolean) =>
    `h-12 rounded-xl px-4 text-base font-semibold ring-1 ${active ? 'bg-primary text-primary-foreground ring-primary' : 'bg-secondary ring-border'}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader title={type === 'income' ? 'Money came in' : 'Money spent'} subtitle="Money" backHref="/money" />
      <form onSubmit={save} className="mx-auto max-w-md space-y-5 p-4">
        {error && <ErrorNote message={error} />}

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1.5">
          {(['income', 'expense'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => {
                setType(t);
                setCategory('');
              }}
              className={`h-12 rounded-xl text-lg font-bold ${
                type === t ? (t === 'income' ? 'bg-brand-green text-white' : 'bg-destructive text-white') : 'text-muted-foreground'
              }`}
            >
              {t === 'income' ? 'Came in' : 'Spent'}
            </button>
          ))}
        </div>

        <label className="block space-y-2">
          <span className="text-base font-semibold">Amount</span>
          <div className="flex items-center gap-2 rounded-xl border-2 border-primary bg-card px-4">
            <span className="text-2xl font-bold text-muted-foreground">₹</span>
            <input
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              className="h-16 min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none"
            />
          </div>
        </label>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-base font-semibold">What for</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES[type].map((c) => (
              <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={chip(category === c)}>
                {c}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-base font-semibold">When</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDate(dayKey())} className={chip(date === dayKey())}>
              Today
            </button>
            <button type="button" onClick={() => setDate(yesterday())} className={chip(date === yesterday())}>
              Yesterday
            </button>
          </div>
          <input type="date" value={date} max={dayKey()} onChange={(e) => setDate(e.target.value)} aria-label="Date" className={fieldClass} />
        </fieldset>

        <label className="block space-y-2">
          <span className="text-base font-semibold">Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} className={fieldClass} />
        </label>

        <button
          type="submit"
          disabled={!valid || saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          Save
        </button>
        {!valid && amount !== '' && category === '' && <p className="text-center text-base text-muted-foreground">Pick what it was for.</p>}
      </form>
    </div>
  );
}

function AddMoneyPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <AddMoneyContent />
    </Suspense>
  );
}

export default withAuth(AddMoneyPage);
