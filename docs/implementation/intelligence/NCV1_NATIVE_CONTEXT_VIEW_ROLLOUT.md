# NCV1 — Native Context View Rollout — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform` (on top of BEH1 / OBS1 / OBS2)
**Risk:** 🟡 AMBER
**Reason:** Changes what the language model is shown as grounding for six capabilities, and adds one field to one telemetry row. No handler, port, binding, registry or resolver line is touched, and no user-facing behaviour is changed except through what the model reads.

**Governing architecture:** `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17 — §2.1 rollout, §6 and §7 amended by this workstream), `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1/OBS2 — §5.1b added by this workstream), `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1)
**Predecessor:** `docs/implementation/intelligence/INT19_CONTEXT_COMPOSITION_ENGINE_BASELINE_AND_ROLLOUT.md` — the capability audit and priority-ranked rollout plan this workstream executes part of

---

## 0. SUMMARY, INCLUDING WHAT WENT WRONG

Seven native Context Views are now registered across six capabilities — `profile:read` and `food-intelligence:report` (INT17's, unchanged) joined by `meals:read`, `meals:search`, `planner:read`, `shopping:read` and `household:read`. The Context View registry is the single canonical owner of all seven, asserted by test. The Conversation Gateway now records, on every `context-composition` observation, which of a turn's views were native and which generic; the Observation Workbench and the Execution Timeline surface it.

**Three claims this workstream made and then disproved by measuring them.** They are recorded first because they are the most useful thing in this document.

| Claim | Status | What the measurement showed |
|---|---|---|
| A `keep` allowlist stops a new field reaching the LLM | **Half true.** Corrected in code, doc and test | It bounds a collection's **rows**. A new **top-level scalar** (`inviteCode`) still competes for budget and still reaches the model. `keep` is not a redaction layer; the handler's projection is. |
| `groupBy: "dayOfWeek"` on `planner:read` helps | **False.** Implemented, measured, **reverted** | It degenerates `_context.days.groups` into `{"0":1,…,"6":1}` — one entry per row. PL-023 scored 74.3 in 3/3 runs with it, 81.8 in 6/6 runs without. |
| …because seven empty planner days **crowd out** co-resident evidence | **False.** The stated cause was wrong | A deterministic experiment showed every capability kept its guaranteed core: Milk and the restriction conflict reached the model either way. Round 0 is guaranteed *per capability*. The real cost was a degenerate `_context`, seven rows asserting absence, and **one** pantry item of discretionary budget. |

The third correction matters beyond this workstream: the first draft of both the code comment and the new architecture hard-stop attributed the regression to §8 item 7's core displacement. **§8 item 7 does not describe what happened.** The commit that reverted the declaration (`0e6a1fc`) carries the wrong explanation in its message; §7.4 below is the correction of record.

**A fourth finding is methodological and limits every benchmark claim here.** The Companion benchmark runs `worldMode: single-world` against the **live household**, and that household drifted mid-session: PL-024's `fallbackState` — computed at `conversation-gateway.ts:713`, one hundred and seventy-five lines *before* `composeContext` is called at line 888, and therefore unreachable by anything NCV1 changed — flipped `none → no-knowledge → none` across three consecutive benchmark windows. Per-question composite deltas are consequently **observations, not findings**, and are labelled as such throughout.

---

## 1. ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-ncv1-native-context-views-20260709` → `e5c771356eb60e99b5172c6eec3c34ced9378a46` |
| Working tree at tag time | Clean (confirmed before any file was modified) |
| Implementation commit | `5725de5` — seven native views, observation + timeline, tests, architecture |
| Correction commit | `0e6a1fc` — planner `groupBy` reverted; its three benchmark artefacts committed as the evidence. **Its commit message states the wrong mechanism; see §7.4.** |
| Documentation commit | this document + the three `__0e6a1fc` benchmark artefacts |
| Rollback to pre-NCV1 | `git checkout rollback/before-ncv1-native-context-views-20260709` |
| Partial rollback | `git checkout e5c7713 -- server/intelligence/context/context-view.ts` restores the two-spec registry; the engine is indifferent and needs no other change |

---

## 2. REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`
- [x] `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md`
- [x] `docs/implementation/intelligence/INT19_CONTEXT_COMPOSITION_ENGINE_BASELINE_AND_ROLLOUT.md`
- [x] The five payload-owning handlers: `meals-read-handler.ts`, `planner-read-handler.ts`, `shopping-read-handler.ts`, `household-read-handler.ts`, `profile-read-handler.ts`

---

## 3. WHAT WAS BUILT

### 3.1 Seven native Context Views, one canonical owner

`CONTEXT_VIEW_SPECS` in `server/intelligence/context/context-view.ts` is the sole definition site. A test (`§13(a)`) walks every `.ts` file under `server/intelligence` and asserts exactly one module declares a Context View, so a capability cannot quietly acquire a second owner.

