/**
 * Feature flags, driven by env vars (set in `.env`, restart `npm run dev` / rebuild after changing).
 *
 * NEXT_PUBLIC_ENABLE_RENTALS=true  -> rentals are on (screens, nav tab, stats, create/edit/complete/delete).
 * Anything else (including unset)   -> rental UI is hidden, rental routes 404 and rental writes throw.
 */
export const RENTALS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_RENTALS === 'true';

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
