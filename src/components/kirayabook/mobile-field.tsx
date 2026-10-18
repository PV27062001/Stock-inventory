'use client';

import { Phone, MessageCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  isValidMobile,
  mobileError,
  normalizeMobile,
  toCallNumber,
  toWhatsAppNumber,
  isVerificationStale,
} from '@/lib/phone';

/**
 * Mobile entry with format validation and a reachability confirmation.
 * Verification is recorded only after the owner actually reaches the customer,
 * so a wrong-but-well-formed number can't silently pass.
 */
export function MobileField({
  value,
  onChange,
  verifiedAt,
  onVerifiedChange,
  showError,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  verifiedAt?: Date;
  onVerifiedChange: (verifiedAt: Date | undefined) => void;
  showError?: boolean;
  className?: string;
}) {
  const digits = normalizeMobile(value);
  const valid = isValidMobile(value);
  const error = showError ? mobileError(value) : '';
  const stale = verifiedAt ? isVerificationStale(verifiedAt) : false;
  const verified = !!verifiedAt && !stale;

  const inputClass =
    className ??
    'bg-card border border-border/60 h-14 rounded-xl text-lg w-full px-4 placeholder:text-muted-foreground shadow-soft transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary focus-visible:shadow-elevated';

  return (
    <div className="space-y-2">
      <Input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder="Mobile Number"
        value={value}
        // Keep storage as bare digits so existing records stay compatible.
        onChange={(e) => {
          const next = normalizeMobile(e.target.value);
          onChange(next);
          if (next !== digits) onVerifiedChange(undefined);
        }}
        className={inputClass}
      />

      {error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {valid && !verified && (
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <p className="text-sm text-muted-foreground">
            Confirm this number is reachable, then mark it verified.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <a
              href={toCallNumber(digits) ? `tel:${toCallNumber(digits)}` : undefined}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-95"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={`https://wa.me/${toWhatsAppNumber(digits)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white active:scale-95"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <Button
              type="button"
              variant="outline"
              onClick={() => onVerifiedChange(new Date())}
              className="h-11 rounded-xl text-sm font-semibold"
            >
              Mark verified
            </Button>
          </div>
          {stale && (
            <p className="mt-2 text-xs text-brand-amber">
              Last confirmed over 6 months ago — please re-check.
            </p>
          )}
        </div>
      )}

      {verified && (
        <div className="flex items-center justify-between rounded-xl border border-brand-green/30 bg-brand-green/10 px-3 py-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-green">
            <CheckCircle2 className="h-4 w-4" />
            Verified {verifiedAt?.toLocaleDateString('en-IN')}
          </span>
          <button
            type="button"
            onClick={() => onVerifiedChange(undefined)}
            className="text-xs font-medium text-muted-foreground underline"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
