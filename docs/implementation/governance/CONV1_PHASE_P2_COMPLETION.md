# CONV1 Phase P2 — Make the Gate Mean Something

**Workstream:** `CONV1_Phase_P2_Gate_Convergence`
**Date:** 2026-07-16
**Rollback identifier:** `rollback/CONV1-phase-p2-gate-convergence-20260716` → `7d1dd2ce`
**Status:** ✅ **COMPLETE** — with its own gate target missed by one, reported here rather than rounded.

> **Scope.** CONV1 Phase **P2** only: `WRITE-4` · `BEH-8` · the two "Low cost" coherence checks
> (CONV1 § 8.2, Horizon 2). No unrelated refactoring. Implementation report — it creates no rule,
> and where it and any governing document disagree, this document is the defect.

---

## 0. THE HEADLINE

**P2's stated gate was `verify:publication` reds 6 → 4. It reached 6 → 5, and the missing red is
not deliverable by P2 at all.** The P1 milestone predicted this exactly (§ 8.1, correction 2:
*"CONV1 § 7 sets P2's gate at reds 6 → 4, while its item entries name three red domains … P2 should
resolve this by measurement, not by assumption"*). It is resolved below, by measurement (§ 5).

**The larger result is not the count.** Both P2 items closed, and the two coherence checks landed —
and **on their first run they failed on two real defects that CONV1's 24-item census never found**
(§ 6). CONV1 § 8.4's fourth row — *"Governing-document coherence: **UNMEASURED — no gate exists**"* —
is no longer blank. That row was the strategy.

---

## 1. WHAT WAS COMPLETED

| Workstream | Verdict | Gate |
|---|---|---|
| **`WRITE-4`** — Four undeclared writers publish on every server boot | ✅ **CLOSED** | `xc-boot-publication` **FAIL → PASS**; `mt-boot-bridge` **FAIL → PASS**; `fk-boot-writer`, `pn-boot-writer`, `rm-image-wipe` **WARN → PASS** |
| **`BEH-8`** — Five registered capabilities silently unreachable by the Companion | ✅ **CLOSED** | `cr-domain-bridge` **FAIL → PASS**; **Capability Registry 🔴 → 🟡** |
| **`COH-1`** — Every Register domain names a source of truth that exists | ✅ **BUILT** | `npm run verify:coherence` — **fires on 2 real defects** |
| **`COH-2`** — Every `file:line` citation in governing architecture resolves | ✅ **BUILT** | `npm run verify:coherence` — **clean across 102 citations / 43 documents** |

---

## 2. THE MEASURE — re-run for this phase, never inherited (`CP11`)

| Signal | P1 close (baseline, re-run here) | **After P2** | Δ |
|---|---|---|---|
| `verify:publication` — domains | 22: 🟢 5 · 🟡 11 · **🔴 6** | 22: 🟢 5 · 🟡 12 · **🔴 5** | **−1 red** |
| `verify:publication` — checks | 60: **25 pass · 24 warn · 11 fail** | 60: **31 pass · 21 warn · 8 fail** | **+6 pass, −3 fail** |
| **Governing-document coherence** | **UNMEASURED — no gate exists** | **MEASURED — 33 domains, 102 citations; 2 fail** | **the blank row is filled** |
| `verify:schema-coverage` | 51% (45 of 91) | 51% — untouched | — |
| `adoption:check` | 64 pass, 2 fail (pre-existing) | 64 pass, 2 fail — **identical** | — |
| `repo-structure-verify.sh` | fails on 2 stray root files | **same 2 strays** (`.glibcheck.txt`, `.libdirs_uxhome.txt`) — **not P2's**, untracked from a concurrent session | — |

**Red domains now:** Meals · Meal Templates · Household Dietary Preference · Pantry ·
Nutrition — Boost/Uplift. *(Capability Registry has left the list.)*

**Tests:** 652 assertions green across the five affected intelligence suites —
companion-guidance **74**, companion-enrichment **35**, capability-guidance-goals **139**,
personality-platform **323**, native-discovery **81**. **0 failed.**

**Typecheck:** `npm run typecheck:ci` reports 32 regressions across 11 files. **None is P2's.**
Proof, not assertion: `server/verification/publication-checks.ts` is **modified by nobody**
(`git status` clean on it) and carries the same NEW `TS2802`; the other ten files are concurrent
sessions' (`test-shop1`, `test-plan2`, `test-pantry1`, `test-cbk2`, `test-hhp2`,
`notice-gateway.ts`, the two assemblers …). P2's own diff to `publication-register.ts` is +7/−1 —
a comment and one string — against a HEAD version that already spread iterables in five places.
**Not one file P2 created or edited appears in the regression list.**

