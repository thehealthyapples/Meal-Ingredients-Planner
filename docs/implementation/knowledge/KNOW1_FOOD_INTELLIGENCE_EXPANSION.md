# KNOW1 — Food Intelligence Expansion — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Changes a canonical identity pointer, retires a WS0 knowledge food (with a DB migration that deletes rows), and expands the sourced-claim pack that governs what health content renders to users.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-know1-food-intelligence-expansion-20260709` → `efff2ae` |
| Working tree at start | Clean |
| This task's writes | `shared/knowledge/claim-sources.ts`, `shared/knowledge/foods.ts`, `shared/canonical/foods.ts`, `server/migrations/runner.ts`, `server/tests/test-knowledge-claim-coverage.ts` (new), `package.json`, correction notes in `docs/implementation/knowledge/PKC3_LAUNCH_KNOWLEDGE_WAVE_1_IMPLEMENTATION.md` + `docs/implementation/knowledge/PKC5_PLATFORM_KNOWLEDGE_FOUNDATIONS_VERIFICATION.md`, this document |
| Rollback to committed state | `git checkout rollback/before-know1-food-intelligence-expansion-20260709` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
- [x] `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (Rules KC8 / KC9, referenced via `evidence.ts`)
- [x] `server/intelligence/context/context-view.ts` (INT17 / NCV1 — read to decide §W4's non-action)

---

## SUMMARY

KNOW1 expands Food Intelligence **without building anything new**. Every change lands inside a structure that already existed.

Two things were wrong, and one thing was merely small:

1. **A canonical food resolved to nothing.** Canonical `yoghurt` pointed its `knowledgeFoodSlug` at `live-yogurt`, a duplicate WS0 knowledge food that a prior commit had already stripped of every nutrient and benefit. `buildFoodReport("yoghurt")` returned `keyNutrients: []`, `healthBenefits: []`. Two implementation records (PKC3, PKC5) assert this was fixed in July 2024's wave 1. It was not. (§W1)

2. **Ten of THA's fifteen health benefits could never render.** The sourced-claim pack cited only 21 of 68 editorial nutrient→benefit links, covering just the 5 launch benefits. The other 10 benefits held real editorial links but no citation, so the Layer-2 gate correctly hid them everywhere. (§W2)

3. **Nothing verified that a linked knowledge food still carried facts,** which is exactly why (1) survived a dedicated verification pass. (§W3)

KNOW1 repairs the identity, expands the claim pack to every benefit for which an **authorised EU claim actually exists** (12 of 15), leaves the remaining 3 as asserted honest gaps, and adds the missing verification. No new store, no new table, no new capability, no new assistant.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Entities: canonical food (slug, shared/canonical/foods.ts), knowledge food
  (slug, shared/knowledge/foods.ts), nutrient (slug), health benefit (slug).
  KNOW1 REMOVES a key-space violation: `live-yogurt` and `yoghurt` were two
  knowledge-food identities for one real food — asserted as such by `yoghurt`'s
  own alias list, which already claimed "live yoghurt". Now one.

☑ One owner per fact
  Yoghurt's nutrition facts had two candidate homes; one held them (FOOD_NUTRIENTS
  ["yoghurt"]) and the one the canonical spine pointed at held none. Now exactly
  one row owns them and the spine points at it. The claim pack (claim-sources.ts)
  owns citations only; NUTRIENT_BENEFITS (relationships.ts) remains the sole owner
  of which nutrient links to which benefit. A citation may never introduce a link —
  enforced by validateKnowledgeSeed() and re-asserted by the new test.

☑ No duplicate entities
  One entity is DELETED (`live-yogurt`). None is created.

☑ No duplicate ownership
  No attribute gains a second owner. `reviewed_at` remains owned solely by the
  human sign-off gate (server/seeds/signoff-knowledge-claims.ts); the seed writes
  it nowhere, asserted by test.

☑ No duplicate state
  No user state touched. This is Plane 1 (generic, household-agnostic) only.

☑ Extends existing architecture
  claim-sources.ts, the evidence gate (evidence.ts), the nutrient bridge
  (nutrition-knowledge-registry.ts), the seed validator, the migration runner and
  the existing test harness are all pre-existing. KNOW1 adds rows and one test file.

☑ Progressive enrichment where appropriate
  Knowledge entity. Enrichment follows identity → core → optional → runtime:
  the claim pack enriches EXISTING nutrient→benefit links with citations; it
  neither creates links nor publishes them (publication is the human gate).

☑ Honest gaps over fabricated information
  Three benefits (sleep-quality, blood-sugar-balance, anti-inflammatory-support)
  have editorial nutrient links but no authorised source anywhere in the EU
  Register. They stay uncited and therefore render nowhere. This is asserted by
  test, not merely intended: EXPECTED_HONEST_GAPS in test-knowledge-claim-coverage.ts
  fails if the set changes. Within lit benefits, individual nutrients that lack an
  authorised claim (beta-carotene→eye-health, lycopene→skin-health, live-cultures→
  digestive-comfort, and 20 others) also stay uncited.

☑ No permanent synchronisation bridge
  None. The nutrient bridge is a read-time JOIN over one owner's rows, not a
  synchronisation of two owners.

☑ Evolution over replacement
  `live-yogurt` is replaced by `yoghurt`, named, with a retirement plan executed in
  full: seed entry deleted, alias terms preserved, canonical pointer repointed,
  and migration `2026-07-09_know1_retire_live_yogurt_duplicate` deleting the row
  from any environment where it was already seeded (it is present in the live DB).
```

