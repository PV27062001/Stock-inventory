'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Pill, Plus } from 'lucide-react';
import { ModuleHeader } from '@/components/ui/module-header';
import { HeaderButton } from '@/components/ui/page-header';
import { withAuth } from '@/components/Auth/with-auth';
import { ErrorNote, LoadingNote, StatTile } from '@/components/apps/shared';
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

  const takenCount = slots.filter((s) => taken.has(doseId(today, s.item.id, s.slot))).length;
  const refills = medicines.filter((m) => {
    const days = Math.floor((m.quantity ?? 0) / perDay(m));
    return days <= REFILL_DAYS || (m.lowStockThreshold != null && (m.quantity ?? 0) <= m.lowStockThreshold);
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleHeader title="Medicines" subtitle="மருந்துகள்" right={<HeaderButton icon={Plus} label="Add" href="/medicines/add" />} />

      {itemsLoading ? (
        <LoadingNote label="Loading medicines…" />
      ) : medicines.length === 0 ? (
        <main className="mx-auto max-w-md space-y-4 p-4 text-center">
          <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
            <Pill className="h-10 w-10 text-muted-foreground" aria-hidden />
          </div>
          <p className="text-lg font-semibold">No medicines yet</p>
          <p className="text-base text-muted-foreground">Add each medicine once with how many pills you have and when to take them.</p>
          <Link href="/medicines/add" className="mx-auto flex h-14 max-w-xs items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            <Plus className="h-6 w-6" aria-hidden /> Add medicine
          </Link>
        </main>
      ) : (
        <main className="mx-auto max-w-md space-y-5 p-4">
          {error && <ErrorNote message={error} onRetry={loadDoses} />}

          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Taken today" value={dosesLoading ? '…' : `${takenCount} of ${slots.length}`} tone={!dosesLoading && takenCount === slots.length ? 'good' : 'default'} />
            <StatTile label="Need refill" value={String(refills.length)} tone={refills.length ? 'bad' : 'good'} />
          </div>

          <section>
            <h2 className="mb-2 text-lg font-bold">Today · {dayLabel(today)}</h2>
            <ul className="space-y-2">
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
                      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.99] disabled:opacity-60 ${
                        done ? 'border-brand-green bg-brand-green/10' : 'border-border bg-card'
                      }`}
                    >
                      <span className="w-20 shrink-0 text-base font-bold text-muted-foreground">{s.label}</span>
                      <span className="min-w-0 flex-1 truncate text-lg font-semibold">{s.item.name}</span>
                      <span
                        className={`flex h-12 shrink-0 items-center gap-1 rounded-xl px-3 text-base font-bold ${
                          done ? 'bg-brand-green text-white' : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {done ? (
                          <>
                            <Check className="h-5 w-5" aria-hidden /> Taken
                          </>
                        ) : (
                          'Take'
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">Tap again to undo. Each dose counts one pill off.</p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-bold">All medicines</h2>
            <ul className="space-y-2">
              {medicines.map((m) => {
                const left = m.quantity ?? 0;
                const days = Math.floor(left / perDay(m));
                const low = refills.includes(m);
                return (
                  <li key={m.id}>
                    <Link href={`/medicines/add?id=${m.id}`} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-semibold">{m.name}</span>
                        <span className="block text-base text-muted-foreground">
                          {left} pills left · {perDay(m)} a day
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-xl px-3 py-1.5 text-base font-bold ${low ? 'bg-destructive/15 text-destructive' : 'bg-brand-green/15 text-brand-green'}`}>
                        {low ? (days <= 0 ? 'Refill now' : `${days} days · refill`) : `${days} days`}
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </main>
      )}
    </div>
  );
}

export default withAuth(MedicinesPage);
