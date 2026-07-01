# THA AI Capability Registry & Intent Taxonomy

**Status:** GOVERNING ARCHITECTURE — promoted from investigation `TIP2` on 2026-06-30 (GOV-AI1). No code, schema, runtime, or API changes.
**Classification:** Intelligence Governance (canonical)
**Date:** 2026-06-30
**Author:** Architecture investigation (Claude Code)
**Predecessor:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
**Governing documents:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`

> **What this document is.** TIP1 established *that* THA should have one Intelligence Platform (one spine, three permission profiles, an Intent Engine that owns no business logic). TIP2 is the **canonical contract** that engine works against: the enumerated set of capabilities the AI may touch, the typed intents it may express, who owns each, and when a human must confirm. TIP1 = architecture. TIP2 = the registry the architecture binds to.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Working tree contained one untracked file (`docs/investigations/TIP1_...md`); branch `main` ahead of `origin/main` by 4 commits |
| HEAD commit | `d0a925260c3e8237c3ce423ff4412795ffe35c7d` |
| **Rollback tag created** | **`rollback/TIP2-pre-investigation`** |
| Tag points to | `14fa631f2dcb4799cf6e660cc1f8718cd984a80a` (annotated tag object) |
| Action on rollback | `git checkout rollback/TIP2-pre-investigation` (or `git reset --hard rollback/TIP2-pre-investigation`) |
| Code modified | None — this document is the only artifact created |
| Schema modified | None |

**This is an investigation only.** No application code, database schema, services, routes, or prompts were modified. The single output is this document.

---

## ARCHITECTURE COMPLIANCE REVIEW (gate)

Per the mandate: *if any proposal fails these principles — STOP.* The TIP2 registry was validated against THA's governing principles **before** being written. Because TIP2 enumerates *existing* capabilities and binds them to their *existing* owners, it is structurally compliant: it invents no entity, owner, or logic. The gate confirms it does not drift.

| Principle | TIP2 compliance | Verdict |
|---|---|---|
| One canonical identity | TIP2 introduces **no new entities**. Capabilities and intents are descriptors of existing services, not stored entities. | ✅ Pass |
| One owner per fact | Every capability row names exactly one existing authoritative owner (drawn from the SoT Register). The registry **reads** ownership; it never reassigns it. | ✅ Pass |
| One owner per capability | This is the central deliverable. Each capability has exactly one owning service; no capability is listed twice under two owners (see §5 Ownership Matrix and the duplicate-ownership check in §5.3). | ✅ Pass |
| No duplicate entities | The registry points at existing routes/services; it defines no parallel record. | ✅ Pass |
| No duplicate ownership | Verified explicitly in §5.3 — every (capability → owner) edge is unique. | ✅ Pass |
| No duplicate business logic | Intents are *typed front doors* to existing endpoints. The taxonomy adds **zero** domain logic; an intent that cannot map to an existing endpoint is recorded as a **gap**, not implemented (§2.4, §6 Future Roadmap). | ✅ Pass |
| Extend existing architecture | TIP2 binds to `server/lib/access.ts`, the existing route surface (`server/routes.ts`), the existing `admin_audit_log` / `storage.createAuditLog`, and the SoT-declared owners. It replaces nothing. | ✅ Pass |
| Progressive enrichment / honest gaps | Where THA has no capability for a desired intent (e.g. "Order shopping"), TIP2 records an **honest gap** rather than fabricating an owner. See §1.4 and §6. | ✅ Pass |
| No permanent synchronisation bridge | The registry is a **derived projection** of the route table + SoT Register — rebuildable, never an authoritative second store. It is regenerated from source, never written back to. | ✅ Pass |

**Gate result: PASS.** The registry describes what exists and binds AI access to it without creating a second owner of anything. The investigation continues.

---

## GROUNDING — METHOD

This registry is not aspirational. It was built by enumerating the **live** system:

1. **Capabilities** were derived from the actual HTTP surface in `server/routes.ts` (≈200 endpoints across 30+ path groups) cross-referenced with the client surface in `client/src/pages/` (24 pages).
2. **Owners** were taken from `docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (27 declared domains) — TIP2 **inherits** those ownership declarations and does not re-declare them.
3. **Permission primitives** were read from `server/lib/access.ts`: `isAdmin()`, `getTier()`, `hasPremiumAccess()`, `assertAdmin` (middleware), `requirePremium` (middleware); plus the Passport `req.isAuthenticated()` guard used 204× in routes.
4. **Audit primitive** is the existing `storage.createAuditLog({ adminUserId, action, targetUserId?, metadata? })` writing to the `admin_audit_log` table — reuse, never rebuild.

