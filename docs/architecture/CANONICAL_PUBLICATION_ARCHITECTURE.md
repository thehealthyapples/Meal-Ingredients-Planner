# CANONICAL PUBLICATION ARCHITECTURE

**Status:** GOVERNING ARCHITECTURE — Platform Governance (canonical)  
**Established:** 2026-07-13 (CPuBA1)  
**Authority:** CPI1 (Canonical Publication Integrity Audit), CPV1 (Canonical Publication Verification Platform), and `ARCHITECTURE_PRINCIPLES.md`  
**Rollback:** `rollback/CPuBA1-canonical-publication-20260713` → `f9c23c97`  
**Enforcement:** `CPV1` verification platform (`npm run verify:publication`); Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`

---

## PREAMBLE

This document establishes the governing architecture for **canonical publication**: the mechanism by which THA declares ownership of facts, publishes them into projections (databases, compiled registries), and verifies at runtime that what runs is what the owner intended.

It is built from two investigations:

1. **CPI1** (2026-07-13) — Canonical Publication Integrity Audit: discovered that THA's owners are correct but its publications are almost entirely unverified. 22 domains audited; 3 healthy, 11 need attention, 8 carry architecture risk.

2. **CPV1** (2026-07-13) — Canonical Publication Verification Platform: implements the verification gate that runs every domain's publication contract against reality, turning all CPI1 findings into automated failures.

This architecture answers the question THA has asked since 2026-06-23 (SoT Register creation):

> **Can THA truthfully state: "Every major domain has a single source of truth, correctly published"?**

For the first time, the answer can be verified continuously.

---

## THE PUBLICATION LIFECYCLE

Every canonical domain follows one lifecycle:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CANONICAL PUBLICATION LIFECYCLE                   │
└─────────────────────────────────────────────────────────────────────┘

  OWNER              PUBLICATION           PROJECTION            RUNTIME
    ↓                    ↓                      ↓                   ↓
 [Source]  ─publish→  [Process]  ─create→  [Storage]  ─read→  [Surface]
    ↓                                          ↓                   ↓
Declared   npm run    Seed runner         DB table or      One read
owner      seed:*     migration           derived file      layer
  seed     or manual  or boot job                         (one mouth)
                                                              ↓
                                                         ┌──────────┐
                                                         │VERIFY:   │
                                                         │projection│
                                                         │ = owner  │
                                                         └──────────┘
```

**Five required elements:**

1. **Canonical Owner** — The authoritative source of fact. One per domain.
2. **Authorised Writers** — The code paths that may write the projection. Listed explicitly.
3. **Publication** — The mechanism by which the owner publishes (seed runner, migration, boot job, API). Reviewable and repeatablе.
4. **Projection** — The published form (DB table, compiled registry, generated file). Should be rebuildable from the owner.
5. **Runtime Read Path** — A single mouth. One code path reads the projection; never bypass it.
6. **Verification** — Automated gate that asserts: published state = owner's declared state.
7. **Drift Detection** — When projection ≠ owner, the gate fails loudly.

---

## THREE DOMAIN VARIANTS

THA hosts three types of canonical domains, each with different ownership models:

### Variant 1: Seed-Owned Domains

**Canonical owner:** A source code file containing seed data.  
**Projection:** A database table (or compiled registry).  
**Publication:** `npm run seed:*` or boot-time seed runner.  
**Runtime reads:** The projection (via one read layer); never reads the seed directly.  
**Verification:** Live table row count = seed's declared count. `validateCanonicalSeed()` passes.

**Examples:**
- Food Identity (`shared/canonical/foods.ts` → DB `canonical_food`)
- Plant Diversity (`shared/canonical/diversity-groups.ts` → DB `diversity_group`)
- Knowledge domains (Food Knowledge, Preparation, etc.)
- Recipe Acquisition (`shared/recipe-acquisition.ts` → DB `recipe_sources`)

**Why the seed doesn't own the table at runtime:**
- The table is the true source of truth once seeded (it can be edited outside the seed, and if it is, runtime reflects the edit).
- A seed is read-only history — it names what *should* be true.
- The projection is what *is* true.
- Verification checks: does the projection match the seed? If no, that is a bug to fix.

### Variant 2: Knowledge Domains

