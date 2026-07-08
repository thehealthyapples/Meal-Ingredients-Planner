# UI1 — Canonical UI Ownership Audit

**Status:** 🔍 Investigation only — no code modified, nothing deleted, nothing renamed, nothing moved
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**Audit baseline (rollback identifier):** `45443a8f81c8a28ede0586192dd2965ba3aaf87a`
**Scope:** Every visible UI surface in `client/src`. Ownership only — no refactor, no cleanup.
**Related:** [`ARCHITECTURE_PRINCIPLES.md`](../architecture/ARCHITECTURE_PRINCIPLES.md) (Principles 1, 2, 8) · [`THA_COMPANION_PLATFORM_ARCHITECTURE.md`](../architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md) · [`AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md`](./AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md) · [`ADMIN1D_ADMIN_DOMAIN_NAVIGATION.md`](../implementation/ADMIN1D_ADMIN_DOMAIN_NAVIGATION.md)

---

## 0. Preconditions

1. **`docs/architecture/README.md` read** (Architecture Bootstrap, mandatory entry point, GOV-AI2).
2. **Architecture conflicts: none.** This audit proposes no change. It *reports* findings that are, in several cases, existing violations of the governing architecture — it does not introduce any. Nothing here contradicts a governing document; §5 records where the codebase already does.
3. **Investigation only.** No file under `client/`, `server/`, or `shared/` was modified. The sole artefact produced is this document.

**Governance side-finding (not a UI issue).** Three documents live in `docs/architecture/` but are **not indexed in `README.md`'s tables**, despite the README declaring itself "the single canonical home":

| File | Tracked? |
|---|---|
| `PLATFORM_QUALITY_ARCHITECTURE.md` | yes |
| `THA_COMPANION_PLATFORM_ARCHITECTURE.md` | yes |
| `GOV2_CANONICAL_ALIAS_PRINCIPLE.md` | **no — untracked** |

`THA_COMPANION_PLATFORM_ARCHITECTURE.md` is the governing document this audit leans on hardest (§5.1). Its absence from the index means it is governing-by-content but invisible-by-navigation. Raised for the architecture owner; out of scope here.

---

## 1. Method

Ownership was determined by a **static import graph**, not by grep. A resolver was written to follow `@/…`, relative, and barrel (`index.ts`) specifiers from the single entrypoint `client/src/main.tsx`, computing the transitive reachable set.

- **Rendered** = reachable from `main.tsx`.
- **Orphaned** = present in `client/src` and unreachable from `main.tsx`.

The graph was validated three ways before its results were trusted:

1. **No dynamic imports exist** that could defeat static analysis. The only `import(` occurrences in `client/src` are TypeScript *type-position* imports (`import('@shared/schema').IngredientSource` in `shopping-list-page.tsx:349,359`). There is no `React.lazy`, no code-splitting boundary. The graph is therefore complete.
2. **Sampled orphans were re-checked by independent grep.** Every apparent contradiction resolved in the graph's favour — e.g. `PlannerIntelligenceCompanion` appears in four files, but all four are **comments** (`PlannerIntelligenceStrip.tsx:3` reads *"Replaces the WeeklyPlantDiversityCounter row + PlannerIntelligenceCompanion"*). Not one is an import.
3. **Barrel exports were followed**, so `intelligence/index.ts` re-exports do not produce false orphans.

Runtime confirmed live and serving working-tree source at the time of audit (Vite middleware, `NODE_ENV=development`, port 5000).

**Files inspected: 225** TypeScript/TSX modules under `client/src` (parsed by the graph), plus `client/index.html`, `vite.config.ts`, `server/index.ts`, `server/vite.ts`, `server/static.ts`, `.replit`, and 4 governing architecture documents. Asset directories `client/src/assets/icons/` (4 files) and `client/public/` (10 files) were inventoried and hashed.

---

## 2. Headline counts