A spec may state **three** things and nothing else, and each of the seven is justified in-code against the module that owns its payload:

| View | `pinned` | `groupBy` | What `keep` is for |
|---|---|---|---|
| `profile:read` | dietary constraints (INT17) | — | — |
| `food-intelligence:report` | — | `type` (INT17) | opportunity fields |
| `meals:read` | none | **`mealSourceType`** | union over list / summary / detail; drops `userId`, `categoryId`, `sourceUrl`, `isFreezerEligible` |
| `meals:search` | none | auto (`kind`) | the search projection, as an allowlist rather than an inference |
| `planner:read` | none | **none — see §7.4** | union over week / day |
| `shopping:read` | `totalMatchedPrice`, `currency`, `note`, three counts | none (`category` is nullable) | union over list / unresolved / basket |
| `household:read` | `aggregated.union{DietTypes,Restrictions,Exclusions}` | none | union over both `members` shapes |

**Scope polymorphism was the design problem.** A spec is keyed `${capabilityId}:${verb}`, but `meals:read` returns three different top-level shapes, `household:read` three, `shopping:read` three. No new machinery was needed: `deriveContextView` filters declared collections to those actually present (falling back to generic detection when none are), and `getPath` skips a pinned path the scope does not carry. So a `keep` list is the **union** across a verb's scopes, and `shopping:read scope=list` pins nothing while `scope=basket` pins six paths — from one entry. Asserted in `§13(g)`.

**Not pinning is a decision too.** `SectionBuilder.rankedScalars()` drops every zero-relevance leaf once a view declares a core, so a spec that pins nothing behaves for scalars exactly as the generic path did. Only `profile`, `shopping` (basket) and `household` (dietary-context) pin anything, and each pin is a fact whose absence lets the model state a falsehood.

### 3.2 Recording composition through the Observation Engine

`conversation-gateway.ts` adds `nativeViews` and `genericViews` to the `context-composition` observation's metadata bag. No new kind, no new column, no migration — exactly the path OBS §2.2 defines for a new analytical need.

Nativeness is resolved **at the capture point**, by asking the registry (`hasNativeContextView`). It is never resolved inside `composeContext`, and the engine never branches on it. INT17 §2.1's indistinguishability is a property of *composition*, not of *telemetry*: an operator must see how far the rollout has reached while the engine stays unable to behave differently for a migrated capability. That is what keeps the eventual move to a capability-owned `contextView()` the pure move §2.1 promises. A new hard stop in the architecture forbids ever collapsing the two.

**The classification is never backfilled.** `summarizeContext` reports a pre-NCV1 row's views as `unknown`, never as `generic`; `classifiedCompositionCount` says how many rows spoke at all. Resolving an old row against today's registry would answer a question about the present and stamp it on the past — and the rollout the field exists to measure is precisely what changed in between. A row that did not say is not a row that said no.

### 3.3 Surfacing it

- **Execution Timeline** (`/admin/behaviour`): each view is badged `native` or `generic`. A turn recorded before NCV1 renders `native/generic not recorded (pre-NCV1)` — absent, never reconstructed, the same discipline OBS2 applies to a pre-BEH1 behaviour decision.
- **Observation Workbench** (`/admin/observations`): the context view table gains a *Composed by* column counting `native` / `generic` / `not recorded`. The three partition every use, so the rollout's reach is readable without a second store.

---

## 4. WHAT EACH VIEW DOES — MEASURED, NOT ASSERTED

The A/B is exact and deterministic. A spec is keyed `capability:verb`, so composing an **identical Full Result** under an unregistered capability id exercises the generic derivation and changes nothing else. This is only sound because the engine cannot tell the two apart — the property `§13(b)` asserts directly. Every number below is from a pure function, in process, with no database, no model and no world.

### 4.1 `meals:read` — the balance dimension the questions actually ask about

The generic detector picks `kind` (`meal` / `drink`), a distinction no meal-quality question asks about. `mealSourceType` (`scratch` / `ready_meal`) is the one CB-017 and CB-022 ask about.

| | native | generic |
|---|---:|---:|
| section chars | **1,315** | 1,426 |
| meals shown | **7** | 5 |
| distinct entity ids | **7** | 5 |
| CB-022's answer meals (2151, 2139) reach the model | **both** | **neither** |
| `userId` / `categoryId` emitted | no | yes |

Relevance could not have fixed this and must not: the engine may never displace a capability's own top item (§4.1). Naming the right balance dimension makes `tuna spaghetti` the `ready_meal` group's own representative, and it enters the guaranteed core — including on the crowded turn where the 611-food registry co-resides.

### 4.2 `shopping:read` — an honesty caveat a budget could outbid