**Canonical owner:** A shared/ module containing editorial facts (nutrients, benefits, food properties, etc.).  
**Projection:** A database table (or multiple tables) seeded from the owner.  
**Publication:** `npm run seed:knowledge-*` or `seedFoodKnowledge()` at boot.  
**Runtime reads:** The projection only, through a knowledge registry service (one mouth). Never reads the seed directly.  
**Verification:** Published rows are reviewed (gate: `isEvidenceBackedClaim()`). Empty renders for unreviewed claims. No fabrication.

**Examples:**
- Food Knowledge (`shared/knowledge/foods.ts` → DB `knowledge_foods`, `knowledge_nutrients`, etc.)
- Preparation Knowledge (`shared/knowledge/preparations.ts` → DB `knowledge_preparations`)
- Product Knowledge (`docs/product/inventory/product.yaml` → `product.json` → read via `product-knowledge-registry.ts`)

**Why knowledge is distinguished:**
- Knowledge has a lifecycle beyond mere existence: it is discovered (candidate), gated (evidence check), confirmed (human review), then published.
- Knowledge requires sourcing. A fact without a source is fabrication.
- Knowledge is the only domain type where `reviewedAt` and `reviewedBy` are mandatory for publication.

### Variant 3: Database-Owned (Transactional) Domains

**Canonical owner:** A database table that receives writes from the household at runtime.  
**Projection:** The same table (no separate projection; the table *is* the owner).  
**Publication:** Not applicable — there is no seed or pre-publication step.  
**Writers:** Exactly one write funnel (`storage.createMeal()`, `storage.addPlannerEntry()`, etc.). Other writers are violations.  
**Runtime reads:** One or more read layers (OK to have multiple reads; only one write funnel).  
**Verification:** Writer census — are there unauthorized writes? Derived cache integrity — does `activity_summary` match the source?

**Examples:**
- Meals (DB `meals` → write via `storage.createMeal()` only)
- Planner (DB `planner_*` → write via `storage.createPlannerEntry()` only)
- Shopping List (DB `shopping_list` → write via one funnel; reads OK to be multiple)
- Household (DB `users`, `household_eaters` → multiple writers is a violation)
- Pantry (DB `user_pantry_items` → write via one funnel; `activity_summary` is a derived cache that can drift)

**Why transactional is different:**
- The household is the source of truth. The DB table is the owner.
- There is no "correct" publication because the household is continuously authoring.
- The only risk is **concurrency**: multiple writers, or derived caches that drift.
- Verification focuses on writer discipline and derived-cache integrity.

---

## ARCHITECTURE ELEMENTS

### 1. Canonical Owner — Declaration

Every domain must declare, in English:
- Who owns this domain? (file path, module name, or DB table)
- What is in the owner? (count of entries, scope, type of facts)
- Who authored it? (human, seed job, household, or AI)
- Is this a transactional owner (household writes it at runtime) or a declared owner (seed/module)?

**Example (Seed-Owned):**

> **Domain:** Food Identity  
> **Owner:** `shared/canonical/foods.ts` (CANONICAL_SEED constant)  
> **Coverage:** 312 declared foods  
> **Author:** Human (food scientist team)  
> **Variant:** Seed-owned  
> **Status:** Transactional (household cannot author)

**Example (Database-Owned):**

> **Domain:** Planner  
> **Owner:** DB table `planner_weeks`, `planner_days`, `planner_entries`  
> **Coverage:** Household-scoped, varies by household  
> **Author:** Household (via planner UI)  
> **Variant:** Database-owned  
> **Status:** Transactional (household writes continuously)

### 2. Authorised Writers — List

Explicit list of every code path that writes to the projection:

```ts
Domain: Food Identity
Owner: shared/canonical/foods.ts

Authorised writers:
  [✓] server/seeds/seed-canonical-food.ts — publishes CANONICAL_SEED into DB
  [ ] No other writers permitted

Violations found:
  [✗] server/scripts/ws011-usda-ingestion.ts:211 — raw INSERT without owner approval
```

**Rule:** If it writes the projection and is not on this list, it is a violation. The list is the source of truth for "authorised".

### 3. Publication — Process

How does the owner get from source form into the projection?

**For seed-owned domains:**
- `npm run seed:canonical` → reads `CANONICAL_SEED` → writes DB via Drizzle migration
- `npm run seed:knowledge-foods` → reads `shared/knowledge/foods.ts` → publishes via seed runner
- `seedFoodKnowledge()` at boot → on-demand publication at startup