| Metric | Count |
|---|---|
| Client modules parsed | 225 |
| Reachable from `main.tsx` | 181 |
| **Orphaned modules** | **44** |
| — of which unused shadcn/ui primitives | 21 |
| — of which **product code** | **23** |
| **Orphaned assets** | **3** |
| **Duplicate / competing implementation sets** | **10** |
| — ACTIVE DUPLICATE (both sides rendered) | 4 |
| — ORPHANED | 4 |
| — LEGACY | 2 |

### 2.1 The single largest contributor

Commit **`0b1f2f7`** — *"Saved progress at the end of the loop"*, authored by **`Replit Agent <agent@replit.com>`**, 2026-07-07 13:02:33 — added **17 files** to `client/src`. **14 of them are unreachable from `main.tsx`.**

| Added by `0b1f2f7` | Reachable? |
|---|---|
| `components/companion/CompanionAvatar.tsx` | ❌ |
| `components/companion/CompanionPresenceBadge.tsx` | ❌ |
| `components/companion/companion-styles.ts` | ❌ |
| `components/FoodOpportunitiesPanel.tsx` | ❌ |
| `components/LearningSignalsPanel.tsx` | ❌ |
| `components/intelligence/FoodOpportunityCard.tsx` | ❌ |
| `components/intelligence/LearningSignalCard.tsx` | ❌ |
| `components/benchmark-impersonation-banner.tsx` | ❌ |
| `hooks/use-companion-greeting.ts` | ❌ |
| `hooks/use-companion-observations.ts` | ❌ |
| `hooks/use-food-opportunities.ts` | ❌ |
| `hooks/use-learning-signals.ts` | ❌ |
| `lib/companion-delight.ts` | ❌ |
| `assets/icons/tha-apple-badge.png` | ❌ |
| `pages/admin-page.tsx` | ✅ routed |
| `pages/admin-intelligence-page.tsx` | ✅ routed |
| `pages/admin-benchmark-households-page.tsx` | ✅ routed |

A complete Companion-avatar, food-opportunity and learning-signal UI subsystem was introduced and **wired to nothing**. It is 13 product modules and 1 asset of dead surface area that reads, on inspection, exactly like live code.

---

## 3. Canonical owner map

`App.tsx` is the single composition root. It is the only file that mounts navigation, banners, the assistant, and the toaster.

```
main.tsx
└── App.tsx                          ← composition root (sole owner of global chrome)
    ├── QueryClientProvider / TooltipProvider
    ├── SiteBanner            ← global site-wide notice
    ├── TrialBanner           ← subscription/trial state
    ├── AdminBanner           ← via withAdminBanner() HOC, Admin pages only
    ├── DesktopSidebar        ┐
    ├── MobileNav             ├─ all three from components/nav-bar.tsx
    ├── AppRealmContext       ┘
    ├── FloatingAssistant     ← the one Companion entry point
    ├── Toaster               ← the one toast host
    ├── OrchardShell          ← /auth and /onboarding only
    └── Router (wouter)       ← 29 routed pages
```

### 3.1 Surface ownership table

