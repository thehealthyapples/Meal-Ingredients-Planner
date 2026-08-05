# Living Object Vertical Slice — Stage 0 Build Recovery Report

**Date:** 2026-08-05 · **Risk:** 🔴 RED — recovery of broken runtime/dependency state (executed).
**Branch:** `feat/living-larder-authoritative` · **Starting HEAD:** `0f59b189bc6e548c2fc956e6a5cc23a850ec36a0`.
**Scope:** Stage 0 of the Vertical Slice only — remove the abandoned 3D milk POC and restore the build. **No Stage 1. No asset generation. No Pantry/Fridge craftsmanship change. No architecture change. No push/deploy.**
**Evidence standard:** **[V]erified**, **[I]nferred**, **[A]ssumed**.

---

## Architecture compliance
- **[V]** Canonical **layered renderer remains singular** — the removed POC was a competing `react-three-fiber` (3D/WebGL) render path; the 2D layered renderer in `client/src/pages/living-home-room.tsx`/`.css` was **not touched**.
- **[V]** **Runtime remains the single rendering owner** — no new renderer or owner introduced; a parallel 3D renderer was removed.
- **[V]** **No duplicate visual state or renderer** was introduced (pure removal).
- **[V]** **Existing Living Home architecture was extended nowhere** — this pass removes an abandoned POC and adds documentation only.
- **[V]** **Approved Living Larder work preserved** — category C files (`living-home-room.tsx`/`.css`, fridge PNG assets, pantry evidence) remain modified exactly as before; verified untouched in `git diff`.
- **[V]** **No schema or data impact.**
- **[V]** **No production deployment** occurred (local only; not pushed).

## Rollback identifier
- **Preservation tag:** `rollback/stage0-build-recovery-20260805`
- **Preservation commit:** `f7f553000e791730182c4a5c1eff3010b0ff86db` (parent `0f59b189`; captures the **entire** pre-recovery working tree incl. untracked files; created without moving the branch). **[V]**

## Exact files changed
- **Removed:** `client/src/pages/poc-milk3d.tsx` (untracked POC page; `react-three-fiber` proof-of-concept). **[V]**
- **Reverted to committed HEAD state** (the POC changes were uncommitted, so restoration yields **no** tracked diff):
  - `client/src/App.tsx` — removed the `/poc-milk3d` route + its comment (the only uncommitted change; `git diff HEAD` now empty). **[V]**
  - `package.json` — removed the three POC dependencies (`git diff HEAD` now empty). **[V]**
  - `package-lock.json` — restored to HEAD (`git diff HEAD` now empty). **[V]**
- **Untouched (preserved):** all category C (Living Larder runtime + assets) and category D (investigation/governance docs); category B `north4-concepts` shelf files were **left in place** because they were **not proven** to belong solely to the confirmed scope drift (removal gated on proof; proof absent). **[V/I]**

## Dependencies removed
Via `npm uninstall three @react-three/fiber @react-three/drei` (normal package-manager command; exit 0), then `node_modules` reconciled (empty `@react-three` scope dir removed):
- `three` `^0.169.0`
- `@react-three/fiber` `^8.18.0`
- `@react-three/drei` `^9.122.0`

`package.json` and `package-lock.json` now show **empty diff vs HEAD** — the manifests are exactly the committed state; the packages are absent from `node_modules`. No dependency used elsewhere was removed (verified: `three`/`@react-three` referenced nowhere in `client`/`server`/`scripts`/`script` after removal). **[V]**

## Build result
- `npm run build` (`tsx script/build.ts`) → **exit 0**: client `✓ built in 29.12s`; server bundle `dist/index.cjs` 4.1mb. The 4 warnings are pre-existing `import.meta`/cjs warnings in unrelated server files. **[V]** The build that `PocMilk3d` broke is restored.

## Tests run and not run
- **Typecheck** (`tsc --noEmit`): **88 errors, all in `server/`** (intelligence handlers, scripts, and tests — nutrition/planner domain); **zero in `client/`, zero POC/three/react-three**. The prior `PocMilk3d` type error is **resolved**. These 88 are a **pre-existing server-side baseline unrelated to Stage 0** (Stage 0 touched only frontend + removed a frontend POC; all errors are server-side). The repo carries a `typecheck:ci` baseline gate, consistent with a known non-zero baseline. **[V]**
- **Full test suite** (`npm test`): **NOT run.** It is a large backend suite (100+ nutrition/intelligence/trust tests) requiring a provisioned database (`ci:setup-db`); it is out of Stage 0 scope and environment-blocked (no `DATABASE_URL`). **No POC-specific test exists.** **[V]**
- `git diff --check`: **clean.** **[V]**

