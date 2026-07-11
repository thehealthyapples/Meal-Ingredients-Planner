# PKC1 — Canonical Knowledge Convergence — Implementation

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** No runtime, schema, or route change. This phase verifies a code-level convergence that had already happened, and corrects three governance documents that had drifted out of sync with the actual codebase (Rule 7 catch-up). Rated AMBER rather than GREEN because it touches the platform's canonical ownership register — the document other workstreams read before deciding whether to build a new store — so an error here has downstream cost even though nothing executable changed.

---

## GOVERNING ARCHITECTURE

**`docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`** (PKCA1), specifically:

- **§7 Phase 1** — *"Complete the contested-domain migrations (M1/M2/M4) — Retire `nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts` — already named, scoped, and low-effort per the SoT Register."* Gate: *"Rule KC4 ('one mouth') satisfied for Food Knowledge — no domain currently violates it more visibly."*
- **Rule KC4** — one owner, one mouth: every knowledge entity type has exactly one owning store and exactly one runtime adapter permitted to render facts about it.
- **Rule KC8** — declared is not enforced; a rule with no running validator is a hope, not a guarantee.
- **§8 Risk R1/R3** — a future workstream invents a fifth pipeline variant, or treats "one mouth" as aspirational, because the docs it reads don't reflect the platform's actual current state.

Also read as background/precedent: `docs/implementation/knowledge/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md` (Phase 0, immediately prior), `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (the register PKCA1 §7 Phase 1 cites as already having named and scoped M1/M2/M4), `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (Principle 8, Domain Ownership Quick Reference).

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-pkc1-canonical-knowledge-convergence-20260704` → `ff3b2cf` |
| Working tree | Intentionally dirty — carries prior uncommitted, unrelated workstreams (EWO2 Companion Personality, EWX1 Living Companion Experience, FI5 Food Intelligence UI Activation, EWO-PRO1 Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture) untouched by this work |
| This task's writes | Documentation only — see Rollback Plan below |
| Rollback command | `git checkout rollback/before-pkc1-canonical-knowledge-convergence-20260704 -- <file>` per file, or full reset to the tag |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md`
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (the governing architecture for this workstream)
- [x] `docs/investigations/platform/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE_INVESTIGATION.md`
- [x] `docs/implementation/knowledge/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md` (Phase 0, immediately prior)
- [x] `docs/investigations/knowledge/M1_RETIRE_NUTRITION_BENEFIT_LIBRARY.md`
- [x] `docs/investigations/knowledge/M2_PANTRY_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/knowledge/M3_CANONICAL_DIETARY_RULES_CONVERGENCE_IMPLEMENTATION.md`
- [x] `docs/investigations/knowledge/M4_CANONICAL_DIVERSITY_GROUP_CONVERGENCE_IMPLEMENTATION.md`

---

## WHAT THIS PHASE FOUND

PKCA1 §7 names Phase 1's deliverable as retiring three specific files
(`nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts`) and its gate
as Rule KC4 ("one mouth") being satisfied for Food Knowledge. Before writing any code, this
phase verified the current, actual state of the repository against that gate — not the
state the governing documents claimed.

### Finding 1 — Phase 1's named targets were already retired, before PKCA1 was even written

All three files named in §7 Phase 1, plus a fourth closely-related duplication
(`dietRules.ts` existing as an identical copy in both `server/lib/` and `client/src/lib/`,
migration M3), were deleted and their consumers migrated in a single checkpoint commit,
`58c8b73` ("chore(wx7): rollback safety checkpoint before Pantry Intelligence"), dated
**2026-06-26**. `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` was promoted on
**2026-07-03** — over a week later — and its §7/§12 still describe these as unresolved:
*"Duplicate Owners Remaining (inherited, unchanged): The same three pre-existing contested
stores... this document does not resolve them, it sequences their resolution as Phase 1."*
That claim was already false at the moment it was written, because the investigation that
produced PKCA1 inherited the claim from `ARCHITECTURE_PRINCIPLES.md`'s Domain Ownership
table and `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`'s Phase 3/8 — neither of which had
been updated after M1–M4 landed, in violation of the register's own Rule 7 ("The SoT
Register Must Be Updated at Every Workspace").