| Surface | Canonical Owner | Duplicate? | Rendered? | Recommended Action |
|---|---|---|---|---|
| **App shell** | `App.tsx` | No | ✅ | None — sole composition root |
| **Auth/onboarding shell** | `components/layout/orchard-shell.tsx` | No | ✅ | None |
| **Shell backdrop** | `components/layout/orchard-backdrop.tsx` | No | ✅ | None |
| Shell hero art | `components/illustrations/orchard-hero.tsx` | — | ❌ | **ORPHANED** — investigate before deletion |
| **Header** | `components/workspace-header.tsx` (16 consumers) | Yes — `PageHeader.tsx` | ✅ | `PageHeader` is **ORPHANED/LEGACY** — safe to delete |
| **Left navigation** | `components/nav-bar.tsx` → `DesktopSidebar` | No | ✅ | None — single-sourced; Admin present, gated `role === "admin"` |
| **Mobile navigation** | `components/nav-bar.tsx` → `MobileNav` | No | ✅ | None — same file, same `NAV_ITEMS` |
| Nav scaffold | `components/ui/sidebar.tsx` | Competes conceptually | ❌ | **ORPHANED** shadcn scaffold, 0 importers — safe to delete |
| **Dashboard** | `pages/dashboard.tsx` | No | ✅ | None |
| Marketing home | `pages/home-page.tsx` | No — distinct (logged-out) | ✅ | **INTENTIONAL** |
| **Companion (Home)** | `components/HomeIntelligenceCompanion.tsx` | Yes | ✅ | Renders lucide `Leaf`/`Sparkles` — no apple asset |
| **Companion (Planner)** | `components/PlannerIntelligenceStrip.tsx` | Yes — `PlannerIntelligenceCompanion.tsx` | ✅ | Predecessor is **LEGACY** (its replacement says so in a comment) — un-retired |
| **Companion entry point** | `components/conversation/FloatingAssistant.tsx` | No | ✅ | None — the one assistant |
| **Companion avatar/icon** | *none rendered* | Yes — `companion/CompanionAvatar.tsx` | ❌ | **ORPHANED**. See §5.1 — highest-priority finding |
| Companion presence | `companion/CompanionPresenceBadge.tsx` | — | ❌ | **ORPHANED** — imports `CompanionAvatar`, imported by nothing |
| Companion styles | `companion/companion-styles.ts` | — | ❌ | **ORPHANED** — 0 importers |
| Companion hooks | `use-companion-greeting`, `use-companion-observations`, `lib/companion-delight` | — | ❌ | **ORPHANED** — 0 importers each |
| **Admin** | `pages/admin-page.tsx` + `components/admin-banner.tsx` | No | ✅ | None — 8 routes registered, banner via HOC |
| **Planner** | `pages/weekly-planner-page.tsx` (via `PlannerPageWrapper`) | No | ✅ | None |
| **Shopping (canonical)** | `pages/shopping-workspace-page.tsx` | Yes ×2 | ✅ | Default landing route |
| Shopping (basket) | `pages/shopping-list-page.tsx` → `ShoppingListView.tsx` (3,517 LOC) | Yes | ✅ | **ACTIVE DUPLICATE** — still routed at `/basket`, `/analyse-basket` |
| Shopping (legacy) | `pages/list-page.tsx` (772 LOC) | Yes | ❌ | **ORPHANED/LEGACY** — only page not imported by `App.tsx`; `/list` redirects away |
| **Pantry** | `pages/pantry-page.tsx` | No | ✅ | None |
| Pantry intelligence | `components/PantryIntelligencePanel.tsx` | No | ✅ | Consumes `intelligence/` barrel ✅ |
| **Cookbook** | `pages/meals-page.tsx` (6,868 LOC — serves `/meals` **and** `/cookbook`) | No | ✅ | None — one owner, two routes |
| **Profile** | `pages/profile-page.tsx` | No | ✅ | None |
| **Partners** | `pages/partners-page.tsx` | No — distinct from Supermarkets | ✅ | **INTENTIONAL**; reachable only via apple menu |
| Supermarkets | `pages/supermarkets-page.tsx` | No | ✅ | Routed, but **no nav entry anywhere** — URL-only |
| **Knowledge (food modal)** | `components/food-knowledge-modal.tsx` | No | ✅ | None |
| **Knowledge (pantry hub)** | `components/PantryKnowledgeHub.tsx` | No | ✅ | None |
| **Knowledge (food page)** | `pages/food-detail-page.tsx` | No | ✅ | None |
| **Knowledge (review)** | `pages/admin-knowledge-review-page.tsx` | No | ✅ | Note: only Admin route **not** wrapped by `withAdminBanner` |
| **Modals** | `components/ui/dialog.tsx` (31 consumers) | Partial | ✅ | See §5.4 — `dialog-foundation.ts` adopted by only 2 of 14 |
| Drawers / sheets | `ui/drawer.tsx` (11) · `ui/sheet.tsx` (4) · `ui/alert-dialog.tsx` (3) | No | ✅ | **INTENTIONAL** — presentation variants |
| Orphaned modal | `components/scan-confirm-dialog.tsx` (416 LOC) | — | ❌ | **ORPHANED** — 0 consumers |
| **Toasts** | `components/ui/toaster.tsx` + `hooks/use-toast.ts` (45 consumers) | No | ✅ | None — exactly one host, mounted once |
| **Shared banners** | `SiteBanner` · `TrialBanner` · `admin-banner` | No — distinct purposes | ✅ | **INTENTIONAL** |
| Orphaned banner | `components/benchmark-impersonation-banner.tsx` | — | ❌ | **ORPHANED** — investigate (benchmark feature may be incomplete) |
| **Cards (intelligence)** | `components/intelligence/index.ts` barrel (6 consumers) | Yes | ✅ | Barrel declares itself *"the single source of truth for the system's look"* |
| Card outside barrel | `intelligence/FoodOpportunityCard.tsx` | Yes — vs `OpportunityCard` | ❌ | **ORPHANED** — bypasses the WX2_5 barrel entirely |
| Card outside barrel | `intelligence/LearningSignalCard.tsx` | — | ❌ | **ORPHANED** — not exported by the barrel |
| **Apple rating** | `components/AppleRating.tsx` (5 consumers) | **Yes — `ui/apple-rating.tsx` (2 consumers)** | ✅ both | **ACTIVE DUPLICATE** — two implementations, both live |
| **Brand apple icon** | *contested* — three mechanisms | **Yes** | ✅ | **ACTIVE DUPLICATE** — see §5.2 |
| **Page layouts** | `workspace-header.tsx` + per-page composition | No formal layout owner | ✅ | No `Layout` component exists; each page composes its own |
| **Mobile detection** | `hooks/use-mobile.tsx` | **Yes — 5 inline copies** | ❌ canonical | **ACTIVE DUPLICATE** — canonical hook is orphaned; see §5.3 |

