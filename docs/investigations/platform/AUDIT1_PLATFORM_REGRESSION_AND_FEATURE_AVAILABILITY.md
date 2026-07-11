# AUDIT1 — Platform Regression & Feature Availability Audit

**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**HEAD at audit:** `d3c8827` — *Consolidate admin navigation and register missing admin routes*
**Scope:** Read-only audit of feature availability, routing, and navigation reachability against completed implementation reports. No unrelated code changes made.

---

## 1. Method

The audit reconstructed the three layers that determine whether a completed feature is actually *available* to a user:

1. **Route registration** — `client/src/App.tsx` `<Switch>` block (does a URL resolve to a page?).
2. **Navigation reachability** — the surfaces actually rendered (`DesktopSidebar`, `MobileNav`, `WorkspaceHeader`/`ProfileMenu`) and what they link to.
3. **Runtime health** — whether the page's page component and its backing server modules/endpoints actually load and respond.

Verification techniques used:
- Static read of the router, `nav-bar.tsx`, and `workspace-header.tsx`.
- `tsc --noEmit` (client: **0 errors**; server: type errors, several of which are genuine missing ESM exports — see §4).
- **Direct runtime module-load tests** under `tsx` (the running server's loader) to distinguish "type error only" from "module cannot load".
- **Live probing** of the running dev server (`localhost:5000`, `version: "dev"`) across representative endpoints for every domain.

### Navigation surfaces (what is actually rendered)

| Surface | Rendered by | Items exposed |
|---|---|---|
| Desktop sidebar (`SidebarBody`) | `ProtectedRoute` → `DesktopSidebar` | Planner, Nutrition (`/plant-diversity`), Cookbook, Pantry, Analyser, Shopping, Diary, Log out |
| Mobile bottom nav (`MobileNav`) | `ProtectedRoute` | Planner, Nutrition, Cookbook, Pantry, Analyser, Diary |
| Workspace header profile menu (`ProfileMenu`) | each page's `<WorkspaceHeader>` | Profile, Partners, **Admin** (admins only), Log out |
| Workspace header logo / basket | `<WorkspaceHeader>` | Dashboard (logo), Shopping (basket) |

> Note: `TopBar`, `AppleMenu`, and `BrandBanner` in `nav-bar.tsx` are **defined but never rendered** anywhere (see Finding F4). The live header is `WorkspaceHeader`/`ProfileMenu` in `workspace-header.tsx`.

---

## 2. Per-domain availability matrix

| # | Domain | Route(s) | Entry point (nav) | Runtime | Verdict |
|---|---|---|---|---|---|
| 1 | Navigation | — | sidebar / mobile / workspace header | ✅ | OK (dead code F4) |
| 2 | Dashboard | `/dashboard` | Header logo → `/dashboard` | ✅ 200 | OK |
| 3 | Profile | `/profile` | ProfileMenu → Profile | ✅ | OK |
| 4 | Cookbook | `/cookbook` (+`/meals`) → `MealsPage` | Sidebar → Cookbook | ✅ 401-gated | OK |
| 5 | Planner | `/planner` (+`/weekly-planner`) | Sidebar → Planner | ✅ | OK |
| 6 | Pantry | `/pantry` | Sidebar → Pantry | ✅ 200 | OK |
| 7 | Shopping | `/shopping-workspace` (+ redirects) | Sidebar + basket icon | ✅ 401-gated | OK |
| 8 | Diary | `/my-diary` (+`/diary`) | Sidebar → Diary | ✅ | OK |
| 9 | Analyser | `/analyser` (+`/products`) → `ProductsPage` | Sidebar → Analyser | ✅ | OK |
| 10 | Partners | `/partners` | ProfileMenu → Partners | ✅ 200 | OK |
| 11 | **Companion** | `/api/intelligence/conversation/*` (FloatingAssistant, global) | Floating button (global) | ❌ **500** | **REGRESSION — F2** |
| 12 | Nutrition Report | `/plant-diversity` → `PlantDiversityReport` | Sidebar → Nutrition | ✅ 200 | OK |
| 13 | Admin (hub) | `/admin` | ProfileMenu → Admin | ✅ | OK — restored (F1) |
| 14 | Benchmark tooling | `/admin/intelligence`, `/admin/benchmark-households` | Admin hub cards | ✅ 200 | OK — restored (F1) |
| 15 | Companion Intelligence (admin) | `/admin/companion-intelligence` | Admin hub card | ✅ | OK — restored (F1) |
| 16 | Users (admin) | `/admin/users` | Admin hub card | ✅ 403-gated | OK |
| 17 | Picks (admin) | `/admin/ingredient-products` | Admin hub card | ✅ | OK |
| 18 | Recipe Sources (admin) | `/admin/recipe-sources` | Admin hub card | ✅ 403-gated | OK |

Live probe (unauthenticated; `401`/`403` = route healthy + auth-gated, `200` = healthy public, `500` = broken, `404` = missing):

```
200  /api/version                                 401  /api/meals
401  /api/user                                    200  /api/pantry/items
401  /api/intelligence/conversation/turns         401  /api/shopping-list
401  /api/intelligence/conversation/threads       200  /api/partners
403  /api/admin/users                             200  /api/plant-diversity
403  /api/admin/recipe-sources
200  /api/admin/benchmark-households
```

> The conversation endpoints return `401` to *unauthenticated* probes because the auth guard runs **before** the dynamic import of the broken module. The breakage (F2) only surfaces *after* authentication, when the import executes — confirmed by direct module-load test rather than by probe.

---

## 3. Findings

### F2 — Companion (live AI conversation) is broken at runtime  ·  **Severity: HIGH**  ·  **Regression**

**Expected behaviour**
The global Floating Assistant (`client/src/components/conversation/FloatingAssistant.tsx`, mounted in `ProtectedRoute`) loads recent turns via `GET /api/intelligence/conversation/turns` and sends messages via `POST /api/intelligence/conversation/turn`. Users can converse with the Companion on every authenticated page.

**Current behaviour**
Every conversation endpoint returns **HTTP 500 `"Failed to process conversation turn"` / `"Failed to fetch conversation turns"`**. The Floating Assistant UI renders but no message can be sent and no history loads.

**Root cause**
All three conversation endpoints (`server/routes.ts:11236, 11298, 11312`) lazily `await import("./intelligence/conversation/conversation-gateway.js")`. That module **fails to load** at runtime:

```
SyntaxError: The requested module './nutrition-enrichment.js'
does not provide an export named 'extractFoodRef'
```

Chain:
- `conversation-gateway.ts:110` imports `household-nutrition-enrichment.js`.
- `household-nutrition-enrichment.ts:56` imports `{ extractFoodRef, FoodRef }` from `./nutrition-enrichment.js`.
- In `nutrition-enrichment.ts`, `FoodRef` (line 56, `interface`) and `extractFoodRef` (line 64, `function`) are **declared locally but not exported**.

This was introduced by commit **`0b1f2f7` "Saved progress at the end of the loop" (2026-07-07 13:02)** — a WIP checkpoint from the COMP5/COMP6 knowledge-assembly work that left the new `household-nutrition-enrichment.ts` importing symbols the source module never exported. `tsc` flags this (`household-nutrition-enrichment.ts(56,10)` and `(56,31)`), and the runtime ESM loader rejects the whole module graph.

Direct load test isolating the blast radius (all other conversation/companion modules load cleanly):

```
FAIL  conversation-gateway  -> ...does not provide an export named 'extractFoodRef'
OK    companion-observability      OK    conversation-store
OK    companion-learning-store     OK    turn-fallback
OK    companion-feedback-store     OK    companion-action-store
```

**Live-instance nuance (important for accurate characterisation):** the running dev process (PID 173) was started **2026-07-07 12:00**, *before* the breaking commit at 13:02, and runs without `--watch`. If it dynamically imported `conversation-gateway` before 13:02, that (then-valid) module is cached in memory and the live instance may still serve Companion until it restarts. **The on-disk source is broken**, so any restart, redeploy, or production build/boot deterministically breaks every Companion conversation endpoint. This is a live regression, not a stale-cache artefact.

**Blast radius**
- Broken: live Companion chat — send turn, load turns, load threads (`/turn`, `/turns`, `/threads`). Downstream turn-scoped endpoints (feedback, guidance-click, action confirm/cancel) are unreachable in practice because no turn can be created.
- **Not** affected: Admin → Companion Intelligence observability/learning dashboards (`/api/intelligence/observability/*`, `/api/intelligence/learning/*`) and Benchmark tooling — these import different modules that all load cleanly.

**Recommended fix** (out of this audit's implementation scope — Admin-only; see §5)
Export the two symbols from `server/intelligence/conversation/nutrition-enrichment.ts`:
```ts
export interface FoodRef { … }          // line 56
export function extractFoodRef(…) { … } // line 64
```
Then re-run `tsc --noEmit` and the direct load test to confirm `conversation-gateway` loads. (The remaining server `tsc` errors listed in §4 should be triaged as a follow-up; several are also genuine missing exports on adjacent modules.)

**Classification:** Regression (feature was implemented and working; broken by a later WIP commit).

---

### F1 — Admin domain was orphaned; already restored  ·  **Severity: was HIGH, now RESOLVED**  ·  **Routing issue (resolved)**

**Expected behaviour**
A single routed Admin entry point (`/admin`) reachable from navigation, surfacing all admin sub-sections.

**Prior behaviour (before HEAD)**
`admin-page.tsx`, `admin-intelligence-page.tsx`, and `admin-benchmark-households-page.tsx` existed as files but had **no registered routes** — they were unreachable. Navigation also exposed four separate admin links (Users, Picks, Recipe Sources, Companion Intelligence) instead of one hub, bypassing the hub entirely.

**Current behaviour**
Resolved by **commit `d3c8827`** (current HEAD) and documented in `docs/implementation/admin/ADMIN1B_ADMIN_DOMAIN_ENTRY_POINT.md`. All seven admin routes are now registered in `App.tsx:210–216`, and both dropdown menus consolidate to a single **Admin → `/admin`** entry (admins only). The hub (`admin-page.tsx`) surfaces all sub-sections as cards: Users, Picks, Recipe Sources, Companion Intelligence, Benchmark Households, Intelligence Dashboard. Verified live: `/api/admin/*` endpoints return `200`/`403` (healthy + gated).

**Root cause (of the original regression)** Routes were never registered when the three pages were added; navigation duplicated per-section links.

**Recommended fix** None required — already implemented and verified. No further action taken (would be redundant). See §5 for the decision rationale.

**Classification:** Routing issue — **resolved** prior to this audit.

---

### F3 — No in-app return path from admin pages back to the Admin hub  ·  **Severity: MEDIUM**  ·  **Navigation issue**

**Expected behaviour**
From any admin sub-page a user can return to the Admin hub (`/admin`) without the browser back button.

**Current behaviour**
Admin pages do **not** render `WorkspaceHeader` (they use bespoke headers), so the `ProfileMenu → Admin` link is absent while on an admin page. The desktop sidebar/mobile nav contain no Admin entry. Cross-links between admin sub-pages exist (e.g. `admin-benchmark-households` → `/admin/intelligence`; `admin-intelligence` → `/admin/companion-intelligence`) but **no admin page links back to `/admin`**. Net effect: once inside admin-land, the only way back to the hub is the browser back button or manually re-typing the URL. (`setLocation("/")` calls in some sub-pages are non-admin **guard redirects**, not a hub link.)

**Root cause** Admin pages opt out of the shared `WorkspaceHeader`, and no "Back to Admin" affordance was added to the sub-pages or hub.

**Recommended fix** Add a "← Admin" link (to `/admin`) in each admin sub-page header, or render `WorkspaceHeader` on admin pages so the consolidated `ProfileMenu → Admin` is available. Low-risk, additive.

**Classification:** Navigation issue.

---

### F4 — Dead navigation code: `TopBar` / `AppleMenu` / `BrandBanner`  ·  **Severity: LOW**  ·  **Navigation issue (code hygiene)**

**Expected behaviour** One canonical top navigation implementation.

**Current behaviour** `nav-bar.tsx` exports `TopBar`, `AppleMenu`, and `BrandBanner`, but **none are imported or rendered** anywhere in the app. The live header is `WorkspaceHeader`/`ProfileMenu` (`workspace-header.tsx`). The two implementations duplicated the Profile/Partners/Admin menu; commit `d3c8827` updated **both** the dead `AppleMenu` and the live `ProfileMenu`, so they currently agree — but the dead copy is a standing trap for future drift (a change made only to `AppleMenu` would silently have no effect).

**Root cause** A navigation refactor (WX14/WX10E era → unified `WorkspaceHeader`) superseded `TopBar` but the old component tree was left in place.

**Recommended fix** Delete `TopBar`, `AppleMenu`, and `BrandBanner` (and now-unused imports/`REALM_STYLES` entries they alone use) from `nav-bar.tsx`, keeping the exported `DesktopSidebar`, `MobileNav`, `AppRealmContext`, `SidebarContext`. Verify no residual imports first.

**Classification:** Navigation issue (dead code / maintenance risk). Not user-facing.

---

### F5 — Admin pages lack the shared workspace chrome (basket / profile menu)  ·  **Severity: LOW**  ·  **Navigation issue**

**Expected behaviour** Consistent global chrome (basket, profile menu) across authenticated pages.

**Current behaviour** Because admin pages don't render `WorkspaceHeader`, they show no basket icon and no profile menu; only the persistent sidebar/mobile nav remain. This is a consistency gap rather than a reachability failure (the sidebar still lets the user leave admin-land), and overlaps with F3. Acceptable if intentional, but worth an explicit decision.

**Classification:** Navigation issue (consistency). Overlaps F3.

---

## 4. Server type-check observations (context, not all defects)

`tsc --noEmit` reports **0 client errors** and multiple server errors. Most are confined to `server/scripts/*`, `server/cli/*`, and `--downlevelIteration`/`Set` iteration noise that `tsx`/esbuild tolerate at runtime and do not affect features. However, several are **genuine missing ESM exports** on modules in the conversation subsystem and are the same class of defect as F2 — they warrant a follow-up triage:

- `nutrition-enrichment.ts` → `extractFoodRef`, `FoodRef` (the F2 root cause).
- `turn-fallback.ts` → `describeQueried`, `formatSuggestions`, `setUnsuccessfulQuerySink` referenced by `conversation-gateway.ts`/`turn-outcome-store.ts` but not exported.
- `intent-resolver.ts` → `IntentVerb`; `capability-registry.ts` → `CapabilityHandler`; `intelligence-platform.ts` → `IIntelligencePlatform` (name mismatch).
- `@shared/schema` → `platformTurnOutcomes`, `PlatformTurnOutcome` referenced by `turn-outcome-store.ts`.
- `profile` type missing `companionPersonality` (referenced in `conversation-gateway.ts:912` and several `server/scripts/*`).

These modules were **not** in the failing runtime path for the endpoints tested (the three conversation endpoints fail earlier, on `nutrition-enrichment`), but they indicate the COMP5/COMP6/EL1 refactor left the conversation subsystem in an inconsistent export state. Fixing F2 alone unblocks the module load; the others should be verified so a later code path doesn't hit the next missing export.

---

## 5. Actions taken & scope decision

**No code changes were made by this audit.** Rationale:

- **Admin domain (the sanctioned restore target):** already restored by commit `d3c8827` (current HEAD) and documented in `docs/implementation/admin/ADMIN1B_ADMIN_DOMAIN_ENTRY_POINT.md`. Re-implementing would be redundant. Verified reachable and healthy. Residual polish is captured as F3/F5 for a follow-up, not done here.
- **Companion regression (F2):** a **separate, unrelated** defect in the conversation subsystem. The task explicitly scopes implementation to the Admin domain and instructs "do not implement unrelated fixes," so F2 is documented with a precise root cause and recommended fix rather than patched here. It is the single highest-impact issue found and should be scheduled immediately (one-line export fix + triage of §4).
- **Dead code (F4):** documented; removal deferred to avoid unrelated churn.

---

## 6. Summary

| Finding | Domain | Type | Severity | Status |
|---|---|---|---|---|
| **F2** | Companion (live AI chat) | Regression | **HIGH** | **Open** — fix recommended |
| F1 | Admin domain entry point | Routing | (was High) | **Resolved** (`d3c8827` / ADMIN1B) |
| F3 | Admin sub-page → hub return path | Navigation | Medium | Open |
| F4 | Dead `TopBar`/`AppleMenu`/`BrandBanner` | Navigation (hygiene) | Low | Open |
| F5 | Admin pages lack shared chrome | Navigation | Low | Open |
| §4 | Conversation subsystem export gaps | Regression (latent) | Medium | Open — triage |

**Bottom line:** Of the 18 audited domains, **17 are present and reachable**; the Admin domain and its four sub-tools were unreachable but were **restored in the immediately preceding commit** and are now verified healthy. The one live regression is the **Companion conversation gateway (F2)**, broken by a WIP commit that imports two symbols `nutrition-enrichment.ts` never exports — the current running instance may still serve it from a pre-regression module cache, but any restart/redeploy breaks every Companion conversation endpoint (HTTP 500). No unrelated fixes were implemented.