**Gate result: PASS.**

---

## AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform  — no platform change; the existing
  `nutrition-knowledge` and `food-intelligence` capabilities consume this data
  unchanged, through their existing read ports.
✓ Uses the Capability Registry              — no registration added or altered.
✓ Uses the Intent Engine                    — untouched.
✓ Reuses existing business services         — nutrition-knowledge-registry.ts is
                                              the sole reader; not modified.
✓ Does not create another assistant         — no conversational surface touched.
✓ Does not duplicate conversation state     — none touched.
✓ Uses registered capabilities only         — yes.
✓ Uses permission-aware access              — unchanged (knowledge is public-class).
✓ Produces honest gaps rather than fabricated knowledge
                                            — see §W2; 3 benefits and 23 nutrient
                                              links deliberately remain uncited.
```

**No check fails.**

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Knowledge (Plane 1 canonical knowledge)
Declared SoT:    shared/knowledge/ → DB knowledge_* via
                 server/services/nutrition-knowledge-registry.ts;
                 shared/canonical/ for food identity
New store created? NO
Existing store extended? YES
  - shared/knowledge/claim-sources.ts: +15 sourced claims (21 → 36)
  - shared/knowledge/foods.ts: −1 food (265 → 264), +3 preserved alias terms
  - shared/canonical/foods.ts: 1 knowledgeFoodSlug repointed
Consumer created? NO
  (one test added: server/tests/test-knowledge-claim-coverage.ts — reads seed only)
Retirement plan for replaced store: `live-yogurt` → `yoghurt`, executed in full
  (seed deletion + alias preservation + canonical repoint + DB migration).
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Intelligence — Plane 1 canonical knowledge (WS0 knowledge food identity +
  the nutrient↔benefit claim-evidence layer)

Current Canonical Owner:
  shared/knowledge/ (foods, nutrients, health-benefits, relationships,
  claim-sources) → DB knowledge_* via server/services/nutrition-knowledge-registry.ts.
  shared/canonical/foods.ts owns food identity and the knowledgeFoodSlug link.

Current Runtime Consumer(s):
  Pantry Explore (/api/knowledge/*), Food Report (food-report-adapter +
  food-report-evidence), Nutrition Centre (nutrition-centre-assembler / WX8),
  Simply Better (uplift-engine), meal-food-intelligence, Food Intelligence engine
  + opportunity engine, Companion nutrition-enrichment, `nutrition-knowledge` and
  `food-intelligence` capability bindings.

Duplicate Owners Remaining:
  1. knowledge_foods has a SECOND WRITER. The live DB holds 611 rows against
     FOOD_SEED's 264; ~347 foods (e.g. `allspice`, `wild-rice`, `porcini-mushrooms`)
     entered via the NK6P/KQ1 canonical-food import path, not this seed. Neither
     writer knows about the other. Pre-existing; NOT introduced or resolved here.
  2. `plant-protein` residue from the NK6M protein merge: the DB retains a
     knowledge_nutrients row plus 38 knowledge_food_nutrients links and 2
     knowledge_nutrient_benefits rows for a nutrient identity the seed no longer
     declares. Unreachable at runtime (the GOV2 resolver aliases plant-protein →
     protein) and unrenderable (0 sourceRefs), so it is dormant, not live.
     Pre-existing; NOT resolved here — see SUGGESTIONS.
  (M1/M2/M4 — nutrition-benefit-library.ts, pantry-knowledge.ts,
   nutrition-variety.ts — are ALL ALREADY DELETED. THA_FOOD_INTELLIGENCE_PLATFORM_
   ARCHITECTURE.md §13 still lists them as pending; that listing is stale.)

Duplicate State Remaining:
  NONE (no user state in scope)

Duplicate Workflows Remaining:
  NONE. Benefit rendering resolves through exactly one path — the nutrient bridge
  in getFoodBenefitsForDisplay().

Current Convergence (%):
  Knowledge-food identity: 100%. Evidence: 249 of 249 canonical foods carrying a
  knowledgeFoodSlug now resolve to a knowledge food that holds ≥1 nutrient or
  benefit (was 248 of 249 — `yoghurt` resolved to 0/0). Duplicate WS0 identities:
  0 (was 1). Knowledge foods with zero nutrient AND zero benefit edges: 0 (was 1).

  Claim-evidence coverage: 52.9% of editorial links sourced — 36 of 68 nutrient→
  benefit edges carry a citation (was 21 of 68 = 30.9%). Benefit-level: 12 of 15
  benefits citable (was 5 of 15).

Target Convergence (%):
  Knowledge-food identity: 100% — REACHED.

  Claim-evidence coverage target is NOT 100%, and saying so is the point. 32 of the
  68 editorial links have no authorised source in the EU Register, and 3 benefits
  have none at all. Target = 12 of 15 benefits, 36 of 68 links, until new evidence
  is published. A future pass that reaches 15/15 without new sources would be a
  fabrication, not convergence.

Next Planned Milestone:
  (a) Resolve the knowledge_foods second-writer split (item 1 above) — the largest
      remaining Principle 2 exposure in this domain.
  (b) Human sign-off of the 15 new candidate claims (npm run knowledge:signoff),
      which is what makes them render. Until then coverage is authored, not live.

Remaining Architectural Risks:
  - The second writer of knowledge_foods (611 vs 264) means the seed is not the
    whole truth of this table; any reasoning that assumes it is will be wrong.
  - `plant-protein` dormant residue could be revived by a future resolver change.
  - eur-lex.europa.eu now returns HTTP 202 (bot challenge) to automated clients, so
    an automated link-checker will report a false failure on the EFSA citation URL.
```

