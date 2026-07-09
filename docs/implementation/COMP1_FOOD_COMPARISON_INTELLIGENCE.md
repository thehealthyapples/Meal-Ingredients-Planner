# COMP1 — Food Comparison Intelligence — Implementation

**Date:** 2026-07-09
**Branch:** int1-intelligence-platform
**Risk:** 🟡 AMBER
**Reason:** New read-only comparison reasoning composed entirely from existing single-owner intelligence, exposed as a new `compare` verb on the EXISTING `food-intelligence` capability — no new capability, no new knowledge store, no schema change, no UI change, no write path.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-comp1-food-comparison-20260709` → `ac9a041c1b4fc02be1fc94f9340e11906049b548` |
| Working tree | Intentionally dirty — uncommitted KNOW4 workstream files (client/src/components/FoodReport.tsx, server/lib/food-intelligence-assembler.ts, server/lib/meal-intelligence-assembler.ts, server/routes.ts, server/tests/test-food-report-adapter.ts, shared/canonical/food-report-adapter.ts, shared/knowledge/index.ts, shared/knowledge/food-relationships.ts, server/tests/test-know4-graduated-food-reports.ts, docs/implementation/KNOW4_GRADUATED_KNOWLEDGE_FOOD_REPORTS.md, and KNOW4's package.json test-script line) pre-date this task and are left untouched |
| This task's writes | **New:** `server/intelligence/food-intelligence/comparison-engine.ts`, `server/tests/test-comp1-food-comparison.ts`, this document. **Edited:** `server/intelligence/handlers/food-intelligence-read-port.ts`, `server/intelligence/handlers/food-intelligence-read-handler.ts`, `server/intelligence/bindings/food-intelligence.ts`, `server/intelligence/capability-registry.ts` (food-intelligence descriptor only), `server/intelligence/pattern-intent-resolver.ts` (COMP1 matchers only), `server/intelligence/index.ts` (exports only), `package.json` (one test script + chain entry) |
| Rollback to committed state | `git checkout rollback/before-comp1-food-comparison-20260709` (KNOW4's uncommitted work must be preserved separately — see Rollback Plan) |

---

## REFERENCE DOCUMENTS READ

- [x] docs/architecture/README.md (architecture bootstrap — canonical entry point)
- [x] docs/architecture/ARCHITECTURE_PRINCIPLES.md
- [x] docs/architecture/ENGINEERING_WORKFLOW.md
- [x] docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md (FI1 — the governing document for this Domain Intelligence layer)
- [x] docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md (INT7A — binding pattern; PER-1 completion gate)
- [x] docs/architecture/capabilities/analyser.md (Analyser Capability Card — the product-analysis trust rule COMP1 must respect)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
☑ One canonical identity
  Foods key on the WS2A canonical slug (resolveCanonicalFood — the one resolver);
  products key on the caller's own product_history row (barcode/id). No new key space.

☑ One owner per fact
  Identity → canonical seed. Nutrients/benefits → Food Knowledge Registry via the
  PKC2 "one mouth" (getEvidenceBackedFoodReport). Product scores → the stored
  product_history snapshot the Analyser owner wrote at scan time. Restrictions →
  restriction library + household eaters. Familiarity → planner history. The
  comparison engine owns only its REASONING PROCESS (Rule FI1) — zero facts.

☑ No duplicate entities
  No new entity. A "comparison" is a per-request composition, never stored.

☑ No duplicate ownership
  No attribute gains a second owner. The engine re-reads owners at request time.

☑ No duplicate state
  Nothing is cached or persisted. The engine is stateless; product history is
  read through the owner's existing method (storage.getProductHistory).

☑ Extends existing architecture
  Exactly the FI4 precedent: a sibling engine module + one new verb on the SAME
  food-intelligence capability (Port → Handler → Binding), plus resolver matchers
  following the BENCH4 pattern. No new platform, registry, engine or assistant.

☑ Progressive enrichment where appropriate
  Not a knowledge entity and not transactional state — a per-request reasoning
  output. No enrichment pipeline added.

☑ Honest gaps over fabricated information
  Every dimension without owner evidence is a structured gap with a reason
  (see Trust Check). Ungrounded comparisons (<2 resolved items) return a gap,
  never a one-sided comparison. Verified by test.

☑ No permanent synchronisation bridge
  No bridge. All reads are request-time reads of single owners.

☑ Evolution over replacement
  Nothing is replaced. The analyser's PR-067 matcher (compare → analyse → honest
  gap) is deliberately left in place for the demonstrative, no-named-items form
  it owns; COMP1 routes only named-items comparisons.
```

## AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform (intelligencePlatform singleton — no new platform)
✓ Uses the Capability Registry (extends the existing food-intelligence descriptor; compare
  added to supportedIntents; executableIntents stays truthful, INT6A)
✓ Uses the Intent Engine (verb compare passes the VALIDATE gate because it is in
  supportedIntents; compare is in READ_ONLY_VERBS so no confirmation tier is skipped)
✓ Reuses existing business services (canonical resolver, evidence-backed food report,
  storage.getProductHistory, restriction resolver, resolveHouseholdSignal — reused verbatim)
✓ Does not create another assistant (platform-internal capability; Companion consumes it
  through the existing gateway; INT50 already composes household context for food turns)
✓ Does not duplicate conversation state (none touched)
✓ Uses registered capabilities only (one capability, already registered and bound)
✓ Uses permission-aware access (context.userId only — never a client-supplied household or
  user id; anonymous callers get Stage 1 behaviour: no household, no scan history)
✓ Produces honest gaps rather than fabricated knowledge (see Trust Check — verified by test)
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Intelligence (Domain Intelligence layer)
Declared SoT: composes — shared/canonical (identity), shared/knowledge → knowledge_* via
  nutrition-knowledge-registry.ts (D1), product_history (analyser-written scan records),
  household_eaters (D16), planner_* (D14), shared/restrictions/restriction-library.ts
New store created? NO
Existing store extended? NO
Consumer created? YES (the comparison engine consumes the owners above)
  If YES: reads from declared SoT? YES — every read goes through the owner's existing
  service (resolveCanonicalFood, getEvidenceBackedFoodReport, storage.getProductHistory,
  resolveHouseholdSignal, resolveIngredientRestrictions)
