# PEOPLE1 — The Household Person Model

## Whether THA has one canonical representation of a person, and whether `household_eaters` should own it

**Status:** INVESTIGATION — point-in-time analysis. **Not governing.** History the moment it is written (`docs/architecture/README.md`; PKR1 § 4.4).
**Date:** 2026-07-16
**Workstream:** `PEOPLE1_Household_Person_Model`
**Rollback:** `rollback/PEOPLE1-household-person-model-20260716` → `7d1dd2ce`
**Built on:** [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) (governing), [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) (governing), [`capabilities/household.md`](../../architecture/capabilities/household.md) (governing), with [`LIFE1`](./LIFE1_LIFE_STAGE_INTELLIGENCE.md) and [`LIFE2`](../../implementation/platform/LIFE2_REMOVE_FABRICATED_AGE_ASSUMPTIONS.md) read as history.
**Scope:** Investigation only. **Nothing implemented. No code, no schema, no migration, no architecture modified.**

---

## 1. EXECUTIVE SUMMARY

> **THA already has one canonical person-within-a-household record. It is `household_eaters`. The governing architecture named it on 2026-06-25, has never changed its mind, and has been contradicted by the platform ever since — deliberately, in three places, with comments explaining why.**

The mission asks whether `household_eaters` should remain the canonical owner of a person. **The governing architecture answered that question before the mission was written**, in two places that have been in force for three weeks:

- **Principle 1** (`ARCHITECTURE_PRINCIPLES.md:19`) — *"Every major entity (food, meal, product, **eater**, household) has exactly one key space."* **The eater is already a named major entity.**
- **Principle 2, Current violations** (`:38`) — *"`users.dietPattern`/`users.dietRestrictions` shadowing `household_eaters` (**same scope, must always agree → redundant**)."*
- **Contested Domain #4** (`:190-196`) — *"**Target:** Eater entity owns hard restrictions… **Retire the `users.diet*` overlap.**"*

**So the answer to the mission's central question is yes, and it is not this document's to give.** What PEOPLE1 contributes is the finding that the platform has spent the intervening period building the violation *more carefully*: three independent read-time enrichment paths that pull a person's diet **out of the account and into the eater row at read time**, each with a different merge rule, plus a fourth path the code itself calls a **"Bridge"**.

**This is a different shape from its four predecessors, and the difference is the point:**

> **TIME1: the law was right and the platform was behind it.**
> **NORTH2: the canon was right and the render was wrong.**
> **LIFE1: a governing document was factually wrong about the system.**
> **PEOPLE1: the law was right, the platform read it, and built the opposite — and a *second governing document* then ratified the opposite as the design.**

`capabilities/household.md:36-40` — **governing architecture** — declares the `eaters` scope to be *"`household_eaters` rows, **enriched at read time** for adult (`userId != null`) eaters **from `users.dietPattern` / `users.dietRestrictions`**"*. That is the contested shadow of `ARCHITECTURE_PRINCIPLES.md:38`, written into a governing capability card as the intended design. **Two governing documents now hold opposite positions on the ownership of a safety-relevant fact** (§ 9.1). This is reported, not resolved.

**The mechanism, in one line of the platform's own prose** — `server/lib/household-dietary-safety.ts:32-34`:

> *"…the canonical restriction library… was fed only from `household_eaters.hard_restrictions` — a partial mirror that is **empty for 10 of the 21 households that carry a live restriction**, because **adult eater rows store `[]` by design and the profile is the authoritative source**."*

**"By design."** The eater row for an account-holder is an identity with no facts. The write door is not merely unused — it is **closed by an explicit `403`**: `server/routes.ts:9093` — *"Adult eaters cannot be edited here."*

> **So the owner of a person's allergy depends on whether that person has a login.** A child's allergy is owned by their eater row. A parent's identical allergy is owned by their account. **Same fact, same scope, same class of human, two owners, discriminated by authentication.** That is Principle 2's fail test returning *fail*, and it is the mission's *"accounts must remain authentication identities, not substitutes for people"* **already violated** — not as a risk, as the current design.

**And the inversion has produced a live data-protection defect** (§ 8.1). When a member leaves a household, their `household_eaters` row is left behind — `leaveHousehold` (`storage.ts:2667-2727`) and `removeHouseholdMember` (`:2747-2799`) never touch it. That orphaned row still carries their `userId`, and `GET /api/household/eaters` still enriches it by reading **their current account**:

```js
// server/routes.ts:9041
const userRow = await storage.getUser(eater.userId);
```

> **A person who left a household continues to have their live, current dietary profile served to that household — indefinitely, and updating as they change it.** The household they left can still see their diet and their allergens, and can still plan meals for them. **This is a direct consequence of the ownership inversion**: had the eater row owned its own facts, the stale row would hold a frozen declaration rather than a live feed from a stranger's account.

**Verdict: `household_eaters` is sufficient. No new Person entity is needed, and creating one would be wrong on the merits** (§ 4.3). The work is not construction. **It is the retirement the governing architecture ordered three weeks ago and nobody performed** — plus the one write door that has to move first.

---

## 2. ENTITY INVENTORY

**Every store that represents, identifies, or counts a person. This is the complete list.**

| # | Store | Real-world entity | Scope | Key space | Non-account people? |
|---|---|---|---|---|---|
| 1 | **`users`** (`schema.ts:9-42`) | **An account.** A credential + a commercial relationship — *and*, wrongly, a person's diet and name | User | `users.id` | ❌ **Cannot represent one** |
| 2 | **`household_members`** (`:1141-1152`) | **A person's right of access to a household.** `userId NOT NULL` | User × Household | `(householdId, userId)` unique | ❌ **Cannot represent one** |
| 3 | **`household_eaters`** (`:1158-1168`) | **A person at the table.** *"Eaters within a household who meals can be planned for"* | **Household × Person** | **`household_eaters.id`** | ✅ **`userId` nullable — first-class** |
| 4 | **`user_preferences`** (`:651-684`) | **This account's settings** — *and*, wrongly, body metrics and household composition | User | `userPreferences.userId` unique | ❌ |
| 5 | **`GuestEater`** (`household-eater.ts:8-16`) | **A one-off guest at one meal.** `jsonb` on `planner_entries` (`:451`) | **Entry** | Client-generated UUID | ✅ (by construction) |
| 6 | **`plannerEntries.audience`** (`:442`) | **A grid slot's label.** *Not a person* | Entry | — | n/a |

### 2.1 The three that are not what their names suggest

