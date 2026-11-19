# Project instructions

Read `docs/SPEC.md` first: it connects every module and holds the design rules, build steps and
proof rules. Then read only the module spec you are working on in `docs/specs/`.

- Run `npm run build` after every code change; native changes also need a new APK (specs/08).
- UI changes follow SPEC §5 on every screen, in light and dark.
- Test harnesses run in a separate git worktree, never in this folder (SPEC §9).
- **Every change updates the specs**, in the same commit as the code: `docs/SPEC.md` for anything
  shared (data, rules, variables, deploy, open items) and the matching `docs/specs/NN-*.md` for the
  module. The report says which sections changed. Work is not done while a spec is out of date.
- This repository is public: never commit secrets, keys or family data.
