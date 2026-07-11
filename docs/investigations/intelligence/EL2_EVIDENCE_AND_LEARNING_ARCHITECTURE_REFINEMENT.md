# EL2 — Evidence & Learning Architecture Refinement

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-EL2 (🔴 RED — refines the canonical, cross-cutting model the whole platform's continuous-learning behaviour is governed by; the conceptual equivalent of a schema change even though no schema changes)
**Risk:** 🔴 RED
**Status:** Investigation — documentation only. **No code, schema, capability, or runtime behaviour is changed by this task.** Every table name, column name, verb name, threshold constant and file path EL1 built stays exactly as built. This document defines the canonical *conceptual* architecture EL1 already satisfies, names the rules future work must cite, and identifies the handful of places EL1's own "Suggestions for follow-up" section is now made more precise before that follow-up work starts.
**Builds on:** [`EL1_EVIDENCE_AND_LEARNING_PLATFORM.md`](../../implementation/knowledge/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md) (the implementation this document refines — read in full; every fact below traces to it) · [`OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md`](../../implementation/intelligence/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md) (the Opportunity → Deliver pillar this document positions EL1 alongside) · [`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (FI1 — Rule FI1 "enrichment, not ownership"; the four-plane knowledge model EL1 slots into as Plane 2) · [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1/TIP2 — the closed 20-verb taxonomy and confirmation-tier model this document's rules operate inside, unchanged) · [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) (the eight governing principles — every rule below is a specialisation of Principles 2, 3, 6 and 8, not a new principle)

---

## Why this refinement

EL1 built the Evidence & Learning Platform correctly, but named it, and explained it, in the vocabulary of the framework it mirrors (OD1) — store/framework/port/handler/binding, "evidence events", "learning signals", `report`/`search`/`approve`/`delete`. That vocabulary is right for the code. It is not the vocabulary the rest of the platform's governing architecture uses to talk about *what the platform does for a household* — Observe, Understand, Opportunity, Deliver. EL1 also left several ideas implicit that its own code already enforces correctly but never named as a citable rule: that evidence decays, that confidence only grows from volume and consistency, that confirmation is a separate and higher gate than detection, and that Evidence is reached through exactly one door.

EWO-EL2 makes all of this explicit **before** the next EL milestone (wiring a first real reporter, e.g. Food Intelligence reporting meal-outcome evidence, or a photo-analysis capability reporting what a photo shows) starts building against it. Refining the architecture now — while there are still zero real reporters and zero real consumers (per EL1's own Domain Impact section) — costs nothing to change. Refining it after a second and third domain has already integrated against ad hoc conventions would cost a migration.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight governing principles — this document adds no new principle, only names specialisations of Principles 2/3/6/8 for the Evidence domain)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (confirmed this document does not change SoT ownership anywhere; `household_evidence_events`/`household_learning_signals` remain solely owned by `evidence-learning-store.ts`, unchanged)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1/TIP2 — confirmed the closed 20-verb taxonomy and platform-wide `confirmationFor()` verb-driven confirmation tiers are unchanged and unextended by this document; "Observe / Understand / Opportunity / Deliver" is a new conceptual frame this document proposes, not a rename of anything TIP1/TIP2 already defines)
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (FI1 §4.2/§7.2 — confirmed EL1 is already correctly recorded there as Plane 2's Personalisation Event Log, built; this document does not alter that record, only elaborates the lifecycle and rules that record was written against)
- [x] `docs/implementation/knowledge/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md` (the full implementation record — every constant, verb, table and rule cited below is read from this document and cross-checked against the code itself, not assumed)
- [x] `docs/implementation/intelligence/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md` (confirmed `opportunity-delivery` is a single, fused capability combining "identify an opportunity" and "deliver/resolve it" — the precedent this document relies on to name Opportunity→Deliver as one pillar, not two, so that Evidence is correctly the platform's *fourth* named pillar)
- [x] Existing code read in full before writing anything: `server/intelligence/evidence-learning/framework.ts` (`MIN_EVIDENCE_COUNT`, `MIN_CONSISTENCY`, `EVIDENCE_WINDOW_DAYS`, `CONFIDENCE_THRESHOLDS`, `detectPatternForDimension`, `recordOutcomeAndDetect`, `decideSignal`), `server/intelligence/evidence-learning/evidence-learning-store.ts` (`upsertSignal`'s terminal-status discipline — confirmed a decided signal's evidence fields keep refreshing after confirmation while `status` never resets), `server/intelligence/handlers/evidence-learning-handler.ts` (the exact `RecordOutcomeParams` shape and the honest-gap message for a missing field), `server/intelligence/capability-registry.ts` (the two existing `ENRICHMENT` guidance items for `evidence-learning`, quoted verbatim below rather than re-paraphrased).

---

## 1. The Fourth Intelligence Pillar

**Naming decision, stated explicitly:** the platform already has three pillars in practice, each with its own governing document or implementation record, even though no prior document named them "pillars." This document is the first to name them, and adds the fourth:

| # | Pillar | What it does | Governing precedent |
|---|--------|---------------|----------------------|
| 1 | **Observe** | Reads a household's real, existing activity — planner, pantry, shopping, diary, food knowledge — through each Business Domain's own authoritative service. Never a second copy; never a private read path. | Domain Intelligence's existing enrich-never-own read discipline (Rule FI1, §3 of FI1) |
| 2 | **Understand** | Synthesises what was observed into household-scoped knowledge — Food Intelligence's Plane 2 "Personal Intelligence", the four-plane composition law. | FI1 §4 (the four-plane knowledge model) |
| 3 | **Opportunity → Deliver** | Turns understanding into a timely, non-intrusive, explainable suggestion, and manages that suggestion's full lifecycle (deliver → acknowledge → accept/dismiss) without ever writing to the business fact it's about. Named as **one** pillar, not two, because OD1 already fused these into a single capability (`opportunity-delivery`, verbs `report`/`review`/`approve`/`delete`) precisely because delivery is inseparable from the opportunity it delivers. | FI4 (opportunity identification) + OD1 (delivery lifecycle) |
| 4 | **Evidence** *(this document)* | Captures what actually happened — independent of whether a suggestion from pillar 3 was involved at all — accumulates it, and, only once accumulated evidence is both plentiful and consistent, turns it into something Understand (pillar 2) can be told about, explicitly confirmed, and use to do a better job next time. This is the **continuous learning loop**: it is the only pillar whose output feeds back into an earlier pillar rather than only forward. | EL1, refined by this document |

Pillars 1–3 form a straight line: Observe → Understand → Opportunity → Deliver. Evidence is not a fifth step appended to the end of that line — it is the loop that closes Deliver (and every other household outcome, whether or not a Deliver-pillar suggestion was involved) back into Understand:

```
        ┌───────────────────────────────────────────────────┐
        │                                                     │
        ▼                                                     │
   1 OBSERVE  ──▶  2 UNDERSTAND  ──▶  3 OPPORTUNITY → DELIVER  │
        ▲                │                        │           │
        │                │                        │           │
        └────────────────┴───────── 4 EVIDENCE ◀───┘
                    (confirmed understanding feeds back into 2;
                     repeated, un-consistent observation feeds
                     back into 1 as an honest "no pattern yet")
```

Formal promotion of this frame into `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` itself (the way NUT2 → FI1 and TIP1/TIP3 were promoted from investigation to governing architecture) is named as follow-up, not done by this document — see "Suggestions for follow-up".

---

## 2. The Evidence Lifecycle

The ticket names five stages: **Observation → Evidence → Pattern → Confirmed Understanding → Improved Opportunities.** EL1's code already implements every transition between these stages correctly; it just never named the first and last stage, and used "signal" where this document uses "Pattern"/"Confirmed Understanding". No renaming of code happens here — this is the map from the ticket's canonical lifecycle names to what EL1 already built:

| Lifecycle stage | What it is | Backed by (unchanged EL1 code) |
|---|---|---|
| **1. Observation** | The raw, in-the-moment fact, before it is structured or persisted anywhere — a household finished a meal, logged leftovers, skipped a recipe, took a photo. Not yet a platform fact; exists only in the moment and in whichever Business Domain surface noticed it. | Not persisted. This is the moment that triggers a call to the canonical Evidence API (§4). |
| **2. Evidence** | The Observation, captured as one structured, append-only record: which household, which domain reported it, what it's about (`subjectType`/`subjectKey`/`subjectId`), what kind of outcome (`outcomeType`), which way it leaned (`direction`), when it happened. Never edited after insert. | `household_evidence_events`, written only via the `report` verb (`recordOutcomeAndDetect` → `store.recordEvent`). |
| **3. Pattern** | A dimension (`domain` + `subjectType` + `subjectKey`) whose accumulated Evidence, within the last `EVIDENCE_WINDOW_DAYS` (90), has cleared the structural bar: at least `MIN_EVIDENCE_COUNT` (3) polarised (non-neutral) events, at least `MIN_CONSISTENCY` (70%) agreement on one direction. A candidate, not a belief. | `household_learning_signals` row with `status = "pending_confirmation"`, produced by `detectPatterns`/`detectPatternForDimension`. |
| **4. Confirmed Understanding** | A Pattern a household (or an authorised confirmation flow acting on the household's behalf) has explicitly reviewed and confirmed. This is the *only* thing this platform is permitted to call "understood" — statistical confidence alone, however high, never crosses this line by itself. | `household_learning_signals` row with `status = "confirmed"`, set only via `decideSignal`/`approve` — **strong** confirmation tier, the same platform-wide gate every other write verb goes through. |
| **5. Improved Opportunities** | The intended downstream effect, not yet wired: a future Opportunity-pillar producer (e.g. FI4's opportunity engine) reads Confirmed Understanding via `search` as one more input to re-weight what it already knows how to suggest — never a new source of truth, never authoring a capability it doesn't already have. | Not yet wired — EL1's own named next milestone. §4 below states the read contract this future wiring must respect (Rule EL2, "reads only", "re-weight never author"). |

Two terminal branches exist alongside stage 4 that the ticket's five-stage list doesn't name but the code already handles correctly, and this document names for completeness:

- **Declined Pattern** — a Pattern the household explicitly rejected (`status = "declined"`, via `delete`). Terminal: never silently re-asked, never resurfaces as a fresh Pattern for the same dimension while declined evidence keeps accumulating (`isDecidedSignalStatus`/`upsertSignal`'s terminal-status discipline).
- **No Pattern Yet** — the honest gap. Most dimensions, most of the time, sit here: evidence is accumulating but has not cleared `MIN_EVIDENCE_COUNT`/`MIN_CONSISTENCY`. `search` for such a dimension correctly returns nothing, not a weak or partial pattern.

**Decay is part of this lifecycle, not a separate mechanism bolted on** — see §7 (ET3). An Evidence record never expires or is deleted, but it stops counting toward stage 3 once it ages out of the 90-day window; a Pattern (or even a Confirmed Understanding) can therefore lose its supporting count over time if new corroborating Evidence stops arriving, which is the correct behaviour for a household whose habits have genuinely changed.

---

## 3. Language refinement — engineering terms → platform and user language

**No code, table, column, verb, or file name is renamed by this document.** `household_evidence_events`, `household_learning_signals`, `report`/`search`/`approve`/`delete`, `evidence-learning-store.ts` — all stay exactly as EL1 built them; TIP2's closed 20-verb taxonomy is not extended. What this section defines is the canonical **platform-language** (for architecture docs, capability guidance, Companion Card copy) and **user-language** (for any future surface a household actually sees) that maps onto that unchanged code, so that no future implementer re-derives ad hoc terminology per surface the way FI1 warned against for business-domain taxonomies (Rule FI1: "no duplicate entities").

| Engineering term (code — unchanged) | Platform term (this document, for docs/guidance) | User-facing term (for a future surface, illustrative) |
|---|---|---|
| a row in `household_evidence_events` | **Evidence** | an "observation" — usually invisible, captured automatically as the household uses the app |
| a `household_learning_signals` row, `status = pending_confirmation` | **Pattern** | "something we've noticed" |
| a `household_learning_signals` row, `status = confirmed` | **Confirmed Understanding** | "something we now know about your household" |
| a `household_learning_signals` row, `status = declined` | **Declined Pattern** | "not applied" |
| the `report` verb on `evidence-learning` | **submitting Evidence** (via the Evidence API, §4) | invisible — happens as a side effect of normal use, never a form the household fills in unprompted |
| the `search` verb | **reviewing current understanding** | "what we've learned" |
| the `approve` verb | **confirming understanding** | "yes, that's right" |
| the `delete` verb (on a signal) | **declining a Pattern** | "no, that's not right" |
| `direction: "positive" \| "negative" \| "neutral"` | **outcome polarity** | contextual copy, e.g. "loved it" / "didn't land" — never shown as raw `direction` |
| `confidence: "low" \| "medium" \| "high"` | **confidence** | "just noticed" / "fairly sure" / "confident" |
| `subjectType` / `subjectKey` / `subjectId` | **the Evidence subject** — the thing the Evidence is about | named directly, e.g. "this recipe", "this ingredient" — the raw field names never surface |
| `sourceCapabilityId` | **the reporting capability** | invisible to the household |
| `rationale` + `supportingEventIds` | **the explanation** | "based on the last N times" (§7, ET6) |

This table is the single place future implementers should look before inventing a new word for any of the above — the same role FI1's Rule FI1 plays for ownership questions.

---

## 4. The canonical Evidence API

**Rule EL2 — Evidence flows through one door.** Every Business Domain and every Domain Intelligence producer — Food Intelligence, Planner, Shopping, Pantry, a future photo-analysis capability, anything built after this document — submits Evidence through exactly one platform capability: `evidence-learning`'s `report` verb, reached only through the ordinary Intent Engine pipeline (LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND), exactly as every other write on this platform already is. No domain may import `evidence-learning-store.ts`, query `household_evidence_events`/`household_learning_signals` directly, or otherwise gain a private write path onto either table.

This is not a new constraint EL2 imposes — it is already structurally true in the code EL1 built (the store's only caller is `framework.ts`; `framework.ts`'s only callers are the handler; the handler is the only thing the binding exposes). Rule EL2 makes it an explicit, citable rule, the same way Rule FI1 made Food Intelligence's pre-existing read discipline explicit and citable — so a future reviewer can point at "Rule EL2" instead of re-deriving the guarantee from the file structure each time.

**The one entry point, named:** `RecordOutcomeParams` (`server/intelligence/handlers/evidence-learning-handler.ts`) — `{ domain, subjectType, subjectId, subjectKey, outcomeType, direction, context?, sourceCapabilityId }`, all fields but `context` required; a missing field is an honest gap (`REPORT_MISSING_FIELD_MESSAGE`), never a partial capture. This is already expressive enough for every example in §5 and §6 below without any shape change.

**What Rule EL2 does not (yet) do:** every domain today would call `report` by constructing this parameter object and going through `intelligencePlatform.handle()` directly — functionally correct, but not ergonomic. A thin, typed helper at the domain-facing edge (e.g. a single `recordHouseholdObservation(...)` wrapper any Business Domain can import, that fills in `sourceCapabilityId` from the caller and forwards to the one registered verb) would make Rule EL2 easy to follow by default rather than only by discipline. This is a small, additive, non-architectural convenience — named here as a candidate for the same EWO that wires the first real reporter, not built by this document (see "Suggestions for follow-up").

**What Rule EL2 explicitly protects against:** a second Evidence pathway appearing informally — e.g. a domain writing its own "outcomes" table because reaching the platform capability felt like more ceremony than a direct insert. Rule EL2 exists specifically so that temptation has a named rule to violate, and a reviewer has a one-line citation to point at.

---

## 5. Lightweight household outcome capture — principles and examples

`outcomeType` and `direction` are, by design, free-form strings supplied by the reporting domain — EL1 deliberately does not own or impose an outcome taxonomy (Principle: "no duplicate entities", carried from FI1 into EL1's own compliance checklist). The examples below are **illustrative, not a closed enum** — a future reporting domain may use different `outcomeType` strings for outcomes not listed here, and this platform will accumulate and pattern-detect them exactly the same way, with no schema or code change required.

| Household moment | `outcomeType` (illustrative) | `direction` | `subjectType` (illustrative) |
|---|---|---|---|
| Everyone enjoyed it | `meal_finished` | `positive` | `meal` |
| Didn't eat | `meal_skipped` | `negative` | `meal` |
| Leftovers | `leftovers_reported` | `neutral` or `negative`* | `meal` |
| Ingredient forgotten | `ingredient_missing` | `negative` | `ingredient` |
| Meal adapted | `meal_adapted` | `neutral` | `meal` |
| Too much waste | `waste_reported` | `negative` | `meal` |
| Meal photo | `meal_photo` | derived from analysis, see §6 | `meal` |
| Leftover photo | `leftover_photo` | derived from analysis, see §6 | `meal` |

\* Whether "leftovers" is `neutral` (a household that plans for leftovers deliberately) or `negative` (unplanned surplus) is a judgement only the reporting domain can make from its own context — this platform does not infer polarity from the outcome type string; the reporting domain must supply `direction` explicitly, honestly reflecting what it actually knows, never a guessed default.

**The lightweight capture principle:** every one of these is a single, cheap, low-friction moment — a tap, a photo, an already-happening app action — never a form, a survey, or a request for the household to explain itself. This mirrors `MIN_EVIDENCE_COUNT`'s own design intent (§7, ET1): the platform is built to need *many small, easy signals*, not a few effortful, detailed ones. A capture surface that asks a household to justify or elaborate on an outcome has drifted out of scope for Evidence capture — that belongs, if anywhere, in direct product feedback, not this pipeline.

---

## 6. Photo analysis as an Evidence source

A photo of a finished meal or of leftovers is not a special case requiring its own workflow, table, or capability — it is Evidence capture exactly like every other row in the table above, with one difference: the `direction` (and possibly `outcomeType`) is derived by an analysis step instead of being supplied directly by a simple app action.

The shape stays identical to every other call to `report`:

```
{
  domain: "food-intelligence",
  subjectType: "meal",
  subjectId: "<meal id>",
  subjectKey: "<recipe/meal identity the pattern groups on>",
  outcomeType: "leftover_photo",
  direction: <derived from the photo-analysis result — "negative" if the photo shows
              most of a portion untouched, "positive" if it shows an empty plate, etc.>,
  context: { photoAnalysisConfidence: 0.86, ...whatever the analysis capability itself
             already returns, carried through verbatim — never re-derived by this platform },
  sourceCapabilityId: "<the photo-analysis capability's own id>",
}
```

**Why this matters architecturally:** a photo-analysis capability, once built, becomes just another entry that calls `report` through Rule EL2's one door — exactly as a manual "didn't eat" tap does today. It does **not** need its own delivery lifecycle, its own confirmation store, or its own pattern-detection logic; `detectPatterns` (§7, ET1/ET2) already treats every polarised event identically regardless of whether a human tapped a button or a vision model produced the `direction`. This is the direct consequence of Rule FI1 ("enrichment, not ownership") applied one level down: photo analysis enriches the Evidence stream, it never becomes a second Evidence pipeline.

**What this document does not do:** it does not build the photo-analysis capability, does not decide which vision model or confidence threshold produces `direction` from a photo, and does not decide whether photo analysis runs synchronously (blocking the `report` call) or asynchronously (a separate step that calls `report` once analysis completes). All three are implementation decisions for the (future, separately scoped) photo-analysis EWO — this document only confirms that whatever that EWO builds has exactly one place to hand its result to: the same `report` verb every other reporter already uses, with `context` carrying analysis metadata for explainability (ET6) exactly the way any other domain's `context` payload would.

---

## 7. The Evidence Trust Rules — decay, confidence, confirmation, explainability

Six rules, all already true of the code EL1 shipped; this document is the first place they are named together as a set, the way FI1 §5 named its own "Governing Trust Rules" for the knowledge planes.

- **ET1 — Never from one observation.** No Pattern is ever detected for a dimension with fewer than `MIN_EVIDENCE_COUNT` (3) polarised events — a structural `if` at the top of `detectPatternForDimension`, not a convention. One accepted or rejected meal can never, by construction, become a Pattern.
- **ET2 — Consistency before confidence.** Even at ≥3 polarised events, no Pattern is detected unless at least `MIN_CONSISTENCY` (70%) of them agree on one direction. A household that is genuinely 50/50 on something produces an honest "no Pattern yet", never a low-confidence guess presented as a real one.
- **ET3 — Evidence decays.** Pattern detection only ever considers Evidence within a rolling `EVIDENCE_WINDOW_DAYS` (90) window of the triggering event's own timestamp. Evidence older than the window is never deleted (the append-only log is permanent, per Principle 6 — honest history, never erased) but it stops counting toward whether a Pattern exists. A household whose habits genuinely change will, within one window, see an old Pattern's supporting count fall as stale Evidence ages out — the platform is designed to be able to "forget" a stale read, not lock a household into an outdated Confirmed Understanding forever. **Decay today is lazy, not proactive**: a dimension's stats only recompute on the *next* `report` call for that same dimension (`recordOutcomeAndDetect` re-windows only when new Evidence arrives) — there is no background sweep that ages out a Pattern's stats on a schedule with no new Evidence at all. This is an honest, named limitation, not a hidden one — see "Remaining Architectural Risks" below.
- **ET4 — Confidence grows with volume and consistency, never with time alone.** `bucketConfidence` buckets `low` (≥3), `medium` (≥5), `high` (≥8) polarised, consistent events — confidence is a monotonic function of accumulated, still-in-window, agreeing Evidence, never of elapsed time, and never a statistical or ML score. Decay (ET3) can only ever pull confidence back down by dropping stale Evidence out of the window; nothing pushes confidence up except more real, consistent Evidence arriving.
- **ET5 — Confirmation is a separate, higher gate than detection.** Clearing ET1/ET2 produces a Pattern with `status = "pending_confirmation"` — never Confirmed Understanding. Only an explicit, platform-gated, **strong**-confirmation-tier `approve` call (a human decision, not a threshold) promotes a Pattern to Confirmed Understanding. `permissions.ts::confirmationFor` maps `approve` to `"strong"` platform-wide — this document does not add or relax that gate, only names why it exists at this exact point in the lifecycle: statistical confidence, however high, is a claim about the *evidence*, not a claim about what the household wants understood.
- **ET6 — Every Pattern and every Confirmed Understanding explains itself.** `rationale` (a plain sentence built from actual counted evidence) and `supportingEventIds` (the exact Evidence rows behind it) travel with every signal, always. No future surface may present a Pattern or Confirmed Understanding without also making its evidence trail available — this is structural (the fields exist on every row) not a UI convention that could be dropped.

---

## 8. The isolated-event invariant, reconfirmed

The brief's closing requirement — *"repeated evidence contributes to household understanding while isolated events never become permanent preferences"* — is not a new rule this document adds. It is the composite guarantee of ET1 (no Pattern from one event) + ET5 (Pattern ≠ Confirmed Understanding without an explicit human decision) + the existing, unchanged EL1 hard boundary that confirming a signal **only ever writes that signal's own status fields** (`evidence-learning-handler.ts`'s "NEVER ADAPTS A PREFERENCE ITSELF" boundary). This document reconfirms, without changing, the full chain:

```
isolated event  ──✗──▶  Pattern            (blocked by ET1)
Pattern         ──✗──▶  Confirmed Understanding   (blocked by ET5 — needs explicit approve)
Confirmed Understanding  ──✗──▶  household preference   (blocked by "never adapts a preference
                                                            itself" — needs a SEPARATE, human-
                                                            triggered write through the
                                                            preference store's own owner)
```

Three independent gates, not one — an isolated event is stopped at the first; even overwhelming, consistent evidence is stopped at the second until a household says so explicitly; and even an explicit confirmation is stopped at the third from automatically becoming a preference, by design (Rule FI1 applied to EL1's own output: Evidence enriches, it never owns). This document does not weaken, bypass, or add an exception to any of the three.

---

## DEFINITION OF DONE

**What success looks like:**
- The platform's fourth pillar (Evidence, alongside Observe/Understand/Opportunity→Deliver) is named, positioned in the loop, and its relationship to the other three is explicit (§1) ✅
- The five-stage Evidence lifecycle (Observation → Evidence → Pattern → Confirmed Understanding → Improved Opportunities) is mapped onto EL1's existing, unchanged code, with the two terminal branches (Declined Pattern, No Pattern Yet) named for completeness (§2) ✅
- A canonical engineering-term → platform-term → user-term glossary exists so future surfaces don't each invent their own words for the same fact (§3) ✅
- The canonical Evidence API is named as Rule EL2 ("Evidence flows through one door"), citable the way Rule FI1 already is (§4) ✅
- Lightweight household outcome capture is defined with the brief's own eight examples mapped to the existing free-form `outcomeType`/`direction`/`subjectType` shape, explicitly non-exhaustive (§5) ✅
- Photo analysis is shown to require zero new workflow, table, or capability — only another `report` caller (§6) ✅
- Decay, confidence growth, confirmation thresholds and explainability are named as six citable Evidence Trust Rules (ET1–ET6), each traced to the exact existing constant or code path that already enforces it (§7) ✅
- The isolated-event invariant is reconfirmed as the composite of three independent, already-existing gates, with no new exception introduced (§8) ✅
- This document exists at `docs/investigations/intelligence/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md` ✅

**What must not break:** everything, because nothing is touched. No file EL1 created or modified is edited by this document. `npm test`'s full chain, `evidence-learning`'s registration as the platform's 21st capability, its four executable verbs, and every threshold constant are all unchanged and unre-verified by this task because none of them could have regressed — this document contains no code.

**Manual verification of "documentation only, zero drift from the code it describes":**
1. Every constant cited (`MIN_EVIDENCE_COUNT = 3`, `MIN_CONSISTENCY = 0.7`, `EVIDENCE_WINDOW_DAYS = 90`, confidence thresholds `3`/`5`/`8`) matches `server/intelligence/evidence-learning/framework.ts` verbatim as of this document's date.
2. `RecordOutcomeParams`'s field list (§4) matches `server/intelligence/handlers/evidence-learning-handler.ts` verbatim.
3. The two `ENRICHMENT` guidance items quoted are unmodified in `server/intelligence/capability-registry.ts`.
4. `git status` / `git diff` show no changes outside this one new file.

---

## DATA IMPACT

- Reads existing data: **NO** — this is a documentation-only task; no code runs.
- Writes new data: **NO** new table, column, or row of any kind. Nothing outside this one markdown file is added.
- Changes meaning of existing data: **NO.**
- Requires backfill: **NO.**

---

## TRUST CHECK

- **Could this mislead the user?** No user-facing surface exists yet for any of this (unchanged from EL1). This document's §3 glossary exists specifically to prevent a future surface from inventing misleading ad hoc language (e.g. presenting a `pending_confirmation` Pattern as if it were already Confirmed Understanding) before one is ever built.
- **Could this fabricate certainty?** No — §7 (ET1–ET6) restates, without weakening, every existing structural guard against fabricated certainty, and adds no new inference path.
- **Is anything guessed but shown as real?** No. §5's outcome-type examples are explicitly labelled illustrative, not a claim that this platform now recognises or validates any particular `outcomeType` string — it still accepts and pattern-detects any free-form value a reporting domain supplies, unchanged.
- **What happens if the system is wrong?** Unchanged from EL1: an honest gap (no Pattern, or a `search` result with fewer signals than expected), never a fabricated pattern or an autonomous preference change — reconfirmed explicitly in §8's three-gate chain.
- No architectural duplication introduced: **YES** — this document creates no new store, no new capability, no new verb; Rule EL2 (§4) exists precisely to prevent a *future* duplication (a second, informal Evidence pathway) from ever being tempting to build.
- No new source of truth created for any fact: **YES** — every fact this document describes already has exactly the owner EL1 gave it; nothing here is a second source of truth for anything.
- No runtime behaviour altered for any existing capability: **YES** — trivially true; no code is touched.

---

## ROLLBACK PLAN

- Rollback identifier: not applicable in the schema/code sense (STEP 1 of the Engineering Workflow governs code-changing tasks; this task changes no code). If this document itself needs to be reverted, `git rm docs/investigations/intelligence/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md` fully removes it — nothing else references it yet (it introduces no code any other file imports or depends on).
- Files added: this file only.
- Files modified: none.

---

## SCOPE LOCK

**Implemented scope (this task):**
- Naming and positioning the platform's fourth pillar, Evidence, alongside the three existing pillars (Observe / Understand / Opportunity→Deliver) and its place in the continuous-learning loop (§1).
- Mapping the ticket's five-stage Evidence lifecycle onto EL1's existing `household_evidence_events`/`household_learning_signals` implementation, naming the two additional terminal branches the code already handles (§2).
- A canonical engineering/platform/user language glossary for every Evidence concept (§3).
- Naming the canonical Evidence API as Rule EL2 — the existing, unchanged `report` verb as the one door every domain must use (§4).
- Defining lightweight household outcome capture principles with the brief's eight named examples, explicitly as illustrative, non-exhaustive `outcomeType`/`direction` values (§5).
- Defining photo analysis as an ordinary Evidence source requiring no separate workflow (§6).
- Naming six Evidence Trust Rules (ET1–ET6) covering decay, confidence growth, confirmation thresholds and explainability, each traced to the exact existing code that already enforces it, including the honest note that decay is lazy/event-triggered rather than a proactive background sweep (§7).
- Reconfirming the isolated-event invariant as the composite of three independent, pre-existing gates (§8).
- This document.

**Explicitly excluded (out of scope — honest gaps, not oversights):**
- Any code, schema, capability, verb, threshold, or test change of any kind — this is a documentation-only refinement, by the ticket's own "Implement only this scope."
- Formal promotion of §1's "four pillars" frame into `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` itself — named as follow-up, mirroring the NUT2 → FI1 and TIP1/TIP3 promotion precedent, not done here.
- The ergonomic `recordHouseholdObservation()` domain-facing helper named in §4 — a small, additive convenience for a future reporter-wiring EWO, not built here.
- Any proactive/background decay sweep for stale Patterns with no new incoming Evidence (§7, ET3) — named as an honest, currently-lazy behaviour, not fixed here.
- Wiring a first real reporting capability (Food Intelligence, a photo-analysis capability, or any other) — still EL1's own named next milestone, unstarted.
- Wiring a first real consumer of Confirmed Understanding (the "Improved Opportunities" stage, §2 row 5) — still EL1's own named next milestone, unstarted.
- Any UI or route surface for a household to review/confirm/decline Patterns — still not built, still not named as a concrete product requirement.

**Suggestions for follow-up workstreams (not implemented without approval):**
- Promote §1's four-pillar frame into `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, and this document's §3 glossary + §7 Evidence Trust Rules into `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §4.2 (which already points to EL1) — a governance-hygiene promotion, mirroring NUT2/TIP1/TIP3, once this refinement itself has been reviewed and accepted.
- Build the `recordHouseholdObservation()` ergonomic helper (§4) in the same EWO that wires the first real reporter, so that reporter is the first proof the helper's shape is right rather than a second, independent guess.
- Wire Food Intelligence (or another Business Domain) as the first real Evidence reporter, using the illustrative `outcomeType` vocabulary in §5 as a starting point, not a fixed spec — expect it to be refined once real household data exists.
- Scope and build a photo-analysis capability that calls `report` per §6, once product decides which outcomes (meal photo, leftover photo, or others) are worth the analysis cost.
- Consider whether ET3's lazy decay is sufficient for the product's real-world needs, or whether a scheduled recompute is warranted, once a real consuming surface exists to notice the difference — not before, per Principle 8 (evolution over replacement, not speculative infrastructure).

---

## FILES CHANGED

| File | Change |
|---|---|
| `docs/investigations/intelligence/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md` | **New** — this document. |

No other file is read-only-referenced-but-unmodified list needed beyond the Reference Documents Read section above; nothing else changed.

---

*This document satisfies STEP 9 of `docs/architecture/ENGINEERING_WORKFLOW.md` (Mandatory Project Documentation) for a documentation-only 🔴 RED investigation task.*
