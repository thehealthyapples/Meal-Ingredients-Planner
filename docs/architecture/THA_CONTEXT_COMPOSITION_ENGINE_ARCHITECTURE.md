# THA Context Composition Engine Architecture

**Status:** GOVERNING ARCHITECTURE — Intelligence Governance (canonical). Established by workstream `INT17`, 2026-07-08.
**Classification:** Intelligence Governance — the single owner of every byte the language model reads as grounding.
**Governing documents:** `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2), `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3), `THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1), `PLATFORM_QUALITY_ARCHITECTURE.md`
**Implementation record:** `docs/implementation/INT17_CONTEXT_COMPOSITION_ENGINE.md` (design + first measurement), `docs/implementation/INT18_CONTEXT_COMPOSITION_ENGINE_IMPLEMENTATION.md` (promotion to canonical + independent re-verification), `docs/implementation/INT19_CONTEXT_COMPOSITION_ENGINE_BASELINE_AND_ROLLOUT.md` (n=3 baseline + capability audit), `docs/implementation/NCV1_NATIVE_CONTEXT_VIEW_ROLLOUT.md` (§2.1's rollout, executed for six capabilities; §6 observation of composition)
**Direct precedent:** `docs/implementation/BENCH4_FOOD_INTELLIGENCE_REACHABILITY.md` §5 (the defect), `docs/implementation/INT16_CONTEXT_COMPACTION_LAYER.md` (the superseded experiment — **CLOSED**, proof-of-concept succeeded), `docs/investigations/INTA1_INTELLIGENCE_PLATFORM_WIRING_AUDIT.md` §8.3 (the standing constraint)
**Rollback:** `int17-rollback-20260708`, `int18-rollback-20260708`, `rollback/before-ncv1-native-context-views-20260709`

---

## 0. MANDATE

**There is one Context Composition Engine. Every byte of grounding context the language model reads is composed by it, from Context Views, under one budget. No other component may serialise, truncate, order, or budget what the model sees.**

The Companion Platform's hard invariant (`THA_COMPANION_PLATFORM_ARCHITECTURE.md` §0) applies here without amendment, and is the reason this layer is safe to own so much:

> The Context Composition Engine may change **how much** of an already-true fact the model is shown, and in **what shape**. It may never change **what is true**, invent a fact, re-rank a capability's judgement, or hide an omission.

---

## 1. EXECUTIVE SUMMARY

Before INT17, "what does the model get to see?" was not a decision anyone made. It was the residue of three unrelated accidents in `conversation-gateway.ts`:

1. **A byte prefix.** `JSON.stringify(result).slice(0, 1800) + "… [truncated]"`, applied per capability. It cut mid-object, so the model received syntactically **invalid JSON** — on every one of the 57 over-budget sections in the 100-question benchmark corpus. On a priority-sorted payload it spent the entire allowance on the first group and silently deleted the rest: seven near-identical `planner-empty-day` rows consumed all 1,800 characters of `food-intelligence:report`, and **both** `shopping-restriction-conflict` and `pantry-item-unused-in-plan` — the evidence that actually answered the question — never reached the model at all (BENCH4 §5).
2. **No budget.** A four-capability turn paid `4 × 1,813` characters. Nothing anywhere knew the total, and nothing bounded it.
3. **No determinism.** Section order came from a `Map` populated inside `Promise.all`, i.e. capability *completion* order. The same question produced a different prompt on different runs.

Underneath all three sat the platform's largest single waste: **`profile:read` is injected into 90 of 100 prompts** — 85 of them as a surface `baseline` read the user never asked for — at 1,484 characters each. That is **50.4% of every CONTEXT DATA byte the platform emits**, and most of it is plumbing the model can never use (`emailVerified`, `subscriptionExpiresAt`, `lastLoginAt`, `soundEnabled`, `barcodeScannerEnabled`, `profilePhotoUrl`).

The Context Composition Engine replaces all of it with one seam, seven phases, and eight guarantees.

| | Before (legacy truncation) | After (Context Composition Engine) |
|---|---|---|
| Owner of the prompt's grounding | the gateway, incidentally | one engine, explicitly |
| Over-budget sections emitting **valid JSON** | **0 / 57** | **57 / 57** |
| Evidence groups reaching the model (`food-intelligence:report`) | **1 / 3** | **3 / 3** |
| Global token budget | none | configurable, enforced |
| Deterministic output | no (completion order) | yes (verified) |
| **Exact `prompt_tokens`, gpt-4o-mini, 69 LLM-reaching questions** | **130,714** | **105,138 (−19.6%)** |
| Questions costing more tokens | — | **0** |
| Fake / clipped entity ids emitted | 0 | **0** |
| Benchmark `entityRefs` (median of 3 runs) | 121 | **164** |

The superseded experiment, INT16, achieved (2) and (3) of the above for a **net cost of +1,854 prompt tokens** — its own document says so plainly. INT17 achieves them, adds intent relevance, cross-capability balance, duplicate removal, provenance preservation and a real budget, and **saves 25,576 prompt tokens** on the same corpus, with **no question costing more**.

---

## 2. THE TWO VIEWS OF A CAPABILITY

Every capability produces exactly one thing today: a **Full Result**. It is consumed by the UI, by reports, by `TurnResult`, by `opportunity-delivery`'s adapter, and — until INT17 — by the prompt, truncated.

This document names the second view, and makes it a first-class contract:

| View | Consumer | Owner | Shape |
|---|---|---|---|
| **Full Result** | UI, reports, `TurnResult`, downstream capabilities | the capability | whatever the capability's domain requires |
| **Context View** | the LLM, and **only** via the Context Composition Engine | the capability (target state); the engine's registry (today) | `ContextView` — pinned constraints, relevance-rankable scalars, grouped evidence with ids and provenance |

**The Full Result is never truncated, never reshaped, never mutated.** The engine reads it and derives a Context View. `outcome.result` continues to flow, byte-for-byte, everywhere it flowed before.

### 2.1 Where Context Views live, and why that is temporary

The governing target state is that **every capability exposes its own Context View alongside its Full Result**. That is a change to twenty-three capabilities and it changes capability ownership, which INT17's scope forbids.

So a Context View is *derived* from the Full Result, in `server/intelligence/context/context-view.ts`, by one of two paths:

1. a registered **`ContextViewSpec`** — declarative data, no logic — where the payload's shape is known and its redundancies and constraints can be named; or
2. a **generic derivation** over the payload's natural structure, otherwise.

Both produce the same `ContextView`. **The engine cannot tell them apart.** Migrating a capability to own its Context View is therefore a pure move — delete its spec, add a `contextView()` to the capability, change nothing in the engine. This is the seam that makes that migration a non-event, and it is the reason INT17 could give Food Intelligence a Context View without touching a line of Food Intelligence.

A `ContextViewSpec` is a *statement about redundancy and constraint in a known payload shape*. It is **not** a business rule: it cannot add a fact, reorder a capability's ranking, or change what any field means. Each spec is justified in-code against the module that owns the payload.

**A view registered in `CONTEXT_VIEW_SPECS` is a `native` Context View; one the engine derives structurally is `generic`.** Seven native views over six capabilities exist today — `profile:read` and `food-intelligence:report` (INT17), and `meals:read`, `meals:search`, `planner:read`, `shopping:read`, `household:read` (NCV1). Thirteen capabilities still ground turns through the generic derivation; four ground no user-plane LLM turn at all and are owed no view of either kind (INT19 §3.3).

A spec may say exactly three things and nothing else: which paths are **pinned** constraints; which field is a collection's **balance dimension** (`groupBy` — a kind, never a ranking); and which row fields the model may read (`keep`). `keep` bounds a collection's **rows**, not the payload's top-level scalars — it is an economy and review discipline, never a redaction layer, and the handler's own projection remains the boundary for anything that must not exist in the Full Result at all.

**The registry is the single canonical owner of every Context View.** No capability, handler, gateway or operator surface may define, override, or shadow one. It also answers the only question anyone may ask *about* a view — `hasNativeContextView(capabilityId, verb)` — so that no second list of native views can drift from it. That question is asked at the Observation Engine's capture point, never inside composition (§6).

---

## 3. THE SEVEN PHASES

```
   Full Results (read-only)              enrichment (COMP6)
   from intelligencePlatform.handle()    from knowledge-assembly
            │                                     │
            ▼                                     │
  ┌───────────────────┐                           │
  │ 1 DERIVE          │  Full Result → ContextView (spec or generic)
  │                   │  · never mutates · harvests provenance · keeps ids
  └─────────┬─────────┘
            ▼
  ┌───────────────────┐
  │ 2 RANK            │  routed capability > surface baseline; resolver
  │                   │  confidence; ties break on RESOLVER ORDER, never
  └─────────┬─────────┘  on a Map's insertion order  ← the determinism fix
            ▼
  ┌───────────────────┐
  │ 3 DE-DUPLICATE    │  same entity from an owner and its discovery
  │                   │  sibling → emitted once, `alsoIn` names the other
  └─────────┬─────────┘
            ▼
  ┌───────────────────┐
  │ 4 SELECT (core)   │  pinned constraints, then ONE item per group per
  │   THE GUARANTEE   │  capability. Bounded ONLY by the unchanged 1,800.
  └─────────┬─────────┘
            ▼
  ┌───────────────────┐
  │ 5 ALLOCATE + FILL │  budget − core = discretionary, shared out in
  │                   │  proportion to relevance. Rounds 1+ and scalars.
  └─────────┬─────────┘
            ▼
  ┌───────────────────┐
  │ 6 EMIT            │  structured JSON per section; `_context` declares
  │                   │  totals, omissions, shared fields; clipDeep bounds
  └─────────┬─────────┘  at 1,800, never clipping an id
            ▼
  ┌───────────────────┐
  │ 7 ENRICHMENT      │  budgeted, de-duplicated against emitted evidence,
  │                   │  under the label the WEAVE ENRICHMENTS rule binds
  └─────────┬─────────┘
            ▼
     CONTEXT DATA block  +  the format-note clauses this turn actually needs