Verified directly against HEAD (`ff3b2cf`), not against any document's claim:

```
$ git cat-file -e HEAD:client/src/lib/nutrition-benefit-library.ts   → GONE
$ git cat-file -e HEAD:client/src/lib/pantry-knowledge.ts            → GONE
$ git cat-file -e HEAD:client/src/lib/nutrition-variety.ts           → GONE
$ find . -iname "dietRules.ts"                                       → shared/dietRules.ts only
$ grep -rl "nutrition-benefit-library|pantry-knowledge|nutrition-variety" client server shared
                                                                       → zero hits (code); doc-only hits pre-fix
```

`health-benefits-model.ts` (the bridge M1's own doc flagged as "not yet retireable" because
`PantryExplore.tsx` still used it) now retains only a `HEALTH_DISCLAIMER` string constant —
its own header comment records this explicitly: *"After M1 convergence, all food knowledge
data is read from the WS0 Knowledge Registry... This file retains only the
`HEALTH_DISCLAIMER` constant."* `PantryExplore.tsx` itself no longer exists (deleted in the
same checkpoint, superseded by `PantryKnowledgeHub.tsx`). This is not a shadow knowledge
store under Rule 6 (SoT Register) — it is a display string, correctly excluded.

**Conclusion:** Rule KC4 is satisfied for Food Knowledge, Plant Diversity, and Dietary
Rules today. PKCA1 §7 Phase 1's gate is met — it was met before this phase started. This
phase's job was to verify that claim against the code (not assume it) and then correct the
three governance documents that had drifted, so a future workstream reading them does not
redo work that is already done (PKCA1's own Risk R1).

### Finding 2 — a real, currently-live "one mouth" gap, not named by any prior document

While tracing every current consumer of Food Knowledge (Rule KC4 verification requires
checking *every* consumer, not just the ones named in the retired-file audit), a second,
distinct adapter for the same fact type was found still active:

`shared/canonical/food-report-adapter.ts` (`buildFoodReport`, the adapter behind
`FoodReport.tsx`, `food-intelligence-assembler.ts`, `meal-intelligence-assembler.ts`, and
`connected-food-intelligence-assembler.ts`) reads food↔benefit facts **directly from the
raw editorial seed** (`FOOD_BENEFITS` in `shared/knowledge/relationships.ts`). It does not
call `isEvidenceBackedClaim`, does not check `sourceRefs`, and does not check `reviewedAt` —
the Layer-2 evidence gate PKC0 built one phase earlier. `server/services/nutrition-
knowledge-registry.ts`'s `getFoodBenefitsForDisplay`/`getNutrientBenefitsForDisplay` (the
functions PKC0 gated) are a *separate* adapter for the *same* underlying fact.

This means, today: the identical food↔benefit claim can render on the Food Report page with
zero sourcing and zero human sign-off, while the same claim is correctly hidden on
Pantry/Boost pending evidence and review. Two mouths, two trust guarantees, one fact —
exactly the failure mode Rule KC4 exists to prevent, and exactly the kind of gap PKCA1 §8
Risk R3 predicts ("a second narrator appears before the adapter is built").

