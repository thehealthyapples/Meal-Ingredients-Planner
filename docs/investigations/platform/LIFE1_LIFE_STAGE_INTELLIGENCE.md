# LIFE1 — Life Stage Intelligence

## Whether THA can know who it is feeding, and what it may do with the answer

**Status:** INVESTIGATION — point-in-time analysis. **Not governing.** History the moment it is written (`docs/architecture/README.md`; PKR1 § 4.4).
**Date:** 2026-07-16
**Workstream:** `LIFE1_Life_Stage_Intelligence`
**Rollback:** `rollback/LIFE1-7d1dd2ce-20260716` → `7d1dd2ce`
**Built on:** [`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`](../../architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md) (TIME3, governing), with [`TIME1`](./TIME1_HOUSEHOLD_TIME_FOUNDATION.md) and [`TIME2`](./TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md) read as history.
**Scope:** Investigation only. **Nothing implemented. No code, no schema, no migration, no architecture modified.**

---

## 1. THE HEADLINE FINDING

> **THA does not know how old anyone is. It has never known. There is no date of birth, no age, no age band and no life-stage field anywhere in ~90 tables — and in the single place the platform needs an age, it asserts that everyone is thirty.**

`server/routes.ts:568`:

```js
const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 - 78;
```

This is Mifflin–St Jeor — `BMR = 10·weight + 6.25·height − 5·age + s`, where `s` is `+5` for men and `−161` for women. So:

- **`- 5 * 30`** — **age is hardcoded to 30** for every human being who uses THA.
- **`- 78`** — the sex constant is the **arithmetic midpoint of the two real constants** (`(5 + −161) / 2 = −78`), a sex nobody is.

Neither constant is named, commented, or explained. The result flows to `calculatedCalories` (`:573`), to `dailyCalories` (`:579-581`), into the profile's `health` block (`:600-608`), and out to the Companion. **A nineteen-year-old and a sixty-eight-year-old with identical height and weight receive byte-identical calorie targets, presented as personalised.**

**This inverts TIME1's finding rather than repeating it.** Household Time was a *convergence*: THA already told the time six times, in six private definitions, owned by nobody. **Life Stage has nothing to converge.** There is no duplication, because there is no knowledge. There is one guess, in one line, and it is silent.

> **TIME1: THA does not lack time — it answers the time six times and nobody owns the answer.**
> **LIFE1: THA does not know age at all — and answers it once, with a constant.**

**So Life Stage's first act, like Household Time's, is a deletion — but for the opposite reason.** Household Time deletes duplicates. Life Stage deletes a **fabrication**.

---

## 2. THE MISSION'S FRAMING, TESTED FIRST

The mission asks for *"Life Stage Intelligence as a **platform capability**."* Following `HOME1` and `NORTH2` — a hypothesis is tested, never ratified — the framing is examined before it is built on.

**Verdict: Life Stage is not a capability. It is a vocabulary.**

TIME1 § 12.2 settled this exact question for time, and the reasoning transfers without modification:

> *"**Time is not its own capability** — time alone answers no household question."*

**Life stage alone answers no household question either.** No household opens THA to ask what life stage their child is in. They know. Life stage is never the *answer*; it is a **qualifier on other answers** — which foods are unsafe, which portions make sense, how the Companion should speak. Registering it in the Capability Registry with its own intents would create a capability nobody can invoke and no intent can route to.

**The correct class is the one Household Time occupies**, which the Source of Truth Register's Appendix A already records twice, for ATTN1 and DEC1, under **Principle 5** — *reference vocabularies stay beside the spine*:

| Precedent | Owns | Data owned |
|---|---|---|
| `shared/attention/index.ts` (ATTN1) | The attention vocabulary | **None** |
| `shared/attention/decision.ts` (DEC1) | The decision mechanics | **None** |
| `shared/time/household-time.ts` (TIME3) | The time vocabulary | **None** |
| **`shared/life-stage/life-stage.ts` (proposed)** | **The life-stage vocabulary** | **None** |

Life stage is the archetypal cross-entity qualifier: the Cookbook, the Planner, the restriction gate, the Companion and Food Intelligence all have a claim on it, and **none of them may own it**.

> **The mission's own noun is the first thing this investigation declines.** *Capability* would put life stage in the Intelligence Platform, where it would need an intent, a Context View and a mouth. It needs none of those. It needs to be **a pure function nobody notices**.

---

## 3. THE AGE AUDIT — WHAT THA ACTUALLY KNOWS

Every place in the platform that touches age, life stage, or the child/adult distinction. **This is the complete list.**

| # | Signal | Where | What it actually is | Verdict |
|---|---|---|---|---|
| 1 | **Hardcoded age `30`** | `server/routes.ts:568` | An invented constant inside a personalised number | 🔴 **Fabrication** |
| 2 | **`adultsCount` / `childrenCount` / `babiesCount`** | `shared/schema.ts:667-669` | Household composition stored **per user** | 🔴 **Wrong scope** (§ 5) |
| 3 | **`kind: "user" \| "child"`** | `shared/household-eater.ts:107` | *Has no account* — wearing the name *child* | 🔴 **False proxy** (§ 6) |
| 4 | **`audience: "adult" \| "baby" \| "child"`** | `shared/schema.ts:524` | A label on a **planner slot**, not a person | 🟡 Honest, unrelated |
| 5 | **Honey / infant botulism** | `shared/restrictions/restriction-library.ts:1166-1175` | A **code comment**. No gate | 🔴 **Unenforced rule** (§ 7) |
| 6 | **Liver / pregnancy** | `shared/knowledge/composition-sources.ts:101`, `:158` | Prose inside a **citation title string** | 🟡 Dead text |
| 7 | **`ageYears`** | `server/benchmark/world-fixtures.ts:64` | A **test fixture field**, dropped before the database | 🟡 Unreachable |

**Item 7 deserves a sentence, because it is the platform's own confession.** `world-fixtures.ts:64` declares `ageYears?: number`; the benchmark world gives Oliver 10 and Amelia 7. The seeder never writes it — `createHouseholdEater` accepts no such argument, **because there is no column**. The admin Development World page renders an **"Age" column** populated from fixture data that **no production code path can ever read**. THA has already built the screen for a fact it does not store.