```

---

## 4. THE EIGHT GUARANTEES

Each is a property of the emitted text, verified offline against the real 100-question corpus and asserted in `server/tests/test-intelligence-context-composition.ts` (99 assertions).

### 4.1 Relevance — evidence is selected against the user's intent

Deterministic and lexical. The engine reads three signals, **all of them already computed by an owner upstream**:

- which capability the Intent Resolver chose, and with what confidence;
- whether that capability was routed *from the utterance* or injected as a surface `baseline`;
- which of the utterance's content words appear in a field's name or value.

It does **not** know that "keto" is a diet, that "vitamin K" is a nutrient, or that an empty planner day is an opportunity. Every such judgement stays with the capability that owns it.

**The capability's own top item is always its group's representative.** Lexical relevance orders the *additional* examples; it never chooses the first one. This is not conservatism for its own sake — it is the only way the engine can honour its own contract when a surface-token match is simply wrong. Measured: *"Which meals are the least processed or most whole-food based?"* has no content token that is not a food word, and scoring by overlap promoted **"Whole Milk"** (matches *whole*) and **"Cow & Gate Baby Food"** (matches *food*) over the scratch-cooked porridge the question was actually about. Shown only ultra-processed products, the model cited nothing. Lexical relevance has no way to know that "whole-food based" is a concept rather than two words.

So the engine may **add** relevant evidence and **add** missing groups. **It may never show a worse first example than the byte prefix it replaced.**

An embedding model would be a second, non-deterministic, network-bound reasoning engine between the platform and the model. It is forbidden here (§7).

**A routed capability outranks every baseline read**, whatever the confidence. This single weight is what reclaims the 50.4%.

### 4.2 Balance — every contributing capability, and every group, gets a seat

Round 0 seats one item from every group of every capability before round 1 seats anyone's second. A payload whose every group is non-empty yields a prompt whose every group is non-empty. **A byte prefix of a priority-sorted array cannot have this property at any budget.**

### 4.3 De-duplication — three kinds, all provably lossless

| Kind | Rule | Provenance |
|---|---|---|
| **Within an item** | a string wholly contained in a longer string of the same item is dropped | a `source` label and an entity reference are **never** dropped |
| **Within a group** | a field identical across *every* item of the group is stated once in `_context.<collection>.shared` | hoisted only when it removes bytes; the group discriminator and the id always stay on the row |
| **Across capabilities** | same name + same namespace-stripped id → emitted once, `alsoIn` names the other capability | **only** between a capability and its own discovery sibling (§4.5) |

### 4.4 Entity preservation — ids are never clipped, dropped, or invented

A truncated id is a *plausible id for a different entity*. `clipDeep` refuses to touch `id`, `*Id`, and `slug`; the emptiness rule refuses to drop them; the hoisting rule refuses to lift them off a row.

`slug` is an entity reference and its earlier omission was a real defect: HARD RULE 5 permits the model to cite an entity only when it can see a real id, and **a food's canonical id is its slug**. Because a slug is usually a normalisation of `name`, the generic redundant-string rule would happily have deleted it as "already present in a longer string", silently removing the only thing that made the food citable.

Verified over the corpus: **0 of 636 emitted ids are fake.**

### 4.5 Provenance — relocated for economy, never discarded

`owningDomain`, `source`, `sources[]` and `evidence[].source` are harvested generically (by shape, not by capability) and always survive. Section-level provenance is stated once in `_context.sources`; group-constant provenance once in `_context.<collection>.shared`; everything else stays on the row.

This is why cross-capability merging is restricted to an owner and its own discovery sibling. Without that restriction, a name+id match could merge a **meal** called "Peas" with a **pantry item** called "Peas", and the surviving row's `alsoIn` would assert a provenance that is not true. **Merging is only safe where the two capabilities are, by construction, describing the same entity** — which is exactly the pairing `conversation-gateway.ts` already relies on when it prefers an owning capability over its `-discovery` sibling for `primaryOutcome`.

### 4.6 Budget — configurable, enforced, and never raised

Two ceilings, and they are not the same thing:

- **`CAPABILITY_CONTEXT_BUDGET_CHARS = 1,800`** — per section. Identical to the pre-INT16 `CAP_DATA_MAX_CHARS`, re-homed, unchanged. A caller cannot raise it; asking for 999,999 still yields ≤ 1,800.
- **`CONTEXT_TOKEN_BUDGET`** — the whole block, all sections. The pre-INT17 platform had no such number.

**When these conflict with the balance guarantee, the guarantee wins, and the engine says so.** A balance guarantee a budget can revoke is not a guarantee, and revoking it *is* the category-blindness the engine exists to remove. So the budget binds everything discretionary — rounds 1+, every scalar, enrichment — and `metrics.budgetExceeded` reports honestly when the guaranteed core alone outgrew it. The 1,800-char ceiling and `clipDeep` bound the core absolutely, so it cannot run away.

One exception, and it is deliberate: **a capability that produced grounding data reaches the model with at least one piece of evidence, even if that single item exceeds 1,800 characters.** `meals:read scope=detail` can carry one recipe whose instruction list alone is 5,000 characters. Refusing it would silently delete the capability from the turn. `clipDeep` bounds it instead — valid JSON, ids intact, the clip declared. **Bounding is honest; dropping is not.**

### 4.7 Determinism — no clock, no randomness, no unordered iteration

Same inputs → byte-identical output, always. Section order is the **resolver's** order. Every sort carries an explicit tiebreak chain down to the capability's own payload order.

This is not merely a testing convenience. The pre-INT17 prompt varied run-to-run for identical inputs, which means every downstream claim about prompt content — including INT16's — was measured against a moving target.

### 4.8 Honesty — nothing is silently absent

`_context` declares what the capability **found** — the true totals, the true per-group counts, how many groups were never seated — and which fields were outbid. It is bounded: it describes only the groups the model can actually see, because a metadata block that cost 1,400 characters to describe six items (the 40-category `nutrition-knowledge:read` payload) is not honesty, it is overhead.

**`_context` states what exists. It never states what this block withheld.** The distinction is the difference between a true statement and a false one, and it was learned the hard way. Emitting `{total: 591, shown: 4, omitted: {…587}}` alongside `meals:read` let the model subtract: asked *"What meals are missing from my plan?"* it answered **"587 meals are not included in your plan."** Neither `587` nor *"not in your plan"* came from any capability. Bookkeeping about the composition had become a fabricated fact about the user's planner — precisely the thing CPA1 §0 forbids, committed by the layer that exists to prevent it.

`found` and the per-group counts say everything the model legitimately needs: how many items exist, and of what kinds. **How many of them this block chose to print is the engine's business, not the model's** — and a number the model can do arithmetic with is a number it will do arithmetic with. The rows are examples; `found` is the truth; the format note says exactly that. Nothing is silently absent, because `found` and `groups` are the capability's *own* totals rather than this block's.

The honest reading of this episode: legacy truncation never produced that fabrication only because its **invalid JSON** happened to hide the numbers. Making the context well-formed made it legible, and legible metadata is metadata the model will reason over. Every honesty mechanism in a prompt is also an attack surface on the model's reasoning, and must be designed as one.

**Pinned constraints are emitted even when empty.** `"dietRestrictions": []` tells the model "none are recorded"; an absent key tells it nothing, and HARD RULE 3 then requires it to say it does not know. **Absence and emptiness are different facts, and only pinning can say so.** A dietary constraint that a token budget can outbid is a constraint the model cannot honour — and the benchmark's G2 gate exists for precisely that breach.

---

## 5. THE FORMAT NOTE — INT16's ONE HARD-WON LESSON, MADE STRUCTURAL

INT16 emitted one fixed 299-character note on every turn carrying a compacted section. It cost **66 tokens**, and the compaction it explained saved **~28** — a net increase of 1,854 prompt tokens across the corpus. The note was not optional decoration: without it the model reports *the number of items it can see* rather than the true `_context.total`, converting an honest compaction into a false claim. So INT16 simply paid.

The Context Composition Engine pays only for the clauses **this turn's context actually needs**:

| Clause | Emitted when |
|---|---|
| `"_context" describes this block, not the user's data. "found" is how many items the capability returned and the listed rows are EXAMPLES of them. Cite "found", never the number of rows you can see, and never say the user lacks something merely because it is not listed…` | a **collection** withheld items or groups |
| `"shared" holds fields common to every item of that group` | a group-constant was hoisted |
| `"alsoIn" names other capabilities that returned the same item` | a cross-capability merge occurred |

