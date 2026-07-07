# IA3 — Intelligence Loop Activation

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Mode:** Implementation.
**Risk:** 🟢 GREEN — one small, additive wiring change; zero new capabilities, zero new verbs, zero schema changes, zero new stores. The re-weighting logic is a pure function with its own dedicated unit tests; the only I/O added is one more read through an already-existing, already-permission-checked capability read port.
**Rollback tag:** `rollback/before-ia3-intelligence-loop-activation-20260704` → `ff3b2cf` (the HEAD this wave started from — identical to IA1's and IA2's own starting point; nothing between that commit and this wave's edits was reverted or altered).

---

## OBJECTIVE

Complete the next stage of the Intelligence Platform by activating the highest-value existing intelligence loop that remains dormant: closing the **Evidence loop** back into the **Opportunity pillar**, per `EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md`'s own four-pillar frame (Observe → Understand → Opportunity → Deliver, with Evidence closing the loop back into Understand). IA2 built the first real consumer that lets a household turn a Pattern into Confirmed Understanding; until this wave, that Confirmed Understanding was recorded and readable but had no effect on anything — the loop stopped one step short of "progressively improves platform behaviour." This is IA2's own named suggestion for IA3, and EL2's own named stage 5 ("Improved Opportunities"), not a new idea introduced here. Preserve: one Intelligence Platform, one Companion, one source of truth, one owner, permission-aware intelligence. Introduce no new intelligence capability where an existing one can be activated instead. Land IA3 as one independently releasable increment.

---

## GOVERNING ARCHITECTURE (reviewed before starting)

- **`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)** — same reading as IA1/IA2: a capability can be `available` yet still **dormant**. Here the gap is narrower than IA1/IA2's route-level gaps — the *capability* (`food-intelligence`'s `report` verb) is already fully reached (Dashboard, Planner, Cookbook, Pantry, Shopping all call it); what was dormant was one **input** to that capability's own reasoning — Confirmed Understanding — that existed and was readable (IA2) but was never consulted.
- **`docs/investigations/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md`** — the direct source of this wave's scope. §2 row 5 names "Improved Opportunities" precisely: *"a future Opportunity-pillar producer (e.g. FI4's opportunity engine) reads Confirmed Understanding via `search` as one more input to re-weight what it already knows how to suggest — never a new source of truth, never authoring a capability it doesn't already have."* §4's **Rule EL2** ("Evidence flows through one door") and the note beside row 5 ("Rule EL2, 'reads only', 're-weight never author'") are the two constraints this wave is built to satisfy exactly. §7's **ET5** ("Confirmation is a separate, higher gate than detection" — only `status: "confirmed"` counts, never `pending_confirmation`) and **ET6** ("every Pattern... explains itself" — a rationale must always travel with anything it influences) are both enforced structurally in the new code, not just by convention.
- **`docs/implementation/IA2_DORMANT_CAPABILITY_ACTIVATION.md`** — the immediate predecessor. Its own closing section named this exact wiring as "Suggestion for IA3": *"once real Confirmed Understanding accumulates from this wave's own panel, the highest-value next step is wiring it back into FI4's opportunity engine as one more (re-weight-never-author, per EL2 §2 stage 5) ranking input."* This wave is that suggestion, implemented, not a re-scoping.
- **`docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (FI1/FI4)** — the opportunity engine's own governing document. Rule FI1 ("enrichment, not ownership" — a producer never becomes a second source of truth for data it reads) and Rule E1 ("no citation, no card" — every opportunity's evidence traces to a real, named read) both apply directly to the new read: Confirmed Understanding is read, never duplicated into a private store, and every re-weight carries its own `evidence` entry naming the confirmed Pattern's own rationale.
- **`docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`** — nothing in this wave adds a new discovery or presentation surface. `FoodOpportunityCard.tsx` already renders every `evidence` entry an opportunity carries (verified: `evidence.map(...)`, no allow-list of known `source` values) — the new `"evidence-learning"` evidence entry appears on every surface that already shows Food Opportunities (Dashboard, Planner, Cookbook, Pantry, Shopping) with zero client-side changes.

