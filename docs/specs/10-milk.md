# 10 · Milk

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
Record the daily milk with one tap and know the month's bill.

## Screens
| Route | What it does |
|---|---|
| `/milk` | App home (`ModuleHeader`: Apps, Settings). **Today** card (current month only): "Got 1.5 L today" (one tap), "Different amount", "No milk today"; once entered it shows the amount and "Change". Month switcher (no future months). Tiles: litres this month, bill (paid or to pay). **Calendar**: each day shows litres or "–"; tap a past day or today to change it (number pad, 0 = no milk). "Share bill" (WhatsApp text, to the milkman's number when set) and "Mark as paid" (tap again to undo). A card with the milkman, price and usual litres links to setup. Empty state: "Set up milk". |
| `/milk/settings` | Price per litre, usual litres (chips 0.5–2 or typed), milkman's name and mobile. Back to `/milk`. |

## Rules
- Each day keeps the price it was first saved with, so changing the price never rewrites old
  months. The bill = Σ litres × that day's rate.
- Calendar days are at least 44px wide at 360px (`gap-0.5`).

## Data (`src/firebase/apps/household.ts`)
- `users/{uid}/milkSettings/main`: `supplier`, `phone`, `rate`, `defaultLitres`.
- `users/{uid}/milkEntries/{YYYY-MM-DD}`: `date`, `month`, `litres`, `rate`.
- `users/{uid}/milkPayments/{YYYY-MM}`: `amount`, `paidAt`.

## Verify
- Harness checks (19 Nov 2026, results pending, update when the run finishes): setup → "Got 2 L today" saves 2 L at the new price → Change to 2.5 L in
  the number dialog → Mark as paid saves ₹120; empty and filled states at 360/393 px, light/dark.

## Open
- One milkman per account. Morning and evening deliveries are not separate.
- Not yet on a real phone.