Every capability in §2 names a **real route prefix**. Every owner names a **real service or table**. Where a desired future intent has no backing endpoint, it is flagged `GAP`.

---

# 1. EXECUTIVE SUMMARY

The Healthy Apples AI must operate against a **closed, typed allow-list** — never against "the codebase" or "the database." TIP2 defines that allow-list in two halves that compose:

- A **Capability Registry** (§2): the ~13 capability domains the AI may touch, each with one canonical owner, one existing service, one existing API surface, and a declared level of *future AI access* (read-only / assisted / write / future / never).
- An **Intent Taxonomy** (§3): 20 canonical **verbs** (Read, Explain, Search, Recommend, Generate, Add, Move, Replace, Delete, Import, Export, Analyse, Compare, Optimise, Share, Order, Review, Report, Suggest, Approve). An AI action is *always* exactly one `(verb × capability)` pair that resolves to exactly one existing endpoint.

**Five findings define the contract:**

1. **The registry is the boundary.** An action the AI can perform is a registered `(intent × capability)` pair and nothing else. There is no freeform execution, no raw SQL, no "the model decided to." This is what makes TIP1's Intent Engine safe.

2. **Every capability already has exactly one owner.** Because TIP2 inherits the SoT Register, the "one owner per capability" requirement is *already satisfied by construction* for every transactional domain — Planner, Shopping, Meals, Household, Diary, Pantry, Profile, Knowledge, Templates, Product/Analyser all have a single declared owner. TIP2's job is to *bind to* those owners, not to choose new ones.

3. **Classification drives confirmation, not the model.** Each capability is classed (read-only / write / destructive / long-running / AI-assisted / human-confirmation-required / background / future). The *class* — server-side, not the LLM's judgement — decides whether a human must confirm. Destructive and bulk verbs **always** confirm.

4. **Several headline "AI features" are honest gaps today.** *Order shopping* (no checkout/retailer-order endpoint exists — `grocery-integration.ts` builds baskets, it does not place orders), a first-class *Export* surface (only `GET /api/admin/meals/export` exists; there is no user data-export endpoint), and *Delete planner (whole week)* exists only as `DELETE /api/planner/weeks/:weekId/entries` (clears entries, not the week). TIP2 records these as gaps rather than inventing owners for them.

5. **Future assistants add intents, not logic.** Planner/Shopping/Nutrition/Household/Developer/Admin assistants (§6) are each a *bundle of already-registered intents* over the one spine. The day any of them needs its own copy of planner or nutrition logic, the architecture has failed — that is the line TIP2 exists to hold.

**Recommendation:** Adopt this registry as the canonical AI↔THA contract. Implement read-only and AI-assisted intents first (lowest risk, already-grounded), then additive write intents behind confirmation, then destructive/bulk intents behind strong confirmation. Treat every `GAP` as a *governed feature request* (Rule 8), never as a licence for the AI to improvise.

---

# 2. PART 1 — CAPABILITY REGISTRY

A **capability** is a coherent domain of action that THA already exposes through a service + API + UI. For each: its **canonical owner** (from the SoT Register), the **existing service**, the **existing API** (real route prefix), the **current UI**, and the **future AI access** posture.

> *Future AI access legend:* **R** = read/answer only · **R+A** = read + AI-assisted suggestion (advisory, human acts) · **W** = write via confirmed intent · **W!** = write incl. destructive (strong confirmation) · **Future** = desired but no backing endpoint today (GAP) · **Never** = must never be exposed to the user-facing AI plane.

### 2.1 Capability inventory

