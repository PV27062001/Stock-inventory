/**
 * Feature flags, driven by env vars (set in `.env` / Vercel, then restart `npm run dev` or redeploy).
 * SRIAMMAN_* vars are inlined at build time via the `env` list in next.config.
 *
 * SRIAMMAN_ENABLE_RENTALS=true (or 1 / yes, any case) -> rentals are on (screens, nav tab, stats, create/edit/complete/delete).
 * Anything else (including unset)                     -> rental UI is hidden, rental routes 404 and rental writes throw.
 */
const isOn = (value?: string) => ['true', '1', 'yes'].includes((value || '').trim().replace(/^["']|["']$/g, '').toLowerCase());

export const RENTALS_ENABLED = isOn(process.env.SRIAMMAN_ENABLE_RENTALS);

/** Rental routes, blocked by `src/middleware.ts` when rentals are disabled. */
export const RENTAL_ROUTE_PREFIXES = [
  '/kirayabook/rentals',
  '/kirayabook/add-rental',
  '/kirayabook/new-rental',
  '/kirayabook/edit-rental',
  '/kirayabook/complete-rental',
  '/kirayabook/unsettled',
  '/kirayabook/bill',
];
