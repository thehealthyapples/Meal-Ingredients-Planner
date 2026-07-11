# ATTN1 — Attention & Priority Model

**Status:** Investigation only. No code, schema, data, or runtime behaviour changed.
**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN (documentation only)
**Rollback identifier:** `rollback/before-attn1-attention-priority-model-20260709` → `f0ab371033fbf221830da0dabe348d60211cd47c` (dirty-tree snapshot: `git stash` entry `ATTN1_ROLLBACK: pre-investigation snapshot 2026-07-09`)
**Governing documents read:** `docs/architecture/README.md` (bootstrap), `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`, `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`, `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `NK2_THA_NUTRITION_METHODOLOGY.md`, `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`

---

## 0. HEADLINE

**THA already has an attention model. It is three-valued, declared three times, and it cannot express the one level that matters most.**

Three findings, all verified against the branch, none of them recorded in any governing document:

1. **There is no `critical`.** The platform's strongest safety doctrine — NK2 Priority 1, *"Safety is the absolute blocker. Never deprioritize, never assume, never defer. Rule T0 (household-level safety gate, non-overridable)"* (`NK2:179`) — has **no additive expression anywhere in the runtime.** Rule T0 is implemented only *subtractively*: it removes unsafe foods from recommendations (`engine.ts:40-42`) and from comparison verdicts (`comparison-engine.ts:43-44`). It has no power to *guarantee the surfacing* of an unsafe reality the household already has. The one opportunity that does that — a hard household restriction sitting on the shopping list — is emitted as an ordinary `priority: "high"` (`opportunity-engine.ts:255`), indistinguishable from a half-empty planner week.

2. **Consequently, a household can permanently silence its own allergen warnings.** `filterMutedTypes` (`framework.ts:226-233`) removes any opportunity whose `type` appears in the user's `mutedOpportunityTypes` preference (`schema.ts:696`). It contains **no exemption of any kind**. Adding the string `"shopping-restriction-conflict"` to that array silences every hard-restriction conflict for that household, permanently, with no override. The framework's own comment concedes muting *"removes a type outright and remains the only mechanism that can"* (`framework.ts:454-455`). Nothing marks a notice as exempt.

3. **Inside the top tier, safety has no precedence over trivia.** `prioritiseAndGroup` sorts on `priority → learning → seen → arrival` (`framework.ts:489-497`). The comment at `framework.ts:466-469` claims *"an acknowledged `shopping-restriction-conflict` still outranks every `medium`, so novelty can never bury a safety-relevant opportunity beneath trivia."* That is true — and insufficient. The Planner also emits `"high"` (`opportunity-engine.ts:172`, when ≥50% of the week is unplanned). Both are `high`, so the tie falls through to the `seen` key. **An allergen conflict the household has already acknowledged therefore sorts *below* an unseen "your week is half empty" nudge.** Safety is protected from `medium` and `low`. It is not protected from its own tier.

The corrective is not a new priority system. It is one carved level and one shared vocabulary: **`critical` is the missing additive face of a trust rule the platform already declares.**

---

## 1. SCOPE AND METHOD

**Mission:** determine how existing intelligence should consistently classify information as Critical / Important / Helpful / Informational, across Planner, Companion, Coach, Shopping, Food Intelligence and Comparison; identify reusable priority signals; recommend a *single* canonical Attention Model. Do not create a second priority system. Do not implement.

**Method:** exhaustive read of the six named surfaces plus the schema, the trust rules, and every governing document that touches ordering, suppression, evidence or safety. Every claim below carries a `file:line` citation and was verified directly, not inferred.

**Verified starting fact:** the string literals `'critical'` / `"critical"` appear **nowhere** in `server/`, `shared/`, or `client/src`. The four-level vocabulary the mission names does not exist today in any form.

---

## 2. WHAT EXISTS TODAY — THE HONEST BASELINE

### 2.1 One attention signal, declared three times

Three structurally identical unions, never imported across module boundaries:

| Declaration | File:line |
|---|---|
| `export type FoodOpportunityPriority = "high" \| "medium" \| "low";` | `opportunity-engine.ts:102` |
| `export type OpportunityPriority = "high" \| "medium" \| "low";` | `framework.ts:81` |
| `export type NoticePriority = "high" \| "medium" \| "low";` | `notice-engine.ts:100` |

And three identical rank maps, each module-private:

| Constant | File:line |
|---|---|
| `PRIORITY_RANK = { high: 0, medium: 1, low: 2 }` | `opportunity-engine.ts:271` |
| `PRIORITY_RANK = { high: 0, medium: 1, low: 2 }` | `framework.ts:424` |
| `PRIORITY_RANK = { high: 0, medium: 1, low: 2 }` | `notice-engine.ts:327` |

This duplication is **known and deliberate.** `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:191` names it: *"a priority-rank sort implemented three times (FI4, OD1, Notice Engine) by deliberate layer-independence."* The stated reason for re-declaring rather than importing is recorded at `notice-engine.ts:102-108`: to keep the pure adapter's *"zero-dependency footprint **on the platform's I/O modules**."*

**That rationale is load-bearing for the recommendation in §5, and it does not forbid a shared vocabulary.** It forbids depending on `framework.ts` and `opportunity-engine.ts` — modules that perform I/O. A pure, zero-I/O type module under `shared/` is precisely the dependency the platform's own Rule 4 *requires* ("Server+client shared modules must live in `shared/`"). The triplication of the *sort functions* is layer-independence. The triplication of the *vocabulary* is duplication.

### 2.2 Who emits what

The entire platform emits attention from exactly one producer file, and only one of its three values is ever computed:

| Opportunity type | Level | Where | Derivation |
|---|---|---|---|
| `shopping-restriction-conflict` | `high` | `opportunity-engine.ts:255` | Hard-coded literal. **Safety.** |
| `planner-empty-day` | `high` or `medium` | `opportunity-engine.ts:172` | `emptyDays/days >= 0.5 ? "high" : "medium"` |
| `pantry-item-unused-in-plan` | `low` | `opportunity-engine.ts:215` | Hard-coded literal |
| `nutrition-trend`, `seasonal`, `pantry` notices | `low` | `notice-engine.ts` | Hard-coded literals |
| `streak` notice | `medium` | `notice-engine.ts` | Hard-coded literal |

`opportunity-engine.ts:172` is **the only line in the platform that derives an attention level from data.** Everything else is a literal.

### 2.3 How attention is consumed

Two independent stages, two independent caps:

- **OD1 (`prioritiseAndGroup`, `framework.ts:475-499`)** — sorts `priority → learning → seen → arrival index`, clamps to `limit` (`DEFAULT_LIMIT = 10`, `MAX_LIMIT = 30`, `framework.ts:74-75`), groups by domain.
- **Notice Engine (`applySilenceRules`, `notice-engine.ts:334-348`)** — dedupes by `id`, sorts on `priority` alone, clamps to `MAX_NOTICES_PER_MOMENT = 2` (`notice-engine.ts:325`). Its comment (`notice-engine.ts:329-333`): *"This is the ONLY place presentation order/volume is decided — callers must never re-sort or re-slice."*

The caps **stack**: OD1 may deliver 10, the Notice Engine presents at most 2. Up to 8 opportunities are recorded as `delivered` and never seen by a human. The framework documents this honestly (`framework.ts:357-368`): `delivered` ≠ `seen`.

### 2.4 Suppression paths — and the absence of any exemption

| Mechanism | File:line | Exempts safety? |
|---|---|---|
| Type muting (`mutedOpportunityTypes`) | `framework.ts:226-233`, `schema.ts:696` | **No** |
| Terminal status (`dismissed` / `accepted`) | `framework.ts:405-418`, `delivery-store.ts:44-54` | **No** |
| Delivery clamp (`limit`, default 10) | `framework.ts:481,498` | **No** |
| Notice cap (`MAX_NOTICES_PER_MOMENT = 2`) | `notice-engine.ts:325,347` | **No** |
| Dedupe by `id` | `notice-engine.ts:336-340` | n/a |
| Rule E1 — no citation, no card | `notice-engine.ts:279` | n/a (correct) |
| Notability gates (`×7` streak, `×10` diversity) | `notice-engine.ts:185,206` | n/a |

**There is no `alwaysShow`, no non-suppressible flag, no reserved slot, and no `critical` tier.** The platform's only safety guarantee is emergent: *`priority` is the first sort key.* That guarantee holds across tiers and fails within one.

### 2.5 Persistence

Attention is persisted in exactly one place, and explicitly as a non-owning snapshot:

```ts
// shared/schema.ts:2396-2412  (table `opportunity_deliveries`)
priority: text("priority").notNull(),   // "high" | "medium" | "low"   ← schema.ts:2404
```

The schema comment (`schema.ts:2383-2388`) is unambiguous: *"`priority` … a snapshot of identifying metadata from the producing capability's own report at the moment of first delivery, used only to dedupe and to resolve acknowledge/dismiss/accept requests."* Nothing reads it as an authority. The `Notice` itself is never persisted (`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:86`); producer priority is *"recomputed fresh per request"* (`:83`).

**This is architecturally fortunate.** It means changing the vocabulary is not a data-ownership migration.

### 2.6 The prose model that already exists — and what it actually is

`NK2_THA_NUTRITION_METHODOLOGY.md` §2 (`:169-249`) declares a **five-tier Prioritisation Philosophy**:

| | Tier | Rule (verbatim, abridged) |
|---|---|---|
| P1 | Food Safety and Allergies | *"Safety is the absolute blocker. Never deprioritize, never assume, never defer. Rule T0 … applies."* (`:179`) |
| P2 | Foods the Household Already Cares About | *"Start where the household is."* (`:194`) |
| P3 | Pattern Awareness | *"Patterns are observed from household data, never inferred."* (`:210`) |
| P4 | Caution and Occasional-Use Awareness | *"Caution is sourced, not inferred."* (`:226`) |
| P5 | Personalised Optimisation | *"Personalisation never overrides safety, never invents facts."* (`:242`) |

**These five tiers are not the four attention levels, and must not be conflated with them.** NK2 §2 asks *"what kind of nutrition guidance is worth building and showing, in what order?"* — it is an **editorial content-class ordering**. The Attention Model asks *"how much should this household care about this specific item, right now?"* — a **per-instance runtime ranking**.

The distinction is real and testable: a P3 pattern signal ("you're light on fibre this week") can legitimately matter *more* to a household than a P2 meal fact ("this meal has 12g of protein"), even though P2 outranks P3 editorially. Class does not determine instance.

**P1 is the sole rung that is both.** It is a content class *and* an absolute per-instance override. That is exactly why `critical` is the only new level the platform needs, and exactly why it must not be invented from scratch — it already exists, in prose, as Rule T0.

### 2.7 Attention is not Confidence — and the platform already knows it

`EvidenceConfidence` (`evidence.ts:130`) is a fully-specified, orthogonal axis:

```ts
export type EvidenceConfidence = "established" | "strong" | "emerging" | "under-review";
```

It is **derived, never authored, never stored** (`evidence.ts:121-128`): *"derived SOLELY from the evidence chain and the review status … never inherited from a `confidence` / `evidenceStrength` column — those are editorial self-assessments (an AI draft may call itself `established`) and the gate ignores them."* Only `under-review` is non-renderable (`evidence.ts:140-142`).

The platform already forbids conflating the two, in one direction. COMP1's Rule E2 (`comparison-engine.ts:40-42`): *"these dimensions NEVER contribute to the recommendation verdict — comparing documentation density would fabricate a difference between foods."* And `comparison-engine.ts:538`: *"documentation coverage is not food quality."*

**The two axes are independent, and both directions must be forbidden:**

- A `critical` allergen fact is `established` confidence. High attention, high confidence.
- An `emerging` health benefit is `informational` attention. Low attention, low confidence.
- A well-evidenced fact about nothing important is `established` + `informational`. **Confidence must never raise attention.**
- An urgent fact we are unsure of is `under-review` — and therefore renders at **no** attention level at all. **Attention must never launder confidence.**

Order of operations follows directly, and is non-negotiable: **the evidence gate runs first and decides *whether* an item may render; attention runs second and orders only what survived.** Attention can never resurrect an ungated claim.

### 2.8 Signals that are *not* candidates

Named explicitly so no future workstream mistakes them for attention:

| Signal | File:line | Why not |
|---|---|---|
| `severity: "info" \| "warning" \| "error"` | `schema.ts:2557` | OBS1 **operator telemetry**. The Observation Engine architecture (`:182`) forbids any behaviour reading it back. |
| `confidence` (Behaviour Engine) | `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md:86` | Voice **provenance** `1`/`0`. *"not a model score … nothing reads it back."* |
| `priority: integer` | `schema.ts:1080` (`meal_pairings`), `schema.ts:1101` (`ingredient_products`) | **Sort order**, not importance. A pure word collision. |
| `priority: text` (`"high"\|"medium"\|"low"`) | `schema.ts:1769` | Reviewer-assigned **editorial triage**, not user-facing. |
| `ConfirmationTier = "none"\|"light"\|"required"\|"strong"` | `types.ts:86` | **Write-safety gate** on verbs. Orthogonal. |
| `LearningRank = -1 \| 0 \| 1` | `framework.ts:287` | **Re-weight direction**, strictly subordinate to attention. |
| `additives.riskLevel = "low"\|"moderate"\|"high"` | `schema.ts:630` | Domain risk datum, an *input* to attention, never the level itself. |
| Planner `score` / `fitScore` | `meal-scoring-service.ts:83-92` | **Selection** ranking (which meal wins), not attention (how much to care). |

### 2.9 The vocabulary collision map

The same word means different things in different modules today. Any canonical model must survive this, and should not add to it.

- **`priority`** — an importance tier (`opportunity-engine`, `framework`, `notice-engine`) **vs** an integer sort order (`schema.ts:1080,1101`) **vs** editorial triage (`schema.ts:1769`).
- **`tier`** — `ConfirmationTier` (`types.ts:86`) **vs** progressive-search depth `1|2|3|4` (`business-service-composition-registry.ts:60`) **vs** `ROUTED_TIER = 10` relevance offset (`context-relevance.ts:105`) **vs** knowledge-proximity band `"tier1-direct"…` (`knowledge-assembly.ts:66`) **vs** `COST_TIER` (`household-meal-matcher.ts:114`). **Five meanings.**
- **`confidence`** — intent-router certainty `0.48–0.93` (`pattern-intent-resolver.ts`) **vs** `EvidenceConfidence` (`evidence.ts:130`) **vs** ingredient-resolution coverage (`meal-intelligence-assembler.ts:143-145`) **vs** `preferenceConfidence` (`household-meal-matcher.ts:111`). **Four meanings.**
- **`scoreBreakdown`** — two incompatible shapes (`meal-scoring-service.ts:25-34` vs `explainability-service.ts:65-71`).

**The word `priority` is unsalvageable as a canonical name.** It is already overloaded within `shared/schema.ts` alone. This is the practical argument for the name **`attention`**: it is currently unused as an identifier anywhere in the codebase, and it is the word the governing architecture already reaches for — `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:39` describes the Notice Engine as budgeting *"the user's attention"*, and §6 (`:170`) is titled **"THE SILENCE RULES — THE ATTENTION BUDGET."** The concept is named in the architecture and unnamed in the code.

---

## 3. FINDINGS

**F1 — Vocabulary duplication (🟡 Important).** One attention concept, three unions and three rank maps (§2.1). Violates Governance Rule 4 in spirit and Principle 2 by the scope test: OD1's `priority` and the Notice's `priority` can *never* legitimately disagree — the notice copies it verbatim (`notice-engine.ts:284`) — so one is redundant. The sort *functions* genuinely differ and must stay independent; the *vocabulary* must not.

**F2 — Rule T0 has no additive expression (🔴 Critical).** T0 is declared non-overridable in `NK2:179`, and implemented in two engines as outright exclusion — `engine.ts:40-42`: *"any candidate that conflicts with an active hard restriction is EXCLUDED outright (never merely deprioritised, never shown with a warning)."* Both are **subtractive**. Neither can compel the platform to *tell a household about a hazard it already owns*. The notice pipeline is the only surface that can, and there T0 degrades to `priority: "high"`.

**F3 — Safety is mutable and dismissible (🔴 Critical).** `filterMutedTypes` (`framework.ts:226-233`) has no exemption; `isTerminalDeliveryStatus` (`delivery-store.ts:52-54`) suppresses `dismissed`/`accepted` forever. A household that mutes `"shopping-restriction-conflict"` never sees another hard-restriction warning. This is a live, reachable state today, requiring no new code.

**F4 — Safety ties with trivia inside the top tier (🟠 Medium, escalating).** Two producers emit `high` (`opportunity-engine.ts:172`, `:255`). Within a tie, `seen` demotes acknowledged items (`framework.ts:494-495`), so an acknowledged allergen conflict sorts beneath an unseen planner nudge. The framework's stated guarantee (`framework.ts:466-469`) is scoped to `medium`, and is silent on this case. Severity rises with every new `high` producer added.

**F5 — Stacked caps can silently drop a safety notice (🟠 Medium).** `MAX_NOTICES_PER_MOMENT = 2` (`notice-engine.ts:325`) with no reserved slot. Two `high` planner/pantry notices arriving before a restriction conflict will consume the entire budget, and the conflict is never shown.

**F6 — Attention and Confidence are correctly separated, and the separation is undefended (🟡 Important).** §2.7. The separation currently rests on module comments and Rule E2, not on a type boundary. `ranking` (prominence) and `confidence`/`evidenceStrength` (evidence) sit as sibling columns on the same three link tables (`schema.ts:1623,1654,1671`) with nothing preventing a future author from reading one as the other.

**F7 — NK2 §2 is a content-class ordering, not a per-item attention model (🟡 Important).** §2.6. It is prose-only, unenforced by any type, and only its P1 rung carries a runtime guarantee — which, per F2, is not actually enforced additively.

**F8 — Planner, Coach, Shopping and Food Report have no attention level at all (🟢 Informational).**
- **Planner** ranks by numeric `score`/`fitScore` and never emits an attention level. Its `DIMENSION_RANK` (`explainability-service.ts:90-105`) orders *explanation lines*, not importance. It even randomises among the top 3 of the top 5 (`smart-suggest-service.ts:922-924`) — selection, deliberately, is not attention.
- **Coach** computes nothing; it inherits the producer's level and applies sort + cap + dedupe only.
- **Shopping** has **no time-critical signal whatsoever** — no `out-of-stock`, `running-low`, or `expiring` opportunity type exists (`opportunity-engine.ts:97-100`). Its only opportunity is safety-driven. Expiry exists as a routing keyword (`pattern-intent-resolver.ts:1006-1017`) and a `freezerMeals.expiryDate` column (`schema.ts:821`), never as a ranked signal.
- **Food Report** section order is static source order (`FoodReport.tsx:96-200`); within-section order is an editorial `ranking` integer, never severity.
- **Comparison** has the platform's only true attention ladder — safety (T0) → Apple Score → processing (`comparison-engine.ts:444-547`) — but it produces a *verdict*, not an attention level.

**F9 — Attention is not owned by any store (🟢 Informational, and load-bearing).** §2.5. `opportunity_deliveries.priority` is a declared snapshot. Introducing a canonical vocabulary therefore creates **no new store**, requires **no new table**, and triggers **no Governance Rule 8 review** for a knowledge store.

---

## 4. THE ARCHITECTURAL QUESTION

The mission asks for one model classifying information as Critical / Important / Helpful / Informational. Three axes are currently entangled in the word "priority", and the model is only coherent if they are held apart:

| Axis | Question | Owner today | Values |
|---|---|---|---|
| **Attention** | How much should this household care? | `priority` (×3) | `high` `medium` `low` |
| **Confidence** | How sure are we this is true? | `EvidenceConfidence` | `established` `strong` `emerging` `under-review` |
| **Selection** | Which candidate wins? | Planner `score`, COMP1 ladder | numeric / ordinal |

**Attention is a property of a *fact's relationship to a household*. Confidence is a property of a *fact's evidence*. Selection is a property of a *set*.** They compose; they never substitute.

The correct pipeline order, which the recommendation below preserves:

```
   Evidence gate        →   Attention             →   Selection / caps
   (may this render?)       (how much to care)        (what fits the budget)
   evidence.ts              shared/attention/         sort + limit + silence rules
   under-review ⇒ drop      critical ⇒ reserved       critical ⇒ exempt from clamp
