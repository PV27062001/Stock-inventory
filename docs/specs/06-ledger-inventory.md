# 06 · Ledger inventory

> New session: read `docs/SPEC.md`, then this file. Task: …

## Purpose
The shop's rentable items (vessels, cooking equipment) with a price per day, used when creating
rentals.

## Screen
- `/kirayabook/inventory` (a bottom-nav tab) uses `ModuleHeader` ("Inventory", "Ledger"). Loading
  shows inside the page under the header.
- An add/edit form at the top (photo, name, price per day), then a grid of item cards with Edit and
  Delete.
- An item without a photo shows an emoji chosen from its name (`src/lib/item-emoji.ts`).

## Data
- Firestore `kirayabook_inventory`. Service: `src/firebase/kirayabook/inventory-service.ts`
  (`getInventoryItems`, add, update, delete).

## Rules
- Follow SPEC §5. Item photos should open in `PhotoViewer` if they are made tappable later.

## Open
- Item photos are not tappable yet.
- Quantity or stock tracking for rentable items is not modelled.
