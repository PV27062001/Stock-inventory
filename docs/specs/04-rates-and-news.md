# 04 · Rates and news

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
Two information panels on the Personal home (`/inventory`): today's gold and silver rates, and
planned power shutdowns.

## Gold and silver (`/api/metal-rates`, `src/components/app/gold-silver-rates.tsx`)
- **Primary source:** GoodReturns Coimbatore retail pages (what jewellers quote). Rupee amounts are
  read from the first row under each table heading. Silver per gram = the 10-gram figure ÷ 10.
- **Fallback:** international spot price (gold-api.com, USD per ounce) converted with the
  open.er-api.com rate (1 troy ounce = 31.1034768 g).
- The server caches the result for 5 minutes and the exchange rate for 1 hour. The component keeps a
  module-level cache so it doesn't flash on navigation.
- The panel switches between gold and silver and shows purity (22k default).
- `/api/gold-debug` is disabled and returns nothing useful.

## Power shutdowns (`/api/shutdown-news`, `src/components/app/shutdown-info.tsx`)
- Google News RSS search, refreshed every 30 minutes, plus links to the official TNEB outage page
  (`tnebltd.gov.in/outages/viewshutdown.xhtml`).

## Rules
- Both depend on outside websites: show the last known value or a clear "could not load" message,
  never an empty panel.
- These routes run during the build (they took over 60 seconds once and were retried), so keep
  their timeouts short.

## Open
- The GoodReturns page layout can change and silently break parsing. Not reviewed in this round.
