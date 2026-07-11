# COACH1 — Proactive Coaching — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED — opens the platform's first governed proactive channel, and changes what a household is shown without asking.
**Reason:** Every prior workstream answered a question the user asked. COACH1 is the first that speaks unprompted. It also changes the order of already-eligible advice and the content contract of a Notice. Both are architectural, not additive.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-coach1-proactive-coaching-20260709` → `f0ab371` |
| Dirty-tree snapshot | `git stash list` → `COACH1_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-09` → `cf31264` |
| Working tree | Intentionally dirty — uncommitted COMP2/KNOW4/KNOW5/LEARN1/PLAN1 work and benchmark artifacts were present before this task began and are untouched by it. The snapshot above was taken with `git stash create` + `git stash store`, which records the tree **without** disturbing it. |
| This task's writes | `server/intelligence/opportunity-delivery/framework.ts`, `server/intelligence/conversation/notice-engine.ts`, `server/routes.ts`, `server/tests/test-intelligence-notice-engine.ts`, `package.json`, `server/tests/test-coach1-proactive-coaching.ts` (new), this document (new) |
| Rollback to pre-COACH1 **working tree** | `git checkout cf31264 -- <files>` — see §10. **This is the correct rollback.** |
| Rollback to pre-COACH1 **committed** state | `git checkout rollback/before-coach1-proactive-coaching-20260709` — ⚠️ this also discards the uncommitted LEARN1/PLAN1/KNOW4/KNOW5/COMP2 work, which is not COACH1's to discard. |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight principles; the contested-domain register)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (STEP 1–9; the compliance checklists)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Rules 1, 2, 5, 7, 8)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (capability / intent / permission model)
- [x] **`docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`** — the governing document for this workstream. §6 Silence Rules, §7 the honest baseline, §9 the ten stop rules.
- [x] `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (§7 — why no observation may be read back)
- [x] `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (§10 — why no behaviour decision may be read back)
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (Rule FI1; Rule E1; Rule T1)
- [x] `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`, `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`
- [x] `docs/implementation/intelligence/LEARN1_HOUSEHOLD_LEARNING.md` + `docs/investigations/EL2_...md` (Rule EL2; ET1–ET6; NK2 Rule P1)
- [x] `docs/implementation/planner/PLAN1_PLANNER_INTELLIGENCE.md` (why its evidence trail is not reusable here)
- [x] Code read in full before writing: `notice-engine.ts`, `opportunity-delivery/framework.ts`, `delivery-store.ts`, `opportunity-delivery-handler.ts`, `food-intelligence/opportunity-engine.ts`, `evidence-learning/framework.ts`, `household-observation.ts`, `capability-registry.ts`, `permissions.ts`, `types.ts`, `nutrition-centre-assembler.ts`, `shared/knowledge/evidence.ts`

---

## 0. WHAT THE INVESTIGATION FOUND BEFORE ANY CODE WAS WRITTEN

Three findings reshaped the brief. All three are evidenced, not estimated.

**(a) Proactive coaching was already built, and dormant.** The Companion Notice Engine is the single governed owner of every unprompted message (`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` §1: *"No other component may decide what the platform proactively notices, how often, or in what order."*). It already had producers for plant diversity, pantry usage, shopping opportunities, planner gaps, nutrition trend, streaks and seasonality — pure, tested, and reaching nobody. Its own §7 records why: **`GET /api/intelligence/companion/notices` does not exist.** Verified against the running code — the only production importer of `notice-engine.ts` was `behaviour-engine.ts`, and it imports the *type*, not the producers.

COACH1's central act is therefore **activation, not construction**. Building a second coaching engine would have tripped §9's last stop rule (*"Any second Notice Engine, anywhere, rather than the one extended in place — stop"*) and its first (*"Any second ambient-notice channel … stop"*).

**(b) Nutrition gaps cannot be honestly computed. They are not implemented, and this is the most important thing in this document.** The brief names "nutrition gaps" as a coaching theme. A gap requires a target. THA stores none:

| Searched | Result |
|---|---|
| `rda\|rdi\|nrv\|reference intake\|daily value\|recommended (daily\|intake)\|adequate intake` across `server/` + `shared/` | Two hits, both in OCR label parsers (`routes.ts:200`, `price-lookup.ts:223`) that *strip* the string "% Daily Value" off a photographed product label. **No stored target.** |
| `knowledge_nutrients` (`shared/schema.ts:1570`) | `slug, name, description, category, family, source, displayOrder, isActive`. **No target column.** |
| `food_diary_metrics` (`shared/schema.ts:1299`) | `weightKg, bmi, moodApples, sleepHours, energyApples, notes, stuckToPlan, customValues`. **No nutrient columns at all.** |
| `knowledge_food_nutrients.amount` (`shared/schema.ts:1617`) | An editorial string — *"'high', '150mg per 30g'. Never a fabricated precise figure"*. Not per-person, not comparable. |
| `uplift-types.ts:39` `nutritionGapPattern` | Documented in-file as *"Future-ready … **Currently unused by the engine**."* |

Nothing anywhere compares a household's intake to a target. A "you're low on iron" card would have been (i) a fabricated fact — Principle 6's hard stop, (ii) a claim about a body rather than a food — Rule T1's hard stop, and (iii) a knowledge claim with no `SourceRef` — `ENGINEERING_WORKFLOW.md` STEP 7's first hard stop. **COACH1 surfaces the honest adjacent signal THA does own — `nutrition-trend`, computed by `companion-growth.ts` from real `user_health_trends` rows — and names the gap rather than filling it.** A trend is not a gap, and this document does not let one be mistaken for the other.

**(c) Notices were not evidence-backed.** `noticeOpportunities` copied `explanation` and `suggestedAction` and **silently discarded the producer's `evidence` array**. The brief requires every recommendation to be evidence-backed; before COACH1, no coaching notice could say where its claim came from. Relatedly, `opportunity-delivery-handler.ts:99` returns `{ opportunities, grouped, trust, source }` and **drops `bundle.metadata`** — so LEARN1's `metadata.learning.influenced` audit record never left the framework. A household's confirmed pattern silently reordered its advice, and nothing could ever tell it so.

---

## 1. WHAT WAS BUILT

**Zero new AI, zero coaching engines, zero knowledge stores, zero tables, columns, migrations, capabilities, verbs, thresholds or opportunity generators.** Four extensions of existing, named owners.

### 1.1 The one governed channel (`server/routes.ts`)

`GET /api/intelligence/companion/notices` — the route the Notice Engine architecture §7 names as the missing piece. Authenticated, read-only, ownership-scoped (every read keyed on `req.user.id`, never a client-supplied id), persists nothing.

It **reasons about nothing.** It fetches from five existing owners, hands each to that owner's own pure Notice producer, and lets `applySilenceRules` decide order and volume. It never re-sorts, re-slices, re-words, filters or scores — `notice-engine.ts` already states that *"this is the ONLY place presentation order/volume is decided — callers must never re-sort or re-slice a gathered list themselves."*

| Coaching theme | Owner read | Producer |
|---|---|---|
| Planner gaps, **pantry usage**, **shopping opportunities** | `opportunity-delivery` capability, via `intelligencePlatform.handle()` | `noticeOpportunities` |
| **Nutrition trend** (*not* a gap — see §0b) | `storage.getUserHealthTrends` | `noticeNutritionTrend` |
| Streak milestone | `storage.getUserStreak` | `noticeStreak` |
| **Plant diversity** | `assembleNutritionCentre(householdId).overview.plantDiversity` | `noticeDiversity` |
| Seasonal highlight | `seasonalStories()` | `noticeSeasonal` |

Opportunities are reached **only through the registered capability**, never by importing OD1's framework or its store — so the delivery lifecycle, `mutedOpportunityTypes`, LEARN1's learning and COACH1's own ordering all apply exactly once, where they live. A structural test asserts `routes.ts` imports neither module.

Plant diversity is **read from its existing owner, never recounted.** Plant Diversity is a *contested* domain (`ARCHITECTURE_PRINCIPLES.md`); a second count computed in this route would have been a third owner and would have moved convergence backwards.

Each of the five reads degrades independently. A household with no planner, no household row, or no streak contributes no notice from that owner, never a fabricated stand-in. `centre.overview` is `null` for a household with no planner history — that owner's own honest gap, and it yields silence rather than `plantDiversity: 0`.

### 1.2 Coaching is evidence-backed (`notice-engine.ts`)

Two changes, and **no reasoning added to the engine**:

1. **`evidence` is carried through, verbatim and in order.** This is a *wider* verbatim projection, not a new fact — it makes the module's existing promise true for the whole opportunity rather than for two of its three content fields.
2. **An opportunity that cites nothing is dropped**, exactly as an unmapped domain already is. Rule E1 — *no citation, no card* — becomes structural at the coaching boundary. Both are the same honest no-op; neither examines content, and neither introduces a metric, threshold, cluster or ranking (§9's second stop rule).

Every `Notice` additionally carries `source`, naming the existing owner its fact was read from. This is **provenance, not content**: it adds no fact and no judgement, and it makes *"which owner said this?"* answerable for every category rather than only for opportunities.

### 1.3 Household patterns explain themselves (`opportunity-delivery/framework.ts`)

`withLearningEvidence()` appends **exactly one** evidence entry, sourced `household-learning`, to exactly the opportunities whose rank the household's own Confirmed Understanding actually moved. Its `detail` is EL1's `rationale`, copied verbatim.

This is the one evidence entry OD1 authors, and the module header now says so rather than claiming otherwise. It is justified, not tolerated: **ET6 requires learning to explain itself**, and OD1's own re-weighting is the one influence no producer can ever cite on its behalf. Since `handleReport` drops `bundle.metadata` (§0c), this evidence entry is now the *only* path by which a household can see that its confirmed pattern moved its advice.

What it never does — asserted, not asserted-in-prose:
- It never touches `explanation`, `suggestedAction`, `priority`, `id`, `type` or `domain`.
- It never mutates the input; a non-matching opportunity is returned **by identity**.
- It never authors an opportunity, and never writes a preference (EL2 §8's third gate; NK2 Rule P1 — *"household learning never generates new facts, only re-weights existing ones"*).

### 1.4 Coaching is non-intrusive (`opportunity-delivery/framework.ts`)

Before COACH1, an opportunity that was `delivered` or `acknowledged` was re-delivered on **every single `report`, forever**, until dismissed. With the Silence Rules capping presentation at two, a household that acknowledged advice without resolving it saw that same advice, and only that advice, indefinitely. That is the concrete intrusiveness defect COACH1 fixes.

`prioritiseAndGroup` gains `seen` as its **third** sort key: `priority → learning → seen → arrival`.

- **Below `priority`**, so novelty can never bury a safety-relevant opportunity. An acknowledged `shopping-restriction-conflict` (high) still outranks an unseen `pantry-item-unused-in-plan` (low).
- **Below `learning`**, because *"this household confirmed it does not want this kind of advice"* is a stronger statement than *"this household has not seen this card yet"*.
- **With nothing confirmed and nothing acknowledged** — the state every household starts in — every rank is `0` and the function returns exactly what it returned before COACH1, and before LEARN1.

**"Seen" is `acknowledged`, and deliberately never `delivered`.** `delivered` means the framework placed an opportunity in a bundle; it does not mean a human saw it. `collectOpportunities` returns up to ten, the Silence Rules present two. Treating `delivered` as seen would demote up to eight opportunities the household was never shown, on the strength of a claim the framework cannot support.

The set is never changed — only its order. `mutedOpportunityTypes` and dismissal remain the only mechanisms that can remove an opportunity type, and COACH1 writes neither.

---

## 2. HONEST GAPS — what COACH1 does NOT do, and why

| Gap | Status | Evidence |
|---|---|---|
| **Nutrition gaps** | ❌ **Not built. No target value exists anywhere in THA.** The honest adjacent signal `nutrition-trend` is surfaced instead, and named as a trend. | §0(b) |
| **Evidence Confidence (KNOW5) wired into coaching** | ❌ **Not wired, deliberately.** `shared/knowledge/evidence.ts` gates whether a *health-benefit claim* may render (`established`/`strong`/`emerging`/`under-review`). Coaching emits **no benefit claims** — Rule T1 confines every string to foods, days and list items. Wiring the gate would have required first introducing the health claims it exists to gate. COACH1 instead reuses the *evidence discipline* (Rule E1) and enforces it structurally (§1.2). **EL1's own evidence-derived confidence is consumed**: only a `confirmed` signal carrying a `rationale` may influence anything (ET5 + ET6). |
| **PLAN1's planner evidence trail** | ❌ **Not reusable.** PLAN1's own SUGGESTION 3 states that reusing `MealExplanation.evidence` outside smart-suggest *"requires persisting the evidence trail on the planner entry, which is a new store — governance review required (Rule 8)."* The brief forbids new stores. Planner coaching therefore flows through FI4's existing `planner-empty-day` generator. |
| **A cross-session cooldown / quiet period** | ❌ **Not built.** `opportunity_deliveries.deliveredAt` is stamped once at *first* delivery and never updated (`(userId, opportunityId)` is unique; `insertDelivered` uses `onConflictDoNothing`). There is no last-shown timestamp. The Notice Engine names this and defers it to **NTC-P5**. COACH1's non-intrusiveness is therefore the `acknowledged` signal plus the existing cap — **not a timer**. |
| **"Timely" as scheduling** | ⚠️ **Reinterpreted honestly.** Coaching is recomputed fresh from current state on every request (FI4's "ambient" discipline) and novelty-ordered. There is no scheduler, no background job and no push. Nothing here claims a "just happened" milestone the platform cannot date. |
| **Household patterns for a household that has confirmed nothing** | ⚠️ **Correctly invisible.** A Pattern reaches `confirmed` only via an explicit `approve`. LEARN1 recorded that `LearningSignalsPanel.tsx` is rendered by no page, so today that gate is reachable only through the Companion's conversational path. Until a household confirms something, `withLearningEvidence` correctly attaches nothing. |
| **The three ungoverned bypass channels** | ⚠️ **Untouched, not converged.** `/api/home/intelligence`, `/api/planner/weeks/:weekId/intelligence` and WX7's pantry block surface unprompted content outside the Silence Rules. The Notice Engine calls these *"convergence debt, not defects."* COACH1 neither converges them nor adds to them. |
| **A client consumer for the new route** | ⚠️ **None.** "No UI changes" is a scope constraint of this brief. The route is manually verifiable (§7) and is the sanctioned channel any future surface must use. |
| **Plant diversity is all-time, not weekly** | ⚠️ **Inherited, disclosed.** `assembleNutritionCentre` counts over the household's entire planner history. The notice is phrased as a present-state fact at ×10 multiples only, exactly as the Notice Engine requires — never as *"you just achieved this."* |

---

## 3. ARCHITECTURE COMPLIANCE CHECKLIST

```
□✓ One canonical identity
  Opportunity identity remains `${capabilityId}:${producerOpportunityId}` (OD1, unchanged).
  Notice identity remains `opportunity:${opportunityId}` / the producer's own fixed id.
  Evidence subject remains (domain × subjectType × subjectKey). No new key space.

