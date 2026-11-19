# 01 · App shell

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
Everything around the apps (modules): the root layout, sign-in, the Apps launcher, the module
registry, the start screen, settings, theme, language, system bars, bottom nav, install and update
banners, and notifications.

## Screens
| Route | What it does |
|---|---|
| `/login` | Google sign-in. Accounts not on the allowlist are signed out again, including after a mobile redirect sign-in. |
| `/` | Entry point only: redirects to the start app's home (Settings → Start screen), else `/apps`. Shows the brand loader meanwhile. |
| `/apps` | Apps launcher: a 3-column grid of app tiles from the registry, a star on the app that opens first, and "Opens first: … Change" (→ `/settings#start-screen`). Header: title "Sri Amman", greeting, Settings. |
| `/settings` | Members, language (English/Tamil), profile, start screen (`#start-screen`: Apps screen, then one row per app, the chosen one ticked), notifications, dark mode, logout. |
| `/ledger` | Redirects to `/kirayabook`. |

## Key files
- `src/modules/registry.ts`: `MODULES` (id, name, Tamil name, description, icon, `colorVar`,
  `homePath`, bottom-nav `tabs`) and `getModule`. Ledger's Rentals tab appears only when
  `RENTALS_ENABLED`.
- `src/modules/module-paths.ts`: which route prefixes belong to which app (`moduleIdForPath`), and
  `moduleScript()`, the same rule as head-script source. No React, so the layout can use it.
- `src/app/layout.tsx`: root layout. A head script (built from `moduleScript()`) sets
  `data-module` and the `dark` class before paint; it also holds the wrapper (`overflow-x-clip`, bottom padding) and the status and
  gesture-bar strips.
- `src/components/app/system-bars-sync.tsx`: sets `data-module` from the route (`moduleIdForPath`) and sends the
  status and navigation bar colours to the phone (from `#status-bar-strip` and `#app-bottom-nav`).
- `src/components/ui/page-header.tsx`: `PageHeader` (`nav`: `back` | `apps` | `none`, actions,
  `settings`, title) plus `HeaderButton`, `BackButton`, `AppsButton`, `SettingsButton` and
  `headerButtonClass` (SPEC §5).
- `src/components/ui/module-header.tsx`: an app's main-screen header, `PageHeader nav="apps"
  settings`. The old Ledger/Personal switch, `module-toggle.tsx` and the two-card home chooser
  were removed.
- `src/components/ui/bottom-nav.tsx` (`#app-bottom-nav`): the current app's `tabs` from the
  registry, nothing for apps without tabs (only Ledger has them). `conditional-bottom-nav.tsx`
  shows it only when signed in.
- `src/components/Auth/with-auth.tsx`: guards private pages; `src/lib/allowed-users.ts`.
- `src/firebase/auth/*`: `AuthProvider` (user starts as `null`, filled by `onAuthStateChanged`).
- `src/hooks/use-dark-mode.ts` (`simplestock_theme`), `use-language.tsx` (`simplestock_lang`,
  strings in `src/lib/translations.ts`), `use-start-page.ts` (`start-page`: `apps` (default, not
  stored) or a module id; old values `inventory`, `kirayabook` and `ask` are read as `personal`,
  `ledger` and `apps`; unknown values fall back to `apps`; `startPath()` gives the route).
- `src/components/install-banner.tsx` (browser only, hidden in the app),
  `app-update-banner.tsx` (app only, compares the APK build with `public/app-version.json`).
- `src/components/app/notification-watcher.tsx`, `src/hooks/use-notifications.ts`: one low-stock
  notification a day, through the native plugin in the app or the browser API on the web.
- `public/sw.js`: PWA service worker (browser installs only).

## Rules
- Follow SPEC §5. The shell owns the status and navigation bar rules; never colour system bars
  from page content.
- The user must start as `null` on both server and client. Reading a signed-in user synchronously
  on the client causes a React hydration error (#418); React then rebuilds the page and drops the
  `dark` class.
- Preferences live in `localStorage` and are unknown until mounted; read them in effects.

## Verify
- Last run (19 Nov 2026, production build, headless Chrome): 12 routes x 360 and 393px x light and
  dark x top and scrolled, 0 problems. Launcher: Settings only, 2 tiles at least 96px, no cut
  text. App main screens: Apps first, Settings last. Inner screens: Back first, no Apps. Bar
  buttons 48px, no overlap, no horizontal scroll, sticky header at 0, bar = module colour = status
  strip, bottom nav only on Ledger. Start page: 8 saved values land on the right screen. Flow:
  tile → app, Apps → launcher, Change → Settings start screen in view, choosing Ledger saves it
  and stars it.
- Every route in light and dark, at the top and scrolled: status-bar colour, header, bottom nav,
  `--nav-bar-color` equal to the nav's background.
- Sign-in with an allowed and a not-allowed account.

## Open
- Dark mode on Ledger screens other than home is not yet measured (SPEC §10).
- Allowlist empty means everyone gets in on the client (SPEC §4).