| # | Capability | Canonical owner (SoT) | Existing service | Existing API (real) | Current UI | Future AI access |
|---|---|---|---|---|---|---|
| C1 | **Planner** | DB `planner_weeks` / `planner_days` / `planner_entries` (SoT D14) | `server/lib/meal-service.ts`, `planner-compliance.ts`, `meal-resolution-service.ts` | `/api/planner/*` (31 routes) | `weekly-planner-page.tsx` | **W!** |
| C2 | **Shopping** | DB `shopping_list` / `shopping_list_extras` (SoT D15) | `grocery-integration.ts`, `supermarket-basket-service.ts`, `price-lookup.ts` | `/api/shopping-list/*`, `/api/shopping/*`, `/api/basket/*`, `/api/user-basket/*` | `shopping-list-page.tsx`, `shopping-workspace-page.tsx` | **W** (order = Future) |
| C3 | **Nutrition / Knowledge** | WS0 `knowledge_*` tables (SoT D1) | `services/nutrition-knowledge-registry.ts`, `nutrition-centre-assembler.ts` | `/api/knowledge/*`, `/api/nutrition*`, `/api/nutrition-centre`, `/api/food-knowledge/*` | `food-detail-page.tsx`, nutrition centre | **R** (read-only knowledge) |
| C4 | **Cookbook / Meals** | DB `meals` + `meal_items` (SoT D12) | `meal-service.ts`, `recipe-swap-engine.ts`, `meal-resolution-service.ts`, `recipeParser.ts` | `/api/meals/*`, `/api/meal-items/*` | `meals-page.tsx`, `meal-detail-page.tsx`, `quick-meal-page.tsx` | **W!** |
| C5 | **Diary** | DB `food_diary_*` (SoT D21) | routes-resident diary logic + `meal-resolution-service.ts` | `/api/food-diary/*` | `food-diary-page.tsx` | **W** |
| C6 | **Profile / Preferences** | DB `user_preferences` + `users.*` columns (SoT D7, D26, D27) | `sanitizeUser.ts`, routes-resident profile logic | `/api/profile`, `/api/user/preferences`, `/api/user/*-settings` | `profile-page.tsx`, `onboarding-page.tsx` | **W** (own data) |
| C7 | **Partners / Supermarkets** | `retailIntelligence.ts` + `grocery-integration.ts` (retailer mapping) | `retailIntelligence.ts`, `product-matching-service.ts`, `price-lookup.ts` | `/api/basket/supermarkets-enhanced`, `/api/routing`, `/api/product-alternatives`, `/api/savings/*` | `partners-page.tsx`, `supermarkets-page.tsx` | **R+A** |
| C8 | **Pantry** | DB `userPantryItems` + WS8/WS9/WS10/WS11 engines (SoT D8–11) | `shared/discovery`, `shared/alternatives`, `shared/stories`, `shared/seasonal`, `item-resolver.ts` | `/api/pantry/*`, `/api/user-items/*`, `/api/freezer/*` | `pantry-page.tsx`, `plant-diversity-page.tsx` | **W** (+ R for discovery/stories) |
| C9 | **Analyser (Product/UPF)** | `product-analysis.ts` + `upf-analysis-service.ts` (SoT D19) | `product-analysis.ts`, `ocr.ts`, `openfoodfacts-importer.ts`, `product-event-logger.ts` | `/api/scan`, `/api/products/barcode/:barcode`, `/api/additives`, `/api/user/product-history` | `products-page.tsx`, `food-detail-page.tsx` | **R+A** |
| C10 | **Household** | DB `households` / `household_members` / `household_eaters` (SoT D16) | `server/lib/household.ts`, `household-meal-matcher.ts` | `/api/household/*` | profile / onboarding household sections | **W!** (membership) |
| C11 | **Plan Templates** | DB `meal_templates` / `meal_plan_templates` (SoT D13) | `template-migration.ts`, `meal-food-intelligence.ts` | `/api/plan-templates/*`, `/api/meal-templates/*` | template browse/apply UI, `shared-plan-page.tsx` | **W** |
| C12 | **Administration** | `server/lib/access.ts` + `admin_audit_log` | `storage.ts` (admin methods), `auto-import-service.ts`, `backfill-classifier.ts` | `/api/admin/*` (33 routes) | `admin-users-page.tsx`, `admin-recipe-sources-page.tsx`, `admin-ingredient-products-page.tsx` | **W!** (admin role only) |
| C13 | **Developer / Platform** | repo + `docs/` + SoT Register | n/a (read tooling) | n/a (no production route) | n/a | **R** in isolated dev plane only — **Never** in user plane |

### 2.2 Cross-cutting "intelligence" capabilities (read-only assemblers)

