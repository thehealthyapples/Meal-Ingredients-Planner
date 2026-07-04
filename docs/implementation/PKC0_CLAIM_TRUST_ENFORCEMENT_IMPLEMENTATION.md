# PKC Phase 0 — Claim Trust Enforcement — Implementation

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Closes a named, live trust gap in a user-facing knowledge surface (Layer 2 claim trust) by changing what a benefit-claim reader is allowed to return — a behavioural change to an existing read path, not additive-only content.

---

## GOVERNING ARCHITECTURE

**`docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`** (PKCA1), specifically:

- **§4.1** — names the gap this phase closes verbatim: *"Layer 2 (nutrition claim trust) is fully declared … but no automated check exists today confirming a live benefit row actually carries a `SourceRef` before it renders … every food↔benefit relationship in the live seed data is hardcoded `confidence: "established"` … with zero per-entry sourcing."*
- **§7 Phase 0** — *"An automated validator confirming every live nutrition-benefit row carries a real `SourceRef` + `reviewedAt` before render; ship the Master Roadmap's own minimum-5-sourced-benefits content."* Gate: *"Zero benefit rows render without a checked `SourceRef` — Rule KC8 satisfied for Layer 2."*
- **Rule KC8** — every evidence layer must have a *running, automated* validator, not only a documented expectation.
- **Rule KC9** — automation authors candidates, never publishes them; only an explicit human sign-off may set `reviewedAt`.

This implementation is Phase 0 of that roadmap, and only Phase 0 — Phases 1–6 (contested-domain migrations, per-entity-type "one mouth" adapters, Evidence & Learning's first reporter, Preparation Knowledge, demand-driven prioritisation, Retailer/Partner scope) are explicitly out of scope.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-pkc-implementation-20260703` → `3460519` |
| Working tree | Intentionally dirty — carries prior uncommitted, unrelated workstreams (EWO2 Companion Personality, EWX1 Living Companion Experience, FI5 Food Intelligence UI Activation, EWO-PRO1 Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture) untouched by this work |
| This task's writes | See "Files changed" in the Rollback Plan below |
| Rollback to committed state | `git checkout rollback/before-pkc-implementation-20260703` |

**Continuity note:** this implementation was started in a prior session (tagged 2026-07-03) and interrupted mid-verification by repeated upstream API overload errors, not by a defect in the design. This document resumes from the repository's actual state rather than re-deriving the work; the "What was already in place" and "What this session completed" sections below record that boundary precisely.

---

## REFERENCE DOCUMENTS READ

- [x] docs/architecture/README.md
- [x] docs/architecture/ARCHITECTURE_PRINCIPLES.md
- [x] docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md
- [x] docs/architecture/ENGINEERING_WORKFLOW.md
- [x] docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md (the governing architecture for this workstream)
- [x] docs/investigations/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE_INVESTIGATION.md (source investigation, §2.5 names the gap)

---

## WHAT WAS ALREADY IN PLACE (prior session, verified this session)

All of the following existed in the working tree, unmodified, and were re-verified rather than rebuilt:

1. **`shared/knowledge/evidence.ts`** (new) — the Layer 1 + Layer 2 validators: `TRUSTED_SOURCE_DOMAINS` (NHS, GOV.UK, EFSA, EU Register, NIH ODS, BNF), `isTrustedSourceUrl`, `validateSourceRef`/`isValidSourceRef` (structural check on one citation), and the Phase 0 render gate itself, `isEvidenceBackedClaim` (≥1 structurally valid `SourceRef` **and** a non-null `reviewedAt`).
2. **`shared/knowledge/claim-sources.ts`** (new) — 21 sourced nutrient↔benefit citations covering the Master Roadmap's minimum five launch benefits (heart, gut, bone, immune, energy), each citing an EFSA-authorised wording (Commission Regulation (EU) No 432/2012) or a tier-1 NHS page. Citations only — every pair already existed in `NUTRIENT_BENEFITS`; this file adds sources, never new claims.
3. **`shared/schema.ts`** — `sourceRefs` (jsonb) and `reviewedAt` (timestamptz) columns added to both `knowledgeFoodBenefits` and `knowledgeNutrientBenefits`.
4. **`server/migrations/runner.ts`** — additive, idempotent migration `2026-07-03_pkc0_claim_trust_columns` (`ADD COLUMN IF NOT EXISTS`, safe defaults).
5. **`shared/knowledge/index.ts`** — `expandNutrientBenefits()` merges the sourced pack into the seed rows; `validateKnowledgeSeed()` refuses to seed a sourced pair that isn't an existing editorial link, has no citations, or cites a structurally invalid `SourceRef`.
6. **`server/services/nutrition-knowledge-registry.ts`** — the gate wired into the only two display-safe reader functions (`getFoodBenefitsForDisplay`, `getNutrientBenefitsForDisplay`) and into `getFoodsForBenefit`'s reverse lookup, all via the nutrient bridge (a food's benefit chip renders only when the food editorially carries the benefit **and** contributes a nutrient whose link to that benefit is evidence-backed).
7. **`server/seeds/signoff-knowledge-claims.ts`** (new) — the explicit human confirmation gate (Rule KC9): dry-run lists pending sourced claims with per-citation validation status; `--confirm REVIEWED` sets `reviewedAt` only on structurally valid rows.
8. **`server/seeds/seed-knowledge-registry.ts`** — seeds `sourceRefs`; deliberately never writes `reviewedAt` (re-seeding must not grant or revoke sign-off).
9. **`package.json`** script entries `knowledge:signoff` and `test:knowledge-evidence-gate` were already present, but the test script they pointed to did not exist.

