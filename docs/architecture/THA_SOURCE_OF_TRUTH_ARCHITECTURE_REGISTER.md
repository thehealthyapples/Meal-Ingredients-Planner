# THA SOURCE OF TRUTH ARCHITECTURE REGISTER

**Status:** GOVERNING ARCHITECTURE — Platform Governance (canonical). Relocated to `docs/architecture/` on 2026-06-30 (GOV-AI1). No code, schema, runtime, or API changes.
**Canonical location:** `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
**Date:** 2026-06-23
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Rollback tag:** rollback/source-of-truth-register-20260623 → HEAD f531216
**Scope:** Investigation only. No implementation. No code changes.

---

## PREAMBLE

This register exists because a single investigation (Pantry Knowledge Population)
revealed that **Food Knowledge alone has five separate stores** serving different
surfaces. That is not a one-off accident. It is a signal that THA has grown
without an explicit governance model for source-of-truth ownership.

The objective of this document is to answer one question with clarity:

> Can THA truthfully state: "Every core domain has a single source of truth"?

**Short answer: NO.**

This register documents every domain, every store, every duplication, every
consumer non-compliance, and every launch risk — and proposes the governance
rules that would prevent recurrence.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Tag created | `rollback/source-of-truth-register-20260623` |
| Points to | HEAD `f531216` |
| Branch | `safety/preserve-since-last-prod-20260617-1613` |
| Pre-existing uncommitted files | `client/src/components/PantryKnowledgeHub.tsx`, `server/routes.ts` (modified), 5 untracked docs |
| Action on rollback | `git checkout rollback/source-of-truth-register-20260623` |

---

## PHASE 1 — DOMAIN INVENTORY

The following domains have been identified by reading all TypeScript files under
`server/`, `shared/`, and `client/src/`, the full database schema
(`shared/schema.ts`), and the existing investigation archive under
`docs/investigations/`.

| # | Domain | Description |
|---|--------|-------------|
| 1 | Food Knowledge (Nutrition) | Facts about foods: nutrients, benefits, "why it matters" |
| 2 | Canonical Food Identity | What is this food? Varieties, aliases, diversity group |
| 3 | Food Relationships (Graph) | How foods relate: family, season, cooking pairings |
| 4 | Plant Diversity | Which plants count? How are they grouped for the 30-plants counter? |
| 5 | Dietary Restrictions | Allergen definitions: gluten, dairy, nut, sesame, etc. |
| 6 | Dietary Rules (Pattern Matching) | Keyword logic for vegan/vegetarian/keto/dairy-free filtering |
| 7 | Dietary Preferences (User) | Per-user diet pattern and restrictions |
| 8 | Discovery | Food discovery recommendations for pantry |
| 9 | Alternatives | Goal-driven food alternative suggestions |
| 10 | Stories | Household food narrative cards |
| 11 | Seasonal Stories | Season-aware food arc cards |
| 12 | Meal Identity | Core meal record: name, ingredients, instructions |
| 13 | Meal Templates / Shell Catalogue | Reusable THA-authored meal shells |
| 14 | Planner State | Weekly planner: weeks, days, entries, eater assignments |
| 15 | Shopping State | Shopping list items, extras, fulfilment memory |
| 16 | Household Profiles | Household members, eaters, overrides |
| 17 | Nutrition Boost (Uplift) | Rules engine for adding nutritional ingredients to meals |
| 18 | Nutrition Boost Display | Client-side display data for boost ingredient context |
| 19 | Product Analysis | Barcode scan results, UPF analysis, additive detection |
| 20 | Food Additive Knowledge | Editorial explanations of food additives/categories |
| 21 | Diary | Daily food logs, metrics |
| 22 | Food Reports (Plant Diversity) | 30-plants page; which ingredients count as plants |
| 23 | Food Reports (Nutrition / Food Report) | Per-food report with nutrients, benefits, varieties |
| 24 | Ingredient Catalogue | USDA-ingested ingredient pool, classification pipeline |
| 25 | Ingredient Normalization | Canonical name resolution, alias expansion |
| 26 | Membership / Subscription | User tier: free / premium / friends_family |
| 27 | User Preferences | Non-dietary preferences: display, saved settings |

> **Domains 28–33 were added after this inventory was taken (2026-06-23).** 28 and 29 were declared
> at their creation, by the workstreams that built them. **30–33 were not**: they are live domains
> this inventory never listed, declared retrospectively by `OWN-5` (2026-07-16) under CONV1 phase P1.
> The distinction matters and is not cosmetic — see Domain 30's note.

| # | Domain | Description |
|---|--------|-------------|
| 28 | Preparation Knowledge | What is done to a food between the shop and the plate *(added `PHASE5A`, 2026-07-12)* |
| 29 | Product Knowledge | What The Healthy Apples itself is *(added `PKR1`/`PKR3`, 2026-07-11)* |
| 30 | Pantry State | What a household has in the house *(declared `OWN-5`, 2026-07-16)* |
| 31 | Evidence & Learning (EL1) | What THA has observed about a household, and what it has confirmed *(declared `OWN-5`)* |
| 32 | Platform Observations (OBS1) | What the platform did — operator telemetry *(declared `OWN-5`)* |
| 33 | Benchmark World | The ten authored Benchmark Households and their scored runs *(declared `OWN-5`)* |

---

## PHASE 2 — SOURCE OF TRUTH DECLARATION

### Domain 1: Food Knowledge (Nutrition)

> Identifies the nutritional character of a food: its key nutrients, health benefits, "why it matters" context, and "how to choose" guidance.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS0 Knowledge Registry** (`shared/knowledge/` → DB `knowledge_foods`, `knowledge_nutrients`, `knowledge_health_benefits`, `knowledge_food_nutrients`, `knowledge_food_benefits`, `knowledge_nutrient_benefits`) |
| Read layer | `server/services/nutrition-knowledge-registry.ts` |
| Seed data | `shared/knowledge/foods.ts`, `nutrients.ts`, `health-benefits.ts`, `relationships.ts` |
| DB seed runner | `server/seeds/seed-knowledge-registry.ts` (upsert + KNOW5 reconcile) |
| Foods covered | **610 foods** (272 editorial + 338 graduated, `KNOWLEDGE_SEED_COUNTS.foods`) |
| Published | **610 / 610** — projection verified equal to the owner (PUB1, 2026-07-14) |
| Consumers (authoritative) | Pantry Explore (`/api/knowledge/*`), Food Report (`shared/canonical/food-report-adapter.ts`), Weekly Nutrition Report, Simply Better Choices |
| Status | **Authoritative — published and verified** |

---

### Domain 2: Canonical Food Identity

> Defines what a food *is*: its canonical name, category, subcategory, aliases, varieties, and which diversity group it belongs to.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS2A Canonical Seed** (`shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias`, `diversity_group`) |
| Foods covered | **312 canonical foods** (`CANONICAL_SEED`), 68 varieties, 801 aliases, 173 diversity groups |
| Seed runner | `server/seeds/seed-canonical-food.ts` (upsert + PUB1 reconcile sweep) |
| Published | **312 / 312** foods, 68 / 68 varieties, 801 / 801 aliases, 173 / 173 diversity groups — projection verified equal to the owner (PUB1, 2026-07-14). Before PUB1 the projection held **53** foods: the seed could not run, because `canonical_food` was missing six columns its owner declares (migration `2026-07-14_pub1_canonical_food_projection_columns`). |
| Knowledge binding | 256 published canonical foods carry `knowledge_food_slug` → Domain 1. 99.3% of bindable identities are bound; the remainder are recorded in `DEFERRED_KNOWLEDGE_BINDINGS`, never guessed. |
| Candidate pool | `canonical_food` also holds **295 `tier='catalogue'` / `status='draft'`** rows — the WS0.11 USDA candidates. They are **not** a publication: Stage 1 of the graduation pipeline (PKCA §1.1), quarantined out of every published read and never touched by the reconcile sweep. |
| Runtime read path | The seed itself (`resolveCanonicalFood`) — identity resolves against the owner; the DB tables are its published projection. |
| Consumers | Food Report adapter, Variety surfacing, Pantry Explore drill-down, 30-plants counter (via `plantDiversityGroup`) |
| Status | **Authoritative — published and verified** |

---

### Domain 3: Food Relationships (Graph)

> Documents how foods relate to each other: same variety, same family, seasonal pairings, benefit overlaps.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS7 Food Graph** (`shared/relationships/food-graph.ts`) |
| Supplementary source | WS0 `FOOD_BENEFITS` in `shared/knowledge/relationships.ts` (benefits overlap inference) |
| Status | **Authoritative — declared** |

---

### Domain 4: Plant Diversity

> Defines the counting rules for the 30-plants-a-week feature: which ingredients count as plants, and how varieties group.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS2A Canonical → diversity_group table** (`shared/canonical/diversity-groups.ts`, `DIVERSITY_GROUP_SEED`, 173 groups) |
| Seed runner | `server/seeds/seed-canonical-food.ts` |
| Published | **173 / 173** groups (PUB1, 2026-07-14; previously 52) |
| Counting rule | One diversity group = one plant. `plantDiversityGroup()` (`shared/canonical/plant-classifier.ts`) is the sole owner of that question. A counter that dedupes on the ingredient slug over-counts and is a defect (CPI1 S1-2). |
| Status | **Authoritative — published and verified.** The former contest with `client/src/lib/nutrition-variety.ts` was resolved by **M4** in the canonical seed's favour; PUB1 published the projection and converged the user-facing counter. Remaining consumer gaps are listed under Domain 22. |

---

### Domain 5: Dietary Restrictions

> Canonical allergen and intolerance definitions: what is in each restriction, what triggers it, what the safe substitutions are.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **shared/restrictions/restriction-library.ts** |
| Version | 3.0.0 (as of this register) |
| Consumers | `restriction-resolver.ts`, `restriction-safety.ts`, planner compliance gate, meal scoring |
| Status | **Authoritative — declared** |

---

### Domain 6: Dietary Rules (Pattern Matching)

> Keyword-based logic for identifying vegan, vegetarian, keto, dairy-free, gluten-free meals.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **`shared/dietRules.ts`** |
| Status | **Contested — see Phase 3** |
| Corrected | **2026-07-16 (`DOC-5`)** — this row previously read **`server/lib/dietRules.ts`**, a path that has not existed for some time. **The owner is unchanged** — the same module, owning the same fact, at the location Rule 4 and [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) § M3 both prescribed for it. Only the path was wrong. Found by **`COH-1`** (`npm run verify:coherence`), not by a reader |

> **⚠️ The Status row above is stale, and `DOC-5` deliberately did not change it.** Phase 3's contest
> for this domain was `server/lib/dietRules.ts` **vs an identical `client/src/lib/dietRules.ts`** — the
> copy Rule 4 names explicitly, and the only rival this domain ever had. **Neither file exists today.**
> Both were replaced by the single `shared/dietRules.ts` that Rule 4 (*"it must be moved to `shared/`
> and imported from there"*) and `ARCHITECTURE_PRINCIPLES.md` § M3 (*"Move to `shared/dietRules.ts`;
> delete both existing files; update all imports"*) prescribe, and both planes now import it: the
> client at `client/src/pages/meals-page.tsx`, the server at `server/routes.ts`,
> `server/lib/smart-suggest-service.ts`, `server/lib/planner-compliance.ts` and others. **M3 was done
> and nobody came back to say so** — which is why the row still describes a contest that ended in the
> architecture's favour. **Recording that verdict is an ownership act, and `DOC-5` is a path
> correction**; it is reported here rather than taken quietly, and recommended as the next `DOC`-class
> item.

---

### Domain 7: Dietary Preferences (User)

> Per-user dietary pattern and restriction selections.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **`household_eaters`** (Domain 16) — declared by [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) Principle 2 since 2026-06-25 |
| Live location today | **`household_eaters`** — the owner IS the live location. The pattern is stored in `default_diet_types` as its canonical diet type; restrictions in `hard_restrictions` |
| Status | **✅ CONVERGED — 2026-07-16 (`CONV1 P4` / `OWN-1`).** `users.dietPattern` / `users.dietRestrictions` are **dropped** (migration `2026-07-16_conv1_p4_retire_users_diet_columns`, gated on zero data loss); the write door is `storage.updatePersonDiet` (`WRITE-2`, the eater PATCH 403 lifted); the three read-time enrichments are deleted (`READ-1`); the self-declared Bridge is deleted (`WRITE-1`). The publication gate's Household Dietary Preference domain now ratchets against the shadow returning |
| Corrected | **2026-07-16 (`DOC-1`)** — this row previously read *"Contested (`users.dietPattern` + `users.dietRestrictions` columns **vs `user_preferences` table**)"*. **That named the wrong rival.** See the note below. **Converged the same day (`CONV1 P4`)** |

> **⚠️ `user_preferences` is not, and never was, the rival for this fact.** This row named it as such from June until 2026-07-16, while `ARCHITECTURE_PRINCIPLES.md` Principle 2 named the real rival — `household_eaters` — throughout. **The two documents were not disagreeing about the answer; they were describing different questions**, which is why the contest survived: an engineer instructed to "resolve Domain 7" would read this row, promote `user_preferences`, retire the `users` columns into it, mark the domain converged — **and never touch `household_eaters`**, leaving Principle 2's actual violation entirely intact.
>
> The `users.diet*` ↔ `user_preferences.dietTypes` overlap **was real and live-divergent**, but it was a **Principle 7 bridge to delete**, not an ownership contest to resolve (Domain 27; `ARCHITECTURE_PRINCIPLES.md` § 4). **Deleting a bridge and choosing an owner are different acts**, and conflating them is what produced this row. *The bridge was deleted 2026-07-16 (`CONV1 P4` / `WRITE-1`); `user_preferences.dietTypes` remains Domain 27's own soft-preference fact, written only by its own doors.*

---

### Domain 8: Discovery

> Personalised food discovery recommendations surfaced in Pantry Explore.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS8 Discovery Engine** (`shared/discovery/engine.ts`) |
| API | `GET /api/pantry/discover` (built in routes.ts using `discover()` from shared/discovery) |
| Status | **Authoritative — declared** |

---

### Domain 9: Alternatives

> Goal-driven food alternative suggestions (dietary, budget, UPF-reduction).

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS9 Alternatives Engine** (`shared/alternatives/engine.ts`) |
| API | `GET /api/pantry/alternatives` |
| Status | **Authoritative — declared** |

---

### Domain 10: Stories

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS10 Stories Engine** (`shared/stories/engine.ts`) |
| API | `GET /api/pantry/stories` |
| Status | **Authoritative — declared** |

---

### Domain 11: Seasonal Stories

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS11 Seasonal Stories Engine** (`shared/seasonal/engine.ts`) |
| Season rule | **`shared/seasonal/season-rule.ts`** — the single canonical implementation of the UK meteorological season rule, and the season vocabulary (`UKSeason`) that goes with it. Domain 11's own file, extracted as a **leaf** (it imports nothing) so every consumer can reach it. *Added 2026-07-17 (`CONV1 P5` / `OWN-3`)* |
| API | `GET /api/pantry/seasonal` |
| Status | **Authoritative — declared.** ✅ **Season rule CONVERGED — 2026-07-17 (`CONV1 P5` / `OWN-3`): three implementations → one.** |

> **⚠️ The season rule's declared owner was not its actual owner, and this row is where that was visible.** Until 2026-07-17 the rule existed **three times**: `shared/discovery/seasonal-map.ts` (exported, **nine** consumers, `getMonth()` 0-based), `shared/seasonal/engine.ts` (private, one consumer — itself, 1-based), and `shared/stories/engine.ts` (private, byte-identical to the second). **The declared owner's rule was the one nobody imported**, and the duplication was documented as a virtue — *"three engines, one season truth"* — **which is a comment, not an owner**. It was worse than a plain copy: two expressed the same rule with **different month bases**, so a reviewer diffing them saw different numbers and could not tell they agreed.
>
> **No ownership moved** (Rule 7 not triggered): Domain 11 is the owner it always was, and the platform converged **onto** it — P4's precedent. `CONV1` § 9 deliberately left the choice open (*"Domain 11 as declared, or the Register corrected to name Domain 8's file — a governance decision, not CONV1's"*); it was **put to the user and decided in favour of Domain 11 on 2026-07-17**. The rule is a **leaf** rather than an export of `engine.ts` for a load-bearing reason `CONV1` did not record: `engine.ts` already imports `../discovery/engine` (which imports `./seasonal-map`) and `../stories/engine`, so those files importing the rule back from `engine.ts` would be a **circular import**. Behaviour is unchanged **by proof** — the converged rule is byte-identical to all three retired implementations across a four-year sweep (`server/tests/test-time3-household-time.ts` § 10), and the gate `household-time / ht-no-rival-season` fails if any of them returns.
>
> **The season is not Household Time** (`HT17`): `shared/time/household-time.ts` supplies this rule's **input** (a civil date) and never its **answer**. One process-local frame read survives — the named transitional adapter `seasonOfLocalDate()` — which preserves today's behaviour exactly. **It is still live after `CONV1 P6`**, and that is a deviation worth stating rather than hiding: P5 recorded it as *"Phase 3's retirement target (`CONV1 P6`)"*, but **CONV1's own P6 row names four workstreams — `READ-4` → `BEH-6` → `SCH-4` → the greeting ×4 — and the season input is not among them.** Retiring it means threading the household's zone through **seven** server assemblers that each pass a process-local `now` (`food-intelligence-assembler.ts:212`, `meal-intelligence-assembler.ts:317`, `nutrition-centre-assembler.ts:154`, `connected-food-intelligence-assembler.ts:336`, `planner-explanation-context.ts:124`, `meal-food-intelligence.ts:133`, `routes.ts:5862`), so it is a workstream rather than a line. **No consumer is half-converged by leaving it** (`HT11`): those seven take neither T2 nor a rival week — they are untouched, which is the honest state. It remains **Phase 3 work, unclaimed**.

---

### Domain 12: Meal Identity

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `meals` table** |
| Supporting tables | `meal_categories`, `meal_diets`, `meal_allergens`, `meal_items` |
| Storage | PostgreSQL via Drizzle ORM (`shared/schema.ts`) |
| Write funnel | `storage.createMeal()` — every new meal row, including seeded ones (`THA_RECIPE_ACQUISITION_ARCHITECTURE.md` §5) |
| Seed | `scripts/import-tha-founding-cookbook-500.ts` — the **single canonical seeder** for the 500 THA Founding Cookbook recipes, in every environment including production (`CBK1`, 2026-07-11). Keyed on `acquisition_source_key` (`tha_original:THA-###`), which is the canonical identity of a founding recipe and is enforced unique by `meals_tha_original_source_key_uniq`. Verified by `npm run verify:cookbook-seed`. `server/lib/seed-ready-meals.ts` separately owns the ready-meal rows and the `meal_categories` vocabulary. |
| Status | **Authoritative — declared** |

---

### Domain 13: Meal Templates / Shell Catalogue

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `meal_templates`** |
| Seed | `server/seeds/seed-meal-shell-templates.ts`, `server/lib/seed-ready-meals.ts` |
| Status | **Authoritative — declared** |

> **RM3 (2026-07-15):** the `meal_template_products` half of this domain was **retired**
> under Principle 8. It was a duplicate, denormalized ready-meal product representation
> with no live consumer — its only reader was `meal-resolution-service.ts` (also deleted)
> behind an unused `/resolve` route, and its only writer was the orphaned Analyser
> "Link to template" flow. A ready meal is a `meals` row you buy instead of cook (Domain 12);
> the Analyser is a read lens over that identity, not a second owner (RM1 §2, §8). The
> table is dropped by migration `2026-07-15_rm3_retire_meal_template_products`.

---

### Domain 14: Planner State

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `planner_weeks`, `planner_days`, `planner_entries`** |
| Supporting tables | `planner_entry_eaters`, `planner_week_eater_overrides`, `meal_plan_entries`, `meal_plans` |
| Calendar anchor | **`planner_weeks.weekStartDate`** — the planner week's calendar identity. Governed by [`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`](./THA_HOUSEHOLD_TIME_ARCHITECTURE.md) (TIME3, 2026-07-16). Written **only at week creation, by this domain's existing write funnel, and never back-filled** (Rule HT7) — the only moment THA can honestly know which calendar week a slot means. Existing rows stay `NULL`. **✅ BUILT — 2026-07-17 (`CONV1 P7` / `SCH-2`).** Nullable `text`, additive, **no SQL default and no row rewritten**; written by `storage.createPlannerWeeks` (this domain's existing funnel — **no new writer**) as `mondayOf(householdToday(now, zone)) + 7 × (N − 1)`, which is legitimate *only* there, where the six slots are being made consecutive in one transaction (TIME1 § 6.2). **Measured at landing: 1,152 planner weeks existed and 0 were back-filled**; they resolve to `anchored: false` forever, which is the honest answer. Gated by `verify:publication` → `household-time` (`ht-anchor-is-never-back-filled`, `ht-anchor-is-stamped-from-the-owner`, `ht-anchor-is-the-planners` — all three mutation-tested). **✅ CONSUMED — 2026-07-17 (`CONV1 P8` / `READ-3`).** Its one reader is `server/lib/household-planner-week.ts` (a thin I/O orchestrator over the pure `resolvePlannerWeek`; owns no rule and no data), published once at **`GET /api/planner/current-week`** and consumed by Home and the Dashboard through the single hook `client/src/hooks/use-current-planner-week.ts`. It retired the five rival "current weeks" — three server `max(weekNumber)` variants (≡ the constant 6), `plannerFull[0]` (≡ 1) and Home's `localStorage` (≡ 1). **`planner:active-week` is no longer read as a household fact anywhere** (`OWN-6`); it survives on the planner page as device-local *view* state ("which week am I editing"), which is not a household fact and never was the defect. *This row previously read "No consumer reads it yet — that is `CONV1 P8`", corrected in the same change that made it false.* **The honest consequence, measured: 192 of 195 households resolve to `anchored: false` permanently** (HT7 — their weeks predate the anchor), so almost every household is told THA does not know their week rather than shown a fallback |
| Day-of-week key space | `planner_days.dayOfWeek` is **`0 = Sunday … 6 = Saturday`** — *declared*, never renumbered (Rule HT8). The Planner stores the integer; `shared/time/household-time.ts` declares what it means. **Known gap:** the convention is undocumented at the point of definition and is read backwards by a minority of live code — see `TIME2` § 8.1 |
| Status | **Authoritative — declared** |

---

### Domain 15: Shopping State

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `shopping_list`, `shopping_list_extras`** |
| Supporting table | `shopping_fulfilment_memory` |
| Status | **Authoritative — declared** |

---

### Domain 16: Household Profiles

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `households`, `household_members`, `household_eaters`** |
| Types | `shared/household-eater.ts` |
| Time zone | **`households.timeZone`** — the household's IANA zone; **the only stored fact from which household-local time is derived**. Governed by [`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`](./THA_HOUSEHOLD_TIME_ARCHITECTURE.md) (TIME3, 2026-07-16). **Household-scoped, never per-member and never per-session** (Rule HT4) — a clock is a property of the home, not of the device; per-member zones would be a split-brain over one shared plan. **✅ BUILT — 2026-07-17 (`CONV1 P5` / `SCH-1`)**, *this cell previously read "**Not yet implemented** — Household Time Phase 2"*. Nullable and additive (migration `2026-07-17_conv1_p5_household_time_zone`); **no back-fill and no SQL default** — all 299 existing households hold `NULL`, which is the honest "THA has not been told" and is **never** silently replaced by the declared default (CP8). **Write funnel:** `storage.createUser` / `storage.createDemoUser` (signup detection, HT12 — the device may *detect* the zone; it may never decide the day) and `storage.setHouseholdTimeZone` (the correction path; owner-only, following `renameHousehold`'s precedent). An unknown IANA id is **dropped, never stored** — validated by `isKnownZone` in the owner module. Read at `GET /api/household`, corrected at `PATCH /api/household/time-zone`. **✅ CONSUMED since 2026-07-17 (`CONV1 P6`)** — *this sentence previously read "**No consumer derives household time from it yet** — that is Phase 3"*. Its consumers are the Companion's temporal anchor (`context-frame-assembler.ts`), the freezer's write door (`storage.addFreezerMeal`) and comparison, the diary, and the greeting — each reading the zone off the household row and resolving the declared default at **read time**. `Europe/London` is a **declared default with provenance** held in `shared/time/household-time.ts`, applied at read time by consumers, **never written to a row** |
| Status | **Authoritative — declared** |

---

### Domain 17: Nutrition Boost (Uplift Rules)

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **server/lib/uplift-rules.ts** (human-authored, requires `reviewedAt`) |
| Engine | `server/lib/uplift-engine.ts` |
| Persistence | DB: `meal_uplift_applications` |
| Status | **Authoritative — declared** |

---

### Domain 18: Nutrition Boost Display (Client-Side Ingredient Context)

> What context text to show next to a boost suggestion ingredient in the UI.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **Contested** — **WS0 Knowledge Registry** (`shared/knowledge/` → DB `knowledge_*` tables, read via `server/services/nutrition-knowledge-registry.ts`) **vs a client-side benefit library that no longer exists in the tree** (see the note below) |
| Status | **Contested — see Phase 3** |
| Corrected | **2026-07-16 (`DOC-5`)** — this row previously read *"Contested (`nutrition-benefit-library.ts` vs WS0 Knowledge Registry)"*, naming as a live party to a contest a file that is **absent from the tree**. The surviving party is now named as **Rule 1 requires** — *"a file path or DB table name, never a vague description"* — in the exact form Rule 1 gives as its own example of an acceptable declaration. **No ownership was decided here** |

> **⚠️ The rival named in this row does not exist, and `DOC-5` did not resolve the contest.**
> Verified 2026-07-16: `nutrition-benefit-library.ts` is **absent from the working tree and from
> `HEAD`**, and **nothing imports it** — `getNutritionBenefit` and `BENEFIT_MAP` have **zero consumers**
> across `client/`, `server/` and `shared/`. **This document already recorded the verdict**: Phase 4's
> Retirement Register lists that library as **Retire** — *"Superseded by WS0 Knowledge Registry. Covers
> only 25 foods vs 188"* — and Rule 6 (*"static client files are not knowledge stores"*) is the rule it
> was retired under. **So the Register has been recording a live contest against a file its own
> retirement register had already condemned and the tree had already removed.**
>
> **What `DOC-5` did not do:** declare WS0 the authoritative owner and mark this domain converged.
> That is an ownership act — it requires confirming that WS0 actually serves this display fact today,
> which is a question about **live consumers**, not about a missing file, and Phase 3 owns it. The
> Status row is therefore **left exactly as it was**. **Recommended as the next `DOC`-class item**,
> alongside Domain 6's identical shape.

---

### Domain 19: Product Analysis

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **server/lib/product-analysis.ts** + **server/lib/upf-analysis-service.ts** |
| Data stores | DB: `product_events`, `product_history`, `groceryProducts`, `productAdditives`, `additives` |
| Status | **Authoritative — declared** |

---

### Domain 20: Food Additive Knowledge

> Editorial explanations of what a food additive is and why THA highlights it.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `food_knowledge` table** |
| Seed | `server/lib/seed-food-knowledge.ts` |
| API | `GET /api/food-knowledge`, `GET /api/food-knowledge/:slug` |
| Coverage | Additives, E-numbers, food concepts |
| Status | **Authoritative — declared** |

---

### Domain 21: Diary

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `food_diary_days`, `food_diary_entries`, `food_diary_metrics`** |
| Status | **Authoritative — declared** |

---

### Domain 22: Food Reports — Plant Diversity (30 Plants)

> Which ingredients from planner/pantry count as "plants", and how many unique plants has the household eaten this week.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **`shared/canonical/diversity-groups.ts`** (`DIVERSITY_GROUP_SEED`, 173 groups) → DB `diversity_group`. The contest with `client/src/lib/nutrition-variety.ts` was **resolved by M4** in the canonical seed's favour. |
| Published | **173 / 173** groups — projection verified equal to the owner (PUB1, 2026-07-14; previously 52). |
| Counting rule | One **diversity group** = one plant. `plantDiversityGroup()` (`shared/canonical/plant-classifier.ts`) is the single owner of that question, and is the key every counter must dedupe on — never the ingredient slug. Kale and cavolo nero are one plant; every tomato variety is one plant. |
| Seed runner | `server/seeds/seed-canonical-food.ts` |
| Status | **Authoritative — published and verified** |
| Known gap | Two counters still dedupe on the canonical slug rather than the group and so can over-count: `server/lib/household-nutrition-assembler.ts` (`weekPlantFacts`) and `server/lib/nutrition-centre-assembler.ts` (`plantDiversity`). The user-facing 30-plants number on Home and Planner (`routes.ts`) was converged by PUB1; these two were not. |

---

### Domain 23: Food Reports — Nutrition / Food Report

> Per-food report: overview, nutrients, benefits, varieties.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **FoodReportKnowledgeAdapter** (`shared/canonical/food-report-adapter.ts`) |
| Reads from | WS2A canonical seed + WS0 knowledge seed — no duplication at query time |
| Status | **Authoritative — declared** |

---

### Domain 24: Ingredient Catalogue

> USDA-derived global food pool, normalised and scored for promotion to canonical.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **shared/catalogue/** (ingestion pipeline) |
| DB table | `ingredient_classifications` (reviewed), `normalizedIngredients` (raw) |
| Status | **Authoritative — declared** |

---

### Domain 25: Ingredient Normalization

> Resolving a raw ingredient string to a canonical key/name.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **server/lib/ingredient-normalization-service.ts** |
| Supporting data | `shared/ingredient-aliases.ts`, `shared/normalize.ts` |
| Status | **Authoritative — declared** |

---

### Domain 26: Membership / Subscription

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `users.subscriptionTier` column** |
| Supporting columns | `users.subscriptionStatus`, `users.subscriptionExpiresAt` |
| Access helper | `hasPremiumAccess(user)` in routes.ts |
| Status | **Authoritative — declared** |

---

### Domain 27: User Preferences

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB: `user_preferences` table** — for preferences proper (display and similar). **Authoritative for its own fact** |
| Not authoritative for | **Diet.** `user_preferences.dietTypes` is a **mirror** of `users.dietPattern`, written by a one-way bridge on the profile write path. **The owner of a person's diet is `household_eaters`** (Domain 7; Domain 16; Principle 2) |
| Status | **Authoritative — declared** (for preferences). **The diet mirror is a Principle 7 bridge, scheduled for deletion with `OWN-1`** — not a contest, and **not a promotion candidate** |
| Corrected | **2026-07-16 (`DOC-1`)** — previously *"Contested columns: `users.dietPattern`, `users.dietRestrictions` (overlapping dietary data) / Status: Contested — see Phase 3"*. This domain is not contested. It was recorded as a party to an ownership contest it is not a party to |

---

### Domain 28: Preparation Knowledge

*(Added `PHASE5A`, 2026-07-12 — builds `WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md`; closes Phase 4 of `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` §7.)*

> What is done to a food between the shop and the plate — cooked, frozen, tinned, smoked, rolled, ground. **Preparation never mints a food and never changes a plant count**: it is a metadata layer *on* a canonical food, read as a second, independent pass over the same ingredient string (WS5A §1.7).

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **WS0 Knowledge Registry, extended** (DB `knowledge_preparations`, `knowledge_food_preparations`, `knowledge_preparation_effects`) |
| Read layer | `server/services/nutrition-knowledge-registry.ts` — `getPreparationsForFood()`, `listPreparations()`. **The one mouth** (Rule KC4): no surface re-derives a preparation from an ingredient string, and no surface composes its own sentence about what a preparation does |
| Seed data | `shared/knowledge/preparations.ts` (the catalogue + the `commonForms` → preparation map) |
| DB seed runner | `server/seeds/seed-knowledge-registry.ts` — **the same single writer** as every other knowledge row. It seeds EXISTENCE only |
| Human confirm gate | `server/seeds/signoff-knowledge-claims.ts --edge preparation-effect` — the *only* way an effect is ever published |
| Key space | `knowledge_foods.slug` — the same key space as `knowledge_food_nutrients` and `knowledge_food_benefits`. **No second key space was created** (Principle 1) |
| Evidence contract | **Identical to the benefit chip's.** An effect renders only if `isEvidenceBackedClaim()` passes: ≥1 Layer-1 trusted `SourceRef` **and** a named human `reviewedAt`/`reviewedBy`. No new evidence vocabulary and no second lifecycle (Rule KC1) |
| Coverage today | 39 preparations · 420 food↔preparation links · **0 effects** |
| Consumers | `getFoodDetailView()`; the `nutrition-knowledge` Intelligence capability (`read` scope `preparations`) |
| Status | **Authoritative — declared and enforced.** Existence is stated freely; **effect defaults to silence** and is an honest gap until a human signs one off (WS5A §9.3) |

---

### Domain 29: Product Knowledge (what THA itself is)

*(Registered by `PKR1`/`PKR2`, admitted as a platform knowledge domain by `PKR3`, and given its runtime read path by `PHASE5A`, 2026-07-12.)*

> The knowledge describing **The Healthy Apples itself** — its domains, pages, journeys, capabilities, integrations, settings, claims and glossary. The platform's fifth knowledge domain, and its first **self-describing** one: the subject and the source are the same system.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **The Product Knowledge Registry — `docs/product/`**, authored as `inventory/product.yaml` |
| Machine form | `docs/product/inventory/product.json` — generated by `scripts/build-product-inventory.ts`, and **the only artefact the Intelligence Platform ever reads** (Rule PKR21). It is a derived projection: rebuildable, never written back to (Principle 7) |
| Read layer | `server/services/product-knowledge-registry.ts` — permission-filtered; **there is no unfiltered read exported**, so a caller cannot obtain an over-tier entry by choosing the wrong function |
| Capability | `product-knowledge` in `server/intelligence/capability-registry.ts` (read · search · explain) |
| Validator | `scripts/verify-product-inventory.ts` — asserts the prose↔inventory bijection (Rule PKR11) |
| Evidence standard | **Currency, not sourcing** (Rule KC14). A food fact is wrong because it was *never* true; a product fact is wrong because it *stopped* being true. The enemy here is **staleness**, and a stale entry is indistinguishable from a fresh one by reading it |
| Permission model | Per-entry `visibility`: `public` ⊂ `household` ⊂ `admin` ⊂ `developer`. Monotonic (PKR23); **fails closed to `developer`** (PKR22); keys on **role, never subscription tier** (PKR24); filtered **before** prompt composition (PKR26) |
| The safety property | **The registry classifies; `server/lib/access.ts` authorises** (PKR25). No registry value decides who anyone is — so a Markdown edit can never become a privilege escalation |
| Status | **Authoritative — declared.** Currency (`last_verified` inside a bar) and `sources`-resolution are **declared and NOT yet enforced** — the gap PKCA §4.3 named at the domain's birth. The bijection and visibility checks ARE enforced |

---

### Domain 30: Pantry State

*(Declared `OWN-5`, 2026-07-16 — CONV1 § Tier 1 / phase P1. **The domain existed for the whole life of this Register and was never in it.**)*

> What a household **has in the house**. Per-household, household-authored, transactional state — not knowledge, not a projection of any seed, and owned by nobody else.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB `user_pantry_items`** (`shared/schema.ts:1010`) |
| Owning module | `server/storage.ts` — the **only** module that inserts, updates or soft-deletes pantry rows (`:2138` add, `:2159` update, `:2169` delete, `:2187` + `:2224` seed defaults) |
| Read layer | `storage.getPantryItems(userId)` (`server/storage.ts:2129`). The Intelligence side reads through the INT8 narrow port `server/intelligence/handlers/pantry-read-port.ts:48` — **no write methods by construction** |
| API surface | `/api/pantry` (`server/routes.ts:7788` GET · `:7808` POST · `:7844` PATCH · `:7864` DELETE); intelligence reads at `:5641`, `:5870`, `:11418`, `:11438`, `:11464`, `:11490` |
| Scope | **Per-household, keyed on `household_id`** — the canonical read filters on it alone (`storage.ts:2134`), and uniqueness is household-scoped (`server/migrations/runner.ts:834-836`). `user_id` records **the authoring member, never the access scope**. The original per-user `UNIQUE(user_id, ingredient_key)` was dropped (`runner.ts:823`) |
| Publication variant | **Transactional** (`CANONICAL_PUBLICATION_ARCHITECTURE.md`) — household-authored, no owner-to-projection contract. Already declared at `server/verification/publication-register.ts:738-748`; the drift check `pn-activity-drift` (`:751`) compares `activity_summary.current_pantry_items` against the table |
| Consumers | `pantry-page.tsx`; `shopping-workspace-page.tsx:1456`; `shopping-list-page.tsx:1588`; `PantryKnowledgeHub.tsx`; `PantryIntelligencePanel.tsx` (*"It OWNS NOTHING"* — `:8`); capabilities `pantry` (`capability-registry.ts:529`) and `pantry-discovery` (`:615`); `pantry-intelligence-assembler.ts:140`; `opportunity-engine.ts:400`; `planner-explanation-context.ts:227` |
| **The domain owns no time** | **There is no expiry, no purchase date, no best-before, no shelf life.** The only temporal column is `created_at` (`schema.ts:1024`) — a row-insert timestamp, not a food-ageing fact. `expiry_date` at `schema.ts:813` belongs to **`freezer_meals`** (Domain 12's neighbour), not here. **The domain most semantically entitled to food ageing owns none of it** — recorded as an honest gap (Principle 6), not a defect, and **not closed here**: adding a fact is a governed act under Rule 8, and `OWN-5` is a declaration |
| Status | **Authoritative — declared, with two Rule 5 consumer defects recorded below** |

**Rule 5 defects, recorded at declaration rather than discovered later:**

| Site | Defect |
|---|---|
| `server/lib/product-event-logger.ts:112-115` | Reads `user_pantry_items` **directly**, bypassing the owning module — and counts by **`user_id`** where the canonical scope is `household_id`. A member's count, not the household's |
| `server/benchmark/world-seeder.ts:212`, `scripts/import-development-world.ts:406` | Direct `db.delete` by `user_id`. **Non-production fixture teardown**, and both write back through the owner (`:351`, `:555`) — but the store exposes no reset method, so they have no in-contract path |

> `publication-register.ts:743` declares `authorisedWriters: ["server/storage.ts"]` and `:745` `runtimeReadPath: "server/storage.ts (one path)"`. **Neither declaration covers the three sites above.** Recorded here; **not fixed by `OWN-5`, which changes no code.**

---

### Domain 31: Evidence & Learning (EL1)

*(Declared `OWN-5`, 2026-07-16. Built by `EL1` on **2026-07-03** — ten days after this Register was written, and never added to it. **Shipped code has asserted this row's existence since the day the tables were created.**)*

> What THA has **observed** about a household, and what the household has **confirmed**. Two tables, two scopes: an append-only evidence log, and a derived, re-evaluated-in-place signal over it.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB `household_evidence_events`** (`shared/schema.ts:2563`) — append-only, never edited after insert; **DB `household_learning_signals`** (`:2612`) — derived, re-evaluated in place, `UNIQUE(household_id, domain, subject_type, subject_key, direction)` (`:2635`) |
| Owning module | `server/intelligence/evidence-learning/evidence-learning-store.ts` — `DatabaseEvidenceLearningStore` (`:133`), singleton `evidenceLearningStore` (`:251`) |
| Detection | `server/intelligence/evidence-learning/framework.ts` — **pure and deterministic**: `MIN_EVIDENCE_COUNT = 3` (`:53`), `MIN_CONSISTENCY = 0.7` (`:56`), `EVIDENCE_WINDOW_DAYS = 90` (`:199`). *"NO machine learning, NO statistical model, NO LLM judgement"* (`:8`) |
| The one door | **Rule EL2** — evidence enters through `server/intelligence/evidence-learning/household-observation.ts` only, routed via `intelligencePlatform.handle()`. Governance: `docs/investigations/intelligence/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md` § 4 |
| Lifecycle vocabulary | `SignalStatus = "pending_confirmation" \| "confirmed" \| "declined"` (`evidence-learning-store.ts:45`). `DECIDED_STATUSES = {confirmed, declined}` (`:48`) |
| The rule the store owns | **A decided signal is never relitigated.** `upsertSignal` refreshes evidence strength but **`status` is absent from the SET clause by construction** (`:180-187`, `:205-211`) — not guarded by a conditional, but unable to be written. `confirmSignal` is idempotent on decided signals (`:234`) |
| Capability | `evidence-learning` (`server/intelligence/capability-registry.ts:708`) — `report · search · approve · delete`, `executableIntents: []` |
| Retention | **None. The 90-day window is a *detection* window, not a retention rule** (`framework.ts:221-223`) — an event older than 90 days is *recorded and retained*, then correctly ignored by detection. The only deletion is FK `ON DELETE CASCADE` from `households` (`schema.ts:2565`, `:2614`) |
| Governance | `docs/implementation/knowledge/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md` (built it); `EL2` (refined it). EL1 owns **zero** business-domain or preference data — mirrors Rule FI1 (`schema.ts:2556-2562`) |
| Status | **Authoritative — declared. The sole-ownership claim its own code makes is NOT true today (below)** |

> **This row makes an assertion in shipped code true for the first time.** `evidence-learning-store.ts:5-6` cites this Register, and `capability-registry.ts:711` states the tables are *"SoT-registered under EL1"*. **Both were false from the moment they were written** — this Register held no row for EL1, and its Preamble predates EL1 by ten days. Until 2026-07-16 the only place EL1's SoT registration existed was in the code claiming it.

**Rule 5 defects — the sole-ownership claim does not hold.** `evidence-learning-store.ts:4-7` states *"No other module reads or writes these tables directly."* **Seven sites contradict it:**

| Site | Access |
|---|---|
| `server/verification/publication-register.ts:1298` | Raw `SELECT … FROM household_learning_signals` — **the verifier itself bypasses the owner it verifies** |
| `server/benchmark/world-seeder.ts:269-270` | Direct `db.delete` on both tables |
| `server/benchmark/world-seeder.ts:598-599` | Direct `db.select` count on both tables |
| `server/development-world/world-reader.ts:385-386` | Direct `db.select` count on both tables |
| `scripts/import-development-world.ts:459-460` | Direct `db.delete` on both tables |
| `scripts/benchint2-verify-world-derivation.ts:78-81` | Direct `db.select` on both tables |

> **Root cause, recorded so the fix is not guessed:** `IEvidenceLearningStore` (`:106-127`) exposes **no delete or reset method**, so every fixture-reset path is forced out of contract. The repo's tests assert only the narrower EL2 one-door rule (`test-learn1-household-learning.ts:511-524`) — **no test asserts sole ownership, which is why this drifted unobserved.** Not fixed by `OWN-5`; filed as a follow-on.

---

### Domain 32: Platform Observations (OBS1)

*(Declared `OWN-5`, 2026-07-16. Built by `OBS1`, 2026-07-08. Governance: [`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`](./THA_OBSERVATION_ENGINE_ARCHITECTURE.md).)*

> What the **platform** did — routing, capability invocation, context composition, recovery, escalation. **Operator-scoped telemetry, never household knowledge.** The one domain in this Register whose entire value depends on nothing ever reading it back into behaviour.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **DB `platform_observations`** (`shared/schema.ts:2668`) |
| Owning module | `server/intelligence/observation/observation-store.ts` — **sole owner, and the claim is TRUE**: verified by repo-wide sweep, zero readers or writers of the table outside this module. The only other textual occurrences are the declaration (`schema.ts:2668`), the DDL (`server/migrations/runner.ts:1603-1627`) and one comment |
| Vocabulary owner | `server/intelligence/observation/observation-engine.ts:47-64` — `OBSERVATION_KINDS`, a **closed** `as const` union. Extensibility rule: closed-but-growable `kind` + JSONB `metadata`, **never schema redesign** (`schema.ts:2655-2667`) |
| Capture seam | `recordObservation()` (`observation-engine.ts:133`) — returns **`void`**, not a promise. *"Never throws, never blocks, never alters the observed operation"* (`:130-132`). `OBS_DISABLE_CAPTURE=1` is a functional no-op (`:107-109`, `:134`), **tested** (`test-intelligence-observation-telemetry.ts:142-149`) |
| Contract | `observation-contract.ts` — `IObservationStore` (`:27`), `InMemoryObservationStore` (`:39`). *"No database import may ever be added to this file"* (`:7`). **The store throws; the engine swallows** (`:28`) — isolation lives at the seam, not the store |
| Retention | **Bounded operational window, not an archive.** `RETENTION_DAYS = 30`, `MAX_ROWS = 50_000`, pruned opportunistically every 100th write (`observation-store.ts:37-56`, `:116-127`). **No cron** — pruning only occurs under write traffic |
| Readers | Admin-only, all `assertAdmin`, all read-only: `server/routes.ts:12465-12629` (overview, capabilities, intents, context, companion, knowledge, planner, benchmarks, recent, export, behaviour, timelines). Operations: `server/lib/platform-status.ts:190-200`. Client: `admin-observation-workbench-page.tsx`, `admin-behaviour-workbench-page.tsx` |
| Projections | `execution-timeline.ts` (OBS2) reconstructs per-interaction execution paths **from observation rows only — there is no timeline table** (`:1-25`) |
| **The prohibition that defines the domain** | **Nothing may read an observation back into behaviour.** `THA_OBSERVATION_ENGINE_ARCHITECTURE.md:182`: *"Any behaviour that reads an observation — routing, permissions, confirmation tiers, phrasing, notices, learning — **stop**."* Cited by `HT16` (`THA_HOUSEHOLD_TIME_ARCHITECTURE.md:278`) and by its § 8.1 (`:240`), which forbids the Observation Engine from consuming Household Time — **a permanent verdict, not a migration backlog**. Observation day buckets are **operator-scoped**: declare the frame, never convert it (`:244`) |
| Status | **Authoritative — declared and enforced.** Sole ownership verified; `OBS_DISABLE_CAPTURE` no-op tested |

> **One drift recorded, not corrected here.** The code declares **fourteen** kinds (`observation-engine.ts:47-62`); the governing document says **thirteen** (`THA_OBSERVATION_ENGINE_ARCHITECTURE.md:45`, `:197`). The fourteenth — `delivery-decision` — was added by `DEC1` and is documented in `THA_DECISION_ENGINE_ARCHITECTURE.md:21`, **not** in the Observation Engine's own taxonomy. **The code is ahead of its document.** Correcting the Observation Engine architecture is a different document with a different owner — filed as a follow-on, on the line `DOC-2` drew for `NK2` and `DOC-4` for `PKCA`.

---

### Domain 33: Benchmark World

*(Declared `OWN-5`, 2026-07-16. **This entry corrects the finding that produced it** — see the note below.)*

> The ten permanent, authored **Benchmark Households** and the scored runs executed against them. DEV-only, admin-gated. It is a domain that **owns no database table** — and that is the fact worth declaring.

| Attribute | Value |
|-----------|-------|
| Authoritative Source | **`server/benchmark/world-fixtures.ts`** — *"the single authored source of truth for the TEN permanent Benchmark Households"* (`:3-6`). Pure data + types; **no database imports** (`:32-35`) |
| Scored-run artefacts | **The filesystem, not a table** — `docs/intelligence/benchmark/history/` (`server/tests/benchmark/bundle.ts:22`), written by `saveRun()` (`history.ts:64-79`), **append-only** (*"scored artefacts are appended, never edited"*, `:4-7`). 294 run files tracked in git |
| Seeder | `server/benchmark/world-seeder.ts` — the only writer, and **it owns no table**: it writes exclusively **through other domains' existing owners** (`storage.createUser`, `createHouseholdForUser`, `joinHousehold`, `addPantryItem`) |
| Golden fixture | `server/tests/benchmark/fixtures/companion-benchmark-100.v1.json`, pinned at `bundle.ts:21`. Governance: `docs/intelligence/benchmark/questions/THA_COMPANION_BENCHMARK_100_V1.md` |
| Expectations | `server/tests/benchmark/expectations.ts` — **derived**, never authored: *"never invents a household fact, only classifies the SHAPE of the correct answer"* (`:10-12`); resolves capability tokens against the live registry — *"zero duplicated truth"* (`:26-27`) |
| Scoring | `scorer.ts`, `aggregate.ts`; `RUBRIC_VERSION` / `FRAMEWORK_VERSION` v2.0.0 (`bundle.ts:24-38`). A rubric MAJOR change **re-baselines** rather than reporting a false regression (`history.ts:96-124`) |
| DB footprint | **Exactly one row-kind in another domain's table** — `benchmark-run` observations (`server/tests/benchmark/runner.ts:224`), written fire-and-forget so *"a missing or unreachable observation store never affects a benchmark run"* (`:219-220`). The table is **Domain 32's**, sole-owned by `observation-store.ts`. Benchmarks owns the *kind's semantics*; the Observation Engine owns the *table, the vocabulary and the read view* (`summarizeBenchmarks`, `observation-engine.ts:917`) |
| Runtime reach | **Live but DEV-only.** 14 admin routes (`server/routes.ts:8549-8792`, `:12488`), **lazily imported** (`:8552`) so the module never enters the boot graph. Every entry point re-asserts `assertBenchmarkWorldAllowed()` — *"Benchmark Household World is DEV-only. Refusing to touch a production environment"* (`world-seeder.ts:81-87`). Routes disclaim ownership: *"These routes own no benchmark logic"* (`:8544`) |
| Determinism contract | Content frozen per `BENCHMARK_WORLD_VERSION`; **DB row ids are explicitly not part of the contract**; permanent identity is `BW01`–`BW10` (`world-fixtures.ts:19-30`). Known gaps are *"as canonical as present facts"* — honest-gap traps by design |
| **The enforced invariant** | **The platform contains no benchmark-aware behaviour** — `server/tests/test-benchmark-no-production-branch.ts` text-scans `server/intelligence/**` and `server/services/**` and fails on any executable reference (`:58`), allow-listing exactly five Observation-Engine artefact tokens (`:71-77`). *"Nothing here is reachable from `processUserTurn`"* (`:36`). **Any future Register row granting Benchmarks ownership inside the Intelligence trees would contradict an enforced test** |
| Status | **Authoritative — declared. Owns no table, and must not acquire one** |

> **This row corrects the audit finding that created it, rather than propagating it.** `CPI1:173` — quoted verbatim by `CONV1` item `OWN-5` — records *"three live, **table-owning**, runtime-read domains have no row at all: Benchmarks, Learning (EL1), and Observations (OBS1)."*
>
> **Benchmarks is not table-owning.** Verified by enumerating all 88 `pgTable` declarations in `shared/schema.ts` (none benchmark) and sweeping `server/benchmark/` and `server/tests/benchmark/` for `pgTable` and `drizzle-orm/pg-core` imports (**zero of each**). The "no row at all" half of the finding was true; the "table-owning" half was not.
>
> **The correction is not pedantry — it changes what the row must say.** Declared as *table-owning*, this domain's SoT would have been recorded as a table that does not exist, and a reader looking for the ten households would search the database and find nothing. Its actual source of truth is **an authored TypeScript fixture and an append-only directory of JSON**, which Rule 1 permits explicitly: *"a file path or DB table name."* **CPI1 and CONV1 are history and are not edited** (`REPOSITORY_CONVENTIONS.md` § 3); the correction of record is this row and `docs/implementation/governance/OWN5_SOURCE_OF_TRUTH_REGISTER_DOMAINS.md` § 4.1.

---

## PHASE 3 — DUPLICATION AUDIT

### DUPLICATION 1: Food Knowledge (Nutrition) — CRITICAL

**Multiple sources? YES — 5 systems**

| System | Location | Coverage | Purpose | Status |
|--------|----------|----------|---------|--------|
| WS0 Knowledge Registry | `shared/knowledge/` → DB `knowledge_*` tables | 610 foods, structured nutrients + benefits | Primary nutrition knowledge store for Pantry Explore, Food Report | **Authoritative** |
| `pantry-knowledge.ts` | `client/src/lib/pantry-knowledge.ts` | ~50 ingredients (flat map) | Pantry inventory context: why it matters, how to choose, tags | **Parallel — not retired** |
| `nutrition-benefit-library.ts` | `client/src/lib/nutrition-benefit-library.ts` | ~25 boost ingredients | Boost ingredient display: key nutrients + one-line summary | **Parallel — not retired** |
| `pantryIngredientKnowledge` table | DB `pantry_ingredient_knowledge` | 1 row per ingredient_key | AI-enriched version of pantry-knowledge, same schema | **Parallel — enrichment cache** |
| `foodKnowledge` table | DB `food_knowledge` | Additives + food concepts | Editorial articles on additives (separate domain — additive knowledge) | Scoped correctly to additive domain |

**Overlap:** `pantry-knowledge.ts` and `nutrition-benefit-library.ts` both contain
facts about the same foods (chickpeas, walnuts, spinach, chia seeds, flaxseed,
almonds, pumpkin seeds). WS0 Registry contains all of these and more.

**Conflict Risk:** HIGH
- The three stores can and do disagree on phrasing, scope, and which nutrients
  to highlight. PlantDiversityReport uses `nutrition-benefit-library.ts`.
  Pantry inventory uses `pantry-knowledge.ts`. Pantry Explore uses WS0. Three
  different descriptions of chickpeas can appear in the same session.

**Launch Risk:** HIGH
- A user who sees "Chickpeas" in Plant Diversity (from nutrition-benefit-library)
  gets different nutrient emphasis than the same user viewing Pantry inventory
  (pantry-knowledge) vs Pantry Explore (WS0). This undermines trust.

---

### DUPLICATION 2: Dietary Rules (Pattern Matching) — MODERATE

**Multiple sources? YES — 2 copies**

| System | Location | Purpose |
|--------|----------|---------|
| `server/lib/dietRules.ts` | Server | Recipe filtering, meal scoring |
| `client/src/lib/dietRules.ts` | Client | Client-side diet checks |

**Nature of duplication:** The client file carries the comment:
> "This file is an identical copy of server/lib/dietRules.ts — pure TypeScript
> with no Node.js dependencies so it runs safely in the browser."

**Overlap:** 100% — keyword sets, logic, interfaces are identical.

**Conflict Risk:** MEDIUM
- Any change to dietary rule keywords made to server but not client (or vice
  versa) produces silent split-brain behaviour. There is no enforcement that
  they stay in sync.

**Launch Risk:** YELLOW — not an immediate user-visible consistency failure,
but a maintenance trap that will surface eventually.

---

### DUPLICATION 3: Plant Diversity Counting — MODERATE

**Multiple sources? YES — 2 systems**

| System | Location | Approach | Coverage |
|--------|----------|----------|---------|
| `nutrition-variety.ts` | `client/src/lib/nutrition-variety.ts` | Keyword word-lists (FRUITS, VEGETABLES, WHOLE_GRAINS, HERBS_SPICES, OLIVE_OIL) | ~200 ingredient strings |
| WS2A `diversity_group` table | `shared/canonical/diversity-groups.ts` → DB | Structured groups with explicit plant/non-plant membership | WS2A canonical food set |

**Overlap:** Both answer "does this ingredient count as a plant?" but by
different mechanisms. nutrition-variety.ts uses keyword matching; diversity_group
uses structured canonical records.

**Conflict Risk:** MEDIUM
- An ingredient that matches nutrition-variety.ts but has no canonical record
  will be counted in the 30-plants widget but produce an empty Food Report.
  An ingredient that is in the diversity_group DB but not in nutrition-variety.ts
  word lists will not be counted in the 30-plants counter even though it is
  a verified plant.

**Launch Risk:** YELLOW — inconsistent counts are plausible.

---

### DUPLICATION 4: Dietary Preferences (User) — ✅ RESOLVED *(was: ownership inverted)*

> **✅ Converged 2026-07-16 (`CONV1 P4`).** The analysis below is preserved as the record of the duplication as it stood. Its resolution: `users.dietPattern` / `users.dietRestrictions` **dropped** (`OWN-1`, behind a zero-data-loss migration gate); the write door moved to `household_eaters` first (`WRITE-2`); the three read-time enrichments deleted (`READ-1`); the mapping collapsed to `shared/dietRules.ts` (`READ-2`); the Bridge deleted (`WRITE-1`); eater rows created at membership events under a unique index (`WRITE-3`).
>
> **⚠️ Corrected 2026-07-16 (`DOC-1`). This audit compared the wrong pair.** As originally written it examined `users.diet*` against `user_preferences` — a genuinely low-risk overlap — graded it *"Conflict Risk: LOW / Launch Risk: GREEN"*, and **never compared `users.diet*` against `household_eaters`**, which is the duplication [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) Principle 2 has named since 2026-06-25. **Every downstream ruling in Phases 4, 5 and 7, and in Appendix A, inherited that comparison** — which is how a safety-relevant duplication came to be carried as GREEN. The original text is preserved below the corrected analysis, struck, so the error is legible rather than erased.

**Multiple sources? YES — 3 locations, in two distinct relationships**

| System | Location | What is stored | Relationship |
|--------|----------|---------------|--------------|
| **`household_eaters`** | DB `household_eaters` | Per-person diet types + hard restrictions | ✅ **THE OWNER** (Domain 16; Principle 2) |
| `users` table columns | `users.dietPattern`, `users.dietRestrictions` | Diet pattern + restriction array on the users row | 🔴 **Redundant shadow of the owner** — same scope, must always agree → redundant. **Retire** (`OWN-1`) |
| `user_preferences` table | `user_preferences.dietTypes` | Richer preference set (display prefs, etc.) + a mirrored diet pattern | 🟡 **Not a rival owner.** Joined to `users.dietPattern` by a one-way bridge → **delete the bridge** (Principle 7) |

**The contest (ownership):** `users.diet*` vs `household_eaters`. Same fact, same
scope, two stores — resolved in the owner's favour by Principle 2, and unactioned
since 2026-06-25. A person's diet is owned by their eater row; today an adult's is
owned by their account and a child's by their eater row, **discriminated by whether
they have a login**.

**The bridge (not a contest):** `users.dietPattern` → `user_preferences.dietTypes`.
**This is not an ownership question and must not be resolved as one.** It is the
shape Principle 7 forbids, and it dies with the retirement.

**Conflict Risk:** **HIGH** *(was LOW, against the wrong pair)* — **and one half is
live.** The original text predicted
*"if a future PR writes to `user_preferences` for dietary settings, a split-brain
will emerge."* **That PR landed.** The profile write path now carries a self-named
one-way, failure-swallowing *"Bridge"* which fires only when `dietPattern` is
written, while `PUT /api/user/preferences` writes `dietTypes` without touching
`dietPattern` — so the two disagree for the same person. The divergence is on the
*pattern* (a soft preference), **not** on `dietRestrictions` (the hard safety fact).
Against `household_eaters` no divergent value is held today only because adult eater
rows are written empty and the eater write door 403s — **the correct owner is kept
empty, not kept in step**.

**Launch Risk:** **YELLOW** *(was GREEN)* — see `ARCHITECTURE_PRINCIPLES.md` § 4.
The live divergence is on the diet *pattern* (a soft preference), not on
`dietRestrictions` (the hard safety fact), and the worst symptom — dietary
restrictions being dropped from the Companion's household context — **was closed
separately and is not live**. It is not GREEN, because the ownership is inverted and
**the retirement itself moves live allergens**: it is the one migration in this
register where a mistake reaches a plate.

<details>
<summary><strong>Original text (June — superseded 2026-07-16 by `DOC-1`; preserved, not deleted)</strong></summary>

> **Multiple sources? YES — 2 locations**
>
> | System | Location | What is stored |
> |--------|----------|---------------|
> | `users` table columns | `users.dietPattern`, `users.dietRestrictions` | Diet pattern + restriction array directly on users row |
> | `user_preferences` table | `user_preferences` (separate table) | Richer preference set (display prefs, etc.) |
>
> **Overlap:** Both store dietary information. `user_preferences` was created to
> extend preferences beyond what fit on the users row, but dietary data now
> exists in both places.
>
> **Conflict Risk:** LOW — routes currently read from `users` columns for dietary
> data, not `user_preferences`. But if a future PR writes to `user_preferences`
> for dietary settings, a split-brain will emerge.
>
> **Launch Risk:** GREEN — low immediate risk, medium future risk.

</details>

---

## PHASE 4 — RETIREMENT REGISTER

| System | Domain | Recommendation | Reason |
|--------|--------|---------------|--------|
| `nutrition-benefit-library.ts` | Food Knowledge | **Retire** | Superseded by WS0 Knowledge Registry. Covers only 25 foods vs 188. Client reads WS0 via the knowledge API or FoodReportKnowledgeAdapter. |
| `pantry-knowledge.ts` | Food Knowledge | **Merge → Retire** | The "why it matters / how to choose" content should be migrated into WS0 (as editorial `description` + `storageGuidance` fields) or into `pantryIngredientKnowledge` DB. The static file then retires. |
| `pantryIngredientKnowledge` table | Food Knowledge | **Retain as cache** | This is the correct enrichment cache pattern — lock = manual, unlocked = AI-enrichable. Once `pantry-knowledge.ts` is migrated in, this becomes the single persistence layer. |
| `foodKnowledge` table | Food Additive Knowledge | **Retain** | Different domain (additives/concepts, not ingredient-level nutrition). Not a duplicate. |
| `client/src/lib/dietRules.ts` | Dietary Rules | **Retire** | Move to `shared/` as a single module imported by both server and client. Eliminates the copy-paste maintenance risk. |
| `nutrition-variety.ts` | Plant Diversity | **Migrate → Retire** | Plant classification should derive from WS2A canonical + diversity_group. nutrition-variety.ts keyword lists are a prototype-era workaround that pre-dates the canonical model. |
| `users.dietPattern` / `users.dietRestrictions` | Dietary Preferences | **✅ RETIRED — 2026-07-16 (`CONV1 P4` / `OWN-1`)** *(corrected 2026-07-16, `DOC-1`)* | **The owner is `household_eaters`** ([`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md) Principle 2, since 2026-06-25; Domain 16). The retirement followed the ordered sequence exactly: write door first (`WRITE-2`), columns dropped behind a zero-data-loss migration gate (`OWN-1`), scaffolding last (`READ-1` + `READ-2` + `WRITE-1`). **⚠️ This row previously read *"Retain … Mark them as the SoT until user_preferences is promoted"* — a ruling that contradicted Principle 2 outright and named a promotion target that is not the owner.** *"Still the live path"* and *"the SoT"* are not the same claim, and collapsing them is what kept this shadow alive for three weeks past its retirement order. |

---

## PHASE 5 — CONSUMER COMPLIANCE AUDIT

For each consumer, verify: does it read from the declared authoritative source?

### Food Knowledge Consumers

| Consumer | Domain SoT (declared) | Actual source used | Compliant? |
|----------|----------------------|--------------------|-----------|
| `PlantDiversityReport.tsx` | WS0 Knowledge Registry | `nutrition-benefit-library.ts` | **NO** |
| `MealUpliftPanel.tsx` | WS0 Knowledge Registry | `nutrition-benefit-library.ts` | **NO** |
| `PantryExplore.tsx` | WS0 Knowledge Registry | `health-benefits-model.ts` → both nutrition-benefit-library AND pantry-knowledge | **PARTIAL** |
| `PantryKnowledgeHub.tsx` | WS0 Knowledge Registry | `health-benefits-model.ts` → nutrition-benefit-library + pantry-knowledge | **PARTIAL** |
| `FoodReport.tsx` | WS0 Knowledge Registry | `food-report-adapter.ts` → WS0 + canonical | **YES** |
| `pantry-page.tsx` | WS0 Knowledge Registry | `pantry-knowledge.ts` | **NO** |
| `health-benefits-model.ts` | WS0 Knowledge Registry | Bridges both `pantry-knowledge.ts` and `nutrition-benefit-library.ts` | **NO** |
| `server/services/nutrition-knowledge-registry.ts` | WS0 Knowledge Registry | WS0 DB tables directly | **YES** |
| `GET /api/knowledge/*` routes | WS0 Knowledge Registry | `nutrition-knowledge-registry.ts` | **YES** |

---

### Dietary Rules Consumers

| Consumer | Domain SoT (declared) | Actual source | Compliant? |
|----------|----------------------|---------------|-----------|
| `server/lib/meal-scoring-service.ts` | `server/lib/dietRules.ts` | server/lib/dietRules.ts | **YES** |
| `server/lib/smart-suggest-service.ts` | `server/lib/dietRules.ts` | server/lib/dietRules.ts | **YES** |
| Client-side components | `server/lib/dietRules.ts` | `client/src/lib/dietRules.ts` (copy) | **NO** — uses copy, not canonical |

---

### Plant Diversity Consumers

| Consumer | Domain SoT (declared) | Actual source | Compliant? |
|----------|----------------------|---------------|-----------|
| `PlantDiversityReport.tsx` | diversity_group DB + canonical | `nutrition-variety.ts` (keyword lists) | **NO** |
| `plant-diversity-page.tsx` | diversity_group DB + canonical | `nutrition-variety.ts` | **NO** |
| `FoodReport.tsx` varieties | diversity_group DB + canonical | `food-report-adapter.ts` → WS2A canonical | **YES** |

---

### Dietary Preferences Consumers

> **⚠️ Corrected 2026-07-16 (`DOC-1`).** This table previously declared the SoT as
> `users.dietRestrictions` / `users.dietPattern` and marked every consumer **YES**.
> **It was measuring compliance against the shadow.** The declared owner is
> `household_eaters` (Domain 7; Domain 16; Principle 2), so the verdicts invert.
>
> **A `NO` here is not a defect to fix today.** These consumers read the shadow
> *because the shadow is still the live path*, and that is correct until `OWN-1`
> moves the write door onto the owner. **Repointing a read before the write moves
> would silently discard a household's declaration** — the read-time scaffolding is
> load-bearing until then and comes down last. The `NO`s record the distance to the
> declared owner; they are not a work queue, and they must not be closed in this
> order.

| Consumer | SoT (declared) | Actual source | Compliant? |
|----------|---------------|---------------|-----------|
| Planner compliance gate | **`household_eaters`** | reads the canonical resolver over `household_eaters` | **YES** — *converged 2026-07-16 (`CONV1 P4` / `OWN-1`)* |
| Smart suggest service | **`household_eaters`** | reads `household_eaters` (requester via `getPersonDiet`; eaters via stored rows) | **YES** — *converged 2026-07-16 (`CONV1 P4`)* |
| Profile page save | **`household_eaters`** | **writes** `household_eaters` via `storage.updatePersonDiet` | **YES** — *the write door moved first (`WRITE-2`), 2026-07-16* |
| Eater write door (adult rows) | **`household_eaters`** | PATCH edits any eater row | **YES** — *the 403 is lifted (`WRITE-2`), 2026-07-16* |
| `user_preferences` diet mirror | **`household_eaters`** | *(bridge deleted)* | **YES** — *the Principle 7 bridge was deleted 2026-07-16 (`CONV1 P4` / `WRITE-1`); `dietTypes` remains Domain 27's own soft-preference fact* |

---

## PHASE 6 — ARCHITECTURE GOVERNANCE RULES

The following rules are proposed as mandatory for all future THA development.

---

### Rule 1: Every Major Domain Must Declare a Source of Truth

Every domain listed in Phase 1 must have an explicit, named Source of Truth.
The name must be a file path or DB table name — never a vague description.

> _"We use the knowledge registry"_ is not acceptable.
> _"`shared/knowledge/` → DB `knowledge_*` tables, read via `nutrition-knowledge-registry.ts`"_ is acceptable.

---

### Rule 2: Every Architecture Proposal Must Answer the Replacement Question

Before any new system is created that stores domain data, the proposal must answer:

**"Does this replace an existing store?"**

- If **YES**: a retirement plan for the replaced store must be included in the same prompt/PR.
- If **NO**: proof must be provided that the new store is genuinely a different domain.

---

### Rule 3: No Parallel Stores for the Same Domain

Two stores that answer the same question about the same domain are not permitted.
If a temporary store is created (e.g. as a prototype), it must have a named
retirement condition in the same document that created it.

---

### Rule 4: No Identical File Copies

If a module is needed in both server and client, it must be moved to `shared/`
and imported from there. Copying a file and adding "identical copy of X" is
not a valid solution — it creates a maintenance trap.

> **Applies immediately to:** `client/src/lib/dietRules.ts`

---

### Rule 5: Consumers Must Read from the Authoritative Source

No consumer is permitted to read domain data from a non-authoritative source
once the authoritative source exists and is reachable.

Exceptions require explicit written justification in the relevant investigation
document, naming the blocked technical dependency.

---

### Rule 6: Static Client Files Are Not Knowledge Stores

Client-side `.ts` files containing data maps (like `LIBRARY: NutritionBenefit[]`
or `PANTRY_KNOWLEDGE: Record<string, PantryKnowledge>`) are not authoritative
knowledge stores. They are read-only display fragments appropriate only during
prototype phases.

Any data that:
- Overlaps with content in the WS0 Knowledge Registry, OR
- Will need to grow beyond 20–30 entries, OR
- Will need to be enriched or corrected after launch

...must live in the database, not in a client file.

---

### Rule 7: The SoT Register Must Be Updated at Every Workspace

Before any new workspace (WSN) is considered complete, the lead investigation
document for that workspace must include a section:

```
DOMAIN IMPACT
Which domains does this workspace touch?
Does it create a new store? [YES/NO]
Does it retire an existing store? [YES/NO]
Does it introduce a consumer? Which source does it read from?
Is that source the declared SoT?
```

If any answer is YES/NO and creates a duplication, the workspace is incomplete.

---

### Rule 8: Governance Review Before Any New Knowledge Store

Before any new table, file, or module that stores editorial knowledge data is
created, a governance check must be performed:

1. Is there an existing store for this domain? (Check this register.)
2. If yes: why is the existing store insufficient?
3. If the existing store is insufficient: what is the retirement plan?

This check must be documented in the investigation document.

---

## PHASE 7 — LAUNCH RISK REVIEW

| Domain | Risk | Reason |
|--------|------|--------|
| Food Knowledge — three stores active | 🔴 Launch Risk | User sees different nutrient descriptions of the same food across surfaces (PlantDiversity vs Pantry vs Explore). Undermines trust. Directly visible. |
| Dietary Rules — duplicate files | 🟡 Important | Silent split-brain risk if dietary keyword changes are made to one file but not the other. Not currently visible but inevitable. |
| Plant Diversity — two counting mechanisms | 🟡 Important | An ingredient could be counted in the 30-plants counter (nutrition-variety.ts) but produce no data in the Food Report (not in canonical). Visible inconsistency. |
| Dietary Preferences — two storage locations | 🟢 Safe | Currently no live split-brain. Risk is future, not present. |

---

### Launch Risk Detail: Food Knowledge

**Why this is 🔴:**

In a single user session it is possible to see:

1. Pantry inventory row → `pantry-knowledge.ts`: _"Chickpeas: high in soluble fibre, good source of plant protein"_
2. Plant Diversity Report → `nutrition-benefit-library.ts`: _"Chickpeas: High in plant protein and fibre. Counts towards weekly plant diversity."_
3. Pantry Explore → WS0 Registry (via API): _"Chickpeas: Versatile legumes high in fibre and plant protein"_

Three different phrasings. Consistent topic — but inconsistent language. A user
who reads all three will notice. A user who trusts THA will wonder which is "right".

---

## PHASE 8 — MIGRATION ROADMAP

**NOTE: This is a plan only. No implementation is authorised by this document.**

---

### Migration M1: Retire `nutrition-benefit-library.ts`

| Step | Description |
|------|-------------|
| 1. Target architecture | All boost ingredient display reads from WS0 Knowledge Registry via `nutrition-knowledge-registry.ts` or a new client-accessible endpoint |
| 2. Migration approach | Add a `GET /api/knowledge/foods/:slug` response path for the 25 boost ingredients; update `MealUpliftPanel.tsx` and `PlantDiversityReport.tsx` to use the API or a shared adapter |
| 3. Verification | Compare WS0 output for each of the 25 foods against current library output; confirm no regressions in Boost panel or Plant Diversity |
| 4. Retirement | Delete `nutrition-benefit-library.ts`; remove all imports |
| Estimated prompts | 2–3 (adapter update, consumer updates, verification) |
| Effort | Low — the WS0 data already covers all 25 foods |
| Risk | Low — WS0 is already seeded and tested |

---

### Migration M2: Retire `pantry-knowledge.ts`

| Step | Description |
|------|-------------|
| 1. Target architecture | All pantry inventory knowledge reads from `pantryIngredientKnowledge` DB table; `pantry-knowledge.ts` content is seeded into that table |
| 2. Migration approach | (a) Write a one-time seed that inserts each `PANTRY_KNOWLEDGE` entry into `pantry_ingredient_knowledge` with `enrichmentSource='manual'` and `isLocked=true`; (b) Update `pantry-page.tsx` to call the existing `/api/pantry/ingredient-knowledge/:key` endpoint instead of importing the static file; (c) Update `health-benefits-model.ts` to read from the API |
| 3. Verification | For each of the ~50 pantry ingredients, confirm DB row matches static file content |
| 4. Retirement | Delete `pantry-knowledge.ts`; remove all imports |
| Estimated prompts | 3–4 (seed script, page updates, model updates, verification) |
| Effort | Medium — requires seed script, API wiring, client refactor |
| Risk | Medium — pantry-page.tsx is a high-traffic surface; requires careful regression testing |

---

### Migration M3: Move `dietRules.ts` to `shared/`

| Step | Description |
|------|-------------|
| 1. Target architecture | `shared/dietRules.ts` (single file, no Node.js dependencies) imported by both server and client |
| 2. Migration approach | Move `server/lib/dietRules.ts` to `shared/dietRules.ts`; update all imports on server and client; delete `client/src/lib/dietRules.ts` |
| 3. Verification | Run all diet-related tests; verify server and client use identical logic |
| 4. Retirement | `client/src/lib/dietRules.ts` deleted; `server/lib/dietRules.ts` deleted |
| Estimated prompts | 1 (straightforward file move + import update) |
| Effort | Very low |
| Risk | Low — pure refactor, no logic change |

---

### Migration M4: Replace `nutrition-variety.ts` Plant Counting with Canonical

| Step | Description |
|------|-------------|
| 1. Target architecture | 30-plants counter derives plant status from WS2A `diversity_group` table (via API or shared seed) |
| 2. Migration approach | (a) Expose a `GET /api/canonical/plants` endpoint returning all slugs with diversityGroupSlug != null; (b) Client caches this at session start; (c) Replace nutrition-variety.ts word-list matching with canonical slug lookup after normalization |
| 3. Verification | Test each ingredient currently counted in 30-plants against new canonical lookup; ensure no regressions in counter or category display |
| 4. Retirement | Delete `nutrition-variety.ts`; remove all imports |
| Estimated prompts | 4–5 (API endpoint, normalization bridge, client refactor, verification) |
| Effort | Medium-High — the normalization bridge (raw string → canonical slug) is the hard part |
| Risk | Medium — 30-plants is a prominent launch feature; any regression is visible |

---

## FINAL QUESTION

**Can THA truthfully state: "Every core domain has a single source of truth"?**

## NO.

---

### Exceptions Ordered by Risk

| # | Domain | Duplication | Risk |
|---|--------|-------------|------|
| 1 | Food Knowledge (Nutrition) | nutrition-benefit-library.ts + pantry-knowledge.ts + WS0 Registry (+ pantryIngredientKnowledge DB) | 🔴 LAUNCH RISK |
| 2 | Plant Diversity Counting | nutrition-variety.ts (keyword) vs diversity_group DB (canonical) | 🟡 IMPORTANT |
| 3 | Dietary Rules | server/lib/dietRules.ts + client/src/lib/dietRules.ts (identical copy) | 🟡 IMPORTANT |
| 4 | Dietary Preferences (User) | ~~`users.dietPattern`/`dietRestrictions` shadowing `household_eaters`~~ — **✅ CONVERGED 2026-07-16 (`CONV1 P4`)**: columns dropped, bridge deleted, `household_eaters` is the one owner | ✅ **RESOLVED** — *corrected 2026-07-16 (`DOC-1`); was "🟢 SAFE (for now)", assessed against the wrong pair (Phase 3, Duplication 4); converged the same day* |

---

## DEFINITION OF DONE — VERIFICATION

| Requirement | Status |
|-------------|--------|
| Complete domain inventory | ✅ 27 domains identified |
| Source of Truth Register created | ✅ All 27 domains declared |
| Duplicate systems identified | ✅ 4 duplications found |
| Consumer compliance audit completed | ✅ See Phase 5 |
| Retirement register completed | ✅ 7 systems assessed |
| Governance rules defined | ✅ 8 rules defined (Phase 6) |
| Launch risks identified | ✅ 1 red, 2 yellow, 1 green |
| Migration roadmap created | ✅ 4 migrations defined (Phase 8) |

---

## APPENDIX A — QUICK REFERENCE: AUTHORITATIVE SOURCES

| Domain | Source of Truth |
|--------|----------------|
| Food Knowledge (Nutrition) | `shared/knowledge/` → DB `knowledge_*` tables via `nutrition-knowledge-registry.ts` |
| Canonical Food Identity | `shared/canonical/foods.ts` → DB `canonical_food`, `food_variety`, `canonical_food_alias` |
| Food Relationships | `shared/relationships/food-graph.ts` |
| Plant Diversity | `shared/canonical/diversity-groups.ts` → DB `diversity_group`; one group = one plant, via `plantDiversityGroup()` |
| Dietary Restrictions | `shared/restrictions/restriction-library.ts` |
| Dietary Rules (pattern) | **`shared/dietRules.ts`** — one module, imported by both server and client. **⚠️ Domain 6's Status still reads "Contested"**: that contest was `server/lib/dietRules.ts` vs an identical `client/src/lib/dietRules.ts`, and **neither file exists today** — Migration M3 (Phase 8) is complete. Resolving the Status is an ownership act; see Domain 6. *Corrected 2026-07-16 (`DOC-5`); this row previously read* `server/lib/dietRules.ts` ← **duplicated in client** — *a path and a duplicate that are both gone* |
| Dietary Preferences (user) | **DB `household_eaters`** (Domain 7 → Domain 16; Principle 2). **✅ Converged 2026-07-16 (`CONV1 P4`)** — the shadow columns are dropped; the owner is the live location. *Corrected 2026-07-16 (`DOC-1`); this row previously declared the shadow, unqualified* |
| Discovery | `shared/discovery/engine.ts` |
| Alternatives | `shared/alternatives/engine.ts` |
| Stories | `shared/stories/engine.ts` |
| Seasonal Stories | `shared/seasonal/engine.ts` (the season **rule**: `shared/seasonal/season-rule.ts` — `CONV1 P5` / `OWN-3`) |
| Meal Identity | DB `meals` table |
| Meal Templates | DB `meal_templates` |
| Planner State | DB `planner_weeks`, `planner_days`, `planner_entries` |
| Shopping State | DB `shopping_list`, `shopping_list_extras` |
| Household Profiles | DB `households`, `household_members`, `household_eaters` |
| Nutrition Boost Rules | `server/lib/uplift-rules.ts` |
| Nutrition Boost Display | ← **CONTESTED: retire nutrition-benefit-library.ts → use WS0** |
| Product Analysis | `server/lib/product-analysis.ts` + `server/lib/upf-analysis-service.ts` |
| Food Additive Knowledge | DB `food_knowledge` table |
| Diary | DB `food_diary_days`, `food_diary_entries`, `food_diary_metrics` |
| Plant Diversity Report | ← **CONTESTED: retire nutrition-variety.ts → use diversity_group** |
| Food Report (Nutrition) | `shared/canonical/food-report-adapter.ts` (reads WS2A + WS0) |
| Ingredient Catalogue | `shared/catalogue/` → DB `ingredient_classifications` |
| Ingredient Normalization | `server/lib/ingredient-normalization-service.ts` |
| Membership | DB `users.subscriptionTier` column |
| User Preferences | DB `user_preferences` table |
| Pantry State (what the household has in the house) | **DB `user_pantry_items`**, owned by `server/storage.ts` — the only writer; read via `storage.getPantryItems()`, and via the INT8 narrow port `pantry-read-port.ts` from the Intelligence side (Domain 30, declared `OWN-5` 2026-07-16). **Scoped per-household on `household_id`**; `user_id` is the authoring member, never the access scope. **Owns no food ageing** — no expiry, no purchase date, no shelf life; the only temporal column is the row's `created_at`. ⚠️ **Two Rule 5 defects recorded at declaration** — `product-event-logger.ts:112` reads the table directly *and by the wrong scope*; the fixture seeders delete directly because the store exposes no reset method (Domain 30) |
| Evidence & Learning (household outcomes, and confirmed patterns over them) | **DB `household_evidence_events`** (append-only) + **`household_learning_signals`** (derived, re-evaluated in place), owned by `server/intelligence/evidence-learning/evidence-learning-store.ts`; detection is pure and deterministic in `framework.ts` — no ML, no LLM (EL1, 2026-07-03 — Domain 31, declared `OWN-5` 2026-07-16). Evidence enters through **one door** (Rule EL2, `household-observation.ts`). A decided signal is never relitigated — `status` is unwritable by `upsertSignal`, by construction. **The 90-day constant is a detection window, not a retention rule.** ⚠️ **The store's own "no other module reads or writes these tables directly" claim is false — seven direct-access sites, including the verifier `publication-register.ts:1298`** (Domain 31) |
| Platform Observations (operator telemetry: what the platform did) | **DB `platform_observations`**, **sole-owned by** `server/intelligence/observation/observation-store.ts` — verified, zero access outside it. Closed 14-kind vocabulary in `observation-engine.ts`; bounded window (30 days / 50,000 rows, opportunistically pruned), **never an archive** (OBS1, 2026-07-08 — Domain 32, declared `OWN-5` 2026-07-16; governance: [`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`](./THA_OBSERVATION_ENGINE_ARCHITECTURE.md)). **Nothing may read an observation back into behaviour** (§ 7 there) — the prohibition `HT16` and Household Time § 8.1 both rest on, and the reason `OBS_DISABLE_CAPTURE=1` must remain a functional no-op. ⚠️ The doc says thirteen kinds; the code declares fourteen — `delivery-decision` (DEC1) is documented in the Decision Engine architecture instead (Domain 32) |
| Benchmark World (the ten authored Benchmark Households; scored runs) | **`server/benchmark/world-fixtures.ts`** (the authored households) + **`docs/intelligence/benchmark/history/`** (append-only scored-run artefacts **on the filesystem**) — Domain 33, declared `OWN-5` 2026-07-16. **No DB owner: this domain owns no table**, which corrects `CPI1:173`'s "three live, table-owning domains" as it applies to Benchmarks (Domain 33). Its only DB footprint is the `benchmark-run` kind inside Domain 32's table. The seeder writes exclusively through other domains' existing owners. **DEV-only and admin-gated**, and `test-benchmark-no-production-branch.ts` enforces that **the platform contains no benchmark-aware behaviour** |
| Attention Vocabulary (levels, rank, labels, `critical` allowlist) | `shared/attention/index.ts` (ATTN1, 2026-07-09 — reference vocabulary per Principle 5; replaced the three module-local priority unions/rank maps in FI4, OD1 and the Notice Engine; no DB owner — `opportunity_deliveries.priority` remains a non-authoritative snapshot) |
| Decision mechanics (attention ordering, delivery budget clamp, id dedupe, `EvidenceCitation`) | `shared/attention/decision.ts` (DEC1, 2026-07-09 — reference mechanics per Principle 5; replaced the three module-local sort/clamp/dedupe/evidence copies in FI4, OD1 and the Notice Engine, golden-identity tested byte-identical) |
| Decision Engine (ambient surfacing: eligibility, muting, lifecycle suppression, learning re-weight, rank, budget, surface routing, sealed `DeliveryDecision`) | `server/intelligence/opportunity-delivery/framework.ts` (OD1 framework, designated canonical by DEC1 2026-07-09 — governance: `THA_DECISION_ENGINE_ARCHITECTURE.md`; the decision record is a `delivery-decision` observation, never a table, and nothing reads it back) |
| Household Time (time zone, today, phase of day, calendar week, planner-week resolution) | `shared/time/household-time.ts` (TIME3, 2026-07-16 — reference vocabulary and mechanics per Principle 5, the class ATTN1 and DEC1 occupy; governance: [`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`](./THA_HOUSEHOLD_TIME_ARCHITECTURE.md); **no DB owner** — it owns the *rules* of household time and **none of its data**. The two facts live with their existing owners: `households.timeZone` (Domain 16) and `planner_weeks.weekStartDate` (Domain 14); no new domain, no new store, no new write funnel. Retires five rival "current week" implementations, nineteen week-shape declarations across sixteen files, four `getGreeting()` copies, three season implementations and two fabricated-date builders — the full list is the architecture's § 14. **✅ BUILT — 2026-07-17 (`CONV1 P5` / `OWN-4`).** *This row previously read "**⚠️ DECLARED, NOT BUILT: the module does not exist**", which was correct from 2026-07-16 until the module landed.* The module exists, is pure and zero-I/O, and reads no clock (`now` is a parameter — HT5); its HT18 verification entry landed **in the same change** (`server/verification/publication-register.ts`, domain `household-time` — 🟢 healthy, now **15 checks** after `CONV1 P6` added two, `CONV1 P7` three and `CONV1 P8` three, every one mutation-tested), which is what CPuBA5 and CP10 require: *a convergence is finished when a gate can fail*. **BOTH FACTS ARE NOW BUILT: `households.timeZone` (Domain 16 — `CONV1 P5` / `SCH-1`) and `planner_weeks.weekStartDate` (Domain 14 — `CONV1 P7` / `SCH-2`, 2026-07-17), both nullable, additive and never back-filled. The declaration is fully discharged.** *(This sentence previously read "`planner_weeks.weekStartDate` is NOT — it remains Phase 4" — corrected in the same change that made it false.)* `resolvePlannerWeek` still returns `anchored: false` for **every household that was already planning** — the 1,152 weeks that existed when the anchor landed hold `NULL` forever (HT7) — which is the honest floor and not a defect. Only weeks created from P7 onward carry an anchor. **The retirement list is substantially discharged** *(this sentence previously read "**is only begun** … no consumer has converged yet")*: the three season implementations are one (`OWN-3`, P5), and **`CONV1 P6` converged the T2/T3 consumers on 2026-07-17** — the Companion's anchor, the freezer, the diary and the four `getGreeting()` copies (§ 14 targets 3, 7, 8). **`CONV1 P8` converged the T5 consumers on 2026-07-17**: the five rival "current weeks" are **one** (`READ-3`), `planner:active-week` is no longer a household fact (`OWN-6`), every Home card resolves from one canonical planner state (`BEH-3`), and Home's door is HOME2's resolver's (`BEH-9` — its first production consumer). **`R3` is closed for the anchor as it was for the module.** **Still live:** the fabricated-date builders (`BEH-5` — `CONV1 P9`, reachable for the first time), the Monday-week implementations including `user_streaks`' sixth private week, and most of the nineteen week-shapes (`MONDAY_FIRST_ORDER` gained its first consumer in P8). *(This previously read "not one of them reads it yet" — corrected when they did.)* **The gate is 15 checks**, every P8 ratchet mutation-tested) |

---

## APPENDIX B — SYSTEMS IDENTIFIED AS PROTOTYPES NOW NEEDING RETIREMENT

These existed for valid reasons at time of creation. They should not be extended.
Retirement is the correct path.

1. `client/src/lib/nutrition-benefit-library.ts` — 2026-06 prototype, pre-WS0
2. `client/src/lib/pantry-knowledge.ts` — 2026-06 prototype, pre-pantryIngredientKnowledge
3. `client/src/lib/nutrition-variety.ts` — 2026-06 prototype, pre-WS2A canonical
4. `client/src/lib/dietRules.ts` — copy of server file, pre-shared/ modularisation

---

## APPENDIX C — GOVERNANCE CHECKLIST FOR FUTURE INVESTIGATIONS

Copy this into any investigation document that introduces a new data store or
consumes domain data:

```
GOVERNANCE GATE
===============

Domain affected: [name]
Declared SoT: [file path or DB table]
New store created? YES / NO
  If YES: retirement plan for any replaced store: [plan or N/A]
Existing store extended? YES / NO
Consumer created? YES / NO
  If YES: reads from declared SoT? YES / NO
    If NO: blocked by: [technical dependency]
          Resolution plan: [plan]
```

---

*No code was changed in the production of this document.*
*All findings are based on reading the current state of the codebase.*
*Rollback: `git checkout rollback/source-of-truth-register-20260623`*