These are not new owners — they are **assembled read models** over the owners above (TIP1 Principle 4). The AI consumes them; it never writes through them.

| Assembler | Reads from (owners) | API | AI access |
|---|---|---|---|
| Meal intelligence | C4 + C3 | `/api/meals/:id/intelligence`, `/api/meals/:id/food-intelligence` | R |
| Food intelligence | C3 + canonical identity | `/api/foods/:slug/intelligence`, `/api/foods/:slug/connected` | R |
| Planner intelligence | C1 + compliance | `/api/planner/weeks/:weekId/intelligence`, `/api/planner/full` | R |
| Shopping intelligence | C2 | `/api/shopping/intelligence` | R |
| Pantry intelligence | C8 | `/api/pantry/intelligence` | R |
| Home / nutrition centre | C1+C3+C5 | `/api/home/intelligence`, `/api/nutrition-centre` | R |

### 2.3 Per-capability detail (the contract rows)

The matrix above is the index. Three capabilities carry the highest AI risk and are detailed; the rest follow the same shape.

**C1 Planner (highest write surface).** Real endpoints span weeks/days/entries/eaters/provisioning. AI-relevant intents: *Read* (`GET /api/planner/full`), *Add* (`PUT /api/planner/days/:dayId/entries`, `POST /api/planner/days/:dayId/items`), *Move/Replace* (`PATCH /api/planner/entries/:entryId`, `.../meal`, `PATCH /api/planner/entries/reorder`), *Generate* (`POST /api/meal-plans/smart-suggest`), *Delete* (`DELETE /api/planner/entries/:entryId`, `DELETE /api/planner/weeks/:weekId/entries`). **All mutations are owned by the planner service; the AI never writes planner rows directly.**

**C2 Shopping.** *Read* (`GET /api/shopping-list/extras`, `/api/shopping/intelligence`), *Add* (`POST /api/shopping-list/extras`, `POST /api/user-basket`), *Delete* (`DELETE /api/shopping-list/extras/:id`), *Generate basket* (`POST /api/basket/create`). **Order = GAP:** no endpoint places a real retailer order; `grocery-integration.ts` constructs a basket/deeplink only. "Order shopping" must remain a *prepare-basket + hand-off* intent until a checkout owner exists (Rule 8).

**C12 Administration.** Entirely behind `assertAdmin`. AI exposure is **admin-role only**, every action audited via `storage.createAuditLog`. Includes destructive/operational verbs (`POST /api/admin/users/:id/reset-password`, `PUT /api/admin/users/:id/subscription`, publish/archive templates). These are **Human-Confirmation-Required** without exception.

### 2.4 Honest gaps (capabilities the AI will be *asked* for but THA does not own yet)

| Desired intent | Why it's a gap | Correct posture |
|---|---|---|
| **Order shopping** (place a real order) | No checkout/retailer-order endpoint; basket build ≠ order placement | `Future` — prepare basket + hand-off; do not fabricate an order owner |
| **Export my data** (user-facing) | Only `GET /api/admin/meals/export` exists (admin meals dump) | `Future` — register intent, mark GAP; needs a governed export owner |
| **Delete whole planner week** (the week record) | Only `DELETE /api/planner/weeks/:weekId/entries` (clears entries) exists | Bind to the clear-entries endpoint; "delete the week object" is a GAP |
| **Pay / manage billing** | No billing-mutation endpoint in routes (`subscriptionTier` set only via admin) | `Never` via AI write; read-only tier status only |

Recording these as gaps **is** the architecture working: honest gaps over fabricated information (Principle 6 / 9).

---

# 3. PART 2 — INTENT TAXONOMY

An **intent** is a canonical verb. An **AI action** is exactly one `(verb × capability)` pair, resolving to exactly one existing endpoint. The taxonomy is closed: a verb that has no `(verb × capability)` mapping to a real endpoint cannot be executed — it is a gap, not an improvisation.

### 3.1 Canonical verbs