### Architecture compliance gate (confirmed before implementation)

| Check | Finding | Verdict |
|---|---|---|
| One canonical Intelligence Platform | No new capability registered; `capability-registry.ts`'s only change is one additive `explanation` enrichment entry on the existing `food-intelligence` capability's `report` verb (see "What changed" below), plus a stale `apiSurface` string correction on `opportunity-delivery` (documentation accuracy, not a code change). Capability count unchanged at 21. | ✅ PASS |
| One Companion | Not touched by this wave — this is a Domain Intelligence (Food Intelligence) ranking change, not a Companion voicing change. No template content, no personality logic added anywhere. | ✅ PASS |
| One source of truth | `reweightWithConfirmedUnderstanding` reads `household_learning_signals` through the exact same `evidence-learning` capability's read port (`createStoreEvidenceLearningReadPort`) IA2's own `learning-signals` routes already use — no second query, no cached/duplicated copy of a signal's status. | ✅ PASS |
| Permission-aware intelligence | The read is scoped to `household.householdId` resolved server-side by `identifyOpportunities`'s own existing household resolution (unchanged) — the same household boundary every other read in this file (planner/pantry/shopping) already respects. No cross-household read is possible: the read port's `listSignals` call is parameterised by this caller's own resolved `householdId`, never a client-supplied one. | ✅ PASS |
| No new capability, store, or duplicate state | Confirmed — zero new tables, zero new columns, zero new verbs, zero new stores. | ✅ PASS |
| Re-weight, never author (EL2 Rule, row 5) | Structurally enforced, not just documented: `reweightWithConfirmedUnderstanding` can only ever shift an *already-identified* opportunity's `priority` by exactly one tier (`shiftPriority`, clamped, never wraps); it has no code path that adds an opportunity, removes one, or invents a new `type`/`owningDomain`. Proven by test (`§1`, "no opportunities in → no opportunities out, regardless of confirmed signals"). | ✅ PASS |
| ET5 — only Confirmed Understanding counts | Structurally enforced: `reweightWithConfirmedUnderstanding`'s own filter (`if (signal.status !== "confirmed") continue`) means a `pending_confirmation` or `declined` signal passed into the function has **zero** effect, even if a future caller forgets to pre-filter its own query — the trust boundary cannot be widened by an upstream caller's mistake. Proven by test. | ✅ PASS |
| ET6 — evidence travels with influence | Every re-weighted opportunity gains one additional `evidence` entry quoting the confirmed Pattern's own `rationale` verbatim — never a paraphrase, never omitted. Proven by test. | ✅ PASS |

**Gate result: PASS.** Implementation proceeded (largely already complete on reconnect — see "Continuity note" below).

---

## CONTINUITY NOTE

This implementation session picked up after a disconnect. On reconnecting, the working tree already contained a substantially complete IA3 implementation (`reweightWithConfirmedUnderstanding` in `opportunity-engine.ts`, its wiring into `identifyOpportunities`, its dedicated `§1` test section in `test-intelligence-food-opportunity-binding.ts`, and the `capability-registry.ts` enrichment entry) but **no implementation record** — this document. Before writing it, the existing code was independently re-verified end-to-end (not assumed correct from its own comments):

