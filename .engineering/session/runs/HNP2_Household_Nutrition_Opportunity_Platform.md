# Session: HNP2_Household_Nutrition_Opportunity_Platform

| Field | Value |
|---|---|
| **Session ID** | `HNP2_Household_Nutrition_Opportunity_Platform` |
| **Rollback ID** | `rollback/HNP2-household-nutrition-opportunity-platform-20260719` → `772eb6ed` (HEAD)<br>`rollback/HNP2-snapshot-20260719` → `5518caeb` (full tree: tracked + untracked) |
| **Start time** | 2026-07-19 |
| **Current stage** | Complete |

## Objective
(Revised by owner 2026-07-19.) Investigate `shared/nutrition/household-nutrition.ts`,
separate business capability from orchestration, converge the capability into the canonical
Opportunity Platform, and retire duplicate ownership. No new engine, no new scoring system,
no rebuild of obsolete architecture.

*Original objective, superseded: enrol a second producer in `OPPORTUNITY_SOURCES` through
DEC1 §7. Rejected on evidence — see the Design Decision below and §3.3 of the report.*

## Baseline established (verified, not assumed)
- `OPPORTUNITY_SOURCES` holds exactly ONE producer (`food-intelligence`) — `framework.ts:286`.
- Adapter is still named `adaptFoodIntelligence` (`framework.ts:242`) — HHP2's generalisation
  to `adaptOpportunityReport` was retired with it.
- `DOMAIN_SURFACE` has no `nutrition` row (`framework.ts:293-301`) → nutrition would fall
  through to `FALLBACK_SURFACE = "floating"`.
- HHP2 attempted this exact work, recorded "Complete" while wired to nothing, and was
  **RETIRED** 2026-07-17 by P0 Food Intelligence Recovery. Its capability, binding, handler,
  read port and both tests are deleted. P0 §"REMAINING BLOCKERS" states enrolment remains
  legitimate and must proceed "through their own gates, with the reviewed enrolment they
  skipped the first time." **HNP2 is that gated re-do.**

## Files being modified
**Created (2)**
- `server/tests/test-hnp2-nutrition-balance-opportunity.ts` — 43 assertions
- `docs/implementation/nutrition/HNP2_HOUSEHOLD_NUTRITION_PLATFORM.md` — the report

**Modified — production (6)**
- `shared/nutrition/household-nutrition.ts` — revived ONLY `nutrition-balance-gap`;
  header corrected (the MAT1 "no production caller" claim is now false)
- `server/intelligence/food-intelligence/opportunity-engine.ts` — `nutrition` domain,
  the type, `planner-week` subject entity, the thin generator, meals read hoisted
- `server/intelligence/opportunity-delivery/framework.ts` — `DOMAIN_SURFACE.nutrition`
- `server/intelligence/conversation/notice-engine.ts` — `nutrition-opportunity` category
  + `DOMAIN_TO_CATEGORY` row
- `shared/attention/index.ts` — `OPPORTUNITY_DOMAIN_LABELS.nutrition`
- `client/src/pages/plant-diversity-page.tsx` — the `nutrition` AmbientIntelligence mount

**Modified — tests/config (2)**
- `server/tests/test-mat1-registry-conformance.ts` — domain scope lock 4 → 5
- `package.json` — `test:hnp2-*` registered in the `npm test` chain

## Architecture map findings (verified first-hand, not taken on a document's word)
- `shared/nutrition/household-nutrition.ts` — the pure scoring core — is **dead code**:
  561 lines, 0 non-test callers. Only `WEEKLY_PLANT_TARGET` is live (3 client imports).
- Its I/O orchestrator `server/lib/household-nutrition-assembler.ts` — **ABSENT**.
- Its UI `client/src/components/HouseholdNutritionPanel.tsx` — **ABSENT**.
- `GET /api/household-nutrition` — **ABSENT** (zero hits in `routes.ts`).
- The core's **own opportunity limb was DELETED by MAT1** (§3.3), as duplicating live logic.
  The pure core was kept deliberately, pending the enrolment decision.