---

## IMPLEMENTATION

### W1 — Repair the Yoghurt identity fork (one owner per fact)

**The defect, proven before touching anything:**

```
buildFoodReport("yoghurt")  →  keyNutrients: []   healthBenefits: []
buildFoodReport("kefir")    →  4 nutrients, 3 benefits
```

Canonical `yoghurt` (`category: "Dairy"`) linked `knowledgeFoodSlug: "live-yogurt"` — a knowledge food in `category: "Fermented foods"`. Meanwhile knowledge food `yoghurt` (`category: "Dairy"`) held the facts and was reachable from no canonical food at all.

**How it got there** (`git log -S`, not inference):

| Commit | What it did |
|---|---|
| `83801f4` | Introduced `live-yogurt` into `FOOD_SEED`. |
| `bad86ca` | Wrote canonical `yoghurt.knowledgeFoodSlug = "live-yogurt"`. |
| PKC3 doc | **Described** deleting `live-yogurt`, preserving its aliases, repointing the canonical link, and adding migration `2026-07-04_pkc3_retire_live_yogurt_duplicate`. None of it landed. The migration does not exist in `runner.ts`. |
| PKC5 doc | **Verified** that work as complete. It was not. PKC5 counted alias collisions and diversity-group integrity — never whether a linked knowledge food still had facts. |
| `2eda5d3` (FI2) | Touched `relationships.ts` only: removed `live-yogurt`'s nutrient/benefit rows and appended `live-cultures` to `yoghurt`. This applied PKC3's *relationships half* by coincidence, leaving the food entry and the canonical pointer behind — and leaving canonical Yoghurt pointing at an entry with nothing in it. |