---

## 3. `WRITE-4` — what was actually done

CONV1's strategy was three acts: *"Unwire the boot path; declare the real writers in the Register;
retire the backfill."* All three are done. **The middle one did not exist and had to be built** — see
§ 3.2, the discovery this item did not know it contained.

### 3.1 The boot path is unwired

`server/index.ts` ran four writers on every boot, each `.catch()`-swallowed, none declared:
`runTemplateMigration`, `seedReadyMeals`, `seedFoodKnowledge`, `seedPantryKnowledge`. All four are
gone from the boot path. **`runMigrations` stays, deliberately: schema is not publication.** It makes
the tables exist, authors no fact, and the platform cannot serve a request without it.

> **A boot is not an act of authorship.** The swallowing was the worst part, not the writing: a
> failed publication printed a line into a log nobody reads while the platform came up healthy and
> served requests. `run-boot-retired-seeds.ts` deliberately does **not** catch — an operator-invoked
> seed exits non-zero and says so.

### 3.2 The declared mechanism did not exist — so it was built

**This is WRITE-4's real cost, and CONV1 does not mention it.** The item says converge onto
`npm run seed:*`, operator-invoked. **There was no `seed:ready-meals`, no `seed:food-knowledge`, no
`seed:pantry-knowledge`.** Unwiring boot alone would not have moved these writers to the front door —
**it would have removed the door**, and the next fresh environment would have come up with no meal
categories at all.

Added: `server/seeds/run-boot-retired-seeds.ts` + four scripts —
`seed:ready-meals`, `seed:food-knowledge`, `seed:pantry-knowledge`, and `seed:all`.

**A cycle had to break first.** `seed-ready-meals.ts` and `seed-food-knowledge.ts` both imported
`log` from `../index` — the server's entry point, whose boot IIFE is **unguarded**. Importing either
seed from a CLI runner booted the entire server: an Express listener, the route table and the media
mount, all to insert some rows. Both now log locally. **The seeds could not be operator-invoked
until this was fixed, which is why "just unwire it" was never the whole item.**

### 3.3 The backfill is retired, not merely unhooked

`server/template-migration.ts` is **deleted**. It was never a live owner and the platform said so in
its own read-port: *"that file is a ONE-TIME BACKFILL SCRIPT (`runTemplateMigration()`) with no read
methods, not a live owner. The real owner is `server/storage.ts`"*
(`server/intelligence/handlers/templates-read-port.ts`). Wired to boot, a one-time backfill becomes
a **permanent `meals → meal_templates` synchronisation bridge** — Principle 7, exactly.

Three facts justified deletion over deprecation:
1. **The real write path already exists** — `storage.updateMealTemplateId` and
   `auto-import-service.ts` set `meals.mealTemplateId` where it genuinely belongs.
2. **It wrote into a store already retired** — `meal_plan_entries`, which the Planner domain's own
   check calls a *"dead store"*. The backfill was feeding a corpse.
3. **Its output is 1,261 of 1,316 `meal_templates` rows** — stubs named after meals with the
   description `'Auto-created template'`, which the gate separately fails as *"boot-job stubs, not
   owner-published templates"*.