```

---

## IMPLEMENTATION

### What was built

**1. `server/intelligence/food-intelligence/comparison-engine.ts` (new — the canonical comparison engine).**
Sibling to `engine.ts` (FI3) and `opportunity-engine.ts` (FI4). Structure mirrors both:

- **Pure core** — `buildComparison(subjectFacts, householdSignal)`: no I/O, no clock,
  deterministic (Rule LT3; byte-identical output asserted by test). Composes, per subject,
  eight fixed dimensions (`appleScore`, `processing`, `ingredientQuality`, `additives`,
  `nutritionalProfile`, `healthBenefits`, `valueForMoney`, `householdSuitability`), each
  either owner-cited evidence or a structured honest gap; then cross-subject dimension
  outcomes (comparable only when EVERY resolved subject has evidence); then the
  recommendation ladder.
- **Recommendation ladder (deterministic, ordered):**
  1. **Safety (Rule T0)** — a subject conflicting with an active household hard restriction
     is never recommended; if exactly one safe subject remains it wins on safety.
  2. **THA Apple Score** — only when every safe subject has a STORED `thaRating`
     (products from the caller's own scan history); unique maximum wins.
  3. **Processing** — canonical whole food ranks 1 by identity (the WS2A preparation
     guard: only whole foods are in the seed); a product ranks by its recorded NOVA
     group; unique minimum wins; a full tie is an HONEST tie ("THA will not fabricate a
     difference to break the tie").
  4. Otherwise — no recommendation, with a gap stating exactly what evidence is missing.
- **Documentation-honesty rule (Rule E2):** `nutritionalProfile` and `healthBenefits`
  compare what the Food Knowledge Registry DOCUMENTS, are labelled as documentation
  ("an undocumented nutrient is not evidence of absence"), and NEVER contribute to the
  recommendation — comparing documentation density would fabricate a quality difference.
- **Orchestrator** — `assembleFoodComparison({items, userId})`: resolves each item
  canonical-food-first (identity spine), then against the caller's own scan history
  (`storage.getProductHistory`, most-recent-first containment match), else `unresolved`;
  resolves the household signal via FI3's `resolveHouseholdSignal` (reused verbatim);
  calls the pure core; stamps metadata/sources. Dynamic imports for DB-touching owners.

**2. `compare` verb on the existing `food-intelligence` capability (FI4 precedent).**
- Port: `assembleFoodComparison` added to `FoodIntelligenceReadPort` (1:1 forward).
- Handler: `case "compare"` → `handleCompare` — coerces `{items}`, gaps for <2 items,
  delegates, gaps when fewer than two items resolved (never a one-sided comparison),
  projects the bundle verbatim as `FoodComparisonResult`.
- Binding: `FOOD_INTELLIGENCE_EXECUTABLE_INTENTS` now `["recommend","explain","report","compare"]`.
- Registry: the food-intelligence descriptor's `supportedIntents` gains `compare`
  (the VALIDATE gate requirement); description/owner fields updated to name COMP1.

**3. Resolver matchers (`pattern-intent-resolver.ts`, appended to `FOOD_INTELLIGENCE_MATCHERS`).**
Named-items forms only: "compare X and/vs/with Y", "which is better/healthier, X or Y",
"is X healthier than Y", bare "X vs Y" (whole-utterance anchored). Guards:
`cleanComparisonItem` rejects demonstratives/pronouns/question words (the analyser's
PR-067 "compare these two products" form keeps its route and honest gap) and other
capabilities' domain nouns ("compare my shopping list to my pantry" keeps its INT33
compound route); a trailing "…which is better" clause is stripped before capture.
`compare` is already in `READ_ONLY_VERBS` (permissions.ts) — no confirmation tier skipped.

**4. Companion grounding — no new seam needed.** `food-intelligence` is already in
INT50's `FOOD_KNOWLEDGE_CAPABILITIES`, so a compare turn with ok-data automatically
composes household dietary context as a baseline second wave. The Context Composition
Engine renders the Full Result through the sanctioned generic view (the NCV1
`pantry:read` precedent) — no native `ContextViewSpec` added, so the pinned NCV1
key-count assertions are untouched.

### Files created / modified

| File | Change |
|---|---|
| `server/intelligence/food-intelligence/comparison-engine.ts` | NEW — engine (pure core + orchestrator) |
| `server/tests/test-comp1-food-comparison.ts` | NEW — 56 assertions (see Validation) |
| `server/intelligence/handlers/food-intelligence-read-port.ts` | + `assembleFoodComparison` port method |
| `server/intelligence/handlers/food-intelligence-read-handler.ts` | + `handleCompare`, `FoodComparisonResult`, `case "compare"` |
| `server/intelligence/bindings/food-intelligence.ts` | + `compare` in executable intents |
| `server/intelligence/capability-registry.ts` | food-intelligence descriptor: + `compare` in supportedIntents; description/owner updated |
| `server/intelligence/pattern-intent-resolver.ts` | + COMP1 matchers, `cleanComparisonItem`, `stripComparisonTrailer`, `foodComparison` |
| `server/intelligence/index.ts` | + COMP1 exports (engine functions + types, `FoodComparisonResult`) |
| `package.json` | + `test:comp1-food-comparison` script, chained into `test` |
| `docs/implementation/COMP1_FOOD_COMPARISON_INTELLIGENCE.md` | NEW — this document |

---

## DEFINITION OF DONE

- **What success looks like:** the Companion (and any platform consumer) can ask
  `food-intelligence · compare {items}` — or say "compare cheddar and brie", "which is
  healthier, butter or margarine?" — and receive a structured, cited comparison across
  the eight dimensions, with an explainable recommendation only when the evidence
  supports one, and named honest gaps everywhere else. ✅
- **What must not break:** every existing verb on food-intelligence (`recommend`,
  `explain`, `report`); the analyser's PR-067 route; the INT33 compounds; the INT50
  composition; the NCV1 pinned context-view counts; the full regression chain. ✅ (see
  Validation)
- **Manual test steps:** see MANUAL VERIFICATION below.

## MANUAL VERIFICATION

1. `npx tsx server/tests/test-comp1-food-comparison.ts` → 56 passed, 0 failed.
2. Engine, live owners (anonymous): run a scratch script calling
   `assembleFoodComparison({ items: ["broccoli", "spinach"] })` →
   both subjects `canonical-food`; broccoli's `healthBenefits` shows the evidence-gated
   "Gut Health, Immune Support"; `valueForMoney` and `appleScore` are honest gaps;
   `recommendation` is null with the honest-tie explanation (two whole foods).
3. Same script with `{ items: ["broccoli", "xyzzy wonder bar"] }` →
   `trust.isGrounded: false`, unresolved subject gap names the item.
4. Companion turn (requires a signed-in session): POST
   `/api/intelligence/conversation/turn` with `message: "compare cheddar and brie"` →
   the routed intent is `food-intelligence · compare`, the answer is grounded in the
   comparison Full Result, and household dietary context composes as baseline (INT50).
5. Scan-history products: scan/search two products (so `product_history` rows exist),
   then "compare <product A> and <product B>" → stored Apple Scores/NOVA compared;
   additives/ingredients honest-gapped; check-the-label caveat present when the
   household has restrictions.

## VALIDATION PERFORMED

| Check | Result |
|---|---|
| `server/tests/test-comp1-food-comparison.ts` (new) | ✅ 56 passed, 0 failed |
| `test-intelligence-food-intelligence-binding` | ✅ 36 passed, 0 failed |
| `test-intelligence-conversation-gateway` (PER-1 gate) | ✅ 64 passed, 0 failed |
| `test-intent-resolver` | ✅ 124 passed, 0 failed |
| `test-intelligence-registry-executability` | ✅ 124 passed, 0 failed |
| `test-int50-food-intelligence-composition` | ✅ 21 passed, 0 failed |
| `test-intelligence-context-composition` (NCV1 pins untouched) | ✅ 161 passed, 0 failed |
| `test-intelligence-compound-resolver` | ✅ 109 passed, 0 failed |
| `test-intelligence-capability-composition` | ⚠️ 15 passed, 8 failed — PRE-EXISTING at HEAD: the suite asserts `MEAL_HEALTHIER_COMPOUND`/`NUTRITION_BOOST_WEEK_COMPOUND`, which exist in no committed or working-tree resolver (0 grep hits at HEAD and in tree); unrelated to COMP1 (a concurrent workstream's in-progress test) |
| `npx tsc --noEmit` | ✅ COMP1 files contribute 0 errors; remaining error lines are the pre-existing baseline (incl. `test-intelligence-uplift-binding.ts` import errors present at HEAD) |
| Full `npm test` chain | ✅ exit 0 — every chained suite green, including `test:comp1-food-comparison` (56/0) and KNOW4's in-tree suite |
| Live engine run (broccoli vs spinach; broccoli vs unknown) | ✅ behaves as designed (see MANUAL VERIFICATION 2–3) |

## VALIDATION ADDENDUM

Full `npm test` chain run on the working tree (which includes KNOW4's uncommitted files
and its chained suite): **exit 0**. Note on the commit itself: `package.json` in the
working tree carries both KNOW4's uncommitted `test:know4-graduated-food-reports` line
and COMP1's `test:comp1-food-comparison` line. Only the COMP1 additions are staged in
this commit (KNOW4's line stays with its own uncommitted workstream), so the committed
`npm test` chain is HEAD's chain + COMP1 — runnable at this commit without KNOW4's
untracked files.

---

## DATA IMPACT

- Reads existing data: **YES** — canonical seed (in-process), `knowledge_*` via the
  evidence-gated registry, `product_history` (caller's own rows only), `household_eaters`,
  planner history. All through existing owner services.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- Schema changes: **NO**

## TRUST CHECK

- **Could this mislead the user?** The engine is built so it cannot state more than an
  owner stores: every dimension entry is either cited owner evidence or a gap with a
  reason; knowledge dimensions are labelled as documentation and excluded from the
  verdict; product dimensions come only from the caller's own stored scan snapshots;
  value-for-money is structurally a gap because THA stores no canonical prices.
- **Could this fabricate certainty?** No code path produces a recommendation without a
  deciding dimension in which every safe subject has owner evidence; full-evidence ties
  return "no recommendation" with the tie stated. Verified by test.
- **Is anything guessed but shown as real?** No. Unresolvable items are `unresolved`
  subjects with per-dimension gaps; fewer than two resolved items is a handler-level gap.
- **What happens if the system is wrong?** A wrong stored product score is the Analyser
  owner's stored fact, surfaced verbatim with its scan date — correcting the scan
  corrects the comparison. A wrong recommendation is fully explainable: every basis line
  names its dimension and owner.
- **Rule T0/T1 posture:** restriction-conflicting foods are never recommended; products
  whose ingredients are not stored are never declared "suitable" — they gap with a
  check-the-label caveat that also rides any recommendation over them. All statements
  are about foods and records, never bodies.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES**
- No runtime behaviour altered outside the new verb + matchers: **YES** (all
  neighbouring suites green)

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-comp1-food-comparison-20260709` →
  `ac9a041c1b4fc02be1fc94f9340e11906049b548`
