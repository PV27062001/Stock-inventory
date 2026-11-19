'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Milk, Pencil, Settings2, Share2, X } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/module-header';
import { withAuth } from '@/components/Auth/with-auth';
import { ErrorNote, LoadingNote, MonthSwitcher, NumberDialog, StatTile } from '@/components/apps/shared';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import {
  clearMilkPaid,
  getMilkMonth,
  getMilkPayment,
  getMilkSettings,
  setMilkDay,
  setMilkPaid,
  type MilkEntry,
  type MilkPayment,
  type MilkSettings,
} from '@/firebase/apps/household';
import { dayKey, dayLabel, daysInMonth, monthKey, monthLabel, monthStart, rupees } from '@/lib/dates';
import { logger } from '@/lib/logger';

const LITRE_CHIPS = [0.5, 1, 1.5, 2, 3];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const litres = (n: number) => `${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;

function MilkPage() {
  const { user } = useAuthUser();
  const [settings, setSettings] = useState<MilkSettings | null>(null);
  const [month, setMonth] = useState(monthKey);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [payment, setPayment] = useState<MilkPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDay, setEditDay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const today = dayKey();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [s, e, p] = await Promise.all([getMilkSettings(user.uid), getMilkMonth(user.uid, month), getMilkPayment(user.uid, month)]);
      setSettings(s);
      setEntries(e);
      setPayment(p);
    } catch (err) {
      logger.error('Loading milk failed', err);
      setError('Milk details could not be loaded. Check the internet connection.');
    } finally {
      setLoading(false);
    }
  }, [user, month]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);
  const totalLitres = entries.reduce((s, e) => s + e.litres, 0);
  const totalAmount = Math.round(entries.reduce((s, e) => s + e.litres * e.rate, 0) * 100) / 100;
  const todayEntry = byDay.get(today);

  const saveDay = async (date: string, l: number) => {
    if (!user || !settings) return;
    setSaving(true);
    setError('');
    try {
      // Keep the rate the day was first saved with, so a later rate change never rewrites old bills.
      const rate = byDay.get(date)?.rate ?? settings.rate;
      await setMilkDay(user.uid, date, l, rate);
      const entry: MilkEntry = { id: date, date, month: date.slice(0, 7), litres: l, rate };
      setEntries((prev) => [...prev.filter((e) => e.date !== date), entry]);
      setEditDay(null);
    } catch (err) {
      logger.error('Saving milk failed', err);
      setError(`${dayLabel(date)} was not saved. Check the internet connection and try again.`);
    } finally {
      setSaving(false);
    }
  };

  const togglePaid = async () => {
    if (!user) return;
    setError('');
    try {
      if (payment) {
        await clearMilkPaid(user.uid, month);
        setPayment(null);
      } else {
        await setMilkPaid(user.uid, month, totalAmount);
        setPayment({ id: month, amount: totalAmount });
      }
    } catch (err) {
      logger.error('Saving milk payment failed', err);
      setError('Payment was not saved. Check the internet connection and try again.');
    }
  };

  const shareBill = () => {
    if (!settings) return;
    const days = entries.filter((e) => e.litres > 0).length;
    const text = [
      `Milk bill · ${monthLabel(month)}`,
      `${settings.supplier}`,
      `${days} days · ${litres(totalLitres)}`,
      `Total: ${rupees(totalAmount)}`,
      payment ? 'Paid ✓' : '',
    ]
      .filter(Boolean)
      .join('\n');
    const phone = settings.phone?.replace(/\D/g, '');
    const to = phone ? (phone.length === 10 ? `91${phone}` : phone) : '';
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Calendar cells: blanks before day 1, then each day of the month.
  const first = monthStart(month);
  const cells: (string | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleHeader title="Milk" subtitle="பால் கணக்கு" />

      {loading && !settings ? (
        <LoadingNote label="Loading milk…" />
      ) : !settings ? (
        <main className="mx-auto max-w-md space-y-4 p-4 text-center">
          {error ? (
            <ErrorNote message={error} onRetry={load} />
          ) : (
            <>
              <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
                <Milk className="h-10 w-10 text-muted-foreground" aria-hidden />
              </div>
              <p className="text-lg font-semibold">Set up your milk once</p>
              <p className="text-base text-muted-foreground">Enter the milkman's name, the price per litre and how much you usually take.</p>
              <Link href="/milk/settings" className="mx-auto flex h-14 max-w-xs items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                Set up milk
              </Link>
            </>
          )}
        </main>
      ) : (
        <main className="mx-auto max-w-md space-y-5 p-4">
          {error && <ErrorNote message={error} onRetry={load} />}

          {month === monthKey() && (
            <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-base font-semibold text-muted-foreground">Today · {dayLabel(today)}</p>
              {todayEntry ? (
                <div className="mt-2 flex items-center gap-3">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${todayEntry.litres > 0 ? 'bg-brand-green text-white' : 'bg-secondary'}`}>
                    {todayEntry.litres > 0 ? <Check className="h-6 w-6" aria-hidden /> : <X className="h-6 w-6" aria-hidden />}
                  </span>
                  <p className="min-w-0 flex-1 text-xl font-bold">{todayEntry.litres > 0 ? `${litres(todayEntry.litres)} received` : 'No milk today'}</p>
                  <button type="button" onClick={() => setEditDay(today)} className="flex h-12 shrink-0 items-center gap-1 rounded-xl bg-secondary px-3 text-base font-semibold">
                    <Pencil className="h-5 w-5" aria-hidden /> Change
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => saveDay(today, settings.defaultLitres)}
                    className="flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xl font-bold text-primary-foreground disabled:opacity-60"
                  >
                    <Check className="h-7 w-7" aria-hidden /> Got {litres(settings.defaultLitres)} today
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setEditDay(today)} className="h-12 rounded-xl bg-secondary text-base font-semibold">
                      Different amount
                    </button>
                    <button type="button" disabled={saving} onClick={() => saveDay(today, 0)} className="h-12 rounded-xl bg-secondary text-base font-semibold disabled:opacity-60">
                      No milk today
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <MonthSwitcher month={month} onChange={setMonth} />

          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Milk this month" value={litres(totalLitres)} />
            <StatTile label={payment ? 'Bill · paid' : 'Bill to pay'} value={rupees(totalAmount)} tone={payment ? 'good' : 'default'} />
          </div>

          {loading ? (
            <LoadingNote />
          ) : (
            <section aria-label="Days of the month">
              {/* gap-0.5 keeps each day at least 44px wide on a 360px phone. */}
              <div className="grid grid-cols-7 gap-0.5 text-center text-sm font-semibold text-muted-foreground">
                {WEEKDAYS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-0.5">
                {cells.map((date, i) => {
                  if (!date) return <span key={`b${i}`} />;
                  const e = byDay.get(date);
                  const future = date > today;
                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={future}
                      onClick={() => setEditDay(date)}
                      aria-label={`${dayLabel(date)}: ${e ? (e.litres > 0 ? litres(e.litres) : 'no milk') : 'not entered'}`}
                      className={`flex h-14 flex-col items-center justify-center rounded-xl text-sm ring-1 disabled:opacity-30 ${
                        e && e.litres > 0
                          ? 'bg-brand-green/15 ring-brand-green/40'
                          : e
                            ? 'bg-secondary ring-border'
                            : 'bg-card ring-border'
                      } ${date === today ? 'ring-2 ring-primary' : ''}`}
                    >
                      <span className="font-bold">{Number(date.slice(8))}</span>
                      <span className="text-xs text-muted-foreground">{e ? (e.litres > 0 ? e.litres : '–') : ''}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Tap a day to change it. Green = milk came, – = no milk.</p>
            </section>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={shareBill} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-secondary text-base font-semibold">
              <Share2 className="h-5 w-5" aria-hidden /> Share bill
            </button>
            <button
              type="button"
              onClick={togglePaid}
              disabled={totalAmount === 0 && !payment}
              className={`flex h-14 items-center justify-center gap-2 rounded-xl text-base font-bold disabled:opacity-50 ${
                payment ? 'bg-brand-green text-white' : 'bg-primary text-primary-foreground'
              }`}
            >
              {payment ? (
                <>
                  <Check className="h-5 w-5" aria-hidden /> Paid
                </>
              ) : (
                'Mark as paid'
              )}
            </button>
          </div>
          <Link href="/milk/settings" className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 shadow-soft">
            <Settings2 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 text-base">
              <span className="block truncate font-semibold">{settings.supplier}</span>
              <span className="block text-muted-foreground">
                {rupees(settings.rate)} a litre · usually {litres(settings.defaultLitres)}
              </span>
            </span>
            <span className="shrink-0 text-base font-semibold text-primary">Change</span>
          </Link>
        </main>
      )}

      <NumberDialog
        open={editDay !== null}
        title={editDay ? `Milk on ${dayLabel(editDay)}` : ''}
        description="Litres received. Enter 0 for no milk."
        initial={editDay ? byDay.get(editDay)?.litres ?? settings?.defaultLitres : undefined}
        unit="L"
        quick={[0, ...LITRE_CHIPS]}
        allowZero
        onSave={(v) => (editDay ? saveDay(editDay, v) : undefined)}
        onClose={() => setEditDay(null)}
      />
    </div>
  );
}

export default withAuth(MilkPage);