### 3.4 The destructive wipe is gone

`seedReadyMeals` unconditionally nulled `image_url` on **every** system meal at boot. It owns the
`READY_MEALS` set; `is_system_meal` is a far wider set that also covers the 500 Founding Cookbook
rows **it does not own**. CONV1: *"harmless only because the cookbook has no images yet; the day it
gains them, boot wipes them."* Removed. **A publisher may correct what it authored and nothing else.**

### 3.5 A gate's own prose went stale the moment the code converged

The Planner check `pl-dead-store` ended its detail with *"— and template-migration still writes it at
boot"*, **hardcoded**. WRITE-4 made that false. Corrected to *"residue only; no writer remains"*.

> **A gate's prose rots exactly like a document's.** This is the `DOC` class living inside the
> verification layer itself — and a check that reports a fixed cause is how a real finding gets
> dismissed as noise.

### 3.6 The gate is a naive source-text match — and P2's own comment tripped it

`xc-boot-publication` greps `server/index.ts` for the literal strings `runTemplateMigration()`,
`seedReadyMeals()` … **It cannot tell a call from a comment about one.** The first draft of the
explanatory comment left in this report's § 3.1 named all four functions with parentheses, and **the
gate stayed red on a file with no writers in it.** The comment now names no function and says why.

**Reported, not worked around silently:** a future edit that merely *mentions* one of these calls in
prose will fail this check. The check is right to be crude — but its crudeness is now documented at
the one site that has to live with it.

---

## 4. `BEH-8` — what was actually done, and the decision that was not ours

### 4.1 CONV1's inventory is stale; its impact numbers are exact

Verified at source (lesson `L1` — *never inherit a claim, however well cited*):

| CONV1 says | Live tree says |
|---|---|
| "a registry of **25**" | **24** |
| 5 gated out, incl. **`household-health`** | **`household-health` does not exist.** 6 are gated out |
| "killing **6** registry-declared enrichment items and **1** guidance block" | **Exactly right**: `food-intelligence` 3 + `evidence-learning` 2 + `opportunity-delivery` 1 = **6**; `food-intelligence` carries the **1** block |

> **The count was right and the names had rotted** — `L1`/`L2` again, in the same document that
> teaches them.

**Two of the six were gated out CORRECTLY and had to stay that way.** `administration`
(`minimumRole: admin`) and `developer` (`availability: "never"` — TIP1 § 7, the developer plane is
*physically isolated*). **The gate's own check is over-broad**: `cr-domain-bridge` demands the bridge
cover *all* registered capabilities. **Obeying it literally would have made the admin and developer
planes Companion-reachable — a privilege escalation delivered in the name of a green check.**

**`product-knowledge` declares zero enrichment and zero guidance** — gated out, but nothing of it was
being killed. Its harm was latent, not live.

### 4.2 The decision was put to the user, not invented

The Card vocabulary has **7 terms** (`meal · planner · shopping · pantry · diary · nutrition ·
household`), owned by `native-discovery.ts`'s `DISCOVERY_DOMAINS`. Three of the four user-facing
gated-out capabilities are **cross-cutting and fit none of them**. Assigning a Card domain is
user-visible presentation, which the Experience canon owns — **so it was asked.**

**The user's direction:** *extend the Companion Card vocabulary so it can represent cross-cutting
platform capabilities rather than forcing them into a House domain; preserve the distinction between
user destinations and platform capabilities.*

### 4.3 The governing document then supplied the discriminator — no invention was needed

`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`:

> **Next Steps** — result-level actions over the whole set (e.g. View All), **routing to the domain's
> canonical landing page.**

**A Card domain is a destination, because Next Steps route to it.** And the registry **already
declares** which capabilities are not destinations, in their own descriptions: `food-intelligence`
*"owns zero business-domain data, Rule FI1"*; `opportunity-delivery` *"owns zero business-domain data
and zero producer reasoning"*; `evidence-learning` *"owns zero business-domain data"*.