## Browser evidence
**Not performed — environment-blocked, and not claimed from code inspection.** The application is a full-stack Express app that **requires `DATABASE_URL`**; both `npm run dev` and `npm start` fail to boot without a provisioned database (`Error: DATABASE_URL must be set`). No database is available in this environment, so the live in-browser checks — app loads · `/pantry` loads · Pantry appearance preserved · Fridge Working Position reachable · Shopping/Companion/Bin present · no console errors · no `/poc-milk3d` route — **could not be executed here**. (Separately, `npm run dev` also has a Windows shell-portability issue in its `NODE_ENV=` prefix, independent of the DB.) **These live checks are deferred to Home Owner review, where the database exists.** **[V for the blocker; not-verified for the live UI]**

Static/source verification that *was* performed (in lieu, not as a substitute for the live check): no `/poc-milk3d` route in `App.tsx`; no `poc-milk3d.tsx`; no `PocMilk3d`/`@react-three`/`three` reference anywhere in source; build serves a client bundle successfully. **[V]**

## Data impact
- reads existing: **no** · writes new application data: **no** · changes meaning: **no** · backfill: **no**. **[V]**

## Regression checks
- Category C (Pantry/Fridge runtime + assets) **unchanged** — verified in `git status`/`git diff` (only the pre-existing modifications remain; the recovery added nothing to them). **[V]**
- Drag-and-drop, jars, fridge objects, plates, positions, masks — **not touched** (no edits to `living-home-room.tsx`/`.css` in this pass). **[V]**
- Build green; no new client/POC type errors. **[V]**
- **Not yet regression-verified in a live browser** (see Browser evidence) — the residual check for Stage 0. **[A]**

## Trust check
No credentials, secrets, or accounts were entered or created. No external service was contacted. No data was read from or written to a database. Work is local to the worktree; nothing was pushed or deployed. The preservation tag fully captures the pre-recovery state for reversal. **[V]**

## Highest-risk remaining Inferred/Assumed claim
**[A]** That the recovery introduces **no runtime/visual regression** to the Pantry or Fridge. This is strongly **inferred** (the build passes; no code in `living-home-room.tsx`/`.css` was edited; the POC was an isolated, separately-routed 3D path) but is **not confirmed in a live browser**, because the app cannot boot without a database in this environment. **Resolving this residual is the purpose of the Home Owner browser review.**

## Rollback plan
- The branch pointer never moved (still `0f59b189`); no commit rewrote history.
- To restore the **exact** pre-recovery working tree (including the POC and all uncommitted work): `git checkout rollback/stage0-build-recovery-20260805 -- .` then `npm install`. **[V]**
- To undo only the Stage 0 documentation commit: `git revert <recovery-commit>` (documentation-only; no code effect). **[V]**

## Definition of done (Stage 0)
- [x] Abandoned 3D POC removed cleanly (route, page, three dependencies). **[V]**
- [x] No `PocMilk3d`/`poc-milk3d`/`@react-three`/POC-only `three` reference remains in source. **[V]**
- [x] `package.json`/`package-lock.json` restored to HEAD; deps absent from `node_modules`. **[V]**
- [x] Typecheck: POC error resolved; no new client errors (server baseline pre-existing). **[V]**
- [x] `npm run build` passes (exit 0). **[V]**
- [x] Category C and D preserved; preservation tag created and recorded. **[V]**
- [x] Stage 0 documented; plan + lock status updated. **[V]**
- [ ] **Live browser verification** — deferred to Home Owner (environment-blocked here). **[A]**
- [x] One local recovery commit; **not pushed.** **[V]**

## User acceptance evidence
**None yet — awaiting Home Owner review.** This report is the Stop Gate hand-off: Stage 0 halts here for explicit Home Owner approval (which includes the deferred live-browser verification). No Stage 1 work has begun.