```

---

## 5. ARCHITECTURE RECOMMENDATION — THE CANONICAL ATTENTION MODEL

### 5.1 What it is

A **reference vocabulary**, not a store, not a service, not a capability.

Core [Principle 5](../../architecture/ARCHITECTURE_PRINCIPLES.md#principle-5--reference-vocabularies-stay-beside-the-spine-never-merged-in): *"Nutrient lists, benefit taxonomies, diet enums, allergen libraries, and other shared taxonomies are reference data. They sit beside the entity spine and are shared across entities."* An attention vocabulary is exactly this kind of object, and it belongs exactly where the allergen library and the diet-pattern enum already sit.

**Home:** `shared/attention/` — pure, zero-I/O, no imports from `server/`.

```ts
// shared/attention/index.ts   (proposed — NOT implemented by this investigation)

/** How much should this household care about this item, right now? */
export type AttentionLevel = "critical" | "important" | "helpful" | "informational";

/** Total order. Lower sorts first. The single canonical rank. */
export const ATTENTION_RANK: Readonly<Record<AttentionLevel, number>> = {
  critical: 0, important: 1, helpful: 2, informational: 3,
};

export const ATTENTION_LABELS: Readonly<Record<AttentionLevel, string>> = {
  critical: "Critical", important: "Important",
  helpful: "Helpful",  informational: "Informational",
};