The first clause is long, and every word of the second half is load-bearing (§4.8). It costs ~2,300 tokens across the corpus and prevents a fabrication. That is a trade the engine takes without hesitation.

A turn that withheld nothing, hoisted nothing and merged nothing emits **no note at all**, and reads exactly the prompt it read before.

A withheld **field** buys no note. `"fields":{"omitted":31}` says exactly what it means, and there is no total for the model to mis-cite. Only a withheld **item** can make the model count rows and report a false total — which is the one thing the note exists to prevent. This single distinction takes the note from 90 turns to 56, and from 4,910 tokens to 3,109.

The note deliberately does **not** contain the literal string `CONTEXT DATA:` — that is the prompt's own section header, and a second occurrence breaks anything that slices on it.

---

## 6. RELATIONSHIP WITH THE REST OF THE PLATFORM

**With the Intelligence Platform (TIP1/TIP2).** The engine holds no reference to the Capability Registry, performs no I/O, and invokes nothing. It receives Full Results that `intelligencePlatform.handle()` has already produced under a permission check and a confirmation gate, and it returns a string. It cannot reach data the caller's role did not already permit, because it never reaches for data at all.

**With the Companion Platform (CPA1).** The engine sits in the same architectural position as `nutrition-enrichment.ts` and `household-nutrition-enrichment.ts` — composed at the gateway, deliberately, rather than inside an owning handler. It is a *presentation-of-context* layer, and CPA1 §0's invariant is its invariant. The Behaviour Engine changes **how** something is said; the Context Composition Engine changes **how much of an already-true fact** the model may see when saying it. Neither changes what is true.