---

## 4. Duplicate register (classified)

| # | Duplicate set | Classification | Rendered sides |
|---|---|---|---|
| 1 | `components/AppleRating.tsx` **vs** `components/ui/apple-rating.tsx` | **ACTIVE DUPLICATE** | Both (5 vs 2 consumers) |
| 2 | `hooks/use-mobile.tsx` **vs** 5 inline `function useIsMobile()` copies | **ACTIVE DUPLICATE** | Inline copies only; canonical orphaned |
| 3 | Brand apple: `ThaAppleIcon.tsx` (2) **vs** raw `tha-apple.png` import (19) **vs** `FiveApplesLogo.tsx` → `/apple-logo.png` (1) | **ACTIVE DUPLICATE** | All three |
| 4 | `client/public/apple-logo.png` **vs** `client/public/apple-rating-1.png` — **byte-identical** (`md5 824653d9c1cd32155fe9bc8bc2e0bc5e`) | **ACTIVE DUPLICATE** (asset) | Both |
| 5 | `companion/CompanionAvatar.tsx` (`tha-apple-badge.png`) **vs** rendered companions (lucide icons) | **ORPHANED** | Neither side renders an apple avatar |
| 6 | `intelligence/FoodOpportunityCard.tsx` **vs** `intelligence/OpportunityCard.tsx` | **ORPHANED** | Barrel version only |
| 7 | `intelligence/LearningSignalCard.tsx` (outside barrel) | **ORPHANED** | Neither |
| 8 | `PlannerIntelligenceCompanion.tsx` **vs** `PlannerIntelligenceStrip.tsx` | **LEGACY** (predecessor un-retired) | Strip only |
| 9 | `pages/list-page.tsx` **vs** `shopping-workspace-page.tsx` / `shopping-list-page.tsx` | **LEGACY** | Neither (unrouted) |
| 10 | `components/PageHeader.tsx` **vs** `components/workspace-header.tsx` | **ORPHANED** | workspace-header only |