- **Files modified:** see Files created / modified above.
- **Rollback commands (surgical — preserves the unrelated KNOW4 uncommitted work):**
  ```
  git checkout rollback/before-comp1-food-comparison-20260709 -- \
    server/intelligence/handlers/food-intelligence-read-port.ts \
    server/intelligence/handlers/food-intelligence-read-handler.ts \
    server/intelligence/bindings/food-intelligence.ts \
    server/intelligence/capability-registry.ts \
    server/intelligence/pattern-intent-resolver.ts \
    server/intelligence/index.ts
  rm server/intelligence/food-intelligence/comparison-engine.ts \
     server/tests/test-comp1-food-comparison.ts
  # package.json: remove the "test:comp1-food-comparison" script line and the
  # "&& npm run test:comp1-food-comparison" chain segment (package.json also holds
  # an uncommitted KNOW4 line, so do NOT checkout the whole file from the tag).
  ```
- **Verification after rollback:** `npx tsc --noEmit` returns to baseline;
  `npm run test:intelligence-food-intelligence-binding` and
  `npm run test:intent-resolver` pass; `grep -r comp1 package.json server/` is empty.

---

## SCOPE LOCK

**Implemented scope (exactly COMP1):** a canonical Food Comparison Engine
(`comparison-engine.ts`) composing existing intelligence; the `compare` verb on the
existing `food-intelligence` capability (port/handler/binding/registry); resolver
matchers for named-items comparison utterances; tests; this document.