/**
 * The CLOSED allowlist of opportunity/notice types permitted to be `critical`.
 * Every member must be backed by Rule T0 (household hard restriction, allergen,
 * intolerance, or sourced toxicity). Adding a member requires governance review.
 */
export const CRITICAL_TYPES: ReadonlySet<string> = new Set([
  "shopping-restriction-conflict",
]);

export function isCritical(level: AttentionLevel): boolean { return level === "critical"; }
```

`shared/` is dependency-safe by construction, so importing this from `notice-engine.ts` **does not** violate the zero-dependency rationale recorded at `notice-engine.ts:102-108` — that rationale forbids depending on the platform's *I/O modules*, which this is not.

### 5.2 The four levels, defined against existing doctrine

Each level is anchored to something the platform already declares. None is invented.

| Level | Definition | Anchored in | Today |
|---|---|---|---|
| **Critical** | A fact that could cause **harm** if unseen. Hard restrictions, allergens, intolerances, sourced toxicity. | **NK2 P1 + Rule T0** (`NK2:179`) — *"the only guidance that could cause harm if absent"* (`NK2:177`) | **Does not exist.** Degraded to `high`. |
| **Important** | An actionable gap the household would choose to act on. | today's `high` | `planner-empty-day` (≥50%) |
| **Helpful** | Useful guidance that improves an outcome; safely ignored. | today's `medium` | `streak`, `planner-empty-day` (<50%) |
| **Informational** | Context, patterns, celebration. No action implied. | today's `low` | `nutrition-trend`, `seasonal`, `pantry` |

**The mapping is a clean superset of the existing model.** `high|medium|low` → `important|helpful|informational` is a 1:1 rename that preserves the total order. `critical` is carved off the top of `high`, and exactly **one** live emitter moves into it: `opportunity-engine.ts:255`. Every other emitter's behaviour is byte-identical.

### 5.3 The invariants

**A1 — Attention is producer-assigned, never re-derived downstream.** Preserves today's rule: the Coach computes nothing (`notice-engine.ts:284` copies verbatim). Consumers sort and cap; they never reclassify.

**A2 — `critical` is closed.** A producer may emit `critical` only for a type in `CRITICAL_TYPES`, and only when Rule T0 applies: an *active household hard restriction, allergen, intolerance, or sourced toxicity*. Enforced structurally — a runtime assertion rejecting `critical` from a non-allowlisted type, tested. **Adding a member to `CRITICAL_TYPES` requires the same governance review as a new knowledge store (Governance Rule 8, by analogy).** This is the defence against attention inflation, which is the single largest risk this model carries (§7, R1).

**A3 — `critical` is exempt from suppression that a household did not consciously choose for that instance.** Specifically:
- **Exempt from type muting.** `filterMutedTypes` skips `critical`. A household may not blanket-silence a safety class. (`mutedOpportunityTypes` remains fully in force for every other level.)
- **Exempt from the delivery clamp.** `prioritiseAndGroup` admits all `critical` items before applying `limit` to the remainder.
- **Reserves a slot in the attention budget.** `applySilenceRules` fills `critical` first; `MAX_NOTICES_PER_MOMENT = 2` is unchanged, so two criticals may legitimately consume it.
- **Per-instance `dismiss` remains available.** A household that has genuinely resolved *this* conflict may dismiss *this* item. This is safe because opportunity ids are item-scoped (`shopping-restriction-conflict:${item.id}`, `opportunity-engine.ts:252`) — a recurrence on a new shopping item produces a new id and re-surfaces. Dismissal is an informed, explicit, single-item act; muting is a blind, permanent, whole-class act. **Only the latter is forbidden.**

**A4 — Nothing below `critical` is exempt from anything.** `important` is not "slightly critical". The exemptions in A3 attach to `critical` alone, or they are worthless.

**A5 — Attention ⊥ Confidence, in both directions.** The evidence gate runs first. An `under-review` claim renders at **no** attention level (`evidence.ts:140-142`). Confidence may never raise attention; attention may never launder confidence. `AttentionLevel` and `EvidenceConfidence` share no values, no rank map, and no module — deliberately.

**A6 — Attention is never owned by a store.** `opportunity_deliveries.priority` remains a non-authoritative snapshot (`schema.ts:2383-2388`). No new table. No new owner.

**A7 — `critical` is not a confirmation tier.** `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:148` forbids introducing *"[any] confirmation-tier exception … for notices."* `AttentionLevel` governs **surfacing**, `ConfirmationTier` (`types.ts:86`) governs **acting**. A `critical` notice still resolves through OD1's ordinary registered verbs at their ordinary confirmation tier. This model introduces no verb, no capability, and no confirmation exception.

### 5.4 Rule T0's two faces

The model's central claim, stated plainly:

> **T0-subtractive** — *never recommend an unsafe thing.* Implemented today (`engine.ts:40-42`, `comparison-engine.ts:43-44`).
> **T0-additive** — *never fail to surface an unsafe thing the household already has.* **This is `critical`.**

`critical` is not a new policy. It is the second half of a policy the platform adopted in `NK2:179` and only ever built half of.

---

## 6. WHY THIS IS NOT A SECOND PRIORITY SYSTEM

The mission's hard constraint. The model satisfies it by **subtraction**:

| | Before | After |
|---|---|---|
| Attention unions | 3 (`opportunity-engine`, `framework`, `notice-engine`) | **1** (`shared/attention`) |
| Rank maps | 3 | **1** |
| Sort functions | 3 (deliberately independent) | **3** (unchanged) |
| DB tables | 0 owning | **0 owning** |
| New values | — | **1** (`critical`) |

**Net: −4 declarations, +1 value.** Three of today's four attention values survive under new names with an unchanged total order. The three sort *implementations* are untouched, honouring the layer-independence that `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:191` names as deliberate.

### Compliance with governing architecture

| Governing rule | Verdict |
|---|---|
| **Principle 2** — one owner per fact; scope test | ✅ OD1's and the Notice's `priority` can never legitimately disagree (copied verbatim) → one is redundant → converge. |
| **Principle 5** — reference vocabularies beside the spine | ✅ This *is* the pattern. `shared/attention/` sits beside the allergen library and diet enum. |
| **Principle 6** — no fabricated knowledge | ✅ Attention orders facts; it never creates them. `critical` requires an *active, stored* household restriction. |
| **Principle 7** — no permanent sync bridge | ✅ Not a bridge. A single vocabulary consumed by three layers; no two stores kept in sync. |
| **Principle 8** — retire on introduction | ✅ Replaces `FoodOpportunityPriority`, `OpportunityPriority`, `NoticePriority` + 3 rank maps. Retirement condition in §7 Phase 6. |
| **Rule 3** — no parallel stores | ✅ Collapses three parallel declarations into one. |
| **Rule 4** — shared modules live in `shared/` | ✅ The direct remedy for the triplication. |
| **Rule 8** — governance review before a new knowledge store | ✅ Not a knowledge store; no table. Review is nonetheless required for `CRITICAL_TYPES` membership (A2). |
| **Notice Engine `:191`** — triplicated sort is deliberate | ✅ Sorts stay triplicated. Only the vocabulary converges. |
| **Notice Engine `:102-108`** — zero I/O-module dependency | ✅ `shared/` is pure and dependency-safe. |
| **Notice Engine `:148`** — no confirmation-tier exception for notices | ✅ A7. Attention ≠ confirmation. |
| **COMP1 Rule E2** — documentation density is not quality | ✅ A5 generalises E2 into a two-way type boundary. |
| **Discovery & Presentation / Companion Card principles** | ✅ Untouched. Attention is a field on a reference, never presentation, and never a new conversation layout. |

**No governing document is contradicted. No STOP condition is triggered.**

---

## 7. IMPLEMENTATION ROADMAP

Sequenced so that **every behaviour change is isolated to one phase**, and everything before it is provably inert.

### Phase 0 — Decision (no code)
Approve: (a) the name `attention`; (b) the four levels; (c) the initial `CRITICAL_TYPES` allowlist = `{ shopping-restriction-conflict }`; (d) the A3 exemption set — specifically that **muting is forbidden for `critical` but per-instance dismissal is retained** (§5.3). Resolve the open questions in §9.
*Gate:* written approval. **This is the only phase where the model's shape can still change cheaply.**

### Phase 1 — Introduce the vocabulary (zero consumers, zero behaviour change)
Create `shared/attention/index.ts` per §5.1. No module imports it yet.
*Verification:* typecheck + full suite green; no runtime file changed.

### Phase 2 — Adopt the type, preserve the sorts (zero behaviour change)
Replace the three unions with deprecated aliases (`export type OpportunityPriority = AttentionLevel`) and the three `PRIORITY_RANK` constants with imports of `ATTENTION_RANK`. Keep all three sort *functions* exactly as they are. Because no producer emits `critical` yet, and `important|helpful|informational` preserve the order of `high|medium|low`, output is byte-identical.
*Verification:* golden-fixture test asserting `prioritiseAndGroup` and `applySilenceRules` return **identical orderings** before and after, across the existing fixtures in `test-intelligence-notice-engine.ts` and `test-intelligence-opportunity-delivery-binding.ts`.
*Note:* Phase 2 can ship without ever renaming `high`→`important` at the value level (see Phase 5). Aliasing the *type* is independent of migrating the *values*.

### Phase 3 — Introduce `critical` (⚠️ the first and only behaviour change)
1. Reclassify `opportunity-engine.ts:255` from `"high"` → `"critical"`.
2. Add the A2 structural assertion: a non-allowlisted type emitting `critical` throws.
3. Add the A3 exemptions: `filterMutedTypes` skips `critical`; `prioritiseAndGroup` admits `critical` before clamping; `applySilenceRules` fills `critical` first.
4. Leave `dismiss`/`accept` untouched (A3).

*Data impact:* `opportunity_deliveries.priority` rows written before this phase hold the string `"high"` for restriction conflicts. **No backfill is required** — the column is a declared dedupe/resolve snapshot (`schema.ts:2383-2388`) and no code branches on its value. A backfill is *optional cosmetic hygiene*, not correctness. This must be stated in the change's Data Impact section rather than assumed.

*Verification (must all be new tests):*
- A muted `shopping-restriction-conflict` **still surfaces**.
- A `critical` item surfaces when 10+ `important` items are also eligible (clamp exemption).
- A `critical` item surfaces when 2 `important` notices precede it (budget reservation).
- An **acknowledged** `critical` still outranks an **unseen** `important` (closes F4).
- A non-allowlisted type emitting `critical` throws.
- Per-instance `dismiss` of a `critical` still suppresses *that* instance, and a new item id re-surfaces.

*Rollback:* single-commit revert; no schema change to unwind.

### Phase 4 — Close the confidence boundary (defensive, no behaviour change)
Add a type-level and test-level guard that `AttentionLevel` and `EvidenceConfidence` are never assigned across (A5), and that the evidence gate precedes attention ordering in every assembler path. Addresses F6.

### Phase 5 — Value rename (optional, deferrable, highest churn / lowest value)
Migrate the emitted literals `high|medium|low` → `important|helpful|informational`, including the persisted snapshot column.
**Recommendation: defer indefinitely, or drop.** It is pure cosmetics, touches every fixture and the DB, and delivers no behavioural or safety benefit. Phases 1–4 obtain the entire architecture without it. Listed only so the decision is explicit rather than accidental. If the four-name vocabulary must appear in the UI, map at the presentation edge via `ATTENTION_LABELS` instead.

### Phase 6 — Retire the predecessors (Principle 8)
**Retirement condition:** all three modules import `AttentionLevel` and `ATTENTION_RANK` from `shared/attention/`, no module declares a local priority union or rank map, and Phase 3's tests are green. On satisfaction, delete the deprecated aliases and update `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Governance Rule 7).