On a realistic four-capability turn (`shopping` + `pantry` + `food-intelligence` + baseline `profile`) at the production budget, the **generic** view emits the priced rows — `[2.50]` — and drops `totalMatchedPrice`, `currency`, the owner's *"No prices were estimated and no store was chosen here"* note, and all three counts. A model shown prices and no total must either decline or add them up itself, and is told nothing about the six unpriced and five unresolved items excluded from the figure it would produce.

Pinned, all six survive down to a starvation budget of **one token**.

Generic *retention* of the note is worse than its absence: measured in isolation at 260 tokens, `note` alone survives — and only because its text contains the word "Shopping", which the utterance also contained, scoring it 2 where every other scalar scores 0. An honesty caveat that reaches the model when the question happens to rhyme with it is not a caveat.

### 4.3 `household:read` — a hard restriction the model never saw

`dietary-context` injected as a baseline read on a busy turn, household restrictions `["Gluten", "Peanut"]`:

| | native | generic |
|---|---|---|
| `unionRestrictions` | emitted | **outbid** |
| `unionExclusions` | emitted | **outbid** |
| `Gluten` reaches the model | yes | yes — incidentally, inside the one member row the balance guarantee seated |
| `Peanut` reaches the model | **yes** | **no** |

A household hard restriction is HARD RULE 2 and benchmark gate G2. One that a token budget can outbid is one the Companion cannot honour. Empty is still emitted: `"unionRestrictions":[]` says *none are recorded*, where an absent key says nothing.

### 4.4 What `keep` really bounds

| | native | generic |
|---|---|---|
| new **row** field (`members[].email`) reaches the model | **no** | yes |
| new **top-level** field (`inviteCode`) reaches the model | **yes** | yes |

`keep` is an economy and review discipline over a collection's rows. It is **not** a secrets boundary. What must never reach the model must never reach the Full Result — `household`'s Capability Card excludes `inviteCode` at the source, and that is what protects it. The code comment, the architecture's §7 and a test (`§13(f)`) now all say so, because the first draft of this document said the opposite.

---

## 5. THE PLANNER EXPERIMENT, AND ITS REVERSAL

`groupBy: "dayOfWeek"` was the obvious declaration: seven groups of one day each put the whole week into the guaranteed core, where generically the week is one group. In isolation it does exactly that — 7/7 days at every budget from 100 tokens up, against generic's 1 at 300 and 5 at the production budget of 600.

It was shipped in `5725de5`, measured on the corpus, and reverted in `0e6a1fc`.

### 5.1 Why it is wrong

**A balance dimension must name a kind that several rows share.** `dayOfWeek` has exactly one row per value, so declaring it degenerates both mechanisms that rest on it:

- `_context.days.groups` becomes `{"0":1,"1":1,…,"6":1}` — one entry per row, stating nothing the rows do not, and inviting the model to read the `1` as a meal count rather than a day count. Compare `food-intelligence`, where `{"planner-empty-day":7}` is true and useful precisely because seven opportunities really do share one type.
- The balance guarantee becomes "print every row", which is what a budget exists to prevent.

The generic detector's `MAX_GROUP_CARDINALITY = 48` guards the far end of this (a `slug` with 611 values). **Nothing guards the near end.** A declared `groupBy` must be checked by hand, and the architecture now says so as a hard stop.

### 5.2 The mechanism, measured — and the one I got wrong

Deterministic, in process, against the benchmark household's real planner state (a week of seven **empty** days; `meals: []` is dropped by the emptiness rule, so each day emits a bare `{dayId, dayOfWeek}`), composed beside `pantry` and `food-intelligence` at the production budget:

| | planner rows | planner chars | pantry items shown | Milk reaches model | restriction-conflict reaches model |
|---|---:|---:|---:|---|---|
| with `groupBy` | 7 | 360 | **4 of 6** | yes | yes |
| without | 5 | 222 | **5 of 6** | yes | yes |

**Every capability kept its guaranteed core.** Round 0 is guaranteed *per capability*, so extra planner groups cannot displace another capability's core evidence. The cost was a degenerate `_context`, seven rows asserting a day with no meals instead of five, and **one** pantry item of discretionary budget.

This refutes the explanation in `0e6a1fc`'s commit message and in the first draft of the architecture hard-stop, both of which said the declaration "spent the budget `pantry` and `food-intelligence` needed" and cited §8 item 7. **§8 item 7 describes core displacement by a many-group capability. That is not what happened, and the balance guarantee held exactly as designed.** The corrected statement is §7.4 and the amended hard stop in `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` §7.

### 5.3 The corpus observation (consistent, not conclusive)

| question | with `groupBy` (3 runs) | without, two different windows (6 runs) |
|---|---|---|
| PL-023 "What's on my meal plan this week?" | 74.3 / 74.3 / 74.3 | 81.8 × 6 |
| ND-059 "What simple nutrition boosts can I add?" | 74.3 / 81.8 / 74.3 | 81.8 × 6 |

