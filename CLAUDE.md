# Project instructions

Read `docs/SPEC.md` before changing anything. It holds the product, the design rules every screen
must follow, the build and release steps, and how fixes are proven.

- Run `npm run build` after every code change; native changes also need a new APK (SPEC §2).
- UI changes follow the design rules in SPEC §4 on every screen, in light and dark.
- When a decision changes, update `docs/SPEC.md` in the same commit.
- This repository is public: never commit secrets, keys or family data.