**`audience: "adult" | "baby" | "child"`** (`schema.ts:524`, `:442`) — **has no relationship to any person whatsoever.** It is not a column on `household_eaters`, is never joined to `planner_entry_eaters`, and is read by neither `household-meal-matcher.ts` nor the tailoring route. A *"baby"* entry is a **row-label in a grid**. LIFE1 § 3 graded it *"honest, unrelated"* and the audit confirms that grade in full.

**`kind: "user" | "child"`** (`household-eater.ts:107`) — **means *has no account***, exactly as LIFE1 § 6 found. Confirmed still true, and confirmed still reaching the language model (`household-read-handler.ts:81`, populated `:141`/`:162`). PEOPLE1 adds one fact LIFE1 did not have: **`server/intelligence/services/household-discovery-engine.ts:90-94` labels every account-less eater `role: "guest"`** — so a household's children are typed *child* by one service and *guest* by another, and neither word is about age.

**`adultsCount` / `childrenCount` / `babiesCount`** (`:667-669`) — **anonymous integers, household-shaped, stored per *user*, written only at onboarding, and reconciled with nothing, ever.** LIFE1 § 5 named the scope defect. PEOPLE1 confirms and sharpens it: they are not merely mis-scoped, they are a **frozen self-report** that no code path has ever recomputed, validated, or compared against the bodies in `household_eaters`.

---

## 3. IDENTITY AND OWNERSHIP ANALYSIS

### 3.1 Canonical identity — already settled, and already correct

**`household_eaters.id` is the canonical identity of a person within a household, and every plannable reference in the platform already points at it.**

| Reference | Points at |
|---|---|
| `planner_entry_eaters.householdEaterId` (`:1176`) | `household_eaters.id` |
| `planner_week_eater_overrides.eaterId` (`:1200`) | `household_eaters.id` |
| `HouseholdSafeForSnapshot` (`routes.ts:10075-10090`) | `household_eaters.id` |
| Client eater selection (`weekly-planner-page.tsx:3165-3195`, `meals-page.tsx:1433`) | `household_eaters.id` |

**Principle 1's fail test — *"two stores that use different keys for the same real-world entity"* — passes.** There is exactly one key space for a person-in-a-household, and nothing competes with it. **The identity half of this investigation's question is not in dispute and was never in dispute.**

### 3.2 Ownership — the inversion

**Ownership is where it breaks, and it breaks along one seam: the presence of an account.**

| Fact | Owner if the person **has** a login | Owner if they **do not** |
|---|---|---|
| Name | `users.displayName` — *and* a frozen copy on the eater row (§ 3.4) | `household_eaters.displayName` |
| Hard restrictions (**safety**) | **`users.dietRestrictions`** | **`household_eaters.hardRestrictions`** |
| Soft diet | `users.dietPattern` + `user_preferences.dietTypes` | `household_eaters.defaultDietTypes` |

The platform states this itself, twice, without flinching:

- `server/routes.ts:9034-9035` — *"Adult rows in household_eaters store empty arrays **by design**; the authoritative source is the user's profile (users table only)."*
- `server/lib/household-dietary-safety.ts:49-50` — HARD restrictions have **two** listed owners: *"`users.diet_restrictions` (the profile — **authoritative for adults**)"* and *"`household_eaters.hard_restrictions`"*.

> **Principle 2's scope test decides it: *can these two stores legitimately disagree?*** A person's allergy is a property of that person. It does not become a different fact because they signed up. **They must always agree — so one is redundant, and `ARCHITECTURE_PRINCIPLES.md:38` already named which one.**

### 3.3 Three merge rules for one fact

**Because the fact is in the wrong place, three separate services reconstruct it at read time — and no two of them agree.**

| Path | `file:line` | Rule for an adult's `hardRestrictions` |
|---|---|---|
| **A** — the eaters API | `routes.ts:9051` | `users.dietRestrictions` **only** — the eater row is **discarded** |
| **B** — the Companion's `eaters` scope | `household-read-handler.ts:156` | `users.dietRestrictions` **only** — **discarded** |
| **C** — the canonical safety resolver | `household-dietary-safety.ts:239-242` | `dedupe([users.dietRestrictions, ...eater.hardRestrictions])` — **unioned** |
| **D** — the meal matcher | `household-meal-matcher.ts:261` | `users.dietRestrictions` **only** — **discarded** |

And for soft diet, **B never reads `user_preferences.dietTypes` at all** while **C reports it as the answer** and **D checks it first**. The `household-read-handler.ts:95-97` header claims its enrichment uses *"the same mapping table the route, `household-meal-matcher.ts`, and the Profile binding's owner already use"* — **true of the mapping table, false of the resolution rule.**

`DIET_PATTERN_TO_DIET_TYPE` exists in **five copies**: `routes.ts:525`, `household-meal-matcher.ts:16`, `household-read-handler.ts:100`, `server/scripts/sim-slot-fill.ts:16`, `server/tests/test-diet-reconciliation-bridge.ts:40`. **Rule 4 — *no identical file copies* — fails five ways.**

**The honest qualification, stated plainly.** The A/C divergence on `hardRestrictions` is **not reachable in production today**. An adult eater row can only be given a restriction by `updateHouseholdEater`, and the only production door — `PATCH /api/household/eaters/:eaterId` — **403s on adult rows** (`routes.ts:9093`). The seeders bypass it (`world-seeder.ts:332`), so the divergence is **live in benchmark and development worlds only**. It is a **structural hazard, not a demonstrated production harm** — LIFE1 § 7's posture, applied honestly to a finding that deserves it.

**What *is* live in production is § 3.5 and § 8.1.**

### 3.4 The name — copied once, never again

`syncMembersAsEaters` (`storage.ts:2906-2915`) copies `users.displayName || users.username` into the eater row **at insert only**, guarded by `if (!existingUserIds.has(m.userId))`. **It never updates.** And `PATCH` refuses adult rows, so it cannot be corrected through the API either.

**Consequences, all live:**

- A user who changes their account name **keeps their old name on the planner forever.**
- A user whose `displayName` was null at first household read **is called by their username forever** — and that username **reaches the language model** (`household-read-handler.ts:120`).
- The same person appears under **two different names in two surfaces**: `household-dietary-safety.ts:238` reads the **live** name from `users`; `household-meal-matcher.ts:270` reads the **frozen** name from the eater row.

### 3.5 The counts contradict the bodies, in the same prompt

**Live, and reaching the model on essentially every turn.**