The half-applied state was strictly worse than the original duplication: before FI2 the pointer at least resolved to facts.

**What KNOW1 changed:**

1. `shared/knowledge/foods.ts` — deleted the `live-yogurt` entry (265 → 264 foods).
2. `shared/knowledge/foods.ts` — moved its three US-spelling terms (`live yogurt`, `natural yogurt`, `plain yogurt`) onto `yoghurt`'s alias list. Verified beforehand that `live-yogurt` was the sole owner of all three, so no term becomes unreachable and no alias collides.
3. `shared/canonical/foods.ts` — repointed `knowledgeFoodSlug` from `"live-yogurt"` to `"yoghurt"`, the correctly-categorised match (Dairy on both sides).
4. `server/migrations/runner.ts` — added `2026-07-09_know1_retire_live_yogurt_duplicate`, one idempotent `DELETE FROM knowledge_foods WHERE slug = 'live-yogurt'`. This is **not** cosmetic: the row is present in the live DB. `seed-knowledge-registry.ts` is an additive-only upsert with no delete path, so removing it from the seed alone would leave it seeded forever. The existing `ON DELETE CASCADE` FKs remove its `knowledge_food_nutrients` / `knowledge_food_benefits` rows.

`relationships.ts` needed no change — FI2 had already done that half.

**Result:**

```
buildFoodReport("yoghurt")
  keyNutrients  : Calcium, Vitamin B12, Vitamin D, Live Cultures
  healthBenefits: Bone Health, Digestive Comfort, Gut Health
```

Note the honest gap that survives correctly: yoghurt's *Digestive Comfort* chip still will not render, because its only digestive-comfort nutrient is `live-cultures`, which has no authorised claim (§W2). The food now has facts; the gate still governs which of them a user sees.

---

### W2 — Expand the sourced-claim pack (enrich existing knowledge)

**The constraint that shapes everything here.** `claim-sources.ts` may only *cite links that already exist* in `NUTRIENT_BENEFITS`; it may never introduce a claim. `validateKnowledgeSeed()` enforces this. And `reviewed_at` — the field that actually publishes a claim — is writable only by the human sign-off gate (`npm run knowledge:signoff -- --confirm REVIEWED`). Rule KC9: automation authors candidates, never publishes them. **KNOW1 authored 15 candidates and published zero.**

**Before:** 21 of 68 editorial nutrient→benefit links carried a citation. All 21 sat in the 5 Master-Roadmap launch benefits. The other 10 benefits held 47 uncited editorial links, so the Layer-2 gate hid every one of them — correctly, but invisibly.

**Method.** Every one of the 68 links was checked against the official EU Register of nutrition and health claims (Commission Regulation (EU) No 432/2012). A link was cited only where an authorised claim exists, quoted **verbatim**.

That check was not ceremonial. Three wordings drafted from memory were wrong, and each would have shipped a fabricated citation:

| Drafted | Register says |
|---|---|
| "…normal collagen formation for the normal function of **the** skin" | "…for the normal function **of skin**" |
| "DHA contributes to **the** maintenance of normal brain function" | "DHA contributes to **maintenance** of normal brain function" |
| "Vitamin B12 contributes to normal **neurological function**" | **No such authorised claim exists.** The authorised string is "Vitamin B12 contributes to normal functioning of the nervous system". |

**+15 claims, lighting 7 further benefits:**

