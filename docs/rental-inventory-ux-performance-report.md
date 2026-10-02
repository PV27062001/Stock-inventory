# Rental and Inventory UX/Performance Report

## Implemented

- Added shared high-contrast app header with Settings, Logout, and app switching.
- Added shared loading overlay for API-dependent form submissions.
- Replaced New Rental customer select with searchable customer autocomplete.
- Replaced New Rental item entry with searchable KirayaBook inventory autocomplete.
- Capped autocomplete rendering to 50 visible matches for large lists.
- Added client-side caching for KirayaBook customers, rentals, and rentable inventory lists.
- Added an Inventory bottom navigation mode with Home, Add, and List actions.
- Rebuilt Inventory home as a real data-backed list with search and simple category filters.
- Updated Add Inventory with the same header, loading overlay, and clearer save/error states.
- Moved fixed action buttons above the bottom nav so important actions stay visible.

## Performance Notes

- First list load still depends on Firestore latency, but repeat navigation now reuses in-memory caches where safe.
- Rental form loads customers and inventory in parallel.
- Search/filter actions run client-side and do not issue new API calls while typing.
- Save actions disable duplicate submission and show a visible global overlay.
- Footer navigation is route-based and lightweight.

## Accessibility Notes

- Primary touch targets are 48px or larger.
- Form labels are visible and plain-language.
- Autocomplete supports keyboard selection with arrow keys, Enter, and Escape.
- Text contrast is improved with the shared dark theme.
- Important actions are kept within one or two taps on mobile.
- Empty states explain what happened and offer the next action.

## Code Review Findings

- The project has duplicated rental routes (`new-rental` and `add-rental`). They now share one form component, but older duplicate pages still exist elsewhere.
- Household inventory and KirayaBook inventory use different Firestore services and models. This is workable, but should be documented as two domains.
- Production `next build` compiled successfully, then failed during page-data collection with `PageNotFoundError` for multiple existing routes. The route files exist, so this likely needs a separate Next/build-artifact investigation.
- Several existing files contain mojibake currency symbols. New UI uses `Rs.` in touched surfaces to avoid compounding encoding issues.

## Recommendations

- Add persistent Firestore cache or React Query/SWR if offline/slow-network behavior becomes important.
- Consolidate old duplicate rental completion/edit pages where possible.
- Add toast confirmations for create/update/delete operations.
- Add smoke tests for the mobile routes: `/kirayabook`, `/kirayabook/new-rental`, `/inventory`, and `/add-item`.
