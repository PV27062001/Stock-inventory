# 09 · Medicines

> New session: read `docs/SPEC.md`, then this file (and `02-personal-stock.md`, which owns the
> medicine items). Task: …

## Purpose
Help the parents take the right medicine at the right time and never run out.

## Screens
| Route | What it does |
|---|---|
| `/medicines` | App home (`ModuleHeader`: Apps, "Add", Settings). Tiles: taken today "n of m", medicines needing a refill. **Today**: one row per dose, sorted by time, with a big Take / Taken button (tap again to undo). **All medicines**: pills left, doses a day, days left, a red "refill" badge; tapping opens the edit form. Empty state: "Add medicine". |
| `/medicines/add` | The Personal add/edit form (02) re-exported: medicine selected, scanner and medicine-name suggestions, returns to `/medicines`. `?id=` edits. |

## Behaviour
- Medicines are the `inventory` items with `category: 'Medicine'` (02), so they are entered once.
- A medicine's doses today are its `reminderTimes` ("9:00 am"), else `dosage` slots ("Dose 1…n").
- Taking a dose writes `users/{uid}/medicineDoses/{date}_{itemId}_{slot}` and lowers the item's
  `quantity` by one; undo deletes it and adds the pill back. A failed save is undone on screen
  and says so.
- Days left = pills left ÷ doses a day. Refill when 5 days or fewer are left, or at the item's
  `lowStockThreshold`.

## Data
- `users/{uid}/medicineDoses/{id}`: `itemId`, `date` (local YYYY-MM-DD), `slot`, `takenAt`.
  Read with `date == today`. Service: `src/firebase/apps/household.ts`.

## Verify
- Harness checks (19 Nov 2026, results pending, update when the run finishes): Take lowers the pill count by one and shows "1 of 4"; undo restores it;
  a 3-pill medicine shows "3 days · refill"; empty and filled states at 360/393 px, light/dark,
  every tap target ≥ 44px.

## Open
- Not yet on a real phone. Reminders are still the existing once-a-day web notification; real
  scheduled alarms need native notifications (planned, see PLATFORM-ARCHITECTURE.md §4).
- `quantity` is assumed to count pills; a medicine entered in strips counts strips.
