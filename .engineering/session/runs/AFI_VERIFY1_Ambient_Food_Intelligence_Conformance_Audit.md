
# Session: AFI_VERIFY1_Ambient_Food_Intelligence_Conformance_Audit

| Field | Value |
|---|---|
| **Session ID** | `AFI_VERIFY1_Ambient_Food_Intelligence_Conformance_Audit` |
| **Rollback ID** | `rollback/AFI_VERIFY1-ambient-food-intelligence-conformance-audit-20260718` |
| **Start time** | 2026-07-18 |
| **Current stage** | Complete |

## Rollback
| Item | Value |
|---|---|
| Tag | `rollback/AFI_VERIFY1-ambient-food-intelligence-conformance-audit-20260718` → `7bfad50c` (annotated) |
| Working tree at start | **Dirty — NOT MINE.** Sibling session + AFI1/AFI2/AFI3–5 uncommitted work. Do NOT stash, do NOT commit. |

## Objective
READ-ONLY conformance audit of the completed Ambient Food Intelligence platform.
**NO IMPLEMENTATION.** Deliverable is
`docs/investigations/intelligence/AFI_VERIFY1_AMBIENT_FOOD_INTELLIGENCE_CONFORMANCE_AUDIT.md`
with overall score, findings, evidence, follow-on work, production readiness.

## Checkpoints
- [x] Rollback tag created + resolved (`7bfad50c`); session registered
- [x] Evidence gathering (generators / surfaces / companion / tests / duplication)
- [x] Analysis + scoring
- [x] Audit document written

## Outcome — overall 6.6/10
Coverage 7.0 · Consistency 7.5 · User value 6.0 · Production readiness 6.0.
Verdict: READY for the four live domains, with reservations. No implementation performed.

## Confirmations (all PASS)
- ONE Observation → Insight → Recommendation pipeline — one registered producer
  (`OPPORTUNITY_SOURCES`, framework.ts:285-287).
- ONE owner per opportunity type — 11 types, 11 generators, closed 4-member domain union
  (opportunity-engine.ts:201).
- NO duplicate recommendation logic — `phraseNotice` projects the producer's own
  `suggestedAction` with a cosmetic prefix only (behaviour-engine.ts:258-283, 142-146).
  Ranking/dedupe/clamp mechanics live once in shared/attention/decision.ts.
- Uncited recommendations IMPOSSIBLE — all 11 push sites attach non-empty evidence[];
  Rule E1 drops uncited notices anyway (notice-engine.ts:343-344).
- AI architecture — no model in the advice path; generation is deterministic and
  rule-based. Nothing can hallucinate a recommendation.

## Key findings (evidence in the audit doc)
1. **CRITICAL — the `nutrition` limb is dead at FOUR layers simultaneously.** Types produced
   (household-nutrition.ts:632/649/666) but: `assembleHouseholdNutrition` never called in
   production; `nutrition` absent from all four registries; `HouseholdNutritionPanel` never
   mounted anywhere (grep-verified). Resolves the orphaned-type, dead-code AND
   UI-without-intelligence findings in one decision.
2. **HIGH — double clamp.** Engine clamps to 10 (opportunity-engine.ts:1032) BEFORE the
   delivery layer's LEARN1 re-ranking (framework.ts:592-598). Shared mechanics, so not
   duplicated logic — a SEQUENCING error. Empirically (AFI3_5, live): 30 generated → 10
   delivered; 20 pantry observations never reached LEARN1, Pantry surface rendered empty
   for a stocked pantry.
3. **HIGH — client layer has no tests at all.** No runner/config/test files under client/.
   `DOMAIN_LABEL` (FoodOpportunityCard.tsx:36) is the ONE registry of four with zero
   coverage — and it is the last step before the household's eyes.
4. MEDIUM — Companion voices `suggestedAction` but DROPS `explanation`; notice cap (2) has
   no domain-diversity rule.
5. MEDIUM — two live duplicate-observation pairs: higher-rated vs less-processed (same
   shopping line); pantry-unused vs cookbook-cookable-now (same pantry rows).
6. MEDIUM — Food detail / Diary / Analyser have no ambient surface. No server→client gap:
   every DOMAIN_SURFACE row has a client mount.
7. LOW — two pantry readers disagree on `defaultHave` (:353-361 vs :620).

## Recommendations (highest value only)
R1 retire the nutrition limb (2 of its 3 types duplicate live observations) ·
R2 pass the full candidate set to OD1 so LEARN1 ranks everything · R3 assert every
`FoodOpportunityDomain` member has a row in all four registries (server-side, no client
runner needed) · R4 build the explainer surface then wire CBK2/PANTRY1 (~1,274 dead
assertion lines) · R5 voice the "why" + decide the cap-diversity question.
Explicitly NOT recommended: ambient surfaces on Diary/Analyser — no generator produces
observations belonging there; mounting UI before intelligence is the §4.1 failure inverted.

## Next action
None — audit complete, read-only. HEAD unchanged at `7bfad50c`; nothing committed.
Only two files created: the audit document and this run file.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