### Phase 7 — Extend to the remaining surfaces (only where a rule already exists)
- **Comparison** — express T0's rung-1 exclusion as `critical` in the shared vocabulary; the verdict ladder is unchanged.
- **Food Report / Food Intelligence** — attach `critical` to allergen/restriction facts. **Do not** map `upfScore`/`novaGroup`/`riskLevel` to attention yet: NK2 P4 requires *"Caution is sourced, not inferred"* (`NK2:226`), and no sourced caution rule exists today. Inventing one would fabricate guidance (Principle 6).
- **Planner** — emits selection scores, not attention. It should adopt the vocabulary **only** for opportunities it produces, never for meal ranking. `score` is not attention.
- **Shopping** — has no time-urgency signal (F8). If expiry/out-of-stock urgency is ever built, it enters as `important`, **never** `critical`; `critical` is reserved for harm, not inconvenience.

**A note on order.** Phases 1–2 are inert and can land immediately. Phase 3 is the whole point, and is a genuine behaviour change that closes two 🔴 findings. Phase 5 is cosmetic and should probably never happen. Resist the temptation to lead with the rename because it feels like the "real" change: it is the only phase with no safety value.

---

## 8. RISKS

| ID | Risk | Phase | Sev | Mitigation |
|---|---|---|---|---|
| R1 | **Attention inflation** — `critical` spreads to non-harm items, restoring today's failure at a new level | 3+ | 🔴 High | `CRITICAL_TYPES` is a closed allowlist with a structural runtime assertion (A2); membership needs governance review. **This is the model's principal long-term risk.** |
| R2 | Muting exemption is read as a dark pattern — a notice the household cannot switch off | 3 | 🟠 Med | Per-instance `dismiss` is retained (A3). Only blind, whole-class muting of a harm signal is removed. Copy must explain why. |
| R3 | `critical` starves the `MAX_NOTICES_PER_MOMENT = 2` budget | 3 | 🟡 Low | Bounded by design: a household has few active hard restrictions, and the id is item-scoped. Monitor; do not pre-optimise. |
| R4 | Phase 2 silently changes ordering | 2 | 🟡 Low | Golden-fixture identity test is the phase's gate. |
| R5 | Someone conflates `AttentionLevel` with `EvidenceConfidence` | any | 🟠 Med | A5 + Phase 4 guard. The risk is real: `ranking` and `confidence` are already sibling columns (`schema.ts:1623,1654,1671`). |
| R6 | Phase 5 rename churns fixtures and the DB for no behavioural gain | 5 | 🟡 Low | Deferred by default; explicitly recommended against. |
| R7 | `critical` is mistaken for a confirmation tier or a new capability | any | 🟡 Low | A7. The model registers no capability and no verb (`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:151`). |

