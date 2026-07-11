# Clean Release Branch From Safety Branch — 2026-06-29

## Rollback Protection

**Rollback tag:** `rollback/pre-clean-release-analysis-20260629`
**Tagged HEAD:** `556747e` (Add release readiness report and documentation for environment checks)
**Branch:** `safety/preserve-since-last-prod-20260617-1613`

To restore to this exact state at any point:
```
git checkout safety/preserve-since-last-prod-20260617-1613
git reset --hard rollback/pre-clean-release-analysis-20260629
```

---

## Context

The safety branch `safety/preserve-since-last-prod-20260617-1613` was assembled
to preserve all work since the last production deploy (baseline: `28eda01`). It
includes feature work, regression fixes, docs, checkpoint artefacts, and several
commits that must not ship to production.

**Approved decision:** Option B — create a clean release branch from safety branch HEAD.

---

## CLEAN RELEASE STRATEGY

**Approach: Revert-on-branch**

1. Create `release/clean-20260629` from safety branch HEAD (`556747e`).
2. Apply targeted `git revert` for each excluded commit (non-destructive, history-preserving).
3. The reverts land as explicit commits documenting what was removed and why.
4. Result: a branch that contains all production-ready work minus the excluded items.

This avoids cherry-picking 50+ commits and keeps the diff reviewable.

---

## COMMITS TO KEEP

All commits between `28eda01` (baseline) and `556747e` (HEAD) **except** those
listed under EXCLUDE below. The keeps span the following workstreams:

### WX Workspace / UI Fixes (production-ready)
| Hash | Commit |
|------|--------|
| `5cf522b` | feat(wx14a): Workspace Apple optional — remove nav-only apples from Pantry & Nutrition |
| `ab2c032` | feat(wx14): Workspace apple — THA apple dropdown in actions slot for all workspace pages |
| `351fcd4` | fix(wx15b-5): Secondary nav for Nutrition, Diary, Analyser |
| `c3ffafe` | fix(wx15b-3): Shopping mobile header — restore breathing room in contextBar |
| `9878ff2` | fix(wx15b-2): Mobile header — show long THA logo instead of single apple |
| `aa06868` | fix(wx15b-1): Analyser rating filter — replace star ★ with THA apple logo |
| `ba5eac4` | feat(wx15-6): Shopping workspace — teal realm identity matching nav sidebar |
| `d7de432` | feat(wx15-4): Cookbook contextBar tabs always visible — remove hidden sm:flex |
| `dd18222` | feat(wx15-2): Header breakpoint sm→md — compact logo on phones in landscape |
| `4a99a03` | feat(wx15-1): Analyser score — single THA apple + N/5 text replaces stacked apples |
| `c3b9cc5` | feat(wx14): restore Shopping workspace visual identity — trolley icon and workspace teal |

### WX12B / WX9.x Platform Fixes (production-ready)
| Hash | Commit |
|------|--------|
| `7d9dea8` | WX12B: Correct TanStack Query v5 loading guards for page-level queries |
| `265cadd` | feat(wx9.3): above-the-fold optimisation — compress vertical dead space across all major pages |
| `f7eb3b4` | feat(wx9.2): experience integration — meal-first detail, conversational dashboard |
| `ce7e287` | feat(wx9): experience integration and launch readiness polish pass |

### WX8 / Household Nutrition Centre (production-ready — runtime code ships, bundled screenshots are collateral)
| Hash | Commit |
|------|--------|
| `8062fb1` | Add household nutrition overview and reporting features |
| `f1f971a` | chore(wx8): rollback safety checkpoint before Household Nutrition Centre |
| `58c8b73` | chore(wx7): rollback safety checkpoint before Pantry Intelligence |

### WS Food Intelligence (production-ready runtime code)
| Hash | Commit |
|------|--------|
| `a8a912a` | feat(ws0x7): Ingredient Resolution Engine Completeness Program |
| `f531216` | feat(ws11): Seasonal Stories Engine |
| `0dd662a` | feat(ws10): Household Stories Engine |
| `52cd86d` | feat(ws9): Food Alternatives Engine |
| `0a996f8` | feat(ws8): Food Discovery Engine |
| `9818d42` | feat(ws0.10): Global Food Catalogue ingestion pipeline |
| `1e403aa` | docs(ws0.9): preserve Global Food Catalogue Architecture investigation |
| `83438e5` | feat(ws0.6): Claude food authoring trial — 25 Mediterranean vegetables (**see note below**) |
| `bad86ca` | feat(ws0.8): launch food coverage expansion — 181 canonical / 188 knowledge foods |
| `a7eaef5` | feat(ws7): Food Relationship Graph POC (**see note below**) |

