# PRESENCE2 — Companion Presence Activation

**Type:** Presence programme. Implementation record.
**Date:** 2026-07-20
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/presence2-companion-presence-activation` → `5320c2d1dd06a06229b744a99417c1df0d602177`
**Governed by:** `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (the Experience Constitution), and through it the Experience Governance canon.
**Written against:** `docs/implementation/experience/PRESENCE1_HOUSEHOLD_PRESENCE.md` § 8, decisions 2 and 5.

---

## 1. What this is

`PRESENCE1` ended on an admission:

> The house has been made quieter on the promise that the one voice will speak.
> **If the Companion stays silent, this programme has removed advice and replaced
> it with nothing.**

This programme makes the voice speak. It is the keystone `PRESENCE1` § 8 named,
and it closes that document's decision 2 (*where should the noticing be spoken?*)
and decision 5 (*the Companion has still never introduced itself*).

It creates **no second assistant, no second conversational surface, no duplicate
AI capability, no new room, no new route, no new entity, no permission change and
no schema change.** No business logic changed. No canonical ownership moved. No
notification is pushed to anybody.

The Companion already existed. This gives it a presence.

The governing principle, applied literally:

> **The rooms observe. The Companion understands. The household decides.**

---

## 2. The Experience Constitution Check (§ 18.2), answered before design

**✓ HOSPITALITY (§ 3.1).** The one place hospitality and efficiency competed was
the first meeting: the empty Companion panel could have opened with quick actions
(efficient) or with an account of why the thing exists (hospitable). It opens with
the account, and asks for nothing.

**✓ OUTCOME (§ 3.5).** Principally **3 — less guilt** (the last two scoring
surfaces in the platform are gone), and secondarily **2 — the sense that somebody
is paying attention**, which is this programme's whole subject.

**✓ WEIGHT (GEA2).** No room got heavier — **no room was touched at all.** Every
change is inside the Companion panel, which a household opens deliberately, or on
the server behind it. Net notice categories: **10 → 9.**

**✓ VOICE (GEA8/GEA9).** The spine. The Companion becomes the sole owner of
interpretation, encouragement, observation, coaching, reminders and reassurance —
and, critically, the sole owner is now held *to the same standard it was given
them under*. See § 3.

**✓ RESTRAINT (§ 9 / § 13 / § 15).** Nothing scores, streaks, ranks or rewards
after this change — including the Companion. The attention budget was **not
raised**: a new category was added and `MAX_NOTICES_PER_MOMENT` is still 2. An
observation is always `low` priority and can never displace a safety signal.

**✓ LAYER (GEA20).** Every change sits at **Implementation**. It originates no
law and amends no governing document. It realises GEA8, GEA9, GEA13, GEA15 and
GEA16, each already owned above it.

---

## 3. The finding

`PRESENCE1` removed nineteen judgement surfaces from eight rooms, on the
principle that rooms report and the Companion interprets. The audit behind this
programme asked the obvious next question — *and what does the Companion say?* —
and found the answer uncomfortable.

> **The last two scoring surfaces in The Healthy Apples were the Companion's own.**

| | Judgement | Where | Rule it broke |
|---|---|---|---|
| 20 | `noticeStreak` — a notice on every 7th day of `currentEliteStreak` | Companion Notice Engine | GEA13 |
| 21 | `noticeDiversity` — a notice on every 10th plant | Companion Notice Engine | GEA13 |

Both were voiced through `buildCelebration`, so what a household actually read,
in the coach voice, was:

> *"Target hit — a 7-day **elite** streak."*

GEA13 forbids, in one sentence, *"streaks and consecutive-day counts"*,
*"tiers or ranks"*, and *"celebration effects for ordinary use"*. This notice was
all three at once. The rooms were made quiet so that one trustworthy voice could
speak — and that voice was congratulating families for a round number.

### 3.1 And the noticing THA already did was being thrown away

The second finding is the one this programme is built on, and it is a defect of
plumbing rather than of principle.

`server/lib/household-companion-fields.ts` derives, from a household's own eating
history, exactly the sentences `PRESENCE1` § 6 identified as the raw material of
the Presence Layer:

> *"Lentils quietly appeared in more and more meals."*
> *"Friday became pizza night."*
> *"This spring you discovered artichokes."*

These are date-gated, trust-gated, non-fabricating, and **already computed on
every Home load and every Planner load**, and shipped over the wire by both
routes. `UX3` then removed the grid that rendered them — correctly, because a
room may not speak about a household in that register (GEA8) — and gave them to
**nobody**.