| Verb | Semantics | Mutates? | Default confirmation | Primary owner mapping rule |
|---|---|---|---|---|
| **Read** | Return existing data as-is | No | None | `GET` on the capability's owner |
| **Explain** | Narrate grounded knowledge/reasons | No | None | Knowledge read + compliance-reason read |
| **Search** | Find within a capability | No | None | `GET .../search` or lookup |
| **Recommend** | Rank options (advisory) | No | None | Assembler / recommendation read |
| **Suggest** | Propose a next action (advisory) | No | None | Read + assembler; human acts |
| **Generate** | Produce new content (week, recipe, basket) | Yes (creates) | **Required** | `POST .../smart-suggest`, `smart-create`, `basket/create` |
| **Add** | Insert one item | Yes | Required (light) | `POST`/`PUT` add endpoints |
| **Move** | Relocate within a capability | Yes | **Required** | `PATCH .../reorder`, `.../entries/:id` |
| **Replace** | Swap one entity for another | Yes | **Required** | `PATCH .../meal`, `recipe-swap-engine` |
| **Delete** | Remove an item | Yes (destructive) | **Required (strong)** | `DELETE` endpoints |
| **Import** | Bring external content in | Yes | Required | `POST .../import`, `auto-import`, recipe import |
| **Export** | Emit data out (external) | No (read) but **publishing** | **Required** | export endpoint (mostly GAP) |
| **Analyse** | Compute insight over data | No | None | `/api/scan`, assemblers |
| **Compare** | Diff two entities | No | None | Read × 2 + assembler |
| **Optimise** | Recommend improvements | No (advisory) | None until applied | Assembler → then per-change intent |
| **Share** | Grant external visibility | Yes (publishes) | **Required** | `POST .../share`, share-token |
| **Order** | Place a real order | Yes (external) | **Required (strong)** | **GAP** — no owner today |
| **Review** | Approve/triage queued items (admin) | Yes | **Required** | `.../approve`, `.../reject`, `.../publish` |
| **Report** | Produce a structured report | No | None | Read + assembler |
| **Approve** | Confirm a pending change (admin/editorial) | Yes | **Required** | admin approve endpoints + audit |

### 3.2 Verb → capability owner mapping (one owner per intent — non-negotiable)

Every cell is a *real* endpoint or an explicit `GAP`/`—`. **Each filled cell maps to exactly one owning service**, satisfying "each intent must map to one existing capability owner."

| Verb \ Capability | Planner (C1) | Shopping (C2) | Meals (C4) | Diary (C5) | Pantry (C8) | Household (C10) | Templates (C11) | Admin (C12) |
|---|---|---|---|---|---|---|---|---|
| Read | `/planner/full` | `/shopping-list/extras` | `/meals/:id` | `/food-diary/:date` | `/pantry` | `/household` | `/plan-templates/mine` | `/admin/users` |
| Search | — | — | `/meals/lookup` | — | `/pantry/search-index` | — | `/plan-templates/library` | — |
| Recommend | `/planner/.../intelligence` | `/shopping/intelligence` | `/meals/recommended` | — | `/pantry/discover` | — | `/plan-templates/default` | — |
| Generate | `/meal-plans/smart-suggest` | `/basket/create` | `/meals/smart-create-from-ingredients` | — | — | — | `/.../snapshot-from-planner` | — |
| Add | `PUT /planner/days/:id/entries` | `POST /shopping-list/extras` | `POST /meals/:id/items` | `POST /food-diary/:date/entries` | `POST /pantry` | `POST /household/eaters` | `POST /plan-templates/mine` | `POST /admin/ingredient-products` |
| Move | `PATCH /planner/entries/reorder` | — | — | — | — | — | — | — |
| Replace | `PATCH /planner/entries/:id/meal` | `POST /shopping-list/:id/correct` | `POST /meals/:id/adapt` (swap-engine) | — | — | — | — | — |
| Delete | `DELETE /planner/entries/:id` | `DELETE /shopping-list/extras/:id` | `DELETE /meal-items/:id` | `DELETE /food-diary/entries/:id` | `DELETE /pantry/:id` | `DELETE /household/members/:id` | `DELETE /plan-templates/mine/:id` | `DELETE /admin/ingredient-products/:id` |
| Import | `/plan-templates/:id/import` | — | recipe import (`/preview-recipe`) | `/food-diary/import/confirm` | — | `/household/join` | `/plan-templates/:id/apply` | `/admin/import-global-meals` |
| Export | — | — | — | — | — | — | — | `/admin/meals/export` |
| Share | `/plan-templates/mine/:id/share` | — | `PATCH /meals/:id/cookbook-visibility` | — | — | — | `/.../share` | — |
| Order | **GAP** | **GAP** | — | — | — | — | — | — |
| Review/Approve | — | — | — | — | — | — | — | `/admin/ingredient-classifications/:id/approve` |

