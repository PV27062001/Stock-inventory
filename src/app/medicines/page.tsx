'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, ChevronRight, Clock, Pill, Plus } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/module-header';
import { HeaderButton } from '@/components/ui/page-header';
import { withAuth } from '@/components/Auth/with-auth';
import { EmptyState, ErrorNote, Hero, IconBadge, ListGroup, LoadingNote, Section } from '@/components/apps/shared';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { useInventory } from '@/firebase/firestore/use-inventory';
import { getDosesForDay, markDoseTaken, unmarkDose, doseId, type MedicineDose } from '@/firebase/apps/household';
import { dayKey, dayLabel, timeLabel } from '@/lib/dates';
import { logger } from '@/lib/logger';
import type { InventoryItem } from '@/types';

// A medicine needs a refill when this many days of pills or fewer are left.
const REFILL_DAYS = 5;

type Slot = { item: InventoryItem; slot: string; label: string; sortKey: string };

/** Today's doses for one medicine: its reminder times, else "Dose 1…n" from pills per day. */
const slotsFor = (item: InventoryItem): Slot[] => {
  if (item.reminderTimes?.length) {
    return item.reminderTimes.map((t) => ({ item, slot: t, label: timeLabel(t), sortKey: t }));
  }
  const n = Math.max(1, Number(item.dosage) || 1);
  return Array.from({ length: n }, (_, i) => ({ item, slot: `dose-${i + 1}`, label: `Dose ${i + 1}`, sortKey: `99:${i}` }));
};

const perDay = (item: InventoryItem) => Math.max(1, item.reminderTimes?.length || Number(item.dosage) || 1);