- Four-place domain registration invariant (`opportunity-engine.ts:190-208`), enforced by
  `test-mat1-registry-conformance.ts`. That test also asserts NO orphan labels
  (`:148-149`) and pins `FOOD_OPPORTUNITY_DOMAINS.length === 4` (`:109`).
- `/api/intelligence/food-opportunities` sits in `KNOWN_UNGATED`
  (`test-prod6-safety-gate-convergence.ts:271`), ratcheted `length <= 43` (`:369`).
- Evidence: an opportunity needs `EvidenceCitation[]` (internal owner trace) — achievable.
  A *health claim* needs `KnowledgeSourceRef[]` + human `reviewedAt` — currently
  unachievable (0 chips render platform-wide; 0 named human sign-offs).

## Checkpoints
- [x] `git status` confirmed — 44 dirty entries (NUTPLAN1/NUTPLAN2/KNOW2 sibling work)
- [x] Rollback tag created at HEAD and resolved
- [x] Full working-tree snapshot ref created (tag at HEAD alone protects none of the
      uncommitted work HNP2 builds on — the HHP2 lesson, applied)
- [x] Snapshot integrity verified (untracked file present; HEAD unmoved; tree still dirty)
- [x] Investigation complete — capability/orchestration separated (see Design Decision)
- [x] Implementation complete — 6 production files, 4 registries
- [x] `npx tsc --noEmit` — 88 baseline (clean worktree at rollback ref) → 88 after. Zero new
- [x] `test:hnp2-nutrition-balance-opportunity` — 43 passed, 0 failed
- [x] `test:mat1-registry-conformance` — 25 passed, 0 failed (nutrition walks all 4 registries)
- [x] `test:household-nutrition` — 54 passed, 0 failed
- [x] Registered in the `npm test` chain
- [x] Implementation report written
- [x] `npm test` full chain — 94 suites green, then halted on a PRE-EXISTING failure
      (`test:benchmark-conversation-isolation`, 24/2 — identical at the rollback ref in a
      clean worktree). HNP2's suite ran INSIDE the chain and passed there.
- [x] The 11 suites skipped by the halt run individually — all green, incl.
      `prod6-safety-gate-convergence` (158), `intelligence-notice-engine` (65),
      `nutplan1` (25), `nutplan2` (35), `restriction-safety` (75)
- [x] `test:time3-p8-t5-convergence` — 60 passed (the "stays retired" guards still hold)
- [x] Generated test artifact (`data/alternatives/ws9-alternatives-report.json`, a
      timestamp) reverted — not part of this change

**Last checkpoint:** Complete. Implementation, tests, verification and report all done.

## Verification findings worth keeping
- The MAT1 domain scope lock fired at the TYPE level (`TS2367: '5' and '4'`) before any test
  ran — the gate worked exactly as designed.
- `test-household-nutrition` §7 (every number must be a named denominator THA owned) caught
  the reinstated `STRONG_ENOUGH = 70`. It was inherited from the retired limb, never
  justified, and is NOT revived. Its only effect was silence when exactly one component was
  missing — a gap a household would want named.
- HNP2's own first-draft fixture was wrong and the engine was right: `{fruits:2,vegetables:4}`
  is 2 of 5 components, not 3. Renamed `TWO_OF_FIVE` with the reasoning recorded.
- `test-cbk2-intelligent-cookbook` fails — PRE-EXISTING, reproduced at the rollback ref in a
  clean worktree. One of P0's seven orphaned tests. Not absorbed.

## DESIGN DECISION (2026-07-19) — mission revised by owner; blockers B1/B2 cleared

Revised mission: converge business capability into the canonical Opportunity Platform;
Scope Lock adds **"do not recreate obsolete architecture"**, which settles B1 — the retired
assembler/panel/route are NOT rebuilt.

**The investigation's central finding.** MAT1 §3.3 retired a 3-type opportunity limb.
Two types were retired **as duplicates of live FI4 observations**:
- `nutrition-plant-diversity-gap` → duplicate of `planner-meal-uplift`
- `nutrition-planning-gap` → duplicate of `planner-empty-day`