`—` = verb does not apply to that capability. `GAP` = desired, no owner yet (§2.4).

**Key property:** no cell maps a verb to *two* owners. "Replace a meal in the planner" routes to the planner entry endpoint (planner owns placement); "replace an ingredient in a recipe" routes to the swap-engine via `/meals/:id/adapt` (meals own composition). These are *different capabilities*, so there is no duplicate ownership — exactly the distinction the architecture requires.

---

# 4. PART 3 — CAPABILITY CLASSIFICATION

Every capability/verb pair carries a class. The **class is server-side metadata**, not an LLM judgement, and it is what drives the confirmation model (§5).

| Class | Meaning | Examples (verb × capability) | Confirmation |
|---|---|---|---|
| **Read-only** | No state change | Read/Search/Explain/Report on any capability | None |
| **AI-assisted** | AI computes advisory output; human decides | Recommend/Suggest/Optimise/Compare; Analyser scan | None (advice only) |
| **Write** | Creates/updates one owned record | Add planner entry, Add shopping extra, Log diary, Update preferences | Light confirm |
| **Destructive** | Removes/overwrites data | Delete entry, Clear week entries, Remove household member, Replace meal | **Strong confirm** |
| **Long-running** | Multi-step / bulk / async | Generate week, Import global meals, Backfill classifications, Bulk uplift | Confirm + progress |
| **Human-confirmation-required** | Always needs explicit assent regardless of size | Share/publish, Export, Order, all Admin writes, subscription change | **Always confirm** |
| **Background** | System-initiated, no user turn | Product-event logging, enrichment caches, audit writes | None (system) |
| **Future** | Desired, no owner endpoint | Order shopping, user data export, delete week object | Blocked (GAP) |

**Classification rules (deterministic, no model discretion):**
1. Any `DELETE` route → **Destructive**.
2. Any verb that *publishes externally* (Share, Export, Order) → **Human-confirmation-required**, even though some are technically reads.
3. Any `/api/admin/*` write → **Human-confirmation-required** + audited.
4. Any verb operating on >1 record or invoking generation/import/backfill → **Long-running**.
5. Everything else with a `POST/PUT/PATCH` → **Write**; everything `GET` → **Read-only** or **AI-assisted** (assemblers).

---

# 5. PART 4 & PART 5 — CONFIRMATION MODEL & OWNERSHIP MATRIX

### 5.1 Confirmation model (Part 4)

> **Standard:** Confirmation is a typed echo-back of the *resolved* intent ("Add **Spaghetti Bolognese** to **Saturday, week 5**?") shown/spoken **before** invoke. It is enforced by the capability class server-side — never by prompt wording, never by the model's discretion.

| Action (example from the prompt) | Class | Confirmation standard |
|---|---|---|
| **Move Meal** | Destructive (relocates) | **Required** — echo source + destination |
| **Delete Meal** | Destructive | **Strong** — name the meal; no "delete all" without itemised count |
| **Generate Week** | Long-running | **Required** — confirm scope (which week) before generation; show result before persist where possible |
| **Order Shopping** | Human-confirmation-required + **GAP** | **Strong** — and blocked until an order owner exists; today: confirm *basket prepared*, hand off |
| **Delete Planner** (clear week) | Destructive + bulk | **Strong** — state item count being cleared; irreversible warning |
| **Export Data** | Human-confirmation-required (**publishes**) | **Strong** — name destination/scope; treat as external disclosure |
| **Create Household** | Write | **Required** — confirm name; membership changes are destructive-class |

**Confirmation tiers:**
- **None** — read-only & advisory (Read, Search, Explain, Recommend, Suggest, Report, Compare, Analyse, Optimise-as-advice).
- **Light** — single additive write (Add one entry/item) — one-line echo, single tap/utterance.
- **Required** — Move, Replace, Generate, Import, Create-household — typed echo of resolved entities.
- **Strong** — Delete, Clear/bulk, Share, Export, Order, all Admin writes — explicit irreversibility/disclosure warning + itemised scope; voice must read it back in full.