### WS Preservation / Checkpoint Commits (safe — docs + new files only)
| Hash | Commit |
|------|--------|
| `b47afcb` | chore(ws0.12): preserve Catalogue Normalisation and Promotion Readiness artifacts |
| `2c5753a` | chore(ws0.11): preserve Real USDA Ingestion Pilot artifacts |
| `e371af0` | docs(ws0.5): protect WS0.5 and WS1/WS6 investigation files |
| `fdeb3a5` | docs(ws11): preserve Seasonal Stories investigation |
| `5e4cb83` | docs(ws10): preserve Household Food Stories investigation |
| `17dee8e` | docs(ws9): preserve Goal-Driven Alternatives investigation |
| `cd4ef75` | docs(ws8): preserve Food Discovery Foundations investigation |
| `ea90557` | docs(ws7): preserve Food Relationships, Discovery and Stories investigation |
| `28e656f` | docs(ws6): preserve Canonical Food Report Architecture investigation |
| `5f44ca1` | docs(ws5a): preserve Preparation Knowledge Architecture investigation |
| `8e4ef24` | docs(ws4b): amend pipeline — automated canonical growth + multi-path benefits |
| `5d453d0` | docs(ws4b): preserve WS4B + WS3B investigations before amendment |

### Earlier Feature Work (production-ready)
| Hash | Commit |
|------|--------|
| `72eccee` | feat(ws3a): Nutrition Report page redesign — full 8-stage implementation |
| `9a436f8` | feat(ws2g): FoodReport UI Foundation |
| `3dfc94c` | fix(ws2f): Spinach variety model amendment + canonical DB alignment |
| `39a8810` | feat(ws2f): FoodReportKnowledgeAdapter — Food Report Foundation |
| `df914ad` | feat(pantry): WS1 Pantry Explore V2 — Nutrition Knowledge Hub (read-only) |
| `f384f6a` | fix(meal-detail): Correct Family Confidence and Household Adaptation visual language |
| `70fab0e` | feat(meal-detail): Implement Meal Detail Experience V3 - Phase 1 Core Structure |
| `67ee85e` | feat(dialogs): Migrate Food Knowledge and UPF Info to Dialog Foundation |
| `36a092a` | feat(hooks): Implement adaptive density foundation (Phase 1) |
| `9fe2c02` | fix(planner): reconcile boost count between planner card and meal modal |
| `836e40d` | feat(planner): Planner Meal Card V2 refinement |
| `4d8c00a` | feat(planner): Planner Meal Card V2 — Hybrid Meal Occasion intelligence visible in card |
| `5e1eb99` | feat(templates): enrich 6 pre-existing templates to canonical starter-shell status |
| `39de349` | feat(planner): hard-enforce household Vegetarian/Vegan in candidate pool |

### Docs-Only Commits (harmless — investigation markdown updates, no runtime impact)
These carry no risk and keep the audit trail intact:
`e3db63f`, `4667feb`, `4636ca6`, `2426e1e`, `09eade9`, `2426e1e`,
`781dfc5`, `e3857d6`, `9d59544`, `df28cf6`, `2fcb754`,
`83801f4`, `bae3b99`, `2e9b30c`, `9e06930`

---

## COMMITS TO EXCLUDE

### EXCLUDE 1 — Admin Password Reset Script
| Field | Value |
|-------|-------|
| **Hash** | `5689334` |
| **Commit** | `fix(wx15b-4): Reset admin password for colinclapson@hotmail.co.uk` |
| **Files** | `script/reset-admin-password.ts` (1 new file, 70 lines) |
| **Reason** | Dev-only script that resets a specific named account's password using scrypt. Contains a hardcoded email address (`colinclapson@hotmail.co.uk`). Has zero production runtime value; shipping it exposes operational tooling and a user's email in source. Commit message explicitly says "Dev-only script." |
| **Revert risk** | Zero — single new file, no downstream dependencies. |

### EXCLUDE 2 — UI Audit Screenshot Gallery
| Field | Value |
|-------|-------|
| **Hash** | `79e12a8` |
| **Commit** | `Create a comprehensive UI audit package with screenshots and gallery` |
| **Files** | `docs/ui-audit/` directory (44 PNG screenshots + `index.html` gallery + `README.md` + 1 txt + 1 moved md) |
| **Reason** | Pure UI audit artefact created by Replit Agent. No runtime code. Ships ~20 MB of PNG binaries and an HTML gallery page into the repository. Investigation-only material that should remain in the dev environment, not the production release. |
| **Revert risk** | Zero — all new files under `docs/ui-audit/`. One WX9A markdown file moved (not modified). |

### EXCLUDE 3 — Release Readiness Investigation Documents
| Field | Value |
|-------|-------|
| **Hash** | `556747e` |
| **Commit** | `Add release readiness report and documentation for environment checks` |
| **Files** | `ACCESS_CHECK_2026-06-28.md`, `RELEASE_RECAP_2026-06-28.md`, `RELEASE_REPORT_2026-06-28_BLOCKED.md`, `docs/investigations/MIGRATION_JOURNAL_REPAIR_2026-06-28.md` |
| **Reason** | Investigation-only markdown documents created by Replit Agent recording release environment checks. No runtime code. Documents an incomplete/blocked release attempt — deploying them adds noise and could cause confusion about production state. |
| **Revert risk** | Zero — all new markdown files only. |

