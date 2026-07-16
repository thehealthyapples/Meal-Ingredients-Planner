# CONV1 — The Architecture Convergence Programme

## Every place the governing architecture and the platform disagree, and the order in which to end it

**Status:** INVESTIGATION / PROGRAMME — point-in-time analysis and a plan. **Not governing.** History the moment it is written (`docs/architecture/README.md`; PKR1 § 4.4).
**Date:** 2026-07-16
**Workstream:** `CONV1_Architecture_Convergence_Programme`
**Rollback:** `rollback/CONV1-architecture-convergence-programme-20260716` → `7d1dd2ce`
**Built on:** [`ARCHITECTURE_PRINCIPLES.md`](../../architecture/ARCHITECTURE_PRINCIPLES.md) · [`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`](../../architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) · [`CANONICAL_PUBLICATION_ARCHITECTURE.md`](../../architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md) · [`THA_HOUSEHOLD_TIME_ARCHITECTURE.md`](../../architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md) (all governing), with [`PEOPLE1`](../platform/PEOPLE1_HOUSEHOLD_PERSON_MODEL_INVESTIGATION.md) · [`LIFE1`](../platform/LIFE1_LIFE_STAGE_INTELLIGENCE.md) · [`LIFE2`](../../implementation/platform/LIFE2_REMOVE_FABRICATED_AGE_ASSUMPTIONS.md) · [`TIME1`](../platform/TIME1_HOUSEHOLD_TIME_FOUNDATION.md) · [`TIME2`](../platform/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md) · [`HOME3`](../platform/HOME3_THE_TWO_CURRENT_WEEKS.md) · [`CPI1`](../platform/CPI1_CANONICAL_PUBLICATION_INTEGRITY_AUDIT.md) read as history.
**Scope:** Planning and governance only. **Nothing implemented. No code, no schema, no architecture modified.**

---

## 0. THREE DECLARATIONS THE MISSION REQUIRES FIRST

### 0.1 The specified path violates governing architecture

The mission specified `docs/investigations/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md` — a loose file at the directory root. That path is forbidden by `REPOSITORY_CONVENTIONS.md` § 3 (`:47`) and § 4 (`:74`), restated by `docs/investigations/README.md`, and **mechanically enforced**:

```sh
# .engineering/scripts/repo-structure-verify.sh:52-54
inv_loose="$(find docs/investigations -maxdepth 1 -type f ! -name 'README.md' | wc -l)"
[ "$inv_loose" -eq 0 ]
```

**Following the mission literally would have failed the repository structure gate.** Filed at `docs/investigations/governance/` — the folder that already holds the Core Architecture Principles and the Source of Truth Register investigations, which is exactly this document's class. **Reported, not silently applied.** TIME2 § 0.2, LIFE1 § 18 and PEOPLE1 § 12 each hit this and resolved it identically.

### 0.2 This programme is not governing, and it cannot be

An investigation cannot govern (`docs/architecture/README.md:4`). **CONV1 plans convergence; it does not decree it.** Every item below is a recommendation requiring its own workstream under `ENGINEERING_WORKFLOW.md`. Where this document and any governing document disagree, **this document is the defect**.

**It creates no rule and no owner.** Every convergence named here restores a fact to an owner the governing architecture *already* declared. That is the programme's defining property and its most reassuring one (§ 3.9).

### 0.3 GOVTIME1 does not exist

The mission names GOVTIME1 as required reading. **There is no such document and no such run file.** Its governance function was performed by **TIME3**, which promoted `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` on 2026-07-16. That document was read in full in its place — including its § 14 retirement list and its § 17 *DECLARED, NOT BUILT* status. LIFE1's run file records the identical finding.

### 0.4 What was verified rather than inherited

**Every load-bearing claim below was re-checked against the current working tree, not taken from the investigation that first reported it.** This matters: the investigations are days old, and three of CPI1's findings have since been closed. Two consequences worth stating:

- **Three CPI1 findings are FIXED and are not in this backlog** — the dropped allergens (§ 3.1 below), the 30-plants over-count, and the bug-preserving CI fixture. Reporting them as live would have been the easiest error available.
- **One retired investigation's claim was checked and *survives***. TIME2 § 9.4 #11's citation is `migrations/runner.ts:74`; the real path is **`server/migrations/runner.ts:74`**, and it does say `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ`. The claim is correct and the path was mis-cited. **It is recorded here with the corrected citation** (§ 5, `SEC-2`).

---

## 1. EXECUTIVE SUMMARY

### 1.1 The headline

> **THA's convergence problem is not that it does not know. It is that everything it knows is written in prose, and every gate it owns reads code.**

The platform holds an extraordinary asset: four investigations in the last three days, and a platform-wide audit before them, have located essentially every divergence between the governing architecture and the implementation, with `file:line` citations. **Almost none of it is wired to anything that stops the drift.**

And the proof is not rhetorical. It is executable, and it was run for this document:

```
$ npm run verify:publication
Domains: 22 — 🟢 5 healthy · 🟡 11 need attention · 🔴 6 publication failure
Checks:  60 run — 24 passed, 24 warned, 12 failed, 0 skipped
RESULT: FAIL — 6 domain(s) in publication failure
```

> **THA ships a canonical publication gate. It has been red since the day it was built.** Every check in it carries a `cpi1:` back-reference to the audit finding that produced it. **CPI1's findings were turned into executable checks — and then the checks were left failing.** That is a better problem than not knowing, and it is a worse one than it looks: a gate that is always red teaches everyone to ignore it.

### 1.2 The finding that names the gap

The gate's own output contains the sharpest sentence in this document:

```
 ✓ [PASS] The Source of Truth Register agrees with the owners it governs (CPI1 §4.4)
     No known register drift detected.
```

**That check passes. And the Source of Truth Register currently declares, in two places, that `users.dietPattern` and `users.dietRestrictions` are the source of truth for a person's diet — while `ARCHITECTURE_PRINCIPLES.md:38` names those same two columns a redundant shadow that must be retired.**

> **The gate that checks whether the Register is right cannot read the Register.** It verifies projections against owners. It cannot see two governing documents holding opposite positions, because that divergence is made of sentences.

This is the structural finding, and it sorts the whole backlog:

| Divergence class | Can THA detect it mechanically? | Gate |
|---|---|---|
| **Projection ≠ owner** | ✅ **Yes** | `npm run verify:publication` — 22 domains, **red** |
| **Schema ≠ migration** | ✅ **Yes** | `npm run verify:schema-coverage` — **51%**, red |
| **Authored ≠ adopted** | ✅ **Yes** | `npm run adoption:check` — 2 failures |
| **Document ≠ document** | ❌ **No. Nothing.** | **None exists** |
| **Document ≠ code** | ❌ **No. Nothing.** | **None exists** |

**Every 🔴 item in this backlog was produced by the two classes THA cannot detect.** Not one was found by a gate. Every one was found by a human asking an investigation to go and look.

### 1.3 The second finding: the canon contradicts itself, four ways, on its most safety-relevant fact

PEOPLE1 § 9.1 reported **two** governing documents in conflict over who owns a person's allergy. **It is four positions across three documents, and the Register contradicts itself:**

| # | Document | Status | Position on `users.dietPattern` / `users.dietRestrictions` |
|---|---|---|---|
| 1 | `ARCHITECTURE_PRINCIPLES.md:38`, `:124`, `:190-196` | **Governing — Platform** | **A redundant shadow of `household_eaters`. Retire it.** Ordered 2026-06-25 |
| 2 | Register **Domain 7** (`:175-176`) | **Governing** | **"Contested"** — *"`users.dietPattern` + `users.dietRestrictions` **vs `user_preferences`**"* |
| 3 | Register **Phase 4 Retirement Register** (`:569`) | **Governing** | **"Retain."** *"Mark them as **the SoT** until `user_preferences` is promoted"* |
| 4 | Register **Appendix A** (`:857`) | **Governing** | *"Dietary Preferences (user) \| **DB `users.dietPattern` + `users.dietRestrictions`**"* — declared, unqualified |
| 5 | `capabilities/household.md:38-40` | **Governing — Capability Card** | **The design.** Eaters *"enriched at read time… from `users.dietPattern` / `users.dietRestrictions`"* |

**And CONV1's contribution is the thing that makes this worse than a contradiction.** Look at rows 1 and 2:

> **Principle 2 says the rival is `household_eaters`. The Register says the rival is `user_preferences`. They are not arguing about the same thing.**

> **An engineer instructed to "resolve Domain 7" would read the Register, promote `user_preferences`, retire the `users` columns into it, mark the domain converged — and never touch `household_eaters` at all.** They would have converged onto the wrong owner, closed the ticket, and left Principle 2's actual violation entirely intact. **The contest is not merely unresolved. It is mis-specified**, and the mis-specification is in the senior register.

### 1.4 The shape of the work

**Across 24 convergence candidates: zero new owners, zero new domains, zero new stores.** Every item restores a fact to a store the governing architecture already declares authoritative. This is the fourth consecutive investigation to reach that number, and here it is a *census* result rather than a design choice:

> **THA does not have an architecture problem. It has an obedience problem.** The law is right almost everywhere it was checked. What is missing is the mechanism that notices when the code stops obeying it.

### 1.5 The five shapes of divergence

The prior investigations each landed on one sentence about their domain. Placed side by side, they are a taxonomy — and it is the most useful thing this programme inherits:

| Investigation | Shape |
|---|---|
| **TIME1 / TIME3** | *The law was right and the platform was behind it.* |
| **NORTH2 / EXPCOMP2** | *The canon was right and the render was wrong.* |
| **LIFE1** | *A governing document was factually wrong about the system.* |
| **PEOPLE1** | *The law was right, the platform read it, and built the opposite — and a second governing document ratified the opposite.* |
| **CPI1** | *The owners are sound; the publication is unverified.* |
| **CONV1** | ***The findings became executable, and the gate was left red.*** |

**These are not five instances of one problem. They are five different problems needing five different fixes**, and § 2's principles exist to stop them being treated as one backlog of "tech debt".

---

## 2. CONVERGENCE PRINCIPLES

**None of these is new law.** Each is an existing rule, cited to its owner, restated as a *programme* discipline. A principle here that had no owner would be this document authoring architecture, which § 0.2 forbids.

| # | Principle | Owner it comes from |
|---|---|---|
| **CP1** | **Convergence restores; it never creates.** Every item lands a fact on a store already declared authoritative. An item that needs a *new* owner is not a convergence — it is a governed act under Register Rule 8. | Principle 8; Register Rule 8 |
| **CP2** | **The scaffolding comes down last.** The read-time enrichments, the bridges and the fallbacks are the only things keeping the wrong-store facts visible. Delete them first and the platform forgets every adult's allergy. | Principle 8; PEOPLE1 § 10.1 |
| **CP3** | **The write door moves before the read door.** Retiring a column before relocating its write silently discards a household's declaration. | PEOPLE1 § 9.2 |
| **CP4** | **Correct the document before implementing against it.** Where two governing documents disagree, an implementer must not choose. Correcting the junior document is a *precondition*, not a follow-up. | PEOPLE1 § 10.1; README § Compliance |
| **CP5** | **All of it, or none of it.** A consumer that takes half an owner's contract and keeps its own arithmetic compares the household against two calendars at once. **Half-converged is worse than unconverged.** | `HT11` |
| **CP6** | **`MUST NOT` is a verdict, not a backlog.** Five domains are correct *because* they are INSTANT. A sweep that "converges" them is a new defect wearing a canonical badge. | `HT9`, `HT10` |
| **CP7** | **Nothing derived is stored.** A cache over a moving fact is a permanent sync bridge. Determinism, not memoisation. | `HT3`; Principle 7 |
| **CP8** | **Honest gaps over invented facts.** A back-filled anchor, a guessed age, a defaulted zone without provenance — each is indistinguishable from knowledge, which is what makes it worse than absence. | Core Principle 6; `HT7` |
| **CP9** | **Declare before building.** An owner is declared, then built. This is why `shared/time/household-time.ts` is law before it is code. | CPuBA § Transition Rules; TIME3 § 17 |
| **CP10** | **A convergence is finished when a gate can fail.** Prose cannot hold a convergence. If the item cannot end in a check, it will regress and nobody will know. | CPuBA5; `HT18`; **the whole of § 1.1** |

