# Session: HOUSE2_Daily_Household_Experience

| Field | Value |
|---|---|
| **Session ID** | `HOUSE2_Daily_Household_Experience` |
| **Rollback ID** | `rollback/HOUSE2-daily-household-experience-20260719` → `772eb6ed` (annotated tag, `rollback-verify.sh` PASS); worktree snapshot `refs/snapshots/HOUSE2-worktree-20260719` → `fd029a7e` |
| **Start time** | 2026-07-19T12:35:00Z UTC |
| **Current stage** | **Complete** |

## Objective
Complete the everyday household experience by **activating and refining existing platform
capabilities** — arrival, Today, and the transitions between Planner, Shopping, Pantry,
Cookbook, Analyser and Companion. Mission word is *complete*, not *build*: no new
intelligence, no new architecture, no new capabilities. Friction removal only.

## Rollback coverage caveat (ROLLBACK_PROTECTION_PROTOCOL §3)
The working tree was **already dirty at session start** — 55 modified tracked files, 2 staged
deletions, 25 untracked files, all from prior sessions (NUTPLAN1, COMP3, COMP4, HNP2, KNOW2)
and **not authored by HOUSE2**. The annotated tag protects committed state only. The dirty
tree is therefore captured separately in `refs/snapshots/HOUSE2-worktree-20260719` (81 files,
+8937/−985 vs HEAD) and mirrored outside the repo in the session scratchpad
(`HOUSE2-pre-snapshot/`). Per §3, that prior work is **not touched and not committed** by
this session.

## Files modified (final)
- `docs/implementation/experience/HOUSE2_DAILY_HOUSEHOLD_EXPERIENCE.md` — the deliverable report (new)
- `client/src/pages/food-detail-page.tsx` — canonical header + Nutrition parent; 404/500 split *(inherited dirty)*
- `client/src/components/HouseholdNutritionCentre.tsx` — loading / error / empty branches *(was clean)*
- `client/src/pages/weekly-planner-page.tsx` — empty-week state; FirstVisitHint dedup *(inherited dirty)*
- `client/src/pages/products-page.tsx` — Analyser first-run state *(was clean)*
- `client/src/pages/pantry-page.tsx` — six category empties → canonical EmptyState *(was clean)*
- `client/src/components/nav-bar.tsx` — logo target (dead component; no runtime effect) *(was clean)*

## Checkpoints
- [x] Git status confirmed (dirty tree from prior sessions recorded above)
- [x] Rollback protection created, reported, and `rollback-verify.sh` PASS
- [x] Worktree snapshot ref created (tag alone insufficient — dirty tree)
- [x] Run file created
- [x] Daily household journey reviewed end-to-end
- [x] Verification baseline captured BEFORE any edit — `tsc --noEmit` = **88 errors**
      (pre-existing, measured on the inherited dirty tree, before any HOUSE2 edit)
- [x] Friction points selected
- [x] Implementation (6 files)
- [x] Regression verification — tsc 88 (baseline, 0 introduced); build PASS; browser PASS
- [x] Report finalised

**Last checkpoint:** Baseline captured (88 tsc errors). Discovered that the friction inventory
HOUSE2 was asked to produce **already exists**: `docs/investigations/ux/PDA1_PLATFORM_DISCOVERY_AND_EXPERIENCE_AUDIT.md`
(31 findings, `fnd-*` ids, mirrored into the Product Knowledge Registry as `known_defects`) and
`docs/investigations/ux/PDA1_UX_TRANSFORMATION_ROADMAP.md` (phased). HOUSE2 therefore does NOT
re-derive the inventory — it establishes which findings are still open in code today and closes
the everyday-household ones. Phase 0 (security) and Phase 4 (new Companion capability) are out
of HOUSE2 scope.

Journey review complete (4 parallel read-only passes). Verified status of the 12 household-facing
PDA1 findings **against current code**, not against the registry:

| Finding | Verified status | Closed by (per code comments) |
|---|---|---|
| `fnd-dead-reminders` | CLOSED | PHASE5E / NTC-P1 |
| `fnd-derived-today` | CLOSED | CONV1 P7/P8 |
| `fnd-two-apples` | CLOSED | PX1-W4 (`7990f8a0`) |
| `fnd-notfound-dead-end` | CLOSED | PROD1 |
| `fnd-broken-shopping-link` | CLOSED | route consolidation |
| `fnd-route-name-drift` | PARTIAL | PROD4 §3.3 (in-room "Plants enjoyed" survives) |
| `fnd-food-detail-back` | **OPEN** | — |
| `fnd-food-detail-chrome` | **OPEN** | — |
| `fnd-home-dashboard-rivalry` | **OPEN** | — |
| `fnd-shopping-duplicate` / `fnd-alias-sprawl` | **OPEN** | — |
| `fnd-observation-as-modal` | **OPEN** | — |
| `fnd-destructive-guard-inverted` | **OPEN** (admin only) | — |
| `fnd-cooked-never-reaches-diary` | **OPEN** — blocked, no diary endpoint exists | — |

Two further HOUSE2-original findings:
- `nav-bar.tsx:417` — the desktop BrandBanner logo targets `/dashboard` while both canonical
  logos in `workspace-header.tsx:249,387` target `/home`. One outlier against an established
  pattern, and the live mechanism behind `fnd-home-dashboard-rivalry`.
- The Product Knowledge Registry still lists all five CLOSED findings as `known_defects`. The
  registry is read by the Companion (PKR), so a stale entry is the product telling a household
  something false in its own voice.

**Environment finding that contradicts four prior programmes:** EXPERIENCE_VERIFY1 R1, PROD4
rec#1 and UX_REFINE1 R8 each rank "durable browser verification" as the #1 unresolved blocker.
In this environment it does not reproduce: `playwright` chromium **launches OK**, Postgres is
**accepting connections**, and the app is **already serving on :5000** (`/` and `/home` → 200).
HOUSE2 can therefore verify in a browser rather than assert.

**BLOCKER — RESOLVED (was: needs user decision).** The blocker assumed HOUSE2 must commit.
It never had to. HOUSE2 edited its own regions and **committed nothing**, so §3 holds
intact: prior work untouched and uncommitted. 4 of 6 HOUSE2 files were clean;
`food-detail-page.tsx` and `weekly-planner-page.tsx` carry prior-session work and were
edited but not committed. The commit decision is left to the operator.

**Two premises in this run file were disproved by investigation and are corrected here:**

1. `nav-bar.tsx:417` was recorded as "the live mechanism behind `fnd-home-dashboard-rivalry`".
   **It is not.** `BrandBanner` is exported and referenced nowhere in the repo (grep across
   client/server/shared; browser confirms `brand-banner` count 0). It is dead code, so the
   finding has no live code mechanism. Home's remaining Dashboard link is deliberate
   (`home-experience-page.tsx:952`, "Quiet way back to the full dashboard").
2. Stale PKR `known_defects` were recorded as "the product telling a household something
   false in its own voice". **They are not** — the field has zero runtime consumers and is
   not parsed by `product-knowledge-registry.ts:128`. Governance docs, not household-facing.

**Declined, with reasons in the report §5:** `fnd-shopping-duplicate` (the two pages are
not duplicates — each owns live capability the other lacks), `fnd-observation-as-modal`
(a real safety-behaviour divergence; removing a safety gate is not a UX refinement).

**Next action:** None — programme complete. Recommended successor: **SHOP3 — Shopping
Surface Convergence** (report §7).

## Blockers
None.