**With the grounding boundary (INTA1 §8.3).** Enrichment content crosses the grounding boundary — it is handed to the model as CONTEXT DATA, i.e. as ground truth. That was true before INT17 and remains true. The engine now *budgets* and *de-duplicates* enrichment against the evidence already emitted, and preserves the `### Related Context (enrichment)` label the prompt's WEAVE ENRICHMENTS rule binds to. Enrichment is **not** a Context View — it is supplementary knowledge with no owning capability — and this is named here so a future reader does not mistake it for one.

**With the Observation Engine (OBS1/OBS2).** One-way, and it must stay that way. The engine records nothing — it is a pure module, and the Observation Engine's §4 rule 4 forbids I/O in pure modules — so the Conversation Gateway records the `context-composition` observation around it, carrying the engine's own metrics verbatim. NCV1 adds one fact to that row: which of the turn's Context Views were **native** and which **generic**.

That fact is resolved at the **capture point**, by asking the registry (`hasNativeContextView`). It is never resolved inside `composeContext`, and the engine never branches on it. §2.1's indistinguishability is a property of *composition*, not of *telemetry*: an operator must be able to see how far the rollout has reached, while the engine remains unable to behave differently for a migrated capability. Preserving that separation is what keeps the eventual move to capability-owned `contextView()` a pure move.