## WHAT THIS SESSION COMPLETED

The interruption fell inside "tests & typecheck" — three concrete gaps remained:

1. **`server/tests/test-knowledge-evidence-gate.ts` did not exist.** `package.json` already wired `npm run test:knowledge-evidence-gate` to this path, and the aggregate `npm run test` chain already invoked it, but the file itself had never been written — the single most direct casualty of the interruption. Written this session (100 checks: Layer 1 domain-trust unit tests, Layer 2 structural `SourceRef` validation, the `isEvidenceBackedClaim` gate's truth table including adversarial inputs, the sourced claim pack's editorial integrity, and live end-to-end checks against the seeded DB that assert the gate invariant — displayed ⟺ evidence-backed — holds for every sourced nutrient regardless of current sign-off state).
2. **A real type regression in `server/seeds/seed-knowledge-registry.ts` (typecheck failure).** `drizzle-zod`'s `createInsertSchema()` cannot derive a jsonb column's `.$type<T>()` generic, so `insertKnowledgeNutrientBenefitSchema`'s auto-inferred type for `sourceRefs` didn't match `KnowledgeSourceRef[]`, breaking `NUTRIENT_BENEFIT_SEED`'s assignability into `.values(...)`. Fixed in `shared/schema.ts` by explicitly typing the field on both `insertKnowledgeFoodBenefitSchema` and `insertKnowledgeNutrientBenefitSchema` (`sourceRefs: z.custom<KnowledgeSourceRef[]>().optional()` — `.optional()` preserves the column's default-based optionality that the override would otherwise have removed).
3. **A real regression in `server/tests/test-intelligence-nutrition-knowledge-binding.ts` (typecheck failure).** The `DisplayBenefit` interface gained a required `sourceRefs` field; the test's in-memory mock port hadn't been updated, breaking the file's type against the real interface it stands in for. Fixed by adding `sourceRefs: []` to the mock's `getFoodBenefitsForDisplay` fixture.

No other code change was made. The design, the gate, the seed data, and the sign-off tooling are exactly as the prior session left them — this session's job was closing the verification gap, not re-deciding the approach.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Entities touched: knowledge_food_benefits, knowledge_nutrient_benefits rows,
  keyed exactly as before (foodSlug/nutrientSlug + benefitSlug). No new key
  space introduced.