**Why this is not fixed in this phase (scope decision, confirmed with the user before
proceeding):** `buildFoodReport` is deliberately synchronous and DB-free — it runs
identically in the client bundle (`FoodReport.tsx`, in-browser) and on the server (three
separate assemblers), by design, per its own header comment ("reads directly from the typed
seed constants (no DB round-trip), exactly as the resolver and variety modules do"). The
evidence gate's `reviewedAt` field is genuinely DB state, written only by the human sign-off
tool (`server/seeds/signoff-knowledge-claims.ts`) — it does not exist in the static seed
constants at all. Converging Food Report onto the evidence gate therefore requires either
(a) an API refactor so the client stops computing this in-browser, or (b) a data-model
change bringing reviewed status into the static seed. Both are real architectural decisions
with real behavioural consequences (some currently-shown benefits would disappear from Food
Report until reviewed) — not a same-day fix alongside a documentation-convergence phase.
This finding is named here, in full, specifically so a future PKC2 does not have to
rediscover it from scratch.

---

## WHAT THIS SESSION DID

No code, schema, or runtime change. Three documents were corrected to state the platform's
actual, verified-against-HEAD current state, replacing claims that had drifted stale:

1. **`docs/architecture/ARCHITECTURE_PRINCIPLES.md`** — Domain Ownership Quick Reference:
   - `Plant Diversity` row: `Contested — nutrition-variety.ts shadows` → `Authoritative — converged (M4, 2026-06-25; verified PKC1, 2026-07-04)`.
   - `Dietary Rules (pattern)` row: source updated `server/lib/dietRules.ts` → `shared/dietRules.ts`; status `Contested — identical copy in client/src/lib/` → `Authoritative — converged (M3, 2026-06-25; verified PKC1, 2026-07-04)`.
   - `Dietary Preferences (user)` row: **left unchanged** — genuinely still contested, out of scope (see below).

2. **`docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`** — the register PKCA1
   §7 Phase 1 itself cites as the source of the M1/M2/M4 scoping. Updated in place (original
   tables retained for historical record, each row annotated rather than deleted, per this
   register's own Rule 7 spirit — showing what changed, not erasing the record):
   - Domain 1 (Food Knowledge), Domain 4 (Plant Diversity), Domain 6 (Dietary Rules) status fields.
   - Phase 3 Duplications 1–3: marked ✅ RESOLVED with the resolving migration and date; Duplication 4 (Dietary Preferences) left open with an explicit "still genuinely open, out of scope" note.
   - Phase 4 Retirement Register: added a "PKC1 status" column confirming each recommended retirement actually happened.
   - Phase 5 Consumer Compliance Audit (Food Knowledge / Dietary Rules / Plant Diversity tables): every `NO`/`PARTIAL` verdict re-verified against current HEAD and updated to `YES` where the consumer now reads the converged source; `PantryExplore.tsx` marked deleted rather than non-compliant (it no longer exists to be non-compliant).
   - Phase 7 Launch Risk Review: rows 1–3 marked RESOLVED; row 4 (Dietary Preferences) left as genuinely still-open.
   - Phase 8 Migration Roadmap M1–M4: each marked ✅ COMPLETE with its implementation document cited.
   - "Final Question" / Exceptions table: updated from "NO" (3 open exceptions + 1 low-risk) to reflecting 3 of 4 resolved, 1 genuinely still open, plus the newly-named Food Report evidence-gate item.
   - Every edit that touches Food Knowledge also carries the Finding 2 note, so a reader of either document encounters it.

3. **This document** — created, recording the verification, both findings, and the scope
   boundary around Finding 2.

**Explicitly not touched:** `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`
itself. Consistent with PKC0's precedent (which also did not edit PKCA1), a promoted
governing architecture document is corrected by a successor governing document per its own
§11 ("corrected by a successor governing document"), not silently rewritten by an
implementation phase. This implementation document is that correction record for §7 Phase
1's gate status; PKCA1's own prose is left as the historical governance artifact it is.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity, key space, or identity touched. Documentation only.

☑ One owner per fact
  Verified (not assumed): Food Knowledge → WS0 Knowledge Registry only;
  Plant Diversity → shared/canonical/plant-classifier.ts only; Dietary Rules
  → shared/dietRules.ts only. Zero shadow files remain for any of the three
  domains named in PKCA1 §7 Phase 1.

☑ No duplicate source of truth
  This phase introduces none. It corrects three documents that were
  themselves describing duplication that no longer exists in code — i.e.
  it removes a documentation-level duplication of claims (stale vs true).

☑ Honest gaps, never fabrication
  Finding 2 (Food Report's evidence-gate bypass) is named explicitly, in
  full, rather than silently left for a future investigation to rediscover
  or silently patched without the user's sign-off on scope. Duplication 4
  (Dietary Preferences) is left exactly as contested as it genuinely is —
  not marked resolved to make the register look cleaner than it is.

☑ Extends existing architecture, does not invent new architecture
  Implements PKCA1 §7 Phase 1 exactly as scoped (M1/M2/M4, plus verifying
  the related M3). No new lifecycle, store, or adapter introduced.
```

---

## PLATFORM QUALITY COMPLIANCE

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

☑ Security — no capability surface touched.
☑ Privacy — no user/household data touched; documentation only.
☑ Performance — no runtime code touched; zero performance impact.
☑ Observability — n/a.
☑ Accessibility — n/a; no UI touched.
☑ Trust — this phase's entire value is a Trust action: it prevents a
  future workstream from either (a) redoing already-complete retirement
  work because the docs said it wasn't done, or (b) missing the one real,
  still-live trust gap (Finding 2) because no document named it. Both
  failure modes are exactly what PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md
  §8 Risks R1 and R3 warn against.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Knowledge (Nutrition), Plant Diversity, Dietary Rules —
  governance/documentation layer only, not the domains' runtime stores.
Declared SoT: unchanged — WS0 Knowledge Registry (Food Knowledge),
  shared/canonical/plant-classifier.ts → diversity_group (Plant Diversity),
  shared/dietRules.ts (Dietary Rules). This phase corrects the *documents*
  that declare these owners; it does not change the owners themselves.
New store created? NO.
Existing store extended? NO.
Consumer created? NO.
Consumer retired? NO — this phase only documents retirements that already
  happened (M1/M2/M3/M4).
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Knowledge (Nutrition), Plant Diversity, Dietary Rules — the three
  domains named in PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §7 Phase 1.

Current Canonical Owner:
  Food Knowledge: shared/knowledge/ → DB knowledge_* tables, via
    server/services/nutrition-knowledge-registry.ts (evidence-gated, PKC0).
  Plant Diversity: shared/canonical/plant-classifier.ts → diversity_group DB.
  Dietary Rules: shared/dietRules.ts.

Current Runtime Consumer(s):
  Food Knowledge: PlantDiversityReport.tsx, MealUpliftPanel.tsx,
    PantryKnowledgeHub.tsx, pantry-page.tsx (all via WS0 API); FoodReport.tsx
    and 3 server assemblers via food-report-adapter.ts (same seed data,
    NOT the evidence-gated reader — see Finding 2, unresolved by design in
    this phase).
  Plant Diversity: 6 consumers, all via shared/canonical/plant-classifier.ts.
  Dietary Rules: server + client, all via shared/dietRules.ts.

Duplicate Owners Remaining:
  NONE for the three domains named in PKCA1 §7 Phase 1 (Food Knowledge shadow
  stores, Plant Diversity keyword lists, Dietary Rules file copy) — all
  retired by M1/M2/M3/M4, verified against current HEAD by this phase.
  Dietary Preferences (users.dietPattern/dietRestrictions vs user_preferences)
  remains genuinely open — not named in PKCA1 §7 Phase 1, no migration
  scoped for it, correctly left untouched.

Duplicate State Remaining:
  NONE for the three in-scope domains.

Duplicate Workflows Remaining:
  One "one mouth" gap found, not a duplicate-workflow in the SoT Register's
  sense (no second data store) but a duplicate-adapter-with-different-trust-
  guarantee: food-report-adapter.ts vs nutrition-knowledge-registry.ts for
  the same food↔benefit facts (Finding 2). Named as a PKC2 candidate.

Current Convergence (%):
  Governance-naming convergence for PKCA1 §7 Phase 1's three named domains:
  100% (was already 100% in code as of 2026-06-26; documentation now
  correctly states this as of 2026-07-04 — 0% documented correctly before
  this phase, despite 100% code convergence already existing).
  Rule KC4 ("one mouth") convergence for Food Knowledge specifically: not
  100% — Finding 2 is a live, unresolved second mouth for benefit claims.

Target Convergence (%):
  100% Rule KC4 convergence for Food Knowledge, including Finding 2 — not
  committed to a phase number here; PKC2 (or a successor) is the natural
  next step per PKCA1 §7's own phase-gating discipline.

Next Planned Milestone:
  A PKC2 (or equivalently-scoped) phase that decides, with explicit user
  sign-off given the behavioural-change and refactor-shape implications,
  how Food Report's health-benefit rendering converges onto the same
  evidence gate PKC0 already built for Pantry/Boost.

Remaining Architectural Risks:
  Finding 2 (above) is the only load-bearing risk this phase surfaces.
  Duplication 4 (Dietary Preferences, SoT Register) remains a disclosed,
  low-risk, out-of-scope exception — unchanged by this phase.
```

---

## DEFINITION OF DONE

**What success looks like:**
- The three domains named in PKCA1 §7 Phase 1 (Food Knowledge shadow stores, Plant Diversity keyword counting, Dietary Rules file copy) are verified — against actual HEAD, not against any document's claim — to have zero remaining duplicate owners.
- `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` and `ARCHITECTURE_PRINCIPLES.md` state this correctly, closing the Rule 7 gap that let M1–M4's completion go undocumented for over a week across a governing-architecture promotion.
- A real, previously-unnamed "one mouth" gap (Finding 2) is named precisely enough that a future phase does not have to rediscover it.
- Duplication 4 (Dietary Preferences) is left exactly as contested as it genuinely is — no premature "resolved" claim.

**What must not break:**
- Nothing can — no code, schema, route, or data was touched.

**Manual verification (performed this session):**
- `git cat-file -e HEAD:<path>` for all three PKCA1 §7 Phase 1 files → confirmed absent.
- `find . -iname "dietRules.ts"` → confirmed exactly one file, `shared/dietRules.ts`.
- `grep -rl` across `client/`, `server/`, `shared/` for `nutrition-benefit-library`, `pantry-knowledge`, `nutrition-variety`, `getNutritionBenefit`, `listLibraryFoods`, `buildNutrientIndex`, `pantryItemMatchesQuery` → zero code hits (only stale doc references, now fixed).
- `git log --diff-filter=D --all -- <each path>` → confirmed the single deleting commit (`58c8b73`, 2026-06-26) for all three, and confirmed that commit is an ancestor of current HEAD (`git merge-base --is-ancestor 58c8b73 HEAD`).
- `git show 58c8b73` → confirmed the commit is a genuine checkpoint (not a revert/rollback of the retirement), with `PantryExplore.tsx` deletion and `PantryKnowledgeHub.tsx`/`MealUpliftPanel.tsx` modification consistent with M1/M2's own documented changes.
- Read `client/src/lib/health-benefits-model.ts` in full — confirmed it is now a single exported string constant (`HEALTH_DISCLAIMER`), not a knowledge store, consistent with Rule 6.
- Traced `buildFoodReport` (Finding 2) to all 5 call sites (`FoodReport.tsx`, `routes.ts`, `food-intelligence-assembler.ts`, `meal-intelligence-assembler.ts`, `connected-food-intelligence-assembler.ts`) and confirmed none pass through `isEvidenceBackedClaim`/`sourceRefs`/`reviewedAt`.

---

## DATA IMPACT

- Reads existing data: **NO** (documentation only; all verification was against Git history and static source files, not the running database).
- Writes new data: **NO**.
- Changes meaning of existing data: **NO**.
- Requires backfill: **NO**.

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. This phase's purpose is the opposite of misleading: it replaces stale governance claims with verified ones, and names a real, unfixed trust gap explicitly rather than letting a document imply the platform is more converged than it is.
- **Could this fabricate certainty?** No. Every "RESOLVED" marker added to the SoT Register cites the specific commit, migration document, and grep/git command that verified it — not an assertion.
- **Is anything guessed but shown as real?** No. Duplication 4 (Dietary Preferences) and Finding 2 (Food Report evidence-gate gap) are both left explicitly open, with the reasoning for why they remain open, rather than glossed over to present a fully-converged picture.
- **What happens if the system is wrong?** If a future audit finds a shadow consumer of the three retired files that this phase's grep missed, the correction is the same kind this phase itself performed on PKCA1 — a dated, cited update to the register, not a silent rewrite.
- No architectural duplication introduced: **YES**.
- No new source of truth created: **YES**.
- No runtime behaviour altered: **YES**.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-pkc1-canonical-knowledge-convergence-20260704` → `ff3b2cf`.
- Files changed by this phase:
  - `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — Domain Ownership Quick Reference, 2 rows.
  - `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Domain 1/4/6, Phase 3/4/5/7/8, Final Question sections.
  - `docs/implementation/knowledge/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md` — this file, new.
- Rollback commands: `git checkout rollback/before-pkc1-canonical-knowledge-convergence-20260704 -- docs/architecture/ARCHITECTURE_PRINCIPLES.md docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` reverts the two edited files; `rm docs/implementation/knowledge/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md` removes this one.
- Verification after rollback: `git diff rollback/before-pkc1-canonical-knowledge-convergence-20260704 -- docs/architecture/` shows no differences.

---

## SCOPE LOCK

**Implemented scope (this phase):** exactly `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` §7 Phase 1 — verify (against actual repository state, not documentation) that the contested-domain migrations M1 (`nutrition-benefit-library.ts`), M2 (`pantry-knowledge.ts`), and M4 (`nutrition-variety.ts`) are complete and satisfy Rule KC4 for their domains; incidentally confirm M3 (`dietRules.ts`) is also complete, since it was found duplicated in the same source documents; correct `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` and `ARCHITECTURE_PRINCIPLES.md` to state the verified-true current state per the register's own Rule 7; name, precisely and in full, one newly-found live "one mouth" gap (Food Report's evidence-gate bypass, Finding 2) as a scoped candidate for a future phase, per explicit user decision to defer rather than fix it in this phase.

**Explicitly excluded (out of scope — not implemented by this phase):**
- Any fix to Finding 2 (Food Report's evidence-gate bypass) — deferred to a future PKC2 by explicit user decision, given the scope/risk of the refactor (client+server shared adapter, behavioural change to what renders).
- Any resolution of Duplication 4 / Dietary Preferences (`users.dietPattern`/`dietRestrictions` vs `user_preferences`) — not named in PKCA1 §7 Phase 1, no migration scoped for it in the SoT Register, left exactly as contested as it is.
- Any edit to `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` itself — the governing architecture document is left as the historical governance artifact it is; this document is its correction record.
- PKCA1 §7 Phases 2–6 (per-entity-type "one mouth" adapters beyond Food Knowledge; Evidence & Learning's first reporter/consumer; Preparation Knowledge; demand-driven prioritisation; Retailer/Partner scope decisions).
- Any code, schema, or route change of any kind.

**Suggestions (not implemented without approval):**
- PKC2: converge Food Report's health-benefit rendering onto the PKC0 evidence gate — likely shape: expose an API endpoint the client calls instead of computing `buildFoodReport`'s `healthBenefits` field in-browser, so the evidence-gated (DB-backed) reader can be reused directly rather than reimplemented against static seed data.
- Once PKC2 exists, revisit whether `food-report-adapter.ts`'s `keyNutrients`/`nutritionContext` fields need equivalent evidence gating, or whether Layer 2 (per PKCA1 §4) applies only to benefit *claims*, not nutrient facts (the current PKC0 scope was benefits-only — worth confirming explicitly rather than assuming when PKC2 is scoped).

---

*Rollback: `rollback/before-pkc1-canonical-knowledge-convergence-20260704` → `ff3b2cf`.*