The third, **`nutrition-balance-gap`**, was never called a duplicate. Verified independently:
`grep` for `wholeGrains|herbsSpices|oliveOil|VARIETY_COMPONENT|varietyComponentsPresent`
over `opportunity-engine.ts` returns **nothing** — no live FI4 type observes which of the
five variety components a week is missing. Corroborating residue: the now-dead `joinOr`
helper (`household-nutrition.ts:549`) had exactly one caller — the balance opportunity's
`suggestedAction`. **HNP2 therefore enrols exactly ONE type.**

**Preserve (business capability):** the pure scoring core — `scoreDimensions`,
`computeHouseholdNutritionScore`, weights/bands/confidence, `varietyComponentsPresent`,
`WEEKLY_PLANT_TARGET`, the grammar helpers, and the trust rules (null≠0, renormalised
weights, `dimensionsCounted`).

**Do NOT recreate (obsolete orchestration):** `server/lib/household-nutrition-assembler.ts`,
`client/src/components/HouseholdNutritionPanel.tsx`, `GET /api/household-nutrition`.
Guarded by `test-time3-p8-t5-convergence.ts:303,307` — those guards must stay green.
Orchestration instead uses the canonical capability pattern
(`server/intelligence/handlers/*-read-port.ts`), which is existing architecture.

**Contested-count discipline (NUTPLAN2 §10 R3):** the producer must pick ONE plant
derivation and say which. Choosing `plantGroupsForIngredientLines` (parses first), not
`mealPlantGroups` (raw lines), and recording the choice in the module header.

## Next action
None — HNP2 is complete. Report:
`docs/implementation/nutrition/HNP2_HOUSEHOLD_NUTRITION_PLATFORM.md`.
Open items are recorded there as G1–G5; none blocks this workstream.

## Blockers

**ALL CLEARED.** B1/B2 were resolved by the owner's revised mission (2026-07-19), whose
Scope Lock line "do not recreate obsolete architecture" settled B1 directly. B3 dissolved
once the design put `nutrition` INSIDE `FOOD_OPPORTUNITY_DOMAINS` (no orphan label is
possible when the domain is a member). B4 stands as recorded gap G3 in the report — HNP2
does not widen `KNOWN_UNGATED`, but nor does it close it. History preserved below.

**B1 — 🔴 [CLEARED] The mission's premise did not hold as stated.**
The mission says "connect the existing household nutrition engine" and locks scope to
"only activate and converge the existing architecture". But the pieces that would be
connected do not exist: the assembler, the panel and the route are all absent, and the
core's **opportunity limb was deliberately deleted by MAT1**. Enrolment therefore requires
**authoring new code** — a rebuilt assembler and a rebuilt opportunity limb — which reads
against "do not create a new opportunity engine / another nutrition scoring system".
Whether that authoring is in scope is the owner's call, not this session's.

**B2 — 🟠 The repo already scoped this work, under a different name and gate.**
`NUTPLAN2` §10 R4 parks this exact decision: *"wiring it is new capability... It needs an
owner's decision."* The roadmap names it **NUTPLAN4**, not HNP2. Proceeding as "HNP2"
would create a second identity for one planned workstream.

**B3 — 🟠 MAT1 conformance blocks the label registration.**
Registering `nutrition` in `OPPORTUNITY_DOMAIN_LABELS` fails the orphan-label assertion,
because that map is checked against FI4's `FOOD_OPPORTUNITY_DOMAINS`. With one producer
those sets coincided; with two they cannot. The domain registry must be generalised to be
producer-agnostic — tractable, but it is a change to a governing conformance gate.

**B4 — 🟠 Safety ratchet.** `/api/intelligence/food-opportunities` is a recorded ungated
food surface. Routing nutrition opportunities through it widens a known gap; the ratchet
means that entry must be *removed* (the route gated), not added to.

**Standing risk:** P0 blocker #2 — the server has no adoption register — means nothing
structurally prevents a repeat of HHP2. HNP2's tests must therefore prove enrolment through
the REAL registry, never by source-scan and never by calling the handler directly. Both are
exactly how HHP2's test manufactured a false pass.