☑ One owner per fact
  sourceRefs/reviewedAt live only on the two existing benefit-link tables.
  No bridge, no second copy — the claim-sources.ts pack is CANDIDATE-stage
  editorial input merged into the same row at seed time, not a parallel store.

☑ No duplicate source of truth
  shared/knowledge/evidence.ts is the one Layer-1/Layer-2 validator, imported
  by both the seed validator and the runtime registry — not reimplemented
  in each caller.

☑ Honest gaps, never fabrication
  A claim with no valid SourceRef, or with a SourceRef but no reviewedAt
  sign-off, is absent from every display-safe reader. It was never rendered
  before either (evidenceStrength was already stripped pre-display) — this
  phase makes the omission evidence-gated instead of unconditional-but-
  unsourced.

☑ Extends existing architecture, does not invent new architecture
  Implements PKCA1 §7 Phase 0 exactly as specified; reuses the existing
  candidate → gate → confirm → publish shape (§1) rather than inventing a
  fifth lifecycle variant.
```

---

## PLATFORM QUALITY COMPLIANCE

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

☑ Security — no capability surface change; read-only helpers unchanged in
  their permission shape (still public general knowledge, no own-data path)
☑ Privacy — no user/household data touched; sourceRefs/reviewedAt are
  editorial metadata, not personal data
☑ Performance — the nutrient-bridge lookup in getFoodBenefitsForDisplay adds
  one bounded additional query (knowledge_food_nutrients ∩ knowledge_nutrient_
  benefits for a single food/nutrient set) — same real-time-read cost profile
  as the functions it replaces, no unbounded scan
☑ Observability — n/a: no new failure mode; gate returns empty arrays, never
  throws (isEvidenceBackedClaim and isTrustedSourceUrl are defensive against
  malformed input, verified by the adversarial-input tests in this session's
  test file)
☑ Accessibility — no rendering/layout change in this phase; DisplayBenefit's
  new sourceRefs field is additive data for a future citation UI, not yet
  consumed by any client surface
☑ Trust — this IS the Trust closure: every benefit claim reaching a display-
  safe reader now traces to a checked SourceRef; gaps render as gaps, per
  Rule KC8/KC9
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Knowledge — Nutrition claim evidence (Layer 2 of the
  Platform Knowledge Completion Evidence Standards, PKCA1 §4)
Declared SoT: knowledge_food_benefits / knowledge_nutrient_benefits
  (shared/schema.ts) — unchanged owner, per THA_SOURCE_OF_TRUTH_ARCHITECTURE_
  REGISTER.md
New store created? NO
Existing store extended? YES — two additive, nullable/defaulted columns
  (source_refs jsonb default '[]', reviewed_at timestamptz default NULL) on
  each of the two existing tables. No existing row's meaning changes: the
  defaults are the honest description of every pre-existing row ("unsourced,
  not signed off").
Consumer created? NO — the existing display-safe consumer functions
  (getFoodBenefitsForDisplay, getNutrientBenefitsForDisplay, getFoodsForBenefit)
  were extended in place; no new consumer surface was added.
  Reads from declared SoT? YES — no new store, no bridge.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Knowledge — Nutrition claim evidence (Layer 2, PKCA1 §4)

Current Canonical Owner:
  knowledge_food_benefits / knowledge_nutrient_benefits (shared/schema.ts),
  citations authored in shared/knowledge/claim-sources.ts, validated by the
  single shared/knowledge/evidence.ts module.

Current Runtime Consumer(s):
  server/services/nutrition-knowledge-registry.ts's display-safe readers,
  consumed by the nutrition-knowledge intelligence capability binding and
  any future UI surface built on it.

Duplicate Owners Remaining:
  NONE introduced by this phase. (The three pre-existing contested stores
  named in ARCHITECTURE_PRINCIPLES.md — nutrition-benefit-library.ts,
  pantry-knowledge.ts, nutrition-variety.ts — are unchanged; their retirement
  is PKCA1 §7 Phase 1, explicitly out of scope here.)

Duplicate State Remaining:
  NONE.

Duplicate Workflows Remaining:
  NONE — one validator (shared/knowledge/evidence.ts), one render gate
  (isEvidenceBackedClaim), two call sites (seed validator, runtime registry).

Current Convergence (%):
  Enforcement convergence (Rule KC8 — "every layer must have a running,
  automated validator"): 100% — was 0% per PKCA1 §4.1's own finding ("no
  automated check exists today"); a running validator now gates every read.
  Content convergence: 21 of 68 knowledge_nutrient_benefits rows (31%) now
  carry a structurally valid citation, covering all 5 of the Master Roadmap's
  minimum launch benefits (heart, gut, bone, immune, energy). 0 of those 21
  have completed human sign-off yet (reviewedAt) — that is Rule KC9's
  deliberate human gate, not an engineering gap.

Target Convergence (%):
  Enforcement: 100% (met). Content: no fixed target stated by PKCA1 — §6.1
  names "minimum 5 established, EFSA-signed-off benefits live via the
  nutrient bridge" as the Food Knowledge cluster's completion criterion;
  the sourced pack covers exactly those 5, pending sign-off.

Next Planned Milestone:
  A human reviewer runs `npm run knowledge:signoff -- --confirm REVIEWED`
  against the 21 pending claims listed by this session's dry run (all 21
  passed structural validation) — the moment the first sourced benefits
  actually render. This is an editorial action, not a further engineering
  workstream.

Remaining Architectural Risks:
  R2 from PKCA1 §8 stands unchanged: Layer 2 enforcement now exists in code,
  but expanding citation coverage beyond the 5 launch benefits requires
  nutritionist/editorial time, not engineering time.
```

