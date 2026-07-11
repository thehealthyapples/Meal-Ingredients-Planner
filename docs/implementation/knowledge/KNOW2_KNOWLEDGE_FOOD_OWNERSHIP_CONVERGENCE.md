# KNOW2 — Unify Canonical Food Knowledge Ownership

**Status:** IMPLEMENTED
**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Predecessor:** [`KNOW1_FOOD_INTELLIGENCE_EXPANSION.md`](./KNOW1_FOOD_INTELLIGENCE_EXPANSION.md) — SUGGESTION 1 ("`knowledge_foods` has two writers … worth its own workstream") is what this workstream actions.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/before-know2-knowledge-food-ownership-convergence-20260709` |
| Points at | `420f6e6` (KNOW1 — Expand Food Intelligence over the existing knowledge architecture) |
| Restore with | `git checkout rollback/before-know2-knowledge-food-ownership-convergence-20260709` |

---

## REFERENCE DOCUMENTS READ

`docs/architecture/README.md` (bootstrap) · `ARCHITECTURE_PRINCIPLES.md` (Principles 1, 2, 3, 6, 7, 8) ·
`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain 1; Rules 1–8) · `ENGINEERING_WORKFLOW.md` (STEPs 1–9,
Architecture Compliance Checklist) · `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (Rules KC1–KC11) ·
`NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` (Rule NK1, NK2, NK3) · `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` ·
`docs/investigations/knowledge/NK6P_BATCHES_007_TO_023_IMPORT_REPORT.md` · `docs/implementation/knowledge/NK6O_BATCH_006_NUTRIENT_REPAIR.md`

---

## SUMMARY

`knowledge_foods` had two writers. The declared one — `shared/knowledge/foods.ts` →
`server/seeds/seed-knowledge-registry.ts` (SoT Register Domain 1) — described **264 of 610** live rows.
The other, `server/lib/canonical-foods-importer.ts`, wrote the remaining **346** straight into the published
store. It is named nowhere in the Register.

KNOW1 quantified the split as "611 vs 264". Measuring it found four consequences, each worse than a count:

1. **The declared source of truth could not reproduce its own table.** Re-seeding restored 264 rows and knew
   nothing of the other 346. Any reasoning from `FOOD_SEED` about this table was wrong by 57%.

2. **Provenance was falsified.** `extractFoodIdentity()` never set `source`, so all 346 rows took the column
   default `"THA editorial"` — while their own drafts declare `authored_by: ChatGPT for The Healthy Apples`,
   `status: draft`, `review_status: requires_claude_import_validation_before_merge`. AI-authored candidate
   content sat in the published store wearing a human editorial stamp. **Rule KC9** — *automation authors
   candidates, never publishes them* — was not merely unmet; the record said the opposite of the truth.

3. **The two writers overwrote each other.** The importer was run with `--force-upsert` over the ten top-level
   drafts, nine of which name editorial identities. `greek-yoghurt`'s draft sets `category: dairy_fermented_food`
   and six aliases; the live row carries `Dairy` and two — the seed's values, restored by a later
   `npm run seed:knowledge`. The importer's identity writes were silently reverted while its **relationship**
   rows survived, leaving those foods with an identity from one owner and facts from another. Last writer wins.

4. **`description` carried a machine enum.** The importer wrote `classification.whole_food_status` into a
   display-copy column, so all 346 rows read `whole_or_minimally_processed`, served to the client by
   `/api/knowledge/foods` (`nutrition-knowledge-registry.ts:313`). Fabricated display copy, on a surface whose
   governing principle is honest gaps.

KNOW2 converges on the owner the architecture already names. The 346 identities and their 1,035 nutrient and
667 benefit links are **graduated** into `shared/knowledge/` as checked-in datasets with honest provenance; the
importer is stripped of every write and becomes the **gate** — Stage 2 of the Knowledge Graduation Pipeline —
emitting records a human commits. `npm run seed:knowledge` now reproduces the entire table from source.

```
   1 CANDIDATE            2 GATED                  3 PROMOTED            4 PUBLISHED
   drafts/*.yaml   ──▶    canonical-foods-gate.ts  ──▶  human commits   ──▶  seed-knowledge-registry.ts
   (AI-authored)          resolve · reconcile ·         into                 (the one writer)
                          pre-flight bindability        shared/knowledge/    │
                                  │                                          ▼
                                  ▼                                     knowledge_*
                          blocked / existing / invalid
                          (terminal, never silent)
```

**Nothing was published by automation, and no food was lost.** 610 rows before, 610 after.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity                                                              ✔
  knowledge_foods.slug remains the single key space for a knowledge food. The
  graduation adds no key, no id, no parallel slug. The gate resolves every incoming
  draft identity through the ONE shared resolver (resolveCanonicalFood, GOV2 Rule 5)
  before emitting, and refuses to fork (carrot→carrots, fennel-bulb→fennel,
  sweetcorn→corn, tomato→tomatoes — all four still blocked, verified).

□ One owner per fact                                                                  ✔
  This is the whole workstream. knowledge_foods went from 2 writers to 1;
  knowledge_food_nutrients from 3 to 1; knowledge_food_benefits from 2 to 1. The
  scope test (`can these two stores legitimately disagree?`) answers NO — the seed
  and the importer wrote the same rows and overwrote each other. One is redundant
  and is retired. Enforced by test, not asserted: test-knowledge-food-ownership.ts
  scans the source tree for Drizzle writes targeting the knowledge food tables and
  fails unless exactly one module — the declared seed runner — performs them.

□ No duplicate entities                                                               ✔
  No new entity. GRADUATED_FOOD_SEED holds the same 346 identities that already
  existed as rows; validateKnowledgeSeed() now refuses a graduated slug that
  collides with an editorial one (a merge is a human decision, GOV2 Rule 7).

□ No duplicate ownership                                                              ✔
  No attribute gains a second owner. `source` gains its FIRST honest owner: the
  graduated rows now state their draft provenance instead of inheriting the
  editorial column default.

□ No duplicate state                                                                  ✔
  No user state touched. Food Knowledge is a knowledge entity, not transactional
  state (Principle 3).

□ Extends existing architecture                                                       ✔
  Extends the WS0 Knowledge Registry seed shape (typed arrays in shared/knowledge,
  validated by validateKnowledgeSeed, written by the one seed runner) and the
  PKCA graduation pipeline that WS0X/WS4B/FS1/EL1 already instantiate. No new
  store, table, column, capability, binding, route or assistant.

□ Progressive enrichment where appropriate                                            ✔
  Identity → core facts → optional context, unchanged. The gate now enforces the
  Minimum Viable Fact bar (Rule KC5): a draft with no bindable nutrient or benefit
  is `invalid`, not an identity-only row.

□ Honest gaps over fabricated information                                             ✔
  The `whole_or_minimally_processed` enum is withheld: 346 graduated foods carry
  `description: null`. No prose is authored in its place — that would be an
  unsourced knowledge claim (NK1 Domain 6 trust gate; STEP 7 hard stop). The
  classification is not lost; it lives in the draft, where it always belonged.
  Asserted by test, both in the seed and against the live DB.

□ No permanent synchronisation bridge                                                 ✔
  The opposite: the workstream deletes one. Two owners of `knowledge_foods` kept
  in accidental, last-writer-wins sync is precisely the bridge Principle 7 calls
  debt. The gate is now an input-funnelling bridge (many drafts → one owner),
  which Principle 7 explicitly permits.

□ Evolution over replacement                                                          ✔
  Named replacements, all in this document: canonical-foods-importer.ts →
  canonical-foods-gate.ts (same module, every write removed); cli/import-canonical-
  foods.ts → cli/graduate-canonical-foods.ts; npm `import:canonical-foods` →
  `knowledge:graduate`; scripts/nk6o-rebind-legume-nutrients.ts and
  scripts/nk6o-verify.ts retired (their documented repair is complete; both held a
  live reference to the retired writer).
```

**No item failed. Implementation proceeded.** One item — *Honest gaps over fabricated information* — could not
be checked while graduating `description` verbatim; per ENGINEERING_WORKFLOW that halted implementation and the
decision was escalated and approved before continuing.

---

## AI ARCHITECTURE COMPLIANCE

| Check | Status |
|---|---|
| Uses the canonical Intelligence Platform / Capability Registry / Intent Engine | ✔ Untouched — no capability, binding or intent added |
| Reuses existing business services | ✔ `nutrition-knowledge-registry.ts` read layer unchanged |
| Creates no second assistant | ✔ None |
| Duplicates no conversation state | ✔ None |
| Registered capabilities only, permission-aware | ✔ Unchanged |
| Produces honest gaps rather than fabricated knowledge | ✔ 346 fabricated descriptions removed; nothing authored |
| **Automation may not publish** (Rule KC9) | ✔ The single most important change here. AI-authored drafts can no longer reach the published store without a human commit |

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Knowledge (Nutrition) — SoT Register Domain 1
Declared SoT:    shared/knowledge/ → DB knowledge_* via seed-knowledge-registry.ts
                 (read layer: server/services/nutrition-knowledge-registry.ts)

New store created?      NO
Existing store extended? YES — shared/knowledge/ gains graduated-foods.ts and
                         graduated-relationships.ts, composed into the existing
                         FOOD_SEED / FOOD_NUTRIENT_SEED / FOOD_BENEFIT_SEED exports.
                         One owner, one writer, two honestly-labelled origins.

Store retired?          YES — server/lib/canonical-foods-importer.ts as a WRITER of
                        knowledge_foods, knowledge_food_nutrients and
                        knowledge_food_benefits. Retirement condition (Principle 8 /
                        SoT Rule 2): every row it had written is reproducible from the
                        declared SoT. Met, and asserted by test.

Consumer created?       NO. Reads from the declared SoT throughout.
Is that source the declared SoT? YES.
```

**SoT Register accuracy.** Domain 1 states "Foods covered: 188". It is 610. The Register never named the
importer, so nothing in it needs deleting — only the count is stale. Reported below rather than unilaterally
rewritten (governing architecture; KNOW1's precedent).

---

## ARCHITECTURE CONVERGENCE STATUS 🔴

```
Domain:                    Food Knowledge (Nutrition)
Current Canonical Owner:   shared/knowledge/ → server/seeds/seed-knowledge-registry.ts
Current Runtime Consumer:  server/services/nutrition-knowledge-registry.ts (read layer)
                           shared/canonical/food-report-adapter.ts (the one mouth, Rule KC4)

Duplicate Owners Remaining: 0   (was 1 — server/lib/canonical-foods-importer.ts)
Duplicate State Remaining:  0
Duplicate Workflows:        0   (was 2 — `npm run import:canonical-foods`,
                                 scripts/nk6o-rebind-legume-nutrients.ts)

Writers per table          before → after
  knowledge_foods              2 → 1
  knowledge_food_nutrients     3 → 1
  knowledge_food_benefits      2 → 1

Convergence (%)  — evidence-based; the measure is "what fraction of live rows can the
                   declared Source of Truth reproduce?"

  knowledge_foods            43.3%  (264/610)   →  100%    (610/610)
  knowledge_food_benefits    51.2%  (699/1366)  →  100%    (1366/1366)
  knowledge_food_nutrients   46.0%  (915/1988)  →   98.1%  (1950/1988)

Target Convergence:
  100% for identity and benefits — REACHED.

  knowledge_food_nutrients stops at 98.1%, and saying so is the point. The residual 38
  rows all reference `plant-protein`, retired from NUTRIENT_SEED by NK6M but still
  present in knowledge_nutrients. 36 are editorial residue KNOW1 already documented;
  2 were written by the importer (`lentils`, `oats`). They cannot be graduated — the
  seed validator refuses a link to a nutrient the seed does not define — and they are
  not deleted here, because deleting the nutrient row cascades and strips two foods of
  their only protein link. Graduating them would silently resurrect retired vocabulary.
  Reaching 100% requires KNOW1's SUGGESTION 2, not this workstream.

Next Planned Milestone:
  (a) The `category` vocabulary fork (SUGGESTION 1 below) — now visible in the seed,
      where it can be reviewed, rather than only in the database.
  (b) KNOW1 SUGGESTION 2 — retire `plant-protein` and close the last 38 rows.

Remaining Architectural Risks:
  - `knowledge_foods.category` holds two vocabularies. The registry filters on it.
  - 346 graduated foods have no description. This is now an honest gap; it was
    previously a fabricated one.
```

---

## IMPLEMENTATION

### W1 — Establish which writer is canonical

Not a judgement call. `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Domain 1 names the seed data
(`shared/knowledge/foods.ts`) and the DB seed runner (`server/seeds/seed-knowledge-registry.ts`) and no
importer. `NK1` Rule NK1 assigns `knowledge_foods` row ownership to **Editorial (Plane 1)**, with external
ingestion permitted only into Plane 3 (`normalizedIngredients`), reaching Plane 1 "only by passing the
editorial gate … never blended silently into canonical content" (Rule E3).

The importer wrote directly into Plane 1. The seed is canonical; the importer is the duplicate.

### W2 — Graduate the imported knowledge (`scripts/know2-graduate-imported-foods.ts`)

A one-time, deliberately paranoid emitter. Every record is **derived from the checked-in YAML draft** and then
asserted field-by-field against the **live published row**; a single unexplained divergence aborts the emit.

It found three things a less suspicious script would have shipped:

- **`lentils` came from the top-level draft, not `batch-006`.** Ten slugs have two draft files. Matching each
  published row against its candidates identifies which one was actually promoted, reproducibly.
- **`greek-yoghurt`'s identity could not be matched at all** — because a later seed run had reverted it. Its
  relationship rows are therefore resolved by which draft *derives the links*, not by identity. This is finding
  (3) above, discovered by the assertion rather than by inspection.
- **Three links carry a pre-resolver-change ordinal.** `spinach/magnesium` stores `ranking: 3`; today's draft
  derives `5`, because the GOV2 vocabulary resolver has changed since the import (NK6M/NK6R) and de-duplication
  shifts the binding index. The links are still derivable; the ordinals are not. **The published value is
  preserved and the drift is reported** — re-deriving would silently reorder live data.

Emitted, byte-checked:

| Dataset | Rows |
|---|---|
| `shared/knowledge/graduated-foods.ts` → `GRADUATED_FOOD_SEED` | 346 identities |
| `shared/knowledge/graduated-relationships.ts` → `GRADUATED_FOOD_NUTRIENTS` | 1,035 links |
| `shared/knowledge/graduated-relationships.ts` → `GRADUATED_FOOD_BENEFITS` | 667 links |

Ten of those links hang off **editorial** foods (`blueberries`, `broccoli`, `greek-yoghurt`, `spinach`, `eggs`,
`salmon`) — the residue of the `--force-upsert` run. They graduate too: the seed is now the sole writer of
those tables, so it must own them. An eleventh, `oats/plant-protein`, is withheld as retired vocabulary.

`shared/knowledge/foods.ts` keeps the human-authored rows as `EDITORIAL_FOOD_SEED` and composes
`FOOD_SEED = [...EDITORIAL_FOOD_SEED, ...GRADUATED_FOOD_SEED]`. Split in source so provenance stays legible;
**one array, one owner.**

### W3 — Make one-owner enforced, not declared (Rule KC8)

`validateKnowledgeSeed()` gains three checks the seed runner refuses to seed past:

1. A graduated identity may never collide with an editorial one — that is a merge, and a merge is a human
   decision (GOV2 Rule 7).
2. A graduated row must carry `source: "NK6 canonical food draft"`. Relying on the column default is exactly
   how 346 AI-authored foods came to claim human editorial authorship.
3. **No relationship pair may appear twice.** Two rows for one `(food, fact)` pair are two owners of that fact,
   whichever half of the seed they sit in — and the DB's unique constraint would have let the second win
   silently. The validator never checked this before.

### W4 — Retire the second writer (`server/lib/canonical-foods-gate.ts`)

The module survives; every write is gone. It no longer imports `db`, no longer exports `bindFoodNutrients` /
`bindFoodBenefits` / `importCanonicalFood`, and `--force-upsert` no longer exists — there is nothing to upsert.

Two changes are improvements, not just removals:

- **Identity existence is checked against `FOOD_SEED`, not the database.** Asking the DB is how the importer
  came to treat the published table as the authority on identity. The seed is the authority; the DB is its
  projection.
- **Bindability is now pre-flight.** A nutrient the resolver knows but the seed does not define is named and
  dropped *before* anything is emitted. The importer discovered this only when Postgres rejected the foreign
  key — *after* the identity was written. That is precisely how the Batch 006 legumes ended up with benefits
  and zero nutrients, and it is what NK6O had to repair. The failure mode is now structurally impossible.

Outcomes are terminal and named (Rule KC2): `promote` · `existing` · `blocked` · `invalid`.

`server/cli/graduate-canonical-foods.ts` replaces the import CLI. It prints, for each candidate that clears the
gate, the exact records to append to `shared/knowledge/` — including the **soft alias-overlap warnings**, which
are the signal NK6P used to hold `sweet-pepper` back. Handing a reviewer a clean-looking record with its
caveats stripped off would defeat the human gate the whole workstream exists to restore.

The gate writes exactly one thing, to a different store with a different owner: unresolved vocabulary terms go
to the Knowledge Review Queue (KQ1B, `knowledge_review_*`), so rejection is queued, never lost (Rule KC2).

### W5 — What KNOW2 deliberately did NOT do

**Author 346 descriptions.** Withholding a machine enum is removing fabrication; writing prose in its place
would be creating it. NK1's Domain 6 trust gate and STEP 7 make an unsourced knowledge claim a hard stop. The
gap is reported, not filled — the same call KNOW1 made for the 302 foods lacking nutrition-context prose.

**Converge the `category` vocabulary.** Mapping `offal_or_animal_bone` or `beverage_or_infusion` onto the
thirteen display categories is an editorial judgement, not a mechanical one. Inventing that mapping inside an
ownership workstream would be exactly the fabrication this workstream exists to remove. Reported as SUGGESTION 1
with evidence, and now visible in a reviewable checked-in file rather than only in the database.

**Delete the `plant-protein` residue.** It cascades. See Convergence Status, and KNOW1 SUGGESTION 2.

**Amend the SoT Register or NK1.** Their stale figures are reported, not unilaterally rewritten.

---

## DEFINITION OF DONE

**What success looks like**
- `knowledge_foods` has exactly one writer, and a test fails if a second appears.
- The declared Source of Truth reproduces every live row: 610 seeded, 610 live.
- All 346 imported foods preserved, with every nutrient and benefit link intact.
- Provenance is honest: no AI-authored row claims human editorial authorship.
- No fabricated display copy survives in the seed or in the database.
- Automation cannot publish; the promotion step is a human commit (Rule KC9).
- No new knowledge store, table, column, capability, binding, route or assistant.
- No food deleted, no relationship deleted, no vocabulary minted.
- No `reviewed_at` written; nothing published to users that was not already published.
- No editorial mapping invented for the forked `category` vocabulary.
- No resurrection of the retired `plant-protein` vocabulary.

**Verification** (dev/lower environment; `REPLIT_DEPLOYMENT` unset; production untouched)

| Check | Result |
|---|---|
| `test-knowledge-food-ownership` (**new**) | **24 / 24** |
| `test-knowledge-registry` | 27 / 27 (was 23; +4 new) |
| `test-knowledge-evidence-gate` | 116 / 116 |
| `test-knowledge-claim-coverage` | 14 / 14 |
| `test-intelligence-nutrition-knowledge-binding` | 37 / 37 |
| `test-intelligence-food-intelligence-binding` | 36 / 36 |
| `test-intelligence-food-opportunity-binding` | 40 / 40 |
| `test-nutrition-enrichment` | 22 / 22 |
| `tsc --noEmit` | 173 errors (HEAD: 174). **0 in any file KNOW2 touched.** The single-error delta is the retired CLI's own `TS2802`; its replacement uses `Array.from`. |
| `test-food-report-adapter` | 102 passed, **2 failed** — `lentils: Red has Plant Protein`, `lentils: Green has no additionalNutrients` |
| `test-canonical-food` | 43 passed, **3 failed** — `diversity_group`, `food_variety`, `canonical_food_alias` DB counts |

The five failures are pre-existing and were **proven** identical, by name, by running both suites from a
detached `git worktree` at `420f6e6` against the same database — not assumed from KNOW1's record. The two
`food-report-adapter` failures are the `plant-protein` residue KNOW1 named as their cause.

**The one-writer test is load-bearing.** Its source scan, applied to `HEAD:server/lib/canonical-foods-importer.ts`,
matches four writes (lines 247, 251, 338, 378). At HEAD it reports two writers and fails.

**Runtime, driven end-to-end:**

```
npm run seed:knowledge      610 foods · 1988 food_nutrients · 1366 food_benefits   (idempotent: identical on re-run)

knowledge_foods.source      before: THA editorial 533 · USDA 77
                             after: NK6 canonical food draft 346 · THA editorial 187 · USDA 77

description='whole_or_minimally_processed'   before: 346    after: 0

GET /api/knowledge/foods/adzuki-beans   (graduated)
  { name: "Adzuki beans", category: "legume", description: null, source: "NK6 canonical food draft" }
  nutrients: protein, fibre, folate, polyphenols     benefits: gut-health, heart-health

GET /api/knowledge/foods/pumpkin-seeds  (editorial — unchanged)
  { name: "Pumpkin Seeds", category: "Seeds", description: "Green seeds rich in magnesium…", source: "THA editorial" }

npm run knowledge:graduate -- 'drafts/batch-001-core-everyday-vegetables/*.yaml'
  🟢 promote 1   🔵 existing 25   ⛔ blocked 4   ❌ invalid 0
  blocked: carrot→carrots · fennel-bulb→fennel · sweetcorn→corn · tomato→tomatoes   (GOV2 Rule 7 upheld)
  sweet-pepper promotes, carrying its soft warning: alias "red pepper" also names existing "red-pepper"

  knowledge_foods / food_nutrients / food_benefits after every gate run: 610 / 1988 / 1366 — unchanged.
  The gate wrote nothing.
```

---

## DATA IMPACT

| Table | Before | After | Change |
|---|---|---|---|
| `knowledge_foods` | 610 | 610 | **0 rows added or removed.** 346 rows re-stamped `source` (falsified → honest); 346 rows `description` cleared (machine enum → NULL) |
| `knowledge_food_nutrients` | 1988 | 1988 | 0 rows changed. 1,035 now reproducible from the seed |
| `knowledge_food_benefits` | 1366 | 1366 | 0 rows changed. 667 now reproducible from the seed |
| `knowledge_nutrients` | 36 | 36 | Untouched (`plant-protein` residue retained deliberately) |
| `knowledge_health_benefits` | 15 | 15 | Untouched |
| `canonical_food` | 362 | 362 | Untouched |

**No migration is required, and that is the proof.** KNOW1 needed one because the seed is additive and cannot
delete. Here the seed's own `onConflictDoUpdate` performs the correction: once the graduated records carry the
right `source` and a null `description`, a single `npm run seed:knowledge` converges the live table. That the
convergence is achievable *by running the owner* is the demonstration that the owner now owns it.

**Reversibility.** No row is deleted. Reverting the code and re-running the seed restores the previous
`source`/`description` values for the editorial 264; the graduated 346 would return to the column default. The
346 identities and all 1,702 relationship rows persist in the DB regardless of which code is deployed.

---

## TRUST CHECK

| Question | Answer |
|---|---|
| New source of truth created? | **NO** — one was *removed* |
| Any knowledge claim displayed without a `SourceRef`? | NO |
| Any AI-generated health claim introduced? | NO. 346 AI-authored identities were already published; KNOW2 stops that pathway and labels what exists |
| Any `emerging` benefit shown as `established`? | NO — graduated links keep `evidenceStrength: "emerging"`, verbatim |
| Any bridge keeping two stores of one fact in sync? | NO — one was deleted |
| Any new static client `.ts` knowledge file? | NO |
| `reviewed_at` written? | NO — sign-off remains a human act (Rule KC9) |
| Fabricated content removed? | YES — 346 machine-enum descriptions |

**STEP 7 was triggered once,** by the `description` enum, and honoured: implementation stopped, the conflict was
explained, and the decision was approved before continuing. No prose was authored.

---

## ROLLBACK PLAN

| Scenario | Action |
|---|---|
| Revert the code | `git checkout rollback/before-know2-knowledge-food-ownership-convergence-20260709` |
| Restore previous `source` / `description` values | Check out the tag and run `npm run seed:knowledge`. The 346 rows return to the column default; no row is created or destroyed |
| Restore the retired writer | It is in git history at `420f6e6:server/lib/canonical-foods-importer.ts`, with its CLI and both NK6O scripts |
| Data loss risk | **None.** No `DELETE` is issued anywhere in this workstream |

---

## SCOPE LOCK

Files changed:

```
shared/knowledge/graduated-foods.ts               NEW (generated)  346 identities
shared/knowledge/graduated-relationships.ts       NEW (generated)  1,035 + 667 links
shared/knowledge/foods.ts                         EDITORIAL_FOOD_SEED + composed FOOD_SEED
shared/knowledge/index.ts                         compose relationships; 3 new validator rules
server/lib/canonical-foods-gate.ts                RENAMED from canonical-foods-importer.ts; all writes removed
server/cli/graduate-canonical-foods.ts            NEW — replaces cli/import-canonical-foods.ts
server/tests/test-knowledge-food-ownership.ts     NEW — 24 checks, enforces one writer
server/tests/test-knowledge-registry.ts           MVF bar over the composed seed; provenance checks
scripts/know2-graduate-imported-foods.ts          NEW — the one-time graduation emitter
package.json                                      import:canonical-foods → knowledge:graduate;
                                                  + test:knowledge-food-ownership (also in `npm test`)

server/cli/import-canonical-foods.ts              DELETED (retired writer CLI)
scripts/nk6o-rebind-legume-nutrients.ts           DELETED (completed repair; held a reference to the writer)
scripts/nk6o-verify.ts                            DELETED (as above)
scripts/nk6p-predict-partials.ts                  import path only
scripts/nk6j-validate-batches.ts                  comment only
```

No schema change. No migration. No route change. No capability, binding, or assistant.

---

## SUGGESTIONS (observed, evidence attached, not implemented — do not action without approval)

1. **`knowledge_foods.category` holds two vocabularies, and the registry filters on it.** The editorial 264 use
   13 display categories (`Vegetables`, `Healthy fats`, `Fruit`); the graduated 346 use 27 raw draft enums
   (`beverage_or_infusion` ×28, `offal_or_animal_bone` ×25, `plain_starch_or_pasta` ×23, `dairy` ×56 — note
   `dairy` vs the editorial `Dairy`). `nutrition-knowledge-registry.ts:44` filters `eq(knowledgeFoods.category, …)`,
   so **no graduated food is reachable under any editorial category**, and `/api/knowledge/categories` returns
   40 categories where a user would expect 13. The importer's `mapFoodCategory()` only maps 13 draft enums and
   passes the rest through raw (`return mapping[c] || c`). Converging them is editorial work. This is the
   largest remaining Principle 1 exposure in the domain.

2. **KNOW1 SUGGESTION 2 (`plant-protein`) is now the only thing between this domain and 100% convergence.**
   38 rows: 36 editorial + 2 (`lentils`, `oats`) inherited from the importer. It is also the cause of the two
   standing `test-food-report-adapter` failures.

3. **The draft corpus contains ten duplicate canonical slugs across batches** — `chickpeas`, `lentils`,
   `live-yoghurt`, `chicken-hearts`, `chicken-liver`, `duck-liver`, `cottage-cheese`, `greek-yoghurt`,
   `mascarpone`, `ricotta` — each appearing in two files with different alias sets. Two candidates for one
   identity is a Candidate-stage duplication the gate cannot resolve for you; it should be de-duplicated at
   source before the remaining batches are promoted.

4. **`extractFoodIdentity()` returns `scientificName`, `plantFamily` and `countsToDiversity`, none of which are
   columns of `knowledge_foods`.** Drizzle discarded them silently on all 346 inserts. The gate no longer
   relies on an insert to drop them, but the drafts do carry plant-diversity policy that this table cannot
   hold — and `shared/canonical/foods.ts` already owns it. Worth deciding whether the graduation should
   populate the canonical store instead of discarding the field.

5. **SoT Register Domain 1 says "Foods covered: 188."** It is 610. NK1's coverage audit is stale in the same
   direction (KNOW1 SUGGESTION 3, unchanged). Both are governing documents; correcting a factual count in them
   is a small, safe amendment that someone should approve.

6. **Only 44 of 362 `canonical_food` rows carry a `knowledgeFoodSlug`.** 610 knowledge foods now exist. The
   bridge between canonical identity and knowledge identity is 12% connected, so most of this newly-visible
   knowledge cannot reach `buildFoodReport`. That gap is now the binding constraint on Food Intelligence
   coverage, and it is larger than anything KNOW2 touched.
