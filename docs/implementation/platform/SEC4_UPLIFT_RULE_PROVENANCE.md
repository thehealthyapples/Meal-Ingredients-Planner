# SEC4 — An Applied Uplift Must Cite a Rule Its Owner Authored — Implementation

**Status:** IMPLEMENTED — application code. CONV1 item `SEC-4` only.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `SEC4_Uplift_Rule_Provenance`
**Authority:** [`CONV1 — The Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § 3 (`SEC-4`), § 5 (rank 2), § 7 (P0). Source finding: [`CPI1`](../../investigations/platform/CPI1_CANONICAL_PUBLICATION_INTEGRITY_AUDIT.md) S1-3.
**Governing architecture read:** `docs/architecture/README.md` (bootstrap), `ARCHITECTURE_PRINCIPLES.md` (Principles 4, 6, 7, 8), `CANONICAL_PUBLICATION_ARCHITECTURE.md` (**CPuBA3**, CPuBA4, CPuBA6), `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (D17, D18), `REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md` (STEP 8), `THA_UI_ARCHITECTURE.md` § 17.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback ID** | **`rollback/SEC4-uplift-rule-provenance-20260716` → `7d1dd2ce`** |
| Created | **Before any file was touched** (`ROLLBACK_PROTECTION_PROTOCOL.md` § 1) |
| Annotated? | Yes (`-a`), resolved with `^{commit}` as § 2 requires |
| **⚠️ What the tag does NOT cover** | **`server/routes.ts` and `package.json` were ALREADY DIRTY** when this began — LIFE2's and concurrent sessions' uncommitted work. A tag protects **committed state only** (§ 3). **That work was not authored here, and it was preserved** (§ 10.1) |
| **No stash taken** | Deliberate. A stash would have destroyed ~20 concurrent sessions' trees |
| **Extra protection** | All four target files copied outside the repo **before** editing, because the tag is *not* sufficient for the two dirty ones (§ 3: *"If you intend to delete anything, snapshot it first, outside the repo"*) — which mattered, since this change deletes a file |
| Files this workstream touched | **6** (3 modified, 1 deleted, 2 created). Nothing else |

---

## 1. WHAT WAS WRONG

`POST /api/uplift/accept` (`routes.ts:11088`) took **every field of every suggestion from the request body** and wrote it to `meal_uplift_applications` verbatim:

```js
const application = await storage.createUpliftApplication({
  ruleId: suggestion.ruleId,          // ← the caller's
  ruleName: suggestion.ruleName,      // ← the caller's
  ingredient: suggestion.ingredient,  // ← the caller's
  action: suggestion.action,          // ← the caller's
  quantity: suggestion.quantity ?? null,
  explanation: suggestion.explanation, // ← the caller's
  addedBy: 'tha_uplift',              // ← hardcoded, and therefore a lie
```

**There was no validation of any of it.** Not against `UPLIFT_RULES` (the canonical owner, SoT Domain 17), not against the `reviewedAt` approval gate, not against anything.

And the client was already exploiting it. `weekly-planner-page.tsx:337` minted a rule identity that exists **nowhere on the server**:

```js
return {
  ruleId: "fallback-deterministic-boosts",   // a rule the owner never wrote
  ruleName: "Nutrition Boost",
  suggestions: deduplicated.map((boost) => ({
    ingredient: boost.name,
    action: "add" as const,
    why: `A nutritious ${boost.category.replace("-", " ")} suggestion for this meal.`,  // ← prose templated in a browser
  })),
```

It wrapped a **second, rival boost vocabulary** (`client/src/lib/nutrition-boosts.ts`) and showed it in `MealUpliftPanel` **beside** the owner's reviewed rules, visually identical to them. On accept it was persisted stamped `added_by: 'tha_uplift'`.

> **So a nutrition suggestion invented in a browser, with an explanation written by a template, was indistinguishable in the database from guidance a human reviewer had signed off.** The `reviewedAt` gate — the platform's own approval mechanism, which `uplift-engine.ts:57` and `:274` apply on **every** match — was bypassed entirely on the write path.

**The engine already knew better.** `uplift-types.ts:77-80`, on `reviewedAt`:

> *"ISO date string (YYYY-MM-DD). **Rules without this value are excluded from production matching — this is the approval gate.**"*

**42 of 43 rules are reviewed. One (`draft-omelette-rule`, *"Draft suggestion — under review."*) is not — and the accept endpoint would have taken it.** The gate existed on the read path and had no counterpart on the write path.

**The live evidence:** the publication gate found **8 rows** citing `fallback-deterministic-boosts` — 8 of the 11 rows in the table.

---

## 2. WHAT CHANGED

### 2.1 `server/lib/uplift-persistence.ts` — the rule (new, pure)

`resolveAcceptedSuggestions(claimed, rules)` answers one question — **does the canonical owner actually author this?** — and returns **the owner's copy**:

```js
const rule = rules.find(r => r.id === claim?.ruleId);
if (!rule)            return { ok: false, reason: `Unknown uplift rule: …` };
if (!rule.reviewedAt) return { ok: false, reason: `Uplift rule is not approved for use: …` };

const authored = rule.suggestions.find(
  s => normaliseIngredientForMatch(s.ingredient) === normaliseIngredientForMatch(claim?.ingredient)
       && s.action === claim?.action,
);
if (!authored)        return { ok: false, reason: `Rule … does not author suggestion: …` };
```

**Three gates, and each closes a distinct hole:**

| Gate | Closes |
|---|---|
| The rule exists | An **invented** rule identity — `fallback-deterministic-boosts`, or anything else a caller dreams up |
| `reviewedAt` | A **real but unapproved** rule. *The same gate `uplift-engine.ts` applies when matching — a rule that cannot be matched must not be acceptable either* |
| The rule authors this suggestion | A **real reviewed rule smuggling an unauthored ingredient** — citing `mac-cheese-turmeric-pepper` to add double cream |

**Why this module.** Its own docblock says *"Pure business logic for accepted uplift persistence. No DB calls here — only deterministic transformation functions"*, and it already owns `AcceptedSuggestion`, `mergeUpliftIngredients` and `buildForkName` — every other helper on this exact path. **The route was never the right owner of the rule; it was just where the rule wasn't.**

**`rules` is a required parameter, never an ambient import.** The module stays pure and dependency-free, the caller supplies the registry, and the tests drive it with fixtures. This is the injectable-seam idiom the codebase already uses well (`seasonal/engine.ts:320`, `companion-growth.ts:63`).

### 2.2 `server/routes.ts` — the endpoint obeys it

```js
// Resolve against the canonical owner and discard the caller's copy. Done
// BEFORE the fork below, so a rejected request never forks a system meal or
// mutates an ingredient list.
const resolution = resolveAcceptedSuggestions(suggestions, UPLIFT_RULES);
if (!resolution.ok) {
  return res.status(400).json({ message: resolution.reason });
}
const resolved = resolution.resolved;
```

Then **both** downstream uses take the owner's values, not the caller's:

| Before | After |
|---|---|
| `const ingredientsToAdd = suggestions.map(s => s.ingredient);` | `= resolved.map(r => r.suggestion.ingredient);` |
| `ruleId: suggestion.ruleId` · `ruleName: suggestion.ruleName` · `explanation: suggestion.explanation` | `ruleId: rule.id` · `ruleName: rule.name` · `explanation: suggestion.why` — **all the owner's** |

> **`addedBy: 'tha_uplift'` is unchanged, and that is the point of the whole change: it is now true.**

**Placement is load-bearing.** Resolution runs **before** `storage.getMeal` and the system-meal fork. Previously a bad request could fork a system meal and mutate an ingredient list *before* failing. It cannot now — proven in § 6, Test 6.

### 2.3 `client/src/pages/weekly-planner-page.tsx` — the minted identity is deleted

`buildFallbackUpliftMatch` and `buildMergedMatches` are **removed**. The three call sites now use `serverMatches` directly — the uplift rules the owner authored and reviewed, and nothing else.

**Nothing replaces the fallback.** An unreviewed suggestion is not one THA is entitled to make (Principle 6 — *"No fabricated knowledge — honest gaps over invented facts… Trust is the product. This is non-negotiable"*). This is LIFE2's shape exactly: **the fix is a deletion.**

Five imports became unused with it and were removed (`getMealBoosts`, `computeRestrictionSafety`, `EaterProfile`, `shouldExcludeRecipe`, `normaliseForReuse`).

### 2.4 `client/src/lib/nutrition-boosts.ts` — **deleted**

Removing the fallback left this file with **zero importers**, and `adoption:check` failed on it as a **NEW orphan**.

**The adoption register offers three responses — *"adopt it, delete it, or record it in the register with an owner"*. Recording it would have been wrong**, and the register's own note says why:

> *"They are recorded as **defects, not exemptions**: an exemption says 'this is fine', and these are not fine. They are simply no longer hidden. **The gate fails on a *new* one.**"*

> **The gate is designed to fail when someone leaves dead code behind. Registering an orphan I had just created would have been using the escape hatch to defeat the gate's own purpose** — the same dishonesty as raising a ceiling to make a check pass, which LIFE2 § 8 refused by name.

**So it is deleted, and this is cleaning up after this change rather than scope creep:** its only consumer was the SEC-4 defect, and this change removed it. Leaving a rival boost vocabulary in the tree with no consumers is the loaded gun — the next engineer wires it back in and re-creates SEC-4.

**It does not touch what Domain 18 describes.** `ARCHITECTURE_PRINCIPLES.md:135` contests *"Nutrition Boost Display"* against **`nutrition-benefit-library.ts`** — a file that **no longer exists** (CPI1 § 4.4 recorded that the Register is stale here and *"is silent on the contest that IS live"*). **Correcting that staleness is CONV1 `DOC-1`/`DOC-4`'s work, not this workstream's** — and this change deliberately does not perform it (§ 9).

**Nothing is lost.** 193 lines, recoverable forever: `git show 7d1dd2ce:client/src/lib/nutrition-boosts.ts`. Also snapshotted outside the repo before deletion. **If those boosts are worth showing, the honest path is to graduate them into `UPLIFT_RULES` with a reviewer and a `reviewedAt` — which is exactly what the deleted file was a way of avoiding.**

---

## 3. WHAT THIS MEANS FOR HOUSEHOLDS

**Stated plainly, because it is a real loss.**

A household that previously saw extra "Nutrition Boost" suggestions on a planner meal will now see fewer, or none, where the owner's rules do not match that meal.

> **Those suggestions were never THA's reviewed guidance.** They were a browser's, wrapped in a rule identity the server had never heard of, with an explanation assembled from a category name. **They were presented as though a reviewer had approved them.** The suggestions that remain are the 42 rules a human signed off — and a household can now trust that every one of them was.

This is LIFE2's trade, in a different domain: *"They lose a number that was never theirs."*

---

## 4. DATA IMPACT

```
GOVERNANCE GATE
===============
Domain affected:         17 (Nutrition Boost / Uplift Rules) — WRITE PATH.
                         18 (Nutrition Boost Display) — a rival client vocabulary
                            with zero consumers deleted. Domain 18's own contested
                            entry names a DIFFERENT, already-deleted file and is
                            NOT amended here (§9).
Declared SoT:            server/lib/uplift-rules.ts (UPLIFT_RULES) — unchanged,
                         still authoritative, and now actually obeyed.
Ownership changed?       NO. The owner was always correct; it was being bypassed.
New store created?       NO.
Existing store extended? NO.
Schema modified?         NO. No column added, altered, or dropped. No migration.
Data written?            NONE by this change.
Data deleted?            NONE. The 8 historical phantom rows are untouched (§5.1).
Consumer created?        NO.
New write funnel?        NO — the existing funnel now validates (CPuBA4).
New knowledge store?     NO (Register Rule 8 does not fire).
```

### 4.1 The 8 historical rows — deliberately NOT touched

`up-phantom-rules` still fails: **8 rows cite `fallback-deterministic-boosts`.** They are **not** cleaned up, and the reason is not laziness.

**Those rows are the undo path.** `DELETE /api/uplift/applications/:id` (`routes.ts:11205`) reads the row to know **which ingredient to strip from the meal**:

```js
const { ingredients, removed } = removeUpliftIngredient(meal.ingredients, application.ingredient);
```

> **Deleting the 8 rows would strand 8 real ingredients in real households' meals — with no record of why they are there and no way to remove them through the UI. That is strictly worse than a false provenance stamp.**

Re-stamping `added_by` would not fix the check either (it reads `rule_id`), and adding `fallback-deterministic-boosts` to `UPLIFT_RULES` would **ratify the violation as law** — the error CONV1 refuses throughout.

**So the check stays red, and it is telling the truth: 8 rows do cite a rule the owner never authored. That is the state of the database.** What changed is that **no new such row can ever be created.** The red is now archaeology rather than a live leak — and what to do with the history is a **product and data-retention decision**, named as a follow-up (§ 12), not taken here.

---

## 5. VERIFICATION — THE TEST SUITE

`server/tests/test-sec4-uplift-rule-provenance.ts` — **24 assertions, pure, no server required.**

**That last property was a design constraint, not a convenience.** **No test in the aggregate `npm test` suite drives HTTP** — verified. So a validator left inline in the route could only ever have been tested by hand, and CONV1's own **CP10** says *a convergence is finished when a gate can fail*. **Putting the rule in `uplift-persistence.ts` is what makes it guardable** — the architecture and the testability had the same answer.

```
Case 1 — a rule the owner never authored is rejected
  ✓ ★ the exact identity the client used to mint is rejected
  ✓ and the reason names the unknown rule
  ✓ ★ ANY invented rule id is rejected, not just the known one
  ✓ a missing ruleId is rejected, not defaulted

Case 2 — a real but UNREVIEWED rule is rejected (the reviewedAt gate)
  ✓ ★ an unreviewed rule cannot be accepted
  ✓ and the reason names the approval gate

Case 3 — a real rule cannot carry a suggestion it does not author
  ✓ ★ citing a real rule with an invented ingredient is rejected
  ✓ and the reason names the rule and the suggestion
  ✓ a real ingredient with the wrong action is rejected

Case 4 — the owner's values are returned, the caller's are discarded
  ✓ a lying-but-resolvable claim still resolves
  ✓ ★ ruleName comes from the owner, not the caller
  ✓ ★ quantity comes from the owner
  ✓ ★ explanation comes from the owner
  ✓ ingredient is the owner's

Case 5 — a legitimate accept resolves (the fix must not break the feature)
  ✓ ★ an honest claim resolves
  ✓ one resolved suggestion
  ✓ the rule is the owner's
  ✓ multiple suggestions from one rule resolve
  ✓ both resolved
  ✓ ingredient matching tolerates case and surrounding whitespace

Case 6 — one bad suggestion rejects the whole request
  ✓ ★ a batch containing one phantom is rejected entirely

Case 7 — against the live UPLIFT_RULES registry
  ✓ ★ the phantom is rejected by the real registry too
  ✓ ★ a real reviewed rule (mac-cheese-turmeric-pepper) still resolves
  ✓ ★ the live unreviewed rule (draft-omelette-rule) is rejected

24 passed, 0 failed
```

**Case 5 is as important as Case 1.** A validator that rejects everything would also pass Cases 1–4. The fix cannot break the feature, and the reason it cannot is structural: `uplift-engine.ts:306` returns `rule.suggestions` **verbatim**, so a client echoing back a match it was given always resolves.

**Case 7 is deliberately not fixture-driven** — it runs against the live registry, so it fails if someone deletes `draft-omelette-rule` or unreviews a rule the suite assumes.

Registered as `test:sec4-uplift-rule-provenance` **and added to the aggregate `test` suite** (CP10).

### 5.1 The client half is guarded, and not duplicated here

The publication register's **`up-client-publisher`** check already asserts the minted identity is absent from `weekly-planner-page.tsx`. **It went green with this change** (§ 7). Re-asserting it in the test suite would create a second owner of a check that already exists.

*(One consequence worth recording: the register's check is a source-pattern match, so even naming the retired identity in an explanatory comment in that file would keep it red. The comment left behind describes the retired fallback without naming the string.)*

---

## 6. MANUAL VERIFICATION — DRIVEN AGAINST A LIVE SERVER

**Port 5097.** The concurrent session's server on 5000 was left untouched and confirmed still up afterwards.

| # | Request | Expected | **Observed** |
|---|---|---|---|
| 1 | `ruleId: "fallback-deterministic-boosts"` — **the client's real payload** | reject | **400** — `Unknown uplift rule: fallback-deterministic-boosts` |
| 2 | `ruleId: "anything-i-invent"` | reject | **400** — `Unknown uplift rule: anything-i-invent` |
| 3 | `ruleId: "draft-omelette-rule"` — **real, unreviewed** | reject | **400** — `Uplift rule is not approved for use: draft-omelette-rule` |
| 4 | `ruleId: "mac-cheese-turmeric-pepper"` + `ingredient: "double cream"` | reject | **400** — `Rule mac-cheese-turmeric-pepper does not author suggestion: add double cream` |
| 5 | **★ A legitimate accept, with the caller lying about every other field** | accept, and store the **owner's** words | **201** — see below |
| 6 | The 4 rejected requests | mutate nothing | meal ingredients `['macaroni','cheddar','milk','turmeric']` — **no rejected ingredient leaked** |
| 7 | A phantom against a **system meal** | must not fork | **400**; meal count **889 → 889** — **no fork** |

**Test 5 — the whole change in one observation.** The caller sent `ruleName: "Doctor-approved miracle cure"`, `quantity: "700 kg"`, `explanation: "Clinically proven to prevent disease."` against a real rule:

```
  PERSISTED ROW:
    ruleId:      mac-cheese-turmeric-pepper
    ruleName:    Mac & cheese — turmeric + black pepper
    quantity:    ½ tsp
    explanation: Adds colour and supports anti-inflammatory variety. Pair with a pinch of black pepper.
    addedBy:     tha_uplift

  Caller's fabrications persisted: False
  >>> PASS — the owner's words were stored; the caller's were discarded
```

> **A caller claimed a miracle cure at 700 kg and the database recorded half a teaspoon of turmeric, in the reviewer's own words.** Note what that means for the EFSA wording firewall the authoring guidelines impose (*"Avoid: cures, prevents, guarantees, detox, miracle, clinically proven"*): it applies to `uplift-rules.ts`, and **until now the endpoint let a caller route straight past it.**

**Cleanup.** The test server was stopped; **the database was restored to exactly its pre-SEC4 state** — verified:

```
  fallback-deterministic-boosts ×8     ← the 8 historical rows, untouched
  cereal-seeds-addition ×1
  soup-legume-fibre ×1
  salad-seeds-evoo-acv ×1
```

**Two rows I created were found and removed**, and recording that is the point of checking: running the (unregistered, diagnostic) `test-uplift-transaction-boundary.ts` inserted **2 `test_rule_boundary` rows** which it did not clean up, and my own E2E left **1 `mac-cheese-turmeric-pepper` row** plus a demo user and 5 meals. **All removed.** A verification that leaves its own residue in the table it is auditing is not a verification.

---

## 7. GATE MOVEMENT — MEASURED, NOT CLAIMED

| Gate | Before | After |
|---|---|---|
| **`verify:publication`** — checks | 24 passed · 24 warned · **12 failed** | **26 passed · 23 warned · 11 failed** |
| `up-client-publisher` — *"No client code mints uplift rule identities"* | ❌ **FAIL** | ✅ **PASS** |
| `up-rival-display` — *"No rival client-side boost vocabulary"* | ⚠️ **WARN** | ✅ **PASS** |
| `up-phantom-rules` — *"Every applied uplift cites a rule its owner authored"* | ❌ FAIL (8 rows) | ❌ **FAIL (8 rows)** — § 4.1 |
| Domain: Nutrition — Boost / Uplift | 🔴 | 🔴 — **one check from green** |
| Domains overall | 5 🟢 · 11 🟡 · 6 🔴 | **unchanged** |
| `adoption:check` | 64 passed · 2 failed | **64 passed · 2 failed** — the same 2, both pre-existing |
| `typecheck` | 304 errors | **304 errors** — identical; zero in touched files |

> **Two checks turned green and none turned red.** The domain stays 🔴 on 8 historical rows that must not be deleted (§ 4.1) — which is CONV1's `R2` risk in miniature, and it is reported rather than engineered around.

---

## 8. WHAT MUST NOT BREAK — AND DID NOT

| Suite | Result |
|---|---|
| **SEC4 (new)** | **24 passed, 0 failed** |
| Uplift engine | **45 passed, 0 failed** |
| Uplift persistence | **39 passed, 0 failed** |
| SEC1 departed-member exposure | **17 passed, 0 failed** |
| Planner compliance | **25 passed, 0 failed** |
| INT planner binding | **31 passed, 0 failed** |
| RM4 planner ready-meal library | **21 passed, 0 failed** |
| Intelligence Platform foundation | **33 passed, 0 failed** |
| SURF1B dietary-restriction safety path | **54 passed, 0 failed** |
| Nutrition enrichment | **22 passed, 0 failed** |
| **Total** | **311 passed, 0 failed** |

*(`test-uplift-transaction-boundary.ts` is a diagnostic script, not a pass/fail suite and not registered in `package.json`. It ran without error; its "PARTIAL SUCCESS PROVEN: NO" verdict is a pre-existing characteristic of the accept path it was written to probe, unrelated to this change.)*

---

## 9. ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| **Architecture Bootstrap read (STEP 2)** | ✅ Bootstrap + Principles + CPuBA + SoT Register (D17/D18) + UIA § 17 |
| **Principle 1 — one canonical identity** | ✅ **The content of this change.** `fallback-deterministic-boosts` was a **runtime identity with no owner**; it is retired |
| **Principle 4 — runtime consumes one assembled model** | ✅ The accept path now reads the owner instead of trusting a re-resolution done in a browser |
| **Principle 6 — honest gaps over invented facts** | ✅ **The reason this item exists.** An invented suggestion with browser-templated prose is deleted; nothing replaces it |
| **Principle 7 — no permanent sync bridge** | ✅ The client vocabulary was a **second owner**, not a bridge; it is retired, not synchronised |
| **Principle 8 — retire on introduction** | ✅ **2 → 0.** `buildFallbackUpliftMatch` and `nutrition-boosts.ts` are **deleted, not deprecated.** Retirement condition met: zero consumers |
| **CPuBA3 — knowledge gates on evidence** | ✅ **The load-bearing check.** `reviewedAt` is now applied on the **write** path, as it always was on the read path |
| **CPuBA4 — one write funnel** | ✅ The funnel is unchanged and now validates. **The client is no longer a writer** |
| **CPuBA6 / Register Rule 7** | ✅ **No update required — this change alters no ownership.** D17's owner is unchanged and was always correct. **D18's stale entry is NOT amended here** — that is `DOC-1`/`DOC-4`'s work (§ 2.4) |
| **Register Rule 8** | ✅ Not triggered — no new knowledge store. **The reverse: a rival one is retired** |
| **Register Rule 5 — consumers read the authoritative source** | ✅ Restored |
| **UIA § 17 — Adoption Register** | ✅ **Engaged and honoured.** The orphan this change created was **deleted, not registered** (§ 2.4). `adoption:check` is back to its exact baseline |
| **Experience & UI Governance** | ✅ **Engaged — the planner shows fewer suggestions** (§ 3). No colour, token, spacing, type, motion or component changed; one panel's input narrowed to the reviewed set. **EXP ARCH § 12 (never fabricate) is the rule this satisfies** |
| **Product Registry (KC15)** | ✅ **Assessed: no entry affected.** `product.yaml`'s only `calorie`/boost-adjacent entry is `adv-upf-lens` (*"Processing, not calories"*) — unrelated. No entry documents a client-side fallback boost. **`last_verified` deliberately NOT bumped** (Rule KC14 — currency is the named owner's attestation) |
| **Household Time — HT3/HT5/HT16** | ✅ **Not engaged.** No clock, no date, no derivation stored, nothing inferred |
| **Observation Engine § 7** | ✅ Nothing recorded, nothing read |
| **AI ARCHITECTURE COMPLIANCE** | ✅ **Not engaged** — no capability, intent, prompt or Context View touched |

### 9.1 Architecture Convergence Status (STEP 8)

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:                      17 — Nutrition Boost (Uplift Rules)

Current Canonical Owner:     server/lib/uplift-rules.ts (UPLIFT_RULES)
                             — SoT Register D17. Unchanged and uncontested.

Current Runtime Consumer(s): server/lib/uplift-engine.ts (matching);
                             POST /api/uplift/accept (acceptance);
                             MealUpliftPanel.tsx (display).

Duplicate Owners Remaining:  NONE.
                             Was: client/src/lib/nutrition-boosts.ts, a second
                             boost vocabulary reaching households through a
                             client-minted rule identity. DELETED (0 consumers).

Duplicate State Remaining:   NONE for this domain.

Duplicate Workflows Remaining: NONE.
                             Was: a client-side re-implementation of matching
                             (buildFallbackUpliftMatch) that duplicated the
                             engine's job with none of its gates. DELETED.

Current Convergence (%):     Evidence-based, counted:
                             - rival owners: 1 → 0
                             - rival runtime identities: 1 → 0
                             - unauthorised writers: 1 (the client) → 0
                             - write-path evidence gate: absent → present
                             The DOMAIN's ownership is now 100% converged.
                             The domain remains 🔴 on 8 HISTORICAL rows that
                             cite the retired identity (§4.1) — a data question,
                             not an ownership one. No new row can be created.

Target Convergence (%):      100% ownership — reached.

Next Planned Milestone:      A decision on the 8 historical rows (§12). Not an
                             engineering decision alone: deleting them strands
                             8 real ingredients in real households' meals.

Remaining Architectural Risks:
                             Register D18 still contests "Nutrition Boost Display"
                             against nutrition-benefit-library.ts — a file deleted
                             long ago — and remains silent on the vocabulary this
                             change actually retired. CPI1 §4.4 / CONV1 DOC-1's
                             work, deliberately not performed here.
```

---

## 10. SCOPE LOCK

**CONV1 `SEC-4` only. Everything below was in reach, deliberately untouched.**

| Not done | Why |
|---|---|
| **Cleaning the 8 historical rows** | § 4.1 — **deleting them strands ingredients in households' meals.** A product and retention decision |
| **Amending Register D18 / `ARCHITECTURE_PRINCIPLES.md:135`** | Its contest names an already-deleted file. **Correcting it is CONV1 `DOC-1`/`DOC-4`** — *an implementation must not amend governing architecture as a side effect* |
| **Graduating the deleted boosts into `UPLIFT_RULES`** | That needs a **reviewer** and a `reviewedAt`. Doing it here would be authoring knowledge — Register Rule 8, and the exact gate this item restores |
| **Validating the rest of the request body** (`mealId` ownership, etc.) | Already handled by the existing 403/404 checks. Not this item |
| **The transaction-boundary characteristic** | Pre-existing; probed by an unregistered diagnostic. Not this item (§ 8) |
| **`OWN-1` / `DOC-1` / the `users.diet*` inversion** | CONV1 Tier 1–2. **`OWN-1` must not start until `DOC-1` lands** |
| **The 2 pre-existing `adoption:check` failures / 304 typecheck errors** | Not this workstream's (§ 7) |

### 10.1 Concurrent sessions' work — preserved, and checked

`server/routes.ts` and `package.json` were dirty before this began.

- **`server/routes.ts`** — LIFE2's `calorieEstimate` / `age-and-sex-unknown` work is **present and untouched** (verified by grep after every edit).
- **`package.json`** — the concurrent session's `test:home2-home-primary-action` lines and SEC1's lines are **intact**; JSON validity re-verified after each edit.

---

## 11. FILES CHANGED

| File | Change |
|---|---|
| **`server/lib/uplift-persistence.ts`** | **+~60** — `resolveAcceptedSuggestions`, `ResolvedSuggestion`, `ResolveAcceptedResult`, and a type import. Pure; no other function touched |
| **`server/routes.ts`** | **~+12 / −8** — resolve before the fork; the merge and the provenance rows take the owner's values. One import extended. **No other route touched** |
| **`client/src/pages/weekly-planner-page.tsx`** | **−~65** — `buildFallbackUpliftMatch` + `buildMergedMatches` deleted, 3 call sites simplified, 5 now-unused imports removed |
| **`client/src/lib/nutrition-boosts.ts`** | **DELETED** (193 lines, 0 importers) — § 2.4 |
| **`server/tests/test-sec4-uplift-rule-provenance.ts`** | **NEW** — 24 assertions, pure |
| **`package.json`** | **+2 lines** — the test script and its aggregate-suite entry |
| `docs/implementation/platform/SEC4_UPLIFT_RULE_PROVENANCE.md` | This report |

**No schema. No migration. No architecture document. No governing rule. No data written or deleted.**

---

## 12. ROLLBACK PLAN

| Scope | Command |
|---|---|
| **The server fix** | `git checkout 7d1dd2ce -- server/lib/uplift-persistence.ts server/routes.ts` |
| **The client deletions** | `git checkout 7d1dd2ce -- client/src/pages/weekly-planner-page.tsx client/src/lib/nutrition-boosts.ts` |
| **Everything** | both of the above, then remove the 2 `package.json` lines by hand and delete the test + this report |
| **Tag** | `rollback/SEC4-uplift-rule-provenance-20260716` → `7d1dd2ce` |

> **⚠️ `git checkout 7d1dd2ce -- server/routes.ts` would also revert LIFE2's uncommitted fabricated-age fix, and `-- package.json` would revert two concurrent sessions' test registrations.** Prefer reverting `uplift-persistence.ts` alone — with `resolveAcceptedSuggestions` gone the route will not compile, which is a loud failure rather than a silent reopening of the hole.

**Reversibility properties:**

- **No data migration to reverse** — this change writes and deletes nothing (§ 4).
- **The deleted file is recoverable** — `git show 7d1dd2ce:client/src/lib/nutrition-boosts.ts`, plus an out-of-repo snapshot.
- **⚠️ Reverting reopens the endpoint to any rule identity any caller invents**, and puts unreviewed suggestions back in front of households stamped as THA's reviewed guidance. **The rollback is mechanically clean and ethically not.**

---

## 13. NEXT CONV1 ITEM

> **`SEC-2` + `SEC-3` — the auth token timestamps. One change, and they are the last of CONV1's Tier 0.**

`shared/schema.ts:28` declares `passwordResetExpires` naive while `server/migrations/runner.ts:74` creates it `TIMESTAMPTZ`; `emailVerificationExpires` (`:23`) has **no migration at all**, so **two identically-declared sibling columns have physically different types**. CONV1 § 3 grades them **latent** — masked by UTC containers — and says so rather than inflating them, but they are unblocked, cheap, and the mask is a deployment accident rather than a control.

**With them, Tier 0 closes.** Then **Tier 1: `DOC-1`** — the four-way governing conflict over `users.dietPattern`. It is free, it is prose, and **`OWN-1` (the platform's largest convergence) must not start until it lands**: today an implementer reading the canon is told to retire those columns, retain them as the source of truth, and build read-time enrichment from them, all at once.

**A note for whoever takes `DOC-1`:** this workstream met the same disease in a second place. Register D18 contests *"Nutrition Boost Display"* against a file that no longer exists, and is silent on the vocabulary that was actually live. **`DOC-1`'s scope is bigger than the diet columns**, and CPI1 § 4.4 already listed the rest.

---

## 14. THE CHANGE IN ONE PARAGRAPH

`POST /api/uplift/accept` believed everything it was told: the rule id, the rule's name, the ingredient, the quantity and the explanation all came straight from the request body and went straight into the database stamped `added_by: 'tha_uplift'`, so a nutrition suggestion invented in a browser — wrapped in a rule identity the server had never heard of, with an explanation assembled from a category name — was indistinguishable from guidance a human reviewer had signed off, and the `reviewedAt` approval gate that `uplift-engine.ts` applies to **every** match had no counterpart at all on the write path. The fix resolves every accepted suggestion against the canonical owner and throws the caller's copy away: the rule must exist, it must be reviewed, and it must actually author that ingredient and that action — three gates, each closing a different hole, and the third matters because the first two alone would still let a real reviewed rule smuggle double cream. It lives in `uplift-persistence.ts` rather than the route, and that was not tidiness: no test in the aggregate suite drives HTTP, so a validator left in the route could only ever have been checked by hand, and CONV1's own CP10 says a convergence is finished when a gate can fail — **the architecture and the testability turned out to have the same answer**. It cannot break the feature, and the reason is structural rather than hopeful: the engine returns the owner's suggestions verbatim, so a client echoing back a match it was given always resolves — which a live server confirmed by accepting a legitimate turmeric while a caller shouting *"Doctor-approved miracle cure, 700 kg, clinically proven to prevent disease"* had every one of those words silently replaced by half a teaspoon and the reviewer's own sentence. Then the client's minted identity was deleted, and with it the rival boost vocabulary it wrapped, which had zero importers the moment its only consumer went — and it was **deleted rather than recorded as a known orphan**, because the adoption register says in its own note that its entries are *defects, not exemptions*, and registering an orphan you have just created is using the escape hatch to defeat the gate. What a household loses is a handful of suggestions that were never reviewed and were shown as though they were; what stays is the forty-two a person signed. **Two checks turned green, none turned red, and the domain still shows red on eight historical rows — which stay, because deleting them would strand eight real ingredients in eight real meals with no record of why they are there. `added_by: 'tha_uplift'` was a lie on every row it stamped. It is now true.**

---

*Implementation report — CONV1 item `SEC-4`. Subordinate to the governing architecture, which prevails in any conflict.*
*Rollback: `rollback/SEC4-uplift-rule-provenance-20260716` → `7d1dd2ce`.*
