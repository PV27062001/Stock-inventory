'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Loader2, Milk, Pencil, Settings2, Share2 } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/module-header';
import { withAuth } from '@/components/Auth/with-auth';
import {
  EmptyState,
  ErrorNote,
  Hero,
  IconBadge,
  ListGroup,
  LoadingNote,
  MonthSwitcher,
  NumberDialog,
  Section,
  StatTile,
  pill,
} from '@/components/apps/shared';
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

// One tap per amount, the way milk is actually bought (quarter litres).
const LITRE_BUTTONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FRACTIONS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

/** 1.5 → "1½", 0.25 → "¼", 2.3 → "2.3" */
const litreText = (n: number) => {
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 100) / 100;
  if (frac === 0) return String(whole);
  if (FRACTIONS[frac]) return `${whole || ''}${FRACTIONS[frac]}`;
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};
const litres = (n: number) => `${litreText(n)} L`;

function MilkPage() {
  const { user } = useAuthUser();
  const today = dayKey();
  const [settings, setSettings] = useState<MilkSettings | null>(null);
  // The day being entered: today when the app opens, any past day from the calendar.
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(monthKey);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [payment, setPayment] = useState<MilkPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [savingValue, setSavingValue] = useState<number | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);

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
      setLoaded(true);
    }
  }, [user, month]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);
  const totalLitres = entries.reduce((s, e) => s + e.litres, 0);
  const totalAmount = Math.round(entries.reduce((s, e) => s + e.litres * e.rate, 0) * 100) / 100;
  // The selected day's entry is only in `entries` while its month is the one shown.
  const entry = selected.startsWith(month) ? byDay.get(selected) : undefined;

  const saveDay = async (l: number) => {
    if (!user || !settings || savingValue !== null) return;
    const date = selected;
    setSavingValue(l);
    setError('');
    try {
      // Keep the rate the day was first saved with, so a later rate change never rewrites old bills.
      const rate = byDay.get(date)?.rate ?? settings.rate;
      await setMilkDay(user.uid, date, l, rate);
      if (date.startsWith(month)) {
        setEntries((prev) => [...prev.filter((e) => e.date !== date), { id: date, date, month: date.slice(0, 7), litres: l, rate }]);
      }
      setOtherOpen(false);
    } catch (err) {
      logger.error('Saving milk failed', err);
      setError(`${dayLabel(date)} was not saved. Check the internet connection and tap again.`);
    } finally {
      setSavingValue(null);
    }
  };

  const pickDay = (date: string) => {
    setSelected(date);
    setMonth(date.slice(0, 7));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Another month in the calendar: select today there, else that month's last day, so the litre
  // buttons always show which day they will save.
  const changeMonth = (m: string) => {
    setMonth(m);
    setSelected(m === monthKey() ? today : `${m}-${String(daysInMonth(m)).padStart(2, '0')}`);
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
    const text = [`Milk bill · ${monthLabel(month)}`, settings.supplier, `${days} days · ${litres(totalLitres)}`, `Total: ${rupees(totalAmount)}`, payment ? 'Paid ✓' : '']
      .filter(Boolean)
      .join('\n');
    const phone = settings.phone?.replace(/\D/g, '');
    const to = phone ? (phone.length === 10 ? `91${phone}` : phone) : '';
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const first = monthStart(month);
  const cells: (string | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`),
  ];
  const isToday = selected === today;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleHeader title="Milk" subtitle="பால் கணக்கு" />

      {!loaded ? (
        <LoadingNote label="Loading milk…" />
      ) : !settings ? (
        <main className="mx-auto max-w-md p-4">
          {error ? (
            <ErrorNote message={error} onRetry={load} />
          ) : (
            <EmptyState
              icon={Milk}
              title="Set up your milk once"
              text="Enter the price per litre and how much milk usually comes. Then it is one tap a day."
              action={{ label: 'Set up milk', href: '/milk/settings' }}
            />
          )}
        </main>
      ) : (
        <main className="mx-auto max-w-md space-y-6 p-4">
          {error && <ErrorNote message={error} onRetry={load} />}

          <Hero
            icon={Milk}
            eyebrow={isToday ? `Today · ${dayLabel(selected)}` : dayLabel(selected)}
            title={entry ? (entry.litres > 0 ? `${litreText(entry.litres)} litre${entry.litres > 1 ? 's' : ''}` : 'No milk') : 'Not entered yet'}
            subtitle={
              entry && entry.litres > 0
                ? `${rupees(Math.round(entry.litres * entry.rate * 100) / 100)} · ${settings.supplier}`
                : entry
                  ? settings.supplier
                  : 'Tap how much milk came'
            }
          >
            {!isToday && (
              <button type="button" onClick={() => pickDay(today)} className="h-11 rounded-full bg-white/20 px-4 text-base font-semibold text-white ring-1 ring-white/40">
                Back to today
              </button>
            )}
          </Hero>

          <Section title="How much milk?">
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Litres">
              {LITRE_BUTTONS.map((l) => {
                const active = entry?.litres === l;
                return (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={active}
                    disabled={savingValue !== null}
                    onClick={() => saveDay(l)}
                    className={`relative flex h-16 flex-col items-center justify-center rounded-2xl transition-all active:scale-95 ${
                      active ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card ring-1 ring-border/70 shadow-soft'
                    }`}
                  >
                    {savingValue === l ? (
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                    ) : (
                      <>
                        <span className="text-2xl font-bold leading-none">{litreText(l)}</span>
                        <span className={`mt-0.5 text-xs font-semibold ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>litre</span>
                      </>
                    )}
                    {active && <Check className="absolute right-1.5 top-1.5 h-4 w-4" aria-hidden />}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={entry?.litres === 0}
                disabled={savingValue !== null}
                onClick={() => saveDay(0)}
                className={entry?.litres === 0 ? pill('filled') : pill('tonal')}
              >
                {entry?.litres === 0 && <Check className="h-5 w-5" aria-hidden />}
                No milk
              </button>
              <button type="button" disabled={savingValue !== null} onClick={() => setOtherOpen(true)} className={pill('outline')}>
                <Pencil className="h-5 w-5" aria-hidden />
                {entry && entry.litres > 0 && !LITRE_BUTTONS.includes(entry.litres) ? litres(entry.litres) : 'Other amount'}
              </button>
            </div>
          </Section>

          <Section title="Calendar">
            <div className="rounded-3xl bg-card p-2 shadow-soft ring-1 ring-border/60">
              <div className="px-1 pb-2 pt-1">
                <MonthSwitcher month={month} onChange={changeMonth} />
              </div>
              <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground">
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className="py-1">
                    {d}
                  </span>
                ))}
              </div>
              {loading ? (
                <LoadingNote />
              ) : (
                <div className="grid grid-cols-7">
                  {cells.map((date, i) => {
                    if (!date) return <span key={`b${i}`} />;
                    const e = byDay.get(date);
                    const future = date > today;
                    const isSel = date === selected;
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={future}
                        onClick={() => pickDay(date)}
                        aria-pressed={isSel}
                        aria-label={`${dayLabel(date)}: ${e ? (e.litres > 0 ? litres(e.litres) : 'no milk') : 'not entered'}`}
                        className="flex h-14 flex-col items-center justify-center disabled:opacity-30"
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold ${
                            isSel
                              ? 'bg-primary text-primary-foreground'
                              : date === today
                                ? 'text-primary ring-2 ring-primary'
                                : e && e.litres > 0
                                  ? 'bg-primary/15 text-foreground dark:bg-primary/25'
                                  : ''
                          }`}
                        >
                          {Number(date.slice(8))}
                        </span>
                        <span className="h-4 text-xs font-medium leading-4 text-muted-foreground">{e ? (e.litres > 0 ? litreText(e.litres) : '–') : ''}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-2 px-1 text-sm text-muted-foreground">Tap a day to enter or change its milk.</p>
          </Section>

          <Section title={`${monthLabel(month)} bill`}>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Milk" value={litres(totalLitres)} />
              <StatTile label={payment ? 'Paid' : 'To pay'} value={rupees(totalAmount)} tone={payment ? 'good' : 'default'} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={shareBill} className={pill('tonal')}>
                <Share2 className="h-5 w-5" aria-hidden /> Share bill
              </button>
              <button type="button" onClick={togglePaid} disabled={totalAmount === 0 && !payment} className={payment ? `${pill('filled')} !bg-brand-green !text-white` : pill('filled')}>
                {payment ? (
                  <>
                    <Check className="h-5 w-5" aria-hidden /> Paid
                  </>
                ) : (
                  'Mark as paid'
                )}
              </button>
            </div>
          </Section>

          <ListGroup>
            <li>
              <Link href="/milk/settings" className="flex min-h-16 items-center gap-3 px-4 py-3">
                <IconBadge icon={Settings2} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold">{settings.supplier}</span>
                  <span className="block text-sm text-muted-foreground">
                    {rupees(settings.rate)} a litre · usually {litres(settings.defaultLitres)}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          </ListGroup>
        </main>
      )}

      <NumberDialog
        open={otherOpen}
        title={`Milk on ${dayLabel(selected)}`}
        description="Type the litres, for example 2.5 or 3."
        initial={entry?.litres || undefined}
        unit="L"
        onSave={(v) => saveDay(v)}
        onClose={() => setOtherOpen(false)}
      />
    </div>
  );
}

export default withAuth(MilkPage);