So for months THA has been deriving true observations about how a family eats,
serialising them, and discarding them at the client. `PlannerIntelligenceStrip`
still declares `celebration` and `householdInsight` in its props type; it renders
neither.

This is the same shape as the defect `PHASE5E` found (a notice route the client
fetched at the wrong URL, 404ing silently for months): **the intelligence was
never missing. The reader was.**

### 3.2 And the emblem was making a promise the panel could not keep

The Companion's `aware` state — the quiet light on the emblem, in every room — is
set from `notices.length > 0`, unconditionally.

The notices list rendered **only in the `!hasHistory` branch** of the panel.

So the moment a household sent a single message — ever — the Companion went on
lighting up to say it was holding something, and opening it showed them their old
conversation instead. For every household that had ever spoken to it, `aware` was
a light on in an empty room.

---

## 4. What changed

### 4.1 The Companion stops scoring the household

`server/intelligence/conversation/notice-engine.ts`,
`server/intelligence/conversation/behaviour-engine.ts`, `server/routes.ts`

**Retired:** `noticeStreak`, `noticeDiversity`, the `streak-milestone` and
`diversity-milestone` categories, the `streak` and `diversity` fact kinds, both
gather steps in the notices route, and both `buildCelebration` call sites.

Retired, not disabled — the producers are deleted from the closed taxonomy, so a
future caller cannot reintroduce the notice by constructing the object by hand.

**Both underlying owners are untouched.** `user_streaks` still exists and keeps
its other consumers; the nutrition centre's `plantDiversity` count is unchanged
and is still the canonical all-time figure. Only these *consumers* were removed —
exactly the discipline `PRESENCE1` used on `WEEKLY_PLANT_TARGET`.

`buildCelebration` now has **no production caller**, deliberately and visibly. It
is kept rather than deleted (owner decision 2) and the orphaning is asserted by a
test, so it cannot be quietly rewired.

### 4.2 The Companion notices the household — from intelligence that already existed

`notice-engine.ts` gains one producer, `noticeHouseholdStory`, which is a **pure
pass-through of the same shape as `noticeSeasonal`**: the caller derives the
headline, the engine only shapes it. It counts nothing, ranks nothing, dates
nothing and concludes nothing.

The route reads `deriveHouseholdCompanionFields(history)` — **the existing
derivation, already imported in that file, over a `HouseholdHistory` the route was
already building.** No engine was created. No observation logic was duplicated. No
threshold was invented.

Three things converge in that one call:

1. The two scoring gathers are gone (§ 4.1).
2. **A third copy of the seasonal derivation is retired.** The route had
   re-implemented `deriveHouseholdCompanionFields`'s `looking_ahead ?? discoveries`
   selection byte-for-byte. `PHASE5B` exists *because* two routes each carried
   that copy; this route had quietly become the third (Principle 2).
3. The household observations finally reach a reader.

**The observation is voiced verbatim.** It takes no guidance prefix and no
per-personality rewording — all six voices say it identically. This is the one
notice kind for which that is true, and the asymmetry is deliberate: a streak was
a THA opinion and therefore the voice's to colour; an observation is the
household's own fact, and a headline six voices could each re-word is a headline
six voices could each get wrong. The test that used to assert *"at least two
personalities voice the same streak fact differently"* now asserts the exact
inverse.

It is always `low` priority, so it can never displace a safety signal or an
actionable gap from the two-notice budget.

**Observation before recommendation** falls out of the architecture rather than
being asserted: `orderByAttention` ranks actionable opportunities above `low`
observations, but the Companion's *content* is now weighted toward the factual —
the platform gained an observing producer and lost two judging ones.

### 4.3 The Companion introduces itself

`personality-registry.ts` gains an `introduction` on all six voices;
`behaviour-engine.ts` gains `buildIntroduction`; the experience payload carries
it; `FloatingAssistant.tsx` renders it.

The empty-state slot is reached **only when the household has never spoken to the
Companion** — so it is the first meeting, and it was showing them
`experience.greeting`, which in four of the six voices is the *returning* line:

> *"Welcome back — how can I help today?"*

A thing that had never said a word was greeting them as an old acquaintance. The
swap is a correction, not a preference.