**Additional UNUSED (not duplicates, simply dead):** `HealthTrendChart.tsx`, `NutritionBoostPanel.tsx`, `RankModeSelector.tsx`, `scan-confirm-dialog.tsx`, `illustrations/orchard-hero.tsx`, `benchmark-impersonation-banner.tsx`, `FoodOpportunitiesPanel.tsx`, `LearningSignalsPanel.tsx`, `lib/whole-food-fallback.ts`, `hooks/use-food-opportunities.ts`, `hooks/use-learning-signals.ts`, `hooks/use-companion-greeting.ts`, `hooks/use-companion-observations.ts`, `lib/companion-delight.ts`, `companion/companion-styles.ts`.

**UNUSED shadcn/ui primitives (21):** `accordion`, `alert`, `aspect-ratio`, `breadcrumb`, `calendar`, `carousel`, `chart`, `command`, `context-menu`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `radio-group`, `resizable`, `scroll-area`, `sidebar`, `slider`, `toggle-group`, `toggle`. These are **INTENTIONAL** — an unpruned component-library scaffold, not competing implementations. They carry no ownership ambiguity.

### 4.1 Orphaned assets

| Asset | Size | Sole importer | Status |
|---|---|---|---|
| `assets/icons/tha-apple-badge.png` | 362 KB | `CompanionAvatar.tsx` (orphan) | Transitively orphaned |
| `assets/icons/tha-apple-sort.png` | 1.19 MB | `RankModeSelector.tsx` (orphan) | Transitively orphaned |
| `assets/icons/The healthy apples recommneds.png` | 1.49 MB | `RankModeSelector.tsx` (orphan) | Transitively orphaned — **and the filename is misspelled** |

---

## 5. HIGH PRIORITY — architecture violations

### 5.1 🔴 A second Companion mechanism exists in the client

`THA_COMPANION_PLATFORM_ARCHITECTURE.md:13` states, verbatim:

> **There is one Companion. Every capability it gains — voice, behaviour, observation, growth, guidance, experience — is a new responsibility of that one platform, never a new assistant, a new conversation, or a second copy of a mechanism the platform already owns.**

The same document, §37, asserts: *"No duplicated ownership was found anywhere in the platform."* **That assertion is now false at the client layer.** Commit `0b1f2f7` introduced a parallel Companion presentation stack — `CompanionAvatar`, `CompanionPresenceBadge`, `companion-styles`, `use-companion-greeting`, `use-companion-observations`, `companion-delight` — none of it reachable, none of it named as replacing anything, and none of it retired.

It is currently harmless because it renders nowhere. It is dangerous precisely *because* it renders nowhere: it is a fully-formed second Companion waiting for someone to import it. Anyone editing `CompanionAvatar.tsx` to "fix the Companion icon" will observe zero effect and conclude the build is broken.

**Violates:** Companion Platform §13 (one Companion, no second copy of a mechanism) and Principle 8 (retire on introduction).

### 5.2 🔴 The brand apple has three owners

There are three independent ways to render the single THA apple, and all three are live:

| Mechanism | Consumers | Source |
|---|---|---|
| `components/icons/ThaAppleIcon.tsx` | 2 | `assets/icons/tha-apple.png` |
| Raw asset import (no component) | **19** | `assets/icons/tha-apple.png` |
| `components/FiveApplesLogo.tsx` | 1 | `/apple-logo.png` (public dir) |

An icon component exists and is bypassed by 19 files that import the PNG directly. A fourth path (`CompanionAvatar` → `tha-apple-badge.png`) is orphaned. Sizing, `alt` text, and `data-testid` are therefore re-decided at 19 call sites.

**Violates:** Principle 1 (one canonical identity per entity — the brand mark has four key spaces) and Principle 2 (one owner per fact).

### 5.3 🔴 `useIsMobile` is defined six times

`hooks/use-mobile.tsx` is the canonical hook. It is imported by exactly one file — `components/ui/sidebar.tsx` — which is itself orphaned. **The canonical hook is therefore unreachable from `main.tsx`.**

