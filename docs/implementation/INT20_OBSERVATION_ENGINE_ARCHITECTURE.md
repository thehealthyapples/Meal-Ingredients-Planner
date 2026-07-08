# INT20 — Observation Engine Architecture

> **Status: COMPLETE.** This workstream designs the Observation Engine as the next canonical
> Intelligence Platform component and establishes its governing architecture at
> `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md`. **Documentation only** — no code,
> no schema, no runtime, no API changes, no business logic changes. The design governs machinery
> that already exists (EWX1's `observation-engine.ts`, OD1's Opportunity Delivery Framework,
> FI4's Food Opportunity Engine, EL1's Evidence & Learning platform) rather than proposing any
> new engine, and defines the rollout that activates the dormant canonical chain and converges
> the live bypasses.

**Classification:** Intelligence Governance → Observation (design record for the governing document)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**EWO risk:** 🟢 GREEN — documentation-only; the two documents (plus one README index row) are the only writes
**Governing document created:** `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md`
**Governing documents complied with:** TIP1, TIP2, TIP3, CPA1, INT17 (Context Composition Engine), `ARCHITECTURE_PRINCIPLES.md`, `ENGINEERING_WORKFLOW.md`

---

## 0. ROLLBACK PROTECTION — created before any file was modified

| Item | Value |
|------|-------|
| Git status at start | **Clean working tree**, branch `int1-intelligence-platform` |
| HEAD at start | `fbc0a3e` — "Document INT19 — Context Composition Engine baseline and Context View rollout" |
| **Rollback tag created** | **`rollback-int20-pre-observation-engine`** → `fbc0a3e` |
| Action on rollback | `git checkout rollback-int20-pre-observation-engine -- .` (or delete the two new documents and revert the one README row) |
| Code modified | **None** |
| Schema modified | **None** |
| Runtime modified | **None** |

---