**Voice rule (carried from TIP1 §11):** every non-read intent must be spoken back and confirmed before invoke — no screen to glance at means confirmation matters *more*, not less.

### 5.2 Ownership Matrix (Part 5)

`Capability → Owner → Service → Permission → Confirmation → Audit`

| Capability | Owner (SoT) | Service | Permission (access.ts) | Confirmation | Audit |
|---|---|---|---|---|---|
| Planner (C1) | `planner_*` tables | `meal-service.ts` / `planner-compliance.ts` | `req.isAuthenticated()` + row ownership | Write→Strong (deletes) | Service-level (own data) |
| Shopping (C2) | `shopping_list*` | `grocery-integration.ts` | `isAuthenticated` + ownership | Light→Required | Service-level |
| Nutrition/Knowledge (C3) | `knowledge_*` | `nutrition-knowledge-registry.ts` | `isAuthenticated` (read) | None (read-only) | n/a (read) |
| Meals/Cookbook (C4) | `meals` / `meal_items` | `meal-service.ts` / `recipe-swap-engine.ts` | `isAuthenticated` + ownership | Write→Strong | Service-level |
| Diary (C5) | `food_diary_*` | routes + resolver | `isAuthenticated` + ownership | Light | Service-level |
| Profile (C6) | `user_preferences`/`users` | `sanitizeUser.ts` | `isAuthenticated` (self only) | Light | Service-level |
| Partners (C7) | `retailIntelligence.ts` | retail/price services | `isAuthenticated` (read) | None (R+A) | n/a |
| Pantry (C8) | `userPantryItems` + WS engines | `shared/*` engines | `isAuthenticated` + ownership | Light→Required | Service-level |
| Analyser (C9) | `product-analysis.ts` | analysis/OCR services | `isAuthenticated` (read) | None (R+A) | product-event log (background) |
| Household (C10) | `households` etc. | `server/lib/household.ts` | `isAuthenticated` + membership role | **Strong** (membership) | Service-level |
| Templates (C11) | `meal_templates`/`meal_plan_templates` | `template-migration.ts` | `isAuthenticated`; publish→`assertAdmin` | Required; publish→Strong | Admin publish→audited |
| Administration (C12) | `access.ts` + `admin_audit_log` | `storage.ts` admin methods | **`assertAdmin`** | **Always Strong** | **`createAuditLog` (mandatory)** |
| Developer (C13) | repo + docs | dev tooling (isolated) | dev plane only — **never user plane** | n/a (read) | dev-plane audit |

### 5.3 Duplicate-ownership check (the gate's core assertion)

Walking every `(capability → owner)` edge in §5.2: **each capability maps to exactly one owner, and no owner is claimed by two capabilities for the same fact.** The two places that *look* like overlap are not:

- **Planner-Replace vs Meals-Replace** — different capabilities (placement vs composition), different owners (planner service vs swap-engine). No duplicate ownership.
- **Templates publish vs Admin** — publishing a template invokes the *admin* permission gate but the *template* owner still owns the record; permission ≠ ownership. No duplicate ownership.

**Result: PASS.** One owner per capability holds across the whole registry.

### 5.4 Permission Matrix (Deliverable 6)

| Capability class | User (free) | User (premium) | Admin | Developer (isolated) |
|---|---|---|---|---|
| Read public knowledge (C3) | ✅ | ✅ | ✅ | ✅ |
| Read/write own data (C1,C2,C4,C5,C6,C8) | ✅ | ✅ (+ premium gates via `requirePremium`) | ✅ | ✅ |
| Advisory AI (C7,C9, assemblers) | ✅ | ✅ | ✅ | ✅ |
| Household membership (C10) | ✅ (own household) | ✅ | ✅ | ✅ |
| Template publish (C11) | ❌ | ❌ | ✅ (`assertAdmin`) | ✅ if admin |
| Administration (C12) | ❌ | ❌ | ✅ (`assertAdmin`) | ✅ if admin |
| Developer knowledge (C13) | ❌ | ❌ | ❌ | ✅ (dev plane only) |
| Source code / SQL / secrets | ❌ | ❌ | ❌ | ⚠️ dev tooling outside user-facing plane |

Premium-gated capabilities use the existing `requirePremium` middleware / `hasPremiumAccess()`; nothing new is invented.