`profile:read` — *"50.4% of all CONTEXT DATA bytes the platform emits"* (`context-view.ts:189-195`) — carries `adultsCount`/`childrenCount`/`babiesCount` (`profile-read-handler.ts:187-189`). `household/read {scope:"dietary-context"}` fires on **every food-grounded turn** (`food-intelligence-composition.ts:141-150` — *"Safety first… ground EVERY food-grounded answer"*; confirmed `conversation-gateway.ts:622`), carrying the enumerated eaters.

> **So the model is routinely handed `childrenCount: 0` and two eaters typed `kind: "child"`, in one context block, from two stores that have never been introduced to each other.** Nothing reconciles them. `syncMembersAsEaters` syncs members → eaters and **never touches the counts**.

The benchmark fixtures encode the disagreement as ground truth: `world-fixtures.ts:226-238` lists four eaters with `adultsCount: 2, childrenCount: 2` — agreeing by hand — while `:361` sets `childrenCount: 3` as an independent literal. **The demo seed hardcodes `adultsCount: 2` regardless of the eaters it seeds** (`storage.ts:3407-3409`).

### 3.6 The bridge that names itself

`server/routes.ts:756-776`:

```js
// Bridge: sync users.diet_pattern → user_preferences.diet_types.
```

**Principle 7 is one sentence and this is the shape it forbids:** *"A bridge that keeps two owners in sync → this is debt to converge away, not formalise."*

It is worse than a bridge. It is **one-way** (`PUT /api/user/preferences` writes `dietTypes` and never updates `dietPattern`), **non-transactional**, and it **swallows its own failure** (`:772-775` — *"profile save succeeds even if the bridge write fails"*).

> **So the two columns diverge silently through a door the bridge does not watch, and the bridge is permitted to fail without telling anyone.** Set `dietPattern: "Vegan"`; then `PUT /api/user/preferences` with `dietTypes: ["flexitarian"]`. The account now declares **Vegan** and **flexitarian** simultaneously — and § 3.3's paths B and C will report **`["vegan"]`** and **`["flexitarian"]`** for the same person **in the same prompt**.

**This is live, through two production routes, today.** `ARCHITECTURE_PRINCIPLES.md:192` grades Contested Domain #4 *"Currently no live split-brain, but risk is structural."* **That grade is out of date. The split-brain is live** — and this is PEOPLE1's second contribution.

---

## 4. CANONICAL MODEL RECOMMENDATION

### 4.1 `household_eaters` is the canonical person-within-a-household record — and it is sufficient

**Five reasons, none of them new:**

1. **Principle 1 already names the eater a major entity** with exactly one key space (`:19`).
2. **The Register already declares it authoritative** — Domain 16, *"Household members, eaters, overrides"*, source `households`, `household_members`, `household_eaters` (`Register:281`).
3. **It is the only store at the right scope.** A person-in-a-household is neither a user (most children have no account) nor a household (each person is their own).
4. **It is the only store that can represent a non-account person at all.** `users` and `household_members` both require an account by construction.
5. **Everything that plans for a person already points at it** (§ 3.1).

**Sufficiency is demonstrated rather than argued: `household_eaters` already owns the full fact set for every person without an account, today, in production.** A child's name, soft diets and hard allergens live on their eater row and are read as canonical (`household-dietary-safety.ts:251-261` — *"the eater row is the owner"*; `routes.ts:9071` — *"a child's eater row is the canonical owner of their allergens"*).

> **The model is not missing a capability. It is missing rows.** The eater table can hold everything a person needs; for account-holders, the platform declines to write it there and closes the door with a `403`.

### 4.2 How it is progressively enriched without becoming a duplicate user profile

**The mission's real question, and it deserves a test rather than a list.**

> **The test: would this fact still be true of a person who never signs up?**
> **If yes, it belongs to the eater. If no, it belongs to the account.**

This is not invented here. It is the rule the platform **already applies correctly to children** (§ 4.1), generalised to the humans it currently exempts.

| Fact class | Owner | Why |
|---|---|---|
| `username`, `password`, `emailVerified`, reset/verification tokens | **`users`** | **Meaningless for a person without a login.** Not person-facts |
| `subscriptionTier`, `subscriptionStatus`, `role`, `isDemo`, `demoExpiresAt` | **`users`** | Attach to the **contract**, not the human |
| `lastLoginAt`, `lastSeenAt`, `onboardingCompleted`, `starterMealsLoaded` | **`users`** | About the **account's use** of THA |
| `measurementPreference`, `soundEnabled`, `barcodeScannerEnabled`, `planner*` toggles | **`user_preferences`** | About **this account's UI**. Legitimately per-account: two adults may set different units on one household |
| **Name** | **`household_eaters.displayName`** | Every person at the table has one |
| **Hard restrictions** (safety) | **`household_eaters.hardRestrictions`** | **An allergy is not a property of a login** |
| **Soft diet** | **`household_eaters.defaultDietTypes`** | Already the child's owner. The adult is not a different kind of thing |
| **Birth month/year** (LIFE1 § 9.3, gated) | **`household_eaters`** | LIFE1 reached this table by the same test, independently |
| `heightCm`, `weightKg`, `activityLevel`, `goalType` | **⚠️ OPEN — § 9.3** | Person-facts at user scope. **Named, not resolved** |

**The three rules that keep the eater row from becoming a second user profile:**

1. **Nothing derived is stored** (`HT3`, Principle 7). The eater row holds **declarations**, never projections. `kind` is derived and unstored today — **correct, and it must stay that way.** The composition counts become a **projection over eater rows**, never a column.
2. **No authentication, no commerce, no telemetry, ever.** The first `subscriptionTier` or `lastSeenAt` on an eater row is the moment it becomes a duplicate account. **That is the line, and it is bright.**
3. **One row per person per household — and the account is a *link*, not the owner.** `userId` stays exactly what it should have been all along: a pointer saying *"this person can also log in"*. **It must never again decide who owns a fact.**

> **Stated once, plainly:** **`household_eaters` holds what is true of the person at the table. `users` holds what is true of the login.** The eater row is not a profile of a user; it is the household's declaration about a human. **That is why it does not duplicate `users` — it is a different question with a different subject.**

### 4.3 No new Person entity — and the reason is not modesty

**The tempting move is a global `people` table with `household_eaters` demoted to a join.** The mission forbids it unless the existing architecture cannot safely represent the required facts. **It can — and the global person is also wrong on the merits.**

> **Every fact THA holds about a person is *declared by a household*.** A global person would require a single global truth about a human being — which THA has **no way to establish and no right to assert.**

**The decisive case is the child of separated parents**, plausibly THA's most common two-household person. Two eater rows, no link. Is that a defect? **Principle 2's scope test: can they legitimately disagree? Yes** — one parent may know of an allergy the other has not been told, and each household plans its own meals from its own knowledge. **They are different facts at different scopes, and two rows is the correct answer.** A global person would force a merge THA cannot adjudicate, and would silently teach one household something the other declared in confidence.

