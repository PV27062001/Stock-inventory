# 07 · Rentals and bills

> New session: read `docs/SPEC.md`, then this file. Task: …

## Status
**Off.** `SRIAMMAN_ENABLE_RENTALS` is not true, so `src/middleware.ts` makes rental routes 404, the
Rentals tab is hidden, and rental writes throw (`src/lib/features.ts`). The Ledger must work with
the flag on and off. This module was not reviewed in detail in the latest round; check the code
before relying on this spec.

## Screens (when on)
| Route | What it does |
|---|---|
| `/kirayabook/rentals` | Rental list (tab when the flag is on). |
| `/kirayabook/new-rental` | `RentalForm`: customer, items with quantity and rate, from and to dates (return date optional), advance. |
| `/kirayabook/edit-rental` | Edit a rental. |
| `/kirayabook/complete-rental/[id]` | Return and settle: amount paid today, balance or refund. |
| `/kirayabook/unsettled` | Rentals with money still owed either way. |
| `/kirayabook/bill/[id]` | Printable A5 bill and WhatsApp share. |

## Money rules (`src/lib/rental-calculations.ts`)
- Items total = Σ quantity × rate.
- Balance due = total − advance − paid today, never stored negative.
- When the advance exceeds the bill, the shop owes a refund (`refundDue`).
- Round to paise (`round2`) so float drift never shows.
- Days are counted inclusively, so a same-day rental is one day (`src/lib/bill.ts`).

## Bills
- `buildBillText` produces a monospace text bill. `shareBillOnWhatsApp` opens WhatsApp addressed to
  the customer. `printable-bill.tsx` prints A5 with Tamil text support. Bill number = the last 6
  characters of the rental id.

## Data
- Firestore `kirayabook_rentals`. Service functions are in
  `src/firebase/kirayabook/firestore-service.ts`, including `getRentalsPage`, `getUnsettledRentals`
  and `getLedgerTotals`.

## Before turning it on
- Run the full screen audit with the flag on (light and dark, every rental route).
- Check that the totals on Ledger home appear and are correct.