---

# 6. PART 6 — FUTURE CAPABILITY EXPANSION

Each future assistant is a **named bundle of already-registered intents** over the one spine — a persona, not a platform. **None introduces a new owner or new logic.** Where a persona would need a capability THA does not own, that capability is a `GAP` (Rule 8), surfaced honestly, never improvised.

| Future assistant | Intents bundled (all already registered) | Reuses (owner/service) | New owner? | New logic? | Gaps it surfaces |
|---|---|---|---|---|---|
| **Planner Assistant** | Read/Recommend/Generate/Add/Move/Replace/Delete × Planner | C1 (`meal-service`, `planner-compliance`, smart-suggest) | No | No | none |
| **Shopping Assistant** | Read/Add/Delete/Generate × Shopping | C2 (`grocery-integration`) | No | No | **Order** (GAP) |
| **Nutrition Coach** | Read/Explain/Analyse/Compare/Report × Nutrition + Diary read | C3 + C5 (`nutrition-knowledge-registry`, assemblers) | No | No | none (read-only; inherits non-fabrication firewall) |
| **Household Assistant** | Read/Add/Delete × Household + Planner read | C10 (`household.ts`, `household-meal-matcher`) | No | No | none |
| **Developer Assistant** | Read/Explain/Report over `developer`-class knowledge | C13 (repo + docs, **isolated plane**) | No | No | none (read-only, isolated) |
| **Admin Assistant** | Read/Review/Approve/Report × Administration | C12 (`assertAdmin`, `createAuditLog`) | No | No | user data **Export** (GAP) |

**The line to hold:** the moment a "Coach" needs its own nutrition data, or a "Planner Assistant" embeds its own placement rules, the architecture has failed. Adding a capability = registering intents + unlocking a knowledge class, **not building software** (TIP1 §12).

---

# 7. DELIVERABLES — INDEX

| Deliverable | Section |
|---|---|
| Executive Summary | §1 |
| Capability Registry | §2 |
| Intent Taxonomy | §3 |
| Capability Classification | §4 |
| Confirmation Model | §5.1 |
| Ownership Matrix | §5.2 (+ duplicate-ownership check §5.3) |
| Permission Matrix | §5.4 |
| Future Capability Roadmap | §6 |
| Honest Gaps register | §2.4 (+ §6 per-persona) |

---

# 8. DEFINITION OF DONE — CHECK

| Requirement | Met by |
|---|---|
| Canonical AI Capability Registry produced | §2 — 13 capabilities, real owners/services/APIs/UI/access |
| Intent Taxonomy designed; each intent → one owner | §3 — 20 verbs, verb×capability matrix with unique owners |
| Every capability classified | §4 — 8 classes, deterministic rules |
| Confirmation rules determined | §5.1 — 4 tiers; all named example actions covered |
| Ownership matrix (Capability→Owner→Service→Permission→Confirmation→Audit) | §5.2 |
| Permission matrix | §5.4 |
| Future expansion without duplicate ownership | §6 — personas are intent bundles, zero new owners |
| One owner per capability proven | §5.3 — duplicate-ownership check PASS |
| Honest gaps over fabrication | §2.4 — Order/Export/Delete-week/Billing recorded as gaps |
| No code / schema / implementation changes | This document only |
| Rollback identifier reported before beginning | `rollback/TIP2-pre-investigation` (top of doc) |
| Creates `docs/investigations/TIP2_...md` | This file |

---

## APPENDIX — EXPLICIT CONSTRAINTS COMPLIANCE

- ✅ No code modified ✅ No database schema modified ✅ No implementation performed
- ✅ One canonical identity / one owner per fact / one owner per capability — inherited from the SoT Register and verified (§5.3)
- ✅ No duplicate entities, ownership, or business logic — intents are typed front doors to existing endpoints; gaps recorded, not built
- ✅ Extends existing architecture — binds to `access.ts`, the live route surface, `admin_audit_log`/`createAuditLog`, SoT-declared owners
- ✅ Progressive enrichment / honest gaps — §2.4
- ✅ No permanent synchronisation bridge — the registry is a derived, rebuildable projection of the route table + SoT Register

*Investigation only. No implementation performed. Rollback: `git checkout rollback/TIP2-pre-investigation`.*