**So the household-scoped eater is not a compromise forced by history. It is the right grain**, and Principle 1's *one key space* is already satisfied by it. **PEOPLE1 creates no entity, proposes none, and recommends against the one it was given permission to propose.**

---

## 5. THE ACCOUNT-VERSUS-PERSON BOUNDARY

### 5.1 The confirmation the mission asked for, and it fails

> **Mission: *"Accounts remain authentication identities, not substitutes for people."***

**Cannot be confirmed. It is violated today, by design, and the design is documented.**

| Evidence | `file:line` |
|---|---|
| *"the authoritative source is the user's profile (users table only)"* | `routes.ts:9034-9035` |
| *"adult eater rows store `[]` **by design** and the profile is the authoritative source"* | `household-dietary-safety.ts:32-34` |
| *"`users.diet_restrictions` (the profile — **authoritative for adults**)"* | `household-dietary-safety.ts:49` |
| **`403` — *"Adult eaters cannot be edited here"*** | `routes.ts:9093` |
| *"Adult members are synced automatically"* (the empty-state the household is shown) | `profile-page.tsx:1139` |

**The account is not merely holding person-facts by accident. It has been named the authority over them, and the eater's write door has been locked to enforce it.**

### 5.2 The two rules that hold, and must survive any change

**Not everything here is broken, and the boundary that matters most is intact.**