The introduction says why the Companion exists and what it will and will not do.
It **claims nothing about this household** — it cannot, being a static registry
string, and a static string that reads as personal knowledge is precisely the
fabrication GEA9 describes as having a long fuse. It **asks for nothing at all.**

Everything personal on that screen arrives from the Notice Engine, above it,
derived at the moment it is shown. **That ordering is the design:** THA says what
it is for, demonstrates it with something true about this family, and only then
invites a question.

### 4.4 The `aware` promise is made keepable

The notices list is hoisted out of the empty-state branch and above the
thread/empty-state boundary, so it renders in **both** states. It is placed above
the thread rather than inside it because a notice is not a turn — nobody said it
to anybody, and threading it would make the Companion appear to have spoken
unprompted.

It remains absent in silence, with no empty state of its own.

### 4.5 The Companion can explain why it noticed something

Each notice carries a quiet **"Why?"**, per GEA16: the reasoning is available
*on request*, in the Companion's voice, and is never narrated unasked.

It creates no surface and no capability. Pressing it sends an **ordinary user
turn** down the one conversation channel — the same path `handleQuickAction` and
`PHASE5E`'s "Why this?" already use — which the gateway grounds from the same
owners the notice came from. There is no second response path and no privileged
answer, which is precisely why the answer can be trusted.

The notice's `fact` has been carried alongside its sentence since `PHASE5E`, whose
comment states the reason exactly: *"if a surface ever needs to show why, the
evidence is right here."* This is that surface.

---

## 5. Architecture Compliance

| Requirement | Result |
|---|---|
| **One Companion** | Yes. `FloatingAssistant` remains the only assistant surface; one open state, one channel, one panel. Nothing was added beside it. |
| **One coaching owner** | Yes. The Companion. No room gained a voice; two of the Companion's own judging voices were removed. |
| **One observation owner** | Yes. The Story Engine (`shared/stories/engine.ts`) via `deriveHouseholdCompanionFields`. **A second observation path was available and refused** — the route could have called `stories()` itself, which would have created a private ranking beside PHASE5B's. |
| **One interpretation owner** | Yes. `phraseNotice` remains the single voice seam; PRESENCE2 removed two branches from it and added one. |
| **No duplicated intelligence** | Yes — and a duplicate was *retired*: the route's third private copy of the seasonal selection. |
| **Existing Intelligence Platform reused** | Yes. Story Engine, Seasonal Engine, Discovery Engine, Notice Engine, Behaviour Engine, Personality Registry, Silence Rules, Attention/Decision mechanics — all consumed unmodified. Opportunity and learning notices still go through `intelligencePlatform.handle` on the registered capability path. |
| **Capability Registry extended where necessary** | **It was not necessary, and it was not extended.** The Companion reaches the Story Engine through the same route-derives/engine-shapes seam `seasonal-highlight` has always used. Registering a capability for it would have created a second owner of a derivation `household-companion-fields.ts` already owns. |
| **Permission-aware behaviour preserved** | Yes. The notices route is `req.isAuthenticated()`-gated and every gather is scoped to `userId` / `getHouseholdForUser`. No authorisation logic was read, written or bypassed; `server/lib/access.ts` remains the sole authority. |
| **No second assistant / conversation state** | Yes. No new state, no new store, no new table, no new column. |
| **Honest gaps over fabricated knowledge** | Yes — see § 6. |

---

## 6. Nothing here is invented

Stated explicitly, because this programme's subject is THA claiming to have
noticed things.

- **Every observation is the Story Engine's own sentence**, crossing the voice
  seam verbatim. Nothing is composed, paraphrased or padded.
- **The Story Engine refuses to date what it cannot date.** Undated planner
  entries produce no stories at all (WS10's date gate, `CONV1 BEH-5`, guarded by
  `publication-register.ts`). **192 of THA's 195 households have no week anchor
  and never will**, so for almost every household this producer returns silence,
  permanently. That is the honest answer, and it is reported here rather than
  papered over: most households will meet a Companion that introduces itself and
  then has nothing to show them yet.
- **The trust ban list applies before this programme sees a sentence** —
  gamification, deficit framing, decline comparison, health verdicts and
  surveillance language are dropped by `shared/stories/trust.ts`, headline and
  facts alike.
- **Silence is a first-class outcome at four separate points**: a null headline,
  an empty history, an unanchored planner, and the Silence Rules' cap. The
  Companion's introduction is the only thing on that screen guaranteed to appear,
  and it claims nothing.
