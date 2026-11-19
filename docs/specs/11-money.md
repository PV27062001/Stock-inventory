# 11 · Money (bills, income and spending)

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
Know what came in, what went out and which bills are still to pay this month.

## Screens
| Route | What it does |
|---|---|
| `/money` | Month tab (`ModuleHeader`: Apps, Settings). Month switcher; tiles Came in / Spent; the balance ("Left this month" or "Spent more than came in"); big "Came in" and "Spent" buttons; a Bills card (to pay / all paid); the month's entries with a delete button (asks first). |
| `/money/bills` | Bills tab (`ModuleHeader` with "Add"). Month switcher; tiles To pay / Paid; each bill with its due date for that month ("Was due" in red when late), "Pay" (number dialog with the usual amount, changeable) or "Paid" (tap to undo, asks first). Tap a name to edit. Empty state: "Add bill". |
| `/money/add?type=income\|expense` | Came in / Spent switch, amount (number pad), what for (chips), when (Today, Yesterday or a date, never in the future), optional note. Started from a past month, the date defaults to that month's last day. |
| `/money/bill?id=` | Add or edit a bill: which bill (chips: EB, water, gas, rent, school fees, chit fund…), optional name, usual amount, due day (1–31). Edit has a red "Delete" in the top bar; past payments stay. |

## Rules
- Spent = spending entries + bills paid that month.
- A due day past the month's end moves to its last day (31 → 30 Nov).

## Data (`src/firebase/apps/household.ts`)
- `users/{uid}/bills/{id}`: `name`, `category`, `amount`, `dueDay`.
- `users/{uid}/billPayments/{billId}_{YYYY-MM}`: `billId`, `month`, `amount`, `paidAt`.
- `users/{uid}/moneyEntries/{id}`: `type` (`income`/`expense`), `amount`, `category`, `note`,
  `date`, `month`.

## Verify
- Harness checks (19 Nov 2026, results pending, update when the run finishes): add an EB bill → Pay → ₹1,200 paid; add ₹350 Vegetables → Spent shows
  ₹1,550; delete removes it; empty and filled states at 360/393 px, light/dark, tap targets ≥ 44px.

## Open
- A bill added mid-month also shows as unpaid in earlier months.
- Not yet on a real phone.