## 1. REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point — Architecture Bootstrap)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1 — the spine, Intent Engine pipeline, security model)
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2 — closed 20-verb taxonomy, capability classes, confirmation tiers; confirmed OD1's `report`/`review`/`approve`/`delete` mapping the design relies on)
- [x] `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1 — the Observation Engine's governing frame: five Companion responsibilities, the §0 invariant, §5.2's observation seam, §7's two-presentation-channels ruling, §11 G6's deferred `companion_observation_log`)
- [x] `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17 — the sibling budget engine; its §7 non-negotiables shape the mutual prompt/notice boundary in the new document's §5.3)
- [x] `docs/implementation/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md` (the delivery lifecycle, `OPPORTUNITY_SOURCES`, `opportunity_deliveries` ownership, honest exclusions the rollout inherits)
- [x] Code read/verified before designing: `server/intelligence/conversation/observation-engine.ts` (the 7 categories, 5 fact kinds, Silence Rules, verbatim-copy contract), `server/intelligence/opportunity-delivery/{framework,delivery-store}.ts`, `server/intelligence/food-intelligence/opportunity-engine.ts` (FI4's three opportunity types), `server/intelligence/evidence-learning/{framework,evidence-learning-store}.ts` (EL1 thresholds and confirmation gates), `shared/companion-interaction.ts`, `server/intelligence/conversation/behaviour-engine.ts` (`phraseObservation`), `server/tests/test-intelligence-observation-engine.ts`, `shared/schema.ts` (the three pipeline tables), and `server/routes.ts` / `client/src` wiring checks (see §3)

---

## 2. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — no new entity. An Observation is a transient,
  request-scoped projection; every id it carries is the producer's own
  (OD1's `${capabilityId}:${producerId}` convention, unchanged).
☑ One owner per fact — the design's §3 walks every fact in the pipeline to
  exactly one existing owner; the engine's only ownership is the Silence
  Rules (a decision, not data).
☑ No duplicate entities / ownership / logic — the document designs ZERO new
  machinery; it names the existing owners canonical and schedules the two
  live bypass channels (home/planner intelligence assemblies, WX7 pantry
  block) for convergence rather than tolerating them silently.
☑ Runtime consumes one assembled model — observation producers are read only
  via `intelligencePlatform.handle()` on registered capabilities.
☑ No fabricated knowledge — verbatim-or-absent rule for producer content;
  honest empty sets; notability gates; unmapped domains dropped, never
  guessed (§2.3, §6 of the design).
☑ No permanent synchronisation bridge — nothing new is persisted; the only
  persistent pipeline fact remains OD1's delivery lifecycle, already owned.
☑ Evolution over replacement — the design elevates CPA1 §4.3's existing
  component to component-level governance (the same move INT17's document
  made for the gateway's context seam); it replaces and retires nothing.
```

**AI ARCHITECTURE COMPLIANCE**

```
✓ Uses the canonical Intelligence Platform — the design binds observation
  sourcing to `intelligencePlatform.handle()` exclusively (performed by the
  calling route; the engine stays zero-I/O).
✓ Uses the Capability Registry — producers are registered capabilities
  (`opportunity-delivery`, `evidence-learning`); the engine itself is ruled
  NOT a capability, per CPA1 §7, and must not become one.
✓ Uses the Intent Engine — acting on any observation is an ordinary
  confirmed intent; no verb, class, or confirmation-tier exception exists
  for observations (§5.1 of the design).
✓ Creates no second assistant, duplicates no conversation state — the
  ambient seam is outside the per-turn pipeline and writes nothing.
✓ Registered capabilities only, permission-aware — every read inherits the
  producer's own ownership scoping; the engine adds no read path.
✓ Honest gaps over fabricated knowledge — silence is a first-class outcome;
  the design forbids padding and "tip of the day" invention.
```

**Gate result: PASS.** No conflict with any governing document. The one factual tension found — CPA1 §5.2 describes the observation route as wired, while this branch has no such route — is recorded honestly in the design's §7.1 as dormancy, and OBS-P1 activates the seam exactly as CPA1 specifies rather than amending CPA1.

---

## 3. WHAT THIS WORKSTREAM DID

1. **Confirmed git status clean, created and reported the rollback tag** (`rollback-int20-pre-observation-engine` → `fbc0a3e`) before touching any file.
2. **Grounded the design in the live branch, not prior documents' claims.** Verified by direct search: no `GET /api/intelligence/companion/observations`, `/api/intelligence/food-opportunities`, or `/api/intelligence/learning-signals` route exists in `server/routes.ts`; `use-companion-observations.ts` has no consuming component; `FoodOpportunitiesPanel.tsx` / `LearningSignalsPanel.tsx` are rendered by no page. The canonical chain is code-complete but dormant. Meanwhile `/api/home/intelligence`, `/api/planner/weeks/:weekId/intelligence`, and the WX7 pantry-opportunities block are live notice channels bypassing OD1 governance — named as convergence debt.
3. **Authored the governing architecture** (`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`): mandate; the closed source taxonomy (what is observed, and what never is); the full ownership walk (who owns observations — the engine owns only the attention budget); the observation → opportunity → confirmed intent → evidence → confirmed learning-signal graduation ladder (how observations become recommendations); explicit integration contracts with the Intent Engine (§5.1), Capability Registry (§5.2), and Context Composition Engine (§5.3 — mutual prompt/notice exclusivity); the Silence Rules as guarantees; the honest current-state baseline; a six-phase gated rollout (OBS-P1 activate → OBS-P2 converge bypasses → OBS-P3 second producer → OBS-P4 learning-signal source → OBS-P5 optional cross-session log → OBS-P6 optional CCE-composed grounding); and ten non-negotiable hard stops.
4. **Indexed the document in `docs/architecture/README.md`** (Intelligence Governance table) at creation — per the standing lesson INT17's own index note records from `INTA1` §4.1, so the document is never invisible-by-navigation.
5. **Wrote this implementation record.**

---

## 4. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Intelligence Governance (documentation only).
Stores created/extended: NONE. No schema, code, or runtime change of any kind.
Consumers created: NONE.
Existing owners: all unchanged — FI4, OD1, EL1, EWX1, Behaviour Engine,
  shared/companion-interaction.ts each keep exactly the ownership they had.
```

---

## 5. TRUST CHECK

- **Could this mislead?** The design's current-state section was verified against the branch by direct search, including where it contradicts CPA1's description of live wiring — stated as dormancy with the evidence, not glossed.
- **Does it fabricate certainty?** No. Everything unbuilt is a named, separately gated rollout phase; nothing is authorised by the document itself.
- **Does it create a second owner of anything?** No. It assigns no new ownership except naming the already-existing Silence Rules as the engine's single canonical possession.

---

## 6. SCOPE LOCK

**Implemented scope (this task):** the governing architecture document, this implementation record, one index row in `docs/architecture/README.md`. Nothing else.

**Explicitly excluded (honest gaps, each its own future gated workstream — see design §8):** wiring any route or panel (OBS-P1); converging `/api/home/intelligence`, `/api/planner/.../intelligence`, or WX7 (OBS-P2); registering a second opportunity producer (OBS-P3); adapting EL1 signals (OBS-P4); any `companion_observation_log` table (OBS-P5); any Context View for observations (OBS-P6); retiring the orphaned `growth-insight` route (CPA1 §11 G2); resolving the `applySilenceRules` naming collision with `knowledge-assembly.ts`; back-filling the SoT Register for the pipeline's existing tables (pre-existing gap OD1 already named).

---

## 7. DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| `docs/architecture/README.md` read first | ✅ §1 |
| Git status confirmed before changes | ✅ clean tree at `fbc0a3e` |
| Rollback created and identifier reported | ✅ `rollback-int20-pre-observation-engine` → `fbc0a3e` |
| One canonical Observation Engine designed | ✅ design §0, §3, §9 |
| What is observed / who owns / how → recommendations / integrations defined | ✅ design §2 / §3 / §4 / §5 |
| No implementation, no business logic changes | ✅ documentation only (§4 above) |
| Both documents created | ✅ `THA_OBSERVATION_ENGINE_ARCHITECTURE.md`, this file |
| One governing architecture with a clear rollout path | ✅ design §8 (OBS-P1…P6) |

---

## FILES CHANGED

| File | Change |
|---|---|
| `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` | **New** — the governing architecture |
| `docs/implementation/INT20_OBSERVATION_ENGINE_ARCHITECTURE.md` | **New** — this record |
| `docs/architecture/README.md` | One index row added (Intelligence Governance table) |

---

*Rollback: `rollback-int20-pre-observation-engine` → `fbc0a3e`.*
