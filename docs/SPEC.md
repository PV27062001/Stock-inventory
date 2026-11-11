# Sri Amman app — product and design spec

Current source of truth (Nov 2026). `ARCHITECTURE.md` describes the older October layout. This repo is
**public**: no secrets, keys or family data in it.

## 1. Product

A family app for a small Tamil Nadu shop, used mostly by the owner's parents on Android phones.

- **Personal** (blue): home stock of groceries and medicines, expiry and low-stock alerts, gold
  and silver rates, shutdown news.
- **Ledger** (green, routes under `/kirayabook`): the shop's customer book, rental inventory and
  (behind `SRIAMMAN_ENABLE_RENTALS`, currently off) rentals and bills.
- Only the Google accounts in `SRIAMMAN_ALLOWED_EMAILS` and `firestore.rules` can sign in.

**Users can type numbers but not letters.** Anything they search or enter should work from the
number pad, scanning or tapping. Text entry is the fallback, not the main path.

## 2. Platform

- Next.js 15 / React 19 on Vercel (`https://amman-samiyana-kadai.vercel.app`). Production follows
  the branch `feature/mobile-app-change`.
- Android app = Capacitor 7 shell that **loads the live site**. Web changes need only a deploy;
  native changes (plugins, permissions, icon) need a new APK.
- Firebase Auth (Google) and Firestore. Photos are stored **inside the Firestore document** as
  compressed JPEG data URLs (1 MiB document limit), not in Storage.
- Native plugins in `android/app/src/main/java/in/sriamman/app/`:
  - `SystemBarsPlugin` colours the status and navigation bars.
  - `NativeBarcodePlugin` + `BarcodeScanActivity` is a built-in scanner (ML Kit barcode-scanning
    17.3.0 bundled, CameraX 1.4.2), with no Google download needed on the phone.

### Build and release
- Web: `npm run build` must pass before any change is reported done.
- APK: JAVA_HOME = `E:\Git Repos\tools\jdk-21`,
  ANDROID_HOME = `C:\Users\praveen\AppData\Local\Android\Sdk`, `npx cap sync android`,
  `cd android && ./gradlew assembleRelease`, copy to `deploy/SriAmman-<version>.apk` (gitignored).
  Bump `versionCode` and `versionName` in `android/app/build.gradle`. Current: 1.5 (versionCode 6).
- `public/app-version.json` `latestBuild` tells installed apps an update exists. Raise it only once
  the new APK has been shared.
- Firestore rules have no deploy config. Publish `firestore.rules` by hand in the Firebase Console.
- Vercel needs every `SRIAMMAN_*` variable; a missing Firebase key fails the build with
  `auth/invalid-api-key` while pre-rendering pages.

## 3. Screens

| Area | Routes |
|---|---|
| Personal | `/` (home), `/inventory`, `/add-item`, `/add` (receipt scan), `/alerts`, `/ledger` |
| Ledger tabs (bottom nav) | `/kirayabook`, `/kirayabook/customers`, `/kirayabook/inventory` |
| Ledger detail | `/kirayabook/customer/[id]`, `/kirayabook/add-customer`, `/kirayabook/edit-customer/[id]` |
| Rentals (flag off) | `/kirayabook/rentals`, `new-rental`, `edit-rental`, `complete-rental/[id]`, `bill/[id]`, `unsettled` |
| Shared | `/settings`, `/login` |

## 4. Design rules

Every UI change must follow these rules on **every** screen, not just the one reported.

### Colour and theme
- Use only theme tokens (`globals.css`): `background`, `card`, `foreground`, `primary`, `muted`,
  `border`, `destructive`, `brand-green`, `brand-amber`. No raw hex colours in new code.
- `--app-bar` is the module colour: blue for Personal, green for Ledger (set from the route via
  `data-module`). It must stay dark enough for white status-bar icons in both themes.
- Dark mode applies to every screen, Ledger included. Check new screens in light and dark.

### Top of every screen
- Every screen has a solid `--app-bar` top bar joined to the status bar. The phone's status icons
  are always white and never flip. Never add a white top bar or sample on-screen colours.
- Bottom-nav tab screens (Ledger, Customers, Inventory, and the Personal home tabs) use
  `ModuleHeader` (title, subtitle, right action, pinned Ledger/Personal switch). Switching tabs
  must never change the header's size.
- Detail and form screens use a `<header className="sticky top-0 …">`. `header.sticky` in
  `globals.css` re-points tokens so anything inside it renders white on the app bar.