---

## 9. OPEN QUESTIONS — DECISIONS REQUIRED BEFORE PHASE 1

1. **Is per-instance `dismiss` of a `critical` acceptable?** This investigation recommends **yes** (A3): the id is item-scoped, so dismissal cannot silence a *future* conflict, and forbidding it would make the notice undismissable. The alternative — `critical` is undismissable — is defensible but produces a permanently stuck card.
2. **Does the `high` → `important` rename ever happen?** Recommended: **no** (Phase 5). Requires an explicit decision so it is not later done by accident.
3. **Does `upfSensitivity` (`schema.ts:667`) modulate attention?** It is the platform's only household-level "how much do I care" preference. It currently affects only recommendation (`recommendation-service.ts:122-127`). This investigation recommends **leaving it out of scope**: it modulates *caution* (NK2 P4), which has no sourced rule yet, and wiring it into attention would infer guidance the platform cannot source.
4. **Should `pantry` expiry become an attention signal?** Out of scope here; F8 records that no urgency signal exists. Flag as a genuine product gap, not an architecture gap.
5. **Where do the four labels surface to the user, if anywhere?** The Companion Card principle names no attention affordance. If levels become visible, that is a **presentation** change owned by the Card principle, requiring its own review — not part of this model.

---

## 10. WHAT THIS INVESTIGATION DID NOT DO