**Explicitly excluded (not done):**
- No UI changes of any kind (per the mission).
- No new capability, knowledge store, table, schema change, or HTTP route.
- No live OpenFoodFacts or price-API fetches — product evidence is the caller's own
  stored scan history only; value-for-money is an honest gap.
- No native `ContextViewSpec` for `food-intelligence:compare` (generic view per the
  sanctioned NCV1 `pantry:read` precedent; NCV1 pins untouched).
- No changes to the analyser capability, its card, or its PR-067 matcher.
- No multi-way (>4) comparisons; the resolver emits exactly two items (the engine
  accepts up to four for future callers).
- No learning/personalisation-event writes; no Observation Engine changes.

**SUGGESTIONS (out of scope — do not implement without approval):**
1. A native `ContextViewSpec` for `food-intelligence:compare` (with `pinned` trust
   fields) would compose comparison tables more compactly than the generic view —
   requires bumping the NCV1 pinned counts (7→8).
2. `productHistory` rows could store `ingredientsText` at scan time (an Analyser-owner
   decision), which would unlock grounded additive/ingredient-quality/household-suitability
   comparison for products — today those are honest gaps.
3. The Analyser Capability Card's own note that SoT D19 ("product analysis tables")
   needs re-verification is reinforced by this work: `product_history` IS a stored,
   caller-scoped analysis snapshot; the card predates attention to it.
4. `test-intelligence-capability-composition.ts` asserts two compound matchers that no
   committed resolver contains (8 pre-existing failures) — the owning workstream should
   reconcile the test with its implementation.