Telemetry is also never retroactive. A `context-composition` row written before NCV1 carries no classification, and every operator surface reports its views as **not recorded** — never as generic. Asking today's registry what a composition three weeks ago did would answer a question about the present and label it the past; the rollout the field exists to measure is precisely what changed in between.

**With Platform Quality.** No new data path, therefore nothing new to secure. Trust is strengthened, not merely preserved: valid JSON where there was invalid JSON, declared totals where there were silent omissions, and no id the payload did not contain. Performance: composition costs **5.0 ms per turn** (mean, real corpus; worst turn 28 ms) against a ~1,300 ms mean turn latency — 0.4%.

---

## 7. NON-NEGOTIABLES

Hard stops, in the same spirit as `ENGINEERING_WORKFLOW.md` STEP 7 and CPA1 §12.

- **Any component other than the Context Composition Engine that serialises, truncates, orders, or budgets what the LLM reads as grounding — stop.** That is a second owner of the prompt, and the three accidents in §1 are what a second owner looks like after a year.
- **Any second Context Composition Engine, anywhere in the codebase, rather than the one extended in place — stop.** There is exactly one. A "variant" is a duplication.
- **Any raising of `CAPABILITY_CONTEXT_BUDGET_CHARS` presented as a fix — stop.** Reduction must come from shape, relevance and de-duplication. A bigger allowance spent on the same priority-sorted prefix buys nothing and costs every prompt.
- **Any relevance mechanism that is non-deterministic, network-bound, or semantic (an embedding, a model call, a learned ranker) — stop.** Relevance here is a budget-allocation rule, not an answer. Its failure mode must be "a less useful field won a few tokens", never "a different fact reached the model on a different run".
- **Any `ContextViewSpec` that encodes a business rule** — that adds a fact, re-ranks a capability's output, or changes what a field means — **stop.** A spec may only state what is constant, what is redundant, and what is a constraint.
- **Any `groupBy` naming a ranking rather than a kind — stop.** `priority`, `status`, `confidence`, `score`: grouping by a ranking reproduces the priority-prefix bias this engine exists to remove. And **any `groupBy` over a nullable field — stop**: null rows land in a group the engine labels `all`, and a group named "all" is a lie the model will read.
- **Any `groupBy` whose cardinality approaches its collection's row count — stop.** A balance dimension must name a **kind that several rows share**. A field with one row per value is an identifier, and declaring it degenerates both mechanisms that rest on it: `_context.<collection>.groups` becomes a map with one entry per row — stating nothing the rows do not, while inviting the model to read the `1` as a count of something else — and the balance guarantee becomes "print every row", which is what a budget exists to prevent. NCV1 declared `groupBy: "dayOfWeek"` on `planner:read`, measured it, and reverted it: `_context.days.groups` became `{"0":1,…,"6":1}`, and PL-023 scored 74.3 in 3 of 3 runs against 81.8 in 6 of 6 runs without it. The generic detector's `MAX_GROUP_CARDINALITY` guards the far end of this (a `slug` with 611 values); nothing guards the near end, so a **declared** `groupBy` must be checked by hand. Note this is *not* §8 item 7: the same measurement showed every capability kept its guaranteed core, because round 0 is guaranteed per capability. The cost was a degenerate `_context` and discretionary budget, not displaced evidence.
- **Any `keep` list presented as a security boundary — stop.** It bounds a collection's rows and nothing else; a new top-level scalar still competes for budget. What must never reach the model must never reach the Full Result.
- **Any second list of native Context Views, anywhere — stop.** `CONTEXT_VIEW_SPECS` is the single owner and `hasNativeContextView` is the single question. A capability that both registers a spec and exposes its own `contextView()` has two owners of one view.
- **Any code path inside the engine that branches on whether a view is native — stop.** The engine may not distinguish a declared view from a derived one (§2.1). Telemetry may; composition may not.
- **Any change that lets an entity id be clipped, dropped, or synthesised — stop.** A truncated id is a plausible id for a different entity, and the model is instructed to cite it.
- **Any omission the model is not told about — stop.** `_context` is not optional, and neither is the clause of the format note that explains it.
- **Any `_context` field that lets the model compute a fact no capability produced — stop.** `_context` states what exists (`found`, `groups`). It must never publish how many rows this block printed or what it withheld: the model subtracts (§4.8).
- **Any relevance rule that can displace a capability's own top item from its group's representative slot — stop.** The engine may add evidence; it may never make the first example worse than the byte prefix it replaced (§4.1).
- **Any pinned constraint that a budget can outbid — stop.** Dietary restrictions are safety-critical (HARD RULE 2, benchmark gate G2), and empty is not absent.