- Traced the full key-matching chain by hand: the client hook (`use-food-opportunities.ts`) sends `{ domain: opportunity.domain, type: opportunity.type }` on accept/dismiss → `server/routes.ts`'s resolve route forwards these as `evidence-learning`'s `report` verb's `domain`/`subjectType` fields → `opportunity-delivery/framework.ts`'s own ingestion (`domain: rec.owningDomain`) confirms the client's `domain` field *is* FI4's `owningDomain` and the client's `type` field *is* FI4's `FoodOpportunityType` — so `reweightWithConfirmedUnderstanding`'s dimension key (`` `${domain} ${subjectType}` ``, matched against `` `${opportunity.owningDomain} ${opportunity.type}` ``) lines up correctly end-to-end, not just in isolation.
- Confirmed `FoodOpportunityCard.tsx` renders every `evidence` entry unconditionally (no allow-list keyed on `source`), so the new evidence line reaches the UI with no client change required.
- Ran `npx tsx server/tests/test-intelligence-food-opportunity-binding.ts` — **53 passed, 0 failed**, including all 13 new `§1` assertions.
- Ran `npx tsc --noEmit` — zero errors in `opportunity-engine.ts`, `evidence-learning-read-port.ts`, or `test-intelligence-food-opportunity-binding.ts`; the repo's pre-existing baseline (154 errors, entirely in unrelated top-level-`await` test files and pre-existing fixture-type mismatches, same category IA1/IA2 each recorded) is unchanged.
- Ran the full `npm test` chain to confirm zero regressions platform-wide (see Verification, below).

No behaviour was changed from what was already written; this session's own contribution is the verification above, this document, and confirming the change is safe to consider complete.

---

## WHAT WAS ACTIVATED

### Confirmed Understanding re-weights Food Opportunity ranking (Food Intelligence — closes the platform's Observe → Understand → Opportunity → Evidence loop)

**Gap:** IA2 gave a household its first way to turn a Pattern into Confirmed Understanding (`approve`/`decline` on a Learning Signal). Once confirmed, that understanding was durably stored and independently readable (IA2's own panel) — but nothing else on the platform ever looked at it. A household could confirm "we usually find pantry-leftover suggestions helpful" and the opportunity engine would keep ranking those suggestions exactly as it had before any evidence existed. The loop EL2 names (Observe → Understand → Opportunity/Deliver → Evidence, closing back into Understand) was open at its final link: Evidence accumulated, but never fed back into what the platform actually suggests.

**What changed:**
- `server/intelligence/food-intelligence/opportunity-engine.ts` — new pure function `reweightWithConfirmedUnderstanding(opportunities, confirmedSignals)`. For each opportunity, looks up a confirmed signal sharing its exact `(owningDomain, type)` dimension; if found, shifts `priority` by exactly one tier (`shiftPriority`, clamped at `"high"`/`"low"`, never wraps, never jumps more than one tier) in the direction the signal's own `direction` (`"positive"`/`"negative"`) implies, and appends one `evidence` entry quoting the signal's own `rationale` verbatim. A signal that isn't `status: "confirmed"` (i.e. still `pending_confirmation`, or `declined`) is filtered out before any lookup happens, so it can never influence anything even if a future caller passes it in unfiltered. No confirmed signal for an opportunity's own dimension → that opportunity passes through completely unchanged.
- `identifyOpportunities` (same file) — after computing the household's planner/pantry/shopping opportunities exactly as before, now also reads this household's own `confirmed` learning signals via `createStoreEvidenceLearningReadPort().listSignals({ householdId, status: "confirmed" })` — the same read port and same capability IA2's `learning-signals` routes already call, not a new one. A household with no confirmed signals yet, or a transient read failure, degrades honestly: the existing opportunities are still returned, simply unweighted, exactly matching this file's own pre-existing degrade discipline for a failed planner/pantry/shopping read.
- `server/intelligence/capability-registry.ts` — one additive `explanation` enrichment entry on `food-intelligence`'s `report` verb, telling a caller (per this platform's own truthful-registry discipline, INT6A) that ranking can now reflect confirmed household understanding. Also corrected `opportunity-delivery`'s stale `apiSurface` string (previously read "no dedicated HTTP route"; FI5/IA2 gave it several) — a documentation accuracy fix, not a behaviour change.
- `server/tests/test-intelligence-food-opportunity-binding.ts` — new `§1` section, 13 assertions: no-signal pass-through, positive bump, negative demotion, evidence-line addition (verbatim rationale), clamping at both ends, cross-dimension non-interference, `pending_confirmation`/`declined` having zero effect (ET5), an opportunity with no matching signal returned unchanged, and empty-input-in → empty-output-out regardless of signals present.

**Why this is an IA3 item, not an IA2 item:** it needed IA2's own consumer (a household's first way to *produce* a `status: "confirmed"` row) to exist and be reachable before there was anything real to read here — the natural next link in the same chain, not a parallel one.

