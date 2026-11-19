'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { monthKey, monthLabel, shiftMonth } from '@/lib/dates';

/** Shared pieces for the Medicines, Milk and Money apps (SPEC §5: big targets, number pad, clear errors). */

/** Text and number fields in the apps' forms: 56px tall, large text. */
export const fieldClass =
  'h-14 w-full rounded-xl border border-border bg-card px-4 text-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/30';

export function LoadingNote({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-base text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {label}
    </div>
  );
}

/** A failure the person can act on: what happened, and a retry. */
export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-base">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-2 h-11 rounded-xl bg-card px-4 font-semibold text-primary ring-1 ring-border">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/** ‹ November 2026 › with 48px arrows; the right arrow stops at the current month. */
export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const atNow = month >= monthKey();
  const arrow = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card ring-1 ring-border disabled:opacity-40';
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={arrow} onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        <ChevronLeft className="h-6 w-6" aria-hidden />
      </button>
      <p className="min-w-0 flex-1 truncate text-center text-lg font-bold">{monthLabel(month)}</p>
      <button type="button" className={arrow} onClick={() => onChange(shiftMonth(month, 1))} disabled={atNow} aria-label="Next month">
        <ChevronRight className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}

/** Coloured summary tile used on every app's home. */
export function StatTile({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-brand-green' : tone === 'bad' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-3 shadow-soft">
      <p className="truncate text-sm font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

/**
 * Number entry for amounts and litres: opens the number pad (decimal), quick-pick chips, and two
 * big buttons. Returns the number through `onSave`; an empty or invalid value is not accepted.
 */
export function NumberDialog({
  open,
  title,
  description,
  initial,
  unit,
  quick = [],
  allowZero = false,
  saveLabel = 'Save',
  onSave,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  initial?: number;
  unit?: string;
  quick?: number[];
  allowZero?: boolean;
  saveLabel?: string;
  onSave: (value: number) => void | Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText(initial != null ? String(initial) : '');
      setSaving(false);
    }
  }, [open, initial]);

  const value = Number(text);
  const valid = text.trim() !== '' && Number.isFinite(value) && (allowZero ? value >= 0 : value > 0);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave(Math.round(value * 100) / 100);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="pr-8 text-xl">{title}</DialogTitle>
        {description && <DialogDescription className="text-base">{description}</DialogDescription>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 rounded-2xl border-2 border-primary bg-card px-4">
            {unit === '₹' && <span className="text-2xl font-bold text-muted-foreground">₹</span>}
            <input
              ref={inputRef}
              inputMode="decimal"
              enterKeyHint="done"
              value={text}
              onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ''))}
              className="h-16 min-w-0 flex-1 bg-transparent text-3xl font-bold outline-none"
              aria-label={title}
            />
            {unit && unit !== '₹' && <span className="text-xl font-semibold text-muted-foreground">{unit}</span>}
          </div>
          {quick.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setText(String(q))}
                  className={`h-12 min-w-16 rounded-xl px-4 text-lg font-semibold ring-1 ${
                    Number(text) === q && text !== '' ? 'bg-primary text-primary-foreground ring-primary' : 'bg-secondary ring-border'
                  }`}
                >
                  {q}
                  {unit && unit !== '₹' ? ` ${unit}` : ''}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-14 flex-1 rounded-xl bg-secondary text-lg font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid || saving}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-bold text-primary-foreground disabled:opacity-50"
            >
              {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {saveLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
