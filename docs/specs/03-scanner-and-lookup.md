# 03 · Scanner and product lookup

> New session: read `docs/SPEC.md`, then this file (and `08-android-app.md` for native changes).
> Task: …

## Purpose
Turn a pack into a named item with as little typing as possible.

## Scanning
- **In the app (APK build 6+):** `BarcodeScanActivity` is a full-screen CameraX camera with the
  ML Kit model bundled in the APK, so nothing downloads on the phone. It has a guide box, tap to
  focus, torch, zoom (1.5×, 2.5×, 1×) and a Type number button. It accepts EAN-13, EAN-8, UPC-A,
  UPC-E, QR and Data Matrix, and needs the same value on two frames.
- The plugin resolves with exactly one of `code`, `typed`, `cancelled` or `error`. Errors are
  shown on screen with a number box; there is no silent fallback.
- **Older APKs (below build 6):** the web scanner opens with an "Update the app" notice.
- **Browser:** web scanner (`src/components/app/barcode-scanner.tsx`, zxing).
- `src/lib/scanned-code.ts` reads plain EAN/UPC and GS1 text (Data Matrix/QR on medicines): the
  product number (`01`) and expiry (`17`, YYMMDD) fill the form. A QR with no product number gets
  a clear message.

## Name lookup order
1. The user's own stock (same barcode → open it with +1).
2. **Family barcode list**: Firestore `barcodes/{code}` = `{ name, category, updatedBy, updatedAt }`,
   readable and writable by the allowed accounts, saved after every add or update. A saved name
   beats every outside source.
3. `/api/product-lookup?code=`: Scanbot's open endpoint first, then Open Food Facts, then
   UPCitemdb (100 a day). Only the barcode number is sent. Scanbot results are cached 30 days.
4. Not found: the name box is focused; the name typed once is remembered through the family list.

## Scanbot
- `https://scanbot.io/wp-json/upc/v1/lookup/<code>` is undocumented and serves Go-UPC data. It was
  the only source that found Indian packs such as 3 Roses.
- Keep the volume low, send an honest User-Agent, never work around a block, and never
  bulk-download it. The app must keep working when it stops.
- The route rejects requests from other websites (`Sec-Fetch-Site`). This doesn't stop scripts.

## Medicine names
- `public/medicines/<first two letters>.json`: 241,925 current Indian medicine names with
  composition. A phone downloads only the file for the two letters typed.
- Built by `scripts/build-medicine-list.mjs` from Indian-Medicine-Dataset (MIT, no barcodes);
  licence in `public/medicines/LICENSE.txt`.

## Later (not started)
- A personal Postgres + API may hold open data only: the Open Food Facts India subset, the
  medicine dataset and the family list. No scraping of Scanbot or retailer sites.

## Verify
- Lookup route: known codes `8901063029286` (Jimjam) and `8901030987335` (3 Roses), an unknown code,
  Scanbot down, all sources down, a cross-site request (403).
- Parser: plain, GS1 with and without separators, brackets, digital link, website QR.

## Open
- The native scanner has never been tested on a real phone. Earlier, the camera opened but did not
  read barcodes (APK 1.4).
- The `barcodes` Firestore rule must be published by hand.