---

## 8. OPEN ITEMS DEFERRED TO IMPLEMENTATION

This document is architecture. Named so none is lost; none is authorised here.

1. **Migrate capabilities to own their Context View** (§2.1). *Partially addressed by NCV1 (2026-07-09), which is the first half of this item, not the whole of it.* NCV1 registered native views for the six highest-value capabilities — `meals`, `planner`, `shopping`, `household`, and the two INT17 already held — leaving **thirteen** on the generic derivation. But it registered them **in the engine's registry**, which is where INT17 put the first two: the target state named here is that the *capability* exposes `contextView()` beside its Full Result, and no capability does yet. NCV1 moved ownership of the *declaration* from nobody to the registry; it did not move it to the capability. The seam is unchanged and the engine remains indifferent, so that second move stays the pure move §2.1 promises. Each is a capability-owned workstream.
2. **`CHARS_PER_TOKEN = 3.5` is an estimator, not a tokenizer.** Measured against the emitted context block on the real corpus it runs **3.578** chars/token — the constant is ~5% conservative on average, but **6 of 30** measured blocks were denser than 3.5 (worst: 3.364), so the token budget can overrun by up to ~4% on a dense block. A real tokenizer would remove the approximation at the cost of a dependency and per-turn CPU. Bounded, reported, not fixed.
3. **`analyser:read` groups into 15 groups; `MAX_GROUPS_SHOWN` seats 8.** The remaining 7 are declared by count. Raising the cap for that capability, or registering a projection for it, would recover its ids at some token cost.
4. **Enrichment is still free text** (`• title: body`), not a Context View. Structuring it would change the label the WEAVE ENRICHMENTS prompt rule binds to, and was deliberately left alone. It is budgeted and de-duplicated, but not structured.
5. **Cross-capability merging is restricted to owner/discovery pairs** by a stem rule (`meals` ↔ `meal-discovery`, `nutrition-knowledge` ↔ `nutrition-discovery`). If the registry ever adds a pair the stem rule cannot see, merging silently stops for it — safely (it emits twice), but silently.
6. **The judge tier remains hardcoded off** (`judge.ts`), so 68 of 100 benchmark weight points are deterministic proxies (INTA1 §6.4). Every answer-quality number about this engine is therefore a **lower bound**, exactly as it was for BENCH3, BENCH4 and INT16.
7. **The guaranteed core is spent per group, so a capability with many groups can crowd out a capability with few.** *Half-closed by NCV1; the half that remains is the one this item names.* Measured on CB-022 ("Which meals need better ingredient or nutrition data?"): `nutrition-knowledge:read scope=foods` — the entire 611-food registry, 40 groups — seats eight core items, leaving `meals` two, and the two meals that answer the question (`tuna spaghetti` and `Beef Concarne`, both `ingredientCount: 0`) are not among them.

   NCV1 addressed the *victim*, not the *cause*. `meals`' generic balance dimension was `kind` (`meal` / `drink`), so two core seats were all it could ever have; its native view groups by `mealSourceType`, which makes `tuna spaghetti` the `ready_meal` group's own representative and seats it in the guaranteed core even under the crowding. That is a real fix for a real question, and it is not a fix for this item: **`nutrition-knowledge:read scope=foods` still spends eight core seats on reference data.** The engine cannot know that a registry dump is reference rather than evidence. The fix remains a `ContextViewSpec` for it (or a resolver that does not route it here), not a change to the balance rule. It is `INT19` §4 Priority 1, still open, and NCV1's scope excluded it. See `INT17` §7.
