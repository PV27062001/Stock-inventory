'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, MapPin, ExternalLink, Zap, ShieldCheck } from 'lucide-react';
import { DataLoader } from '@/components/app/brand-loader';

type NewsItem = { title: string; link: string; pubDate: string; source: string };

// Module-level cache so shutdown news persists across navigation (no reload flash).
let newsCache: { items: NewsItem[]; ts: number } | null = null;
const CACHE_MS = 15 * 60 * 1000;

export function ShutdownInfo() {
  const [items, setItems] = useState<NewsItem[]>(newsCache?.items ?? []);
  const [loading, setLoading] = useState(!newsCache);
  const [error, setError] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!force && newsCache && Date.now() - newsCache.ts < CACHE_MS) {
      setItems(newsCache.items);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/shutdown-news');
      if (!res.ok) throw new Error();
      const data = await res.json();
      newsCache = { items: data.items || [], ts: Date.now() };
      setItems(newsCache.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (d: string) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      {/* Location banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-amber/15">
          <Zap className="h-6 w-6 text-brand-amber" />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">Power Shutdown</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Thondamuthur, Coimbatore
          </p>
        </div>
      </div>

      {/* Official outage portal — CAPTCHA-protected, opens in the browser for the user to solve. */}
      <a
        href="https://www.tnebltd.gov.in/outages/viewshutdown.xhtml"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">Official TNPDCL outage portal</p>
          <p className="text-xs text-muted-foreground">Choose your circle &amp; enter the captcha to see planned shutdowns</p>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </a>

      <p className="px-1 pt-1 text-sm font-semibold text-foreground">Latest news</p>

      {loading ? (
        <DataLoader label="Checking latest updates…" />
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-destructive font-medium">Could not load updates.</p>
          <button onClick={() => load(true)} className="mt-3 text-primary font-semibold">Try again</button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-foreground font-medium">No recent shutdown news found.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No planned power cuts reported for your area right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <a
              key={idx}
              href={it.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <p className="font-medium leading-snug text-foreground">{it.title}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {it.source && <span className="font-medium text-primary">{it.source}</span>}
                {it.pubDate && <span>· {fmt(it.pubDate)}</span>}
                <ExternalLink className="ml-auto h-3.5 w-3.5" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Official source */}
      <a
        href="https://www.tnebltd.gov.in/outages/viewshutdown.xhtml"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground"
      >
        <span>Open official TNPDCL outage portal</span>
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </a>

      <div className="flex items-center justify-end">
        <button
          onClick={() => load(true)}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-foreground"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        News is gathered from public sources. For official, confirmed schedules use the TNPDCL outage
        portal above (it needs a captcha, so it opens in your browser).
      </p>
    </div>
  );
}