| Benefit | Nutrients newly cited | Left uncited (no authorised claim) |
|---|---|---|
| Bone Health | manganese | — |
| Immune Support | vitamin-a | allicin, live-cultures |
| Muscle Recovery | protein, magnesium, potassium | — |
| Skin Health | vitamin-a, zinc, vitamin-c | vitamin-e, beta-carotene, lycopene |
| Eye Health | vitamin-a | beta-carotene |
| Brain Health | omega-3 (DHA), vitamin-b12 | unsaturated-fats, flavonoids, anthocyanins |
| Mood Support | magnesium, vitamin-b6 | omega-3, vitamin-d |
| Healthy Ageing | vitamin-e | beta-carotene, folate, polyphenols, anthocyanins, sulforaphane |
| Digestive Comfort | fibre (NHS) | live-cultures |

`protein` cites the source-agnostic authorised claim, exactly as the NK6M merge argued it should — the source of the protein is a property of the food, not a different nutrient.

**Three benefits stay dark. They are the deliverable, not the shortfall:**

- **sleep-quality** — no authorised magnesium↔sleep claim exists. (Melatonin is the register's only authorised sleep claim; THA does not model it.)
- **blood-sugar-balance** — the authorised post-prandial glucose claims name *specific substances* (beta-glucans, pectins, arabinoxylan, resistant starch, HPMC), not the generic `fibre` identity THA models.
- **anti-inflammatory-support** — the register authorises **no** anti-inflammatory claim, for any substance.

Each still holds its editorial nutrient link. The gap is a recorded absence of evidence, not an absence of thought — and `EXPECTED_HONEST_GAPS` in the new test fails loudly if anyone quietly closes one.

**No new URL was introduced.** All 36 claims cite one of two already-link-checked URLs (the EUR-Lex regulation, and the NHS fibre page), so the existing `lastReviewed: 2026-07-03` link check still covers every citation truthfully. A new domain, or a new URL on a trusted domain, now fails `test-knowledge-claim-coverage.ts`'s `LINK_CHECKED_URLS` guard.

---

### W3 — Verification (`server/tests/test-knowledge-claim-coverage.ts`, new)

`test-knowledge-evidence-gate.ts` proves the **gate** works. Nothing proved the **knowledge behind it** was honest — which is why W1's defect survived a dedicated verification pass. The new test is pure (seed only, no DB, no network) and asserts:

- every sourced pair cites an existing `NUTRIENT_BENEFITS` link (citations never invent claims);
- the seed authors no `reviewed_at` anywhere (Rule KC9);
- every claim is `established`, and every ref on it is `established` (Rule E2);
- every ref URL is Layer-1 trusted **and** has been link-checked (a new guard);
- no benefit chip can render for a benefit with zero sourced nutrient claims (Rule E1, the bridge invariant);
- every citable benefit is reachable from ≥1 real food through the bridge;
- the uncitable benefits are **exactly** the three documented honest gaps;
- the 5 launch benefits never regress.

Wired into `npm test` as `test:knowledge-claim-coverage`.

It is load-bearing: run against the pre-expansion pack it fails on precisely the honest-gaps assertion (found 10, expected 3) and passes the other 13 checks.

---

### W4 — What KNOW1 deliberately did NOT do

**A native Context View for `nutrition-knowledge:read`.** `context-view.ts` names `nutrition-knowledge:read scope=foods` three times as its driving case, and NCV1 rolled native views out to seven capability views without it. It is a tempting, cheap-looking addition. It was not made, for two reasons that the file itself supplies: the generic detector already picks `category` as the balance dimension (which is the behaviour the file argues for), and NCV1's own hardest-won lesson — the reverted `planner: groupBy dayOfWeek` — is that a spec must be **measured against the benchmark corpus, not assumed**. Declaring one here without running that measurement would repeat the exact error that document exists to record. Left as a suggestion.

**Nutrition-context prose.** Only **10 of 312** canonical foods carry "why it matters" prose (`shared/canonical/nutrition-context.ts`). NK1 Gap 1 states "46 of 188 foods lack prose"; the real figure is that 302 of 312 lack it. Authoring it was out of the question: NK1 Domain 6's trust gate is "sourced claims only; **no AI-generated prose without source + review**", and ENGINEERING_WORKFLOW STEP 7 makes an unsourced knowledge claim a hard stop. The gap is reported, not filled.

**The `knowledge_foods` second writer and the `plant-protein` residue.** Both are real, both are pre-existing, both are quantified above, and neither is a seed-file problem — fixing them in `FOOD_SEED` would not touch the DB rows that actually carry them. See SUGGESTIONS.

---

## DEFINITION OF DONE

**What success looks like**
- Canonical `yoghurt` resolves to a knowledge food carrying facts; zero canonical foods resolve to a factless knowledge food; zero duplicate WS0 knowledge identities.
- 36 of 68 nutrient→benefit links carry a verbatim, authorised citation; 12 of 15 benefits are citable; the 3 uncitable ones are asserted as honest gaps.
- No claim is published by this workstream — `reviewed_at` remains a human gate.

**What must not break**
- The 5 launch benefits must keep rendering. Re-seeding must not un-publish them: `seed-knowledge-registry.ts`'s `onConflictDoUpdate` for `knowledge_nutrient_benefits` sets `evidenceStrength, ranking, source, sourceRefs, isActive` and **not** `reviewedAt` — verified by reading the upsert, so signed-off rows keep their sign-off and new rows land NULL.
- No unsourced claim may render.

**Manual verification performed**

| Check | Result |
|---|---|
| `validateKnowledgeSeed()` | PASS (0 problems) |
| `validateCanonicalSeed()` | PASS (0 problems) |
| `buildFoodReport("yoghurt")` | 4 nutrients, 3 benefits (was 0, 0) |
| knowledge foods with 0 nutrients AND 0 benefits | 0 (was 1) |
| dangling relationship keys | 0 |
| `npm run test:knowledge-claim-coverage` (new) | **PASS — 14/14** |
| `npm run test:knowledge-evidence-gate` | **PASS — 116/116** (was 100/100; more nutrients now exercised live) |
| `npm run test:knowledge-registry` | PASS — 23/23 |
| `npm run test:intelligence-nutrition-knowledge-binding` | PASS — 37/37 |
| `npm run test:intelligence-food-intelligence-binding` | PASS — 36/36 |
| `npm run test:intelligence-food-opportunity-binding` | PASS — 40/40 |
| `npm run test:nutrition-enrichment` | PASS — 22/22 |
| `test-food-report-adapter` | 102 pass / **2 pre-existing fails** — identical at `HEAD` (stale `plant-protein` expectations from the NK6M merge). Not caused by KNOW1; proven by re-running on the stashed tree. |
| `test-canonical-food` | 43 pass / **3 pre-existing fails** — identical at `HEAD` (DB not re-seeded to current seed counts). |
| `tsc --noEmit` | 174 errors before, 174 after; **0 in any file KNOW1 touched**. |

**Measured impact** (projection: what renders *after* `npm run seed:knowledge` and a human sign-off)

| | Seed graph (699 links) | Live DB graph (1,366 links) |
|---|---|---|
| Benefit chips before | 371 (53.1%) | 755 (55.3%), 486 foods |
| Benefit chips after | **450 (64.4%)** | **947 (69.3%), 496 foods** |
| Delta | +79 | **+192 chips, +10 foods** |

The two graphs differ because the DB carries the ~347 imported foods the seed does not own (see Convergence Status). Both are reported; neither is presented as the other.

**Rollout steps required for any of this to reach a user** (deliberately not performed here):
1. `npm run seed:knowledge` — attaches the 15 new citations, `reviewed_at` NULL.
2. `npm run knowledge:signoff` — dry run; a human reads each claim against its source.
3. `npm run knowledge:signoff -- --confirm REVIEWED` — sets `reviewed_at`. **Only now do the claims render.**
4. Server restart applies migration `2026-07-09_know1_retire_live_yogurt_duplicate`.

---

## DATA IMPACT

- **Reads existing data:** YES (seed + DB, read-only, for verification)
- **Writes new data:** YES — 15 new `source_refs` payloads on existing `knowledge_nutrient_benefits` rows, at re-seed. No new rows, no new columns, no new table.
- **Changes meaning of existing data:** YES, narrowly and in one direction. The term "natural yogurt"/"plain yogurt"/"live yogurt" now resolves to `yoghurt` rather than `live-yogurt`; the canonical Yoghurt food's knowledge link now resolves to facts rather than to nothing. No fact's *content* changed. Nothing became less specific.
- **Requires backfill:** NO. One idempotent DELETE migration, plus a re-seed that upserts by slug.
- **Deletes data:** YES — one `knowledge_foods` row (`live-yogurt`), cascading to its relationship rows. Those relationship rows were already emptied by FI2, so the cascade removes 0 nutrient/benefit rows in the current live DB.

---

## TRUST CHECK

- **Could this mislead the user?** The opposite, in both directions. Before: a canonical food showed no nutrition at all, and ten benefits were invisible despite having real editorial backing. After: yoghurt shows its facts, and seven more benefits show theirs — each with the verbatim authorised wording that earned it the right to render.
- **Could this fabricate certainty?** This was the workstream's central risk, and it materialised. Three claim wordings drafted from memory were wrong; one ("Vitamin B12 contributes to normal neurological function") does not exist as an authorised claim at all. All three were caught by verifying every wording verbatim against the EU Register **before** writing them. Had they shipped, THA would have quoted a regulation that says something else. That is why the check exists, and why the corrected wordings are in the file with a comment saying so.
- **Is anything guessed but shown as real?** No. Every citation is verbatim. Every link without an authorised source stays uncited and therefore unrendered. Coverage figures are labelled as post-sign-off *projections*, because that is what they are — nothing is live until a human signs off.
- **What happens if the system is wrong?** A wrong claim cannot render: it must pass Layer 1 (trusted domain), Layer 2 (valid ref + human `reviewed_at`), and the nutrient bridge. A wrong *wording* on a correct claim would render — which is precisely the failure mode verified against source, and now guarded by the `LINK_CHECKED_URLS` allowlist and the recorded correction note in `claim-sources.ts`.
- **No architectural duplication introduced:** YES (one duplicate identity removed)
- **No new source of truth created:** YES
- **No runtime behaviour altered:** NO — runtime behaviour *is* altered, intentionally: yoghurt renders facts, and after sign-off seven more benefits render. Declared here rather than hidden.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-know1-food-intelligence-expansion-20260709` → `efff2ae`
- **Files modified:** `shared/knowledge/claim-sources.ts`, `shared/knowledge/foods.ts`, `shared/canonical/foods.ts`, `server/migrations/runner.ts`, `package.json`, `docs/implementation/PKC3_*.md`, `docs/implementation/PKC5_*.md`; **added** `server/tests/test-knowledge-claim-coverage.ts`, this document.
- **Rollback commands:**
  ```
  git checkout rollback/before-know1-food-intelligence-expansion-20260709 -- \
    shared/knowledge/claim-sources.ts shared/knowledge/foods.ts \
    shared/canonical/foods.ts server/migrations/runner.ts package.json \
    docs/implementation/knowledge/PKC3_LAUNCH_KNOWLEDGE_WAVE_1_IMPLEMENTATION.md \
    docs/implementation/knowledge/PKC5_PLATFORM_KNOWLEDGE_FOUNDATIONS_VERIFICATION.md
  rm server/tests/test-knowledge-claim-coverage.ts docs/implementation/knowledge/KNOW1_FOOD_INTELLIGENCE_EXPANSION.md
  npm run seed:knowledge     # restore the live-yogurt row and the old sourceRefs
  ```
- **Migration caveat.** `2026-07-09_know1_retire_live_yogurt_duplicate` is recorded in `schema_migrations` once run and will not re-run. Reverting the seed files without re-seeding leaves that environment with no `live-yogurt` row; `npm run seed:knowledge` against the rolled-back files restores it exactly. Signed-off claims are unaffected either way — the seed never writes `reviewed_at`, so a rollback cannot un-publish anything, and a rolled-back environment simply keeps the 21 launch citations it had.
- **Verification after rollback:** `npx tsx server/tests/test-knowledge-evidence-gate.ts` → 100/100; `buildFoodReport("yoghurt")` → empty arrays (the original defect, restored faithfully).

---

## SCOPE LOCK

**Implemented scope:** exactly the four workstreams above — (W1) complete the `live-yogurt` → `yoghurt` merge PKC3 specified and never landed, with its migration, and correct the PKC3/PKC5 records; (W2) expand `claim-sources.ts` from 21 to 36 verbatim-sourced claims, taking citable benefits from 5 to 12 and leaving 3 evidence-free benefits as asserted honest gaps; (W3) add `test-knowledge-claim-coverage.ts` and wire it into `npm test`; (W4) record what was deliberately not done.

**Explicitly excluded (NOT done):**
- No new knowledge store, table, column, capability, binding, route, or assistant.
- No `reviewed_at` written; nothing published. Sign-off remains a human act.
- No new `NUTRIENT_BENEFITS` links — citations may not invent claims.
- No nutrition-context prose authored (STEP 7 hard stop; NK1 Domain 6 trust gate).
- No native Context View spec for `nutrition-knowledge:read` (unmeasured — see §W4).
- No resolution of the `knowledge_foods` second writer, or the `plant-protein` residue.
- No change to `SOURCED_LAUNCH_BENEFITS` (it means the Master Roadmap §6 *minimum*, not current coverage).
- No amendment to governing architecture (`NK1`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`), whose stale figures are reported below rather than unilaterally rewritten.