### 2.1 The one principle this programme adds to its own conduct

> **CP11 — Report the grade the evidence supports, not the grade the finding deserves.**

TIME2 graded two auth defects 🔒 **Security**. Re-checked at source, they are **real and latent** — the drift equals the Node process's UTC offset, and the platform's containers default to UTC, so the exposure is masked rather than absent (§ 5, `SEC-2`/`SEC-3`). **They are recorded as latent, not exploitable-as-deployed.** A programme that inflates its own severities is a programme nobody sequences by.

---

## 3. THE CONVERGENCE BACKLOG

**24 items.** Each carries the mission's nine fields and exactly one classification. **Priority is by harm and blocking, not by domain.**

**Classification key:** `DOC` documentation · `BEH` behaviour · `OWN` data ownership · `READ` read-path · `WRITE` write-path · `SCHEMA` schema · `SEC` security / privacy.

**Legend — verification:** ✅ verified at source for this document · 📋 inherited from a cited investigation, not re-verified.

---

### TIER 0 — SECURITY, PRIVACY AND TRUST (§ 5 states why these precede convergence)

---

#### `SEC-1` — A departed member's live account data is served to the household they left ✅

| Field | Value |
|---|---|
| **Classification** | 🔒 **SECURITY / PRIVACY CONVERGENCE** |
| **Governing architecture** | Principle 2 (one owner per fact, at scope); `EXP ARCH § 12` (*"Data belongs to the household… no dark corners"*); `NK1:448` (household_eaters — GDPR posture) |
| **Current implementation** | `leaveHousehold` (`storage.ts:2666-2724`) and `removeHouseholdMember` (`:2747-2798`) **never reference `householdEaters`** — verified by reading both in full. The orphaned eater row keeps its `userId`. `getHouseholdEaters` (`:2919-2923`) filters on `householdId` **only — no membership join, no status filter**. `routes.ts:9041` then runs `await storage.getUser(eater.userId)` and serves that account's **current** `dietPattern` / `dietRestrictions` to the household |
| **Nature of the divergence** | A lifecycle gap **converted into a live feed by the ownership inversion**. A stale row would be a bug under any model; because the row *points at an account* instead of owning its facts, the household reads a stranger's profile as it changes |
| **Canonical owner** | `household_eaters` — Register Domain 16 |
| **Risk** | 🔴 **Highest in the programme.** Health data (allergens) disclosed to a party with no relationship to the data subject, indefinitely, updating |
| **User impact** | A person who left a household remains on its planner, selectable for meals, visible to its Companion — **and their current allergens are visible to people they left.** If they declare a nut allergy next year in their own home, their former household sees it |
| **Architectural impact** | **None.** No document changes. It is the existing architecture being obeyed |
| **Dependencies** | **None.** Needs no schema change, no migration, no legal question answered |
| **Convergence strategy** | Reap or sever the eater row when membership ends, **or** filter `getHouseholdEaters` on active membership. Prefer the filter first: it removes the exposure in one call site without deciding the retention question |

> **One mercy, and it is an accident.** `resolveHouseholdSafetyContext` skips her — her membership is not `active`, and branch 2 `continue`s on `userId != null`. **The safety gate is the only thing in the platform that forgets her, and it forgets her by coincidence.** The API, the UI, the planner and the Companion all still see her.

---

#### `SEC-2` — `password_reset_expires`: the schema declares naive; the database is `TIMESTAMPTZ` ✅

| Field | Value |
|---|---|
| **Classification** | 🔒 **SECURITY / PRIVACY CONVERGENCE** *(latent — see CP11)* |
| **Governing architecture** | Register Rule 1 (a named source of truth); CPuBA7 (changes stay within the publication contract) |
| **Current implementation** | `shared/schema.ts:28` — `passwordResetExpires: timestamp("password_reset_expires")`, **no `withTimezone`**. `server/migrations/runner.ts:74` — `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ`. **The declaration and the physical column disagree.** Written at `storage.ts:1537`, compared at `auth.ts:413` |
| **Nature of the divergence** | **Schema ≠ database on a security token expiry.** Drizzle round-trips a naive `timestamp` through process-local time; the physical column is zone-aware. The delta is the Node process's UTC offset |
| **Canonical owner** | `shared/schema.ts` (Domain 26 / auth) |
| **Risk** | 🟡 **Latent, masked.** Zero under a UTC container — the normal default. Non-zero otherwise, and the **sign decides the direction**: early expiry is a lockout, late expiry is **an extended security window on a password-reset token** |
| **User impact** | None observable today. On any non-UTC deployment, reset tokens expire at the wrong instant |
| **Architectural impact** | None — a declaration correction |
| **Dependencies** | **None.** Explicitly out of band (TIME2 § 10 — *"do not sequence behind Step 0"*) |
| **Convergence strategy** | Add `{ withTimezone: true }` to match the physical column. Verify against the live DDL, not against the schema file |

---

#### `SEC-3` — `email_verification_expires` has no migration, so two identical declarations produce two different physical types ✅

| Field | Value |
|---|---|
| **Classification** | 🔒 **SECURITY / PRIVACY CONVERGENCE** *(latent)* |
| **Governing architecture** | CPuBA § 4.1 (the schema must be rebuildable); Register Rule 1 |
| **Current implementation** | `shared/schema.ts:23` declares `emailVerificationExpires: timestamp(...)`. **Grep across `server/migrations/` and `migrations/` returns zero hits** — verified. It exists only via `drizzle-kit push`, therefore as naive `TIMESTAMP` |
| **Nature of the divergence** | **The sharpest form of `SEC-2`.** These two sibling columns are declared **byte-identically** in `schema.ts` — and are **physically different types** in the database, because one has an `ALTER` and the other does not. The declaration no longer predicts the column |
| **Canonical owner** | `shared/schema.ts` |
| **Risk** | 🟡 Latent, masked by UTC. **But it is the tell for `SCH-3`**: it is what 51% migration coverage looks like at one column |
| **User impact** | None today |
| **Architectural impact** | None |
| **Dependencies** | **None.** Fix with `SEC-2`, in one change |
| **Convergence strategy** | One migration creating both columns explicitly, and align both declarations. **Do not fix one and leave the other** — the pair is the evidence |

---

#### `SEC-4` — `/api/uplift/accept` accepts any rule id a caller invents, and stamps it as reviewed ✅

| Field | Value |
|---|---|
| **Classification** | ✍️ **WRITE-PATH CONVERGENCE** *(trust-critical — sequenced in Tier 0)* |
| **Governing architecture** | CPuBA3 (knowledge gates on evidence — `reviewedAt` + `reviewedBy`); CPuBA4 (one write funnel); Core Principle 6 |
| **Current implementation** | `client/src/pages/weekly-planner-page.tsx:337` mints `fallback-deterministic-boosts` — a rule identity that exists **nowhere in `server/`**. It flows `buildFallbackUpliftMatch:304` → `buildMergedMatches:363` → `MealUpliftPanel.tsx:198` → `POST /api/uplift/accept` (`routes.ts:11088`), which persists the caller's `ruleId` **with no validation against `UPLIFT_RULES`** (`:11163`). **Every row is stamped `added_by: 'tha_uplift'`.** The publication gate found **8 live rows** citing the phantom rule |
| **Nature of the divergence** | **A client publishes into a server-owned projection under a false provenance stamp**, bypassing the `reviewedAt` evidence gate entirely. Two of THA's seven laws fail at once: *no duplicate runtime identity* and *no duplicate publication paths* |
| **Canonical owner** | `server/lib/uplift-rules.ts` — Register Domain 17 |
| **Risk** | 🔴 **High, and it is a trust risk rather than a correctness one.** A client-invented, never-reviewed nutrition suggestion is **indistinguishable in the database from a human-reviewed engine rule** |
| **User impact** | Households receive nutrition boost suggestions presented as THA's reviewed guidance which no reviewer ever saw. **Trust is the product** (Principle 6) |
| **Architectural impact** | None — the owner is correct and uncontested. This is the owner being bypassed |
| **Dependencies** | **None** |
| **Convergence strategy** | **Validate `ruleId` server-side at `routes.ts:11163` first**, then delete the client constant. **This order matters and CONV1 differs from CPI1 here:** deleting the client constant closes today's leak and leaves the endpoint accepting any id any caller invents. **The endpoint is the defect; the client is only its first exploiter** |

---

### TIER 1 — THE GOVERNANCE CORRECTIONS (free, and they unblock everything)

---

#### `DOC-1` — The canon holds four positions on who owns a person's diet, and the Register mis-names the rival ✅

| Field | Value |
|---|---|
| **Classification** | 📄 **DOCUMENTATION CONVERGENCE** |
| **Governing architecture** | `ARCHITECTURE_PRINCIPLES.md:38` — *"`users.dietPattern`/`users.dietRestrictions` shadowing `household_eaters` (same scope, must always agree → redundant)"*; `:190-196` — *"Retire the `users.diet*` overlap"* |
| **Current implementation** | The four rival positions of § 1.3 — including the Register declaring the columns **the SoT** at Phase 4 (`:569`) and Appendix A (`:857`) while Principle 2 names them a shadow to retire, **and Domain 7 (`:175`) naming the rival as `user_preferences` rather than `household_eaters`** |
| **Nature of the divergence** | **Document ≠ document, inside one document.** The Register is internally inconsistent (Domain 7 *"Contested"* vs Phase 4 *"Retain… the SoT"*), and **inconsistent with the senior document about what the contest even is** |
| **Canonical owner** | `ARCHITECTURE_PRINCIPLES.md` — Platform Governance. **A Capability Card cannot override a Principle** (`README.md:101`); nor can a Register phase table. **The Principles prevail; the others are the defect** |
| **Risk** | 🔴 **The highest-leverage item in the programme.** It is the reason `OWN-1` has not moved in three weeks: **an implementer reading the canon today receives instructions to retire the columns, retain them as the SoT, and build read-time enrichment from them** |
| **User impact** | None directly — and that is exactly why it has survived |
| **Architectural impact** | **Three corrections, zero amendments.** No rule changes. The Principles are already right |
| **Dependencies** | **None** |
| **Convergence strategy** | Correct Register Domain 7 to name the real rival (`household_eaters`), Phase 4's *"Retain… the SoT"* ruling, Appendix A's row, and `capabilities/household.md:38-40` — **to say what `ARCHITECTURE_PRINCIPLES.md` has said since 2026-06-25.** A **correction, not an amendment**: the rules were never wrong; the inventory is |

> **Why this is Tier 1 and not Tier 3.** It is free, it is documentation-only, and **it is the precondition of the single largest convergence in the platform.** Beginning `OWN-1` before it means implementing against two governing documents that disagree — and the one specifying the violation is the one the handler currently cites (`household-read-handler.ts:131`).

---

#### `DOC-2` — `NK1` asserts a safety-relevant field is stored and Authoritative; the column does not exist 📋

