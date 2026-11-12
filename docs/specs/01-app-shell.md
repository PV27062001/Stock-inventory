# 01 · App shell

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
Everything around the modules: the root layout, sign-in, choosing a module, settings, theme,
language, system bars, bottom nav, install and update banners, and notifications.

## Screens
| Route | What it does |
|---|---|
| `/login` | Google sign-in. Accounts not on the allowlist are signed out again, including after a mobile redirect sign-in. |
| `/` | Home: choose Personal or Ledger. Once a start page is chosen in Settings, it goes straight there. |
| `/settings` | Members, language (English/Tamil), profile, start screen, notifications, dark mode, logout. |
| `/ledger` | Redirects to `/kirayabook`. |

## Key files
- `src/app/layout.tsx`: root layout. A head script sets `data-module` and the `dark` class before
  paint; it also holds the wrapper (`overflow-x-clip`, bottom padding) and the status and
  gesture-bar strips.
- `src/components/app/system-bars-sync.tsx`: sets `data-module` from the route and sends the
  status and navigation bar colours to the phone (from `#status-bar-strip` and `#app-bottom-nav`).
- `src/components/ui/module-header.tsx`: the tab-screen header with the Ledger/Personal switch.
- `src/components/ui/bottom-nav.tsx` (`#app-bottom-nav`), `conditional-bottom-nav.tsx` (shown
  only when signed in, and only under `/kirayabook`).
- `src/components/Auth/with-auth.tsx`: guards private pages; `src/lib/allowed-users.ts`.
- `src/firebase/auth/*`: `AuthProvider` (user starts as `null`, filled by `onAuthStateChanged`).
- `src/hooks/use-dark-mode.ts` (`simplestock_theme`), `use-language.tsx` (`simplestock_lang`,
  strings in `src/lib/translations.ts`), `use-start-page.ts`.
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
- Every route in light and dark, at the top and scrolled: status-bar colour, header, bottom nav,
  `--nav-bar-color` equal to the nav's background.
- Sign-in with an allowed and a not-allowed account.

## Open
- Dark mode on Ledger screens other than home is not yet measured (SPEC §9).
- Allowlist empty means everyone gets in on the client (SPEC §4).