**SUGGESTIONS (observed, evidence attached, not implemented — do not action without approval):**

1. **`knowledge_foods` has two writers.** Live DB: 611 rows; `FOOD_SEED`: 264. ~347 foods arrived via the NK6P/KQ1 import path. This is the largest Principle 2 exposure in the Food Knowledge domain and it silently invalidates any seed-only reasoning about this table (including, honestly, the seed-graph column of my own impact table). Worth its own workstream.
   > **RESOLVED by KNOW2** (2026-07-09, `docs/implementation/knowledge/KNOW2_KNOWLEDGE_FOOD_OWNERSHIP_CONVERGENCE.md`). The count was 346 (KNOW1's own W1 had already removed the 611th, `live-yogurt`). The second writer was `server/lib/canonical-foods-importer.ts`, now the write-free `canonical-foods-gate.ts`. All 346 identities and their 1,702 relationship rows are graduated into `shared/knowledge/`; `knowledge_foods` has one writer, enforced by `test-knowledge-food-ownership.ts`. KNOW2 additionally found that the imported rows carried a falsified `source` (`"THA editorial"`, the column default, on AI-authored drafts) and a machine enum in `description` — neither visible from the row count alone.
2. **`plant-protein` residue (NK6M).** The DB keeps a retired `knowledge_nutrients` row plus 38 `knowledge_food_nutrients` and 2 `knowledge_nutrient_benefits` links. Dormant today. Deleting the nutrient row would cascade and strip **2 foods** of their only protein link (36 of the 38 also link to `protein`); those 2 need a `protein` link first. This is also the cause of the 2 pre-existing `test-food-report-adapter` failures.
3. **NK1's coverage audit is materially out of date.** It states Plane 1 is "40% content-complete", "188 foods", "46 of 188 lack prose", "~100 bridged relationships". Actual: 264 knowledge foods, 312 canonical foods, 68 nutrient→benefit edges (of which 36 now sourced), 915 food→nutrient and 699 food→benefit edges, and **10 of 312** foods with prose. NK1 asks to be revisited every 6 months; it is due.
4. **`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §13 lists M1/M2/M4 as pending.** All three files (`nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts`) are already deleted. The stated "~60% convergence" understates reality.
5. **Native Context View for `nutrition-knowledge:read`** — worth doing, once someone can measure it against the benchmark corpus as NCV1 requires.
6. **`eur-lex.europa.eu` now serves an HTTP 202 bot challenge.** Any future automated link-checker will report a false failure on the EFSA citation URL. It resolves normally in a browser.
