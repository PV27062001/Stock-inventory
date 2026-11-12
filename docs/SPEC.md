# Sri Amman app — system spec

The single spec that connects every module. Each module has its own spec in `docs/specs/`. A new
session reads this file first, then only the module spec it is working on.

This repo is **public**: no secrets, keys or family data in any file. `ARCHITECTURE.md` and
`README.md` describe an older version; when they disagree, these specs win.

## 1. Starting a new session

Paste this, with the module filled in:

> Read `docs/SPEC.md` and `docs/specs/<module>.md` in `E:\Git Repos\GIT_All\SimpleStock`.
> Follow the design rules (SPEC §5), keep the specs current (SPEC §8) and the proof rules (SPEC §9). Task: <what you want>.

| Module spec | Covers |
|---|---|
| [01-app-shell](specs/01-app-shell.md) | Layout, sign-in, home chooser, settings, theme, language, system bars, bottom nav, banners, notifications |
| [02-personal-stock](specs/02-personal-stock.md) | Personal home stock: list, add/edit groceries and medicines, alerts, reminders, receipt scan |
| [03-scanner-and-lookup](specs/03-scanner-and-lookup.md) | Barcode scanning (native and web), product name lookup, family barcode list, medicine names |
| [04-rates-and-news](specs/04-rates-and-news.md) | Gold and silver rates, power shutdown news |
| [05-ledger-customers](specs/05-ledger-customers.md) | Ledger home, customer book, customer detail, add/edit customer, photos, search |
| [06-ledger-inventory](specs/06-ledger-inventory.md) | Shop's rentable items |
| [07-rentals-and-bills](specs/07-rentals-and-bills.md) | Rentals, payments, bills (feature flag, currently off) |
| [08-android-app](specs/08-android-app.md) | Capacitor shell, native plugins, APK build and release |

## 2. Product

A family app for a small Tamil Nadu shop (Sri Amman), used mostly by the owner's parents on Android
phones. Two modules share one app:

- **Personal** (blue): the family's home stock of groceries and medicines, with alerts, plus gold
  and silver rates and power shutdown news.
- **Ledger** (green, routes under `/kirayabook`): the shop's customer book and rentable items.
  Rentals and bills exist behind a flag that is currently off.

**The main users can type numbers but not letters.** Prefer the number pad, scanning and tapping;
text entry is the fallback. English and Tamil are both supported.

## 3. How the pieces connect

```
Android phone ── Capacitor shell (APK) ──loads──▶ live site on Vercel (Next.js 15, React 19)
      │  native plugins: SystemBars, NativeBarcode          │
      └────────── window.Capacitor bridge ◀─────────────────┤
                                                            ├─▶ Firebase Auth (Google sign-in)
                                                            ├─▶ Firestore (all app data, photos inside documents)
                                                            ├─▶ /api/product-lookup ─▶ Scanbot, Open Food Facts, UPCitemdb
                                                            ├─▶ /api/metal-rates   ─▶ GoodReturns, gold-api.com, er-api
                                                            └─▶ /api/shutdown-news ─▶ Google News RSS
```

- The APK always loads `https://amman-samiyana-kadai.vercel.app`, so **web changes reach phones on
  the next app launch**. Only native changes need a new APK.
- Production deploys from branch **`feature/mobile-app-change`**, not `main`.
- `src/lib/native.ts` is the only place web code talks to native plugins; every helper falls back
  to a web behaviour in a normal browser.
- Module colour and the phone's system bars are set from the route (`SystemBarsSync`).

## 4. Shared data

| Collection | Owner | Used by |
|---|---|---|
| `inventory` | per user (`userId`) | 02 personal stock |
| `users/{uid}/…` | per user | 02 receipt-scanned items |
| `barcodes/{code}` | shared by allowed accounts | 03 family barcode list |
| `kirayabook_customers` | shared | 05, 07 |
| `kirayabook_inventory` | shared | 06, 07 |
| `kirayabook_rentals` | shared | 07 |

- Everything else is denied in `firestore.rules`. The rules have no deploy config, so publish
  them by hand in the Firebase Console after every change.
- Photos are compressed JPEG **data URLs stored inside documents** (1 MiB document limit). They
  cannot be opened as links; show them with `PhotoViewer`.
- Only allowed Google accounts can use the app. The list lives in three places that must match:
  `SRIAMMAN_ALLOWED_EMAILS` (Vercel), `firestore.rules` and `storage.rules`.
- **Risk:** `isEmailAllowed` lets everyone in when `SRIAMMAN_ALLOWED_EMAILS` is empty. That is a
  client-side gate only; Firestore rules still block data, but screens would open.

## 5. Design rules (every module, every screen)

### Colour and theme
- Use only theme tokens from `globals.css` (`background`, `card`, `foreground`, `primary`, `muted`,
  `border`, `destructive`, `brand-green`, `brand-amber`). No raw hex colours in new code.