1. **`household_members` is authorization and is not confused with personhood.** `getHouseholdForUser(userId)` (`server/lib/household.ts:17-32`) — **152 call sites**, the platform's most-used authorization primitive — derives the household *from* the caller and never accepts a client-supplied `householdId`. **There is no cross-household read path** (`household-read-handler.ts:178`). `server/lib/access.ts` never touches `household_members` at all — it owns only `users.role` and `users.subscriptionTier`. **PKR2's rule that `access.ts` remains the sole authority on who anyone is holds byte-perfect.**
2. **`inviteCode` is excluded from the AI projection** (`household-read-handler.ts:21,58`), asserted by test (`test-intelligence-household-binding.ts:272-273`) — the `capabilities/household.md` open decision was resolved and the resolution held. *(The REST route at `routes.ts:8899` still returns it to members, which is the human UI's documented behaviour and out of scope here.)*

### 5.3 Non-account household members remain first-class — confirmed, with one qualification

**Confirmed at the data layer.** `household_eaters.userId` is nullable; a child's eater row is their canonical owner; their restrictions are unioned into the household safety gate exactly like anyone's (`storage.ts:391-392`, `household-dietary-safety.ts:251-261`).

**The qualification, and it is not small: they are first-class in the *store* and second-class in the *vocabulary*.** They are typed **`"child"`** by `dbEaterToHouseholdEater` (`:107`) regardless of age, **`"guest"`** by the discovery engine (`household-discovery-engine.ts:90-94`), and both words reach the language model. **A live-in grandparent without an account is, to the Companion, a child.**

---

## 6. CONSUMER INVENTORY

**Every service that identifies or reasons about a household person.**

### 6.1 Reaching the language model

| # | Consumer | `file:line` | Person-facts | Store |
|---|---|---|---|---|
| 1 | **`profile:read`** — *baseline, ~90% of turns* | `profile-read-handler.ts:155-156`, `173-174`, **`187-189`** | `dietPattern`, `dietRestrictions`, `dietTypes`, `excludedIngredients`, **the three counts** | `users` + `user_preferences` |
| 2 | **`household:read` `scope=eaters`** | `household-read-handler.ts:132-166`, `220-224` | `displayName`, **`kind`**, `userId`, diets | `household_eaters` + `users` |
| 3 | **`household:read` `scope=household`** | `:205-215`, `120` | `userId`, `displayName` *(username fallback)*, `role`, `status` | `household_members` ⋈ `users` |
| 4 | **`household:read` `scope=dietary-context`** — *every food turn* | `storage.ts:2864-2887` → `household-dietary-safety.ts` | per-member name, pattern, diets, restrictions | **all four stores** |
| 5 | **Meal tailoring** (`gpt-4o-mini`) | `routes.ts:9433-9530` | per-eater `displayName` + diets; **matches the model's reply back by name** (`weekly-planner-page.tsx:3412`) | `household_eaters` (raw — **no enrichment on this path**) |
| 6 | **AI prompt restriction block** | `routes.ts:195-212` | household hard restrictions | via resolver — **fails closed** |
| 7 | **Nutrition enrichment** | `household-nutrition-enrichment.ts:117-118` | **none — de-identified by design** | ✅ *"Name the restriction, never the household member who holds it"* |

> **Four stores reach the model with household-person information, at least two on essentially every turn, from two independently-computed projections that disagree** (§ 3.3, § 3.5).

### 6.2 Not reaching the model

| Consumer | `file:line` | Treats the eater as |
|---|---|---|
| `resolveHouseholdSafetyContext` (**SURF1B — the canonical resolver**) | `household-dietary-safety.ts:163-289` | Diet carrier. Fan-in: `storage.ts:2865`, `routes.ts:210`/`4728`, `meal-service.ts:146`, `planner-compliance.ts:95` |
| `buildHouseholdContext` (the matcher) | `household-meal-matcher.ts:216-278` | Diet carrier — **`getEffectiveDietProfile` computed for every row, discarded for adults** (`:232`) |
| Smart Suggest | `routes.ts:4759-4784` | Diet carrier |
| `HouseholdSafeFor` snapshot | `routes.ts:10072-10090` | **Person** — stable eater ids + guests, persisted as history |
| Household discovery | `household-discovery-engine.ts:42-95` | **Person** — `id: household-member:${uid \|\| eater.id}` |
| Food Intelligence | `food-intelligence/engine.ts:260-285` | Diet carrier — reuses `enrichEater` |
| `household-nutrition.ts` | `:125-147` | **Nobody — household-level, no individuals.** ✅ |
| Planner / Meals / Shopping / Products clients | `weekly-planner-page.tsx:3165`, `meals-page.tsx:1433`, `shopping-workspace-page.tsx:1460`, `products-page.tsx:469` | Person (selection) / diet carrier |

**One unit-of-analysis leak, reported not fixed:** `household-nutrition.ts:137` calls `averageAppleRating` *"**the household's** average"* while `household-nutrition-assembler.ts:118` sources it from `getUserHealthTrends(userId, 90)` — **one requester's trend relabelled as the household's.**

### 6.3 Eater lifecycle — the gaps

| Question | Answer |
|---|---|
| Does signup create an eater row? | **No.** `createUser` (`storage.ts:441-463`) makes a household + owner membership, **never an eater** |
| Does joining a household? | **No.** `joinHousehold` (`:2616-2662`) does not call the sync |
| Then when does an adult's eater row appear? | **Only when someone loads `GET /api/household/eaters`** (`routes.ts:9028`) — a **write during a GET**, the sole production trigger |
| So can a household have members and zero eaters? | **Yes** — and `household-meal-matcher.ts:223`, `household-dietary-safety.ts:216`, `routes.ts:4759`/`9434` all read eaters **without calling the sync**, so they can observe it |
| Is there a `DELETE` route or `deleteHouseholdEater`? | **Neither exists.** An eater added by mistake is permanent (§ 8.3) |
| Does leaving/removal clean up the eater row? | **No** (§ 8.1) |
| Unique constraint on `(householdId, userId)`? | **No** — and `syncMembersAsEaters` is read-then-insert and non-atomic, so **concurrent GETs can duplicate an adult** (`storage.ts:2899-2915`) |

---

## 7. DUPLICATION AND RETIREMENT ANALYSIS

**Principle 8 requires the retirement list in the document proposing the replacement. Nothing here is new — every entry is an existing owner being restored to the position governing architecture already assigned it.**

| # | Target | Count | Why | Step |
|---|---|---|---|---|
| 1 | **`users.dietPattern` / `users.dietRestrictions`** | **2 → 0** | **`ARCHITECTURE_PRINCIPLES.md:38` — *"same scope, must always agree → redundant"*.** Ordered 2026-06-25 | 3, 4 |
| 2 | **The three read-time enrichments** — `routes.ts:9038-9054`, `household-read-handler.ts:132-166`, `household-meal-matcher.ts:245-266` | **3 → 0** | **They exist only because the fact is in the wrong store. They die with the move — they are not migrated** | 5 |
| 3 | **The `dietPattern → dietTypes` "Bridge"** — `routes.ts:756-776` | **1 → 0** | **Principle 7.** One-way, non-transactional, failure-swallowing (§ 3.6) | 5 |
| 4 | **`DIET_PATTERN_TO_DIET_TYPE`** — 5 copies | **5 → 1** | **Rule 4** — no identical file copies | 5 |
| 5 | **`user_preferences.adultsCount` / `childrenCount` / `babiesCount`** | **3 → 0** | A Domain 16 fact at Domain 27's user scope. **= LIFE1 § 14 target #2** — restated, not re-decided | 6 |
| 6 | **`users.eatingSchedule`** | **1 → 0** | **Write-only.** Written (`routes.ts:709`, `:5214`), displayed, **and read by no filter, planner, matcher or gate.** Validated against a 2-value enum and consumed by nothing | 8 |
| 7 | **`kind: "user" \| "child"`** | **1 → 0** | An account question wearing an age word. **= LIFE1 § 14 target #3** — plus the discovery engine's rival `"guest"` (§ 2.1) | 7 |
| 8 | **`household_eaters.displayName` as a frozen copy** | **2 → 1** | One person, two names, two surfaces (§ 3.4) | 1 |

**Retirement condition, every entry:** the replacement is live first. **Nothing is deleted before it.**

**The count that matters:** this list **retires eight duplications and creates zero owners.** Every fact lands on a store that already exists and is already declared authoritative. **No new domain, no new table, no new write funnel** — which is the same sentence TIME3 and LIFE1 each earned, reached here for a different reason: **not because the design was frugal, but because the correct owner was never in doubt.**

---

## 8. DATA AND PRIVACY CONSIDERATIONS

### 8.1 ⚠️ A departed member's live profile is served to the household they left — **the top finding**

**Live. Reachable through two production routes. A data-protection defect, not a hygiene issue.**

**The chain, verified end to end by reading every link:**

1. Alice joins Bob's household. Someone opens the eaters page → `syncMembersAsEaters` (`storage.ts:2892-2917`) creates `{householdId: bob, displayName: "Alice", userId: alice}`.
2. Alice leaves — `POST /api/household/leave` (`routes.ts:8961`) → `leaveHousehold` (`storage.ts:2667-2727`) sets `status: "left"`, creates her a new household, and **never touches `household_eaters`.** *(Identical for `DELETE /api/household/members/:userId` → `removeHouseholdMember`, `:2747-2799`.)*
3. **Alice's eater row remains in Bob's household, with her `userId` still set.**
4. Bob loads `GET /api/household/eaters`. `getHouseholdEaters` (`:2919-2923`) filters on `householdId` **only — no membership join, no status filter** — so Alice's row is returned.
5. `routes.ts:9041` → **`const userRow = await storage.getUser(eater.userId);`** → **Alice's current `dietPattern` and `dietRestrictions`** → `:9053` → served to Bob.

> **Alice's live dietary data — including her allergens, which are health data — is served to a household she has left, indefinitely, and it updates as she changes it.** If Alice declares a nut allergy next year in her own home, **Bob's household sees it.** She remains on his planner, selectable for meals, and visible to his Companion.

**The causal claim, stated precisely.** A stale row surviving a departure is a **lifecycle bug** and would exist under any ownership model. **The ownership inversion is what converts it from a stale record into a live feed.** Had the eater row owned its own facts, Bob would see a frozen copy of what Alice declared *while she lived there* — a retention question worth answering, but **not a continuing read of a stranger's account.**

**One mercy, and it is an accident.** `resolveHouseholdSafetyContext` skips her: her membership is no longer `active` so branch 1 misses her, and branch 2 `continue`s on `userId != null` (`:253`). **So the safety gate does not see her — but the API, the UI, the planner and the Companion all do.** The store that should have forgotten her is the only one that did.

### 8.2 Children's personal data — LIFE1's gap, sharpened

**LIFE1 § 12.1 named it: no governing document in THA addresses minors' data at all.** PEOPLE1 confirms that finding and must correct its framing:

> **LIFE1 gated the gap behind Step 2 — *"a birth date collected before § 12.1 is answered is a minor's personal data gathered without a governing position on minors' personal data."*** **But `household_eaters` already holds a child's name and their allergens, today, in production** — created through `POST /api/household/eaters` (`routes.ts:9064`), reaching the language model on every food turn.

**So the gap is not a precondition of a future step. It is an unowned question about data THA already holds and already sends to a language model.** LIFE1's Step 2 gate remains correct and this document does not weaken it — **it observes that the gate was placed one step too late.** Recorded, not resolved: **it is a legal and product question, and an engineering investigation has no authority to decide it** (LIFE1 § 12.1's reasoning, which is right).