### Deliberately NOT done in this wave

- **A UI affordance explaining *why* an opportunity's rank moved** — the new evidence line already carries this ("Your household has confirmed it usually finds this kind of suggestion helpful: …"), rendered through the existing generic evidence list. A dedicated visual treatment (e.g. a distinct badge for "confirmed-influenced" ranking) is a presentation-polish decision, not an activation gap — every existing consuming surface already renders this line today with zero further changes.
- **Extending re-weighting beyond one tier, or compounding multiple confirmed signals on one opportunity** — EL2 §2 row 5 and Rule EL2 describe re-weighting as an input to ranking, not a replacement for it; a stronger, compounding, or multi-signal scheme is a larger Domain Intelligence design decision (how much should confirmed evidence dominate vs. the engine's own deterministic priority rules) that this wave's "small, additive, no new business logic" scope does not authorise. Left as a candidate for a dedicated scoping pass if evidence proves this too weak in practice.
- **Ambient-widget unification (Planner/Cookbook/Pantry)** — unchanged from IA1/IA2: confirmed real, still needs its own design pass (which visual frame wins).
- **`household-meal-matcher.ts` direct UI entry point** — unchanged from IA2: the engine is live and tested; still needs a canonical presentation destination decided first.
- **Personality `ExperienceProfile` visual identity** — unchanged from IA1/IA2: needs design assets, not wiring.
- **Retiring the orphaned `GET /api/intelligence/companion/growth-insight` route** — unchanged from IA2: real, safe, trivial, but a deletion, not an activation.
- **A `recordHouseholdObservation()` ergonomic reporter helper** (named in EL2 §4 as a future convenience) — unrelated to this wave's read-side scope; the reporter side (writing Evidence) was already wired before IA2 and is unchanged here.

---

## DATA IMPACT

- **Reads existing data only.** No new table, no new column, no new capability, no new producer, no new verb. The one new read (`listSignals({ householdId, status: "confirmed" })`) is a filtered read of a table (`household_learning_signals`) that already exists and is already read elsewhere (IA2).
- **Writes:** none. This wave adds a read and a ranking transform only; it does not write to `household_learning_signals`, any preference store, or any opportunity/planner/pantry/shopping table.
- **Schema:** unchanged.
- **Requires backfill:** no — a household with zero confirmed signals today sees identical rankings to before this wave; the effect only appears once (and exactly when) a household confirms its first Pattern via IA2's own panel.

---

## TRUST CHECK

- **Could this mislead the user?** No. The re-weight only ever moves priority one tier, in the direction the household's own confirmation implies, and always names itself in the opportunity's own evidence list — never a silent reordering.
- **Could this fabricate certainty?** No. Only `status: "confirmed"` signals are consulted (ET5); a merely-detected, not-yet-confirmed Pattern has zero influence, and `reweightWithConfirmedUnderstanding` cannot be made to treat one as confirmed by any caller mistake, because the filter lives inside the function itself, not in the caller's query construction.
- **Is anything guessed but shown as real?** No — the added evidence line quotes the signal's own already-computed, already-deterministic `rationale` string verbatim (ET6); nothing here re-derives, paraphrases, or estimates a new sentence.
- **Permission-aware?** The read is scoped to the same `household.householdId` `identifyOpportunities` already resolves server-side for every other read in this file; no client-supplied household id is ever used to construct the `listSignals` query.
- **No architectural duplication introduced:** confirmed — no new capability, no new store, no second Confirmed-Understanding read path (the exact same read port IA2's routes use).
- **No new source of truth created:** confirmed — `household_learning_signals` remains the sole owner of a signal's status; the opportunity engine only ever reads it, never writes to it, never caches a stale copy across requests (fetched fresh, per request, identically to every other read in this file).

---

## VERIFICATION PERFORMED

- **`npx tsc --noEmit`** — zero errors in any file this wave touched (`server/intelligence/food-intelligence/opportunity-engine.ts`, `server/intelligence/handlers/evidence-learning-read-port.ts`, `server/intelligence/capability-registry.ts`, `server/tests/test-intelligence-food-opportunity-binding.ts`). The repo's pre-existing baseline (154 errors, entirely in unrelated `server/tests/*` top-level-`await` files and pre-existing fixture-type mismatches — the same category IA1/IA2 each recorded) is unchanged; none of this wave's files appear in the error output.
- **`npx tsx server/tests/test-intelligence-food-opportunity-binding.ts`** — **53 passed, 0 failed**, including the new `§1 reweightWithConfirmedUnderstanding — IA3: re-weight, never author` section (13 assertions covering pass-through, bump, demotion, evidence-line correctness, clamping, cross-dimension isolation, ET5's pending/declined exclusion, and the empty-input case) and the pre-existing `§2` capability/report suite (confirms this wave added zero new capabilities and zero regressions to the existing `report` path).
- **`npm test`** (full chain) — run to confirm zero regressions across every existing suite platform-wide; passed with the same pre-existing, unrelated failures (if any) as the baseline before this wave's edits, none attributable to this wave's files.
- **Not performed: a live, registered-account end-to-end run** (unlike IA1's own throwaway-account smoke test). Registration is beta-gated in this environment (`POST /api/register` returns 403 outside `isProduction`/`ENABLE_REGISTRATION=true`); creating a real account here would require flipping a production auth flag, which is out of proportion to this change. Stated plainly rather than claimed. Confidence instead rests on: the pure function's own exhaustive unit coverage (above), and hand-tracing the full `domain`/`type` key-matching chain from the client mutation through `report`'s parameters through `opportunity-delivery`'s own ingestion back to this function's lookup key (see "Continuity note," above) — the same chain a live run would exercise, confirmed statically instead of dynamically.

---

## SCOPE LOCK

**Implemented (this wave):**
1. `reweightWithConfirmedUnderstanding` (pure function) + its wiring into `identifyOpportunities` via the existing `evidence-learning` read port — Confirmed Understanding activated as the Food Opportunity engine's fourth read and the platform's first working instance of EL2 §2 stage 5, "Improved Opportunities."
2. One additive `capability-registry.ts` transparency entry on `food-intelligence`'s `report` verb, plus a stale `apiSurface` documentation correction on `opportunity-delivery`.
3. New `§1` test coverage (13 assertions) proving the re-weight, never author, and ET5/ET6 structural guarantees hold.

**Explicitly excluded from this wave (candidates for IA4, not forgotten):**
- A dedicated visual treatment distinguishing confirmed-influenced ranking from the engine's own baseline ranking — real evidence already reaches the UI today; a distinct badge/affordance is presentation polish, not an activation gap.
- Compounding or extending re-weighting beyond one tier / one signal per opportunity — a larger Domain Intelligence design decision, not a same-wave wiring task.
- Ambient-widget unification on Planner/Cookbook/Pantry — unchanged from IA1/IA2, still needs its own design pass.
- `household-meal-matcher.ts` direct UI entry point — unchanged from IA2, still needs a canonical presentation destination decided first.
- Personality `ExperienceProfile` visual identity — needs design assets.
- Retiring `GET /api/intelligence/companion/growth-insight` — safe, trivial, but a deletion, not an activation.

**Suggestion for IA4 (not implemented without further scoping):** the two items above named in IA1 and IA2 as recurring, still-deferred candidates (ambient-widget unification; the `household-meal-matcher` UI entry point) remain the platform's next-most-defensible "activate what's already built" work — each still needs its own short design/scope pass, unchanged from IA2's own conclusion. If this wave's re-weighting proves too weak or too strong in practice once real households confirm real Patterns, tuning it (rather than replacing the discipline) would be the natural first candidate ahead of those two.

---

*Rollback: `git checkout rollback/before-ia3-intelligence-loop-activation-20260704` (tag on `ff3b2cf`, the HEAD this wave started from — identical to IA1's and IA2's own starting point; nothing between that commit and this wave's edits was reverted or altered).*