| Field | Value |
|---|---|
| **Classification** | 📄 **DOCUMENTATION CONVERGENCE** |
| **Governing architecture** | `NK1:73`, `:139`, `:535` — *"Eater Composition \| DB `household_eaters` \| Name, **age**, dietary restrictions \| **Authoritative**"* |
| **Current implementation** | `shared/schema.ts:1158-1168` is `id`, `householdId`, `displayName`, `userId`, `defaultDietTypes`, `hardRestrictions`. **There is no age column and there never has been** |
| **Nature of the divergence** | **Document ≠ code — a *false inventory*, and a class of its own.** Not a law ahead of its platform: a governing document **factually wrong about the system it governs**, over-claiming *authority* over a **safety-relevant field** |
| **Canonical owner** | `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` |
| **Risk** | 🟡 **Medium, asymmetric.** *"A law ahead of its platform costs nothing but patience. A false inventory costs trust the moment somebody believes it"* (LIFE1 § 4). An engineer writing a **safety** rule that assumes the column may not notice until it is live — **the honest failure mode of a missing field is `undefined`, and `undefined` fails open** |
| **User impact** | None today. Latent |
| **Architectural impact** | **A correction, not an amendment.** The rules are unchanged; the inventory is wrong. Also resolve the dangling `NK1:418` §6.3 — **the canon's only per-child prohibition cites a section that does not exist** |
| **Dependencies** | **None** |
| **Convergence strategy** | Replace the three false *age / Authoritative* claims with the honest gap. **Resolve or remove the §6.3 pointer — do not invent the missing section** (that would be filling a silence, LIFE1 § 4.1) |

---

#### `DOC-3` — The false `dayOfWeek` comment sits on the fabricated-date line 📋

| Field | Value |
|---|---|
| **Classification** | 📄 **DOCUMENTATION CONVERGENCE** |
| **Governing architecture** | `HT8` — *"`dayOfWeek` is `0 = Sunday`. Declared, never renumbered"* |
| **Current implementation** | `routes.ts:11371` — `// dayOfWeek: 0 = Monday in plannerDays convention`. **False**, and contradicted by `routes.ts:7431` in the same file |
| **Nature of the divergence** | A comment asserting the inverse of the platform's real key space, **sitting directly on the line that consumes it** (`BEH-4`, `BEH-5`) |
| **Canonical owner** | `shared/time/household-time.ts` (declares the key space) — **does not exist yet** (`OWN-4`) |
| **Risk** | 🟢 Low in itself; **it is the seed of two live defects** |
| **User impact** | None directly |
| **Architectural impact** | None |
| **Dependencies** | **None.** One line |
| **Convergence strategy** | Correct the comment. Out of band — do not sequence it behind Household Time |

---

#### `DOC-4` — The Product Knowledge architecture says `docs/product/` does not exist; it holds 151 files 📋

| Field | Value |
|---|---|
| **Classification** | 📄 **DOCUMENTATION CONVERGENCE** |
| **Governing architecture** | `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md:896-942` — *"`docs/product/` does not exist"*, *"no capability registered"*, *"Current Convergence 0%"* |
| **Current implementation** | All three false. 151 files, 154 entries, capability live |
| **Nature of the divergence** | **A domain's own architecture is stale about the domain — while the Register is right.** A clean inversion of the document's own Rule PKR15 |
| **Canonical owner** | The Product Knowledge Registry architecture |
| **Risk** | 🟢 Low — misleads a reader, not the Companion |
| **User impact** | None |
| **Architectural impact** | A currency correction — **exactly the `KC14` failure mode the document itself named** |
| **Dependencies** | None |
| **Convergence strategy** | Correct the status block. Bundle with `DOC-1`/`DOC-2` as one governance-correction workstream |

---

### TIER 2 — THE HOUSEHOLD PERSON (the largest single convergence)

---

#### `OWN-1` — A person's allergy has two owners, discriminated by whether they have a login ✅