> **A capability that owns no business-domain data has no landing page — because it has no data of
> its own to land on.**

Forcing `opportunity-delivery → planner` would have routed a household to the Planner for a fact the
Planner does not own: the false provenance INT17 § 4.5 forbids. All three declare enrichment that is
purely *an explanation of how the platform reasons* — *"No citation, no card"*, *"Patterns, never a
single event"*, *"Opportunities are suggestions, not actions"*. **Attribution, never routing.**

### 4.4 The vocabulary, extended by exactly one term

| Class | Meaning | Guidance TARGET? | Enrichment SOURCE? |
|---|---|---|---|
| one of the 7 rooms | a **user destination** — has a canonical landing page | ✅ | ✅ |
| **`platform`** *(new)* | a **cross-cutting capability** — no landing page | ❌ **never** | ✅ |
| *absent* | **not Companion-reachable** (`administration`, `developer`) | ❌ | ❌ |

`CAPABILITY_DOMAIN` is **deleted**. The Capability Registry declares each capability's own
`companionDomain`; `companion-guidance.ts` and `companion-enrichment.ts` both read the one owner.
Principle 7's bridge is gone — **and the exclusions are now a declaration rather than an omission,
which is the whole difference between a decision and a gap.**

`food-intelligence`'s guidance block targets `meals` and `planner` — **both rooms** — so it resolves
correctly as a `platform` source: the 1 dead guidance block and all 6 dead enrichment items are live.

### 4.5 The gate could have been satisfied dishonestly, and was not

`cr-domain-bridge` passes the moment `CAPABILITY_DOMAIN` stops existing (`bridgeIds.size === 0` →
*"No CAPABILITY_DOMAIN bridge remains"*). **Deleting the table and doing nothing else turns the check
green while all six enrichment items stay dead.** That is § 8.3's *"new defect wearing a canonical
badge"*, and it is the reason the decision at § 4.2 was escalated rather than taken quietly.

**Tests now defend it, not the absence of the table** (`test-intelligence-companion-guidance.ts`):
every user-reachable capability must declare a domain — *register one without it and the suite
fails*; `administration`/`developer` must declare none; a `platform` capability must never be a
destination; and `food-intelligence`'s guidance must resolve end-to-end.

---

## 5. THE GATE TARGET — resolved by measurement, as P1 required