8. **`CONTEXT_TOKEN_BUDGET = 600` binds almost nothing except enrichment, and starves it.** 600 tokens ≈ 2,100 chars is *smaller than two per-capability ceilings* (2 × 1,800), so on any turn with two substantial sections the guaranteed core alone exhausts it. Measured over the 100-question corpus (INT18 §6): the core exceeds the global budget on **47 of 88** data-bearing turns — reported honestly by `metrics.budgetExceeded`, exactly as §4.6 requires, but it means the only discretionary content the budget can actually bind is **enrichment**, which is spent last. Consequence: enrichment reaches the model on **20 of 56** turns that carried it under legacy truncation (**85 → 35 bullets**), and on the 36 turns where it disappears the capability evidence already occupies a median 2,032 of the 2,100 chars. This is *permitted* by §4.6 (the balance guarantee outranks the budget; the budget binds everything discretionary) and it costs no benchmark score, but it means the prompt's **WEAVE ENRICHMENTS** rule has nothing to weave on roughly two-thirds of the turns that previously carried enrichment. Raising the budget is **not** authorised here (§7 forbids treating a bigger allowance as a fix): the honest options are to give enrichment a reserved floor, to make it a Context View so it can be ranked rather than truncated by arrival order, or to accept the trade explicitly. **Accept-and-declare is the current state.**

---

*Required reading before changing anything that reaches the LLM prompt, adding a `ContextViewSpec`, or introducing any new grounding surface in THA.*
*Design record: `docs/implementation/INT17_CONTEXT_COMPOSITION_ENGINE.md`.*
*Promotion + independent verification record: `docs/implementation/INT18_CONTEXT_COMPOSITION_ENGINE_IMPLEMENTATION.md`.*
*Superseded experiment (CLOSED): `docs/implementation/INT16_CONTEXT_COMPACTION_LAYER.md`.*
*Rollback: `int17-rollback-20260708` (INT17 engine), `int18-rollback-20260708` (INT18 promotion).*
