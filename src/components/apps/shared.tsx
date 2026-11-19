'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, type LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { monthKey, monthLabel, shiftMonth } from '@/lib/dates';

/**
 * Shared pieces for the Medicines, Milk and Money apps, in one visual language (Material-style):
 * a coloured hero card, soft 24–28px rounded surfaces, grouped lists, pill buttons, and the app's
 * own colour (`--primary` is re-pointed per app in globals.css). SPEC §5 still applies: big
 * targets, the number pad, and errors that say what to do.
 */

/** Filled text fields: 56px tall, tonal background, app-coloured focus. */
export const fieldClass =
  'h-14 w-full rounded-2xl border-0 bg-secondary px-4 text-lg outline-none ring-1 ring-transparent transition-shadow focus:bg-card focus:ring-2 focus:ring-primary';

/** Pill buttons. `filled` = main action, `tonal` = secondary, `outline` = quiet. */
export const pill = (kind: 'filled' | 'tonal' | 'outline' = 'filled', size: 'md' | 'lg' = 'md') =>
  `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
    size === 'lg' ? 'h-14 px-6 text-lg' : 'h-12 px-5 text-base'
  } ${
    kind === 'filled'
      ? 'bg-primary text-primary-foreground shadow-sm'
      : kind === 'tonal'
        ? 'bg-primary/10 text-primary dark:bg-primary/20'
        : 'bg-card text-foreground ring-1 ring-border'
  }`;

/** Choice chips (categories, quick amounts): selected = app colour. */
export const chip = (active: boolean) =>
  `h-12 rounded-full px-4 text-base font-semibold transition-colors ${
    active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-foreground ring-1 ring-border/70'
  }`;

export function LoadingNote({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-10 text-base text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden /> {label}
    </div>
  );
}

/** A failure the person can act on: what happened, and a retry. */
export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-3xl bg-destructive/10 p-4 text-base ring-1 ring-destructive/30">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={`${pill('outline')} mt-2`}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * The coloured card at the top of each app: the one number that matters right now.
 * Uses the app colour as a soft gradient, white text, large figures.
 */
export function Hero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[hsl(var(--app-bar))] to-[hsl(var(--app-bar)/0.82)] p-5 text-white shadow-elevated">
      {Icon && <Icon className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 text-white/10" aria-hidden />}
      <p className="relative text-sm font-semibold uppercase tracking-wider text-white/80">{eyebrow}</p>
      <p className="relative mt-1 text-[2rem] font-bold leading-tight tabular-nums">{title}</p>
      {subtitle && <p className="relative mt-1 text-base text-white/85">{subtitle}</p>}
      {children && <div className="relative mt-4">{children}</div>}
    </section>
  );
}

/** A titled block of the page, with an optional link on the right. */
export function Section({ title, action, children }: { title: string; action?: { label: string; href: string }; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex min-h-11 items-center justify-between gap-2 px-1">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {action && (
          <Link href={action.href} className="flex h-11 items-center gap-0.5 rounded-full px-3 text-base font-semibold text-primary">
            {action.label}
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Rows inside one rounded card with hairline dividers (Google Settings style). */
export function ListGroup({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-border/70 overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-border/60">{children}</ul>;
}

/** Round tonal icon, used at the start of list rows. */
export function IconBadge({ icon: Icon, tone = 'primary' }: { icon: LucideIcon; tone?: 'primary' | 'good' | 'bad' | 'muted' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary dark:bg-primary/20',
    good: 'bg-brand-green/15 text-brand-green',
    bad: 'bg-destructive/10 text-destructive',
    muted: 'bg-secondary text-muted-foreground',
  };
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

/** Friendly empty state: big tonal icon, a line of help, one action. */
export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center px-4 pt-8 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-primary/10 text-primary dark:bg-primary/20">
        <Icon className="h-12 w-12" aria-hidden />
      </span>
      <p className="mt-5 text-xl font-bold">{title}</p>
      <p className="mt-2 max-w-xs text-base text-muted-foreground">{text}</p>
      <Link href={action.href} className={`${pill('filled', 'lg')} mt-6`}>
        {action.label}
      </Link>
    </div>
  );
}

/** ‹ November 2026 › with 48px arrows; the right arrow stops at the current month. */
export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const atNow = month >= monthKey();
  const arrow = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors disabled:opacity-30';
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={arrow} onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        <ChevronLeft className="h-6 w-6" aria-hidden />
      </button>
      <p className="min-w-0 flex-1 truncate text-center text-lg font-bold tracking-tight">{monthLabel(month)}</p>
      <button type="button" className={arrow} onClick={() => onChange(shiftMonth(month, 1))} disabled={atNow} aria-label="Next month">
        <ChevronRight className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}

/** Small summary figure on a soft card. */
export function StatTile({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-brand-green' : tone === 'bad' ? 'text-destructive' : 'text-foreground';
  return (
    <div className="min-w-0 rounded-3xl bg-card p-4 shadow-soft ring-1 ring-border/60">
      <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-2xl font-bold tabular-nums tracking-tight ${color}`}>{value}</p>
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
        // The dialog's own close (✕) is the last button: make it a 44px target.
        className="w-[calc(100%-2rem)] max-w-sm rounded-[28px] border-0 p-6 [&>button:last-child]:right-3 [&>button:last-child]:top-3 [&>button:last-child]:flex [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:rounded-full [&>button:last-child>svg]:h-6 [&>button:last-child>svg]:w-6"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="pr-10 text-xl font-bold">{title}</DialogTitle>
        {description && <DialogDescription className="text-base">{description}</DialogDescription>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 ring-2 ring-primary">
            {unit === '₹' && <span className="text-2xl font-bold text-muted-foreground">₹</span>}
            <input
              ref={inputRef}
              inputMode="decimal"
              enterKeyHint="done"
              value={text}
              onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ''))}
              className="h-16 min-w-0 flex-1 bg-transparent text-3xl font-bold tabular-nums outline-none"
              aria-label={title}
            />
            {unit && unit !== '₹' && <span className="text-xl font-semibold text-muted-foreground">{unit}</span>}
          </div>
          {quick.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quick.map((q) => (
                <button key={q} type="button" onClick={() => setText(String(q))} className={`${chip(Number(text) === q && text !== '')} min-w-16`}>
                  {q}
                  {unit && unit !== '₹' ? ` ${unit}` : ''}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${pill('tonal', 'lg')} flex-1`}>
              Cancel
            </button>
            <button type="submit" disabled={!valid || saving} className={`${pill('filled', 'lg')} flex-1`}>
              {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {saveLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