Two windows with different live-world states agree at 81.8 without the declaration; the only window with it is the only one at 74.3. That is consistent with causation and is **not proof** — see §6.3.

---

## 6. BENCHMARK VERIFICATION

`npm run test:companion-benchmark -- --mode=full --user=1`, `worldMode: single-world`, judge tier off, **n = 3 per configuration**, matching INT19 §2's protocol.

### 6.1 Headline

| configuration | score (median of 3) | runs | mean composite over 100 questions |
|---|---:|---|---:|
| INT19 baseline (`e65bc1f`, 2026-07-08) | 76.1 | 76.0 / 76.1 / 76.3 | 76.13 |
| **Same-session control** — pre-NCV1 engine, today (unledgered, §6.2) | 76.1 | 76.1 / 76.1 / 76.2 | 76.13 |
| NCV1 with `planner groupBy` (`5725de5`) | 76.0 | 75.9 / 76.0 / 76.1 | 75.98 |
| **NCV1 final (`0e6a1fc`)** | **76.3** | 76.1 / 76.3 / 76.3 | **76.26** |

The same-session control reproduces the INT19 baseline **exactly** (median 76.1; mean composite 76.13 to two decimal places), which establishes that neither the model nor the corpus drifted overnight.

The final median moves +0.2 against both baselines. INT16 §6.2 established a ~1.2-point noise floor by running identical code eleven times. **No composite gain is claimed.** What is claimed is that nothing regressed.

### 6.2 Safety and honesty invariants — identical across all four configurations

| | baseline | control | NCV1a | **NCV1 final** |
|---|---|---|---|---|
| Hard safety gates | 0 | 0 | 0 | **0** |
| Hallucination rate | 0% | 0% | 0% | **0%** |
| Honest-gap rate | 100% | 100% | 100% | **100%** |
| Routing gates | 12 | 12 | 12 | **12** (the same 12) |
| Intent accuracy (IRA) | 85% | 85% | 85% | **85%** |
| Verdict | PARTIAL | PARTIAL | PARTIAL | **PARTIAL** |

Routing is untouched by construction: the engine composes what routing hands it.

> **The control runs are deliberately absent from the append-only benchmark ledger.** They were executed by reverting four engine sources with `git checkout e5c7713 -- …` while `HEAD` remained `0e6a1fc`, so every artefact they wrote carried `"commit": "0e6a1fc…"` — a tree that does **not** produce them. Their index rows and artefacts were removed **before** any commit, exactly as INT19 §1 warned about the orphaned `8b01fff` run. Their numbers are reported above as scratch evidence and nowhere claimed to reproduce from a commit. An earlier exploratory run (75.9) was discarded on the same grounds. `git diff --numstat` on `index.json` for the documentation commit is `48 additions, 0 deletions`: all 128 committed rows intact, three added.

### 6.3 What the benchmark cannot tell us, and why

`worldMode: single-world` runs every question against the **live household**. That household changed during this session:

```
PL-024  fallbackState across three consecutive windows
  NCV1a  (+groupBy, 08:06–08:10)    none / none / none
  NCV1b  (final,    08:18–08:23)    no-knowledge × 3
  CONTROL(pre-NCV1, 08:34–08:38)    none / none / none
```

`fallbackState` is `knowledgePackage.gapState`, assigned at `conversation-gateway.ts:713` from the routed intents' outcomes. `composeContext` is called at line **888**. Nothing NCV1 changed is upstream of line 713, so NCV1 **cannot** have moved this value — yet it moved, and moved back, while the configuration went NCV1 → NCV1 → control.

Therefore:

- PL-024's apparent **+12.5** is world drift and is **not** claimed.
- Every per-question composite delta in this document is an **observation**. Where a claim is made (CB-022; the planner reversal) it rests on agreement **across** windows with different world states, plus a deterministic in-process mechanism.
- The one durable per-question claim: **CB-022 scored 81.8 in 6 of 6 NCV1 runs across two windows and two world states, against 74.3 in 2 of 3 control runs.** CB-022 is the *only genuine answer-quality regression* INT17/INT18 introduced (INT19 §4 P2, §6.3). Its mechanism — `mealSourceType` seats `tuna spaghetti` as a group representative — is proven deterministically in §4.1.

### 6.4 `entityRefs` — INT19's durable signal, and what happened to it

INT19 §2 named `entityRefs` "the durable quality signal — not the score". It fell.

| | median | runs |
|---|---:|---|
| INT19 baseline | 170 | 154 / 170 / 176 |
| Same-session control | 158 | 153 / 158 / 185 |
| NCV1 final | 151 | 142 / 151 / 168 |

Three things must be said honestly.