**Everything else is honest.** `shared/nutrition/household-nutrition.ts:59-65` is exemplary and states the platform's own position better than this investigation could:

> *"**No invented target.** … No RDA, no reference intake, and no nutrient target is invented anywhere, because THA stores none and **inventing one would be fabricating certainty**."*

And the Companion, asked directly in the benchmark corpus, says: *"I don't know the ages of your children."* **It is telling the truth.**

> **The platform's honesty machinery works.** It refuses to invent nutrient targets; it declines unsourced benefits; the Companion admits the gap out loud. **One line at `routes.ts:568` breaks ranks** — and it is the only line that had to guess an age to produce its number.

---

## 4. THE FALSE INVENTORY — A DEFECT CLASS THIS CANON HAS NOT SEEN

**`NK1` — governing architecture — states that eater age is stored and authoritative. It is not.**

| Line | Claim |
|---|---|
| `NK1:73` | *"\| **Eater Composition** \| Who eats, **age, stage** \| DB `household_eaters` + `household_members` \|"* |
| `NK1:139` | *"\| **Eater Composition** \| DB `household_eaters` \| Name, **age**, dietary restrictions \| **Authoritative** \|"* |

The table it names, in full (`shared/schema.ts:1158-1168`), is `id`, `householdId`, `displayName`, `userId`, `defaultDietTypes`, `hardRestrictions`. **There is no age column. There is no stage column. There never has been.** `NK1:535` restates it as an unticked launch item: *"Eater profile complete: Name, **age**, hard restrictions…"*

**This is a new class of defect in this canon, and naming it is one of this investigation's two contributions.** The last four investigations converged on a single reassuring pattern:

> *"The law was right; the platform was behind it."* (TIME1 § 13, TIME3 § 18 — `TRANSLATION1`'s *Morning Rhythm* required an hour THA could not tell.)
> *"The canon is right; the render is wrong."* (NORTH2 § 1.)

**`NK1:139` is neither.** It is not a rule waiting for the platform to catch up. It is not a correct law wrongly implemented. **It is a governing document that is factually wrong about the system it governs** — and wrong in the most dangerous direction available, because it does not under-claim, it **over-claims**, and it over-claims *authority* over a **safety-relevant field**.

> **A law ahead of its platform costs nothing but patience. A false inventory costs trust the moment somebody believes it.** An engineer who reads `NK1:139` and writes a per-eater age rule will find the column missing at implementation. An engineer who reads it and writes a *safety* rule that *assumes* the column may not notice until it is live — because the honest failure mode of a missing field is `undefined`, and `undefined` fails open.

This is precisely the failure `PKR1` Risk R7 predicts and names as THA's most repeated: *something is found, written down beautifully, read once, and never maintained.* **NK1 documented the eater profile it intended and has been describing it in the present tense ever since.**

### 4.1 The prohibition that points at nothing

`NK1:418` — the Phase 4 (2029) gate:

> *"**Gate:** … every **§6.3 prohibition** (no diagnosis, no dosing, **no inferral, no per-child signals**) covered by structural tests."*

**`NK1` has no numbered sections.** Not §6.3, not §6, not any. Verified against the document's complete heading list: it is organised by named headings (`THE KNOWLEDGE ARCHITECTURE`, `Domain 1: Food Identity`, `Rule NK1 — One Canonical Owner…`) and the string `6.3` occurs exactly once in the file — **in the reference itself**.

> **The only rule in the entire governing canon that speaks to per-child intelligence is a prohibition citing a section that does not exist.**

So the canon's sole position on the subject of this investigation is: *don't* — deferred to 2029, with the reasoning missing. **This is recorded, not resolved.** LIFE1 does not write the prohibition; inventing the missing §6.3 would be filling a silence rather than recording it (EXPCOMP1 § 4.3), and it would make an investigation the author of a governing rule.

**But the four words survive their broken pointer, and this investigation obeys them:** *no inferral, no per-child signals* is honoured in full by § 9's design — the household **declares**, THA **derives**, and THA **never infers**. See § 10.

### 4.2 One document that is not a defect

`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md:408` describes *"a **child voice** (or a **child profile**)"* receiving *"**age-appropriate**, encouraging answers"*, read-only by default.

**This is not the same error and must not be reported as one.** NK1 asserts, in the present tense, in a *coverage audit* column headed **Authoritative**, that a fact is stored. The AI Experience document describes a **designed future voice surface** (Part 9/§ 10.2), and a design may legitimately describe what does not yet exist. **It is a dependant, not a defect** — and it is a second governing document whose design silently assumes life-stage knowledge the platform does not have. Recorded as a dependency, cited, not amended.

---

## 5. THE SCOPE DEFECT — A DOMAIN 16 FACT LIVING IN DOMAIN 27

**THA has two rival answers to *"who lives in this household?"*, and the one that reaches the language model is the wrong one.**

| | Answer A | Answer B |
|---|---|---|
| **Store** | `household_eaters` rows | `user_preferences.adultsCount` / `childrenCount` / `babiesCount` |
| **Register domain** | **16 — Household Profiles** | **27 — User Preferences** |
| **Declared status** | *"Authoritative — declared"* (Register:281) | **"Contested — see Phase 3"** (Register:405-411) |
| **Scope** | **Household** | **User** — `user_preferences.userId … unique()` |
| **Reaches the model?** | Yes, as eaters | **Yes — in ~90% of all prompts** |
| **Reconciled with the other?** | **No** | **No** |

The Register is unambiguous. **Domain 16 — Household Profiles** — *"Household members, eaters, overrides"* — declares its authoritative source as **`households`, `household_members`, `household_eaters`** (Register:281). Household composition is a **Domain 16 fact**.

`adultsCount`, `childrenCount` and `babiesCount` are household composition. They live in `user_preferences` — **Domain 27**, a domain the Register already marks **Contested** — keyed one row per **user**.

**Principle 2's scope test — *"can these two stores legitimately disagree?"* — returns the answer that decides it: no, and yet they can.** Two adults in one household each hold a private `childrenCount`. They can differ. Nothing reconciles them, nothing validates them against the `household_eaters` rows, and **no code computes with them at all** — every read is display or echo (`routes.ts:611-613`, `:664-666`, `profile-read-handler.ts:187-189`).

**The precedent is exact, it is governing, and it is nine days old at most — it was written by TIME3 into this very domain.** Register Domain 16, on `households.timeZone`:

> *"**Household-scoped, never per-member and never per-session** (Rule HT4) — a clock is a property of the home, not of the device; **per-member zones would be a split-brain over one shared plan.**"*

> **Substitute one word.** *A household's composition is a property of the home, not of whichever adult last opened the profile page.* **`childrenCount` on `user_preferences` is the split-brain HT4 rejected — already live, already shipped, and already the platform's only composition signal reaching the model.**

Household Time refused this shape for the time zone **before writing a line of code**. Life Stage finds the same shape **already built**.

---

## 6. THE PROXY THAT IS ALREADY WRONG

`shared/household-eater.ts:107`:

```js
kind: row.userId != null ? "user" : "child",
```

The schema comment (`shared/schema.ts:1156`) says the table *"supports both linked users (adults with accounts) and children (userId = null)."*

**`kind` does not mean child. It means *has no account*.** A live-in parent, a grandparent, a lodger, a partner who never signed up — each is typed `"child"`. A fifteen-year-old with a login is typed `"user"`. **Nothing in the row says anything about age.**

**Two facts keep this from being a live defect today, and one makes it a certain future one:**

- **No production code branches on `kind`.** The only `kind === "child"` read in the repository is a test assertion. Code that *does* branch (`household-meal-matcher.ts`, `household-dietary-safety.ts`) branches on `userId != null`, and what follows is *"read the diet from the account, or from the stored row"* — an **account** question, correctly asked.
- **`kind` reaches the language model** — `household-read-handler.ts:81` — as a per-eater label. **The model is handed the word `child` about people whose ages nobody knows.**

> **It is a correct-by-accident name and a loaded gun.** The first engineer to write `if (eater.kind === "child")` believing it means *a child* will be right about most households and catastrophically wrong about the ones with a grandparent at the table — and the code will read perfectly in review.

**This is EXPCOMP1's WARNING grade in its purest form:** *correct today, correct for the wrong reason, one innocent change from wrong.*

---

## 7. THE UNENFORCED SAFETY RULE — AND THE PRINCIPLE THAT ALREADY FORBIDS IT

`shared/restrictions/restriction-library.ts:1166-1175`:

```js
// ── HONEY ───────────────────────────────────────────────────────────────────
//
// Not an allergen — an ethical restriction (honey is an animal product and is
// excluded by veganism) and, separately, an infant safety rule: honey must not be
// given to children under 12 months because of the botulism risk. Added in Phase 4
// (SURF1B2): live households declare it and it resolved to nothing.
```

**The infant safety rule described in that comment exists nowhere below it.** The definition (`:1176`+) is a plain alias list at `tier: 'additional_restriction'`. The resolver's entire signature is:

```js
// shared/restrictions/restriction-resolver.ts:490-494
export function resolveActiveRestrictions(
  hardRestrictions: string[],
): RestrictionDefinition[]
```

**It takes declared strings and nothing else.** No age. No eater. No household. So honey is filtered **if and only if an adult manually types "honey" into a restriction field**. A household with `babiesCount: 2` who never declared it receives no filtering whatsoever.

**THA has already discovered this exact failure mode, written down the principle, and fixed it — for other values.** The same file, thirteen lines below the signature (`restriction-resolver.ts:503-506`):

> *"…the answer was silently "no" for `meat`, `fish` and `honey`: values THA accepted on the profile, showed back to the household, and could not act on. **A restriction the platform cannot enforce is worse than one it never accepted, because the household believes it is protected.**"*

**That sentence is this investigation's severest finding, applied to the field it was not applied to.**

| SURF1B2 closed this… | …and left this open |
|---|---|
| THA accepted `honey` as a restriction string | THA accepts `babiesCount: 2` |
| showed it back on the profile | shows it back — *"2 Adults · 1 Child"* (`profile-page.tsx:180-182`) |
| could not act on it | **cannot act on it** |
| → **fixed**: unenforceable strings rejected at the write door | → **`babiesCount` gates nothing, anywhere** |

And `babiesCount` travels further than any restriction string ever did. `profile:read` is injected into **90 of 100 prompts** in the benchmark corpus, **85 of them as a baseline read** — *"50.4% of all CONTEXT DATA bytes the platform emits"* (`context-view.ts:189-192`) — carrying `babiesCount` (`profile-read-handler.ts:187-189`).

> **The language model is told, on roughly nine turns out of ten, that there is a baby in the house — by a platform that has no rule about babies, no age for anyone, and one safety rule about infants sitting in a comment.**

**The honest qualification, stated plainly:** this is a **structural hazard, not a demonstrated harm.** No transcript in the corpus shows the Companion giving unsafe infant advice; asked directly, it disclaims — *"I don't know the ages of your children."* **The platform is currently protected by the model's good manners rather than by a gate.** That is the finding. It is not reassurance.

---

## 8. THE INSTRUMENT — THE BOUNDARY / CURVE TEST

TIME2's contribution was an instrument that sorted its domain in one question. Life Stage needs one, because *"life stage intelligence"* names **two capabilities with opposite verdicts**, and building them together is the trap.

> **The test: does this rule turn on a *boundary*, or on a *curve*?**
>
> - **Boundary** — a step function. It needs only *which side of a line* someone is on. *Honey is unsafe under 12 months. Whole nuts are a choking risk under 5.* → **Buildable.**
> - **Curve** — a continuous function. It needs *how much*, graded by age. *How much iron does a 4-year-old need?* → **Not buildable. Not LIFE1's to create.**

| | **Boundary rules** | **Curve rules** |
|---|---|---|
| **Question** | Is this safe for this person? | How much does this person need? |
| **Shape** | Step — coarse, robust | Continuous — precise, brittle |
| **Knowledge required** | A small, sourced, well-known set of UK/NHS thresholds | **Full age-banded reference intakes** — a knowledge domain |
| **Precision required** | Months, at one or two lines | Exact age, sex, and often weight |
| **Failure mode** | Fails **closed** — filter something safe | Fails **open** — a confidently wrong number |
| **Existing home** | **The restriction gate + Rule T0**, which already exist | **Nothing.** `household-nutrition.ts:59-65` refuses to invent one |
| **Verdict** | ✅ **Recommend** | ❌ **Defer — governed act, precondition named** |

**Why the Curve half must be refused, in the canon's own words:**

1. **`shared/nutrition/household-nutrition.ts:59-65`** — *"No RDA, no reference intake, and no nutrient target is invented anywhere, because THA stores none and inventing one would be fabricating certainty."* Age-banded targets are **exactly** the invented target this module was built to refuse.
2. **`NK2:213`** — the declared unit of nutrition reasoning is *"counts + strengths + gaps **at household level**"*; **`NK2:179`** — safety is a *"**household-level** safety gate (Rule T0)"*. Per-person nutrient targets change NK2's unit of analysis. **That is a methodology change, and NK2 owns it — not this investigation.**
3. **`NK1` Rule NK3 — No Fabricated Knowledge.** An age-banded intake table is a **new knowledge domain**: sourced, evidence-gated, and currency-gated under `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, admitted by **Register Rule 8** governance review. **Precisely the shape TIME1 § 12 deferred bank holidays for**, and deferred for the same reason.

> **The elegant part is that the split is free.** The Boundary half is the **cheap** half *and* the **safety-critical** half. The Curve half is the expensive half *and* the optional one. **There is no trade-off to make** — the thing worth building is also the thing that costs least and needs no new knowledge domain.

**And the Boundary half needs no new engine.** Rule T0 and the restriction resolver already are the safety gate. A boundary rule is a **restriction whose trigger is a date instead of a declaration.** It extends a gate that exists; it does not create a second one.

---

## 9. THE MODEL

### 9.1 The owner

> **`shared/life-stage/life-stage.ts` — the single canonical owner of life stage. It owns the *rules* of life stage and none of its data.**

| Property | Value |
|---|---|
| **Class** | Pure, zero-I/O, deterministic, beside the entity spine (**Principle 5**) |
| **Totality** | **Total.** No birth date → `unknown`. Never throws |
| **Persistence** | **None.** No table, no column, no cache |
| **Clock** | **Reads none.** `today` is a parameter — Household Time's **HT5**, inherited |
| **Learning** | **None.** Never inferred (**HT16**; OBS § 7; `NK1:418`) |
| **Not** | Not a capability, not an engine, not a service, not a numbered domain |

### 9.2 The contract

```
lifeStageOf(birth: BirthDate | null, today: CivilDate) → LifeStage

LifeStage =
  | { known: true;  stage: "infant" | "toddler" | "child" | "adolescent" | "adult"; months: number }
  | { known: false; reason: "not-declared" }
```

**`known: false` is a first-class answer, not an error** — Household Time's § 6.2 applied without modification. It is what THA must truthfully say about **every eater that exists on the day this ships**, and it is the whole difference between this design and `routes.ts:568`:

> **The current code cannot express *"I don't know how old this person is"*, so it guesses thirty — and the guess is indistinguishable from knowledge.**

### 9.3 The fact — one, on an owner that already exists

| Fact | Answers | Owner | Register domain | Scope |
|---|---|---|---|---|
| `household_eaters.birthYear` + `.birthMonth` — both nullable | *When was this eater born?* | `household_eaters` — **existing owner, extended** | **16** — Household Profiles | **Eater** |

**No new domain. No new store. No new write funnel.** This is HT2's shape exactly, and it lands in the domain the Register already declares authoritative for eaters (Register:281) — the same domain that already carries `households.timeZone`.

**Scope, by Principle 2's test.** *Can two stores legitimately disagree?* A birth date belongs to **the eater** — not the household (each eater has their own) and not the user (most children have no account). `household_eaters` is the only store at the right scope, and it is already the declared owner.

**And the GDPR posture is already written**, by NK1 itself (`NK1:448`): *"`household_eaters` | Eater composition, hard restrictions | Household-owned | User action | **GDPR right-to-rectification; household controls data**."* The fact lands in a store whose data-subject rights are already declared. *(This is not the whole of the legal question — see § 12.1.)*

### 9.4 Why the stored fact must be a **date**, and never a **stage**

**This is the argument that decides the design, and it comes from the platform's own scar tissue.**

The tempting cheap fact is a declared label — ask the household *"do you have a baby?"* and store `hasBaby: true`. It is smaller, warmer to ask for, and less personal data. **It is also the exact defect Household Time exists to retire.**

> **A declared stage decays silently. A birth date never does.**

A household ticks *"baby"* in 2026. In 2028 the column still says *baby*. **Nobody did anything wrong, and the fact is now false** — and THA cannot tell, because the row looks identical to a true one.

**THA has this defect twice already, and TIME1 named both:**

- **`approxDate`** (TIME1 § 3.3) — *"a season filter and an occasion key, not the recency hint its docblock claims"*: **summer memories become autumn memories as the clock moves.** A stored derivation, decaying.
- **The stale season** — three implementations, no owner.

**`hasBaby: true` is `approxDate` with a nicer name.** It is a **stored derivation** — and **HT3** forbids it in one line: *"Nothing derived is stored. A column or cache holding any of them is a permanent sync bridge (Principle 7)."*

> **The birth date is not the *most precise* form of this fact. It is the only form that stays true without anyone touching it.** Store the date; derive the stage; the derivation re-runs and the truth maintains itself. **That is not a nicety — it is the difference between a fact and a decaying claim.**

**Month precision, and not a day more.** Every boundary rule THA could honestly hold turns on **months** — honey at 12, weaning near 6, choking risk near 5 years. **`birthYear` + `birthMonth` satisfies every one of them.** Day precision buys exactly one thing — birthdays — which is **celebration, not safety**: a different purpose, a different fact, and a separate governed act. **Data minimisation is not a concession here; it is the correct answer, and the safety rules do not want the extra digit.**

---

## 10. THE BOUNDARY THAT MAKES THIS SAFE — DECLARED, DERIVED, NEVER INFERRED

**Three verbs, and the whole trust model is in which one is forbidden.**

| Verb | Who | Permitted? |
|---|---|---|
| **DECLARE** | The household states a birth date | ✅ **The only source.** Authored, correctable, deletable |
| **DERIVE** | THA computes stage = f(birth, today) | ✅ Pure, total, unstored |
| **INFER** | THA concludes a child exists from behaviour | 🚫 **Forbidden** |

**The prohibition is not this investigation's invention. It is already law, three times over:**

- **`HT16`** — *"Telemetry may never inform household time. No learned routine, no inferred rhythm. A household pattern may only be read from state the household authored."*
- **Observation Engine § 7** — *"**Any behaviour that reads an observation** — routing, permissions, confirmation tiers, phrasing, notices, learning — **stop.**"*
- **`NK1:418`** — *"no inferral, no per-child signals"* — the four surviving words of the dangling §6.3.

> **THA must never conclude there is a baby in the house because someone scanned formula.** That is surveillance of a family's table, and it is forbidden by the Observation Engine before it is distasteful. **The household says, or THA does not know.**

This aligns with the sibling investigation `ORCH1`'s finding — *the household tells; THA doesn't watch* — cited **as a sibling investigation, not as law** (ORCH1 is unadopted, and its recommended EXP ARCH § 12 extension is not in force). A birth date is **Zone 2**: what the household chooses to tell. It never becomes Zone 3.

**And `EXP ARCH § 12` already governs the rest**, requiring no amendment: *"Data belongs to the household. The experience always makes clear what THA knows, lets the household see it, and lets them correct or remove it. **No dark corners.**"* A birth date is visible, correctable and deletable **by a rule that already exists**.

---

## 11. THE RELATIONSHIP TO HOUSEHOLD TIME — THE FINDING THAT PLACES THIS WORKSTREAM

**This is the investigation's second contribution, and it explains why LIFE1 could not have been written before TIME3.**

### 11.1 Life stage is THA's first time-derived household fact

**Every fact THA holds today is time-invariant.** A restriction stays a restriction. A diet pattern stays a diet pattern. A height is a height. **They change only when a household edits them** — a human acts, a value changes. That is the only mechanism the platform has ever needed.

**A birth date is different in kind:**

> **It is the only household fact whose *meaning changes while nobody touches it*.** The row is immutable and its answer is not. An infant becomes a toddler because the Earth moved, not because anyone opened THA.

**That is precisely why life stage requires an owner of time — and why it is not merely *convenient* to build it after TIME3, but impossible to build it correctly before.** A platform with no owner of *today* cannot hold a fact that changes with *today*; it can only hold a label and watch it rot. **The six private clocks TIME1 found are exactly the six ways this fact would have been got wrong.**

### 11.2 Life Stage under the CIVIL/INSTANT test

Household Time's governing instrument (§ 7), applied:

> *"If this household moved to Tokyo tomorrow, would this value have to change?"*

**Yes — marginally, and the answer is still CIVIL.** A child turns one on their birthday **in their own calendar**, not at a UTC instant. Life stage is a **legitimate consumer of T2 (`today`)** and consumes **nothing else** — not T1 directly, not T3, not T4, and **never T5**.

**But it is the platform's most error-tolerant CIVIL consumer, and this changes the sequencing:**

| Consumer | If the zone is wrong by a day |
|---|---|
| *"What's for dinner today?"* | **Shows the wrong dinner.** Immediate, visible, wrong |
| **Life stage** | A stage boundary crosses a few hours early or late. **A child is not differently safe at 11 months and 30 days** |

> **Life Stage is CIVIL with a tolerance measured in months, consuming a value that errs by hours.**

**The consequence is a genuine sequencing finding:** Life Stage needs **Phase 1** (the module) and is **not blocked by Phase 2** (the zone) or **Phase 4** (the anchor, ★ the expensive gate). It reads `householdToday()` and accepts the `Europe/London` default with declared provenance — a correct answer for a UK product, and one that cannot mislead at a monthly boundary.

**HT11 is satisfied and is worth stating explicitly:** *"All of it, or none of it."* Life Stage takes T2 **from the module** and keeps **no** date arithmetic of its own. It must not compute `today` itself "because the tolerance is wide" — **that is how a sixth clock is born, and the wide tolerance is exactly the excuse that would justify it.**

### 11.3 Where Life Stage sits in Household Time's consumer matrix

Household Time § 8's matrix has no row for this, because the fact did not exist when it was written. **This is what the row would say — recorded as a finding, not written into the governing document:**

| Domain | T1 | T2 | T3 | T4 | T5 | S | I | **Owns** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Life Stage** | – | ✅ | – | – | – | – | – | **Nothing** |

**`Owns: Nothing`** — consistent with every other cell in that column. The fact is Domain 16's; the rules are the module's; the data is nobody's.

---

## 12. GAPS RECORDED, NOT FILLED

Per EXPCOMP1 § 4.3 — *"where the canon is silent, record silence as a gap — never fill it"* — and Core Principle 6.

### 12.1 Children's personal data has no governing owner — **the top open item**

**A child's birth date is a minor's personal data, and no governing document in THA addresses minors' data at all.**

Verified: `docs/architecture/` contains a consent posture for **wearables and biomarkers** (`NK1:93`, `:155`, `:423`; Food Intelligence § 6, S-1–S-4 — *"consent-per-signal"*, *"regulated-partner contract + legal/regulatory review"*), and a GDPR rectification posture for `household_eaters` (`NK1:448`). **There is nothing on children.** No age of consent, no parental-consent model, no retention rule for a minor's data, no statement of who in a household may enter a child's date of birth.

**This is not a gap this investigation may fill, and the reason is not modesty:**

> **Children's data is a legal and product question with a regulatory surface (UK GDPR), and an engineering investigation has no authority to decide it.** The platform's own precedent is exact and governing: S-3 biomarkers require *"opt-in + regulated-partner contract + **legal/regulatory review**"* before a single value is accepted. **A child's date of birth is at least that sensitive, and it is asked of every household rather than a consenting few.**

**Recorded as an open item, and named as a precondition of Phase 2 (§ 13), not of the design.** The module (§ 9.1) and the retirements (§ 14) are entirely unblocked by it — **which is fortunate, because they are where the live defects are.**

### 12.2 Pregnancy — deliberately not created

TIME1 § 15.4's discipline, applied: *"Each is a **new fact**, and a new fact is a governed act."*

**Pregnancy is not a life stage and this investigation does not model it.** It is a distinct fact, at a distinct scope (a person, not an eater-line), with a **materially heavier** trust and legal profile than a birth date, a duration rather than a threshold, and a state whose *ending* the platform has no honest way to learn. `pattern-intent-resolver.ts:172` already routes pregnancy questions to the honest-gap path (*"will not fabricate a health benefit"*) — **the correct behaviour, reached by the accident of the term never being seeded.** Recorded; not designed; **not smuggled into a life-stage module**, which is precisely how a vocabulary quietly becomes an owner.

### 12.3 Live defects found — reported, not fixed

All pre-date LIFE1. **None is touched here.**

1. **`routes.ts:568` — the hardcoded age 30 and the sexless `-78`.** A live **Core Principle 6** fabrication, surfaced as a personalised calorie target. **The one line to fix first** (§ 14).
2. **`NK1:73`, `:139`, `:535` — the false inventory.** Governing architecture asserting a safety-relevant field is stored and *Authoritative* when the column does not exist (§ 4).
3. **`NK1:418` — the dangling §6.3.** The canon's only per-child prohibition cites a section that does not exist (§ 4.1).
4. **`user_preferences.adultsCount/childrenCount/babiesCount` — a Domain 16 fact at user scope**, in a domain the Register marks *Contested*, unreconciled with `household_eaters`, reaching the model in ~90% of prompts, computing nothing (§ 5).
5. **`household-eater.ts:107` — `kind: "child"` means *has no account***, and reaches the model as a per-eater label (§ 6).
6. **`restriction-library.ts:1169` — the infant botulism rule is a comment**, against the principle stated in `restriction-resolver.ts:503-506` (§ 7).
7. **The Development World admin page renders an "Age" column** from fixture data no production path can read (`world-fixtures.ts:64`; § 3).

### 12.4 Facts deliberately not created

**Per-eater sex** *(the other half of `routes.ts:568`'s fabrication — a second new fact, named so the BMR fix is not mistaken for authorisation to invent it)* · **age-banded reference intakes** *(§ 8 — a knowledge domain, Register Rule 8)* · **pregnancy** *(§ 12.2)* · **birthdays / day precision** *(§ 9.4)* · **inferred stages** *(§ 10 — forbidden)*.

---

## 13. RECOMMENDED ROADMAP

**Nothing here is authorised by this document.** Each step requires its own workstream under `ENGINEERING_WORKFLOW.md`.

| Step | Work | Needs | Risk | Reversible by |
|---|---|---|---|---|
| **0** | **Delete the fabrication.** `routes.ts:568`. Present `dailyCalories` honestly, or not at all, where age is unknown | **Nothing** | Low — **it removes a claim, it adds none** | Reverting one line |
| **0a** | **Correct `NK1`.** The three false *age/Authoritative* claims → the honest gap. **Resolve or remove the dangling §6.3** | Nothing | None — docs | Reverting one doc |
| **1** | **The module.** `shared/life-stage/life-stage.ts` — pure, zero-I/O, total, **zero consumers**. Declares the stage vocabulary and boundaries | Household Time **Phase 1** | None — no consumer | Deleting one file |
| **2** | **★ The fact.** `household_eaters.birthYear` + `.birthMonth`, nullable, never back-filled, never defaulted | **§ 12.1 legal review** · 1 | **Gated — not by engineering** | Dropping two columns |
| **3** | **Retire the counts.** `user_preferences.*Count` → `household_eaters` rows. **The scope fix** | 2 | Medium — a live model input changes | Reverting one call site |
| **4** | **The boundary gate.** Honey <12 months, as an extension of Rule T0 and the existing resolver — **never a second gate** | 2, 3 | Low — **fails closed** | Reverting one rule |
| **5** | **Rename the proxy.** `kind: "user" \| "child"` → `"account" \| "no-account"` (or similar). Independent of everything above | Nothing | Low | Reverting one rename |

### 13.1 Why this order

- **Step 0 first, and it is not sequenced behind Household Time at all.** It needs no module, no fact, no zone, no legal review. **It is the only live fabrication in the audit and its fix is a deletion.** TIME2's precedent for exactly this: *"out of band, do not sequence behind Step 0."*
- **Step 5 is likewise free** — a rename of a proxy that no production code reads (§ 6). It defuses the gun before someone picks it up.
- **Step 2 is gated by a lawyer, not an engineer** (§ 12.1) — and this is the honest shape of the work. **Every step that carries live harm (0, 0a, 5) is on the *near* side of that gate.**
- **Step 4 last** because it is the only step that **changes what THA does to a household's food**. Everything before it makes existing claims honest; Step 4 **withholds a food from a plan** — and a filter that fires wrongly is a household's dinner.

### 13.2 The recommended next workstream

> **`LIFE2` — Step 0: delete the hardcoded age. Application code, one line, no schema, no dependency on Household Time.**

It is the cheapest step, it is the only **live fabrication** this investigation found, it is blocked by nothing, and **it is the one thing here that is wrong today rather than absent today.**

**Do not start with Step 2**, however tempting the column is. **A birth date collected before § 12.1 is answered is a minor's personal data gathered without a governing position on minors' personal data** — and unlike every other finding in this document, that one is not reversible by dropping a column.

---

## 14. RETIREMENT TARGETS

**Principle 8 requires the retirement list to be named in the document introducing the replacement.** This is that list.

| # | Target | Count | Step |
|---|---|---|---|
| 1 | **The hardcoded age `30` and the sexless `-78`** — `routes.ts:568` | **1 → 0** | 0 |
| 2 | **`user_preferences.adultsCount` / `childrenCount` / `babiesCount`** — a Domain 16 fact at Domain 27's user scope | **3 → 0** | 3 |
| 3 | **`kind: "user" \| "child"`** — an account question wearing an age word | **1 → 0** | 5 |
| 4 | **The unenforced infant rule in `restriction-library.ts:1169`** — comment → gate | **1 → 1 (enforced)** | 4 |
| 5 | **`NK1`'s false *age / Authoritative* claims** — `:73`, `:139`, `:535` | **3 → 0** | 0a |
| 6 | **The Development World "Age" column** over data no production path can read | **1 → 0 or 1 (real)** | 2 |

> **Retirement condition, for every entry:** the replacement is live first. **Nothing is deleted before it** — except **#1**, which is deleted *without* a replacement, because **the honest answer to "how old are you?" is *THA doesn't know*, and shipping that is the fix.**

---

## 15. ARCHITECTURE IMPACT ASSESSMENT

**Does the existing architecture require amendment? Yes — but nothing is due today, and this document performs none of it.**

| Document | Verdict |
|---|---|
| **`NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`** | 🔴 **MUST BE CORRECTED — and this is the finding.** Three false claims (`:73`, `:139`, `:535`) assert a safety-relevant field is stored and *Authoritative*. Plus the dangling §6.3 (`:418`). **A correction, not an amendment: the rules are unchanged; the inventory is wrong.** *Trigger: Step 0a — the cheapest item in this document* |
| **`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`** | ✅ **MUST EVOLVE — at implementation (Step 2), not now.** Domain 16 gains `birthYear`/`birthMonth`; an **Appendix A** row names Life Stage's owner on ATTN1/DEC1/TIME3's exact footing. Domain 27 records the counts' retirement. **No new domain section** |
| **`ARCHITECTURE_PRINCIPLES.md`** | 🟡 **One line, at Step 1.** The Domain Ownership Quick Reference gains a Life Stage row. **No principle changes** |
| **`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`** | ❌ **NO AMENDMENT.** Life Stage is a **consumer** (§ 11.3). Its § 8 matrix is a snapshot of consumers, and a new consumer does not amend the architecture it consumes — **the module is unchanged, the contract is unchanged, and HT5/HT11/HT16 are obeyed, not extended** |
| **`NK2_THA_NUTRITION_METHODOLOGY.md`** | ❌ **NO AMENDMENT — and § 8 exists to keep it that way.** Per-person nutrient targets would change NK2's declared unit (*"household level"*, `:213`; Rule T0, `:179`). **The Curve half is refused precisely so this document is not amended by a side effect** |
| **`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`** · **`CANONICAL_PUBLICATION_ARCHITECTURE.md`** | 🟡 **Only if the Curve half is ever built.** Then age-banded intakes are a **new knowledge domain** — Variant 2, sourced, currency-gated, Register Rule 8. **Not triggered by this design** (§ 8) |
| **`THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`** | 🟡 **No amendment. Recorded as a dependant** (§ 4.2) — its *"child profile"* / *"age-appropriate"* voice design (`:408`) assumes this fact. **A design describing a future is not a defect** |
| **`THA_OBSERVATION_ENGINE_ARCHITECTURE.md`** · **`THA_DECISION_ENGINE_ARCHITECTURE.md`** · **`THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`** · **`THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`** · **`THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`** | ❌ **NO AMENDMENT.** Each governs a seam this design **feeds** and never crosses (§ 10, § 11) |
| **Every Experience document** | ❌ **NO AMENDMENT. Byte-untouched.** Life stage aims **safety and words**, never light. `EXP ARCH § 12` already governs the household's control of its own data (§ 10) — **no rule is added to the document that already required it** |

> **The whole architectural impact is one document *correction*, one register row and two domain fields — and only the correction is due now.** It is the fourth consecutive investigation to reach a number this small. But the *shape* differs from its three predecessors, and the difference is the point: **NORTH2 found the canon right and the render wrong; TIME1 found the law right and the platform behind it; LIFE1 found a governing document that is simply wrong about the system.** The pattern *"THA's governing documents keep predicting its defects before its code produces them"* **does not hold here** — `NK1:139` did not predict this defect. **It is one.**

---

## 16. CONFLICTS WITH GOVERNING ARCHITECTURE

**None created. One found, in a governing document, and reported rather than resolved.**

The mission's stop condition — *"if a proposed change conflicts with the governing architecture: STOP"* — is **not triggered by this design.** It is, arguably, already triggered by `NK1:139` versus `shared/schema.ts:1158-1168`, which is why § 15 routes it to Step 0a rather than resolving it here.

**Five near-misses, checked and cleared:**

| Candidate conflict | Verdict |
|---|---|
| **`NK1:418` — *"no per-child signals"*** | **Cleared, and it is the load-bearing check.** The prohibition's four surviving words are honoured in full: **no inferral** (§ 10 — declared, never inferred) and **no per-child *signals*** — a *signal* is something THA **derives about** a household from watching it. A birth date the household **typed in** is not a signal; it is a **declaration**, of the same class as a hard restriction, which `household_eaters` already holds per person. **The § 8 Curve refusal is what keeps this true**: per-child *targets* would be per-child signals, and they are refused |
| **Observation Engine § 7 / `HT16`** | **Cleared.** `platform_observations` is named a **forbidden input** (§ 10). `OBS_DISABLE_CAPTURE=1` stays a functional no-op. **THA never learns that a child exists** |
| **`HT3` — nothing derived is stored** | **Cleared, and it *decided* the design.** The stage is **never** stored; the *date* is (§ 9.4). A stored stage would be the permanent sync bridge Principle 7 forbids — and § 9.4 shows it is also `approxDate`'s exact defect |
| **`household-nutrition.ts:59-65` / NK2's household-level unit** | **Cleared by refusal, not by argument** (§ 8). The Curve half is **not designed here**. Nothing in this document invents a target, and the module cannot: it returns a stage, and a stage is not a number |
| **DEC1 § 7 — *"surfacing logic anywhere else must STOP"*** | **Cleared.** Life Stage surfaces nothing, ranks nothing, and adds no suppress/rank/budget path. **The attention stack stays clock-free and stage-free.** *"There is a toddler here"* must never rank an opportunity |

**One governing rule remains unobeyable until the fact exists** — `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md:408`'s *"age-appropriate"* child voice. **This is not a conflict.** It is a future design naming a precondition. **Amending it to match the platform's limitation would ratify a gap as law** — the error NORTH2 § 1, HOME2 § 10 and TIME1 § 14 each refused, and this document refuses it a fourth time.

---

## 17. DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| **Life Stage investigated as a platform capability** | § 2 — **and the framing refused.** It is a *vocabulary*, on TIME1 § 12.2's exact reasoning; a capability would be a mouth nobody can invoke |
| **Built on the Household Time Architecture** | § 11 — a **T2-only consumer**, `Owns: Nothing`; § 11.1 names *why* it required TIME3 first: **it is THA's first time-derived household fact** |
| **Existing ownership preserved** | § 9.3 — **one fact, on an owner that already exists** (Domain 16). No new domain, no new store, no new write funnel |
| **No duplicate concepts introduced** | § 14 — the design **retires** a hardcoded age, three mis-scoped counts, and a false proxy. It adds one owner where there were none |
| **Migration path identified** | § 13 — six steps, each reversible; **the live-harm steps are all on the near side of the legal gate** |
| **Future capabilities enabled** | § 8 — the Boundary half, with its home named (Rule T0, the existing resolver). The Curve half **deferred with its precondition stated** |
| **No implementation performed** | **Nothing built.** No code, no schema, no column, no migration, no architecture modified. **One file created, under `docs/investigations/`** |

---

## 18. COMPLIANCE

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this investigation, as recorded in the run file. Household Time (governing), the SoT Register, NK1, NK2, the Observation/Decision/Context/Notice engines, and the Experience canon read where they bear on age, children, or personalisation.
- **Principle 1 — one canonical identity per entity:** the eater keeps its identity; a birth date is an attribute, not a second eater record.
- **Principle 2 — one owner per fact, at scope:** applied three times, and it **decides** three questions — the birth date at **eater** scope not household or user (§ 9.3); the counts as a **Domain 16 fact wrongly held by Domain 27** (§ 5); and stage-as-derivation vs date-as-fact (§ 9.4).
- **Principle 5 — reference vocabularies beside the spine:** the whole shape of § 9.1, on ATTN1's, DEC1's and TIME3's recorded precedent.
- **Principle 6 — honest gaps over invented facts:** the load-bearing test of this document. `known: false` is a first-class answer (§ 9.2); **`routes.ts:568` is named as a live violation** (§ 1); no stage is ever inferred (§ 10); the missing §6.3 is **recorded, not written** (§ 4.1).
- **Principle 7 — no permanent synchronisation bridge:** § 9.4 — nothing derived is stored. The stage is recomputed, never cached.
- **Principle 8 — retire on introduction:** § 14 names **every** target and its condition, in this document, as the rule requires.
- **Household Time HT3, HT5, HT6, HT10, HT11, HT12, HT16:** obeyed and cited, never restated (§ 9, § 10, § 11.2). **`HT13` is not engaged** — life stage aims safety and words, never light. **The one-morning law stands byte-untouched.**
- **Register Rules 1, 2, 4, 8:** SoT declared (§ 9.3); the new fact named as a governed act (§ 12.4); duplicate families retired (§ 14); **Rule 8 checked and *not triggered*** — a birth date is not knowledge (no claim, no source, no `reviewedAt`). **Age-banded intakes *would* trigger it, which is exactly why § 8 defers them.**
- **Observation Engine § 7:** `platform_observations` named a **forbidden input** (§ 10).
- **The mission's stop conditions:** honoured. **Nothing implemented. No code modified. No schema modified. No architecture modified. No duplicate owner created** — the duplication and the fabrication were found **already live** (§ 3), and this design retires them.
- **`REPOSITORY_CONVENTIONS.md` § 2/§ 4/§ 7:** the mission's specified path (`docs/investigations/LIFE1_…md`, a loose root file) **violates governing architecture** and would fail `repo-structure-verify.sh:52-54`. **Filed under `platform/`** — the deviation TIME2 § 0.2 hit and resolved identically. Reported, not silently applied.
- **This document creates no rule.** It is an investigation: history the moment it is written, never to be read as law. **Where it and any governing document disagree, this document is the defect.**

---

## 19. LIFE STAGE IN ONE PARAGRAPH

THA has never known how old anybody is, and in the one place it needed an age it wrote `- 5 * 30` and moved on — so every household in the product, from teenagers to pensioners, is handed a calorie target computed for a thirty-year-old of no particular sex, and told it is theirs. That is the inverse of what Household Time found: time was answered six times by nobody's authority, while age is answered once, by a constant, in silence. Around that single fabrication the platform is otherwise admirably honest — the nutrition core refuses to invent a reference intake because it stores none, and the Companion, asked about the ages of a household's children, simply says it does not know — but the honesty has a seam: `babiesCount` reaches the language model on nine turns out of ten, gating nothing, while the infant botulism rule sits in a code comment ten lines above a resolver that accepts only declared strings, in a file whose own docblock says that *a restriction the platform cannot enforce is worse than one it never accepted, because the household believes it is protected*. So Life Stage is not a capability — it answers no household question on its own, exactly as time answers none — but a vocabulary beside the spine, in the class the register already records three times; it needs one new fact, a birth month and year on the eater who already owns the restrictions, and it must be a **date** rather than a declared stage, because a stage is a stored derivation that silently rots as the child grows, which is `approxDate`'s defect wearing a kinder name. It is THA's **first time-derived household fact** — the first thing the platform will know whose meaning changes while nobody touches it — and that, not convenience, is why it could not have been built before there was an owner of *today*. It sorts in one question: rules that turn on a **boundary** need only which side of a line someone is on, fail closed, and extend a safety gate that already exists; rules that turn on a **curve** need age-banded intakes THA does not have and NK2's methodology does not permit — and the happy accident is that the boundary half is both the cheap half and the safety-critical one, so nothing is traded away by deferring the rest. The household declares, THA derives, and THA never infers — a baby is never concluded from a scan of formula, because that is surveillance of a family's table and the Observation Engine forbade it before anyone found it distasteful. And the first act is not a column but a deletion: **the honest answer to *how old are you* is that THA does not know, and shipping that sentence is the fix.**

---

*An investigation — a point-in-time analysis of Life Stage Intelligence against the governing Platform, Intelligence and Experience architectures, built on the Household Time Architecture (TIME3). It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Workstream tag: `rollback/LIFE1-7d1dd2ce-20260716` → `7d1dd2ce`.*