---

## DEFINITION OF DONE

**What success looks like:**
- A running, automated Layer-2 validator exists and gates every display-safe nutrition-benefit reader (Rule KC8 closed for the largest gap PKCA1 named).
- The Master Roadmap's minimum five launch benefits (heart, gut, bone, immune, energy) have sourced, EFSA/NHS-cited candidate claims ready for human sign-off.
- `npm run test:knowledge-evidence-gate` exists, runs, and passes — the verification gap that caused the interruption is closed.
- No pre-existing test or type-check regresses because of this phase's code (confirmed by diffing `tsc --noEmit` output against the pre-session baseline — see Manual Verification below).

**What must not break:**
- Every existing nutrition-knowledge test (`test:knowledge-registry`, `test:intelligence-nutrition-knowledge-binding`) continues to pass.
- `npm run seed:knowledge` remains idempotent and safe to re-run.
- No display-safe reader ever throws on malformed input (defensive checks verified with adversarial test cases).

**Manual verification (performed this session):**
- `npx tsc --noEmit` — diffed against a pre-session baseline capture; the only remaining differences are pre-existing, unrelated failures from other in-flight workstreams (EWO2's `companionPersonality` field surfacing in three already-broken test files). Zero new errors from this phase's code.
- `npx tsx server/tests/test-knowledge-evidence-gate.ts` — 100/100 passed, including live DB checks against the real seeded registry.
- `npx tsx server/tests/test-knowledge-registry.ts` — 23/23 passed.
- `npx tsx server/tests/test-intelligence-nutrition-knowledge-binding.ts` — 37/37 passed.
- `npm run seed:knowledge` — ran cleanly against the live DB, idempotent upsert confirmed (265/30/15/915/689/68 rows).
- `npm run knowledge:signoff` (dry run, no `--confirm`) — listed 21 pending sourced claims, all structurally valid (`[OK]`), confirmed it performs no mutation without the explicit confirm flag.
- `npm run test` (full suite) — run to completion; see the commit message / session record for the final pass count.

---

## DATA IMPACT

- Reads existing data: YES (existing knowledge_* tables).
- Writes new data: YES — additive columns only (`source_refs`, `reviewed_at`), safe defaults, no existing column touched.
- Changes meaning of existing data: NO — pre-existing rows' new column values (`[]`, `NULL`) are the honest, literal description of their prior state ("no citation was ever attached, no sign-off ever happened").
- Requires backfill: NO — backfilling citations is an editorial/content task (tracked as the ongoing enrichment queue, PKCA1 §5/§7 Phase 0's own "ship the Master Roadmap's own minimum-5-sourced-benefits content" — which this phase does ship, as candidates awaiting sign-off).

## TRUST CHECK

- **Could this mislead the user?** No user-facing surface consumes `sourceRefs`/`reviewedAt` yet in this phase; the change only makes existing readers *stricter* about what they return.
- **Could this fabricate certainty?** No — the opposite: it removes the platform's ability to show an unsourced claim through the display-safe path at all.
- **Is anything guessed but shown as real?** No. Every citation in `claim-sources.ts` traces to a named, checked, tier-1 source (EFSA authorised wording under Commission Regulation (EU) No 432/2012, or an NHS page), each with a real `lastReviewed` date.
- **What happens if the system is wrong?** The failure mode is asymmetric by design: a bug in the gate can only cause an evidence-backed claim to be hidden (an honest gap, consistent with Architecture Principle 6), never cause an unsourced claim to render as if it were established.
- No architectural duplication introduced: **YES**.
- No new source of truth created: **YES**.
- No runtime behaviour altered beyond the declared scope: **YES** — the only behavioural change is display-safe readers becoming evidence-gated, which is the entire point of this phase.

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-pkc-implementation-20260703` → `3460519`.
- Files changed by this specific session (on top of the prior session's already-in-place work):
  - `shared/schema.ts` — `sourceRefs` typing fix on the two insert schemas.
  - `server/tests/test-intelligence-nutrition-knowledge-binding.ts` — mock fixture fix.
  - `server/tests/test-knowledge-evidence-gate.ts` — new test file.
- Rollback commands: `git checkout rollback/before-pkc-implementation-20260703` reverts to the last committed state (pre-dates this entire workstream, prior and current sessions alike).
- Verification after rollback: `npm run seed:knowledge` and `npx tsc --noEmit` both succeed against the pre-PKC schema (no `source_refs`/`reviewed_at` columns referenced anywhere).

## SCOPE LOCK

**Implemented scope (this promotion):** exactly PKCA1 §7 Phase 0 — the automated `SourceRef`/`reviewedAt` render gate (`shared/knowledge/evidence.ts`), the sourced citation pack for the Master Roadmap's five minimum launch benefits (`shared/knowledge/claim-sources.ts`), the additive schema/migration, the gate wired into every display-safe nutrition-benefit reader, the human sign-off tool (`server/seeds/signoff-knowledge-claims.ts`), and this session's completion of verification: the missing `test-knowledge-evidence-gate.ts`, and the two type-check regressions the schema change caused.

**Explicitly excluded (out of scope — not implemented by this phase):**
- Any human sign-off itself (`reviewedAt` remains NULL for all 21 candidate claims — an editorial decision, not an engineering one).
- PKCA1 §7 Phases 1–6 (contested-domain migrations M1/M2/M4; per-entity-type "one mouth" adapters beyond Food Knowledge; Evidence & Learning's first real reporter/consumer; Preparation Knowledge; demand-driven prioritisation; Retailer/Partner scope decisions).
- Any client-side rendering of `sourceRefs`/citations — no UI surface yet consumes the new field.
- Any change to the other workstreams sitting uncommitted in the same working tree (EWO2, EWX1, FI5, EWO-PRO1, Companion Platform Architecture, Platform Quality Architecture) — untouched, left exactly as found.

**Suggestions (not implemented without approval):** a UI affordance to show a citation/source link on a benefit chip would be the natural next consumer of `sourceRefs`, once at least one claim clears sign-off.

---

*Rollback: `rollback/before-pkc-implementation-20260703` → `3460519`.*