function MedicinesPage() {
  const { user } = useAuthUser();
  const { items, loading: itemsLoading, updateItem } = useInventory();
  const [today] = useState(dayKey);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [dosesLoading, setDosesLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const medicines = useMemo(
    () => items.filter((i) => i.category === 'Medicine').sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );
  const slots = useMemo(() => medicines.flatMap(slotsFor).sort((a, b) => a.sortKey.localeCompare(b.sortKey)), [medicines]);

  const loadDoses = useCallback(async () => {
    if (!user) return;
    setDosesLoading(true);
    setError('');
    try {
      const doses = await getDosesForDay(user.uid, today);
      setTaken(new Set(doses.map((d: MedicineDose) => d.id)));
    } catch (e) {
      logger.error('Loading doses failed', e);
      setError("Today's doses could not be loaded. Check the internet connection.");
    } finally {
      setDosesLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    loadDoses();
  }, [loadDoses]);

  /** Taken ⇄ not taken. Taking one counts a pill off the stock; undoing puts it back. */
  const toggle = async (s: Slot) => {
    if (!user || busy) return;
    const id = doseId(today, s.item.id, s.slot);
    const wasTaken = taken.has(id);
    const dose = { itemId: s.item.id, date: today, slot: s.slot };
    setBusy(id);
    setError('');
    setTaken((prev) => {
      const next = new Set(prev);
      if (wasTaken) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasTaken) {
        await unmarkDose(user.uid, dose);
        await updateItem(s.item.id, { quantity: (s.item.quantity ?? 0) + 1 });
      } else {
        await markDoseTaken(user.uid, dose);
        await updateItem(s.item.id, { quantity: Math.max(0, (s.item.quantity ?? 0) - 1) });
      }
    } catch (e) {
      logger.error('Saving dose failed', e);
      setTaken((prev) => {
        const next = new Set(prev);
        if (wasTaken) next.add(id);
        else next.delete(id);
        return next;
      });
      setError(`${s.item.name} was not saved. Check the internet connection and tap again.`);
    } finally {
      setBusy(null);
    }
  };

  const isTaken = (s: Slot) => taken.has(doseId(today, s.item.id, s.slot));
  const takenCount = slots.filter(isTaken).length;
  const next = slots.find((s) => !isTaken(s));
  const refills = medicines.filter((m) => {
    const days = Math.floor((m.quantity ?? 0) / perDay(m));
    return days <= REFILL_DAYS || (m.lowStockThreshold != null && (m.quantity ?? 0) <= m.lowStockThreshold);
  });
  const allDone = !dosesLoading && slots.length > 0 && takenCount === slots.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleHeader title="Medicines" subtitle="மருந்துகள்" right={<HeaderButton icon={Plus} label="Add" href="/medicines/add" />} />

      {itemsLoading ? (
        <LoadingNote label="Loading medicines…" />
      ) : medicines.length === 0 ? (
        <main className="mx-auto max-w-md p-4">
          <EmptyState
            icon={Pill}
            title="No medicines yet"
            text="Add each medicine once with how many pills you have and when to take them."
            action={{ label: 'Add medicine', href: '/medicines/add' }}
          />
        </main>
      ) : (
        <main className="mx-auto max-w-md space-y-6 p-4">
          {error && <ErrorNote message={error} onRetry={loadDoses} />}

          <Hero
            icon={Pill}
            eyebrow={`Today · ${dayLabel(today)}`}
            title={dosesLoading ? '…' : allDone ? 'All taken' : `${takenCount} of ${slots.length} taken`}
            subtitle={dosesLoading ? undefined : allDone ? 'Well done. See you tomorrow.' : next ? `Next: ${next.item.name} · ${next.label}` : undefined}
          >
            <div className="h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuemin={0} aria-valuemax={slots.length} aria-valuenow={takenCount}>
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${slots.length ? (takenCount / slots.length) * 100 : 0}%` }} />
            </div>
          </Hero>

          {refills.length > 0 && (
            <div className="flex items-center gap-3 rounded-3xl bg-destructive/10 p-4 ring-1 ring-destructive/25">
              <AlertTriangle className="h-6 w-6 shrink-0 text-destructive" aria-hidden />
              <p className="text-base">
                <b>{refills.length === 1 ? refills[0].name : `${refills.length} medicines`}</b> {refills.length === 1 ? 'is' : 'are'} running out. Buy more soon.
              </p>
            </div>
          )}

          <Section title="Today's doses">
            <ListGroup>
              {slots.map((s) => {
                const id = doseId(today, s.item.id, s.slot);
                const done = taken.has(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggle(s)}
                      disabled={dosesLoading || busy === id}
                      aria-pressed={done}
                      className="flex min-h-[4.5rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-secondary disabled:opacity-60"
                    >
                      <IconBadge icon={done ? Check : Clock} tone={done ? 'good' : 'primary'} />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-lg font-semibold ${done ? 'text-muted-foreground line-through decoration-2' : ''}`}>{s.item.name}</span>
                        <span className="block text-base text-muted-foreground">{s.label}</span>
                      </span>
                      <span
                        className={`flex h-12 shrink-0 items-center gap-1 rounded-full px-5 text-base font-bold ${
                          done ? 'bg-brand-green/15 text-brand-green' : 'bg-primary text-primary-foreground shadow-sm'
                        }`}
                      >
                        {done ? 'Taken' : 'Take'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ListGroup>
            <p className="mt-2 px-1 text-sm text-muted-foreground">Tap again to undo. Each dose counts one pill off.</p>
          </Section>

          <Section title="All medicines" action={{ label: 'Add', href: '/medicines/add' }}>
            <ListGroup>
              {medicines.map((m) => {
                const left = m.quantity ?? 0;
                const days = Math.floor(left / perDay(m));
                const low = refills.includes(m);
                return (
                  <li key={m.id}>
                    <Link href={`/medicines/add?id=${m.id}`} className="flex min-h-[4.5rem] items-center gap-3 px-4 py-3 active:bg-secondary">
                      <IconBadge icon={Pill} tone={low ? 'bad' : 'primary'} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-semibold">{m.name}</span>
                        <span className="block text-base text-muted-foreground">
                          {left} pills · {perDay(m)} a day
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${low ? 'bg-destructive/10 text-destructive' : 'bg-brand-green/15 text-brand-green'}`}>
                        {low ? (days <= 0 ? 'Refill now' : `${days} days · refill`) : `${days} days`}
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ListGroup>
          </Section>
        </main>
      )}
    </div>
  );
}

export default withAuth(MedicinesPage);
