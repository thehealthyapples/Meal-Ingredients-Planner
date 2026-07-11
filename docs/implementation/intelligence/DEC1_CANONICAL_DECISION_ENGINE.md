# DEC1 — Canonical Decision Engine — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Type:** 🟡 AMBER — code + docs; runtime ordering/clamping behaviour proven byte-identical (golden-identity tested); one additive telemetry capture (the sealed DeliveryDecision)
**Source investigation:** `docs/investigations/intelligence/DEC1_CANONICAL_DECISION_ENGINE.md`
**Governing document created:** `docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md`

---

## ROLLBACK PLAN — protection & identifiers

**Rollback identifier (the one to quote): `dec1-pre-implementation-20260709`.**

| Item | Value |
|------|-------|
| **Rollback tag (identifier)** | **`dec1-pre-implementation-20260709` → commit `0c9af8c`** (HEAD at implementation start) |
| Dirty-tree snapshot branch | `snapshot/dec1-pre-implementation-20260709` → commit `4587abb` (full pre-DEC1 working tree captured via temp index, never touching the working tree — carries all prior uncommitted workstreams exactly as found, **including untracked files**) |
| Earlier boundary (investigation) | tag `dec1-pre-investigation-20260709` → commit `f85121e`; branch `snapshot/dec1-pre-investigation-20260709` → `d147cb1` |
| Working tree | Intentionally dirty — prior uncommitted workstreams (ATTN1, COACH1, COMP1/2, KNOW4/5, LEARN1, PLAN1) and the HOUSE2 doc restructure present throughout; only the files in §2 were touched by DEC1 |
| Rollback (modified files) | `git checkout snapshot/dec1-pre-implementation-20260709 -- <path>` for each modified file in §2 |
| Rollback (new files) | delete the five new files in §2 (`git rm` if committed) |

**Rollback path PROVEN (2026-07-10, recovery session)** — non-destructively, in a throwaway `git worktree` checked out at the snapshot, never touching the working tree:

- the snapshot **does** carry untracked files (`shared/attention/index.ts` present) → it is a complete restore point, not a tracked-files-only stub;
- the DEC1 new files are **absent** from it (`shared/attention/decision.ts`, `server/tests/test-dec1-decision-engine.ts`) → they are genuinely new;
- the retired duplicates are **alive** in it (`MAX_OPPORTUNITY_LIMIT` ×2, `interface OpportunityEvidence`, `interface NoticeEvidence`) and **absent** from the current tree (0 hits each) → retirement is real and reversible;
- worktree removed afterwards; working tree untouched throughout.

---

## 1. WHAT WAS IMPLEMENTED

DEC1 as specified by the investigation's Phases 0–2, resolving its four open questions as recommended (Q1: no relocation — designation by documentation; Q2: `shared/attention/decision.ts`; Q3: capture at delivery moments only; Q4: guidance/proposal caps join the budget table, documentation only):

**D1 — Designation (Phase 0, governance).** OD1's Opportunity Delivery Framework is now the platform's canonical Decision Engine: governing document `THA_DECISION_ENGINE_ARCHITECTURE.md` created and indexed in the architecture README (Intelligence Governance) + History; two rows added to the SoT Register Appendix A (Decision mechanics; Decision Engine); the framework's own header states the designation, the pipeline, and the D5 boundaries. No file was renamed or relocated (Principle 8 — zero churn).

**D2 — Converged pure mechanics (Phase 1).** New reference module `shared/attention/decision.ts` (pure, zero-I/O, Principle 5 — the exact class of `shared/attention/index.ts`): `orderByAttention` (canonical stable multi-key sort — attention first, caller tie-breakers next, arrival last), `clampWithCriticalExemption` + `clampLimit` (A3-exempt budget clamp, `[1, MAX]` normalisation), `dedupeById`, `EvidenceCitation`, and the one delivery budget pair `DELIVERY_DEFAULT_LIMIT = 10` / `DELIVERY_MAX_LIMIT = 30`. Adopted by all three former owners **with their local copies retired in the same changeset**:

| Retired duplicate | Was | Now |
|---|---|---|
| FI4 local sort + clamp | `opportunity-engine.ts` `prioritizeOpportunities` body | delegates to `orderByAttention` + `clampWithCriticalExemption` |
| FI4 clamp constants | `DEFAULT/MAX_OPPORTUNITY_LIMIT` | shared pair |
| OD1 local sort + clamp | `framework.ts` `prioritiseAndGroup` body | shared mechanics + OD1's own two tie-breakers (LEARN1 learning rank, COACH1 seen flag) |
| OD1 clamp constants | `DEFAULT/MAX_LIMIT` | shared pair |
| Notice local dedupe + sort | `notice-engine.ts` `applySilenceRules` body | `orderByAttention(dedupeById(...))` + its own cap |
| 3 evidence types | `FoodOpportunityEvidence`, `OpportunityEvidence`, `NoticeEvidence` interfaces | aliases of the one `EvidenceCitation` (export names preserved — zero consumer churn) |

The Notice Engine's `MAX_NOTICES_PER_MOMENT = 2` cap deliberately stays where it is (INT20 — the Silence Rules are a consumer of the mechanics, never a subordinate of the Decision Engine), and it keeps its intentional difference: no critical exemption on the presentation-edge cap.

**D3 — Sealed DeliveryDecision (Phase 2, BEH1 pattern).** `sealDeliveryDecision` (pure, deterministic — same inputs, same record, same reasoning sentences) seals every delivery moment inside `collectOpportunities`: per-producer contributions, complete suppression accounting by rule (muted / lifecycle / budget — arithmetic closes exactly), learning influence (copied verbatim from LEARN1's already-computed influence), requested vs applied budget, criticals admitted outside the budget (A3), persistence counts, the fixed ordering basis, and an operator-facing reasoning trail. Capture follows BEH1's discipline — the engine seals, the capability handler records: one `delivery-decision` observation per `report`, at the single choke point every consuming surface passes through (the COACH1 notices route reaches `report` through `intelligencePlatform.handle()`, so it is covered without a second capture point). `delivery-decision` was added to the closed observation taxonomy (fourteenth kind; capture point documented in the union). The record is never serialised onto the wire result and **nothing reads it back** — asserted by source-scan tests.

**D4 — Budget doctrine.** Documented as a table in the governing document (delivery 10/30, notices 2, guidance 2, proposals 4, resolver 4, FI3 20 — each with owner, seam, rationale). Documentation-first, per the investigation; no typed runtime table.

**D5 — Hard boundaries.** Stated in the governing document and the framework header, and enforced by source-scan tests: the Decision Engine imports no domain Selection engine (Planner scoring, COMP1, substitutions), no evidence gate, no permissions/ConfirmationTier, no Behaviour Engine, no intent resolver. Nothing was absorbed — Planner scoring, Food Comparison verdicts, Evidence Confidence, Attention assignment, Confirmation tiers, voice and intent routing all keep their existing owners, untouched.

**Explicitly NOT implemented** (investigation Phases 3–5 — separately gated, out of DEC1's mission scope): producer enrolment beyond `food-intelligence`, domain-map/diet-vocabulary hygiene (Phase 4), cooldown/quiet-period pacing (Phase 5), and any `DecisionEngine.decide()` for domain candidates (explicitly rejected).

## 2. FILES

**New (5):**
- `shared/attention/decision.ts` — the one canonical Decision mechanics module
- `docs/architecture/THA_DECISION_ENGINE_ARCHITECTURE.md` — governing document
- `server/tests/test-dec1-decision-engine.ts` — golden-identity + mechanics + boundary + seal suite (49 assertions)
- `docs/implementation/intelligence/DEC1_CANONICAL_DECISION_ENGINE.md` — this record
- *(tag + snapshot branch, per Rollback Protection)*

**Modified (9):**
- `server/intelligence/opportunity-delivery/framework.ts` — designation header; shared-mechanics adoption; `ProducerContribution`/`DeliveryDecisionInput`/`DeliveryDecision`/`sealDeliveryDecision`; per-producer accounting in `collectFromProducers`; bundle carries the sealed `decision` (optional in the type only for test-port honesty; always sealed by `collectOpportunities`, including the empty moment)
- `server/intelligence/food-intelligence/opportunity-engine.ts` — shared-mechanics adoption; evidence alias; local sort/clamp/constants retired
- `server/intelligence/conversation/notice-engine.ts` — shared-mechanics adoption; evidence alias; local dedupe/sort retired; cap stays
- `server/intelligence/handlers/opportunity-delivery-handler.ts` — the one `delivery-decision` capture point (fire-and-forget, exception-isolated; wire result unchanged)
- `server/intelligence/observation/observation-engine.ts` — `delivery-decision` added to the closed taxonomy
- `server/intelligence/index.ts` — exports `sealDeliveryDecision` + the three new types
- `shared/attention/index.ts` — one stale header sentence updated (the "three sort functions stay layer-independent" note now records the DEC1 convergence)
- `server/tests/test-intelligence-observation-telemetry.ts` — taxonomy count 13 → 14 + the new kind asserted
- `package.json` — `test:dec1-decision-engine` registered and added to the `test` chain (after ATTN1)

## 3. VERIFICATION

**Golden identity (the core claim: behaviour unchanged unless explicitly intended).** `test-dec1-decision-engine.ts` embeds the pre-DEC1 implementations of all three functions verbatim (frozen from the snapshot branch) as oracles and sweeps seeded generated inputs — all four attention levels, criticals, learning ranks (both directions), seen sets, duplicate ids, limits from degenerate (−3, 0) through DEFAULT and MAX to beyond (100):

- FI4 `prioritizeOpportunities`: **780/780 cases byte-identical**
- OD1 `prioritiseAndGroup` (ordering AND grouping): **720/720 cases byte-identical**
- Notice `applySilenceRules`: **480/480 cases byte-identical**

The single intended behavioural delta is additive telemetry: one `delivery-decision` observation per `report`. The wire result is asserted byte-compatible (`opportunities`/`grouped`/`trust`/`source` only).

**Suites (all green):** the new DEC1 suite (49 passed) plus the full pre-existing chain — including `attn1-attention-platform` (29), `intelligence-opportunity-delivery-binding` (50), `intelligence-notice-engine` (46), `intelligence-food-opportunity-binding` (40), `learn1-household-learning` (72), `coach1-proactive-coaching` (71), `intelligence-behaviour-decision` (115), `intelligence-observation-telemetry` (75) — via `npm test`. `npx tsc --noEmit` holds at exactly the 192 pre-existing baseline errors (benchmark/script files); zero new.

> **Correction (2026-07-10, recovery session).** This line previously recorded `intelligence-observation-telemetry` as **77**. Re-run on the unchanged tree it reports **75 passed, 0 failed**. The original figure was a transcription error in this report, not a regression: the suite is green, the `delivery-decision` taxonomy assertion is present, and the taxonomy count assertion (13 → 14) holds. Corrected rather than left standing.

**Full-chain re-verification (2026-07-10, recovery session).** `npm test` run end-to-end on the recovered tree: **exit 0, 52 suites green, zero failures.** `npx tsc --noEmit` → **192** lines, exactly the documented pre-existing baseline.

**Manual verification (real platform, real DB).** A throwaway user was created directly in the DB, `intelligencePlatform.handle({capabilityId: "opportunity-delivery", verb: "report"})` invoked exactly as the COACH1 route does, then cleaned up (cascade verified):

- `outcome.status: ok`; wire result keys exactly `grouped,opportunities,source,trust`; no decision leaked
- exactly **one** `platform_observations` row, `kind = delivery-decision`, `outcome = no-producer-reached` (a household-less user honestly degrades), metadata carrying the sealed record: `collected: 0`, `delivered: 0`, `appliedLimit: 10`, `orderingBasis: ["attention","learning","seen","arrival"]`, reasoning `"No producer contributed this moment — the bundle is honestly empty. Nothing was suppressed by decision."`
- dev server boots clean with the modified modules; `GET /api/intelligence/companion/notices` alive (401 unauthenticated, as designed). Full authenticated route drive was not possible (registration closed — private beta); the platform-level invocation above is the identical code path the route calls.

**Pre-existing, not introduced by DEC1** (verified identical on the snapshot branch): the `[ObservationEngine] record failed ... platform_observations_user_id_fkey` console notice in `test-intelligence-food-opportunity-binding.ts` (fake test user ids vs the real durable store; capture is exception-isolated by design).

## 4. ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — no entity keys touched; opportunity ids unchanged.
☑ One owner per fact — decision mechanics went from three owners to one
  (shared/attention/decision.ts); the Decision stage gained its named owner
  (OD1's framework, by designation). No fact gained a second owner.
☑ No duplicate entities — the mechanics module is a reference module
  (Principle 5), not an entity; DeliveryDecision is an observation, not a store.
☑ No duplicate ownership — the reverse: 3 sorts → 1, 2 clamp pairs → 1,
  3 evidence types → 1, retired in this changeset and grep-asserted retired
  (test §3).
☑ No duplicate state — no new table; opportunity_deliveries unchanged; the
  sealed record rides the existing platform_observations pathway.
☑ Extends existing architecture — ATTN1's reference-module pattern, OD1's
  pipeline, BEH1's sealed-decision pattern, the INT17/INT20/INT21
  one-seam-one-owner series. Nothing built beside an existing pattern.
☑ Progressive enrichment where appropriate — N/A (not a knowledge entity);
  producer degradation discipline unchanged.
☑ Honest gaps over fabricated information — strengthened: suppression is now
  accounted per rule, the empty moment seals an honest statement, clamped
  limits are disclosed in the reasoning, and no decision is fabricated for
  bundles the engine did not assemble.
☑ No permanent synchronisation bridge — convergence deleted copies.
☑ Evolution over replacement — every replaced artifact is named above with
  its successor; no rename/relocation churn (Q1 resolved as recommended).
```

```
AI ARCHITECTURE COMPLIANCE
✓ Uses the canonical Intelligence Platform — producer fetch and the COACH1
  route stay on intelligencePlatform.handle(); no new path.
✓ Uses the Capability Registry — capture lives in the registered
  opportunity-delivery handler; no unregistered execution.
✓ Uses the Intent Engine — unchanged; routing decisions untouched (D5).
✓ Reuses existing business services — the engine consumes producer output;
  no domain logic re-implemented or absorbed (D5, source-scan asserted).
✓ Does not create another assistant — no.
✓ Does not duplicate conversation state — notices stay unpersisted; the
  DeliveryDecision is operator telemetry, never conversation state.
✓ Registered capabilities only / permission-aware access — unchanged;
  caller-scoped reads; A7 confirmation ladder untouched.
✓ Produces honest gaps rather than fabricated knowledge — see checklist above.
```

```
DOMAIN IMPACT
=============
Domain affected: Decision (cross-cutting Intelligence stage)
Declared SoT: THA_DECISION_ENGINE_ARCHITECTURE.md (governance) +
  server/intelligence/opportunity-delivery/framework.ts (runtime) +
  shared/attention/decision.ts (pure mechanics) — registered in the SoT
  Register Appendix A
New store created? NO (reference module + one new observation kind on the
  existing platform_observations pathway)
Existing store extended? NO (no schema change)
Consumer created? NO new consumer; three existing consumers converged
```

## 5. TRUST CHECK

- **Could this mislead the user?** No user-facing output changed — proven, not asserted (golden identity + wire-shape assertions). The change makes silent suppression *accountable* to operators.
- **Could this fabricate certainty?** No. The seal records only arithmetic of steps actually taken; the axes stay disjoint (attention never re-derived, confidence never consulted — source-scan asserted).
- **Is anything guessed but shown as real?** No. An unreachable producer is absent from the record (never guessed at); the empty moment states itself honestly.
- **What happens if the system is wrong?** If a layer's sort ever genuinely needs to diverge, the golden-identity suite makes that a deliberate, tested act; rollback is two commands (see Rollback Protection).
- No architectural duplication introduced: **YES** — 3+2+3 duplicates retired.
- No new source of truth created for an owned fact: **YES** — one ownerless mechanism gained its first owner.
- Runtime behaviour altered: **only** the additive `delivery-decision` observation; everything else byte-identical by test.

**Architecture Convergence Status (Decision domain):** canonical owner **named** (was: NONE). Mechanics duplicates converged this workstream: 3 sorts, 2 clamp pairs, 3 evidence types = **8 of the investigation's 13 counted duplicates (62%)**. Remaining 5 (3 domain-mapping tables, ≥2 per-surface Rule E1 enforcements) are Phase 4 scope, documented and unstarted — honest gap, not silent omission. Next milestone: Phase 3 (second producer enrolment, product-gated).

## 6. MANUAL VERIFICATION — HOW TO REPEAT

1. `npx tsx server/tests/test-dec1-decision-engine.ts` — 49 assertions, incl. 1,980 golden-identity cases.
2. `npm test` — full chain green.
3. `npx tsc --noEmit 2>&1 | wc -l` — 192 (pre-existing baseline, benchmark/script files only).
4. Live: authenticate, `GET /api/intelligence/companion/notices`, then as an admin `GET /api/intelligence/observation/recent?days=1` — one `delivery-decision` row per notices call, metadata carrying counts + reasoning. (Rows also appear in the Workbench by-kind and export views; a bespoke summariser is deferred until operator need arrives.)
5. Rollback proof (non-destructive): `git worktree add --detach <tmp> snapshot/dec1-pre-implementation-20260709`, confirm `shared/attention/decision.ts` is absent and `MAX_OPPORTUNITY_LIMIT` / `interface OpportunityEvidence` / `interface NoticeEvidence` are present, then `git worktree remove --force <tmp>`.

> **Note on the fire-and-forget seal.** The `delivery-decision` observation is recorded *unawaited* (telemetry never blocks the user's report). A probe that queries `platform_observations` immediately after `handle()` returns will legitimately see **zero rows** — it is racing the write, not observing a defect. Poll for up to ~1s. This cost the recovery session a false alarm and is recorded here so the next reader does not repeat it.

## 7. DEFINITION OF DONE

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Shared pure decision mechanics exist in exactly one module | ✅ | `shared/attention/decision.ts` — pure, zero-I/O, imports only the attention vocabulary |
| 2 | Duplicate sort / clamp / evidence helpers retired | ✅ | 3 sorts → 1, 2 clamp pairs → 1, 3 evidence types → 1; grep-asserted retired (suite §3); duplicates alive in snapshot, 0 hits in current tree |
| 3 | OD1 designated canonical Decision Engine | ✅ | `THA_DECISION_ENGINE_ARCHITECTURE.md` created, indexed in architecture README (Intelligence Governance + History); SoT Register Appendix A rows; framework header states the designation |
| 4 | Evidence → Attention → Decision → Action boundaries enforced | ✅ | suite §4 — five source-scan boundary tests: no domain Selection engine, no evidence gate, no permissions/`ConfirmationTier`, no Behaviour Engine, no intent resolver |
| 5 | Sealed `DecisionRecord` using the BEH1 pattern | ✅ | `sealDeliveryDecision` (pure, deterministic); engine seals, handler records; one `delivery-decision` observation per `report`; **nothing reads it back** (suite §5, source-scan asserted) |
| 6 | Golden-identity tests prove unchanged behaviour | ✅ | 1,980 cases byte-identical against frozen pre-DEC1 oracles: FI4 780/780, OD1 720/720, Notice 480/480 |
| 7 | Tests run and green | ✅ | DEC1 suite 49/49; `npm test` **exit 0, 52 suites, 0 failures**; `tsc --noEmit` at the 192 baseline |
| 8 | Rollback path proven | ✅ | Rollback Plan above — proven in a throwaway worktree, working tree untouched |
| 9 | No second decision system created | ✅ | No `DecisionEngine.decide()` for domain candidates; designation by documentation, zero relocation churn |
| 10 | No unrelated refactoring | ✅ | Scope Lock below — DEC1's footprint diffed against the snapshot and confirmed to be exactly the 14 files in §2 |

## 8. DATA IMPACT

| Question | Answer |
|---|---|
| New table / store created? | **NO.** `shared/attention/decision.ts` is a pure reference module (Principle 5), not a store. |
| Existing schema changed? | **NO.** Zero migrations. `platform_observations` and `opportunity_deliveries` are structurally untouched. |
| New data written at runtime? | **YES — one additive row per delivery moment.** A `delivery-decision` observation on the existing `platform_observations` pathway (`kind` is a `text` column governed by a closed application-level taxonomy, so a fourteenth kind needs no DDL). |
| Is that row read back by anything? | **NO.** Operator-facing telemetry only. Asserted by source-scan test: the Decision Engine never imports the Observation Engine, and the handler has no read API. Telemetry is never an input to behaviour (BEH1's non-negotiable). |
| Does it reach the wire / the user? | **NO.** Wire result keys remain exactly `grouped, opportunities, source, trust` — asserted in test and re-confirmed live (§10). |
| PII / retention | The row is `user_id`-scoped and inherits the existing `platform_observations` retention and `ON DELETE CASCADE`. Verified live: deleting the user removed the observation with zero residue. |
| Volume | One row per `report` invocation, i.e. one per companion-notices fetch. Same order of magnitude as the existing `capability-invocation` rows (3 per call), so no new growth class. |
| Backfill required? | **NO.** Forward-only telemetry; absence of historical rows is honest, not a gap. |

## 9. SCOPE LOCK

**In scope, delivered:** the six approved items — shared pure decision mechanics; retirement of duplicate sort/clamp/evidence helpers; OD1 designated canonical Decision Engine; Evidence → Attention → Decision → Action boundaries; sealed `DecisionRecord` on the BEH1 pattern; golden-identity tests.

**Explicitly NOT absorbed** (each keeps its existing owner, untouched — enforced by the §4 boundary source-scans, not merely promised):

| Kept out | Owner it stays with |
|---|---|
| Planner scoring | Planner domain Selection (PLAN1) |
| Food Comparison verdicts | COMP1's verdict ladder |
| Evidence Confidence | `shared/knowledge/evidence.ts` gate — runs UPSTREAM, never consulted here (A5) |
| Attention assignment | Producer-assigned (ATTN1 invariant A1) — never re-derived |
| Confirmation tiers | `ConfirmationTier` / permissions (A7) — untouched |
| Behaviour / voice | Behaviour Engine, a downstream seam (INT21) |
| Intent routing | Intent resolver — a different decision family |

**Deferred, not silently dropped** (investigation Phases 3–5, separately gated): producer enrolment beyond `food-intelligence`; domain-map / diet-vocabulary hygiene (Phase 4); cooldown / quiet-period pacing (Phase 5); any `DecisionEngine.decide()` for domain candidates (explicitly rejected).

**No unrelated refactoring — verified, not asserted.** The working tree carries several other uncommitted workstreams. Diffing the tree against `snapshot/dec1-pre-implementation-20260709` shows six further files differing (`companion-actions.ts`, `uplift-read-handler.ts`, `routes.ts`, `benchmark/bundle.ts`, `benchmark/expectations.ts`, `shared/knowledge/foods.ts`); every one is a **HOUSE2 doc-path comment fix** (`docs/implementation/X.md` → `docs/implementation/<workstream>/X.md`) belonging to the repository-restructure workstream, not to DEC1. Likewise `test-intelligence-food-opportunity-binding.ts` and `test-intelligence-opportunity-delivery-binding.ts` show as modified against `HEAD` but are **byte-identical to the snapshot** — they were already dirty before DEC1 began. DEC1 touched exactly the 14 files in §2 and nothing else.

> **Report location.** This report lives at `docs/implementation/intelligence/DEC1_CANONICAL_DECISION_ENGINE.md`, not the pre-HOUSE2 `docs/implementation/DEC1_CANONICAL_DECISION_ENGINE.md`. `REPOSITORY_CONVENTIONS.md` §4 requires implementation reports to be filed by workstream, and `.engineering/scripts/repo-structure-verify.sh` mechanically fails on loose files at `docs/implementation/`. The `intelligence/` path is the compliant one.

## 10. USER ACCEPTANCE EVIDENCE

Re-established live on **2026-07-10** (recovery session) against the real platform and the real database — not copied from the original run. A single throwaway user was created, the platform invoked on the **identical code path the COACH1 notices route uses** (`intelligencePlatform.handle({capabilityId: "opportunity-delivery", verb: "report"}, intelligencePlatform.contextFor(user))`), then cascade-deleted.

| Acceptance criterion | Observed |
|---|---|
| The report succeeds for a real caller | `outcome.status = ok` |
| The user-facing payload is unchanged | wire keys exactly `grouped, opportunities, source, trust` |
| The sealed record never leaks to the user | `decision` absent from the wire result |
| Exactly one decision is sealed per delivery moment | **1** `delivery-decision` row (alongside the pre-existing 3 `capability-invocation` rows) |
| A household-less user degrades honestly, not falsely | `outcome = no-producer-reached`; `collected=0, delivered=0` |
| The budget is disclosed, not silently applied | `requestedLimit=10`, `appliedLimit=10` |
| The ordering basis is stated | `["attention","learning","seen","arrival"]` — attention first, as the invariant requires |
| The empty moment states itself honestly | *"No producer contributed this moment — the bundle is honestly empty. Nothing was suppressed by decision."* |
| The record carries the full accounting | keys: `collected, delivered, producers, reasoning, appliedLimit, orderingBasis, newlyPersisted, requestedLimit, suppressedByMute, criticalDelivered, suppressedByBudget, acknowledgedDelivered, suppressedByLifecycle, learning` |
| Verification leaves no trace | cleanup residue `users=0 observations=0 deliveries=0` |

The one intended behavioural delta — the additive `delivery-decision` observation — is therefore confirmed in production code paths, and the "behaviour unchanged" claim is confirmed both statically (1,980 golden-identity cases) and dynamically (wire shape byte-compatible under live invocation).

## 11. RECOVERY RECORD (2026-07-10)

DEC1 was interrupted after its two doc commits (`0c9af8c` investigation, `678b1ae` implementation) landed but **before its code was committed**. Recovery findings:

- **Nothing was lost.** All 14 DEC1 files were present in the working tree. Per this repository's established pattern, the code rides the dirty tree under snapshot-branch protection (ATTN1's `shared/attention/index.ts` is untracked for the same reason). Nothing was restarted or overwritten.
- **Rollback protection already existed** and did not need creating: tags `dec1-pre-implementation-20260709` / `dec1-pre-investigation-20260709` and their two snapshot branches. It was *proven* rather than assumed (see Rollback Plan).
- **Every substantive claim in this report was independently re-verified**, not taken on trust: the retirements, the boundaries, the seal, the golden identity, the typecheck baseline, the full chain, and the live acceptance run.
- **One inaccuracy found and corrected:** the telemetry suite figure (77 → 75). No regression; a transcription error in the report.
- **No architecture conflict, ownership uncertainty, schema need, or new store requirement** surfaced. No STOP condition was triggered.