### 8.3 Erasure has no path

**There is no `DELETE /api/household/eaters/:eaterId` and no `deleteHouseholdEater` in the storage layer or `IStorage`.** The only `db.delete(householdEaters)` calls are bulk wipes in seeders (`world-seeder.ts:266`, `import-development-world.ts:457`). An eater row is otherwise removable **only** by cascade from `households.id`.

**Carefully, because the neighbouring claim is *not* false:** `NK1:448` declares `household_eaters` carries *"GDPR **right-to-rectification**; household controls data"*. **Rectification is correction, and correction works** — `PATCH` for children, the profile for adults. **NK1:448 is not falsified.** But **erasure** — a distinct right — has no path at all, for a table that holds minors' names and allergens. **A gap, recorded. Not the same class as LIFE1 § 4's false inventory, and not reported as one.**

### 8.4 A username reaches the language model

`household-read-handler.ts:120` — `displayName: row.user.displayName || row.user.username`. **When `displayName` is null, the account's username is projected into the prompt.** The same fallback is baked permanently into the eater row at creation (§ 3.4). **A login handle is an account fact and should never have been a person's name.**

### 8.5 Deleting an account nukes the household

`deleteUserAccount` (`storage.ts:3459-3462`) deletes **every** `household_members` row for the household and then the household itself — **not just the departing user's.** Eaters cascade away with it.

**Honestly qualified: this is unreachable.** No route calls `deleteUserAccount` — grep returns storage and tests only. **Recorded as a latent trap, not a live defect**, and noted because it is the reason § 8.6 does not currently fire.

### 8.6 `onDelete: "set null"` — the latent trap under the whole design

`household_eaters.userId` is `ON DELETE SET NULL` (`schema.ts:1163`), while `household_members.userId` is `ON DELETE CASCADE` (`:1144`). **If a `users` row were ever deleted while its household survived**, the eater row would persist with `userId = null` — and:

- `kind` flips **`"user"` → `"child"`** (`household-eater.ts:107`);
- `PATCH`'s 403 lifts and the row becomes editable;
- **`household-dietary-safety.ts:252-261` promotes the eater row to canonical owner** — and it holds `[]` *by design*;
- **that person's allergens silently become the empty set**, while they remain a named, plannable eater.

**It cannot fire today** (§ 8.5). **It is recorded because of what it reveals about the design, not because of what it does:** *using `userId != null` as the discriminator of ownership means a foreign key's `ON DELETE` clause can silently reassign the ownership of a safety fact.* **That is the architectural argument against the inversion, stated by the schema rather than by this document.**

---

## 9. RISKS AND ARCHITECTURAL CONSTRAINTS

### 9.1 🔴 A conflict between two governing documents — reported, not resolved

| Document | Status | Position on `users.diet*` |
|---|---|---|
| **`ARCHITECTURE_PRINCIPLES.md`** `:38`, `:124`, `:190-196` | **Governing — Platform** | **Contested. A redundant shadow of `household_eaters`. Retire it** |
| **`capabilities/household.md`** `:36-40` | **Governing — *"Canonical Capability Definition"*** | **The design.** *"eaters — `household_eaters` rows, **enriched at read time**… **from `users.dietPattern` / `users.dietRestrictions`**"* |

**The card does not merely describe the violation — it specifies it as the capability's contract**, and `household-read-handler.ts:131` implements it while citing the card's now-stale line numbers.

**How it resolves, and this document does not perform the resolution.** `ARCHITECTURE_PRINCIPLES.md` is Platform Governance and states the **general law of entity architecture**; a Capability Card is *"required reading before implementing a binding for **that capability**"* (`README.md:101`) and is subordinate to it. **A capability card cannot override a Principle.** So: **the Principles prevail, and the card is the defect** — a correction, not an amendment, exactly as LIFE1 § 15 graded `NK1`. **Routed to Step 2. Not resolved here** — an investigation that rewrote a governing card would be authoring law, which is the boundary LIFE1 § 4.1 refused to cross and this document refuses in the same words.

**The mission's stop condition is not triggered.** It fires when *a proposed change* conflicts with governing architecture. **This document proposes no change**, and its recommendation (§ 4) **agrees with the senior document** and with Register Domain 16. **The conflict pre-exists this investigation by three weeks.**

### 9.2 Constraints any future step must respect

| # | Constraint | Why |
|---|---|---|
| 1 | **The migration moves live allergens.** 21 households carry a live restriction (`household-dietary-safety.ts:33`) | **Not one may be lost.** This is the only retirement in the backlog where a mistake reaches a plate |
| 2 | **The write door must move before the read door.** The profile page writes `users.dietRestrictions` | **Retiring the column before moving the write silently discards a household's declaration** |
| 3 | **`getHouseholdForUser` throws** — 152 call sites, guarded in production (`verify-prod.ts:487-508`) | A person is assumed to always have a household. **Nothing may make that false** |
| 4 | **Retiring the counts changes what the model is told** for every household | LIFE1 § 13 graded this *"Medium — a live model input changes."* Unchanged |
| 5 | **`syncMembersAsEaters` is a write inside a `GET`** and is non-atomic with no unique constraint | Any step that touches it inherits a **duplicate-row race** (§ 6.3) |
| 6 | **SURF1B's fail-closed contract is load-bearing** — *"an unresolved context is not an unrestricted household"* | **It must survive intact.** It is the best thing in this domain |

### 9.3 Gaps recorded, not filled

Per EXPCOMP1 § 4.3 — *"where the canon is silent, record silence as a gap — never fill it"* — and Core Principle 6.