---

## NOTES ON POC / TRIAL COMMITS

### `83438e5` — Claude Food Authoring Trial (25 Mediterranean vegetables)
**Status: KEEP as proposed — flagged for explicit approval.**
Despite the "trial" label, this commit modifies production-runtime seed data:
`shared/canonical/diversity-groups.ts`, `shared/canonical/foods.ts`,
`shared/knowledge/foods.ts`, `shared/knowledge/relationships.ts`.
Validation passes: test:knowledge-registry 23/23, test:canonical-food 46/46.
Zero validator errors. The word "trial" refers to the authoring _pipeline_ (Claude → validator → THA review), not the data itself. **This data is live in the safety branch already.**
If the 25 Mediterranean vegetables should NOT ship, this requires explicit exclusion.

### `a7eaef5` — Food Relationship Graph POC
**Status: KEEP as proposed — flagged for explicit approval.**
Creates `shared/relationships/food-graph.ts` and `shared/relationships/index.ts`.
These are new modules that exist in the codebase but the commit message notes the
result is "Rollback: ws0.8-protected-before-ws7-poc tag → bad86ca", indicating this
was a proof-of-concept investigation. The module is not confirmed as wired into any
production route. **Needs confirmation that this is intentionally shipping or should be excluded.**

---

## PROPOSED RELEASE BRANCH NAME

```
release/clean-20260629
```

---

## EXECUTION PLAN (awaiting approval)

```bash
# Step 1: Create release branch from safety HEAD
git checkout -b release/clean-20260629 safety/preserve-since-last-prod-20260617-1613

# Step 2: Revert excluded commits (newest first to minimise conflicts)
git revert --no-commit 556747e  # Release readiness investigation docs
git revert --no-commit 79e12a8  # UI audit screenshots gallery
git revert --no-commit 5689334  # Admin password reset script

# Step 3: Commit all reverts together with a clear message
git commit -m "chore(release): remove non-production artefacts for clean release

Reverts three commits that must not ship:
- 556747e: release readiness investigation docs (no runtime code)
- 79e12a8: UI audit screenshot gallery (~20MB PNGs + HTML gallery)
- 5689334: dev-only admin password reset script (hardcoded email address)

All production feature work (WX14, WX14a, WX15, WX15b, WX12B, WX9.x,
WS8-WS11, WS0.6-WS0.12, WX7, WX8) is retained unchanged."

# Step 4: Tag the clean release head
git tag release/clean-20260629-head HEAD
```

---

## RISK ASSESSMENT

| Risk | Level | Notes |
|------|-------|-------|
| Revert conflicts on `556747e` | None | Adds new markdown files only |
| Revert conflicts on `79e12a8` | None | Adds new files under docs/ui-audit/ |
| Revert conflicts on `5689334` | None | Adds one new script file |
| `83438e5` trial data ships | Low | Validated seed data; only risk is if the 25 foods were meant to remain unpublished |
| `a7eaef5` POC module ships | Low | Module exists but unclear if wired into production routes |
| `8062fb1` bundled screenshots ship | Low | wx9a-snapshots are inside docs/investigations/, no runtime impact |
| Missing a runtime-affecting commit in excludes | Low | All 3 excludes are docs/scripts only — no routes, no components, no schema changes |

**Overall release risk: LOW**

---

## WHAT WILL SHIP

- All WX14, WX14a workspace apple features
- All WX15, WX15b platform regression fixes (5 of 6 — Issue 3 Hotmail is investigation-only, no auth persistence change)
- WX12B TanStack Query v5 loading guard fixes
- WX9.x above-the-fold optimisation, experience integration, launch readiness polish
- WX8 Household Nutrition Centre (full feature)
- WX7 Pantry Intelligence Panel
- WS8–WS11 Food Intelligence Engines (Discovery, Alternatives, Household Stories, Seasonal Stories)
- WS0.6–WS0.12 canonical food data, catalogue pipeline, USDA ingestion
- WS3a Nutrition Report redesign
- WS2f FoodReport Foundation
- WS1 Pantry Explore V2
- All prior meal-detail, planner, dialog, hooks features

## WHAT WILL REMAIN OUT

- `script/reset-admin-password.ts` — dev operational script
- `docs/ui-audit/` — 44 PNG screenshots + HTML gallery
- `ACCESS_CHECK_2026-06-28.md`, `RELEASE_RECAP_2026-06-28.md`, `RELEASE_REPORT_2026-06-28_BLOCKED.md`, `docs/investigations/MIGRATION_JOURNAL_REPAIR_2026-06-28.md` — release investigation artefacts

---

## READY TO BUILD CLEAN RELEASE BRANCH: YES

**Pending explicit approval on two items before executing:**
1. Confirm `83438e5` (25 Mediterranean vegetables trial data) is intentionally shipping.
2. Confirm `a7eaef5` (Food Relationship Graph POC module) is intentionally shipping, or add it to the exclude list.

Stop. Awaiting approval before executing.
