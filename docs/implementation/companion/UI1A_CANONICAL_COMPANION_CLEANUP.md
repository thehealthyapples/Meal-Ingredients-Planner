# UI1A — Canonical Companion Cleanup

**Status:** ✅ Complete — 5 orphaned Companion files removed; 2 files retained under governing-architecture block
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `ui1a-pre-cleanup` → `45443a8f81c8a28ede0586192dd2965ba3aaf87a`
**Scope:** Deletion only. No refactor, no rename, no move, no server/shared change, no governing-document amendment.
**Source audit:** [`UI1_CANONICAL_UI_OWNERSHIP_AUDIT.md`](../../investigations/ux/UI1_CANONICAL_UI_OWNERSHIP_AUDIT.md) §5.1, §6.2, §6.4
**Governing constraint:** [`THA_COMPANION_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md) §3 (ownership table), §4.5, §5

---

## 1. Executive summary

UI1 identified an orphaned Companion presentation stack introduced by commit `0b1f2f7` (Replit Agent, 2026-07-07) and listed **seven** files as safe to delete.

**The UI1 audit overreached.** The pre-deletion verification gate required by this change discovered that **two of those seven files are named as canonical-owner rows in `THA_COMPANION_PLATFORM_ARCHITECTURE.md`** — a governing document. Deleting them would have removed a row from the governing ownership table and orphaned a third named owner (`shared/companion-interaction.ts`).

Per the Architecture Bootstrap in `docs/architecture/README.md` — *"If a proposed change conflicts with the governing architecture: STOP, explain why, and do not continue until approved"* — the change was halted, the conflict was reported, and **the governing architecture corrected the scope from 7 files to 5.**

Five files were removed. Two are retained pending an architecture decision. **No further Companion cleanup is authorised.**

---

## 2. Governing-architecture correction (why scope was reduced)

### 2.1 What UI1 got wrong

UI1 §6.4 listed all seven files under "safe to delete" on the strength of a single criterion: **zero importers, unreachable from `main.tsx`**. That criterion is necessary but **not sufficient**. UI1 did not cross-check its deletion list against the Companion Platform ownership table. Reachability is a *code* property; ownership is an *architectural* one. A file can be unreachable and still be the named owner of a governed responsibility.

### 2.2 The two files the governing architecture protects

| File | Where named | Classification in the doc |
|---|---|---|
| `client/src/lib/companion-delight.ts` | `THA_COMPANION_PLATFORM_ARCHITECTURE.md:108` — ownership table row *"Motion/delight primitives … Companion Platform — Experience"* | **§4.5 "Mature"** — explicitly *not* scaffold |
| `client/src/hooks/use-companion-observations.ts` | `THA_COMPANION_PLATFORM_ARCHITECTURE.md:190` — *"The client (`use-companion-observations.ts`) calls this exactly once, gated `enabled: isOpen && !hasHistory`"* | Described as the live client of the observation seam |

Both are also the **only importers of `shared/companion-interaction.ts`**, itself an ownership-table row (*"Interaction taxonomy (closed vocabulary)"*). Deleting them would have silently orphaned a third governed owner.

### 2.3 The five files the governing architecture does *not* protect

Verified: **none of these five appear in any file under `docs/architecture/`.**

Further, §4.5 states the Companion's `ExperienceProfile` (`avatarId`, `colorTheme`, `voiceProfileId`) is *"populated data with **no client renderer today**"*. `CompanionAvatar.tsx` was precisely an unsanctioned client renderer for that data. Removing it **restores** conformance with §4.5 rather than contradicting it.

### 2.4 Recorded discrepancy — for the architecture owner, not fixed here

While verifying, two governing-document claims were found to be **false in code**. They are recorded, not corrected (amending a governing document is out of this change's scope):

| Doc claim | Reality at `45443a8` |
|---|---|
| `:108` — `companion-delight.ts` owns motion/delight primitives, "Mature" | **Zero importers.** `FloatingAssistant.tsx:17` imports `framer-motion` directly, bypassing it. |
| `:190` — `use-companion-observations.ts` calls a `server/routes.ts` observations route | **No such route exists.** `GET /api/intelligence/companion/observations` returns Vite's HTML catch-all. `observation-engine.ts` is registered nowhere; only `behaviour-engine.ts` imports a *type* from it. |
| `§37` — *"No duplicated ownership was found anywhere in the platform."* | False at the client layer as of `0b1f2f7`; true again after this change. |

These two files are therefore **documented-but-unwired**. Whether to wire them or retire them is an architecture decision, not a cleanup decision.

---

## 3. Rollback protection

Established **before** any file was touched.

| Mechanism | Detail |
|---|---|
| **Annotated git tag** | `ui1a-pre-cleanup` → `45443a8f81c8a28ede0586192dd2965ba3aaf87a` |
| **Precondition verified** | All 5 targets were **tracked and clean** at HEAD — no uncommitted content could be lost |
| **Blob fingerprints** | recorded below, so restoration is provably exact |
| **Physical backup** | `companion-cluster.tar.gz` (366 KB, all 7 original files including the 2 retained) |

```
8fb7996496195556204838cef7ce289ef896c090  components/companion/CompanionAvatar.tsx
315322a757129217bef39bdf913559481b09b222  components/companion/CompanionPresenceBadge.tsx
3385af3efd1cb61f67bdda29a7067024240b8655  components/companion/companion-styles.ts
c62fb36544d6eaf3b6021bad3d6d4d8998a1871f  hooks/use-companion-greeting.ts
7fff77d08a539f326b26476d855b0fba9552280c  assets/icons/tha-apple-badge.png
```

**To restore:**

```bash
git checkout ui1a-pre-cleanup -- \
  client/src/components/companion \
  client/src/hooks/use-companion-greeting.ts \
  client/src/assets/icons/tha-apple-badge.png
```

The working tree carried 143 pre-existing dirty/untracked paths before this change. **None were touched.** The tag protects the deleted files (all clean at HEAD); it does not — and need not — protect that unrelated in-flight work.

---

## 4. Files removed

Each passed a three-part gate before deletion: **(a)** zero live importers, **(b)** unreachable from `client/src/main.tsx` per static import graph, **(c)** named in no governing document.

| # | File | Importers | Reachable? | Named in arch? |
|---|---|---|---|---|
| 1 | `client/src/components/companion/CompanionAvatar.tsx` | 1 — `CompanionPresenceBadge` (itself orphaned) | ❌ | ❌ |
| 2 | `client/src/components/companion/CompanionPresenceBadge.tsx` | 0 | ❌ | ❌ |
| 3 | `client/src/components/companion/companion-styles.ts` | 0 | ❌ | ❌ |
| 4 | `client/src/hooks/use-companion-greeting.ts` | 0 | ❌ | ❌ |
| 5 | `client/src/assets/icons/tha-apple-badge.png` | 1 — `CompanionAvatar` (deleted above) | ❌ | ❌ |

`client/src/components/companion/` is now empty and removed.

**Retained under block:** `client/src/lib/companion-delight.ts`, `client/src/hooks/use-companion-observations.ts`.

**Protected files confirmed untouched:** `FloatingAssistant.tsx`, `HomeIntelligenceCompanion.tsx`, `PlannerIntelligenceStrip.tsx`, `nav-bar.tsx`, `ThaAppleIcon.tsx`, `tha-apple.png`, and all benchmark / intelligence / server code.

> `nav-bar.tsx` reports as modified in `git status`. This is **pre-existing** (mtime `2026-07-07 18:09`, the ADMIN1D sidebar change) and predates this work. Its diff contains zero Companion references. The staged change set for UI1A is exactly five deletions and nothing else.

---

## 5. Verification

### 5.1 Static — import graph

| Metric | Before | After |
|---|---|---|
| Modules parsed | 225 | 221 |
| **Reachable from `main.tsx`** | **181** | **181** |
| Orphans | 44 | 40 |

**Reachable held at 181.** Nothing that renders was removed. Exactly four code modules left the graph, all from the orphan set.

Dangling-reference sweep across `client/`, `server/`, `shared/`: **0 references** to `CompanionAvatar`, `CompanionPresenceBadge`, `companion-styles`, `use-companion-greeting`, `tha-apple-badge`.

`shared/companion-interaction.ts` remains imported (by the two retained files) — the governed owner was **not** orphaned.

### 5.2 Typecheck — differential, not absolute

`npm run typecheck` **fails on this branch, and did so before this change.** An absolute pass/fail is therefore meaningless; a differential is not.

| | Total `error TS` | In `client/src` |
|---|---|---|
| Baseline (pre-deletion) | 178 | **0** |
| After deletion | 178 | **0** |

`diff` of the two error lists is **empty — byte-identical**. This change introduced no type errors and resolved none. All 178 are pre-existing and confined to `server/tests` (153), `server/intelligence/conversation` (10), `server/scripts` (7), and others — none in client code.

### 5.3 Build result

```
npm run build → exit 0
  ✓ vite built in 17.60s
    dist/public/assets/index-BzNIAJTR.js   3,552.68 kB │ gzip: 928.40 kB
    dist/public/assets/index-C9hxWdpt.css    173.63 kB │ gzip:  27.37 kB
  ✓ esbuild → dist/index.cjs  3.3mb   ⚡ Done in 901ms
```

**Build succeeds.** Two incidental observations:

- `tha-apple-badge.png` is **absent from the build output**; `tha-apple-CxvhFhkH.png` (the canonical apple) is still bundled. The 362 KB orphaned asset no longer ships.
- The build produced `dist/index.cjs`, which **did not exist before** — UI1 §2 recorded it missing, evidence that the previous build had completed its Vite step and never emitted the server bundle. `npm run build` begins with `rm -rf dist`, so `dist/` (gitignored) was regenerated. No source file was affected.
- One pre-existing esbuild warning (`import.meta` unavailable in `cjs`, from `server/tests/benchmark/bundle.ts`). Unrelated; present before this change.

### 5.4 Manual verification — live dev server

Probed against the running dev runtime (PID 15807, Vite middleware, port 5000), which **did not crash** — significant, because `server/vite.ts:24-27` calls `process.exit(1)` on any Vite error.

| Probe | Result |
|---|---|
| `/src/main.tsx` | `200 text/javascript` ✅ |
| `/src/App.tsx` | `200 text/javascript` ✅ |
| `/src/components/conversation/FloatingAssistant.tsx` | `200 text/javascript` ✅ |
| `/src/components/HomeIntelligenceCompanion.tsx` | `200 text/javascript` ✅ |
| `/src/components/PlannerIntelligenceStrip.tsx` | `200 text/javascript` ✅ |
| `/src/components/nav-bar.tsx` | `200 text/javascript` ✅ |
| `/src/components/icons/ThaAppleIcon.tsx` | `200 text/javascript` ✅ |
| `/src/components/companion/CompanionAvatar.tsx` | `text/html` — gone ✅ |
| `/src/components/companion/CompanionPresenceBadge.tsx` | `text/html` — gone ✅ |
| `/src/hooks/use-companion-greeting.ts` | `text/html` — gone ✅ |
| `/src/lib/companion-delight.ts` | `200 text/javascript` — retained ✅ |
| `/src/hooks/use-companion-observations.ts` | `200 text/javascript` — retained ✅ |
| `/api/version` | `{"version":"dev"}` ✅ |
| `/api/user` | `401` — auth gate intact ✅ |
| `/` | `<div id="root">` present ✅ |

> `text/html` on a `/src/…` path is Vite's catch-all (`server/vite.ts:35`) answering for a module that no longer exists — the expected signature of a removed file, not an error.

---

## 6. Remaining Companion duplicates

| File | Status | Rendered? | Authorised to remove? |
|---|---|---|---|
| `client/src/lib/companion-delight.ts` | **BLOCKED** — ownership-table row `:108`, classified "Mature", but zero importers | ❌ | **No** — architecture decision required |
| `client/src/hooks/use-companion-observations.ts` | **BLOCKED** — named `:190` as client of a route that does not exist | ❌ | **No** — architecture decision required |
| `client/src/components/PlannerIntelligenceCompanion.tsx` | **LEGACY orphan** — successor `PlannerIntelligenceStrip.tsx:3` names it as replaced; predecessor never retired (Principle 8) | ❌ | **No** — UI1 §7 step 2, out of UI1A scope |
| `client/src/components/HomeIntelligenceCompanion.tsx` | Canonical, rendered at `dashboard.tsx:276` | ✅ | Protected |
| `client/src/components/PlannerIntelligenceStrip.tsx` | Canonical, rendered at `weekly-planner-page.tsx:1957` | ✅ | Protected |
| `client/src/components/conversation/FloatingAssistant.tsx` | Canonical — the one Companion entry point | ✅ | Protected |
| `client/src/components/conversation/companion-card.ts` | Canonical (ownership-table row) | ✅ | Protected |
| `client/src/components/conversation/companion-action.ts` | Canonical | ✅ | Protected |
| `client/src/pages/admin-companion-intelligence-page.tsx` | Canonical, routed `/admin/companion-intelligence` | ✅ | Protected |

**There is now no Companion avatar renderer in the client** — which is exactly the state `THA_COMPANION_PLATFORM_ARCHITECTURE.md` §4.5 describes as current and intended (*"no client renderer today"*).

### 6.1 Explicitly out of scope (untouched, still orphaned)

The remaining `0b1f2f7` orphans are **not Companion** files and were left in place: `FoodOpportunitiesPanel.tsx`, `LearningSignalsPanel.tsx`, `intelligence/FoodOpportunityCard.tsx`, `intelligence/LearningSignalCard.tsx`, `hooks/use-food-opportunities.ts`, `hooks/use-learning-signals.ts`, `benchmark-impersonation-banner.tsx`.

---

## 7. Authorisation boundary

**No further Companion cleanup is authorised.**

Specifically, the following require an explicit architecture decision before any action:

1. `companion-delight.ts` — **wire it** (route `FloatingAssistant`'s motion through it, as `:108` claims) **or retire it** (delete the file *and* amend the ownership table). Do not delete it while the table names it.
2. `use-companion-observations.ts` — **build the missing `/api/intelligence/companion/observations` route** and register `observation-engine.ts` (as `:190` claims), **or retire both** and amend §5/§190.
3. `THA_COMPANION_PLATFORM_ARCHITECTURE.md` §37's claim *"No duplicated ownership was found anywhere in the platform"* — true again after UI1A, but it was false between `0b1f2f7` and this change. Consider whether the document should record that.
4. `PlannerIntelligenceCompanion.tsx` — UI1 §7 step 2, not step 1. Separate change.

Item 2 is the one to watch: it is the only case where deleting client code could strand a **server** capability (`observation-engine.ts`, `behaviour-engine.ts`, `test-intelligence-observation-engine.ts` all exist and are tested). Server code was not touched and must not be, per this change's constraints.

---

## 8. Change record

- **Rollback ID:** `ui1a-pre-cleanup` @ `45443a8f81c8a28ede0586192dd2965ba3aaf87a`
- **Staged change set:** 5 deletions, nothing else (`git diff --cached --name-status` → 5 × `D`)
- **Source files modified:** none
- **Server / shared / benchmark / intelligence code:** untouched
- **Governing documents:** unamended (discrepancies recorded in §2.4 for the owner)
- **Build artefacts:** `dist/` regenerated by `npm run build` (gitignored; not source)
- **New artefact:** this document