CONV1 § 7 demands **reds 6 → 4**. Its item entries claim **three** red domains (`WRITE-4`: *"two of
the six red domains are this item"*; `BEH-8`: *"one of the six"*). Both cannot be right, and **neither
is**. Measured:

| Red domain | P2's effect | Still red? |
|---|---|---|
| **Capability Registry** | `cr-domain-bridge` FAIL → PASS | ✅ **🔴 → 🟡** |
| **Meal Templates** | `mt-boot-bridge` FAIL → PASS; writers 3 → 2 | ❌ **still red** |
| **Meals** | writers 10 → 9; image-wipe WARN cleared | ❌ **still red** |
| Household Dietary Preference · Pantry · Nutrition — Boost/Uplift | untouched (P4 / other phases) | ❌ |

**Why Meal Templates cannot go green in P2, and why that is correct:**
1. `mt-writer-census` — `server/storage.ts` still writes `meal_templates` and is not an authorised
   writer. **Authorising it is an ownership decision, not P2's** (Register Rule 7).
2. `mt-shell-structure` — **1,261 stub rows**. Retiring a writer does not delete its output. Removing
   them is **destructive data surgery** on rows `meals.meal_template_id` points at, and it is neither
   a "pure deletion of a parallel mechanism" nor authorised anywhere in P2's scope.

**Why Meals cannot go green in P2:** eight unauthorised writers remain (`world-seeder.ts`,
`meal-service.ts`, `openfoodfacts-importer.ts`, `seed-ready-meals.ts`, three scripts). P2 removed the
one that was a *bridge*. **The rest is the Meals write-funnel convergence — a different item.**

> **The one thing P2 refused:** making 6 → 4 true by adding the remaining writers to
> `authorisedWriters`. That is turning a gate green by lowering it, and it is the exact failure the
> phase exists to end. **The number is 5. It is reported as 5.**

---

## 6. THE COHERENCE CHECKS — and what they caught on day one

`npm run verify:coherence` (`scripts/ci/verify-governing-coherence.ts`). Both of CONV1 § 8.2's
"Low cost" checks; **deliberately not the third** (*"no two governing documents name different owners
for one domain"*, graded Medium — it needs a machine-readable ownership claim THA does not have).

```
COH-1  Register domains checked: 33  (against 91 declared tables)
COH-2  file:line citations checked: 102  (across 43 governing documents)

  ✗ [FAIL] …REGISTER.md — Domain 6: Dietary Rules (Pattern Matching)
      names source of truth `server/lib/dietRules.ts`, which does not exist on disk.
  ✗ [FAIL] …REGISTER.md — Domain 18: Nutrition Boost Display
      names source of truth `nutrition-benefit-library.ts`, which does not exist on disk.

COH-2: ✓ clean          2 failed, 0 warned.
```

### 6.1 Two real defects, neither in CONV1's 24-item census

- **Domain 6** names `server/lib/dietRules.ts`. **The file is `shared/dietRules.ts`.** It moved; the
  document that owns ownership never noticed. Verified: `shared/dietRules.ts` exists and is read by
  `routes.ts`, `smart-suggest-service.ts`, `planner-compliance.ts`.
- **Domain 18** declares its Authoritative Source **"Contested"** between
  `nutrition-benefit-library.ts` and the WS0 Knowledge Registry. **`nutrition-benefit-library.ts`
  exists nowhere in the tree.** The Register records a live contest between WS0 and a file that
  does not exist.

> **This is the checks' whole argument, made on their first run.** CONV1 audited every domain by
> hand for three days and found neither. **A gate does not get tired at Domain 6.**

### 6.2 A correction to CONV1 § 8.2's own claim

§ 8.2 states COH-2 *"would have caught … `capabilities/household.md`'s rotted `:8526–8541`
reference"*. **It would not have.** `server/routes.ts` has **12,869** lines, so `:8526–8541`
**resolves**. That rot was **semantic** — the citation pointed at the wrong *code*, not at nothing.

**A `file:line` check catches a citation that resolves to nowhere; it cannot catch one that resolves
to the wrong place.** The ceiling is stated in the script's own header, and it is why `DOC-1`'s
lesson `L2` — *cite the owner and the behaviour; a line number is a claim with a short half-life* —
remains the better practice. **No gate replaces it.**

*(COH-2 finding nothing is a real result, not an empty one: the two surviving `8526` strings in
`household.md` are inside `DOC-1`'s correction notes, quoting the text it removed. **P1's corrections
hold — and are now defended.**)*

### 6.3 Three false positives were found and removed before shipping

A gate that invents findings gets switched off (`R2`), so every finding was verified at source and
the checker fixed until only true ones survived — **36 → 2**.

| False positive | Why it was wrong | Fix |
|---|---|---|
| ~30 × *"`schema.ts:2556` — file does not exist"* | **Basename shorthand.** The canon cites a full path once, then shortens it, exactly as a reader would | Resolve basenames via a repo index; **skip ambiguous ones rather than guess** |
| *"Domain 22 names `client/src/lib/nutrition-variety.ts`, which does not exist"* | **The retired rival.** The row says the contest *"was resolved by M4 in the canonical seed's favour"* — the file is gone **because the architecture won** | Judge only the **first** artefact (the declared owner); everything after is commentary |
| *"`:8544` in `world-seeder.ts` — file has 625 lines"* | **Bare refs bind by meaning, not position.** That line cites two files; a human binds `:8544` to `routes.ts` instantly, from the word *"Routes"* | Adjudicate a bare ref **only on a line naming exactly one file** |

> **Coverage was deliberately surrendered in all three cases.** A false failure is paid for out of
> the gate's credibility; a missed one is paid for out of the codebase. **The first account is much
> smaller.**

### 6.4 Not wired into `release:check` — and why

`verify:coherence` **fails today**, on the two real defects above. Adding it to `release:check` now
would break every build for a defect P2 is not authorised to fix (§ 8). **Wiring in a red gate is how
`R2` is manufactured, not cured.** It is a named, runnable gate; wiring follows the correction.

---

## 7. ARCHITECTURE COMPLIANCE

- **Bootstrap (STEP 2):** `docs/architecture/README.md` read first. `ARCHITECTURE_PRINCIPLES.md`,
  the SoT Register, `CANONICAL_PUBLICATION_ARCHITECTURE.md`, `REPOSITORY_CONVENTIONS.md`,
  `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` and
  **`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`** (which decided `BEH-8`) read where they bear.
- **Principle 2 (one owner per fact):** `BEH-8` returns the Companion domain to the Capability
  Registry. **Zero new owners** — CONV1's defining property, preserved.
- **Principle 7 (no permanent sync bridges):** both items are this principle. The
  `CAPABILITY_DOMAIN` bridge and the boot-time `meals → meal_templates` bridge are **deleted, not
  deprecated**.
- **Principle 8 (retire on introduction):** `template-migration.ts` and `CAPABILITY_DOMAIN` are gone
  in the same change that replaced them. Nothing was left "for now".
- **CPuBA4 (one write funnel):** the four boot writers are behind the declared `npm run seed:*`
  mechanism — **which this phase had to build** (§ 3.2).
- **AI ARCHITECTURE COMPLIANCE:** no second assistant, no duplicated conversation state, no
  fabricated capability. `BEH-8` **narrows** nothing and **opens** nothing that permissions did not
  already allow: `administration`/`developer` remain unreachable, now by declaration.
- **`ENGINEERING_WORKFLOW.md` STEP 8:** not applicable — P2 is not a 🔴 RED implementation in a
  contested domain. CONV1 § 7.1 owns the programme; STEP 8 owns the per-implementation report.
- **Product Registry:** no user-facing surface added, changed or retired. **No entry is affected.**
- **Adoption Register:** no client-side building block touched. `adoption:check` **unchanged**
  (64/2).
- **Experience & UI:** `BEH-8` alters what the Companion may *say* (6 enrichment items, 1 guidance
  block, previously dead) but adds **no** component, token, colour, route or layout. The Card
  framework is untouched; the vocabulary gained one term, on the user's direction and on the Card
  principle's own words (§ 4.3).

---

## 8. WHAT THIS PHASE DELIBERATELY DID NOT DO

| Not done | Why |
|---|---|
| **Correct Domain 6 / Domain 18** | **A correction to governing architecture is a separate, deliberate act** (CONV1 § 9). They are `P1`-class (`DOC`) items, and **P1 is closed**. Found by P2's gate, **reported here, not silently edited** — § 9. |
| **Delete the 1,261 stub template rows** | Destructive data surgery on rows `meals.meal_template_id` references. Not a "pure deletion of a parallel mechanism"; needs its own decision. |
| **Authorise the remaining `meals` / `meal_templates` writers** | **Turning a gate green by lowering it.** An ownership decision (Register Rule 7), not P2's. |
| **Build § 8.2's third check** | Graded **Medium**, and it needs a machine-readable ownership claim. Two of three, and saying so. |
| **Give `administration` / `developer` a Companion domain** | The gate's literal demand. **It would be a privilege escalation** (§ 4.1). |
| **Give the three cross-cutting capabilities a room** | Would assert a provenance the room does not own. **The user was asked; the Card principle decided** (§ 4.2–4.3). |
| **Re-record the typecheck baseline** | 32 regressions exist and **none is P2's** (§ 2). The gate says it plainly: *"do NOT re-record the baseline to make this pass."* |

---

## 9. NEXT — recommended, not decided

| # | Workstream | Why here | Cost |
|---|---|---|---|
| **1** | **Correct Domain 6 + Domain 18** (a `DOC`-class item; `P1`-shaped) | **`verify:coherence` is red on two verified defects.** Both are one-line factual corrections with **zero rule change and zero ownership change** — Domain 6's owner *is* `dietRules.ts`, only the path is wrong. **Closing them turns the new gate green and lets it be wired into `release:check`** (§ 6.4). **A gate that ships red and stays red is `R2` reborn — in the phase built to end it.** | **Low** |
| **2** | **P3 — `BEH-1` · `BEH-4` · `BEH-7`** | CONV1's order, unchanged. Independent, low-risk, **user-visible**. `BEH-4` is *"the first thing a new household sees, and it is off by one"*, and **must first absorb `DOC-3` § 5.1's `opportunity-engine.ts:82` finding** | Low |
| **3** | **`OWN-5` follow-on `F1`** — EL1's seven ownership violations | `OWN-5` grades it highest of its six follow-ons; **the verifier itself is a violator** | Medium |
| **4** | **P5 — `OWN-4` → `OWN-3` → `SCH-1`** | **`R1` is CONV1's highest and likeliest risk** — the declared owner is never built. `OWN-4` has no dependencies and is reverted by deleting one file | Low |
| **5** | **P4 — The Household Person ★** | The largest convergence; **the only one where a mistake reaches a plate.** `WRITE-3` → `WRITE-2` → `OWN-1` → scaffolding last (`CP2`, `CP3`) | High |

**Two orderings P2 confirms are not negotiable:** the scaffolding still comes down last (`R7`), and
`BEH-5` still cannot precede `SCH-2` (`R3`).

**A note for whoever takes item 1.** `COH-1` currently verifies **only the first artefact** each
Authoritative Source row names — the declared owner. A row naming an owner *plus six of its tables*
is verified on the owner alone. That ceiling is deliberate (§ 6.3) and is the obvious place to
deepen the check **once it is green**, never before: a check nobody trusts cannot be extended.

---

## 10. ROLLBACK

**Identifier:** `rollback/CONV1-phase-p2-gate-convergence-20260716` → `7d1dd2ce`

> ⚠️ **The tag is a marker, not a restore point.** `7d1dd2ce` predates every uncommitted P0/P1
> correction in a tree dirty from ~9 concurrent sessions. **A tag checkout would destroy them.**
> This is the same qualification the P1 milestone recorded, and it still holds.

**To roll back P2, revert these files individually:**

| Action | Path |
|---|---|
| restore | `server/template-migration.ts` *(the only deletion — `git checkout 7d1dd2ce -- server/template-migration.ts`)* |
| revert | `server/index.ts` · `server/lib/seed-ready-meals.ts` · `server/lib/seed-food-knowledge.ts` · `scripts/ci/setup-test-database.ts` · `package.json` |
| revert | `server/intelligence/types.ts` · `capability-registry.ts` · `intelligence-platform.ts` · `conversation/companion-guidance.ts` · `conversation/companion-enrichment.ts` · `conversation/personality-registry.ts` · `server/verification/publication-register.ts` |
| revert | `server/tests/test-intelligence-companion-guidance.ts` · `test-intelligence-companion-enrichment.ts` |
| delete | `scripts/ci/verify-governing-coherence.ts` · `server/seeds/run-boot-retired-seeds.ts` · this report |

---

*Implementation report for CONV1 Phase P2. It creates no rule and is not law. Subordinate to the
governing architecture, which prevails in any conflict.*
