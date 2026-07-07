# FI5 — Household Nutrition Intelligence — Implementation

**Date:** 2026-07-06
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Additive composition over an already-registered, already-tested Domain Intelligence service (`resolveHouseholdSignal`, FI3/FI4). No new capability, no new store, no schema change, no new route. Blast radius is scoped to Companion food-answer enrichment on the turns where `nutrition-knowledge` already succeeded this turn.

**Note on numbering:** `FI5` is already in use in this repo for a distinct, unrelated workstream (`docs/implementation/FI5_FOOD_INTELLIGENCE_UI_ACTIVATION.md`, 2026-07-03). This is consistent with existing practice here — `FI1`, `FI2`, `FI3` and `FI4` are each already reused across multiple, differently-titled documents — so this document keeps the requested filename and is disambiguated by title, not number.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Working tree already dirty with substantial prior uncommitted work on this branch (INTQ4–INTQ10, EL1, EWO1/EWO2, EWX1, CP1/CP1A/CP1B, FI5-UI-Activation, PKC1–5, FI1–FI4, PLATFORM_RESILIENCE, etc. — pre-existing, unrelated to this task) |
| HEAD at start | `d63d7cd1b9c4a917d36880eb4399ae35e03d781c` |
| Rollback tag | `rollback/before-fi5-household-nutrition-intelligence-20260706` → `d63d7cd` |
| This task's writes | `server/intelligence/conversation/household-nutrition-enrichment.ts` (new), `server/intelligence/conversation/nutrition-enrichment.ts` (export `extractFoodRef`/`FoodRef`, no behaviour change), `server/intelligence/conversation/conversation-gateway.ts` (thread `userId` into `buildGroundedResponse`, compose the new enrichment source), `server/tests/test-household-nutrition-enrichment.ts` (new), `package.json` (one new test script + chain entry), `docs/implementation/FI5_HOUSEHOLD_NUTRITION_INTELLIGENCE_IMPLEMENTATION.md` (this file) |
| Rollback to committed state | `git checkout rollback/before-fi5-household-nutrition-intelligence-20260706 -- <path>` for any file above, or delete the two new files and revert the additive edits (each is independently revertible — nothing outside this task's own files reads its new exports yet) |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (Rule FI1 — enrichment, not ownership; §3.1 enrichment map; §5 trust rules, esp. Rule GO1)
- [x] `docs/architecture/capabilities/household.md` (canonical Household Capability Card)
- [x] `server/intelligence/food-intelligence/engine.ts` (FI3 — `resolveHouseholdSignal`, the exact existing service reused here)
- [x] `server/intelligence/food-intelligence/opportunity-engine.ts` (FI4 — confirms `resolveHouseholdSignal` is already a shared, reused seam, not a private read)
- [x] `server/intelligence/conversation/nutrition-enrichment.ts` (NUT1/FI3 — the sibling enrichment source this module is modelled on)
- [x] `server/intelligence/conversation/conversation-gateway.ts` (the single wiring point every enrichment source is composed at)
- [x] `server/intelligence/handlers/household-read-port.ts`, `server/intelligence/pattern-intent-resolver.ts` (confirmed `household`/`planner` are already-registered, already-executable capabilities; confirmed why the resolver's `MAX_INTENTS = 4` per-turn latency budget was NOT touched — see Decisions below)

---

## MISSION

Personalise Companion food answers using **existing** household, planner and nutrition data. Do not add new food knowledge. Do not change Food Intelligence ownership. Do not add schema or capabilities.

---

## DECISIONS (why this shape, not another)

1. **Reuse `resolveHouseholdSignal`, don't add a new read path.** `server/intelligence/food-intelligence/engine.ts` already joins household eaters (hard restrictions) + planner history (`fetchHouseholdPlannerFoods`) into one `HouseholdSignal`, and it is already shared by two independent consumers (FI3's engine, FI4's opportunity engine). A third consumer is evolution, not duplication (Architecture Principle 8) — no new join, no new query shape, no new owner.

2. **Do not add `household`/`planner` to the pattern-intent-resolver's always-on baseline (alongside `profile`).** This was considered and rejected: `MAX_INTENTS = 4` is a named, documented per-turn latency budget (INT18). `profile` already occupies one baseline slot; adding two more baseline entries on *every* turn (not just food turns) would risk evicting a genuinely-matched capability from a busy compound turn, and would add two DB reads to every Companion turn platform-wide (weather-adjacent shopping questions, planner questions, etc.) for a mission scoped to *food* answers specifically. Instead, the new enrichment fires only after `nutrition-knowledge` has already succeeded this turn — the same gating discipline `nutrition-enrichment.ts` (NUT1) already established — so the extra read only happens on the turns it is actually relevant to.

3. **"Household goals" is explicitly out of scope, not silently dropped.** No household-level goals store exists (`households` table has no goal column; per-user `userPreferences.healthGoals`/`goalType` exist but are user-scoped, not household-scoped). The Food Intelligence Platform Architecture's own Rule GO1 ("Goals are aliases, never authorities — a goal resolves into the canonical chain") requires a Goals capability with a real alias-resolution chain before a goal can be safely matched to a food; that capability is named as future work (§7.2) and is not built. Inferring a goal↔food connection here without that resolution chain would be exactly the fabrication Rule GO1/E1 forbid. See Scope Lock.

4. **Two insights, not one, and each traces to a different existing owner:**
   - **Planner/variety insight** — from `HouseholdSignal.familiarAppearances` (planner history, SoT D14, via `fetchHouseholdPlannerFoods`, already read by `resolveHouseholdSignal`). Tells the household whether the discussed food is already part of their rotation, and how large that rotation is.
   - **Household safety/dietary-preference insight** — from `HouseholdSignal.restrictionDefs` (household eaters' hard restrictions, SoT D16, via the household read port, already read by `resolveHouseholdSignal`), run through the exact same `resolveIngredientRestrictions` check the Food Intelligence Engine's own Rule T0 safety filter already uses. This is a genuinely different fact from `nutrition-enrichment.ts`'s existing personal-relevance check (the caller's own `users.dietPattern`/`dietRestrictions`) — that check is single-user profile data; this one is household-wide, multi-eater hard-restriction data. Neither duplicates the other's ownership.

5. **Injectable household-signal resolver, mirroring the codebase's existing DI discipline.** `buildHouseholdNutritionEnrichment` takes an optional `resolveSignal` parameter (default: the real `resolveHouseholdSignal`) — the same pattern `HandleIntentFn`/`ILlmProvider`/`IIntentResolver` already use — so tests can inject a fabricated `HouseholdSignal` without a live database, and the pure reasoning (`composeHouseholdNutritionEnrichment`) is independently unit-testable.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
☑ One canonical identity
  No new entity. Every fact keys on identities that already exist: canonical
  food slug (nutrition-knowledge), household id (Household capability),
  restriction definition id (shared/restrictions).

☑ One owner per fact
  Planner familiarity stays owned by planner_entries/planner_days/planner_weeks
  (read via the existing fetchHouseholdPlannerFoods). Household hard
  restrictions stay owned by household_eaters (read via the existing
  household read port). This module computes nothing new — it composes two
  already-owned facts for one turn's answer, exactly as nutrition-enrichment.ts
  already composes nutrition-knowledge + profile facts.

☑ No duplicate entities
  No new entity introduced.

☑ No duplicate ownership
  The household safety check reuses resolveIngredientRestrictions — the SAME
  function the Food Intelligence Engine's Rule T0 filter already calls. It is
  not re-implemented here.

☑ No duplicate state
  No new state is stored anywhere. This module is a pure read-time
  composition; nothing is persisted.

☑ Extends existing architecture
  Extends the exact pattern nutrition-enrichment.ts (NUT1/FI3) established —
  a second, narrowly-scoped enrichment source composed at the gateway — and
  reuses the exact service (resolveHouseholdSignal) FI3/FI4 already share.

☑ Progressive enrichment where appropriate
  Every item is independently optional: no household → []; household with no
  planner history → no variety item; no active hard restriction → no safety
  item. Absence is silent, never a fabricated default.

☑ Honest gaps over fabricated information
  A caller with no resolvable household yields []. A food that does not
  conflict with any household restriction yields no safety item (never a
  fabricated "this is fine for your household" claim — see Trust Check).

☑ No permanent synchronisation bridge
  Read-only, per-turn, no caching, no bridge.

☑ Evolution over replacement
  Nothing is replaced. resolveHouseholdSignal, fetchHouseholdPlannerFoods,
  resolveIngredientRestrictions, and the household read port are all reused
  verbatim, unmodified.
```

---

## AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform — composed at conversation-gateway.ts,
  the platform's one wiring point; no second assistant, no side channel.
✓ Uses the Capability Registry — reads only data already exposed through the
  registered `household` capability's own owning services (via the read port
  FI3/FI4 already share); no capability bypass.
✓ Uses the Intent Engine — the underlying reads still flow through the same
  Household-domain read port the `household` capability's own handler is
  built on; no private storage access.
✓ Reuses existing business services — resolveHouseholdSignal,
  fetchHouseholdPlannerFoods, resolveIngredientRestrictions, all unmodified.
✓ Does not create another assistant — this is a deterministic composition
  function, no LLM call, called once per turn from the one gateway.
✓ Does not duplicate conversation state — nothing persisted.
✓ Uses registered capabilities only — household + nutrition-knowledge, both
  already registered and already executable.
✓ Uses permission-aware access — resolveHouseholdSignal resolves ONLY the
  caller's own household from their own userId (getHouseholdForUser); there
  is no id parameter anywhere in this path, so no cross-household read is
  possible by construction.
✓ Produces honest gaps rather than fabricated knowledge — see checklist above.
```

---

## PLATFORM QUALITY COMPLIANCE

```
☑ Security — no new route, no new permission surface. Reuses the household
  capability's own session-resolved authorization (getHouseholdForUser(userId)),
  never a client-suppliable household id.
☑ Privacy — household data (restrictions, planner history) never leaves the
  caller's own household boundary; no new retrieval path bypasses that scoping.
☑ Performance — bounded cost profile: at most one extra resolveHouseholdSignal
  call per turn, gated behind nutrition-knowledge already having succeeded
  this turn (not run on every Companion turn — see Decision 2).
☑ Observability — errors inside resolveHouseholdSignal are already caught
  there (falls back to NO_HOUSEHOLD_SIGNAL); this module adds no new
  swallowed-exception path of its own.
☑ Accessibility — output is CompanionEnrichmentItem, rendered through the
  platform's existing enrichment structural contract (title/body), no ad hoc
  markup.
☑ Trust — every claim traces to a real read (planner appearances count,
  matched restriction display name); gaps render as absence, never invented
  content.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Intelligence (Domain Intelligence layer) composing over
  Household (SoT D16) and Planner (SoT D14)
Declared SoT: household_eaters / households (D16), planner_entries/days/weeks (D14)
  — both unchanged, both still owned by their existing Business Domain services
New store created? NO
Existing store extended? NO
Consumer created? YES — a third consumer of resolveHouseholdSignal (Companion
  food-answer enrichment), alongside the Food Intelligence Engine (FI3) and
  Food Opportunity Engine (FI4)
  reads from declared SoT? YES — via resolveHouseholdSignal, unmodified
```

---

## IMPLEMENTATION

### New file: `server/intelligence/conversation/household-nutrition-enrichment.ts`

A third, narrowly-scoped enrichment source alongside `companion-enrichment.ts` (INT41, static per-capability copy) and `nutrition-enrichment.ts` (NUT1/FI3, personal profile relevance). Where `nutrition-enrichment.ts` personalises a food answer against the caller's own stated profile, this module personalises it against the caller's **household**:

1. **Planner/variety insight** (`buildVarietyInsight`) — reads `HouseholdSignal.familiarAppearances` (already computed by `resolveHouseholdSignal` from planner history). If the discussed food has planner appearances, surfaces "already part of your rotation" with the appearance count and the household's total planned-food variety count. If the household has planning history but has never planned this food, surfaces "new to your household" framing instead. If the household has no planner history at all, yields nothing (honest gap — there is nothing true to say).

2. **Household safety/dietary-preference insight** (`buildHouseholdSafetyInsight`) — reads `HouseholdSignal.restrictionDefs` (household eaters' active hard restrictions) and runs the food's compliance text through `resolveIngredientRestrictions` — the exact function the Food Intelligence Engine's own Rule T0 safety filter already uses. A genuine conflict names the restriction (e.g. "Gluten") without naming which household member holds it. No conflict yields nothing — never a fabricated "this is fine" claim.

Both are pure functions over an already-resolved `HouseholdSignal`, fully unit-testable without I/O. The one async entry point, `buildHouseholdNutritionEnrichment`, takes an injectable `resolveSignal` parameter (default: the real `resolveHouseholdSignal`) so tests inject a fabricated signal.

### Modified: `server/intelligence/conversation/nutrition-enrichment.ts`

`extractFoodRef` and `FoodRef` are exported (previously module-private) so the new module reuses the identical food-reference extraction logic rather than re-implementing it — one owner of "how to read a food out of a nutrition-knowledge result," shared by both enrichment sources. No behavioural change.

### Modified: `server/intelligence/conversation/conversation-gateway.ts`

- `buildGroundedResponse` gains a `userId: number` parameter (threaded from `processUserTurn`, which already receives it).
- After the existing `nutritionEnrichment` composition, `buildHouseholdNutritionEnrichment(queryResults.get("nutrition-knowledge"), userId)` is awaited and concatenated into the same `enrichment` array before the existing `MAX_ENRICHMENT_ITEMS` cap is applied — no change to the cap or its precedence rules.

### New file: `server/tests/test-household-nutrition-enrichment.ts`

Unit tests for the pure composition functions (fabricated `HouseholdSignal` fixtures, no database) plus a gateway-wiring test (injecting a stub `resolveSignal`) confirming the item appears on a real turn, is capped correctly, and is absent on an unsuccessful turn or when no household resolves.

### `package.json`

One new script, `test:household-nutrition-enrichment`, added to both its own entry and the `test` chain (placed next to `test:nutrition-enrichment`, its sibling).

---

## DEFINITION OF DONE

**What success looks like:** a Companion food question (e.g. "Why is kale healthy?") from an authenticated user with a household that has planner history returns, in `TurnResult.enrichment`, an additional household-aware item — either a planner-familiarity/variety insight or a household safety insight — whenever one is genuinely grounded, with no change to the wording or grounding of any existing enrichment source.

**What must not break:** every existing test suite (`npm test`), the existing `nutrition-enrichment.ts`/`companion-enrichment.ts` behaviour and their own tests, the `MAX_ENRICHMENT_ITEMS = 3` cap, the `MAX_INTENTS = 4` per-turn resolver budget (untouched), and `npx tsc --noEmit`.

**Manual test steps (validated below, §Validation Performed):**
1. A food already in the household's planner rotation → "already part of your rotation" variety insight naming the real appearance/variety counts.
2. A food never planned by the household → "new to your household" variety insight.
3. A food that conflicts with a real household hard restriction → household safety insight, restriction named, no member named.
4. A caller with no household, or a household with no genuine conflict/history → no household-nutrition enrichment items (honest gap, not an error).
5. `npm test` — all suites, including the two new/modified ones, pass.

---

## VALIDATION PERFORMED

Run against this environment's live database (not a stub) via a scratch script calling `resolveHouseholdSignal` and `buildHouseholdNutritionEnrichment` directly with real household ids, then deleted (no artifact left behind). Household ids and planner facts below are genuine rows read at validation time.

**Household 44 (owner user 1, 11 distinct planned foods, restriction: Gluten) — food "spinach" (7 planner appearances):**
```json
{
  "sourceDomain": "planner", "sourceCapabilityId": "planner", "kind": "insight",
  "title": "Already part of your rotation",
  "body": "Your household has planned spinach 7 times before — one of 11 different foods you've planned so far."
}
```

**Same household — food "Kumquat" (never planned):**
```json
{
  "sourceDomain": "planner", "sourceCapabilityId": "planner", "kind": "insight",
  "title": "New to your household",
  "body": "Your household hasn't planned Kumquat yet — trying it would add to the 11 different foods you already cook with."
}
```

**Household 183 (27 distinct planned foods, hard restrictions: Dairy, Eggs) — food "Cheddar Cheese" (never planned, genuinely conflicts):**
```json
[
  {
    "sourceDomain": "planner", "sourceCapabilityId": "planner", "kind": "insight",
    "title": "New to your household",
    "body": "Your household hasn't planned Cheddar Cheese yet — trying it would add to the 27 different foods you already cook with."
  },
  {
    "sourceDomain": "household", "sourceCapabilityId": "household", "kind": "insight",
    "title": "Worth checking against your household",
    "body": "Cheddar Cheese may conflict with a restriction set for your household (Dairy) — worth double-checking before relying on it for shared meals."
  }
]
```

**Same household — food "Kale" (already planned once, no conflict):**
```json
{
  "sourceDomain": "planner", "sourceCapabilityId": "planner", "kind": "insight",
  "title": "Already part of your rotation",
  "body": "Your household has planned Kale 1 time before — one of 27 different foods you've planned so far."
}
```
No safety item is present for Kale — confirms the check is a genuine conflict test, not a blanket "you have restrictions" notice.

**Test suites:** `npm run test:household-nutrition-enrichment` (22/22), `npm run test:nutrition-enrichment` (33/33, unchanged behaviour confirmed against the pre-this-task baseline), `npm run test:intelligence-companion-enrichment` (26/26), `npm run test:intelligence-food-intelligence-binding` (36/36), `npm run test:intelligence-food-opportunity-binding` (53/53), `npm run test:intelligence-household-binding` (51/51), `npm run test:intelligence-planner-binding` (31/31), `npm run test:intelligence-profile-binding` (50/50) — all pass. `npx tsc --noEmit` introduces zero new errors (all pre-existing errors are in unrelated files this task never touched, confirmed by diffing the error set against a stash of this task's changes).

**Regression caught and fixed during validation:** the variety insight was initially attributed `sourceDomain: "nutrition"` / `sourceCapabilityId: "nutrition-knowledge"` — identical to `nutrition-enrichment.ts`'s own personal-relevance item. Running the full `nutrition-enrichment.ts` test suite against this environment's live database (which has real households with planner history) surfaced a genuine collision: a test asserting "no personal-relevance item without a successful profile read" started failing because the new variety item satisfied the same `(kind, sourceCapabilityId)` check the test used to identify NUT1's own item. Fixed by attributing the variety insight to `sourceDomain: "planner"` / `sourceCapabilityId: "planner"` (its true owning domain — planner history, SoT D14) instead. Confirms the fix rather than papering over it: reran both suites clean afterwards.

---

## DATA IMPACT

- Reads existing data: **YES** — household eaters' hard restrictions (D16) and planner history (D14), both already read today by `resolveHouseholdSignal` for other consumers.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- **Could this mislead the user?** No — every sentence names a real count (appearance count, variety count) or a real matched restriction; nothing is inferred beyond what the read returns.
- **Could this fabricate certainty?** No — a food with no conflict yields silence, never a positive "this fits your household" claim (mirrors `nutrition-enrichment.ts`'s existing discipline of never asserting compliance, only surfacing real conflicts).
- **Is anything guessed but shown as real?** No. "Household goals" is explicitly excluded rather than guessed at (Decision 3).
- **What happens if the system is wrong?** `resolveHouseholdSignal` already degrades to `NO_HOUSEHOLD_SIGNAL` on any read failure (try/catch, established in FI3) — this module inherits that fallback and simply yields `[]`, never a crash or a fabricated household.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES**
- No runtime behaviour altered outside the two new enrichment items: **YES** — every existing enrichment source, capability, and route is untouched.

---

## ARCHITECTURE CONVERGENCE STATUS

```
Domain:
  Food Intelligence (Domain Intelligence layer) composing over Household (D16)
  and Planner (D14)

Current Canonical Owner:
  household_eaters / households (D16, Household-domain-owned);
  planner_entries/planner_days/planner_weeks (D14, Planner-domain-owned);
  both read exclusively through resolveHouseholdSignal (server/intelligence/
  food-intelligence/engine.ts), unmodified by this task.

Current Runtime Consumer(s):
  Food Intelligence Engine (FI3, engine.ts), Food Opportunity Engine (FI4,
  opportunity-engine.ts), and now Companion food-answer enrichment
  (this task, household-nutrition-enrichment.ts) — three consumers, one
  shared read path.

Duplicate Owners Remaining:
  NONE introduced by this task. Pre-existing duplicates named in
  THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §13 (nutrition-benefit-
  library.ts, pantry-knowledge.ts, nutrition-variety.ts) are unrelated to
  this task's domain (household/planner reads) and untouched.

Duplicate State Remaining:
  NONE.

Duplicate Workflows Remaining:
  NONE — the household safety check reuses resolveIngredientRestrictions
  rather than re-implementing a second restriction-matching workflow.

Current Convergence (%):
  100% for the specific facts this task reads (household hard restrictions,
  planner familiarity) — both already have exactly one owner and exactly one
  read path (resolveHouseholdSignal), now shared by a third consumer rather
  than re-derived a fourth time.

Target Convergence (%):
  100% (unchanged by this task).

Next Planned Milestone:
  N/A for this task's own domain slice. Broader Food Intelligence Engine
  build-out (Phase 1, THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §8)
  remains future work.

Remaining Architectural Risks:
  NONE new. The pre-existing risk that a future Goals capability could be
  built without the alias-resolution chain Rule GO1 requires is named in the
  governing architecture already (§7.2) and explicitly not addressed or
  worked around here (Decision 3).
```

---

## SCOPE LOCK

**Implemented scope:** two new, narrowly-scoped, deterministic Companion food-answer enrichment insights — household planner familiarity/variety, and household hard-restriction safety — composed at the Conversation Gateway from the existing, already-shared `resolveHouseholdSignal` service. New test file. No capability, schema, route, or store change.

**Explicitly excluded (out of scope — not implemented here):**
- **Household goals.** No household-level goals store exists; per-user `userPreferences.healthGoals`/`goalType` exist but are not household-scoped, and matching a free-text goal to a food without the Rule GO1 alias-resolution chain (an unbuilt Goals capability, §7.2) would be fabrication. Not attempted.
- **"Nutrition balance" scoring.** No macro/nutrient balance service exists anywhere in this codebase today (server or client) — confirmed by inspection. Inventing one is out of scope for an enrichment task and would itself be a new capability/store. Not attempted.
- **Current-week-only variety.** The only genuinely reusable, already-shared variety signal (`resolveHouseholdSignal.familiarAppearances`) is household-wide planning history, not calendar-week-scoped (the only week-scoped plant-count logic that exists today is inline in `server/routes.ts`'s `/api/home/intelligence` route, not an extracted reusable service). This task surfaces the honestly-available household-wide signal, correctly labelled, rather than fabricating week-scoping the codebase does not yet expose as a reusable read.
- **Adding `household`/`planner` to the pattern-intent-resolver's always-on baseline.** Considered and rejected — see Decision 2.
- Any change to `nutrition-enrichment.ts`'s existing personal-relevance logic, `companion-enrichment.ts`'s static enrichment, `MAX_ENRICHMENT_ITEMS`, or `MAX_INTENTS`.

**Suggestions (not implemented without approval):**
- Extracting the inline current-week plant-count logic in `server/routes.ts` (`/api/home/intelligence`, `/api/planner/weeks/:weekId/intelligence`) into a reusable, exported service would let a future task genuinely personalise by *this week's* variety rather than all-time household history.
- A genuine "nutrition balance" service (if ever built) would need its own EWO and governance review before any Companion enrichment could honestly cite it.