- **The introduction is static and says so.** It contains no name, no count, no
  "I've noticed".

---

## 7. Verification

### 7.1 Gates

| Gate | Result |
|---|---|
| `tsc --noEmit` | **88 errors — identical to the pre-change baseline**, all pre-existing, all in `server/`. This programme adds **zero**. |
| `npm run build` | **PASS** — 3291 modules transformed, client bundle clean. |
| `npm run adoption:check` | **99 passed · 1 notice · 9 failed — identical to baseline**, verified by stashing the change and re-running. |
| `npm run verify:coherence` | **2 failed — both pre-existing**, verified by stash; both in `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, unrelated. |
| `verify-product-inventory` | **0 failures, bijection TOTAL** (baseline: 0 failures, 40 warnings → now 33). |
| `test-intelligence-notice-engine` | 75 passed, 0 failed |
| `test-coach1-proactive-coaching` | 70 passed, 0 failed |
| `test-dec1-decision-engine` | 49 passed, 0 failed |
| `test-intelligence-personality-platform` | 323 passed, 0 failed |
| `test-intelligence-behaviour-decision` | 119 passed, 0 failed |
| `test-intelligence-conversation-gateway` | 64 passed, 0 failed |
| `test-comp2-natural-conversation` | 210 passed, 0 failed |
| `test-intelligence-companion-guidance` | 74 passed, 0 failed |
| `test-prod3-companion-restriction-safety` | 36 passed, 0 failed |
| `test-comp-act1-companion-actions` | 22 passed, 0 failed |
| `test-attn1-attention-platform` | 29 passed, 0 failed |
| `test-stories-engine` / `test-seasonal-stories-engine` | PASS — all worked examples, gates and trust checks |

### 7.2 The four tests that had to be inverted

Four assertions guarded behaviour this programme removes. **None was deleted; each
was inverted to assert the retirement**, so the removal cannot be undone silently:

| Was | Now |
|---|---|
| *"the streak notability gate is still 7"* | *"the streak notability gate is GONE — the producer is retired (GEA13)"* |
| *"the diversity notability gate is still 10"* | *"…is GONE — the producer is retired (GEA13)"* |
| *"buildCelebration is reached THROUGH phraseNotice"* | *"buildCelebration is reached by NO notice — THA celebrates no household for ordinary use"* |
| *"at least two personalities voice the same streak fact differently"* | *"all six personalities voice an observation IDENTICALLY — voice may not vary a fact"* |

A new assertion was added that `noticeStreak` and `noticeDiversity` no longer
exist as exports at all.

### 7.3 Product Knowledge Registry (Rule KC15)

Eight entries created, retired or corrected in this change. Three were corrections
of **staleness that predates this programme**, found because the work ran through
them — the exact KC14 defect the architecture names for a self-describing domain:

- **`ntf-household-story`** — created.
- **`ntf-streak-milestone`, `ntf-diversity-milestone`** — retired, with the rule
  and the reasoning recorded.
- **`hid-notice-engine`** — was titled *"Companion Notice Engine (built,
  unreachable)"* and described a 404 that `PHASE5E` had already fixed. Every
  substantive claim in it was false: unreachable (no), seven categories (nine),
  *"the whole reason Home has a Reminders section"* (`UX3` removed that section).
  Corrected, with the correction itself recorded.
- **Five notification entries** — each still carried a *"Why it cannot reach a
  household"* section describing the same fixed 404. Corrected to *"How it reaches
  a household"*, and moved `hidden` → `live`.
- **`fnd-dead-reminders`** — closed on `page-home`, where the prose already
  recorded it as fixed while the inventory still listed it as an open defect.

### 7.4 What verification could NOT establish

Stated plainly, because this programme's subject is a feeling and no gate measures
one.

- **Nothing here was seen rendered.** No screenshots. Every claim about how the
  panel now feels is reasoned from the code.
- **The "Why?" answer is not deterministic.** It is composed by the model from
  grounded context at the moment it is asked. The *grounding* is guaranteed (the
  gateway's hard rules, the notice's owners re-read server-side); the *sentence* is
  not, and no test asserts its content.
- **The introduction repeats.** With no persisted "has been introduced" flag —
  deliberately, since that would be a schema change this brief forbids — a
  household who has never spoken to the Companion sees the introduction every time
  they open it. Honest and idempotent, but not ideal. Owner decision 3.
- **Mobile and dark mode are unverified**, as in `PRESENCE1`.
- **For most households this will look like nothing changed**, because the
  observation producer is silent without a week anchor (§ 6). The introduction
  will appear; the noticing usually will not.

### 7.5 Manual verification, against the brief's list

| Check | Result |
|---|---|
| Home reports rather than coaches | **Yes** — unchanged by this programme; `PRESENCE1` did it and it holds. |
| Companion naturally introduces itself | **Yes** — § 4.3. |
| Companion can explain why it noticed something | **Yes** — § 4.5, on request only. |
| Companion never invents observations | **Yes** — § 6, four independent silence paths. |
| Companion remains silent when there is nothing to say | **Yes** — and usually will (§ 6). |
| Planner no longer contains coaching | **Yes** — verified; `PRESENCE1`'s removal holds, comments in place. |
| Nutrition no longer grades the household | **Yes** — verified; `PlantDiversityReport` still imports no target. |
| Feels like somebody who has quietly been paying attention | **Not establishable by gate.** What *is* established: the Companion now says why it exists, shows something true about this family when it has one, can be asked how it knows, and no longer congratulates anybody for a number. |

---

## 8. Remaining owner decisions

### Decision 1 — `PRESENCE1`'s decision 2 is now closed; its decision 1 is not

This programme implemented **option (a)** — the Companion, and only the Companion.
`PRESENCE1` recommended it and GEA8 requires it. **No owner ruling is needed to
ratify this; it is recorded as done.**

`PRESENCE1`'s **decision 1 (the Cookbook's five hundred generated rice bowls)
remains open and untouched**, and is now the highest-value open item in the
Presence Layer.

### Decision 2 — `buildCelebration` and the `celebrations` field

Orphaned by this change, deliberately not deleted (§ 4.1), asserted orphaned by a
test. Its removal would retire a field on all six personalities.

**Owner decision:** delete it, or keep it for a future occasion that is genuinely
an occasion. The note in the code states the test to apply — *a household reaching
a number is not an occasion; a household telling THA something about themselves
might be.*

### Decision 3 — Should the introduction happen once?

It currently shows whenever the household has no conversation history (§ 7.4). A
true once-only introduction needs persisted state, which this brief excluded.

**Owner decision:** accept the repeat, or approve a `hasMetCompanion` fact on an
existing owner in a later workstream.

### Decision 4 — `experience.greeting` is now rendered nowhere

The introduction replaced it in the only slot that rendered it. `buildGreeting`
and the `greetings` array on all six voices are now unreached — the same shape of
orphan as decision 2, and created by the same change.

**Owner decision:** retire the greeting, or give it a slot (a returning household
with an empty thread has no distinguishable state today, which is *why* it has no
slot).

### Decision 5 — The seasonal notice widened slightly

Converging the route onto `deriveHouseholdCompanionFields` (§ 4.2) means the
seasonal notice now inherits that function's `discover()` fallback — *"X is at its
best right now."* — which the route's private copy did not have. So a few
households will see a seasonal notice where they previously saw none.

This is a **behaviour change, made deliberately as the price of removing a
duplicate owner**, and it is not a fabrication: the fallback is a real engine's
real output, and it is the same sentence Home already shows. Recorded here rather
than left to be discovered.

**Owner decision:** accept, or ask for the notice route to opt out of the fallback.

### Decision 6 — Four notice categories still have no household reader

`cookbook-opportunity`, `nutrition-opportunity` and `household-learning` are live
in the engine and reachable in principle. They were not audited by this programme.

**Owner decision:** whether a `PRESENCE3` should walk the remaining categories the
way this one walked the milestones.

---

## 9. Rollback

```
rollback/presence2-companion-presence-activation → 5320c2d1dd06a06229b744a99417c1df0d602177
```

**The working tree was NOT clean at tag time.** The tag does not cover
`.engineering/session/CURRENT.md`, which was modified (the session dashboard's
automated heartbeat line). No other uncommitted work existed.

Rolling back returns committed state only. Nothing was deleted from disk: two
producers were removed as source and are recoverable from history;
`buildCelebration` and `buildGreeting` are intact and recorded.

---

*PRESENCE2 removed the last two scoring surfaces in The Healthy Apples — both of
them the Companion's own — gave the Companion an introduction that asks for
nothing, and connected it to observations THA had been deriving and discarding for
months. It created no engine, no capability, no route and no state. The Companion
is now the single voice that interprets, and it has been held to the standard the
rooms were made quiet for.*