- Changed no code, schema, data, or runtime behaviour.
- Created no `shared/attention/` module. The TypeScript in §5.1 is a **proposal**, not an implementation.
- Did not add `critical` to any producer.
- Did not modify `filterMutedTypes`, `prioritiseAndGroup`, or `applySilenceRules`.
- Did not update the Source of Truth Register (Governance Rule 7 applies at implementation, not investigation).
- Did not verify F3 by mutating a live household's `mutedOpportunityTypes` — the finding is established by reading `framework.ts:226-233`, which contains no exemption branch.

---

## 11. SUMMARY

THA does not need an attention model. It has one: a three-value `priority`, declared three times, sorted three times, and persisted once as a non-owning snapshot. What it lacks is the **top level** — and the missing level is not a design choice but an unbuilt half of Rule T0, a trust rule the platform declared in `NK2:179` and implemented only as exclusion.

The recommendation is therefore narrow, and mostly deletion:

- **One vocabulary** in `shared/attention/`, replacing three unions and three rank maps (Principle 5; Rule 4).
- **One new value**, `critical`, closed by allowlist, meaning exactly what Rule T0 already means.
- **Three exemptions** attached to `critical` alone — from muting, from the delivery clamp, from the attention budget — because a harm signal the household can blind-mute is not a safety guarantee.
- **Two axes held apart** by type: attention orders what the evidence gate has already permitted, and neither may launder the other.
- **Three sort functions left exactly as they are**, because their independence is deliberate and correct.

The one thing to get right is R1. `critical` is valuable precisely and only in proportion to how rarely it is used.

---

*Investigation only. No implementation performed. Scope lock honoured.*
*Rollback: `rollback/before-attn1-attention-priority-model-20260709` → `f0ab371033fbf221830da0dabe348d60211cd47c`; this document only — `git checkout HEAD docs/investigations/intelligence/ATTN1_ATTENTION_PRIORITY_MODEL.md` (or delete the file to revert).*