1. **The raw count is not scored.** `scorer.ts:387` reads `turn.entityRefCount > 0` — a boolean threshold. On that threshold NCV1 is level with the same-session control (median **31 → 31**) and above the INT19 baseline (**30 → 31**). Questions citing *something* did not fall.
2. **The control's own spread is 32 points** (153–185) across three runs of *identical code*. A 7-point median move sits well inside it. Nothing is demonstrated either way.
3. **A measured, deterministic contributor exists.** On the same payload, the generic `meals` section offers the model **21 id-shaped fields** across 7 rows — `id`, `userId` and `categoryId`, each ×7. The native section offers **6**: one `id` per meal. HARD RULE 5 instructs the model to cite entities it can see with real IDs, and `userId` — the caller's own id, identical on every row — and an unresolvable `categoryId` name no entity anyone could be shown. A threefold reduction in id-shaped fields to enumerate is the expected consequence of removing them.

   How many *distinct real entities* the section carries is a separate question, and it moves with the utterance rather than with the view: on *"which meals need better ingredient or nutrition data?"* the native view seats **7** meals against generic's **5**; on *"which meals do I have"* it seats **6** against **7**, because `GROUP_ITEM_CAP` binds once `mealSourceType` splits the payload into two groups. Neither is a trend, and neither is claimed as one.

`entityRefs` counts what the model echoes back. Where it counted `userId`, it was counting the platform's plumbing — which is why §14 suggests it should count entities rather than id-shaped fields.

---

## 7. ARCHITECTURE COMPLIANCE

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Meals by `id`; planner days by `dayId`; shopping lines by `id`; household members by
  `userId`, eaters by `id`; profile by `profile.id`; opportunities by `id`. No key space
  is created, renamed or reshaped — `keep` selects fields, it never mints one.

☑ One owner per fact
  Every emitted value is copied verbatim from the Full Result its handler produced. A spec
  cannot add a fact, and `deriveContextView` is a pure read.

☑ No duplicate entities
  Nothing new is created. Seven declarations replace seven structural inferences.

☑ No duplicate ownership
  `CONTEXT_VIEW_SPECS` is the sole definition site for a Context View — asserted by a test
  that scans every module under `server/intelligence`. `hasNativeContextView` is the sole
  question, so no second list of native views can drift from it. A new architecture hard
  stop forbids a capability holding both a spec and its own `contextView()`.