| Field | Value |
|---|---|
| **Classification** | 🗄️ **DATA OWNERSHIP CONVERGENCE** |
| **Governing architecture** | Principle 1 (the **eater** is a named major entity); Principle 2 (`:38` — *same scope, must always agree → redundant*); Register **Domain 16** |
| **Current implementation** | *"Adult rows in `household_eaters` store empty arrays **by design**; the authoritative source is the user's profile"* (`routes.ts:9034-9035`). The eater write door **403s on adult rows** (`routes.ts:9093` — verified). `household-dietary-safety.ts:33` — *"a partial mirror that is **empty for 10 of the 21 households that carry a live restriction**"* |
| **Nature of the divergence** | **The law was read and the opposite was built.** A child's allergy is owned by their eater row; their parent's identical allergy is owned by their account. **Same fact, same scope, same class of human, two owners, discriminated by authentication** |
| **Canonical owner** | **`household_eaters`** — Register Domain 16. *(Already declared. Not a new decision, and not CONV1's to make)* |
| **Risk** | 🔴 **High — the only convergence where a mistake reaches a plate.** 21 households carry a live restriction; **not one may be lost** |
| **User impact** | Today: the inversion is what makes `SEC-1` a live feed rather than a stale row. The A/C merge divergence (`READ-1`) is **blocked from production by the 403** — a structural hazard, **not a demonstrated harm** |
| **Architectural impact** | **Zero new owners.** Register Rule 7 is *not* triggered: ownership does not change — the platform diverged from ownership the Register already declares |
| **Dependencies** | **`DOC-1` first** (CP4). Then the write door (`WRITE-2`) before the columns |
| **Convergence strategy** | PEOPLE1 § 10 Steps 3→4→5: move the write door, retire the columns, then collapse the scaffolding. **Never the reverse** (CP2, CP3) |

---

#### `WRITE-1` — The Bridge: one-way, non-transactional, and permitted to fail silently ✅

| Field | Value |
|---|---|
| **Classification** | ✍️ **WRITE-PATH CONVERGENCE** |
| **Governing architecture** | **Principle 7** — *"A bridge that keeps two owners in sync → this is debt to converge away, not formalise"* |
| **Current implementation** | `server/routes.ts:756` — `// Bridge: sync users.diet_pattern → user_preferences.diet_types.` Write at `:771`; failure swallowed at `:772-775` (*"profile save succeeds even if the bridge write fails"*). **The publication gate names it: *"the platform's only self-confessed permanent synchronisation bridge"*** |
| **Nature of the divergence** | **Principle 7 is one sentence and this is the shape it forbids** — and the code calls itself *Bridge*. One-way (`PUT /api/user/preferences` never updates `dietPattern`), non-transactional, failure-swallowing |
| **Canonical owner** | `household_eaters` (per `OWN-1`) |
| **Risk** | 🔴 **The split-brain is live, through two production routes.** Set `dietPattern: "Vegan"`, then `PUT /api/user/preferences` with `dietTypes: ["flexitarian"]` — the account declares both, and two read paths report **`["vegan"]`** and **`["flexitarian"]`** for the same person **in the same prompt** |
| **User impact** | The Companion can hold two contradictory diets for one person in one turn |
| **Architectural impact** | **`ARCHITECTURE_PRINCIPLES.md:192`'s grade is out of date.** It reads *"Currently no live split-brain, but risk is structural."* **The split-brain is live.** Correct with `DOC-1` |
| **Dependencies** | Dies with `OWN-1`. **It is not migrated — it is deleted** |
| **Convergence strategy** | Delete at Step 5, **after** the columns retire (CP2). It is load-bearing scaffolding until then |

---

#### `WRITE-2` — The eater's write door is closed by a 403 ✅

| Field | Value |
|---|---|
| **Classification** | ✍️ **WRITE-PATH CONVERGENCE** |
| **Governing architecture** | Principle 2; Register Domain 16 |
| **Current implementation** | `routes.ts:9093` — `if (target.userId !== null) return res.status(403).json({ message: "Adult eaters cannot be edited here" })` — verified |
| **Nature of the divergence** | **The inversion is not passive. The correct owner's write door is locked to enforce the incorrect one** |
| **Canonical owner** | `household_eaters` |
| **Risk** | 🔴 High — **it is the hinge.** The only step that moves a live allergen |
| **User impact** | Today, a household cannot correct an adult's allergen on the eater that owns it |
| **Architectural impact** | None — it removes an enforcement of a violation |
| **Dependencies** | **`DOC-1`.** Blocks `OWN-1` entirely |
| **Convergence strategy** | Move the profile's diet writes to `household_eaters`; lift the 403. **The real work, and it carries all the risk** |

---

#### `READ-1` — Three read-time enrichment paths, three merge rules, none agreeing 📋

| Field | Value |
|---|---|
| **Classification** | 👁️ **READ-PATH CONVERGENCE** |
| **Governing architecture** | Principle 4 (*one assembled model per entity; never re-resolve*); Register Rule 5 |
| **Current implementation** | `routes.ts:9051` — `users.dietRestrictions` **only**, eater row discarded. `household-read-handler.ts:156` — **only**, discarded. `household-dietary-safety.ts:239-242` — **unioned**. `household-meal-matcher.ts:261` — **only**, discarded. **Four paths, three rules.** `household-read-handler.ts:95-97` claims it uses *"the same mapping table"* as the others — **true of the table, false of the rule** |
| **Nature of the divergence** | **The enrichments exist only because the fact is in the wrong store.** They are the symptom, not the disease |
| **Canonical owner** | `household_eaters` |
| **Risk** | 🟡 **Structural hazard, not demonstrated harm** — the 403 blocks the divergence in production; it is live in benchmark and development worlds only (seeders bypass the door). **Graded honestly** |
| **User impact** | None demonstrated. It is a loaded gun: the day the 403 lifts without the fact moving, the paths diverge in production |
| **Architectural impact** | **They die with the move. They are not migrated** |
| **Dependencies** | `OWN-1` complete |
| **Convergence strategy** | Delete all three at Step 5. **Last** (CP2) |

---

#### `READ-2` — `DIET_PATTERN_TO_DIET_TYPE` exists in five copies 📋

| Field | Value |
|---|---|
| **Classification** | 👁️ **READ-PATH CONVERGENCE** |
| **Governing architecture** | **Register Rule 4** — *"No identical file copies. Server+client shared modules must live in `shared/`"* |
| **Current implementation** | `routes.ts:525` · `household-meal-matcher.ts:16` · `household-read-handler.ts:100` · `sim-slot-fill.ts:16` · `test-diet-reconciliation-bridge.ts:40` |
| **Nature of the divergence** | **Rule 4 fails five ways** |
| **Canonical owner** | One module in `shared/` |
| **Risk** | 🟢 Low — semantically identical today |
| **User impact** | None today; a correction to one is a silent split-brain |
| **Architectural impact** | None — a move |
| **Dependencies** | Cheapest with `READ-1` |
| **Convergence strategy** | Collapse to one `shared/` module at Step 5 |

---

#### `WRITE-3` — `syncMembersAsEaters` is a write inside a `GET`, non-atomic, with no unique constraint 📋

| Field | Value |
|---|---|
| **Classification** | ✍️ **WRITE-PATH CONVERGENCE** |
| **Governing architecture** | CPuBA4 (exactly one write funnel) |
| **Current implementation** | `storage.ts:2899-2915` — read-then-insert, non-atomic. **No unique constraint on `(householdId, userId)`.** The **sole** production trigger for an adult's eater row is someone loading `GET /api/household/eaters` (`routes.ts:9028`). Signup does not create one; joining does not either |
| **Nature of the divergence** | A **write during a GET**, racing itself, into a table with no uniqueness guard. **Concurrent GETs can duplicate an adult** |
| **Canonical owner** | `household_eaters` |
| **Risk** | 🟡 Medium — a household can hold members and **zero** eaters, and four services read eaters without calling the sync |
| **User impact** | A duplicated person on the planner; a household whose eaters silently do not exist |
| **Architectural impact** | Any step touching the sync inherits the race |
| **Dependencies** | Independent, but **`OWN-1` must not be built on top of it** |
| **Convergence strategy** | Add the unique constraint; move creation to the membership event. **A precondition of `WRITE-2`, not a follow-up** |

---

### TIER 3 — HOUSEHOLD TIME (declared, not built)

---

#### `OWN-4` — The declared owner of household time does not exist ✅

| Field | Value |
|---|---|
| **Classification** | 🗄️ **DATA OWNERSHIP CONVERGENCE** |
| **Governing architecture** | `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` — **in force since 2026-07-16**. `HT1`; Register Appendix A |
| **Current implementation** | **`shared/time/household-time.ts` does not exist** — verified: no `shared/time/` directory anywhere. **Every consumer reads its own private clock.** Five frames live: UTC · server-process-local · browser-local · noon-anchored-local · week-index |
| **Nature of the divergence** | **Not a defect — the sanctioned order** (CP9). *"What is in force today is the law, not the code"* (TIME3 § 17). **From 2026-07-16 an implementation that invents a today is in violation whether or not the module exists** |
| **Canonical owner** | `shared/time/household-time.ts` — declared, Phase 1 |
| **Risk** | 🔴 **The programme's highest structural risk is that this stalls** (§ 6, `R1`). A declared owner nobody builds becomes a **21st time implementation with better manners** |
| **User impact** | None from the declaration. Everything below is the impact of its absence |
| **Architectural impact** | **None — the register row already exists.** TIME3 did the governance |
| **Dependencies** | **None.** Pure, zero-I/O, zero consumers, no new dependency (`Intl` suffices) |
| **Convergence strategy** | Build it. **Deleting one file reverts it.** Then `SCH-1` (zone) → the T2/T3 consumers |

---

#### `OWN-3` — The season rule's declared owner is not its actual owner 📋

| Field | Value |
|---|---|
| **Classification** | 🗄️ **DATA OWNERSHIP CONVERGENCE** |
| **Governing architecture** | **Register Rule 1**; Register **Domain 11 → `shared/seasonal/engine.ts`**; `HT17` (*season is not Household Time*) |
| **Current implementation** | **Three implementations.** `shared/discovery/seasonal-map.ts:63-69` — **exported, 5+ consumers**, `getMonth()` 0-indexed. `shared/seasonal/engine.ts:96-102` — **private, 1 consumer (itself)**. `shared/stories/engine.ts:137-143` — **private, byte-identical to the second.** The declared owner's rule is the one nobody imports |
| **Nature of the divergence** | **The declared owner is not the real owner, and the real owner sits in the wrong domain's folder.** The duplication is documented as a virtue: *"three engines, one season truth"* — **which is a comment, not an owner** |
| **Canonical owner** | To be settled: Domain 11 as declared, **or** the Register corrected to name Domain 8's file. **CONV1 does not choose** |
| **Risk** | 🟢 Low functionally — semantically equal today. **Worse than a copy**: two express the same rule with *different month bases*, so a reviewer diffing them sees different numbers and cannot tell they agree |
| **User impact** | The season is currently a property of **where THA is deployed**, not of the household. *"At its best right now"* is an assertion about the physical world, and on the wrong side of a month boundary it is false |
| **Architectural impact** | A Register **Rule 1** defect that **pre-dates and is independent of Household Time** |
| **Dependencies** | **The module (`OWN-4`) only.** Needs **no zone, no anchor, no register row** |
| **Convergence strategy** | **Phase 1a — the cheapest genuine ownership win in the programme.** Three → one; fix the owner inversion. **Do not defer it because "it isn't a time bug" — it isn't, and that is exactly why it is free** |

---

#### `OWN-6` — `planner:active-week`: a household fact living in `localStorage` ✅

| Field | Value |
|---|---|
| **Classification** | 🗄️ **DATA OWNERSHIP CONVERGENCE** |
| **Governing architecture** | Principle 2; `HT4` (*a clock is a property of the home, never the device*); `HT12` |
| **Current implementation** | `home-experience-page.tsx:54`/`:60` — five readers, **one writer** (`weekly-planner-page.tsx:276`, fires only on a manual pick), **never seeded** from the server. `if (!raw) return 1;` |
| **Nature of the divergence** | A **household-shaped fact** with **no entry in the Source of Truth Register**, stored per-device. The same household on a phone and a laptop has **two current weeks** |
| **Canonical owner** | Planner — Domain 14, via `resolvePlannerWeek` over `planner_weeks.weekStartDate` (`SCH-2`) |
| **Risk** | 🟡 Medium — **it is one of the five rival current weeks** (`READ-3`) and the only one in `localStorage` |
| **User impact** | Half of `BEH-3`: Home's *"Today's Meals"* shows Week 1 |
| **Architectural impact** | Principle 2's fail test is met by a fact the Register has never heard of |
| **Dependencies** | `SCH-2` (the anchor) — **the expensive gate** |
| **Convergence strategy** | Retire into `resolvePlannerWeek` at Phase 5. **It cannot be fixed by seeding it** — `HOME3` § 4 refused both candidates: `localStorage` is not household state |

---

#### `SCH-1` — `households.timeZone` does not exist ✅

| Field | Value |
|---|---|
| **Classification** | 🧱 **SCHEMA CONVERGENCE** |
| **Governing architecture** | `HT2`; `HT4`; Register Domain 16 |
| **Current implementation** | **Verified absent** — `households` holds only `id`, `name`, `inviteCode`, `createdByUserId`, `createdAt`, `updatedAt`. **No timezone column on any table; no `Intl.` call in `server/`** |
| **Nature of the divergence** | The platform **cannot answer "what time is it for this household"**, and twenty domains answer it anyway |
| **Canonical owner** | `households` — **existing owner, extended.** No new domain |
| **Risk** | 🟢 Very low to add — nullable, additive |
| **User impact** | **It unblocks seven of the twelve consumers** — including the two sharpest defects (`READ-4`, `BEH-6`) |
| **Architectural impact** | **None. The register row already exists** |
| **Dependencies** | `OWN-4` |
| **Convergence strategy** | Nullable column; detect at signup; user-correctable; `Europe/London` default **with declared provenance** — a *declared* default is not fabrication (CP8) |

---

#### `SCH-2` — `planner_weeks.weekStartDate` does not exist ✅

| Field | Value |
|---|---|
| **Classification** | 🧱 **SCHEMA CONVERGENCE** |
| **Governing architecture** | `HT2`; **`HT7`** (*written only at creation; never back-filled*) |
| **Current implementation** | **Verified absent** — `planner_weeks` holds `id`, `userId`, `householdId`, `weekNumber`, `weekName`. **No date, no timestamp, not even a `createdAt`.** *(Note: a `weekStartDate` exists at `schema.ts:746` — on `user_streaks`, a different table, and a sixth private notion of a week)* |
| **Nature of the divergence** | **The planner is not a calendar and was never built as one.** In a schema with 99 `timestamptz` columns, the planner's datelessness is a design. The legacy table it replaced *did* carry a date |
| **Canonical owner** | `planner_weeks` — Domain 14, via the Planner's **existing** single write funnel. **No new writer** |
| **Risk** | 🔴 **The expensive gate.** Adding it is very low risk (additive, no row touched). **The risk is `R5` — someone back-fills it because `NULL` looks like a bug** |
| **User impact** | **It gates every remaining time repair**, including the only one household time cannot fix by itself (`BEH-7`) |
| **Architectural impact** | None — the register row exists |
| **Dependencies** | `SCH-1` — you cannot stamp a household's Monday without their zone |
| **Convergence strategy** | Nullable; written **only** at `createPlannerWeeks`; **existing rows stay `NULL` forever.** *"A back-filled anchor is `approxDate` with a schema"* |

---

#### `READ-3` — Five rival "current week" implementations ✅

| Field | Value |
|---|---|
| **Classification** | 👁️ **READ-PATH CONVERGENCE** |
| **Governing architecture** | `HT1`; TIME3 § 14 target #1 (**5 → 1**) |
| **Current implementation** | `routes.ts:11511-11513` `max(weekNumber)` → **always 6** (verified; TIME2 cited `:11503`) · `opportunity-engine.ts:385` → **6** · `household-nutrition-assembler.ts:216-217` → **6** · `dashboard.tsx:191` `plannerFull[0]` → **always 1** · `home-experience-page.tsx:48-61` `localStorage` → **1** |
| **Nature of the divergence** | **`max(weekNumber)` is not a computation — it is the constant 6**, because all six weeks are created eagerly at first touch (`storage.ts:1220`) and the API bounds it at 6 (`routes.ts:7182`). *"A constant wearing the costume of a computation"* |
| **Canonical owner** | `resolvePlannerWeek()` over Domain 14 |
| **Risk** | 🟡 Medium |
| **User impact** | **`BEH-3` — live** |
| **Architectural impact** | Collapses to one at Phase 5 |
| **Dependencies** | **`SCH-2`** — nothing earlier helps |
| **Convergence strategy** | All five → `resolvePlannerWeek`. **`anchored: false` → the caller keeps today's behaviour.** Nothing regresses |

---

#### `READ-4` — The Companion's `TODAY` is UTC's today ✅

| Field | Value |
|---|---|
| **Classification** | 👁️ **READ-PATH CONVERGENCE** |
| **Governing architecture** | `HT12` (*the client renders household time; never derives it*); `HT15` (*time reaches the model only via a Context View*) |
| **Current implementation** | `context-frame-assembler.ts:119` — `const temporalAnchor = new Date().toISOString().slice(0, 10)` — **verified unchanged**. Its own doc comment claims it *"grounds the LLM to today"*. It becomes the literal string `TODAY: ${frame.temporalAnchor}` in the system prompt (`conversation-gateway.ts:1053`) **and** the diary day the Companion reads and writes (`pattern-intent-resolver.ts:1130`) |
| **Nature of the divergence** | **The single highest-leverage line in the platform.** One line, wrong frame, largest blast radius |
| **Canonical owner** | `shared/time/household-time.ts` (T2), composed by **INT17** |
| **Risk** | 🟡 Medium |
| **User impact** | Every relative expression the model produces — *"tonight"*, *"tomorrow"*, *"yesterday"* — is computed off a wrong anchor for any UK household between 00:00–01:00 BST. Ask it to log tonight's dinner in New York and it can land in **tomorrow's** diary. **Three different "todays" for one household** |
| **Architectural impact** | None — a corrected input |
| **Dependencies** | `SCH-1` (zone). **No anchor needed** |
| **Convergence strategy** | **Phase 3, first.** One line, largest blast radius |

---

#### `SCH-4` — Civil dates are stored as `text`, and compared across frames 📋 ✅

| Field | Value |
|---|---|
| **Classification** | 🧱 **SCHEMA CONVERGENCE** |
| **Governing architecture** | `HT9` (a duration is not a date); Register Rule 1 |
| **Current implementation** | `schema.ts:812-813` — `frozenDate: text(...)`, `expiryDate: text(...)` — **verified still `text`**. Also `food_diary_days.date` (text, and `unique(userId, date)` — **a uniqueness constraint on an unvalidated client string**), `savings_events.date`, `product_history.scannedAt` (**sorted lexically**), `user_health_trends.date`. **Postgres `date` is used zero times in the entire schema** |
| **Nature of the divergence** | **The database validates nothing**, and the client is the sole author. The freezer's entire temporal model is client-authored strings the server accepts verbatim — `grep expiryDate` over `server/` returns **zero** |
| **Canonical owner** | Each domain's rows, with `shared/time/household-time.ts` owning the derivation |
| **Risk** | 🟡 Medium |
| **User impact** | **`BEH-6` — live daily** |
| **Architectural impact** | Type corrections within existing owners |
| **Dependencies** | `SCH-1` |
| **Convergence strategy** | Phase 3. **Fix the comparison before the column type** — the comparison is what harms |

---

### TIER 4 — LIFE STAGE, CANONICAL PUBLICATION AND EXPERIENCE

---

#### `OWN-2` — Household composition is a Domain 16 fact stored at Domain 27's user scope 📋

| Field | Value |
|---|---|
| **Classification** | 🗄️ **DATA OWNERSHIP CONVERGENCE** |
| **Governing architecture** | Register **Domain 16** (*household members, eaters*); Principle 2; **`HT4`'s precedent** — *"a clock is a property of the home… per-member zones would be a split-brain over one shared plan"* |
| **Current implementation** | `schema.ts:667-669` — `adultsCount` / `childrenCount` / `babiesCount` on `user_preferences`, **keyed one row per user**, in a domain the Register already marks **Contested**. Written only at onboarding; **reconciled with `household_eaters` never**; **computed with by nothing** — every read is display or echo |
| **Nature of the divergence** | **Household Time refused this exact shape for the time zone before writing a line of code. Life Stage finds it already built.** Two adults in one household each hold a private `childrenCount`, and they can differ |
| **Canonical owner** | `household_eaters` — a **projection over rows**, never a column (CP7) |
| **Risk** | 🟡 Medium — *"a live model input changes"* |
| **User impact** | **The model is routinely handed `childrenCount: 0` and two eaters typed `kind: "child"` in one context block**, from two stores that have never been introduced. `profile:read` is **50.4% of all CONTEXT DATA bytes** the platform emits |
| **Architectural impact** | Retires three fields; creates none |
| **Dependencies** | Overlaps `OWN-1`'s Domain 16 work. **Not blocked by the § 5 legal gate** |
| **Convergence strategy** | Derive from eater rows; retire the columns. **LIFE1 Step 3 = PEOPLE1 Step 6 — one item, two authors** |

---

#### `BEH-1` — `kind: "child"` means *has no account*, and it reaches the language model 📋

| Field | Value |
|---|---|
| **Classification** | 🎭 **BEHAVIOUR CONVERGENCE** |
| **Governing architecture** | Principle 1; `NK1:418` (*no per-child signals*) |
| **Current implementation** | `household-eater.ts:107` — `kind: row.userId != null ? "user" : "child"`. Reaches the model at `household-read-handler.ts:81`. **And `household-discovery-engine.ts:90-94` labels every account-less eater `role: "guest"`** — so a household's children are *child* to one service and *guest* to another, **and neither word is about age** |
| **Nature of the divergence** | **A correct-by-accident name and a loaded gun.** No production code branches on `kind` — the only `kind === "child"` read is a test assertion. **EXPCOMP1's WARNING grade in its purest form:** correct today, correct for the wrong reason, one innocent change from wrong |
| **Canonical owner** | `household_eaters`; the word is a derivation, never a column |
| **Risk** | 🟡 Medium — certain future defect |
| **User impact** | **A live-in grandparent without an account is, to the Companion, a child** |
| **Architectural impact** | A rename |
| **Dependencies** | **None.** Free |
| **Convergence strategy** | `"account"` / `"no-account"`; retire the rival `"guest"`. **Defuse the gun before someone picks it up** |

---

#### `BEH-2` — The infant botulism rule is a comment, above a resolver that cannot enforce it 📋

| Field | Value |
|---|---|
| **Classification** | 🎭 **BEHAVIOUR CONVERGENCE** |
| **Governing architecture** | `NK2:179` (Rule T0 — the household-level safety gate); Core Principle 6 |
| **Current implementation** | `restriction-library.ts:1166-1175` describes the under-12-months honey rule **in a code comment**. The definition below it is a plain alias list. `resolveActiveRestrictions(hardRestrictions: string[])` — **takes declared strings and nothing else. No age, no eater, no household.** Honey is filtered **if and only if an adult types "honey" into a restriction field** |
| **Nature of the divergence** | **THA discovered this failure mode, wrote the principle, and fixed it — for other values.** Thirteen lines below the signature: *"**A restriction the platform cannot enforce is worse than one it never accepted, because the household believes it is protected.**"* SURF1B2 closed that for `meat`, `fish` and `honey` **as strings**, and left `babiesCount: 2` open |
| **Canonical owner** | The restriction resolver + Rule T0 — **an extension of the existing gate, never a second gate** |
| **Risk** | 🟡 **Structural hazard, not demonstrated harm.** No transcript shows unsafe infant advice; asked directly, the Companion says *"I don't know the ages of your children."* **The platform is protected by the model's good manners rather than by a gate.** That is the finding, not reassurance |
| **User impact** | **The model is told on ~9 turns in 10 that there is a baby in the house** — by a platform with no rule about babies and no age for anyone |
| **Architectural impact** | Needs the birth date — **and that is gated by the § 5 legal question, not by engineering** |
| **Dependencies** | **The `SEC-5` legal gate → a birth date → this.** The only Tier-4 item behind the gate |
| **Convergence strategy** | **Last.** It is the only step that **withholds a food from a household's plan** |

---

#### `SEC-5` — Minors' personal data has no governing owner 📋

| Field | Value |
|---|---|
| **Classification** | 🔒 **SECURITY / PRIVACY CONVERGENCE** *(a gap — recorded, not filled)* |
| **Governing architecture** | **None. That is the finding.** `docs/architecture/` holds a consent posture for wearables and biomarkers (*"opt-in + regulated-partner contract + legal/regulatory review"*) and a rectification posture for `household_eaters`. **There is nothing on children** |
| **Current implementation** | **`household_eaters` already holds a child's name and their allergens, today, in production**, created via `POST /api/household/eaters`, reaching the language model on every food turn |
| **Nature of the divergence** | **Not document-vs-code — an unowned question about data THA already holds and already sends to a language model.** PEOPLE1's correction to LIFE1 stands: LIFE1 gated this behind a *future* birth date; **the gate was placed one step too late** |
| **Canonical owner** | **Unowned. A legal and product question** |
| **Risk** | 🔴 **The top open item — and not an engineering decision** |
| **User impact** | Unassessed, which is the point |
| **Architectural impact** | Blocks any birth date, and therefore `BEH-2` |
| **Dependencies** | Legal/product review. **Blocks nothing else in this programme** |
| **Convergence strategy** | **Route to legal/product. Do not fill it.** *"An engineering investigation has no authority to decide it."* **Fortunately, every step carrying live harm is on the near side of this gate** |

---

#### `WRITE-4` — Four undeclared writers publish on every server boot ✅

| Field | Value |
|---|---|
| **Classification** | ✍️ **WRITE-PATH CONVERGENCE** |
| **Governing architecture** | CPuBA4 (one write funnel); Register Rule 3 (no parallel stores); Rule 7 |
| **Current implementation** | `server/index.ts:117-120` — `runTemplateMigration()`, `seedReadyMeals()`, `seedFoodKnowledge()`, `seedPantryKnowledge()`, **all `.catch()`-swallowed, none in the Register.** The gate names it: *"the declared mechanism is `npm run seed:*` — **this one is invisible**"* |
| **Nature of the divergence** | **There are two publication mechanisms and one of them is invisible.** `runTemplateMigration` is described by the platform's own read-port as *"a ONE-TIME BACKFILL SCRIPT… not a live owner"* — **and it is wired into the boot path**, having produced **1,162 of 1,316** `meal_templates` rows. `seedReadyMeals` **nulls `image_url` on all system meals at boot**, including the 500 Founding Cookbook rows it does not own |
| **Canonical owner** | `npm run seed:*`, operator-invoked |
| **Risk** | 🔴 **Two of the six red domains are this item** |
| **User impact** | None visible — *"harmless only because the cookbook has no images yet; the day it gains them, boot wipes them"* |
| **Architectural impact** | A permanent `meals → meal_templates` synchronisation bridge — **Principle 7** |
| **Dependencies** | None |
| **Convergence strategy** | Unwire the boot path; declare the real writers in the Register; retire the backfill. **The gate already fails on this — the check exists and is red** |

---

#### `OWN-5` — Pantry has no Source of Truth Register domain at all 📋

| Field | Value |
|---|---|
| **Classification** | 🗄️ **DATA OWNERSHIP CONVERGENCE** |
| **Governing architecture** | **Register Rule 1** — *"Every major domain must declare a named source of truth"* |
| **Current implementation** | A live, table-owning, runtime-read domain with **no row in the Register**. *(CPI1 found the same of Benchmarks, Learning and Observations — while `evidence-learning-store.ts:6` and `capability-registry.ts:725` **assert in shipped code** that their tables are "SoT-registered under EL1". They are not)* |
| **Nature of the divergence** | **Rule 1 breached by omission.** The document that owns ownership does not know the domain exists |
| **Canonical owner** | `user_pantry_items` — undeclared |
| **Risk** | 🟡 Medium — **it blocks pantry freshness independently of time.** A domain with no declared owner cannot be given a new fact (Rule 8) |
| **User impact** | None today. **The pantry has no concept of food ageing** — no expiry, no purchase date. The domain most semantically entitled to expiry owns none |
| **Architectural impact** | Register rows for four domains |
| **Dependencies** | None |
| **Convergence strategy** | Declare the four missing domains. **Documentation-only, and it unblocks a whole product area** |

---

#### `BEH-3` — Home renders Week 1's meals beside Week 6's plant count ✅

| Field | Value |
|---|---|
| **Classification** | 🎭 **BEHAVIOUR CONVERGENCE** |
| **Governing architecture** | Experience Principle 6 (one canonical place); `HOME2` § 6.1 (*the door changes when the household's state changes*) |
| **Current implementation** | `home-experience-page.tsx:139` — *"Today's Meals"* from `activeWeek` → **Week 1**. `:160` — *"N of 30 plants"* from `weeklyProgress` → **Week 6**. **One component, one screen, one paint, twenty-one lines apart** |
| **Nature of the divergence** | **Home does not merely fail to be checkable against a calendar — it fails to agree with itself**, deterministically, for every household that has not manually selected Week 6 |
| **Canonical owner** | `resolvePlannerWeek()` |
| **Risk** | 🟡 Medium |
| **User impact** | ✅ **Live, on the default state of every household** |
| **Architectural impact** | **It is why the Home primary action cannot be aimed** (`BEH-9`). Aiming it at either week *"would ratify one of them as correct and make a live self-contradiction into a design intent"* |
| **Dependencies** | **`SCH-2`** |
| **Convergence strategy** | Phase 5. **Do not pick a week to fix it** — `HOME3` § 4 refused both candidates with reasons |

---

#### `BEH-4` — Every new household's starter meals are seeded on the wrong days 📋

| Field | Value |
|---|---|
| **Classification** | 🎭 **BEHAVIOUR CONVERGENCE** |
| **Governing architecture** | `HT8` (`0 = Sunday`, declared); Principle 1 |
| **Current implementation** | `storage.ts:3345` — `const monday = days.find(d => d.dayOfWeek === 0)` — **verified**. `0` is **Sunday**. **The same file's own converters (`:1832`, `:1863`, `:1882`) do `d.dayOfWeek === 0 ? 7 : d.dayOfWeek`, proving the convention** |
| **Nature of the divergence** | **Principle 1's fail test is met inside one file.** An undeclared key space that eleven consumers read correctly and four read backwards |
| **Canonical owner** | `shared/time/household-time.ts` (declares it) |
| **Risk** | 🟢 Low to fix |
| **User impact** | ✅ **Live. Every new THA household's starter meals land on Sunday–Wednesday while the code believes it is seeding Monday–Thursday. It is the first thing a new household sees, and it is off by one** |
| **Architectural impact** | None |
| **Dependencies** | **None.** Out of band |
| **Convergence strategy** | Fix the four backwards readers now. **Do not renumber the key space** (`HT8` — renumbering silently rotates every planner consumer and no test would catch it) |

---

#### `BEH-5` — Stories tells households invented facts about their own lives 📋

| Field | Value |
|---|---|
| **Classification** | 🎭 **BEHAVIOUR CONVERGENCE** |
| **Governing architecture** | Core Principle 6; `seasonal/engine.ts:17`'s own first principles — *"Memory, never report card"*; *"Trust by non-computation"* |
| **Current implementation** | `stories/engine.ts:441` — `` `${DAY_NAMES[peakDay]} became ${patternName.toLowerCase()} night.` `` The weekday comes from `approxDate` (`routes.ts:11372`), **invented at request time**, with the peak-day index computed against the **inverted** convention. `maxWeek ≡ 6`, so *"a meal a household plans to eat next month is timestamped five weeks in the past"* |
| **Nature of the divergence** | **"Friday became curry night." The household never told THA which day they eat curry — the planner cannot express that.** All of Stories' arithmetic — the 30/90/180/365-day tiers, the 180-day favourite gate — **is arithmetic on fiction** |
| **Canonical owner** | Planner Domain 14 (real dates), via `SCH-2` |
| **Risk** | 🔴 High — the platform states invented facts about a household's life in the household's own voice |
| **User impact** | ✅ **Live** |
| **Architectural impact** | **The single most important sequencing fact in the programme.** Household time **cannot fix this** — there is no real date underneath to correct. Stories is a **dependant of the anchor**, not a convergence target |
| **Dependencies** | **`SCH-2`, absolutely** |
| **Convergence strategy** | **Phase 6, last.** *"Any attempt to fix Stories' timezone before the anchor is wasted work — it would make a fabricated date precisely wrong"* |

---

#### `BEH-6` — Freezer expiry is wrong for hours every day, in both directions 📋 ✅

| Field | Value |
|---|---|
| **Classification** | 🎭 **BEHAVIOUR CONVERGENCE** |
| **Governing architecture** | `HT12`; Core Principle 6 |
| **Current implementation** | Write is UTC: `frozenDate: new Date().toISOString().split('T')[0]` (`meals-page.tsx:2789` — verified). Comparison mixes frames: `new Date(frozen.expiryDate) < new Date()` (`:4414`) — the left side parses as **UTC midnight**, the right is the **local** instant. Epoch-ms arithmetic at `:4415` |
| **Nature of the divergence** | **Four stacked defects**, and it makes **food-safety-adjacent claims** |
| **Canonical owner** | `shared/time/household-time.ts` (T2) + Meals Domain 12 |
| **Risk** | 🔴 **Highest user harm in the time family** |
| **User impact** | ✅ **Live.** The *"Expired"* badge flips at UTC midnight — **01:00 BST, so a UK household loses the whole final day**; US households are told food is expired **while still in date**. Across DST, `daysUntilExpiry` and `isExpired` can **disagree with each other**: *"Expires in 1 day"* while `isExpired` already reads true |
| **Architectural impact** | None |
| **Dependencies** | `SCH-1`. **No anchor needed — pure T2** |
| **Convergence strategy** | **Phase 3, immediately after `READ-4`.** High severity, low cost, no anchor dependency |

---

#### `BEH-7` — The orchard runs behind every room as wallpaper, which the Blueprint forbids by name ✅

| Field | Value |
|---|---|
| **Classification** | 🎭 **BEHAVIOUR CONVERGENCE** |
| **Governing architecture** | Experience Blueprint **§ 6.1** — *"**The orchard is never wallpaper.** No room contains the orchard; every room is oriented toward it. A backdrop applied uniformly behind everything is the flattening the Place Principles forbid"*; § 6.1 — *"the orchard never animates"*; § 16 — *wallpaper* and *the rendered world* are named anti-patterns |
| **Current implementation** | **Verified.** `orchard-backdrop.tsx` — a photographic orchard, `position: fixed; inset: 0`, `objectFit: cover`, **`opacity: 0.90`**, with a parallax, mounted at **`App.tsx:210` — behind every room** |
| **Nature of the divergence** | **The canon was right and the render was wrong.** Not a missing rule — *"already forbidden, shipped anyway."* Three separate prohibitions breached by one component |
| **Canonical owner** | Experience Blueprint § 6 (the laws of the one orchard); UI Architecture (the values) |
| **Risk** | 🟡 Medium — **the flagship conformance defect of the Experience canon** |
| **User impact** | Every room looks the same; *One Home, Many Places* is flattened into a themed backdrop. **The exact failure the Place Principles exist to prevent** |
| **Architectural impact** | **None — and this is the point.** NORTH2 assessed five proposed new principles and **adopted one**, concluding *"NORTH1 produced zero behavioural findings not already law, and its big findings are **conformance defects, not architecture gaps**."* **This item is the proof: no new principle would help; the existing one is simply not obeyed** |
| **Dependencies** | **None** |
| **Convergence strategy** | Retire the global backdrop; orient rooms toward a **bounded** view. **Do not write a new principle** — that is the failure mode NORTH2 refused |

---

#### `BEH-8` — Five registered capabilities are silently unreachable by the Companion ✅

| Field | Value |
|---|---|
| **Classification** | 👁️ **READ-PATH CONVERGENCE** |
| **Governing architecture** | `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` — the registry is the owner; Principle 7 |
| **Current implementation** | `CAPABILITY_DOMAIN` (18 ids) is used as a **hard gate** against a registry of **25** (`companion-guidance.ts:75`, `:145`; `companion-enrichment.ts:96`). Executed live: `product-knowledge`, `food-intelligence`, `household-health`, `opportunity-delivery`, `evidence-learning` are **gated out** |
| **Nature of the divergence** | **A parallel list shadowing the registry** — a synchronisation bridge that **has already failed** |
| **Canonical owner** | `server/intelligence/capability-registry.ts` |
| **Risk** | 🔴 **One of the six red domains** |
| **User impact** | Five capabilities the platform registered, tested and documented **cannot be reached by the Companion** — killing 6 registry-declared enrichment items and 1 guidance block. **Silently** |
| **Architectural impact** | Principle 7's bridge, in its already-broken state |
| **Dependencies** | None |
| **Convergence strategy** | Derive the gate from the registry, or delete it. **The gate already fails on this** |

---

#### `BEH-9` — Home has no primary action 📋

| Field | Value |
|---|---|
| **Classification** | 🎭 **BEHAVIOUR CONVERGENCE** |
| **Governing architecture** | **Experience Principle 4** — one primary action; Experience Architecture § 7; `HOME2`'s resolver specification |
| **Current implementation** | `home-experience-page.tsx:179-397` — no primary action |
| **Nature of the divergence** | **A conformance defect, not a missing principle.** The room *was* designed — `DESIGN1`, `HOUSE1`, `ORCHARD2`, `HOME2`. **The surface diverges from the design** |
| **Canonical owner** | `HOME2`'s resolver — **built and total** (`HOME3` § 6: *"with `week: null` it falls to the floor and still returns exactly one action"*) |
| **Risk** | 🟡 Medium |
| **User impact** | Home's Experience Test question 3 — *what is the ONE thing this room helps them do?* — **is answered by the canon and unanswered by the code** |
| **Architectural impact** | **None.** The resolver exists and works |
| **Dependencies** | **`BEH-3` → `SCH-2`.** *"The door is buildable the moment a week means something"* |
| **Convergence strategy** | Aim the door **after** the anchor lands. **Do not aim it now** — HOME3's whole finding is that aiming it at either rival week ratifies a live self-contradiction as design intent |

---

#### `SCH-3` — 45 of 91 declared tables have no reviewed migration ✅

| Field | Value |
|---|---|
| **Classification** | 🧱 **SCHEMA CONVERGENCE** |
| **Governing architecture** | CPuBA § 4.1; Register Rule 1 |
| **Current implementation** | **Ran the gate for this document:** `Declared 91 · Covered 46 · NOT covered 45 · Table-level coverage (UPPER BOUND) 51%`. The uncovered set includes **`users`, `meals`, `planner_weeks`, `planner_days`, `planner_entries`, `shopping_list`, `user_preferences`, `meal_templates`.** The tool's own closing line: *"Columns added declaratively without a migration are NOT detected, so true coverage is no better than the figure above"* |
| **Nature of the divergence** | **The schema cannot rebuild itself.** Every domain in this programme publishes into a projection whose *table* has no reproducible provenance |
| **Canonical owner** | `server/migrations/` |
| **Risk** | 🔴 **Arguably the deepest structural defect in the platform** |
| **User impact** | **None — and that is exactly why it has never been done.** It is a disaster-recovery and reproducibility risk, not a live one |
| **Architectural impact** | **`SEC-3` is this defect at one column**, and shows its real cost: two identical declarations, two different physical types |
| **Dependencies** | None |
| **Convergence strategy** | **The long game** (§ 8). CPI1's own judgement stands: *"the strongest candidate for the repair after"* the ownership work |

---

## 4. DEPENDENCY MAP

```
  ┌───────────────────────────────────────────────────────────────────────┐
  │ TIER 0 — SECURITY / PRIVACY / TRUST    ⚡ DEPENDS ON NOTHING          │
  │ SEC-1 departed-member feed  ·  SEC-2 + SEC-3 auth timestamps          │
  │ SEC-4 unvalidated ruleId                                              │
  │ ── Out of band. Do NOT sequence behind anything below. ──             │
  └───────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │ TIER 1 — GOVERNANCE CORRECTIONS (docs only, no code)                  │
  │ DOC-1 ★ the four-way diet conflict   DOC-2 NK1   DOC-3   DOC-4        │
  │ OWN-5 declare Pantry + 3 missing domains                              │
  └──────────────┬────────────────────────────────────────────────────────┘
                 │ DOC-1 gates the whole Person family (CP4)
                 ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │ TIER 2 — THE HOUSEHOLD PERSON                                         │
  │   WRITE-3 (unique constraint)  ──┐                                    │
  │   WRITE-2 ★ move the write door ◄┘   ← THE HINGE. All the risk.       │
  │        │                                                              │
  │        ▼                                                              │
  │   OWN-1 retire users.diet*                                            │
  │        │                                                              │
  │        ▼                                                              │
  │   READ-1 + READ-2 + WRITE-1  ← scaffolding. Comes down LAST (CP2)     │
  └───────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │ TIER 3 — HOUSEHOLD TIME                                               │
  │                                                                       │
  │   OWN-4 the module  ────────┬──────► OWN-3 season (1a)                │
  │   (no deps, delete to undo) │        ⚡ needs NO zone, NO anchor       │
  │                             │                                         │
  │                             ▼                                         │
  │                        SCH-1 the zone  ← unblocks 7 of 12 consumers   │
  │                             │                                         │
  │                             ▼                                         │
  │              ┌─── Phase 3 (T2/T3) — NO anchor needed ───┐             │
  │              │  READ-4 Companion ★ one line, max blast  │             │
  │              │  BEH-6 freezer   ★ highest user harm     │             │
  │              │  SCH-4 text dates · greeting ×4          │             │
  │              └──────────────┬───────────────────────────┘             │
  │                             ▼                                         │
  │                    SCH-2 ★ THE ANCHOR  ← the expensive gate           │
  │                             │                                         │
  │              ┌──────────────┴──────────────┐                          │
  │              ▼                             ▼                          │
  │     Phase 5: READ-3 · OWN-6        Phase 6: BEH-5 Stories             │
  │             BEH-3 · BEH-9                  (retire approxDate)        │
  │             OWN-2 counts           ⚠ CANNOT precede SCH-2             │
  └───────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │ INDEPENDENT — no dependency on any of the above                       │
  │ WRITE-4 boot seeders · BEH-8 capability gate · BEH-7 wallpaper        │
  │ BEH-1 kind rename · BEH-4 starter days · SCH-3 migrations (long game) │
  └───────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────────────────┐
  │ BEHIND THE LEGAL GATE — not an engineering decision                   │
  │ SEC-5 minors' data  ──►  a birth date  ──►  BEH-2 the infant gate     │
  │ ⚠ Nothing else in this programme waits on it.                         │
  └───────────────────────────────────────────────────────────────────────┘
```

### 4.1 The five facts the map encodes

1. **Tier 0 depends on nothing.** Every security and trust item is reachable today, needs no schema change and no legal answer. **Sequencing them behind convergence would be the programme's worst error.**
2. **`DOC-1` gates more than any other item.** It is free, it is prose, and until it lands every Person-family implementer is in conflict with governing architecture on the day they start.
3. **`SCH-1` unblocks more than `SCH-2` and costs far less.** Seven of twelve time consumers need only the zone — **including the two sharpest defects.** *The expensive step is not on the critical path for most of the harm.*
4. **`BEH-5` is gated absolutely.** Household time cannot repair Stories; only a real date can. **Fixing its timezone first makes a fabricated date precisely wrong** — the worst outcome available.
5. **The scaffolding comes down last, everywhere.** `READ-1`, `READ-2` and `WRITE-1` are the only things keeping adults' diets visible while the fact is in the wrong store. **Delete them first and the platform forgets every adult's allergy.**

---

## 5. IMMEDIATE HIGH-PRIORITY CONVERGENCES

**The mission asks which security, privacy and trust issues precede normal convergence. Four, and the reasoning is the same in each case: *they remove an exposure rather than adding a claim.***

| Rank | Item | Why it precedes everything | Blocked by |
|---|---|---|---|
| **1** | **`SEC-1` — the departed-member feed** | **The only live data-protection defect in the audit.** Health data disclosed to a party with no relationship to the data subject, indefinitely, updating as they change it. **No schema change, no migration, no legal question, one call site** | **Nothing** |
| **2** | **`SEC-4` — unvalidated `ruleId`** | An endpoint accepts **any rule identity any caller invents** and stamps it `added_by: 'tha_uplift'`. 8 live rows already cite a phantom rule. **Trust is the product** | **Nothing** |
| **3** | **`SEC-2` + `SEC-3` — the auth token timestamps** | Two security-token expiry columns whose **declaration does not predict the physical type**. Latent, masked by UTC — **and the mask is a deployment accident, not a design** | **Nothing** |
| **4** | **`SEC-5` — minors' data** | **Not an engineering fix. A routing act.** THA already holds children's names and allergens and sends them to a language model, with no governing position on minors' data | Legal / product |

### 5.1 The honest grading

Three of these four are **not exploitable as deployed**, and saying so is the point:

- **`SEC-2`/`SEC-3`** are masked by UTC containers. TIME2 graded them 🔒 Security; **the corrected grade is *latent*** (CP11). They are still first, because they cost nothing to fix and their mask is not a control.
- **`SEC-4`** harms trust, not safety — a phantom rule is a *suggestion*, not an allergen.
- **`SEC-1` is the exception, and it is not latent.** It is live, reachable through two ordinary production routes, and was **verified end to end for this document** — every link in the chain read at source.

> **The programme's first act is not to build anything. It is to stop watching someone who left.**

---

## 6. RISKS

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| **R1** | **The declared owners are never built.** `shared/time/household-time.ts` is law and does not exist. If Phase 1 never ships, TIME3 produced **a 21st time implementation with better manners** | 🔴 **Highest, and the likeliest** | **This is THA's most repeated failure** — PKR1 Risk R7: *discovery without transfer of ownership*. **CP10: a convergence is finished when a gate can fail.** Phase 1 lands its verification entry in the same change |
| **R2** | **The gate stays red and everyone stops reading it.** `verify:publication` has failed since it was built. A permanently-red gate is indistinguishable from no gate | 🔴 **High — and it is already happening** | Fix the two cheapest reds (`WRITE-4`, `BEH-8`) **first**, to make green mean something. **A gate's value is the day it turns red, not the day it is written** |
| **R3** | **Convergence stalls after the visible harm is fixed.** Phase 3 lands, the anchor never does, and `approxDate` is **sanctioned by survival** | 🔴 High | *"Step 3 must not ship without Step 4 scheduled."* Principle 8's retirement condition is named in TIME3 § 14 — **cite it, do not restate it** |
| **R4** | **An implementer resolves Domain 7 as written** — promotes `user_preferences`, retires the `users` columns into it, marks the domain converged, and **never touches `household_eaters`** | 🔴 **High — and CONV1 is the only document that names it** | **`DOC-1` first** (§ 1.3). The contest is mis-specified in the senior register; correcting it is a precondition, not a follow-up |
| **R5** | **The anchor gets back-filled** because `NULL` looks like a bug | 🔴 High | **`HT7`.** *A back-filled anchor is `approxDate` with a schema.* Assert it in the migration's own comment |
| **R6** | **An INSTANT domain is "converged"** — a sweep makes the trial countdown or the evidence window household-aware | 🟡 Medium | **`HT10`; CP6.** `MUST NOT` is a **permanent verdict**, not a backlog. Five domains are correct *because* a duration is not a date |
| **R7** | **The scaffolding is deleted first**, because the enrichments and the Bridge look like obvious debt | 🔴 **High — and it is the one that reaches a plate** | **CP2.** They are the only thing keeping adults' diets visible while the fact is in the wrong store. **Delete them first and the platform forgets every adult's allergy** |
| **R8** | **A new principle is written instead of obeying an existing one** — the `BEH-7` reflex | 🟡 Medium | **NORTH2's precedent: 1 of 5 proposed principles adopted**; the rest were already owned or in conflict. *"Conformance defects, not architecture gaps"* |
| **R9** | **The `dayOfWeek` key space is "fixed" by renumbering** to ISO | 🟡 Medium | **`HT8` — declare, do not migrate.** Renumbering silently rotates Home's *"Today's meals"* and **no test would catch it** |
| **R10** | **`SEC-5` is answered by an engineer** because it blocks a column | 🟡 Medium | It is a legal and product question. **The precedent is governing**: S-3 biomarkers require legal/regulatory review before a single value is accepted |
| **R11** | **CONV1 becomes a second owner of convergence.** `ENGINEERING_WORKFLOW.md` **STEP 8 already owns per-implementation convergence reporting** | 🟡 Medium | **§ 7.1.** CONV1 owns the *programme*; STEP 8 owns the *report*. **CONV1 cites STEP 8 and restates none of it** |
| **R12** | **This document is read as law** | 🟢 Low | § 0.2. **Where it and any governing document disagree, this document is the defect** |

---

## 7. RECOMMENDED DELIVERY PHASES

| Phase | Contains | Gate to pass | Why here |
|---|---|---|---|
| **P0 — Stop the bleeding** *(no dependencies)* | `SEC-1` · `SEC-4` · `SEC-2` + `SEC-3` | Manual verification of the departed-member chain; `ruleId` rejected for an unknown rule | **Removes exposures. Adds no claim.** Blocked by nothing |
| **P1 — Correct the canon** *(docs only)* | `DOC-1` ★ · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5` | `repo-structure-verify.sh` | **Free, and it unblocks Tier 2.** No implementer should start `OWN-1` against a canon holding four positions |
| **P2 — Make the gate mean something** | `WRITE-4` · `BEH-8` | **`npm run verify:publication` — reds 6 → 4** | **Addresses `R2` directly.** The two cheapest reds; both are pure deletions of parallel mechanisms |
| **P3 — The free renames and off-by-ones** | `BEH-1` · `BEH-4` · `BEH-7` | `adoption:check`; Experience & UI gate | Independent, low-risk, user-visible. **`BEH-4` is the first thing a new household sees** |
| **P4 — The Household Person** ★ | `WRITE-3` → `WRITE-2` → `OWN-1` → `READ-1` + `READ-2` + `WRITE-1` | `verify:publication` — **Household Dietary Preference 🔴 → 🟢** | **The largest convergence. It carries all the risk** — the only one where a mistake reaches a plate. **Requires P1** |
| **P5 — Household Time: the module and the zone** | `OWN-4` → `OWN-3` (1a) → `SCH-1` | `HT18` — no second implementation exists | **Reversible by deleting one file.** `OWN-3` needs no zone and no anchor |
| **P6 — Household Time: the T2/T3 convergence** | `READ-4` ★ → `BEH-6` ★ → `SCH-4` → the greeting ×4 | Per-consumer; `anchored:false` → today's behaviour | **No anchor needed.** Companion first (one line, largest blast radius), freezer second (highest user harm) |
| **P7 — The anchor** ★ | `SCH-2` | Migration comment asserts **no back-fill** | **The expensive gate.** Additive; no row touched |
| **P8 — The T5 convergence** | `READ-3` · `OWN-6` · `BEH-3` · `OWN-2` · `BEH-9` | Five current weeks → one | Requires P7 |
| **P9 — Retire the fabricator** | `BEH-5` | `approxDate` deleted; Stories honest for the first time | **The only phase that changes what THA *says*.** A product decision as much as an engineering one |
| **P10 — The long game** | `SCH-3` | `verify:schema-coverage` — 51% → 100% | § 8 |
| **P—** | **Behind the legal gate:** `SEC-5` → a birth date → `BEH-2` | Legal / product review | **Nothing else waits on it** |

### 7.1 The boundary with STEP 8 — stated so CONV1 does not become a second owner

`ENGINEERING_WORKFLOW.md` **STEP 8 — Architecture Convergence Status** already exists and is **mandatory for every 🔴 RED implementation**. It owns the per-implementation convergence report: current owner, duplicate owners remaining, evidence-based percentage, next milestone.

> **CONV1 does not restate it, does not amend it, and must never replace it.** STEP 8 owns *"what did this change do to convergence?"* CONV1 owns *"what is left, and in what order?"*

**And the gap between them is why this programme exists.** STEP 8 fires when someone is **already doing** a RED implementation in a domain. **It cannot see a divergence nobody is working on** — which is every item in this backlog. LIFE2 § 6.2 illustrates it perfectly and correctly: *"Not a 🔴 RED implementation… STEP 8 does not apply."* That was the right call. It is also the reason none of these 24 items has ever appeared in a STEP 8 block.

---

## 8. LONG-TERM CONVERGENCE STRATEGY

### 8.1 The strategy in one sentence

> **Stop finding divergence with investigations and start failing on it with gates — because THA has now proved it can do exactly that, and then left the proof switched off.**

### 8.2 The three horizons

**Horizon 1 — Make the existing gates green, and keep them green.**
THA owns four mechanical gates: `verify:publication`, `verify:schema-coverage`, `adoption:check`, `repo-structure-verify.sh`. **Two are red and one has two failures.** The strategy is not to build a fifth. It is to **make red mean something again** (`R2`). A gate that has never been green teaches a team that red is the normal colour, and that is worse than the divergence it reports.

**Horizon 2 — Close the detection gap that produced every 🔴 in this backlog.**
§ 1.2's table is the strategy's core. THA can detect projection drift, schema drift and adoption drift. **It cannot detect a governing document disagreeing with another governing document, or with the code** — and that class produced `DOC-1`, `DOC-2`, `DOC-4`, `OWN-1`, `OWN-3` and `OWN-5`.

Three of those are mechanically checkable, and cheaply:

| Check | What it would have caught | Cost |
|---|---|---|
| **Every Register domain names a source of truth that exists** | `OWN-5` (Pantry + 3 domains with no row); `OWN-4` (a declared owner that is not built — as a *declared* state, not a failure) | Low — the Register is structured |
| **Every `file:line` citation in governing architecture resolves** | `DOC-2`'s dangling `§6.3`; `capabilities/household.md`'s rotted `:8526–8541` reference; `DOC-4` | Low |
| **No two governing documents name different owners for one domain** | **`DOC-1` — the four-way conflict, on the day it was written** | Medium — needs a machine-readable ownership claim |

> **The third is the one that matters, and it is the platform's real long-term move.** `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Rule KC8 already names the shape: *name the declared-vs-enforced gap on the day the domain is created, rather than months after it started costing something.* **Ownership is the one claim THA makes in prose everywhere and in a machine-readable form nowhere.**

**Horizon 3 — Retire the class, not the instance.**
Every backlog item is an instance of one of the five shapes in § 1.5. The long-term strategy is to make each shape *impossible*, not to fix its current examples:

| Shape | The permanent fix |
|---|---|
| *The law was right, the platform was behind it* | **CP9** — declare, then build, then **verify the declaration is discharged**. TIME3 did the first two. Nothing does the third |
| *The canon was right, the render was wrong* | The Experience gates exist. **`BEH-7` proves a checklist cannot catch a component nobody re-read.** Needs a conformance sweep, not a new rule |
| *A governing document was factually wrong* | The citation-resolution check above. **`DOC-2` would have failed on the day `NK1` was written** |
| *The platform built the opposite, and a second document ratified it* | The ownership-conflict check. **The only one that would have caught `DOC-1`** |
| *The findings became executable and were left red* | **CP10, and a policy: no workstream merges while it holds a gate red** |

### 8.3 What the strategy must not become

- **Not a convergence sprint.** Seven of these items are *permanently* correct as they are (`CP6`), and a sweep that "finishes" them is a new defect wearing a canonical badge.
- **Not a rewrite.** **Zero new owners across 24 items.** The architecture is right. *"THA's accumulated debt is almost entirely un-retired predecessors, not bad new stores"* (Principle 8).
- **Not a second owner of convergence** (§ 7.1, `R11`).
- **Not an excuse to answer `SEC-5`.** The one question here that genuinely needs a decision is the one engineering may not make.

### 8.4 The measure

**Today, honestly:**

| Signal | Value |
|---|---|
| `verify:publication` | **FAIL** — 22 domains: 5 🟢 · 11 🟡 · **6 🔴**; 60 checks: 24 pass, 24 warn, **12 fail** |
| `verify:schema-coverage` | **51%** — 45 of 91 tables have no reviewed migration |
| `adoption:check` | 64 pass, **2 fail** (pre-existing) |
| **Governing-document coherence** | **UNMEASURED — no gate exists.** § 1.2 |

> **The last row is the strategy.** Three of the four numbers above exist because someone built the check. The fourth is blank, and it is the row that produced the largest item in this backlog.

---

## 9. WHAT THIS PROGRAMME DELIBERATELY DID NOT DO

| Not done | Why |
|---|---|
| **Resolve `DOC-1`** | It is a **correction to governing architecture** — a separate, deliberate act. **An investigation that rewrote a governing document would be authoring law** (LIFE1 § 4.1's boundary, refused here in the same words) |
| **Choose the season rule's owner** (`OWN-3`) | Domain 11 as declared, or the Register corrected to name Domain 8's file. **A governance decision, not CONV1's** |
| **Decide what happens when the six-slot window expires** | **A Planner product decision** (TIME1 § 15.1). The anchor makes the state visible; it does not decide what it means |
| **Answer `SEC-5`** | Legal and product. **An engineering investigation has no authority** |
| **Re-decide anything PEOPLE1, LIFE1, TIME1/2 or CPI1 decided** | Their conclusions are **restated with attribution, never re-litigated.** `OWN-2` is *"LIFE1 Step 3 = PEOPLE1 Step 6 — one item, two authors"* |
| **Grade `SEC-2`/`SEC-3` as TIME2 graded them** | **CP11.** The evidence supports *latent*, not *exploitable* |
| **Report the three fixed CPI1 findings as live** | § 0.4. They were re-verified and are **closed** |
| **Add a rule, a gate, a column, or a percentage** | **Nothing implemented. No code, no schema, no architecture modified** |

---

## 10. COMPLIANCE

- **Architecture Bootstrap (`docs/architecture/README.md`, STEP 2):** read before this programme, as recorded in the run file. `ARCHITECTURE_PRINCIPLES.md`, the SoT Register (Domains 7, 14, 16, 27; Phases 3/4; Appendices A–C), `CANONICAL_PUBLICATION_ARCHITECTURE.md` (Rules CPuBA1–8), `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (HT1–HT18, § 14, § 17), `REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md` (STEP 8), `capabilities/household.md`, NK1/NK2, and the Experience canon read where they bear on divergence.
- **Principle 1:** `BEH-4` records the fail test met **inside one file**; `OWN-1` confirms the eater's key space is uncontested.
- **Principle 2:** the programme's load-bearing instrument. It **decides** `OWN-1` (§ 3), `OWN-2` (household vs user scope), and **refuses** over-collapse in `CP6`.
- **Principle 5:** `OWN-4` and `OWN-3` are reference vocabularies beside the spine — ATTN1/DEC1/TIME3's recorded class.
- **Principle 6:** applied to this document's own grading (**CP11**), to `SEC-2`/`SEC-3`'s *latent*, to `READ-1`'s *structural hazard, not demonstrated harm*, and to `BEH-2`'s *protected by the model's good manners rather than by a gate*.
- **Principle 7:** `WRITE-1` (the self-named Bridge), `WRITE-4` (the boot-time `meals → meal_templates` bridge) and `BEH-8` (the already-failed `CAPABILITY_DOMAIN` bridge) are named as the same shape.
- **Principle 8:** **CP2 is this principle's sequencing consequence**, stated once. Every retirement target is cited to the document that named it — TIME3 § 14, PEOPLE1 § 7, LIFE1 § 14 — and **none is restated**.
- **Register Rules 1, 4, 5, 7, 8:** Rule 1 defects at `OWN-3` and `OWN-5`; Rule 4 at `READ-2`; Rule 5 at `READ-1`; **Rule 7 — the Register needs no update: this document changes no ownership.** Rule 8 **checked and not triggered** — no new store is proposed anywhere in this programme.
- **CPuBA1–8:** `SEC-4` (CPuBA3/4), `WRITE-4` (CPuBA4), `SCH-3` (§ 4.1), `DOC-1` (CPuBA6). The **CPV1 gate was executed read-only** for this document; **no seed runner was invoked and no write was performed**.
- **`HT9`/`HT10`/`CP6`:** the five MUST-NOT domains are recorded as a **permanent verdict**, not as unconverged work.
- **`HT13` / the one-morning law:** **not engaged.** No item in this programme aims light. `BEH-7` is a *conformance* item against a rule the Blueprint already owns, and adds no rule to it.
- **Observation Engine § 7:** obeyed. **Nothing here infers anything.** `platform_observations` is named a forbidden input by every item that touches household state.
- **`ENGINEERING_WORKFLOW.md` STEP 8:** **cited, never restated** (§ 7.1). CONV1 owns the programme; STEP 8 owns the report.
- **`REPOSITORY_CONVENTIONS.md` § 3/§ 4:** the mission's specified path **violates governing architecture** and would fail `repo-structure-verify.sh:52-54`. **Filed under `governance/`. Reported, not silently applied** (§ 0.1).
- **Investigation indexes:** **not updated — none is required.** `docs/architecture/README.md` indexes **governing architecture only**; `docs/investigations/README.md` is a **workstream index, not a document index** (verified: it lists ten folders and no files), and `governance/` already exists and already covers this. **Adding a row would create the second owner of a list that does not exist.**
- **The mission's stop conditions:** honoured. **Nothing implemented. No code modified. No schema modified. No architecture document modified. No new owner created.**
- **This document creates no rule.** It is an investigation: history the moment it is written, never to be read as law. **Where it and any governing document disagree, this document is the defect.**

---

## 11. THE PROGRAMME IN ONE PARAGRAPH

The Healthy Apples does not have an architecture problem; it has an obedience problem, and the evidence is that across twenty-four convergence candidates spanning every major domain, **not one of them needs a new owner** — every single item is a fact being returned to a store the governing architecture already named, some of them three weeks ago and some of them a year. What the last three days of investigation actually discovered is that the platform is unusually good at finding its own divergence and has almost no way to *stop* it: `npm run verify:publication` runs twenty-two domains and sixty checks, each carrying a back-reference to the audit finding that produced it, and it has been red since the day it was built — six domains in publication failure, twelve checks failing, and a team learning that red is the normal colour. The gap that matters is visible in that gate's own output, where a check reports *"the Source of Truth Register agrees with the owners it governs — no known register drift detected"* while the Register simultaneously declares `users.dietPattern` the source of truth in two places and `ARCHITECTURE_PRINCIPLES.md` calls those same two columns a redundant shadow that must be retired: **the gate that checks whether the Register is right cannot read the Register**, because that divergence is made of sentences and every gate THA owns reads code. And the contradiction is worse than a contradiction — the Principles say the rival is `household_eaters` while the Register says the rival is `user_preferences`, so the two governing documents are not arguing about the same thing, and an engineer told to *resolve Domain 7* would promote the wrong store, mark the domain converged, and leave Principle 2's actual violation untouched, which is why correcting a paragraph is the highest-leverage act available and why it comes before the largest convergence rather than after it. Underneath all of it the sequencing is not a matter of taste: the scaffolding comes down last, because the read-time enrichments everybody wants to delete are the only thing keeping adults' allergies visible while the fact sits in the wrong store; the zone unblocks seven of twelve time consumers while the anchor unblocks the rest, so the expensive step is not on the critical path for most of the harm; and Stories cannot be repaired by household time at all, because *"Friday became curry night"* is not a mis-zoned date but a date that was never real. Five domains must **never** consume household time and are recorded as a permanent verdict rather than a backlog, because a duration is not a date and converging them would be a new defect wearing a canonical badge. But the first act is none of this. **The first act is that a person who left a household is still having their current allergens served to the people they left, indefinitely, updating as they change them — it needs no schema, no migration, no legal answer and no architecture, and the fix removes an exposure rather than adding a claim. Everything else in this programme has been safely wrong for three weeks and can be safely wrong for one more.**

---

*An investigation and a programme — a point-in-time census of divergence between the governing architecture and the implementation, and a recommended order for ending it. It is history the moment it is written and is never to be read as law (`docs/architecture/README.md`; PKR1 § 4.4). Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: this document is new and uncommitted — to revert entirely, delete this file. Workstream tag: `rollback/CONV1-architecture-convergence-programme-20260716` → `7d1dd2ce`.*
