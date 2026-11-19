# 10 · Milk

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
Record the daily milk with one tap and know the month's bill.

## Screens
| Route | What it does |
|---|---|
| `/milk` | App home (`ModuleHeader`: Apps, Settings). Opens on **today**: a coloured card shows the selected day and what was entered ("1½ litres · ₹78", "No milk" or "Not entered yet"). **How much milk?**: eight litre buttons ¼ ½ ¾ 1 1¼ 1½ 1¾ 2 (one tap saves, the chosen one is filled), "No milk", and "Other amount" (number pad for 2.5, 3…). **Calendar**: month grid with each day's litres; tap a day to select it (the page scrolls back to the buttons; "Back to today" returns); future days are disabled; changing month selects today or that month's last day. **Bill**: litres and amount for the month, "Share bill" (WhatsApp text, to the milkman's number when set) and "Mark as paid" (tap again to undo). A row with the milkman, price and usual litres opens setup. Empty state: "Set up milk". |
| `/milk/settings` | Price per litre, usual litres (chips ¼–2 or typed), milkman's name and mobile. Back to `/milk`. |

## Rules
- Each day keeps the price it was first saved with, so changing the price never rewrites old
  months. The bill = Σ litres × that day's rate.
- Calendar days are at least 44px wide at 360px (no gaps, 8px card padding).
- Litres show as fractions (`litreText`: 1.5 → "1½").

## Data (`src/firebase/apps/household.ts`)
- `users/{uid}/milkSettings/main`: `supplier`, `phone`, `rate`, `defaultLitres`.
- `users/{uid}/milkEntries/{YYYY-MM-DD}`: `date`, `month`, `litres`, `rate`.
- `users/{uid}/milkPayments/{YYYY-MM}`: `amount`, `paidAt`.

## Verify
- Harness checks (19 Nov 2026, results pending, update when the run finishes): setup → opens on
  today ("Not entered yet") → tap "2" saves 2 L at the new price → Other amount 2.5 L → pick the
  1st in the calendar → tap "½" saves 0.5 L for that day → Mark as paid saves ₹144; empty and
  filled states at 360/393 px, light/dark.

## Open
- One milkman per account. Morning and evening deliveries are not separate.
- Not yet on a real phone.