**For database-owned domains:**
- Publication is continuous (household writes at runtime).
- No explicit publication step.

**For knowledge domains:**
- Publication includes a **confirmation gate** (human review, evidence backing).
- `npm run signoff:knowledge --edge preparation-effect` — human confirms a fact before it publishes.

**Rule:** Publication must be
- **Explicit** — not ad-hoc DDL or runtime `INSERT`
- **Reviewable** — the publication process is readable code, not implicit
- **Repeatable** — running it again produces the same result
- **Gated** — for knowledge domains, facts are gated by evidence/review

### 4. Projection — Definition

The published form of the owner. The table, file, or compiled registry that runtime reads.

| Domain | Variant | Owner | Projection | Integrity Check |
|--------|---------|-------|-----------|---|
| Food Identity | seed-owned | `shared/canonical/foods.ts` (312 items) | DB `canonical_food` (53 rows currently) | **🔴 DRIFT: only 17% published** |
| Plant Diversity | seed-owned | `shared/canonical/diversity-groups.ts` (173) | DB `diversity_group` (52 rows currently) | **🔴 DRIFT: only 30% published** |
| Food Knowledge | knowledge | `shared/knowledge/foods.ts` (188) | DB `knowledge_foods` (exact projection verified) | ✅ exact; but 41 orphan rows live |
| Meals | database-owned | DB `meals` | same table | ⚠️ 4 unauthorized writers |
| Planner | database-owned | DB `planner_*` | same tables | ✅ single write funnel verified |
| Pantry | database-owned | DB `user_pantry_items` | same table + `activity_summary` cache | **🔴 DRIFT: cache out of sync on 2/9 rows** |
| Uplift Rules | knowledge | `server/lib/uplift-rules.ts` (43 rules) | DB `meal_uplift_applications` (11 rows) | **🔴 DRIFT: 8 rows cite phantom rules** |

**Rule:** The projection is what runtime reads. If it drifts from the owner, the gate fails and runtime serves stale/wrong data.

### 5. Runtime Read Path — One Mouth

One service, one function, one layer that reads the projection and provides it to surfaces:

| Domain | Projection | One Mouth | Violation |
|--------|-----------|----------|-----------|
| Food Knowledge | DB `knowledge_foods` | `nutrition-knowledge-registry.ts` | ❌ 6 direct readers bypass the mouth |
| Plant Diversity | DB `diversity_group` | `nutrition-variety.ts` (keyword list) | **✅ correct; bypasses table** |
| Meals | DB `meals` | `storage.ts` | ❌ 6 direct readers |
| Planner | DB `planner_*` | `storage.ts` + 4 assemblers | ⚠️ multiple read paths OK for transactional |
| Household Diet | `users.dietRestrictions` | `storage.ts` | **🔴 hardcoded to `[]` — never reads** |

**Rule:** For seed-owned and knowledge domains, one mouth only. For database-owned transactional domains, multiple readers are OK if they all read from the same table (no re-derivation).

### 6. Verification — Automated Gate

The CPV1 Canonical Publication Verification Platform runs 22 domain checks:

**Check Family 1: Source Checks**
- Does the owner file exist? Is it readable?
- Does the declared seed constant have the right structure?

**Check Family 2: Writer Census**
- Every file writing the projection is listed in Authorised Writers.
- Any unlisted writer is a violation.

**Check Family 3: Seed Count Checks**
- Seed's declared count = live table row count (for seed-owned domains).
- If seed says 312 foods and table has 53, projection has drifted.