- `--app-bar` is the module colour (blue Personal, green Ledger, from `data-module`). It stays dark
  enough for white status-bar icons in both themes.
- Dark mode must work on every screen. Check new work in light and dark.

### Top of every screen
- Every screen has a solid `--app-bar` top bar joined to the status bar. The status icons are
  always white and never flip. Never add a white top bar or sample on-screen colours.
- Bottom-nav tab screens use `ModuleHeader` (title, subtitle, right action, pinned
  Ledger/Personal switch). Switching tabs must never change the header's size.
- Detail and form screens use `<header className="sticky top-0 …">`; `header.sticky` re-points the
  theme tokens so everything inside renders white on the bar.
- Top-bar actions are **buttons, never text links**: 44px tall, `bg-white/15 text-white rounded-xl`,
  with an icon.

### Bottom of every screen
- The phone's navigation-bar colour is read only from `#app-bottom-nav`. A page's own fixed
  elements (such as the A–Z index on Customers) must never decide it.
- Content leaves room for the bottom nav and the gesture area.

### Layout
- The layout wrapper uses `overflow-x-clip`, never `overflow-x-hidden`, which silently disables
  every sticky header.
- Phone width first (360–393px), 16px side gutters, no horizontal scroll, safe-area insets on
  full-screen layers.

### Touch, input and feedback
- Tap targets are at least 44×44px; primary actions are full-width 48–56px buttons.
- Anything that looks tappable does something. A photo opens in `PhotoViewer`.
- Searches people use open the number pad (`NumberSearch`, with an ABC switch). Number fields use
  `inputMode="numeric"`. Optional fields sit under "More details".
- Every failure says what happened and what to do next. Never fail silently.
- Loading shows inside the page under its header, so the header and nav never disappear.

## 6. Environment variables (Vercel)

`SRIAMMAN_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`,
`_MESSAGING_SENDER_ID`, `_APP_ID`; `SRIAMMAN_ALLOWED_EMAILS`; `SRIAMMAN_ENABLE_RENTALS`;
`SRIAMMAN_SHOP_NAME`, `_NAME_TA`, `_TAGLINE`, `_TAGLINE_TA`, `_PHONE`, `_ADDRESS`.

These are inlined at build time. A missing Firebase key fails the Vercel build with
`auth/invalid-api-key` while pre-rendering. The receipt scan (Genkit + Gemini) also needs a Google
AI key on the server. Whenever code reads a new variable, add it in Vercel too.

## 7. Build, deploy and release

- `npm run build` must pass after every code change, before the work is called done.
- Web: push to `feature/mobile-app-change`; Vercel deploys it. Check the commit's status on GitHub
  and the live site afterwards. A failed deploy leaves the old version live.
- Android: see [08-android-app](specs/08-android-app.md).

## 8. Keeping the specs current

Every change updates the specs in the same commit as the code:
- the module spec: new or changed screens, behaviour, files, data fields, verify steps, open items;
- this file: anything shared (data, design rules, environment variables, deploy steps, open items).

Mark a fixed open item as done by removing it, and add newly found problems. A change is not done
while a spec still describes the old behaviour.

## 9. How changes are proven

Follow the `prove-the-fix` skill for any UI, layout or mobile bug.

1. Treat a report as a class: list every affected route and state (loading, empty, error,
   scrolled, light and dark).
2. Fix the root in one shared place (component, token or rule), not page by page.
3. Measure with a temporary harness (a `/zz-audit` route, auth bypass, mocked data, headless Chrome
   at 393×852). Print a table. A screen that was not measured counts as a failure.
4. **The harness never runs in the main working folder.** Use a separate git worktree in a scratch
   folder. Test code in the main folder was committed and pushed twice ("changes", "changes bug"),
   which put a login bypass on GitHub, and once on the live site.
5. Afterwards `grep -r "zzuser\|zzmock\|zz-audit" src` must find nothing, and the real
   `npm run build` must pass.
6. Report what was proven and what was not. A simulated test is not a real phone.

## 10. Open items (12 Nov 2026)

- Vercel failed several pushes since 6 Nov, while commits containing test code deployed. The
  reason is only in the Vercel dashboard. Confirm the live site is the latest clean commit.
- Not yet proven on a real phone: the APK 1.5 scanner, the number pad, the photo viewer.
- The `barcodes` block in `firestore.rules` must be published by hand.
- Dark mode on Ledger: Ledger home was measured dark with a realistic sign-in. An earlier "Ledger
  stays light" result came from a test that faked the user too early. The other Ledger screens
  still need measuring.
- The medicine reminder switch is 24px tall (below the 44px rule).
- `app-version.json` `latestBuild` is still 2; the current APK is build 6.