- Actions in a top bar are **buttons, never text links**: 44px tall,
  `bg-white/15 text-white rounded-xl`, with an icon (for example Pencil + "Edit", Plus + "Add new").

### Bottom of every screen
- The Ledger bottom nav is `#app-bottom-nav`. The phone's navigation-bar colour is read from that
  id only. Pages may have their own fixed elements (the A–Z index on Customers), and those must
  never decide the system bar colour.
- Content leaves room for the nav and the gesture area (layout wrapper bottom padding).

### Layout
- The layout wrapper uses `overflow-x-clip`, never `overflow-x-hidden` (that silently disables every
  sticky header).
- Phone width first: 360–393px, 16px side gutters, no horizontal scroll, safe-area insets on
  full-screen layers (`env(safe-area-inset-top/bottom)`).

### Touch and controls
- Tap targets are at least 44×44px. Primary actions are full-width 48–56px buttons.
- Something that looks tappable must do something. A photo or avatar with a picture opens it.
- **Every saved photo opens in `PhotoViewer`**: full screen, Close button, tap outside to close.
  Never link to a photo with `<a href>` or `target="_blank"`: photos are data URLs, which the
  browser refuses to open that way. ID cards use `IdCardViewer`, which wraps `PhotoViewer`.
- Customer search uses `NumberSearch`: it opens the number pad, and an ABC button switches to
  letters. Mobile numbers match on 3 or more digits anywhere in the number.
- Number fields use `inputMode="numeric"`. Form fields that are optional sit under "More details".

### Feedback
- Every failure says what happened and what to do next, in plain words. Never fail silently
  (for example, scanner errors are shown, not swallowed).
- Loading shows inside the page under its header, so the header and nav never disappear.

## 5. Adding stock (`/add-item`)

- Scan first: Grocery is selected by default, with a large Scan button. Medicines scan too.
- Name lookup order: the family barcode list (Firestore `barcodes/{code}`, shared by the allowed
  accounts) → `/api/product-lookup`. That API tries Scanbot's open endpoint first (undocumented,
  can be blocked at any time, keep volume low, honest User-Agent, never bypass a block), then
  Open Food Facts, then UPCitemdb.
- A pack already in stock opens with quantity +1. "Save & scan next" adds several in a row.
- Medicine Data Matrix / GS1 codes fill the expiry date (`src/lib/scanned-code.ts`).
- Medicine names are suggested from `public/medicines/<first two letters>.json`, built by
  `scripts/build-medicine-list.mjs` from Indian-Medicine-Dataset (MIT, no barcodes).
- No bulk scraping of Scanbot or retailer sites. A later personal Postgres/API should hold only
  open data (Open Food Facts India subset, the medicine dataset) and the family list.

## 6. Data and security

- Collections: `inventory` (per user), `users/{uid}/…`, `kirayabook_customers`,
  `kirayabook_rentals`, `kirayabook_inventory`, `barcodes`. Everything else is denied.
- `withAuth` guards every private page. Firestore rules are the real protection; never rely on the
  client alone.
- Allowed emails live in three places that must match: `SRIAMMAN_ALLOWED_EMAILS`,
  `firestore.rules`, `storage.rules`.

## 7. How changes are proven

Follow the `prove-the-fix` skill for any UI, layout or mobile bug.

1. Treat a report as a class: list every route above and every state (loading, empty, error,
   scrolled, light and dark).
2. Fix the root in one shared place (a component, token or rule), not page by page.
3. Measure with a temporary harness: a `/zz-audit` route, auth bypass, mocked data, and headless
   Chrome at 393×852. Print a table. A screen that was not measured counts as a failure.
4. **Commit real work before applying the harness.** Cleanup restores only the files the harness
   touched (never `git checkout -- src`). Nobody commits while a harness is applied: that is how a
   login bypass once reached production.
5. Remove the harness, confirm `git status` is clean and `grep -r zz src` finds nothing, then run
   the real `npm run build`.
6. Report what was proven and what was not. A simulated test is not a real phone.

## 8. Open items (Nov 2026)

- Vercel failed most pushes since 6 Nov while one commit with test code deployed. The real reason
  is only in the Vercel dashboard. Check that production is not running a test build.
- Real-phone proof still needed for the APK 1.5 scanner and the number pad.
- `firestore.rules` `barcodes` block must be published by hand.
- Medicine reminder switch is 24px tall (below the 44px rule).
