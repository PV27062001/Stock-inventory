# 05 · Ledger customers

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
The shop's customer book: find a customer fast by mobile number, call or WhatsApp them, and keep
their photo and ID documents.

## Screens
| Route | What it does |
|---|---|
| `/kirayabook` | Ledger home (tab): counts, number search, quick actions, customer preview. |
| `/kirayabook/customers` | Customer list (tab): totals, number search, favourites, recents, A–Z groups with a side index, photo viewer with Call and WhatsApp. |
| `/kirayabook/customer/[id]` | Customer detail: tap the photo to view it full screen, an Edit button, delete with confirmation, mobile-verification prompt, ID cards (View Aadhaar, PAN, Licence), rentals when the flag is on. |
| `/kirayabook/add-customer` | New customer, with camera or gallery for each photo. |
| `/kirayabook/edit-customer/[id]` | Edit customer; saved ID photos open in the app viewer. |

## Behaviour
- **Search (`NumberSearch`)** opens the number pad, with an ABC button for letters. Home search
  needs 4 characters; numbers match on 3 or more digits anywhere in the mobile number. Customers
  filters instantly by name, mobile or profession.
- **Photos:** the face photo and Aadhaar, PAN and Driving Licence images are compressed data URLs
  inside the customer document, picked with `PhotoPicker` (camera or gallery). They are shown with
  `PhotoViewer` / `IdCardViewer` and never as links.
- **Mobile verification:** `mobileVerifiedAt`, re-confirmed after 6 months (`src/lib/phone.ts`).
- Professions come from `src/lib/professions.ts`.

## Data
- Firestore `kirayabook_customers`. Service: `src/firebase/kirayabook/firestore-service.ts`
  (`getAllCustomers`, cached, `getCustomerById`, `addCustomer`, `updateCustomer`,
  `deleteCustomer`; `CustomerTooLargeError` when photos exceed the document limit).

## Rules
- The tabs (home, Customers) use `ModuleHeader`; the detail and form screens use the sticky header
  with button-style actions (SPEC §5).
- The A–Z index is a page-level fixed `nav`. It must never decide the system bar colour.

## Verify
- Last runs: tab headers identical on all three tabs, bottom-bar colour correct, number search on
  both screens (number pad, finds by digits, ABC finds by name), and photo viewer and Edit button
  26 of 26 checks in light and dark.

## Open
- Not yet proven on a real phone.