□✓ One owner per fact
  Proactive selection + volume: notice-engine.ts (applySilenceRules) — the only place.
  Delivery lifecycle: delivery-store.ts. Evidence/patterns: evidence-learning-store.ts.
  Plant diversity: nutrition-centre-assembler.ts — READ, never recounted.
  Opportunity content: FI4's opportunity-engine.ts. COACH1 owns no fact.

□✓ No duplicate entities
  No new entity. A Notice is request-scoped and persisted nowhere.

□✓ No duplicate ownership
  No attribute gains a second owner. OD1 appends ONE evidence entry whose content is
  EL1's rationale, read (not authored) through the Rule EL2 door.

□✓ No duplicate state
  Confirmed Understanding is read per request, never cached or copied. `seen` is derived
  per request from the existing `status` column. Ordering is computed, never stored.

□✓ Extends existing architecture
  Extends the ONE Notice Engine in place (§9's last stop rule), OD1's existing pure-core
  /injectable-I-O split, and the registered `opportunity-delivery` capability. The route
  mirrors /api/home/intelligence's own producer-fetch shape.

□✓ Progressive enrichment where appropriate
  Transactional/behavioural state — no enrichment pipeline applied, correctly. Each of the
  five producer reads degrades independently (Principle 3).

□✓ Honest gaps over fabricated information
  Nutrition gaps: not fabricated (§0b, §2). Unmapped domain: dropped. Uncited opportunity:
  dropped. `centre.overview === null`: silence, not `0`. Unreachable evidence store: no
  learning evidence. Zero notices is a complete, correct answer; the engine never pads.

□✓ No permanent synchronisation bridge
  None. The route funnels five existing owners into one presentation shape — an
  input-funnelling bridge (permitted infrastructure), never a second writable owner.

□✓ Evolution over replacement
  Nothing replaced, nothing retired. The Notice Engine was delivered-but-dormant; COACH1
  wakes it. The three ungoverned bypass routes are pre-existing debt COACH1 does not add to.
```

### AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform      — intelligencePlatform.handle() for opportunities
✓ Uses the Capability Registry                  — `opportunity-delivery`, unchanged
✓ Uses the Intent Engine                        — LOCATE→VALIDATE→PERMISSION→CONFIRM→INVOKE→RESPOND
✓ Reuses existing business services             — FI4, OD1, EL1, nutrition-centre, seasonal, storage
✓ Does not create another assistant             — no assistant; no conversation state touched
✓ Does not duplicate conversation state         — none read or written
✓ Uses registered capabilities only             — `report` (tier `none`, read-only verb)
✓ Uses permission-aware access                  — 401 unauthenticated; every read keyed on req.user.id
✓ Produces honest gaps rather than fabricated knowledge — §0(b), §2, and every degrade path
```

**Notice Engine §9 stop rules — each checked, none tripped:**

| Stop rule | COACH1 |
|---|---|
| Any second ambient-notice channel | ✅ One route; a test asserts `applySilenceRules` has exactly one call site in `routes.ts` |
| Any reasoning inside the engine | ✅ No metric, threshold, cluster, ranking or judgement added. Two drop-filters, both honest no-ops |
| Any rewording of producer content | ✅ `explanation` / `suggestedAction` / evidence details all verbatim; asserted |
| Any notice that executes, or lowers a confirmation tier | ✅ `report` is read-only, tier `none`; the route mutates nothing |
| Any persistence of a notice or a producer's fact | ✅ Persists nothing. OD1's pre-existing first-delivery row is the only write, through its own owner |
| Any preference inferred from a single notice | ✅ COACH1 writes no preference at all |
| Any prompt bytes emitted by the Notice Engine | ✅ None; no LLM is invoked anywhere in COACH1 |
| Any new notice category, or a guessed mapping for an unmapped domain | ✅ Zero new categories; unmapped domains still dropped |
| Any raising of the per-moment cap presented as a fix | ✅ `MAX_NOTICES_PER_MOMENT === 2`, asserted structurally |
| Any second Notice Engine | ✅ The one engine, extended in place |

---

## 4. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Proactive Notice Delivery (Companion Notice Engine);
                 Opportunity Delivery (OD1); Household Evidence & Learning (EL1, read-only)
Declared SoT:    Proactive selection/volume → server/intelligence/conversation/notice-engine.ts
                 opportunity_deliveries      → opportunity-delivery/delivery-store.ts
                 household_learning_signals  → evidence-learning/evidence-learning-store.ts
                 plant diversity (household) → server/lib/nutrition-centre-assembler.ts
New store created? NO — no table, column, index or migration.
Existing store extended? NO — opportunity_deliveries is read and written exactly as before.
Consumer created? YES — GET /api/intelligence/companion/notices, the first runtime consumer
                  of the Notice Engine.
  reads from declared SoT? YES — opportunities via the registered capability (never the
  store); plant diversity via assembleNutritionCentre (never recounted); Confirmed
  Understanding via the Rule EL2 one door (never the evidence tables).
```

---

## 5. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Proactive / ambient notice delivery

Current Canonical Owner:
  server/intelligence/conversation/notice-engine.ts (producers + Silence Rules),
  governed by docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md,
  fed by server/intelligence/opportunity-delivery/framework.ts (OD1) for opportunities.

Current Runtime Consumer(s):
  GET /api/intelligence/companion/notices  (COACH1 — the first, and the only governed one)

Duplicate Owners Remaining:
  THREE pre-existing ungoverned ambient-notice channels, none introduced or extended by
  COACH1, each surfacing unprompted content outside the Silence Rules and OD1's lifecycle:
    1. GET /api/home/intelligence                       (routes.ts — celebration/seasonal/opportunity)
    2. GET /api/planner/weeks/:weekId/intelligence      (routes.ts — same shape, per week)
    3. WX7's pantry opportunity block                   (routes.ts)
  The Notice Engine architecture names these "convergence debt, not defects."

Duplicate State Remaining:
  NONE. Notices are request-scoped and persisted nowhere. `seen` is derived per request
  from the existing `status` column. Confirmed Understanding is read, never cached.

Duplicate Workflows Remaining:
  NONE introduced. The three channels above each re-derive their own selection, which is
  the duplicate-workflow debt COACH1 makes convergeable by giving the governed channel a
  destination for the first time. COACH1 retires none of them.

Current Convergence (%):
  25% — 1 of 4 ambient-notice channels now passes the Silence Rules and OD1 governance
  (the new route). Before COACH1 it was 0% (0 of 3): the governed engine existed with zero
  consumers, while three ungoverned channels served users. Counted by enumerating every
  route/block in server/routes.ts that surfaces an unprompted fact; evidence for the three
  is cited above and independently in THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md §7.
  This number RISES because a governed channel was added, not because debt was hidden:
  the denominator grew by one and so did the numerator.

  Separately, EVIDENCE COVERAGE of coaching is 100%: every opportunity notice that can
  reach a household carries at least one evidence entry, enforced structurally rather than
  by discipline (an uncited opportunity is dropped). Reported separately so coverage is not
  mistaken for convergence.

Target Convergence (%):
  100% — reached when the three ungoverned channels either route through the Notice Engine
  or are retired. Explicitly NOT attempted here: each has a live UI consumer, so converging
  them is UI work, and this brief forbids UI changes.

Next Planned Milestone:
  Converge GET /api/home/intelligence onto the Notice Engine (the largest of the three, and
  the only one whose content already maps 1:1 onto existing notice categories).

Remaining Architectural Risks:
  1. The three ungoverned channels can still contradict the Silence Rules — a household may
     see the same fact twice, once governed and once not, until they converge.
  2. ET3's decay remains lazy (EL2's own named limitation, unchanged): a confirmed
     understanding with no further evidence keeps its last computed stats and keeps
     re-weighting. COACH1 makes this MORE visible, because the rationale is now shown to
     the household rather than hidden in dropped metadata.
  3. `deliveredAt` is first-delivery only, so no cross-session cooldown is possible without
     NTC-P5's delivery log. Non-intrusiveness rests on `acknowledged` + the cap.
```

---

## 6. DEFINITION OF DONE

**What success looks like**
- A signed-in household with an empty planner week receives coaching at `GET /api/intelligence/companion/notices`, capped at two notices, highest priority first.
- Every coaching notice carries at least one evidence entry naming a real owner, and a `source`.
- An acknowledged opportunity sinks within its own priority tier and yields to one never shown — never below a more urgent tier, and never removed from the set.
- A household that has confirmed a Pattern sees that Pattern's own verbatim rationale as evidence on the advice it moved.
- A household that has confirmed nothing, and acknowledged nothing, gets byte-for-byte the ordering it got before COACH1 and before LEARN1.
- No nutrition **gap** is claimed anywhere.

**What must not break**
- Silence stays a first-class outcome: no producer data → no notice → an empty array, never padding.
- The per-moment cap stays 2; the notability gates stay ×7 and ×10.
- No observation is read back (Observation Engine invariant); no behaviour decision is read back (Behaviour Engine invariant).
- `mutedOpportunityTypes` remains the only thing that can remove an opportunity type.
- EL1's thresholds (3 / 0.7 / 90 days) are unchanged.
- Anonymous callers receive 401 and reach no producer.

**Manual test steps** — see §7.

---

## 7. MANUAL VERIFICATION

### Automated (database-free), all green

```
$ npx tsx server/tests/test-coach1-proactive-coaching.ts
COACH1 Proactive Coaching: 71 passed, 0 failed

$ npm run test:intelligence-notice-engine                 → 46 passed, 0 failed  (42 before; +4 COACH1)
$ npm run test:intelligence-opportunity-delivery-binding  → OD1:     50 passed, 0 failed
$ npm run test:learn1-household-learning                  → LEARN1:  72 passed, 0 failed
$ npm run test:intelligence-evidence-learning-binding     → EL1:     59 passed, 0 failed
$ npm run test:intelligence-food-opportunity-binding      → FI4:     40 passed, 0 failed
$ npm run test:intelligence-platform                      → INT1:    33 passed, 0 failed
$ npm run test:intelligence-registry-executability        → INT6A:  124 passed, 0 failed
$ npm run test:intelligence-behaviour-decision            →         115 passed, 0 failed
$ npm run test:intelligence-personality-platform          →         322 passed, 0 failed
```

`npx tsc --noEmit` — **175 errors before COACH1, 175 after.** The one error COACH1 introduced (`centre.overview` is possibly `null`) was **fixed rather than suppressed**, and fixing it surfaced a real honest-gap path: a household with no planner history now yields silence instead of a fabricated `plantDiversity: 0`. The 175 are a pre-existing repository baseline, unrelated to this workstream and not touched by it.

### Live end-to-end run (real database, real Intelligence Platform, real HTTP)

Booted the app on port 5199 (the pre-existing dev server on 5000 was left running and untouched), then:

```
$ curl -s -o /dev/null -w "%{http_code}" localhost:5199/api/intelligence/companion/notices
401                       ← unauthenticated callers reach no producer
```

Then drove the exact chain the route runs, against the live database, for a throwaway user created and **deleted** at the end (verified afterwards: `0` rows in `users` matching `coach1_verify_%`, `0` residual `opportunity_deliveries` rows):

```
created throwaway user id=196
created 6 planner week(s), all days empty

── 1. opportunity-delivery `report` — through the registered capability ──
   status: ok
   opportunities: 7
   trust: {"resolved":true}
   [0] domain=planner priority=high
   [0] explanation: Monday in "Week 6" (Week 6) has no meals planned yet.
   [0] evidence: [{"source":"planner-week","detail":"Week 6 (\"Week 6\") has 7 of 7 day(s) with zero planner entries."}]

── 2. noticeOpportunities — evidence carried into the coaching notice ──
   notices produced: 7

── 3. applySilenceRules — the attention budget ──
   gathered=7  surfaced=2
   [
     { "id": "opportunity:food-intelligence:planner-empty-day:10794",
       "category": "planner-gap", "priority": "high", "source": "opportunity-delivery",
       "fact": { "kind": "opportunity",
                 "explanation": "Monday in \"Week 6\" (Week 6) has no meals planned yet.",
                 "suggestedAction": "Add a meal to Monday in \"Week 6\".",
                 "evidence": [ { "source": "planner-week",
                                 "detail": "Week 6 (\"Week 6\") has 7 of 7 day(s) with zero planner entries." } ] } },
     { "id": "opportunity:food-intelligence:planner-empty-day:10795", ... "Tuesday" ... }
   ]

── 4. Evidence-backed (Rule E1) ──
   every surfaced notice carries evidence : true
   every surfaced notice names its owner  : true

── 5. Non-intrusive: acknowledge the first, then re-report ──
   acknowledge "food-intelligence:planner-empty-day:10794" → ok
   before: ...:10794, :10795, :10796, :10797, :10798, :10799, :10800
   after : ...:10795, :10796, :10797, :10798, :10799, :10800, :10794
   acknowledged id is now at index 6 of 7
   set unchanged (same count): true

cleaned up: deleted throwaway user id=196
```

This exercises, on real data: the registered capability path, FI4's real generator, evidence carried into a real notice, the attention budget capping 7 → 2, Rule E1, and the acknowledged card moving to last **without being removed**.

### The behavioural walk-through

Marked **A** where a database-free assertion in `test-coach1-proactive-coaching.ts` encodes it, **M** where the live run above is the evidence. Every row is one or the other; none is asserted only in prose.

| | Step | Expected |
|---|---|---|
| **M** | Anonymous `GET /api/intelligence/companion/notices` | `401`; no producer is reached |
| **A** | A producer returns nothing | Empty notice set — silence, never padding |
| **M** | Household with 7 empty planner days | 7 opportunities gathered, **2** surfaced, both cited, both `source: opportunity-delivery` |
| **A** | A producer returns an opportunity with no evidence | Dropped. **No citation, no card** |
| **A** | A producer returns an unmapped domain | Dropped, honestly — never guessed into a category |
| **A** + **M** | Acknowledge one opportunity, re-report | It sorts last **within its own tier**; the set is unchanged (7 → 7 live; 3 → 3 in test) |
| **A** | Acknowledge a `high`, leave an unseen `low` | The `high` still leads — novelty never crosses a priority tier |
| **A** | Confirm a negative Pattern for a type | That type sinks **and** carries EL1's verbatim rationale as `household-learning` evidence |
| **A** | Confirm nothing, acknowledge nothing | Ordering byte-for-byte identical to pre-COACH1 (and pre-LEARN1); `withLearningEvidence` returns its input by identity |
| **A** | Evidence store offline | Every opportunity still delivers; no learning evidence attached; nothing claimed as influenced |

The one path neither covers is a *fully populated* five-producer response (a household with health trends, a streak at ×7, plant diversity at ×10, and seasonal data simultaneously). Each producer is independently covered, and the Silence Rules that combine them are covered; the specific combination is not, because manufacturing that household state would have meant writing five owners' data into the live database.

### Structural assertions (§8 of the suite)

- `routes.ts` calls `applySilenceRules` **exactly once** — there is no second ambient-notice channel.
- `routes.ts` imports neither `opportunity-delivery/framework` nor `delivery-store` — opportunities are reached only through the Intent Engine.
- `notice-engine.ts` imports no store, no database and no platform — it remains a pure adapter.
- `STREAK_NOTABLE_MULTIPLE = 7`, `DIVERSITY_NOTABLE_MULTIPLE = 10`, `MAX_NOTICES_PER_MOMENT = 2` — **COACH1 moved no threshold and raised no cap.**
- `framework.ts` contains `source: HOUSEHOLD_LEARNING_EVIDENCE_SOURCE` **exactly once** — one authored evidence entry, in one place.
- `framework.ts` still names neither evidence table and never imports the evidence store — **Rule EL2 intact.**
- `framework.ts` never writes `mutedOpportunityTypes` — **EL2 §8's third gate intact.**

---

## 8. DATA IMPACT

- **Reads existing data:** YES — `opportunity_deliveries`, `household_learning_signals` (via the `search` verb), `user_health_trends`, `user_streaks`, planner/pantry/shopping (via FI4's existing ports), household planner history (via `assembleNutritionCentre`).
- **Writes new data:** NO new data of COACH1's own. The route's `report` call causes OD1's **pre-existing** first-delivery insert into `opportunity_deliveries`, exactly as `report` always did, through its own owner. **No new table, column, index or migration.**
- **Changes meaning of existing data:** NO. `acknowledged` already meant "the household has seen this". COACH1 gives that existing meaning a consequence (ordering) for the first time; it does not redefine it. `delivered` is explicitly *not* reinterpreted as "seen".
- **Requires backfill:** NO — and none is possible or desirable. Ordering is computed per request. Historical `acknowledged` rows are honoured immediately and correctly, because they already mean exactly what COACH1 reads them to mean.

---

## 9. TRUST CHECK

- **Could this mislead the user?** The one real risk is the Rule E1 drop: an uncited opportunity is silently withheld, so a household could in principle be shown fewer opportunities than exist. Three mitigations: FI4's three generators each attach at least one evidence entry, so the drop is unreachable in production; the response reports `trust.gatheredCount` alongside the capped `notices`, making the silence auditable rather than indistinguishable from having nothing to say; and the alternative — surfacing an uncited claim — is the failure this platform's trust rules exist to prevent.
- **Could this fabricate certainty?** No, and §0(b) is the section this question exists for. The brief asked for nutrition gaps; no reference intake, RDA or target is stored anywhere in THA; a gap card would have invented the target it measured against. It is **not built**, the absence is evidenced with the searches that prove it, and the honest adjacent signal is surfaced under its true name. No confidence score, no ML, no LLM, and no threshold is introduced by COACH1 anywhere.
- **Is anything guessed but shown as real?** No. Unmapped domain → dropped. Uncited opportunity → dropped. `centre.overview === null` → silence, not `0`. Unreachable evidence store → no learning evidence, and nothing claimed as influenced. Plant diversity is all-time and phrased as present state, never as "you just achieved this". `delivered` is never silently recast as "seen".
- **What happens if the system is wrong?** The blast radius is ordering and volume, never content or state. A wrongly-ranked opportunity appears lower **within its own priority tier** — an urgent safety notice can never be buried. A wrong Confirmed Understanding cannot reach the consumer without the household's own explicit `approve` at the strong confirmation tier, and now it must show that household the rationale it is acting on. Nothing is executed, nothing is written to any business domain, no preference is changed, and no notice is persisted.
- **No architectural duplication introduced:** YES (none introduced; three pre-existing bypasses named, not extended).
- **No new source of truth created:** YES.
- **No runtime behaviour altered when nothing is confirmed and nothing acknowledged:** YES — asserted directly; `prioritiseAndGroup` with empty `understanding` and empty `seen` is byte-for-byte its pre-COACH1 self, and `withLearningEvidence` returns its input **by identity**.

---

## 10. ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback identifier | `rollback/before-coach1-proactive-coaching-20260709` → `f0ab371` |
| Dirty-tree snapshot | stash `COACH1_ROLLBACK: pre-implementation dirty-tree snapshot 2026-07-09` → `cf31264` |

**Files modified**
- `server/intelligence/opportunity-delivery/framework.ts` — `matchConfirmedUnderstanding`, `withLearningEvidence`, `seenOpportunityIds`, `ACKNOWLEDGED_STATUS`, `HOUSEHOLD_LEARNING_EVIDENCE_SOURCE`, the `seen` sort key, and the header's honest statement of the one authored evidence entry
- `server/intelligence/conversation/notice-engine.ts` — `NoticeEvidence`, `Notice.source`, `NOTICE_SOURCE`, evidence carried on the opportunity fact, Rule E1 drop
- `server/routes.ts` — the `GET /api/intelligence/companion/notices` route + its import block
- `server/tests/test-intelligence-notice-engine.ts` — literals updated for the new required fields; 4 COACH1 assertions added
- `package.json` — registers `test:coach1-proactive-coaching` and adds it to the aggregate `test` script

**Files added**
- `server/tests/test-coach1-proactive-coaching.ts`
- `docs/implementation/intelligence/COACH1_PROACTIVE_COACHING.md`

**Rollback commands — restore from the SNAPSHOT, never from the tag.**

> ⚠️ **Do not `git checkout rollback/before-coach1-proactive-coaching-20260709 -- <file>` for these five files.** Three of them (`framework.ts`, `routes.ts`, `package.json`) carried **uncommitted** COMP2 / KNOW4 / KNOW5 / **LEARN1** / PLAN1 work before COACH1 began. LEARN1 in particular exists *only* in the working tree — verified: `git show HEAD:server/intelligence/opportunity-delivery/framework.ts | grep -c learningRankFor` → `0`. Checking those files out from the tag would silently delete LEARN1.
>
> `cf31264` is the exact pre-COACH1 working tree: LEARN1 present, COACH1 absent (verified — it contains `learningRankFor` ×3 and `withLearningEvidence` ×0). Restore from it.

```bash
git checkout cf31264 -- \
  server/intelligence/opportunity-delivery/framework.ts \
  server/intelligence/conversation/notice-engine.ts \
  server/routes.ts \
  server/tests/test-intelligence-notice-engine.ts \
  package.json
rm -f server/tests/test-coach1-proactive-coaching.ts \
      docs/implementation/intelligence/COACH1_PROACTIVE_COACHING.md
```

| File | State at `f0ab371` (the tag) | Correct rollback source |
|---|---|---|
| `opportunity-delivery/framework.ts` | **Dirty** — LEARN1 uncommitted | `cf31264` |
| `server/routes.ts` | **Dirty** | `cf31264` |
| `package.json` | **Dirty** | `cf31264` |
| `conversation/notice-engine.ts` | Clean | `cf31264` (identical to tag) |
| `test-intelligence-notice-engine.ts` | Clean | `cf31264` (identical to tag) |

**Data rollback:** none required. **No migration was created, so none must be reversed.** Any `opportunity_deliveries` rows written are OD1's ordinary first-delivery records, valid and meaningful with COACH1 removed. No evidence row, preference or notice was written by COACH1.

**Verification after rollback**
```bash
npx tsc --noEmit                                        # 175 errors (the pre-existing baseline)
npm run test:intelligence-notice-engine                 # 42 passed, 0 failed
npm run test:intelligence-opportunity-delivery-binding  # 50 passed, 0 failed
npm run test:learn1-household-learning                  # 72 passed, 0 failed
```

**Kill switch without rollback:** stop calling the route. It has no client consumer, no background job and no scheduler, so with nothing calling it the platform is exactly as it was — the Notice Engine returns to dormancy. The ordering change survives (it is inside `report`), and is neutralised for any household that has acknowledged nothing.

---

## 11. SCOPE LOCK

**Implemented scope**
- `GET /api/intelligence/companion/notices` — the one governed proactive channel, composing five existing owners through the existing Silence Rules.
- Evidence carried verbatim into every coaching notice, and Rule E1 (*no citation, no card*) made structural at the coaching boundary.
- `Notice.source` — provenance for every notice category, not just opportunities.
- Household-pattern explainability: EL1's verbatim `rationale` attached, as one named evidence entry, to exactly the advice a household's own Confirmed Understanding moved.
- Non-intrusive delivery: an acknowledged opportunity yields to an unseen one, below priority and below learning, never crossing a tier and never leaving the set.
- 71 database-free assertions, including structural enforcement of the Notice Engine's §9 stop rules, Rule EL2, and every untouched threshold.
- This document.

**Explicitly excluded (honest gaps, not oversights)**
- **Any nutrition-gap claim.** No target value exists in THA (§0b). Not built, not proxied, not inferred.
- **Any new opportunity generator**, including a plant-diversity counter — Plant Diversity is a contested domain and a third counter would move convergence backwards. Its existing owner is read instead.
- **Any UI change**, including a client consumer for the new route, and including rendering `LearningSignalsPanel` (LEARN1's own excluded scope).
- **Any new capability, verb, table, column, migration, threshold, scheduler, background job or push notification.**
- **Any convergence of the three ungoverned bypass channels** — each has a live UI consumer, so converging them is UI work.
- **Any cross-session cooldown / quiet period** — impossible without NTC-P5's delivery log.
- **Any write to a household preference**, including `mutedOpportunityTypes`.
- **Any use of the Observation Engine or Behaviour Engine for learning or selection** — both forbid it by name; neither file was touched.
- **Any LLM call.** COACH1 invokes no model.

**Suggestions (do not implement without approval)**
1. **Surface `bundle.metadata` from `handleReport`.** It currently drops LEARN1's `metadata.learning` audit record, so `influenced` reaches no consumer. COACH1 worked around this by attaching the rationale to `evidence`; the metadata itself is still invisible, and it is the auditable half.
2. **Converge `/api/home/intelligence` onto the Notice Engine.** The largest ungoverned channel, and the only one whose content already maps 1:1 onto existing notice categories. This is the single highest-value follow-up, and it is UI work.
3. **NTC-P5's delivery log**, enabling a real cross-session cooldown. COACH1 is the first workstream with a live proactive channel, so it is the first that can actually observe repeat fatigue.
4. **A weekly plant-diversity count.** The "30 plants a week" idea has no server-side weekly counter — `assembleNutritionCentre` is all-time and `PlantDiversityReport.tsx` computes the weekly figure in the browser. Resolving the contested domain (retire the client counter, read `diversity_group`) would make a genuinely weekly diversity notice possible.
5. **A meal-outcome event** ("we cooked this / we didn't"), still the highest-value new observation, still one column and one action. LEARN1 named it; it remains unbuilt, and it is what would let coaching learn from meals rather than only from advice.

---

*Implementation record for `COACH1 — Proactive Coaching`. Governed by `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (§6 Silence Rules, §7 the honest baseline, §9 the ten stop rules), `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (Rule FI1, Rule E1, Rule T1), `EL2_...md` (Rule EL2, ET5, ET6), and `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 3, 6, 7, 8).*
*Rollback: `rollback/before-coach1-proactive-coaching-20260709` → `f0ab371`.*
