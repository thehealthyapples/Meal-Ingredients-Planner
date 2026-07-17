# FI18 — Household Food Intelligence Experiences — Investigation

**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Investigation only. No code, schema, route, or capability change.
**Risk:** 🟢 GREEN (read-only investigation; authors this document only)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/FI18-household-food-intelligence-experiences-20260717` → `a9116faa53065f863fc23de81384873d698a878f` |
| Working tree | **Intentionally dirty — not this session's work.** Uncommitted files from sibling sessions (`NORTH3`, `NORTH4`, `CONV1 P10`) were present at session start and were not touched. **The tag protects committed state only; it does not cover them.** |
| This session's writes | This document; `.engineering/session/runs/FI18_Household_Food_Intelligence_Experiences.md`; one row in `.engineering/session/CURRENT.md` |
| Product source modified | **None.** `git status`'s modified-list is identical to session start. |

> **Filing deviation, declared.** The mission specified `docs/investigations/FI18_….md`. `REPOSITORY_CONVENTIONS.md` § 4 forbids any report at a tree root — *"the only file permitted at either root is that tree's index `README.md`"* — and `repo-structure-verify.sh` enforces it. Filed under the `intelligence` workstream, which satisfies "store the report under `docs/investigations/`" and complies with the governing convention. Following the mission literally would have failed a gate.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (FI1 — the domain's law: Rules FI1, T0–T2, G1, E1–E2, GO1–GO2, LT1–LT3, the four planes, the composition law)
- [x] `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (INT20 — the owner of *what THA proactively notices*)
- [x] `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1 — operator telemetry; **not** a user-facing surface)
- [x] `THA_DECISION_ENGINE_ARCHITECTURE.md` (DEC1 — the enrolment door, § 7; the budget doctrine, § 6)
- [x] `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`, `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`
- [x] `ENGINEERING_WORKFLOW.md`, `REPOSITORY_CONVENTIONS.md` § 4
- [x] Code, as the ground truth where documents and code disagreed (they do, repeatedly — Finding 3)

---

## QUESTION

**How should THA's existing Food Intelligence be surfaced across Dashboard, Planner, Pantry, Cookbook, Shopping, the Food page, the Companion, and micro-learning — using only the existing architecture, creating no new ownership and no schema change?**

---

## METHOD

The governing documents were read first, then **every claim was checked against code**, because the mission's premise ("existing Food Intelligence") is precisely the thing the documents turn out to be wrong about. Specifically: the capability registry and its activation block were enumerated; `OPPORTUNITY_SOURCES` was read directly; every `<AmbientIntelligence>` mount was grepped; the notice chain was executed (`npx tsx server/tests/test-hhp2-…`); import graphs were traced for the modules the records claim are live. Counts come from the seed modules themselves, not from prose about them.

---

## FINDINGS

### Finding 1 — The mission's first word names the wrong engine, and it is a hard stop

**"Dashboard observations" cannot be built on the Observation Engine.**

THA has two engines whose names collide by history (`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`, naming history):

- **Observation Engine** = *operator-facing telemetry* about platform execution. Its § 2.3 forbids business facts outright: *"The household's planner, pantry, trends, and streaks are the producing capabilities' and the Notice Engine's concern."* Its § 7 hard stop: *"Any behaviour that reads an observation — routing, permissions, confirmation tiers, phrasing, **notices**, learning — stop."* And § 5.2: *"no observation is surfaced to a user."*
- **Notice Engine** = *user-facing facts about the household's own data*: **"here is something true about your own data that you did not ask about."**

Every one of the mission's eight deliverables is a **Notice**, not an Observation. This is not pedantry — building "Dashboard observations" on the Observation Engine violates a hard stop in the first line of the mission. **Throughout this report, the word is Notice.**

### Finding 2 — 🔴 THE HEADLINE: THA's entire ambient intelligence is three facts from one producer, and two of them are absences

`OPPORTUNITY_SOURCES` — DEC1 § 7's "one enrolment door", the only way a fact becomes something THA proactively notices — contains **exactly one producer** (`framework.ts:285-287`):

```ts
const OPPORTUNITY_SOURCES: Readonly<Record<string, OpportunitySource>> = {
  "food-intelligence": { verb: "report", adapt: adaptFoodIntelligence },
};
```

That producer emits **three** opportunity types (`opportunity-engine.ts:109-111`):

| Type | Priority | What it says | Is it about food? |
|---|---|---|---|
| `planner-empty-day` | high/medium | "You have an empty day" | ✗ an **absence** |
| `pantry-item-unused-in-plan` | low | "You own this and haven't planned it" | ✗ an **absence** |
| `shopping-restriction-conflict` | **critical** (sole member of the closed allowlist) | "This product conflicts with a named member's stored restriction" | ✓ |

Two consequences, both load-bearing for this mission:

1. **Food Intelligence *is* THA's ambient layer.** It is not one contributor among many — it is the only registered producer. The mission's subject is therefore not a feature of THA's proactive intelligence; it is the whole of it.
2. **Of everything THA knows about food, what it proactively says is: you have a gap, you have an unused item, and (once) this is unsafe.** Two of three are *"you haven't done something."* THA currently notices **absences**, not food.

### Finding 3 — The knowledge is deep; the reasoning is built; almost none of it is connected

This is the finding that reframes the mission. **The problem is not surfacing. It is that what exists is not wired.**

**What THA knows (Plane 1 — measured from the seed modules):**

| Store | Count |
|---|---|
| Foods (`FOOD_SEED`) | **610** (264 editorial + 346 graduated) |
| Canonical food identities | 381 |
| Nutrients · Health benefits | 35 · 15 |
| Graduated food→nutrient / food→benefit links | **1,035 / 667** |
| Diversity groups · Preparations | 173 · 43 |

**What THA can reason (the engines that exist):**

| Engine | Status | Reached by |
|---|---|---|
| **FI4 Opportunity Engine** | 🟢 **LIVE** | `food-intelligence:report` → OD1 → `/api/intelligence/food-opportunities` → `AmbientIntelligence` |
| **FI3 Recommender** (`engine.ts` — JOIN + RANK + EXPLAIN, the Domain Intelligence layer itself) | 🔴 **UNREACHABLE** | `recommend`/`explain` have **no HTTP route and no resolver matcher** |
| **COMP1 Comparison Engine** (712 lines, cited, honest-gapped) | 🟠 Conversation-only | No route, **no UI anywhere** |
| **HNP1 Household Nutrition assembler** | 🔴 **DEAD** | Only from a binding that is never registered (Finding 4) |
| **PANTRY1 pantry-intelligence-assembler** | 🔴 **DEAD** | **Zero non-test importers** |
| **UPF/Apple-rating service** | 🟠 Route-only | `/api/scan` only — *not* through the platform, so the Companion cannot answer a UPF question |

The codebase says this about itself more plainly than any audit could, at `pattern-intent-resolver.ts:1231-1236`:

> *"NO user utterance could reach it: the resolver emitted the capability zero times, and no HTTP route invokes it… the 'shipped, tested reasoning engine that no user utterance can reach'."*

**The governing architecture is materially stale about all of this.** `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` § 13 (a **mandatory Bootstrap document**) states *"No Food Intelligence Engine … exists yet"* and *"0% Domain Intelligence layer build-out"*, with the engine scheduled for **Phase 1, 2027 H1**. The engine has existed since FI3; `engine.ts:9-12` names that very document as its governing architecture. This is the `DOC-4`/`KC14` failure the README itself records twice — *a stale claim sitting in the mandatory Bootstrap* — and it is the reason this investigation measured rather than read.

### Finding 4 — 🔴 An entire workstream is recorded "Complete" and is wired to nothing

`HHP2 — Household Health Opportunity Platform` (`docs/implementation/intelligence/HHP2_…md`) declares **"Status: Complete"** (2026-07-12) and names DEC1 § 7 as *"the door this workstream walks through"*. It did not walk through it.

| Claim | Reality |
|---|---|
| `household-health` enrolled in `OPPORTUNITY_SOURCES` | **Absent.** The map holds one entry; `household-health` appears **zero** times in `framework.ts` |
| The capability is registered | **It is not in `SEED_CAPABILITIES_BASE` at all.** `bindHandler` would throw *"unknown capability"* (`capability-registry.ts:849`) |
| The binding is activated | `bindHouseholdHealthCapability` (`bindings/household-health.ts:55`) is **never called** — absent from the activation block (`intelligence-platform.ts:281-302`) |
| Its tests prove it | The test **source-scans** for `"household-health": { verb: "report"` — text that is not in the file — and asserts `adaptFoodIntelligence` is retired (it is at `framework.ts:286`). It calls the handler **directly**, bypassing the registry, which is why the dead path went unnoticed. **It is not in `npm test` and never runs.** It also crashes on import (Finding 5) |

**The compounding harm:** `HouseholdNutritionPanel.tsx:71-73` asserts *"The producer path … is untouched and still receives every opportunity HNP1 composes."* **That claim is false**, and `HHP3` removed `opportunities` from the wire on the strength of it. A live path was deleted in favour of a path that was never connected. The panel itself has **zero importers**.

This is precisely the failure `PX1`/UIA § 17 built the Adoption Register to end — *"authoring a foundation and adopting it 'later'"*, `PageHeader.tsx` with zero importers sitting live-looking in the tree. **It has recurred on the server, where no adoption register exists.**

### Finding 5 — 🔴 The notice convergence is half-landed and cannot even load

`server/intelligence/conversation/notice-gateway.ts` imports three functions from `notice-engine.ts` that **it does not export**: `noticeCelebration`, `noticeFoodDiscovery`, `noticeHouseholdInsight`. Executing it throws:

```
SyntaxError: The requested module './notice-engine.js' does not provide an export named 'noticeCelebration'
```

- **No runtime module imports it.** Only tests, plus the publication register (as *text*).
- **Its tests are not in `npm test`** (`notice-convergence`, `hhp2`, `hhp3` → zero matches in `package.json`).
- Those three missing producers are exactly `celebration` / `householdInsight` / `foodDiscovery` — i.e. **NTC-P2, the convergence of the ungoverned `/api/home/intelligence` channel, was started and abandoned mid-flight.**

And `server/verification/publication-register.ts:993` names `notice-gateway.ts` a **canonical owner**, verifying it at `:1018` by **text grep** (`ctx.sources.get(...)`). **The gate greps a module that cannot load** — the identical class of defect CONV1 P10 found in the schema gate ("the gate is a text grep"). A green check over a `SyntaxError`.

### Finding 6 — Three ungoverned notice channels are live, and Planner runs two engines side by side

The Notice Engine § 7.2 names these as convergence debt (NTC-P2, **not started**). They are still live:

- `GET /api/home/intelligence` (`routes.ts:11537`) → assembles `{celebration, seasonalHighlight, opportunity, householdInsight}` straight from `shared/discovery`/`stories`/`seasonal`
- `GET /api/planner/weeks/:weekId/intelligence` (`routes.ts:11630`)
- The WX7 pantry-opportunities block in `routes.ts`

None passes OD1's muting/de-dupe/lifecycle or the Silence Rules. **Planner therefore renders two ambient channels beside each other** — `<AmbientIntelligence>` (governed) and `PlannerIntelligenceStrip` (ungoverned, reading the bypass). Per § 9, a second ambient channel is *"a second Notice Engine wearing different clothes."*

### Finding 7 — Home is the only major room with no ambient surface, and it already fetches the data

`<AmbientIntelligence>` — *"The ONE ambient surface… Every page that has intelligence to show mounts this and nothing else"* — is mounted on **Planner, Pantry, Shopping workspace, Dashboard**. It is **not** mounted on **Home**.

Yet `home-experience-page.tsx:337` already calls `useFoodOpportunities(...)`, and uses the result at `:481` **only** to feed `criticals` into the door resolver. **Home fetches every opportunity and renders none of them.**

Note also: `/dashboard` (`App.tsx:372`) is a still-live legacy duplicate of `/home`, and is *richer* in intelligence than the canonical arrival room the NORTH1–4 sessions rebuilt. The mission says "Dashboard"; **the room is Home.**

### Finding 8 — The evidence context covers 10 foods out of 610, and Rule E1 makes that the ceiling

`engine.ts:217` reads `NUTRITION_CONTEXT[food.slug] ?? []`. `shared/canonical/nutrition-context.ts` holds **exactly ten** foods:

> tomato · spinach · mushroom · chickpeas · lentils · flaxseed · chia-seeds · walnuts · extra-virgin-olive-oil · avocado

**600 of 610 foods resolve to an empty evidence context.** Under **Rule E1 — "No citation, no card"** and the § 4.5 composition law, a food with no citable chain *cannot render a card at all*. This is the true ceiling on Food-page intelligence and on micro-learning — and it is a **knowledge** ceiling, not a UI one. No surface work raises it.

### Finding 9 — The attention budget is 2, and it is fixed on purpose

`MAX_NOTICES_PER_MOMENT = 2` (DEC1 § 6's budget doctrine). The Notice Engine § 6 forecloses the obvious move: *"Raising the cap is the Notice Engine's equivalent of raising `CAPABILITY_CONTEXT_BUDGET_CHARS` — the move INT17 § 7 forbids as a fix… improvement must come from better producers and better relevance upstream, not a louder channel."* § 9: **"Improve the producers, not the volume."**

**So a request to "surface Food Intelligence on eight surfaces" cannot be answered by adding eight surfaces.** Eight surfaces over three facts is the same three facts, eight times, against a budget of two.

---

## THE DESIGN: TWO DOORS, BOTH ALREADY OPEN

Everything below goes through exactly two existing seams. Neither creates ownership; neither touches schema. **Anything that does not go through them is a second Notice Engine (§ 9 stop).**

| | Door | Owner | What it costs |
|---|---|---|---|
| **Server — how a fact becomes noticeable** | `OPPORTUNITY_SOURCES` enrolment (DEC1 § 7) | Decision Engine | One entry: capability id, verb, `adapt()`. Inherits eligibility, muting, lifecycle suppression, learning re-weight, rank, budget, surface routing, the sealed decision — **"with zero new suppress/rank/budget code"** |
| **Client — how a noticed fact is shown** | `<AmbientIntelligence>` | The one ambient surface | A mount. Collapsed by default, re-ranks nothing, critical auto-opens, renders nothing on honest absence |

The load-bearing consequence, stated once: **the surfaces are not the bottleneck; the producers are.** Seven of the eight deliverables below are therefore *connection* work, not design work.

---

## THE EIGHT SURFACES

### 1. Dashboard → **Home** notices

**Correction applied:** these are **Notices** (Finding 1); the room is **Home**, not the legacy `/dashboard` (Finding 7).

**Design:** mount `<AmbientIntelligence surfaceKey="home" />` on `home-experience-page.tsx`. Nothing else. It shares the one canonical query key, so TanStack **dedupes against the fetch Home already makes** (`:337`) — no new request, no new endpoint, no new ownership.

**Why it is lawful and calm:** the component is collapsed-by-default (*calm before capability*); it renders **nothing** when there is nothing validated to say — which matters here more than anywhere, because CONV1 P8 measured **192 of 195 households unanchored forever**, so *the quiet day is the default day*. A `critical` (the restriction conflict) auto-opens, which is the one thing a household must not have to click to discover.

**Do not:** build a Home-specific insight panel. `HomeIntelligenceCompanion` already reads the ungoverned `/api/home/intelligence` (Finding 6) — that is the bypass to converge, not the pattern to copy.

### 2. Planner intelligence

**Already the richest surface — and the one running two engines at once** (Finding 6).

**Design:** **add nothing.** Planner's need is **convergence (NTC-P2)**, not addition: re-point `PlannerIntelligenceStrip` at the canonical pipeline so the week's celebration/insight/seasonal facts arrive as notices through OD1 + the Silence Rules. § 8 permits the UI contract to stay: *"Existing UI contracts may keep their response shapes as thin projections; what converges is the source and governance, not the pixels."*

**Prerequisite:** Finding 5 must be fixed first — `notice-gateway.ts` is the half-built vehicle for exactly this, and it does not load.

### 3. Pantry discoveries

**Design:** the ambient mount and FI4's `pantry-item-unused-in-plan` already work. The genuine gap is that **PANTRY1's `pantry-intelligence-assembler.ts` — season, familiarity, LEARN1 understanding, restriction conflicts, cookbook usage — is fully built with zero importers** (Finding 3).

Enrol it through the one door: expose it via its capability's `report` verb, add one `OPPORTUNITY_SOURCES` entry with an evidence-cited, attention-assigned `adapt()`. It becomes noticeable everywhere at once, with no new suppress/rank/budget code. **This is NTC-P3's "second real producer", and the code is already written.**

### 4. Cookbook enrichment

**The honest answer: mounting an ambient surface on Cookbook today would render an empty room.** None of FI4's three types says anything about a cookbook. A surface without a producer is not intelligence; it is a placeholder — which Silence Rule 5 forbids (*"never pads, never invents"*).

**Design:** the reachable win is **COMP1** (712 lines, cited, honest-gapped, **no UI anywhere**) — "which of these two is the better choice for us?" is the Cookbook's natural question, and the engine that answers it already exists and is fully built. It renders through the existing **Companion Card** framework (`companion-card.ts`, explicitly built domain-agnostic for reuse). Cookbook needs a **producer**, and a producer is its own gated EWO through the § 7 door.

### 5. Shopping guidance

**Design:** two connection wins, no new ownership.

1. The workspace (`/shopping-workspace`, the live route) has ambient intelligence but **lost the per-item `ShoppingIntelligencePanel`** that the legacy `/basket` page still mounts (`shopping-list-page.tsx:895`). Mount the existing component.
2. `shopping-restriction-conflict` — THA's only `critical` — already flows. It is the single most valuable thing THA notices, and it is correct today. **Do not touch it.**

### 6. Food page intelligence

`/foods/:slug` is already the fullest per-entity surface in THA and has an honest empty state (*"We don't know this food yet"*). **It is not the problem.**

**The problem is Finding 8: 600 of 610 foods have no citable evidence context, so Rule E1 forecloses the card.** The Food page is a correct window onto a knowledge gap. **Extending `NUTRITION_CONTEXT` is a Plane 1 editorial act** — human review, `SourceRef` + `lastReviewed`, the KMS graduation gate (§ 4.1). It is the highest-value Food Intelligence work in this report **and it is not engineering.**

**Adjacent gap:** `/analyser` shows a score with no story, because `analyser`'s `analyse`/`explain`/`report` are **advertised but not executable** (`bindings/analyser.ts:35` = `["read"]`). The UPF engine exists but never reaches the platform — so the Companion cannot answer a UPF question about a product the household just scanned.

### 7. Companion conversations

**Design:** two connection wins.

1. **Deixis.** Only **three** of ~10 surfaces publish context (`meal-detail`, `food-detail`, `planner`). Pantry, Shopping, Cookbook, Diary and Home publish nothing, so *"is this any good?"* on the Pantry page reaches a Companion that cannot see what "this" is. `usePublishCompanionContext` already exists; the change is per-page adoption, no ownership.
2. **Reach the engines that exist.** `food-intelligence:recommend`/`:explain` are unreachable by any utterance (Finding 3) — the Domain Intelligence layer is mute. Giving the resolver a matcher is *the* unlock, and it creates nothing new.

**Boundaries (binding):** the Companion **discovers and refers**; canonical pages own presentation (Discovery & Presentation Principle). Output is **Summary → Companion Cards → Next Steps**, no domain-specific layout. **Rule LT3 — the brain stays deterministic**: the model phrases; it never selects. **Rule T1 — food, not bodies.**

### 8. Micro-learning opportunities

**The hard boundary first: micro-learning must never become a tip of the day.** Silence Rule 5 names it explicitly — *"The engine never pads, never invents a 'tip of the day'"* — and Rule E1 forbids an uncited card. A "did you know?" with no citation chain and no household relevance is exactly the padding the Silence Rules exist to refuse.

**Design:** micro-learning is not a new channel. It is the **`explanation` and `evidence` already attached to every opportunity**, rendered where the household already is. THA's teaching moment is *"this is why you're seeing this"*, not *"here is a fact about kale."* Two existing mechanisms carry it:

- **`opportunity-delivery:explain`** (NTC-P6, built) — Full Result with **`evidence` PINNED**, so *"the model can never be handed a recommendation stripped of its justification and left to invent one."*
- **`household-learning`** — the eighth notice category, **confirmed-only**, priority always `low`, EL1's `rationale` crossing the voice seam **verbatim**, because *"a paraphrase is where 'you tend to skip fish on weeknights' quietly becomes 'you don't like fish'."*

The distinction to hold: **a notice is what we noticed; learning is what repeated and was confirmed.** A single notice never becomes a preference.

---

## PRIORITIES

### P0 — Defects. Not features, and they block the rest

| # | Finding | Why first |
|---|---|---|
| **P0.1** | `notice-gateway.ts` cannot load (F5) | It is the vehicle for NTC-P2. Nothing on Home or Planner converges until it imports. |
| **P0.2** | HHP2 "Complete" and wired to nothing; HHP3 deleted a live path for a dead one (F4) | A false claim in a completion record is worse than a gap — it stops anyone looking. |
| **P0.3** | `hhp2`/`hhp3`/`notice-convergence` are not in `npm test` (F4, F5) | The gate that would have caught P0.1/P0.2 exists and never runs. **Wiring them is minutes.** |
| **P0.4** | The publication register greps a module that cannot load (F5) | A green check over a `SyntaxError`. |
| **P0.5** | FI Platform Architecture § 13 is materially false (F3) | It is **mandatory Bootstrap reading**. Every future workstream starts from it. |

### Quick wins — genuinely small, immediately felt

| # | Change | Cost | Value |
|---|---|---|---|
| **QW1** | **Mount `<AmbientIntelligence>` on Home** (F7) | One mount. Data already fetched; query key dedupes | **Highest.** THA's arrival room gains its ambient layer. Existing component, existing hook, existing governance |
| **QW2** | Mount the existing `ShoppingIntelligencePanel` on the shopping **workspace** (§ 5) | One mount | Restores per-item intelligence lost in the legacy→workspace move |
| **QW3** | `usePublishCompanionContext` on Pantry, Shopping, Cookbook, Diary, Home (§ 7) | One hook call per page | The Companion stops being blind on 5 of ~10 rooms |
| **QW4** | Give the resolver a matcher for `food-intelligence:recommend`/`explain` (§ 7) | Resolver only | Un-mutes the Domain Intelligence layer — *the* shipped engine no utterance can reach |

### Highest value — in honest order

1. **Extend `NUTRITION_CONTEXT` beyond 10 foods** (F8). The binding constraint on the entire domain. **Editorial, not engineering** — and no amount of engineering substitutes for it.
2. **Enrol PANTRY1's assembler as the second producer** (§ 3). NTC-P3, with the code already written.
3. **NTC-P2 convergence** (F6) — retire three ungoverned channels; Planner stops running two engines.
4. **Give COMP1 a UI** (§ 4). 712 lines of cited comparison reasoning with no way in.

**The one-sentence answer to the mission:** *THA does not need more Food Intelligence surfaced. It needs the Food Intelligence it already built to be connected — and it needs more than three things worth noticing, two of which are absences.*

---

## OPTIONS

| Option | Description | Cost | Risk | Reversible? |
|---|---|---|---|---|
| **A** | **Fix P0, then QW1–QW4, then producers** — defects first, connection second, new knowledge third | Low → medium | Low. Every step uses an existing owner | Yes — each is a mount, an entry, or a test wiring |
| **B** | Surfaces first: mount ambient everywhere now | Low | **Medium-high.** Cookbook/Diary render empty rooms; the same 3 facts multiply against a cap of 2; ungoverned channels grow | Yes, but it teaches the wrong pattern |
| **C** | Build the Food Intelligence Engine per FI § 8 Phase 1 | High | **High — and it is already built** (F3). This is what the stale § 13 would tell you to do | — |

---

## RECOMMENDATION

**Option A.**

What distinguishes it: B and C both assume the problem is a shortage of *intelligence*. The measurements say the opposite — the engines exist (FI3, COMP1, HNP1, PANTRY1, UPF), the knowledge is deep (610 foods, 1,035 graduated links), and the failure is **connection**: a recommender no utterance can reach, a comparison engine with no UI, two assemblers with zero importers, a producer recorded Complete and registered nowhere, and a convergence module that cannot load. C is the most expensive way to discover you already own the thing.

Option A is also the only one that respects the budget doctrine. With `MAX_NOTICES_PER_MOMENT = 2`, more surfaces cannot produce more intelligence — *"improve the producers, not the volume."*

**What would change my mind:** if the ten-food evidence-context ceiling (F8) is *deliberate* — a KMS throughput decision rather than an accident — then the domain's ceiling is editorial capacity (FI § 9, Risk R10: *"editorial capacity again under-costed"*), and every engineering item here is arranging furniture in a room with the lights off. **That question belongs to the owner, not to this investigation.**

---

## ARCHITECTURE COMPLIANCE

The recommendation complies. It creates **no new ownership**, **no schema change**, **no new store**, **no second assistant**, and **no new engine** — by construction, because it does nothing except walk through two doors the architecture already built (DEC1 § 7 enrolment; the one `<AmbientIntelligence>` surface).

| Rule | Compliance |
|---|---|
| **FI1 — Enrichment, not ownership** | ✅ Nothing here owns a business fact. Producers read via existing services; every write is a registered intent |
| **E1 — No citation, no card** | ✅ Named as the *binding constraint* (F8) rather than worked around. 600/610 foods stay silent |
| **LT3 — The brain stays deterministic** | ✅ The model phrases; producers select. No recommendation originates in an LLM |
| **T0/T1 — Safety supersedes; food, not bodies** | ✅ The one `critical` is the restriction conflict; no surface makes a claim about a body |
| **G1 — Generic Knowledge Wall** | ✅ Extending `NUTRITION_CONTEXT` is Plane 1 editorial with `SourceRef` + `lastReviewed`; nothing household-derived flows back |
| **Notice Engine § 9** | ✅ No second ambient channel proposed. The report **schedules the retirement** of the three that exist, and refuses the cap raise |
| **DEC1 § 3 boundaries** | ✅ No selection, evidence gating, attention re-derivation, or confirmation change |
| **Discovery & Presentation / Companion Card** | ✅ Companion refers; canonical pages present. Summary → Cards → Next Steps; no domain-specific layout |
| **Core Principle 6 — honest gaps** | ✅ Cookbook's empty room is **named** rather than padded; Home renders nothing on a quiet day |

**One conflict found, and it is in the architecture, not the recommendation.** `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` § 13 asserts the Food Intelligence Engine does not exist and gates it behind a Phase 0 exit (§ 8). **The engine exists** (`engine.ts`, FI3), and § 13 is false. Per the Bootstrap's own rule — *"If a proposed change conflicts with the governing architecture: STOP, explain why, and do not continue until approved"* — this is stopped and reported, not worked around. **Correcting § 13 is a governed documentation act requiring approval, and this investigation does not perform it.**

---

## DATA IMPACT

None — investigation only. No code, schema, route, capability, or runtime behaviour was touched. `git status`'s modified-list is identical to session start.

---

## TRUST CHECK

- **Is any finding stated more confidently than the evidence supports?** No. Every count was read from the seed module; every "not wired" claim was traced through the import graph; the `SyntaxError` (F5) was **executed**, not inferred. Where the documents and the code disagree, the code is reported as truth and the disagreement is named.
- **Is anything guessed but presented as measured?** No. The one number carried from a governing document rather than re-measured is CONV1 P8's 192/195 unanchored households, cited as such.
- **Are the unknowns listed as plainly as the findings?** Yes:
  - **Why** HHP2's enrolment never landed is **unknown** — its record notes the branch carried substantial uncommitted work; whether it was lost in a rollback cycle or never written is not established here.
  - Whether the 10-food evidence ceiling is deliberate is **unknown** and is the load-bearing open question.
  - This investigation did **not** run `npm test`, `verify:publication`, or the app. The `SyntaxError` was reproduced directly; the surrounding suites' current pass/fail state is **not** claimed.
  - Row counts for DB-resident knowledge were read from **seed** modules, not from the live database.

---

## OUTCOME

What is now known that was not known before:

1. **"Dashboard observations" names an engine that forbids user-facing use.** The owner is the Notice Engine.
2. **THA's whole ambient intelligence is three facts from one producer**, two of which are absences — and **Food Intelligence is that producer**. The mission's subject is not part of THA's proactive intelligence; it is all of it.
3. **The bottleneck is connection and knowledge, not surfacing.** A recommender no utterance can reach; a 712-line comparison engine with no UI; two assemblers with zero importers; 600 of 610 foods with no citable evidence.
4. **Four live defects** (F4, F5) hidden behind tests that are not wired into `npm test` and a publication gate that greps a module that cannot load.
5. **The mandatory Bootstrap is materially false** about this domain's current state.

---

## NEXT STEPS

Nothing here is authorised by this document. Each item below is its own gated workstream under `ENGINEERING_WORKFLOW.md`:

1. **Owner decision (blocking, and it outranks every engineering item):** is the 10-food evidence-context ceiling deliberate? The answer determines whether this domain's constraint is editorial capacity or engineering.
2. **P0.3 first** — wire `hhp2`/`hhp3`/`notice-convergence` into `npm test`. It is minutes, and it makes P0.1/P0.2 fail loudly instead of silently.
3. **P0.5** — correct FI § 13 by governed amendment (approval required; this investigation did not perform it).
4. **QW1** — mount `<AmbientIntelligence>` on Home. Smallest change, largest felt difference.
5. **P0.1/P0.2** — repair or retire `notice-gateway.ts` and the HHP2 enrolment. **Retire is a legitimate outcome**: a module that cannot load has no consumers to protect.
6. Then NTC-P3 (PANTRY1 as second producer) → NTC-P2 (converge the three bypasses) → COMP1's UI.

---

*Investigation only. No code was changed in the production of this document.*
*Rollback: `rollback/FI18-household-food-intelligence-experiences-20260717` → `a9116faa`.*