Meanwhile five rendered components each define their own private `function useIsMobile()`:

- `components/PlannerMealPickerPanel.tsx:16`
- `components/day-view-drawer.tsx:16`
- `components/CookbookWorkspacePanel.tsx:40`
- `components/PlannerAssistantPanel.tsx:116`
- `components/SmartReviewPanelContent.tsx:23`

The breakpoint is duplicated five times. A responsive-breakpoint change requires five coordinated edits, and the file named `use-mobile.tsx` — the file a developer would naturally edit — affects nothing.

**Violates:** Principle 2 (one owner per fact).

### 5.4 🟡 `AppleRating` has two live implementations

`components/AppleRating.tsx` exports a default *and* named `AppleRating`, plus `RATING_LABELS` and `RATING_COLORS`. `components/ui/apple-rating.tsx` exports a different, simpler default `AppleRating`. Both render. Consumers split 5 / 2, and `ui/score-badge.tsx` — a shared primitive — depends on the `ui/` variant while `pages/dashboard.tsx` also uses it, and `products-page`, `shopping-list-page`, `food-diary-page`, `AnalyserDetailV2`, `PlannerAnalyserContent` use the other.

Two components with the same exported name, differing rating semantics, both live. This is the duplicate most likely to produce a *visible, wrong* rating.

**Violates:** Principle 1 (one canonical identity) and Principle 2.

### 5.5 🟡 The WX2_5 Intelligence Experience System is bypassed

`components/intelligence/index.ts` declares itself:

> *"Visual tokens — the single source of truth for the system's look."*

Two cards were added to `components/intelligence/` **without being exported from the barrel**: `FoodOpportunityCard.tsx` and `LearningSignalCard.tsx`. `FoodOpportunityCard` duplicates the barrel's own `OpportunityCard`. Both are orphaned, but they sit inside the directory that claims single-source-of-truth status, so a future author will reasonably assume they are part of the system.

**Violates:** Principle 8 (a new card superseding `OpportunityCard` must name what it replaces and state a retirement condition — it does neither).

### 5.6 🟡 `dialog-foundation.ts` is adopted by 2 of 14 modal components

`ui/dialog-foundation.ts` establishes THA's "shared semantic language for dialog sizing and presentation" and warns *"This distinction is intentional and must be preserved."* Only `upf-info-modal.tsx` and `food-knowledge-modal.tsx` import it. The other twelve modal/dialog/sheet/drawer components size themselves ad hoc. The naming is also split across four conventions (`*Modal.tsx`, `*-modal.tsx`, `*-dialog.tsx`, `*Sheet.tsx`).

Not a duplicate implementation — a **single source of truth with 14% adoption.**

---

## 6. Answers to the five questions

### 1. Can every visible UI be traced to exactly one owner?

**Yes — every *visible* surface, with two qualifications.** All 29 routed pages and all global chrome resolve to exactly one owner, because `App.tsx` is the sole composition root and `nav-bar.tsx` is the sole navigation source.

The failures are not ambiguous ownership of visible surfaces; they are:
- **Four cross-cutting *behaviours*** with more than one owner: apple icon (§5.2), `useIsMobile` (§5.3), `AppleRating` (§5.4), dialog sizing (§5.6).
- **23 product modules** that look like owners of surfaces but own nothing, because nothing renders them.

So: every pixel traces to one owner. But **23 modules trace to no pixel**, and four behaviours trace to several. The risk is not that the UI is ambiguous today — it is that the *codebase* is, and the next author cannot tell the difference by reading it.

### 2. Which duplicate should be removed first?

**`client/src/components/companion/` (three files) plus `assets/icons/tha-apple-badge.png`.**

It is first not because it is the largest, but because it is the only duplicate that is *actively misleading a live investigation*. It directly violates the one-Companion rule (§5.1), it is provably unreachable, it was added by an automated commit that never wired it in, and it is the file a developer edits when asked to change the Companion icon — to no effect.