1. **Body metrics** — `heightCm`, `weightKg`, `activityLevel`, `goalType` (`user_preferences:663-666`) are **person-facts at user scope**, and by § 4.2's test they belong to the eater. **Not resolved here.** They are the input to the calculation LIFE2 deleted, they touch LIFE1's § 12.4 deferred facts, and moving them is a governed act with its own legal surface. **Named so that § 4.2's table is honest about what it does not decide.**
2. **`excludedIngredients` is classified inconsistently.** `household-dietary-safety.ts:53-55` declares it a **soft preference, *"never a safety gate"***, while `planner-compliance.ts:102-105` and `routes.ts:4740-4742` **union it into the hard set**. The planner's comment says this is *"a conservative direction, preserved deliberately"* — **honest, and still two documents disagreeing about whether a fact is a safety fact.** Recorded.
3. **Onboarding *moves* allergens between columns.** `promoteSoftAllergies` (`routes.ts:5177-5188`) relocates values from `user_preferences.excludedIngredients` into `users.dietRestrictions` — **so the same declared allergen lives in one column before onboarding's routing and another after.** Recorded.
4. **Minors' data has no governing owner** — § 8.2, inherited from LIFE1 § 12.1 and sharpened. **The top open item, and not an engineering decision.**
5. **Erasure has no path** — § 8.3.
6. **`GuestEater`'s id space.** A guest is entry-scoped with a client-generated UUID; an eater is household-scoped with a serial. **The boundary holds today** (Principle 1's fail test needs the *same* real-world entity, and a guest is explicitly not a household member — `guestEaterToProfile`: *"No override concept exists for guests"*). **But `routes.ts:10073-10090` already merges both into one `HouseholdSafeFor` namespace behind an `isGuest` flag.** No promotion path exists. **Recorded as a watch item: the first "add this guest to the household" feature collides two key spaces.**

### 9.4 Facts deliberately not created

**A global `people` entity** *(§ 4.3 — refused on the merits)* · **any age, birth date or life stage** *(LIFE1 § 13 Step 2, gated by § 8.2)* · **per-eater sex** *(LIFE1 § 12.4)* · **a `kind` or `role` column** *(derived, never stored — § 4.2 rule 1)* · **any link between two households' eater rows** *(§ 4.3)*.

---

## 10. RECOMMENDED ROADMAP

**Nothing here is authorised by this document.** Each step requires its own workstream under `ENGINEERING_WORKFLOW.md`.

