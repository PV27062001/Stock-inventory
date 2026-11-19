# 02 · Personal stock

> New session: read `docs/SPEC.md`, then this file (and `03-scanner-and-lookup.md` for scanning).
> Task: …

## Purpose
The family's home stock of groceries and medicines: what is at home, what is running low, what
expires, and medicine reminders.

## Screens
| Route | What it does |
|---|---|
| `/inventory` | Personal home (`ModuleHeader`: Apps top-left, Settings top-right), with three sections: rates, shutdown news, inventory (`#inventory` opens the list directly). Personal has no bottom nav. |
| `/add-item` | Add or edit an item. `?id=` edits an existing one. |
| `/add` | Receipt scan: photo of a bill, read by AI (Genkit + Gemini 2.5 Flash), items added from it. |
| `/alerts` | Low-stock and today's medicine-reminder alerts. |

## Add / edit item (`src/app/add-item/page.tsx`)
- Grocery is selected by default; Medicine is one tap. A large Scan button is first (see 03).
- First view: name and quantity (plus unit for groceries, dosage for medicines). Medicine reminder
  times stay visible.
- Expiry, low-stock threshold and image are under **More details**, which opens automatically when
  editing an item that has any of them.
- **Save & scan next** saves, clears the form and reopens the scanner.
- Scanning a pack already in stock opens it with quantity +1, so it is never duplicated.
- The barcode is saved on groceries and medicines, and also into the family barcode list.
- Name suggestions: Tamil Nadu grocery list (`src/lib/grocery-list.ts`) for groceries, Indian
  medicine names for medicines (see 03).

## Data
- Firestore `inventory`, one document per item, `userId` = owner. Fields include `name`,
  `quantity`, `category` (`Grocery` | `Medicine`), `unit`, `barcode`, `expiryDate`,
  `lowStockThreshold`, `imageUrl`, `dosage`, `dailyAlert`, `reminderTimes`. Types: `src/types/index.ts`.
- Hooks: `src/firebase/firestore/use-inventory.ts` (add refreshes the list; update and delete are
  optimistic), `src/hooks/use-alerts.ts`.

## Rules
- Follow SPEC §5. Number fields use the number pad.
- `Medicine` items are also the Medicines app's list (09). `/medicines/add` re-exports this form:
  on that path it starts on Medicine, is titled "Add medicine", and returns to `/medicines`.
  Taking a dose in Medicines lowers the item's `quantity` by one.
- Routes `/inventory`, `/add-item`, `/add` and `/alerts` belong to Personal in
  `src/modules/module-paths.ts`. After saving on `/add` or tapping an alert, go to `/inventory`,
  not `/` (which now opens the start app).
- A save that fails says so and keeps the form filled.

## Verify
- Harness covers grocery and medicine, new and edit, More details, Save & scan next, existing item
  +1, every scanner result, and light/dark layout (last run: 34 of 36 checks passed; the 2 fails
  are the 24px reminder switch, enlarged to 44px on 19 Nov 2026).

## Open
- Receipt scan (`/add`) and the voice assistant (`src/ai/flows/voice-inventory-assistant.ts`,
  which still returns mock data) were not reviewed in this round.
- The reminder switch is now 44px tall (the shared `Switch` was enlarged, which also affects
  Settings and Receipt scan).
