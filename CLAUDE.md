# Project instructions

Read `docs/SPEC.md` first: it connects every module and holds the design rules, build steps and
proof rules. Then read only the module spec you are working on in `docs/specs/`.

- Run `npm run build` after every code change; native changes also need a new APK (specs/08).
- UI changes follow SPEC §5 on every screen, in light and dark.
- Test harnesses run in a separate git worktree, never in this folder (SPEC §8).
- When a decision changes, update the matching spec in the same commit.
- This repository is public: never commit secrets, keys or family data.