| Step | Work | Needs | Risk | Reversible by |
|---|---|---|---|---|
| **0** | **★ Stop the departed-member feed.** An eater row must not outlive its membership as a **live read of a former member's account** (§ 8.1) | **Nothing** | **Low — it removes an exposure** | One call site |
| **1** | **Decide who owns a person's name.** End the frozen copy and the username fallback (§ 3.4, § 8.4) | Nothing | Low | One field |
| **2** | **Correct `capabilities/household.md`.** It ratifies the contested shadow as the capability's contract (§ 9.1). **A correction, not an amendment** | Nothing | None — docs | One doc |
| **3** | **★ Move the write door.** The profile's diet writes → `household_eaters`. Lift the `403`. **The real work** | 2 | **High — live allergens** (§ 9.2) | Reverting the write path |
| **4** | **Retire `users.dietPattern` / `dietRestrictions`.** Contested Domain #4, finally | 3 | Medium | Two columns |
| **5** | **Collapse the enrichments, the Bridge and the five mapping copies.** They exist only because of the split — **they die with it, they are not migrated** | 4 | Low — deletions | Reverting deletions |
| **6** | **Retire the counts** → a projection over eater rows (**= LIFE1 Step 3**) | 3 | Medium — a live model input changes | One call site |
| **7** | **Rename `kind`** → `"account" \| "no-account"`; retire discovery's rival `"guest"` (**= LIFE1 Step 5**) | Nothing | Low | One rename |
| **8** | **Retire `users.eatingSchedule`.** Consumed by nothing (§ 7 #6) | Nothing | Low | One column |

### 10.1 Why this order

- **Step 0 first, and it is not sequenced behind anything.** It is the **only live data-protection defect** in the audit, it needs no migration, no schema change and no legal question answered, and **its fix removes an exposure rather than adding a claim.** TIME2's precedent for exactly this: *"out of band, do not sequence behind Step 0."*
- **Steps 1, 2, 7 and 8 are likewise free** — a name, a document correction, a rename, and a dead column. **None waits for the migration.**
- **Step 3 is the hinge and carries all the risk**, because it is the only step that moves a live allergen. **Step 2 precedes it deliberately**: implementing against a governing card that specifies the violation would put the implementer in conflict with governing architecture on the day they start.
- **Step 5 cannot precede Step 4**, and this is the discipline Principle 8 exists to enforce: **the enrichments are the only thing keeping adults' diets visible while the fact is still in the wrong store.** Delete them first and the platform forgets every adult's allergy. **They are load-bearing scaffolding, and they come down last.**
- **Nothing here waits on § 8.2's legal question** — which is fortunate, and is the same shape LIFE1 found: **every step carrying live harm is on the near side of the gate.**

### 10.2 The recommended next workstream

> **`PEOPLE2` — Step 0: stop serving a departed member's live account data to the household they left.**

**It is the only live data-protection defect this investigation found, it is blocked by nothing, it needs no schema change, and it is reachable through two ordinary production routes today.** Everything else in this document is a duplication that has been safely wrong for three weeks and can be safely wrong for one more.

**Do not start with Step 3**, however obviously correct it is. **Moving a live allergen before the governing card that contradicts the move is corrected (Step 2) means implementing against two governing documents that disagree** — and the one that specifies the violation is the one the handler currently cites.

---

## 11. CONFIRMATIONS THE MISSION REQUIRED

| Confirmation | Verdict |
|---|---|
| **One canonical identity** | ✅ **`household_eaters.id`.** Principle 1's fail test passes; every plannable reference already points at it (§ 3.1) |
| **One owner per fact** | ❌ **FAILS.** A person's hard restrictions have **two owners discriminated by whether they have a login** (§ 3.2). Named a violation by `ARCHITECTURE_PRINCIPLES.md:38` on 2026-06-25 |
| **No duplicate Person entity** | ✅ **None exists, and none is proposed.** `users` and `household_members` are not person entities — they are an account and a right of access. **The global `people` table is refused on the merits** (§ 4.3) |
| **Accounts remain authentication identities, not substitutes for people** | ❌ **FAILS, by documented design.** *"the authoritative source is the user's profile"*; the eater's write door returns **403** (§ 5.1) |
| **Non-account household members remain first-class** | ⚠️ **In the store, yes. In the vocabulary, no** — they are `"child"` to one service and `"guest"` to another, and both words reach the model (§ 5.3) |
| **Life Stage consumes declared facts and never infers them** | ✅ **Holds — nothing changed.** No age, birth date or stage exists to infer from (LIFE1 § 3, confirmed). `HT16`, OBS § 7 and `NK1:418` are obeyed. **This document creates no fact and no inference** |
| **Existing architecture extended before new architecture proposed** | ✅ **No new architecture is proposed at all.** Eight retirements, zero owners created (§ 7) |
| **`household_eaters` is the canonical person-within-a-household record** | ✅ **Yes — and it already was.** Register Domain 16; Principle 1 |
| **It can be progressively enriched for age, life stage and future declared facts** | ✅ **Yes** — § 4.2's test and three rules. **It already holds the full fact set for every person without an account** (§ 4.1) |
| **Whether any required relationship cannot be represented safely** | ✅ **None found.** The hardest case — a child across two households — is **correctly** two rows, and a global person would be **wrong**, not merely unnecessary (§ 4.3) |

---

## 12. COMPLIANCE

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this investigation, as recorded in the run file. `ARCHITECTURE_PRINCIPLES.md`, the SoT Register (D16, D27), `capabilities/household.md`, `capabilities/profile.md`, `REPOSITORY_CONVENTIONS.md`, NK1, and the Household Time architecture read where they bear on people, accounts, or ownership.
- **Principle 1 — one canonical identity per entity:** confirmed satisfied (§ 3.1). The eater's key space is uncontested.
- **Principle 2 — one owner per fact, at scope:** the load-bearing test of this document, applied five times. It **decides** the canonical model (§ 3.2), **refuses** the global person entity (§ 4.3), **preserves** the eater→week override layering as a legitimate distinct scope, and **confirms** `ARCHITECTURE_PRINCIPLES.md:38`'s existing verdict rather than re-deciding it.
- **Principle 3 — progressive enrichment for knowledge entities:** the Household is a named knowledge entity (`:44`); § 4.2 is its enrichment path — identity → declared facts → gaps as gaps.
- **Principle 6 — honest gaps over invented facts:** § 3.3's divergence is graded **structural hazard, not demonstrated production harm**, because the 403 blocks it (§ 3.3); § 8.5/§ 8.6 are graded **latent, unreachable**; § 8.3 is recorded **without** claiming `NK1:448` is false, because it is not.
- **Principle 7 — no permanent synchronisation bridge:** § 3.6 names the bridge the code names itself, and § 7 #2/#3 retire the three read-time enrichments as the same shape.
- **Principle 8 — retire on introduction:** § 7 names **every** target and its condition, in this document, as the rule requires — and § 10.1 states why the scaffolding comes down **last**.
- **Register Rules 1, 2, 3, 4, 5, 8:** SoT confirmed (Domain 16); **no new store proposed**, so Rules 2/3/8 are **not triggered**; Rule 4 fails five ways on `DIET_PATTERN_TO_DIET_TYPE` (§ 7 #4); Rule 5 fails on the three enrichments reading a non-authoritative source (§ 3.3). **Rule 7 — the Register needs no update: this document changes no ownership**, it reports that the platform diverged from ownership the Register already declares.
- **LIFE1 § 13/§ 14:** Steps 3 and 5 and targets #2/#3 are **restated, not re-decided**, and appear here as Steps 6 and 7 with LIFE1 cited as their author.
- **Observation Engine § 7 / `HT16` / `NK1:418`:** obeyed. **Nothing here infers anything about a person.** No behaviour is read; no signal is derived; the household declares or THA does not know.
- **`REPOSITORY_CONVENTIONS.md` § 2/§ 4/§ 7:** the mission's specified path (a loose file at `docs/investigations/`) **violates governing architecture** and would fail `repo-structure-verify.sh` (*"docs/investigations/ has no loose files"*). **Filed under `platform/`** — the deviation TIME2 § 0.2 and LIFE1 § 18 each hit and resolved identically. **Reported, not silently applied.**
- **Investigation indexes:** **not updated — none is required.** `docs/architecture/README.md` indexes **governing architecture only**; investigations are not indexed there, and `docs/investigations/README.md` is a governance index, not a per-file register. **Adding a row would create the second owner of a list that does not exist.**
- **The mission's stop conditions:** honoured. **Nothing implemented. No code modified. No schema modified. No architecture modified. No new Person entity created or proposed.** The duplication and the ownership inversion were found **already live**, and this document retires neither — it names them.
- **This document creates no rule.** It is an investigation: history the moment it is written, never to be read as law. **Where it and any governing document disagree, this document is the defect.**

---

## 13. THE HOUSEHOLD PERSON IN ONE PARAGRAPH

THA already has one canonical person-within-a-household record and it is `household_eaters` — the governing architecture said so on 2026-06-25, naming the eater a major entity with one key space, naming `users.dietPattern`/`dietRestrictions` a redundant shadow of it in the very list of Principle 2's current violations, and setting the target in plain words: *retire the `users.diet*` overlap*. Nobody did. What happened instead is the finding: the platform read the law and built the opposite, carefully, in three separate read-time enrichment paths that reach into the account and paste a person's diet onto their eater row at read time — each with a different merge rule, none agreeing, one of them the Companion's — plus a fourth path the code itself labels a **Bridge**, one-way, non-transactional, and permitted to fail silently, which is the exact artefact Principle 7 exists to forbid. Underneath all four sits a single sentence of the platform's own prose that is the whole investigation in one line — *adult eater rows store `[]` **by design** and the profile is the authoritative source* — and a `403` that closes the eater's write door to enforce it, so that a child's allergy is owned by their eater row while their parent's identical allergy is owned by their login. That is not a risk of accounts becoming substitutes for people; it is accounts *already being* substitutes for people, documented, tested, and ratified by a second governing document — the Household Capability Card — which specifies the shadow as the capability's contract and thereby puts two governing documents in opposite positions on the ownership of a safety fact. The eater table is not short of anything: it already owns the complete fact set for every person without an account, which is the proof of sufficiency, and the test that keeps it from becoming a duplicate user profile is one question — *would this fact still be true of someone who never signs up?* — under which a password, a subscription and a last-login stay on the account and a name, an allergy and a diet go to the table, with `userId` demoted to what it should always have been: a pointer saying *this person can also log in*, never a decider of who owns a fact. The tempting global `people` table is refused not for modesty but on the merits, because every fact THA holds about a person is *declared by a household*, and the child of separated parents is correctly two rows that may legitimately disagree — a global truth about a human being is something THA has no way to establish and no right to assert. And the inversion has already cost something real: because the eater row points at an account instead of owning its facts, a member who leaves is never cleaned up and `GET /api/household/eaters` keeps reading their live profile, so the household they left goes on seeing their current diet and their current allergens, updating as they change them, indefinitely — the safety resolver is the only thing in the platform that forgets her, and it forgets her by accident, because a `continue` on a null check happens to skip her row. So there is nothing here to build. **The work is a retirement the architecture ordered three weeks ago, one write door that has to move first, and one departed person to stop watching.**

---

*An investigation — a point-in-time analysis of the Household Person model against the governing Platform, Intelligence and Data architectures. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Workstream tag: `rollback/PEOPLE1-household-person-model-20260716` → `7d1dd2ce`.*