### 3. Which duplicate is most likely to cause future regressions?

**`useIsMobile` (§5.3)** — with `AppleRating` (§5.4) a close second.

`useIsMobile` is the more dangerous of the two because the failure is *silent and asymmetric*. Five rendered components hold private breakpoint copies while the canonically-named `hooks/use-mobile.tsx` is orphaned. A developer changing the breakpoint will edit the canonical file, see no change, and then — most likely — edit one or two of the five inline copies, leaving the layout inconsistent across Planner, Cookbook and the day-view drawer. There is no type error, no test failure, and no import to grep for, because the copies share no symbol.

`AppleRating` is more *visible* when it goes wrong (a wrong score is obvious) but less likely to go wrong unnoticed.

### 4. Which components are safe to delete?

Safe = zero importers, zero transitive reachability, no external contract, and a named successor or no purpose. **Deletion is NOT performed here.**

| Component | Why safe |
|---|---|
| `components/PageHeader.tsx` | 0 importers; successor `workspace-header.tsx` has 16 |
| `components/PlannerIntelligenceCompanion.tsx` | 0 importers; successor names it in `PlannerIntelligenceStrip.tsx:3` |
| `components/companion/CompanionAvatar.tsx` | 0 importers outside its own orphan cluster |
| `components/companion/CompanionPresenceBadge.tsx` | 0 importers |
| `components/companion/companion-styles.ts` | 0 importers |
| `components/intelligence/FoodOpportunityCard.tsx` | 0 importers outside orphan cluster; duplicates barrel `OpportunityCard` |
| `components/intelligence/LearningSignalCard.tsx` | 0 importers outside orphan cluster |
| `components/FoodOpportunitiesPanel.tsx` | 0 importers |
| `components/LearningSignalsPanel.tsx` | 0 importers |
| `hooks/use-companion-greeting.ts` | 0 importers |
| `hooks/use-companion-observations.ts` | 0 importers |
| `lib/companion-delight.ts` | 0 importers |
| `lib/whole-food-fallback.ts` | 0 importers |
| `components/illustrations/orchard-hero.tsx` | 0 importers |
| `assets/icons/tha-apple-badge.png` | sole importer is an orphan |
| The 21 unused `ui/` primitives | scaffold; 0 importers |

### 5. Which require investigation before deletion?

| Component | Open question |
|---|---|
| `components/benchmark-impersonation-banner.tsx` | The Benchmark feature is under active development (`BENCH1`, `BENCH1B`, `BENCH2`, `INTQ6` docs; `admin-benchmark-households-page.tsx` **is** routed). This banner may be an unwired half of a live feature, not dead code. **Ask the benchmark owner.** |
| `hooks/use-food-opportunities.ts`, `hooks/use-learning-signals.ts` | Both hit **server endpoints that may exist and be tested**. Deleting the client hook may orphan a server capability. Verify against the Intelligence Capability Registry first. |
| `pages/list-page.tsx` | `lib/quick-list.ts:3` documents a runtime contract: *"list-page.tsx reads `PENDING_LIST_KEY` on mount and supports both payload formats."* `shopping-list-page.tsx:1589` also references it. That contract may have migrated — or may not have. **Verify Quick List end-to-end before deleting.** |
| `components/scan-confirm-dialog.tsx` (416 LOC) | Three live scan-review components exist (`PlannerScanReview`, `RecipeScanReview`, `ShoppingListScanReview`). Determine whether this was the shared predecessor of all three or a distinct abandoned flow. |
| `components/HealthTrendChart.tsx`, `NutritionBoostPanel.tsx` | Substantial nutrition UI. `nutrition-variety-chips.tsx:151` references `NutritionBoostPanel` **in a comment** as though it were live. May be planned surfaces, not dead ones. |
| `components/RankModeSelector.tsx` | Sole importer of two large assets. Confirm Analyser ranking has no plan to reinstate it. |
| `components/ui/sidebar.tsx` | Orphaned — **but it is the only importer of the canonical `hooks/use-mobile.tsx`.** Deleting it makes the canonical hook a zero-importer file, which may cause a cleanup pass to delete the hook that §5.3 says should become the single owner. **Sequence matters.** |
| `pages/supermarkets-page.tsx` | Routed but has **no navigation entry anywhere**. Reachable only by typing the URL. Not orphaned — but is it intended to be reachable? |
| `client/public/apple-logo.png` ≡ `apple-rating-1.png` | Byte-identical. Determine which is canonical before touching either; `ShoppingListView.tsx` hard-codes `/apple-logo.png` as an `onError` fallback at line 3449. |