**Check Family 4: SQL Checks**
- `validateCanonicalSeed()` passes.
- Derived caches match their source (Pantry's `activity_summary` counts match ingredient counts).
- No orphan rows (rows with no corresponding seed entity).

**Check Family 5: Custom Checks**
- Publication runner can re-run idempotently (seed runner has reconcile sweep).
- No hardcoded bypasses (like `dietRestrictions: []`).

**Executed by:**
- `npm run verify:publication` — CLI gate for CI/CD
- `/admin/canonical-publication-integrity` — admin dashboard
- Called automatically before significant implementations

**Verdict:**
- 🟢 **Healthy** — all checks pass
- 🟡 **Needs Attention** — one or more checks warned
- 🔴 **Publication Failure** — one or more checks failed

### 7. Drift Detection — When Projection ≠ Owner

The verification gate detects drift and fails loudly:

```
CPI1 Finding S1-1: Every dietary restriction is dropped from AI context
→ CPV1 Check: household-read-handler returns dietRestrictions
→ Verify Result: 🔴 FAIL
   Expected: dietRestrictions from users table
   Found: hardcoded []
   CPI1 §5 reference: S1-1
   Fix: storage.ts:2751 must read dietRestrictions, not hardcode
```

**Drift detection covers:**
- **Stale projections** — owner declares 312 foods, DB has 53
- **Orphan rows** — rows in DB with no owner declaration
- **Unauthorized writers** — code writing the projection not listed
- **Hardcoded bypasses** — runtime ignoring the owner (like `dietRestrictions: []`)
- **Derived caches diverging** — `activity_summary` count ≠ actual pantry count
- **Phantom runtime identities** — `fallback-deterministic-boosts` exists in code but not in owner
- **Dual ownership** — `meal_uplift_applications` written by client and server (different authorities)

---

## PLATFORM SUMMARY — 22 DOMAINS

| # | Domain | Variant | Owner | Status | Next Action |
|---|--------|---------|-------|--------|--|
| 1 | Food Identity | seed | `shared/canonical/foods.ts` | 🟡 17% published | Re-run `npm run seed:canonical` |
| 2 | Food Knowledge | knowledge | `shared/knowledge/` | 🔴 41 orphan rows | Remove orphans, revalidate |
| 3 | Plant Diversity | seed | `shared/canonical/diversity-groups.ts` | 🔴 30% published | Re-publish entire seed |
| 4 | Meals | database | DB `meals` | 🔴 4 writers | Converge to single funnel |
| 5 | Cookbook (500) | seed | `data/cookbook/…500.json` | ✅ 8/8 verified | None — healthy |
| 6 | Meal Templates | seed | `seed-meal-shell-templates.ts` | 🔴 96% stubs | Reconcile with meals owner |
| 7 | Recipe Sources | knowledge | `shared/recipe-acquisition.ts` | 🟡 163 forbidden rows | Review laning decisions |
| 8 | Planner | database | DB `planner_*` | 🟡 single funnel ✅ | None — healthy |
| 9 | Household Diet | database | `users.dietRestrictions` | 🔴 hardcoded to [] | Fix storage.ts:2751 |
| 10 | Shopping | database | DB `shopping_list` | 🟡 2 writers | Converge bypasses |
| 11 | Pantry | database | DB `user_pantry_items` | 🔴 cache drifted | Reconcile activity_summary |
| 12 | Nutrition Uplift | knowledge | `server/lib/uplift-rules.ts` | 🔴 8 phantom rows | Remove client-authored rules |
| 13 | Preparation Knowledge | knowledge | `shared/knowledge/preparations.ts` | 🟡 never rendered | Wire to UI, then gate |
| 14 | Product/UPF | knowledge | `product-analysis.ts` | 🟡 4 rival vocabularies | Unify classification |
| 15 | Companion/Notice | platform | `notice-gateway.ts` | ✅ one mouth verified | None — healthy |
| 16 | Intelligence Platform | platform | `intelligence-platform.ts` | ✅ singleton verified | None — healthy |
| 17 | Capability Registry | platform | `capability-registry.ts` (25) | 🔴 5 gated out | Fix CAPABILITY_DOMAIN bridge |
| 18 | Decision Engine | platform | `opportunity-delivery/framework.ts` | ✅ verified | None — healthy |
| 19 | Product Knowledge | knowledge | `docs/product/inventory/product.yaml` | 🟡 prose drifted | Update docs/product/ |
| 20 | Benchmarks | knowledge | `server/tests/benchmark/history.ts` | 🟡 stale (2026-07-10) | Update history.ts |
| 21 | Community | — | — | 🟢 reserved lane, dormant | None — correct |
| 22 | Learning (EL1) | platform | `evidence-learning-store.ts` | 🟡 0 confirmed signals | Add replay path |

**Platform Verdict:**
- 🟢 **Healthy:** 3 domains (Cookbook, Planner, Intelligence Platform, Decision Engine, Community — 5 total)
- 🟡 **Needs Attention:** 11 domains
- 🔴 **Publication Failure:** 8 domains (Food Knowledge, Plant Diversity, Meals, Meal Templates, Household Diet, Pantry, Nutrition Uplift, Capability Registry)

---

## GOVERNANCE RULES

These rules are binding for every domain:

### Rule CPuBA1: Every domain must declare its variant

Before any domain can be called "canonical", it must declare:
- **Variant:** seed-owned, knowledge, or database-owned
- **Owner:** File path or DB table (not vague description)
- **Coverage:** Count of entries or scope ("household-scoped")
- **Publication:** How the owner reaches the projection (or "transactional" if household-owned)

### Rule CPuBA2: Seed-owned domains must declare and re-verify count

Every seed-owned domain declares: "I own N items."

The verification gate asserts: "Projection holds N items."

If counts diverge, **the projection has drifted**. The gate fails. No runtime surface reads stale data silently.

**Reconciliation:** Re-run the publication step (`npm run seed:canonical`) to bring projection and owner into agreement.

### Rule CPuBA3: Knowledge domains must gate on evidence

Knowledge claims (facts about foods, products, benefits) must pass:
- **Layer 1 check:** Does the claim have a cited source? (SourceRef with URL + last-reviewed date)
- **Layer 2 check:** Has a human signed this off? (reviewedAt + reviewedBy)

Rendering is gated on **both** checks passing. Empty renders for unreviewed facts. No fabrication.

### Rule CPuBA4: Database-owned domains must have exactly one write funnel

For every database-owned domain:
- Declare the one write funnel (e.g., `storage.createMeal()`, `storage.addPlannerEntry()`).
- Every write to that table must pass through this funnel.
- Any direct `INSERT`/`UPDATE` that bypasses the funnel is a violation.

**Exception:** Derived caches (like `activity_summary`) may have multiple read-only updaters, but only if the primary table has one owner.

### Rule CPuBA5: All domains must verify at publication

Before any significant change to a domain's owner, its projection, or its publication process:
1. Run the verification gate: `npm run verify:publication`
2. Confirm the domain is not in publication-failure state
3. If it is, explain why the change does not make it worse
4. Add to the Domain Impact section of `ENGINEERING_WORKFLOW.md`

### Rule CPuBA6: The Source of Truth Register must stay current

The register (`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`) is the **governing document** for which store owns which domain.

It must be updated whenever:
- A domain's variant changes (e.g., seed-owned → knowledge)
- An owner changes files (e.g., moved from DB to seed)
- A projection is added, retired, or substantially altered
- A publication mechanism is replaced

**Update trigger:** Before any workspace is considered complete, audit the domains it touched and update the Register. (Rule 7 in the Register itself.)

### Rule CPuBA7: All changes must stay within the publication contract

If a domain's contract (owner → publication → projection → runtime) changes:
1. Update the domain's declaration
2. Update the verification gate to match
3. Run verification
4. Update the Source of Truth Register

Changing the contract without updating governance = hiding the change.

### Rule CPuBA8: Transactional domains must declare derived caches explicitly

For database-owned domains that have derived caches (like Pantry's `activity_summary`):
- Declare: what is cached and how it is derived
- Verify: cache matches source (SQL check)
- Monitor: if cache drifts, fail and explain the reconciliation step

---

## LIFECYCLE RECAP — OWNER TO SURFACE

### For Seed-Owned Domains

1. **Owner declares** — `shared/canonical/foods.ts`: "I own 312 foods"
2. **Owner publishes** — `npm run seed:canonical` reads the seed, writes DB via migration
3. **Projection receives** — DB `canonical_food` now has 312 rows
4. **Verification confirms** — live table count = seed count ✅
5. **Runtime reads** — surface calls `food-report-adapter.ts` (one mouth), which reads DB and renders
6. **If drift detected** — table has 53 rows, not 312 → gate fails → alert owner → re-publish or investigate why rows vanished

### For Knowledge Domains

1. **Owner declares** — `shared/knowledge/foods.ts`: "I own 188 foods with these nutrients"
2. **Owner publishes** — `npm run seed:knowledge-foods` seeds into DB via `seed-knowledge-registry.ts`
3. **Evidence gate confirms** — `isEvidenceBackedClaim()` verifies reviewedAt + source for each row
4. **Projection receives** — DB `knowledge_foods` now has 188 rows, only reviewed rows render
5. **Verification confirms** — seed validates, no orphans, all render-check prerequisites met ✅
6. **Runtime reads** — surface calls `nutrition-knowledge-registry.ts` (one mouth), which reads DB and renders only reviewed facts
7. **If evidence missing** — a fact has no source → renders as empty → honest gap, not fabrication

### For Database-Owned (Transactional) Domains

1. **Household authors** — user creates a planner entry
2. **Single funnel writes** — `storage.createPlannerEntry()` writes to DB `planner_entries`
3. **Derived caches update** — any cache tied to this domain is invalidated or re-derived
4. **Verification confirms** — cache = source. If not, drift detected.
5. **Runtime reads** — surface calls `storage.getPlannerEntries()` (one mouth), which reads DB and renders
6. **If drift detected** — `activity_summary` says pantry is empty but `user_pantry_items` has 128 rows → gate fails → reconcile

---

## INTEGRATION WITH PLATFORM GOVERNANCE

This architecture is subordinate to and enforced by:

- **`ARCHITECTURE_PRINCIPLES.md`** — The eight governing principles (one entity, one owner, progressive enrichment, etc.). This document is their enforcement mechanism.
- **`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`** — The registry of all 22 (soon 29+) domains and their owners. This document is the registry's implementation guide.
- **`ENGINEERING_WORKFLOW.md`** — Architecture Compliance Checklist (STEP 2: read this document); Domain Impact section for every change.
- **`CPV1` — Canonical Publication Verification Platform** — The automated verification gate. This document is its specification.

Every significant implementation must:
1. Read this document (Architecture Bootstrap, STEP 2)
2. Confirm the domain(s) it touches are not in publication-failure state (or explain why)
3. Update domain declarations if ownership/publication changes
4. Run `npm run verify:publication` before committing
5. Update the Source of Truth Register (Rule CPuBA6)
6. Pass the Architecture Compliance Checklist

---

## TRANSITION RULES

This document was created 2026-07-13 and named the CPuBA1 (Canonical Publication Architecture Bootstrap) checkpoint. It codifies the shape THA has already built correctly in four places (WS0X, WS4B/WS5A/WS6, FS1/FS2, EL1/EL2) without noticing it was one shape.

**For existing domains:**
- Those already healthy (Cookbook, Planner, Intelligence Platform, etc.) require no action.
- Those in publication-failure state have a named rescue option (§5, Platform Summary).
- Those in needs-attention state must not be extended; regression is OK, progress deferred.

**For new domains:**
- Every new domain must be declared before implementation (owner, variant, publication path).
- Verification gate must pass before shipping.
- Source of Truth Register must be updated in the same change.

**For contested domains (as of 2026-07-13):**
- Household Dietary Preference — uses three owners, causing `dietRestrictions: []` hardcoding. Architectural repair recommended by CPI1 §7.
- Plant Diversity Counting — two independent counters produce inconsistent results.
- Nutrition Boost Display — client publishes into server-owned table without review gate.
- Meal Templates — 96% shadow projection of Meals, created by boot job.

None are acceptable long-term. Migration roadmaps exist (SoT Register Phase 8). But they are not fixed by this document; they are *named* by it.

---

## DEFINITION OF DONE

| Requirement | Status | Evidence |
|---|---|---|
| Canonical Publication lifecycle defined | ✅ | §2 — Owner → Publication → Projection → Runtime → Verification |
| Three domain variants defined | ✅ | §3 — Seed-owned, Knowledge, Database-owned |
| Seven architecture elements detailed | ✅ | §4 — Owner, Writers, Publication, Projection, Read Path, Verification, Drift Detection |
| 22 domains classified and mapped | ✅ | §5 — summary table with current status |
| Eight governance rules established | ✅ | §6 — CPuBA1–8, binding on all implementations |
| CPV1 verification platform referenced | ✅ | Used as enforcement mechanism |
| Integration with platform governance documented | ✅ | §9 — ARCHITECTURE_PRINCIPLES.md, ENGINEERING_WORKFLOW.md, SoT Register |
| Transition rules established | ✅ | §10 — for existing, new, and contested domains |

---

**This architecture establishes the governing shape for canonical publication across THA. It is non-negotiable for every significant implementation.**

**Enforcement:** `npm run verify:publication` and Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`.

**Rollback:** `git reset --hard rollback/CPuBA1-canonical-publication-20260713`

---

*Established by Claude Haiku 4.5 on 2026-07-13, under authority of CPI1 and CPV1 investigations.*