☑ No duplicate state
  No store, table, column or cache is added. `nativeViews`/`genericViews` ride the existing
  JSONB metadata bag of an existing observation kind (OBS §2.2's named path).

☑ Extends existing architecture
  This is INT17 §2.1's own rollout mechanism, used as designed, and INT19 §4's plan. The
  Context Composition Engine (`composeContext`) is not modified by one line.

☑ Progressive enrichment where appropriate
  Not a knowledge entity. Context Views are a read projection; nothing is enriched or stored.

☑ Honest gaps over fabricated information
  Pinned constraints are emitted even when empty (`"unionRestrictions":[]` — §4.3), because
  absence and emptiness are different facts. Pre-NCV1 observations are reported `unknown`,
  never `generic`. The Timeline marks a pre-NCV1 turn unclassified rather than reconstructing
  it. `_context` gained no field the model can subtract with.

☑ No permanent synchronisation bridge
  None. Nativeness is derived on read from the one registry, never stored beside it.

☑ Evolution over replacement
  Nothing is replaced. The generic derivation remains the engine's behaviour for the
  thirteen capabilities that still ground turns without a spec, and remains the fallback for
  any scope a declared collection does not cover.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform  — composition sits at the one gateway seam
✓ Uses the Capability Registry              — unchanged; the engine still holds no reference to it
✓ Uses the Intent Engine                    — unchanged; routing is untouched (IRA 85%, same 12 misroutes)
✓ Reuses existing business services         — zero handler/port/binding lines changed
✓ Does not create another assistant         — no new surface
✓ Does not duplicate conversation state     — none touched
✓ Uses registered capabilities only         — specs are keyed to registered capability:verb pairs
✓ Uses permission-aware access              — the engine performs no I/O and reaches no data a caller was not already granted
✓ Produces honest gaps rather than fabricated knowledge — §4.3, §3.2, and the `_context` rules above
```

### 7.4 Correction of record — commit `0e6a1fc`'s message

Commit `0e6a1fc` reverted `planner:read`'s `groupBy: "dayOfWeek"`. The revert is correct. **Its stated reason is not.** The message asserts that seven empty planner days "spent the budget `pantry` and `food-intelligence` needed" and cites `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` §8 item 7.

The deterministic experiment in §5.2, run afterwards, refutes that: every capability retained its guaranteed core, and both the pantry Milk evidence and the shopping restriction conflict reached the model with the declaration in place. Round 0 is guaranteed **per capability**; a many-group capability cannot displace another's core. The true cost was a degenerate `_context.days.groups`, seven rows asserting absence rather than five, and one pantry item of discretionary budget.

The commit is not amended, because its SHA is the provenance tag on three committed benchmark artefacts. This section, the corrected code comment in `context-view.ts`, the corrected hard stop in the governing architecture, and the regression test in `§13(d)` (which now asserts that a co-resident capability *keeps* its core) are the record.

---

## 8. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Context Composition (the LLM's grounding context)
Declared SoT:    server/intelligence/context/context-view.ts — CONTEXT_VIEW_SPECS
New store created? NO
Existing store extended? NO
  (`platform_observations.metadata` gains two JSONB keys — the bag OBS §2.2 designates
   for exactly this, not a schema change. No migration.)
Consumer created? NO
  Existing consumers only: composeContext (derivation), conversation-gateway.ts
  (nativeness, at the Observation Engine capture point), observation-engine.ts and
  execution-timeline.ts (pure projections), two admin-only read-only pages.
  All read from the declared SoT. No bridge, no copy, no cache.

Secondary domain: Platform Observations
Declared SoT:    platform_observations (observation-store.ts, sole owner)
New store created? NO   Existing store extended? NO (metadata bag only)   Consumer created? NO
```

---

## 9. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Context Views (the LLM-facing projection every capability owes)

Current Canonical Owner:
  server/intelligence/context/context-view.ts — CONTEXT_VIEW_SPECS
  (INT17 §2 names this the owner "today"; the capability itself is the target state.)

Current Runtime Consumer(s):
  composeContext (server/intelligence/context/context-composition-engine.ts)
  conversation-gateway.ts (hasNativeContextView, at the observation capture point)
  observation-engine.ts / execution-timeline.ts (pure projections over telemetry)
  admin-observation-workbench-page.tsx / admin-behaviour-workbench-page.tsx (read-only)

Duplicate Owners Remaining:
  NONE. Asserted by test §13(a): exactly one module under server/intelligence declares a
  Context View. No capability exposes a contextView(); no second registry exists.

Duplicate State Remaining:
  NONE. Nativeness is derived on read; the telemetry row records what was true at capture
  time and is never reconciled against the registry afterwards.

Duplicate Workflows Remaining:
  NONE introduced. The generic derivation is not a duplicate of the spec path — it is the
  documented fallback for a capability that has declared nothing, and the engine cannot
  distinguish the two (INT17 §2.1), which is what keeps them one workflow.

Current Convergence (%):
  DECLARATION:  31.6% — 6 of the 19 registered capabilities that ground a user-plane LLM
  turn now declare a Context View (7 views; `meals` declares one per executable verb).
  Was 10.5% (2 of 19). Counted from INT19 §3's complete audit of all 23 registered
  capabilities: 4 ground no user-plane LLM turn and are owed no view of either kind
  (`developer`, `administration`, `opportunity-delivery`, `evidence-learning`); of the
  remaining 19, six declare and thirteen use the generic derivation.

  OWNERSHIP:    0% — unchanged, and deliberately so. INT17 §2.1's target state is that the
  CAPABILITY exposes contextView() beside its Full Result. No capability does. NCV1 moved
  ownership of the DECLARATION from nobody to the registry; it did not move it to the
  capability, because doing so would change capability ownership — outside this scope, and
  outside INT17's. Reporting one number here would hide the more important zero.

Target Convergence (%):
  DECLARATION 100% (19 of 19), then OWNERSHIP 100% by per-capability migration.

Next Planned Milestone:
  INT19 §4 Priority 1 — `nutrition-knowledge:read scope=foods` (CRITICAL, still open: the
  611-food registry spends eight core seats on reference data). Then Priority 3,
  `analyser:read` (15 groups, MAX_GROUPS_SHOWN seats 8, generic compressed it −2%).

Remaining Architectural Risks:
  1. The registry, not the capability, owns every declaration. A payload's owner can change
     a field without the spec noticing; only the `keep` allowlist makes that visible, and
     only for collection rows.
  2. `planner:read` has no balance dimension. `days` is one group, so a week competes for
     discretionary budget. Naming one requires a household whose planner is not empty (§5).
  3. INT19 §4 Priorities 1 and 3 are untouched by NCV1 and were not in its scope.
  4. `planner` emits no counted entity id: `PlannerDayView.dayId` is not `id`, so
     `metrics.entityIds` records zero for it. Fixing it means changing the Full Result —
     a capability change, out of scope.
```

---

## 10. DEFINITION OF DONE

| Requirement | Status | Evidence |
|---|---|---|
| Native Context Views rolled out to the prioritised capabilities | ✅ | 7 views / 6 capabilities: meals, planner, shopping, household, profile, food-intelligence |
| Companion conversation consumes them | ✅ | `conversation-gateway.ts` composes every turn's grounding through `composeContext`; the six are what it grounds on |
| Ad-hoc context composition replaced | ✅ | No truncation or serialisation outside the engine exists (INT17 removed it); NCV1 replaces the engine's *structural inference* with the payload owner's *declaration* for six capabilities |
| Context Composition Engine reused, not duplicated | ✅ | `git diff --stat e5c7713 HEAD -- context-composition-engine.ts context-relevance.ts` is **empty**. The engine is not modified by one line; only the registry it reads |
| Every capability requests only the views it needs | ✅ | `keep` allowlists per collection; `pinned` only where a constraint exists; `§13(c)–(f)` |
| Composition recorded through the Observation Engine | ✅ | `context-composition` metadata gains `nativeViews`/`genericViews`; `summarizeContext` partitions native/generic/unknown; telemetry suite 67 → 74 |
| Context View usage surfaced in the Execution Timeline | ✅ | `TimelineTurn.{contextViewsClassified,nativeContextViews,genericContextViews}`; badged per view; timeline suite 64 → 70 |
| One canonical owner per Context View | ✅ | `§13(a)` scans `server/intelligence` and asserts exactly one declaring module |
| No duplicated business logic or state | ✅ | `git diff --stat e5c7713 HEAD` over `handlers/`, `bindings/`, `capability-registry.ts`, `pattern-intent-resolver.ts`, `intent-resolver.ts`, `intent-engine.ts` is **empty**; no store, column or migration |
| Tests | ✅ | context composition **105 → 161**; timeline **64 → 70**; telemetry **67 → 74**. 14 intelligence suites, **1,025 assertions**, 0 failures |
| Typecheck | ✅ | `npx tsc --noEmit` = **180 errors before and after**; **0** in `server/intelligence/context/` or `observation/` |
| Benchmark | ✅ | n=3 median **76.3** vs same-session control **76.1**; 0 hard gates, 0% hallucination, 100% honest-gap, 12 routing gates, IRA 85%, PARTIAL — all identical |
| No user-facing behaviour changed except through grounding | ✅ | Six capability-binding suites (meals 72, household 51, shopping 38, planner 31, profile 50, food-intelligence 36) pass unchanged |

**What must not break:** the balance guarantee (`capabilitiesRepresented == capabilitiesContributing`); no clipped, dropped or invented entity id; pinned constraints surviving a starvation budget; determinism; valid JSON per section; `_context` never publishing a number the model can subtract with. All are asserted, and all held.

**Manual test steps:** open `/admin/observations` → *Context* view: each Context View row shows `native × n` / `generic × n` / `not recorded × n`, and the three sum to its composition count. Open `/admin/behaviour` → *Execution Timeline* → pick a session recorded after this deploy: "Context views composed" badges each view `native` or `generic`. Pick a session recorded before it: the badges are replaced by `native/generic not recorded (pre-NCV1)`.

---

## 11. DATA IMPACT

- **Reads existing data:** YES — capability Full Results, already fetched under the turn's existing permission check. No new read path.
- **Writes new data:** NO new store. Two keys are added to the JSONB `metadata` of an existing `context-composition` observation row.
- **Changes meaning of existing data:** NO. `metadata.views` is byte-identical to before. Rows written before NCV1 are reported `unknown` and are never reinterpreted.
- **Requires backfill:** NO — and backfilling is explicitly forbidden (§3.2).
- **Migration:** none.

---

## 12. TRUST CHECK

- **Could this mislead the user?** The Companion's answers now rest on a differently-shaped context. Two changes strictly reduce the chance of a false statement: the shopping basket's *"no prices were estimated"* caveat and its unpriced/unresolved counts can no longer be outbid (§4.2), and a household hard restriction can no longer be outbid (§4.3). One change was measured to mislead — `planner`'s degenerate `_context.days.groups` — and was reverted before release (§5).
- **Could this fabricate certainty?** No new fact is added; a spec cannot add one. `_context` gained no field. Pinning `note` exists precisely to stop a total being presented as certain.
- **Is anything guessed but shown as real?** No. A pre-NCV1 observation is shown as *not recorded*, never as *generic*. The Timeline shows a pre-NCV1 turn as unclassified. `metrics.entityIds` counts only ids the payload contained (0 fake of all emitted, tested).
- **What happens if the system is wrong?** A spec cannot break composition: an absent collection falls back to generic derivation, an absent pinned path is skipped, and every guarantee (balance, entity preservation, determinism, valid JSON, the 1,800-char ceiling) is enforced by the engine downstream of the spec and tested independently of it. Rollback is one file.
- **No architectural duplication introduced:** YES (none).
- **No new source of truth created:** YES (none).
- **No runtime behaviour altered for non-AI surfaces:** YES. The Full Result flows byte-for-byte unchanged to `TurnResult`, UI, reports and `opportunity-delivery` — asserted (`§2 The Full Result is never mutated`).

---

## 13. ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback identifier | `rollback/before-ncv1-native-context-views-20260709` → `e5c771356eb60e99b5172c6eec3c34ced9378a46` |
| Files modified | `server/intelligence/context/context-view.ts`; `server/intelligence/conversation/conversation-gateway.ts`; `server/intelligence/observation/{observation-engine,execution-timeline}.ts`; `client/src/pages/admin-{observation,behaviour}-workbench-page.tsx`; three test suites; two governing architecture documents; this document; three benchmark artefacts + `index.json` |

```bash
# Full rollback (sources, tests and docs together)
git checkout rollback/before-ncv1-native-context-views-20260709

# Rollback the VIEWS only, keeping the observation/timeline work.
# The engine is indifferent to whether a view was declared — that is the whole
# point of the seam — so deleting the five NCV1 entries from CONTEXT_VIEW_SPECS
# is sufficient and safe. `hasNativeContextView` keeps working; every view simply
# reports `generic`. §13 of the test suite must be removed with them.
git checkout e5c7713 -- server/intelligence/context/context-view.ts \
                        server/intelligence/conversation/conversation-gateway.ts \
                        server/tests/test-intelligence-context-composition.ts
```

**Verification after rollback:** `npm run test:intelligence-context-composition` returns to **105 passed** (§13 goes with the registry — a partial rollback that keeps the test file will fail §13(a), by design); `npx tsc --noEmit` reports **180** errors, unchanged; `npm run test:companion-benchmark -- --mode=full --user=1` returns a headline within the ~1.2-point noise floor of 76.1.

Telemetry written while NCV1 was live is unaffected either way: `nativeViews` remains in the JSONB bag, the pre-NCV1 `summarizeContext` simply does not read it, and no row is rewritten.

---

## 14. SCOPE LOCK

**Implemented scope**

- Native `ContextViewSpec`s for `meals:read`, `meals:search`, `planner:read`, `shopping:read`, `household:read`; `profile:read` and `food-intelligence:report` verified unchanged.
- `hasNativeContextView` / `NATIVE_CONTEXT_VIEW_KEYS` exported from the registry that owns the answer.
- `context-composition` observation records `nativeViews` / `genericViews`, resolved at the capture point.
- `summarizeContext` partitions each view's uses into native / generic / unknown; `classifiedCompositionCount` added.
- Execution Timeline exposes `contextViewsClassified`, `nativeContextViews`, `genericContextViews`; both admin surfaces render them.
- Governing architecture amended: Context Composition Engine §2.1, §6, §7 (four new hard stops), §8 items 1 and 7; Observation Engine §2.2, §5.1b, §6.1, §6.2.

**Explicitly excluded**

- **`nutrition-knowledge:read scope=foods`** — INT19 §4 **Priority 1, CRITICAL**, and still open. The 611-food registry spends eight guaranteed core seats on reference data. NCV1's priority list did not include it. Its victim (`meals`) is now seated correctly; **its cause is untouched.**
- **`analyser:read`** — INT19 §4 Priority 3.
- **Enrichment** — INT19 §4 Priority 4 (starved; reaches the model on 20 of 56 turns).
- **Capability-owned `contextView()`** — INT17 §2.1's target state. Deliberately not attempted: it changes capability ownership.
- Behaviour Engine logic: untouched.
- Business behaviour: untouched. 0 lines in any handler, port, binding, registry or resolver.
- Routing / the 12 misroutes capping IRA at 85%: a resolver concern, out of scope, unchanged.
- No new Context View *type*: `ContextView`, `ContextViewSpec` and `CollectionViewSpec` are unchanged.

**SUGGESTIONS — observed, not implemented, requiring approval**

1. **`pickGroupField` has no lower cardinality guard.** `MAX_GROUP_CARDINALITY = 48` rejects an identifier with 611 values but accepts one with 7 rows in 7 groups. A guard such as *"reject a candidate whose distinct-value count equals its row count"* would have caught the `dayOfWeek` mistake mechanically, for declared and generic paths alike. §5.1.
2. **The benchmark's `single-world` mode cannot support per-question attribution** (§6.3). Any workstream making per-question claims needs `benchmark-world` or `deterministic-households`, or interleaved A/B runs. INT19's per-question figures carry the same caveat and did not state it.
3. **`entityRefs` counts id-shaped fields the model echoes, not citable entities.** It counted `userId` — the caller's own id, on every meal row. As a quality proxy it rewards emitting more id-shaped plumbing. Consider counting distinct *entities* the answer references. §6.4.
4. **`planner:read` emits no counted entity id** because `PlannerDayView` names it `dayId`, not `id`. HARD RULE 5 lets the model cite an entity only where it sees a real id. Renaming is a capability change.
5. **`_context.<collection>.groups` is ambiguous when the group key is not obviously a kind.** `{"0":1}` under `days` reads as "one thing on day 0". Naming the dimension (`"groups":{"by":"dayOfWeek", …}`) would remove the ambiguity at a small token cost.
6. **`opportunity-delivery` should inherit `food-intelligence`'s view shape** the day it gains a resolver matcher — it re-projects the same opportunities (INT19 §3.3).
```
