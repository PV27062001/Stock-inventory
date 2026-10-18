'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { DataLoader } from '@/components/app/brand-loader';

type Rates = {
  currency: string;
  city?: string;
  updatedAt: string;
  goldPerGram: { '24': number; '22': number; '18': number };
  silverPerGram: number;
  source: string;
};

const WEIGHTS = [1, 8, 10, 50, 100];
const PURITIES = ['22', '24', '18'] as const;
type Purity = (typeof PURITIES)[number];

const inr = (n: number) =>
  '\u20B9' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

// Module-level cache so the price persists across navigation (no reload flash).
let ratesCache: { data: Rates; ts: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export function GoldSilverRates() {
  const [rates, setRates] = useState<Rates | null>(ratesCache?.data ?? null);
  const [loading, setLoading] = useState(!ratesCache);
  const [error, setError] = useState(false);
  const [metal, setMetal] = useState<'gold' | 'silver'>('gold');
  const [purity, setPurity] = useState<Purity>('22');

  const load = useCallback(async (force = false) => {
    // Serve fresh cache instantly; only hit the network when stale or forced.
    if (!force && ratesCache && Date.now() - ratesCache.ts < CACHE_MS) {
      setRates(ratesCache.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/metal-rates');
      if (!res.ok) throw new Error();
      const data = await res.json();
      ratesCache = { data, ts: Date.now() };
      setRates(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const perGram =
    metal === 'gold' && rates ? rates.goldPerGram[purity] : rates?.silverPerGram ?? 0;

  return (
    <div className="space-y-4">
      {/* Metal switch + refresh (kept at the top so it's reachable without scrolling) */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1.5 rounded-2xl border border-border bg-background p-1.5">
          {(['gold', 'silver'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetal(m)}
              className={`flex-1 h-12 rounded-xl text-base font-semibold capitalize transition-colors ${
                metal === m ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              {m === 'gold' ? '\uD83E\uDD47 Gold' : '\uD83E\uDD48 Silver'}
            </button>
          ))}
        </div>
        <button
          onClick={() => load(true)}
          aria-label="Refresh rates"
          disabled={loading}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <DataLoader label="Loading live rates…" />
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-destructive font-medium">Could not load live rates.</p>
          <button onClick={() => load(true)} className="mt-3 text-primary font-semibold">Try again</button>
        </div>
      ) : (
        <>
          {/* Gold purity selector */}
          {metal === 'gold' && (
            <div className="flex gap-2">
              {PURITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPurity(p)}
                  className={`flex-1 h-12 rounded-xl border text-base font-semibold transition-colors ${
                    purity === p
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {p}K
                </button>
              ))}
            </div>
          )}

          {/* Headline per-gram card */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-5 text-center shadow-soft">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {metal === 'gold' ? `Gold ${purity}K` : 'Silver'} · per gram
            </p>
            <p className="mt-1 text-4xl font-bold text-primary">{inr(perGram)}</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> {rates?.city || 'Coimbatore'} rate today
            </p>
          </div>

          {/* Weight table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {WEIGHTS.map((w, i) => (
              <div
                key={w}
                className={`flex items-center justify-between px-5 py-4 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <span className="text-lg font-medium text-foreground">{w} gram</span>
                <span className="text-lg font-bold text-primary">{inr(perGram * w)}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="px-1 text-xs text-muted-foreground">
            Updated: {rates ? new Date(rates.updatedAt).toLocaleString('en-IN') : '\u2014'}
          </p>
          <p className="px-1 text-xs text-muted-foreground">
            {rates?.source ? `Source: ${rates.source}. ` : ''}Price excludes making charges & GST — confirm
            the final amount with your jeweller.
          </p>
        </>
      )}
    </div>
  );
}