---

## 7. Recommended cleanup order

Each step is independently revertible and independently verifiable. **None is authorised by this document.**

| # | Step | Risk | Rationale |
|---|---|---|---|
| 1 | Delete the `0b1f2f7` orphan cluster: `companion/` (3 files), `FoodOpportunitiesPanel`, `LearningSignalsPanel`, `intelligence/FoodOpportunityCard`, `intelligence/LearningSignalCard`, `lib/companion-delight`, `assets/icons/tha-apple-badge.png` | **Zero** — provably unreachable | Resolves §5.1. Removes the second Companion before anyone imports it. Hold `use-food-opportunities` / `use-learning-signals` for step 6. |
| 2 | Delete `PageHeader.tsx`, `PlannerIntelligenceCompanion.tsx`, `illustrations/orchard-hero.tsx`, `lib/whole-food-fallback.ts` | Zero | Named successors exist and are live |
| 3 | Consolidate `useIsMobile`: point the 5 inline copies at `hooks/use-mobile.tsx` — **before** deleting `ui/sidebar.tsx` | Low, mechanical | Resolves §5.3. Order is load-bearing: `ui/sidebar.tsx` is the hook's only importer today |
| 4 | Resolve `AppleRating`: choose one implementation, migrate the 7 consumers | Medium — **visible** | Resolves §5.4. Requires a decision on rating semantics, not just an edit |
| 5 | Route all brand-apple rendering through `ThaAppleIcon` (19 raw imports) | Medium, mechanical | Resolves §5.2. Keep `FiveApplesLogo` if the five-apple lockup is genuinely a different mark |
| 6 | Investigate then act on the §6.5 list (benchmark banner, opportunity/signal hooks, `list-page`, `scan-confirm-dialog`, `HealthTrendChart`, `NutritionBoostPanel`, `RankModeSelector` + its 2 assets) | Unknown | Each needs an owner's answer first |
| 7 | Retire `pages/list-page.tsx` **only after** the Quick List `PENDING_LIST_KEY` contract is verified end-to-end | Medium | `lib/quick-list.ts:3` documents a live-looking contract |
| 8 | Prune the 21 unused `ui/` primitives | Zero | Cosmetic; do last — lowest value, and they may be wanted by future work |
| 9 | Raise separately: `dialog-foundation.ts` adoption (§5.6); the three unindexed architecture docs (§0); `supermarkets-page` having no nav entry | — | Not cleanup — governance |

**Deliberately excluded from this order:** deleting `apple-logo.png` or `apple-rating-1.png`. They are byte-identical, but `ShoppingListView.tsx:3449` uses `/apple-logo.png` as a runtime `onError` fallback. Deduplicating public assets is a separate change with a separate blast radius.

---

## 8. Rollback

No source file was modified. No file was deleted, renamed, or moved.

- **Audit baseline commit:** `45443a8f81c8a28ede0586192dd2965ba3aaf87a` (`int1-intelligence-platform`)
- **Working tree at audit time:** 142 modified/untracked paths, pre-existing, untouched by this audit
- **Only artefact created:** `docs/investigations/UI1_CANONICAL_UI_OWNERSHIP_AUDIT.md`
- **To roll back:** `rm docs/investigations/UI1_CANONICAL_UI_OWNERSHIP_AUDIT.md`

**No cleanup is authorised by this document. Nothing in §7 may be executed without explicit approval.**
