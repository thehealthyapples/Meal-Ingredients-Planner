# PROD5 — Launch Readiness & Trust Verification

**Status:** ✅ Complete — verification only, **one** fix implemented and browser-verified.
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/PROD5-launch-readiness-20260718` → `8e25c195` (tag + branch); worktree snapshot `refs/snapshots/PROD5-worktree-20260718` → `e6362f9c`
**Governing architecture:** [`README.md`](../../architecture/README.md) bootstrap read; Architecture + AI Architecture Compliance §7.

> ## ⚠️ Read [`LAUNCH1`](../../investigations/LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md) first — it is the launch assessment, not this document.
>
> `LAUNCH1` is a first-principles launch readiness audit **dated 2026-07-18 — the same day as
> this one**, at HEAD `24e37d20`, four commits behind PROD5. It already covers all nine areas
> PROD5 names, and already delivers a **risk register (§5, top 20)**, **remaining blockers
> (§5, §6)** and a **recommended launch sequence (§6 Path B, §7)** — three of this mission's
> four deliverables. Its verdict: **~41% build, ~25% commercial readiness.**
>
> **PROD5 does not restate it, re-score it, or replace it.** Re-auditing a six-hour-old
> first-principles audit and presenting the second opinion as progress would be precisely the
> failure LAUNCH1 closes on: *"'Complete' stops anyone looking."*
>
> **This document is the delta only** — what LAUNCH1 explicitly could not do (its §8), plus
> what changed in the four commits since, plus the one fix found along the way.

---

## 1. Executive summary

> ### 🔴 The mission's success criterion is NOT met — and this is the finding, not a caveat.
>
> PROD5 was asked to confirm *"every trust gate intact."* **They are not.** Two recipe-adaptation
> endpoints bypass the household safety gate entirely, and one of them is a **second, ungoverned
> LLM surface that lets a model invent ingredient substitutions for allergic eaters and saves the
> result as a "household-safe variant"** (§10). A tree-nut household can be told to use almond
> flour; a sesame household can be offered tahini.
>
> This survived because every safety *suite* is green — 1,656 assertions, 0 failures — and **no
> suite covers either endpoint**. The gates are correct; the coverage is not. PROD5's own first
> draft recorded "trust gates verified intact" on the strength of those green suites, and that
> line was wrong. It is corrected in place rather than quietly amended, because the mistake and
> the finding are the same mistake.

PROD5 re-scoped itself on discovering LAUNCH1. Its value is five things LAUNCH1 could not or did not do:

1. 🔴 **The browser blocker that four sessions have reported is FALSE.** PROD4 recorded, as its
   top recommendation *above any feature*, that Playwright Chromium cannot run here
   (`libglib-2.0.so.0`) and that **every visual claim by the previous four sessions is unproven**.
   **Chromium launches fine.** The full core journey was driven at 375px. See §2 — this is the
   headline.
2. 🔴 **A critical acquisition dead end, found and fixed.** Onboarding's completion mutation had
   no `onError`. One dropped request stranded a new household at step 12/12 forever. **Not in
   LAUNCH1's top 20.** Fixed and browser-verified (§3).
3. 🟠 **`npm audit` — 3 vulnerabilities, 2 high**, including a **SQL-injection advisory in
   `drizzle-orm`**. LAUNCH1 §8 explicitly skipped dependency vulnerabilities. New risk (§4).
4. 🔴 **Two safety-gate bypasses with a path to physical harm** (§10) — found by asking
   *"does every food-recommending surface reach a gate?"* rather than *"is each gate correct?"*
   LAUNCH1 workstream 3 named Companion allergen safety; **these are two different endpoints it
   did not reach.**
5. ✅ **Delta verification at current HEAD** after HOUSE_ACT1/2/3, PROD3, PROD4 and KNOW1 (§5).

Nothing here contradicts LAUNCH1's headline verdict — **THA cannot be commercially launched
today** — but it does sharpen it in one respect. LAUNCH1 concluded the gap is *"not primarily an
engineering gap."* That remains true of the *commercial* blockers. It is **not** true of §10:
that is an engineering gap, it is a safety one, and it now sits above the commercial work in
priority order.

---

## 2. The browser blocker is false — the finding that matters most

### What the record said

PROD4's entry in `CURRENT.md`, verbatim:

> 🔴 **NO BROWSER VERIFICATION POSSIBLE (Playwright Chromium `libglib-2.0.so.0`) — third
> consecutive session; ACT1 and ACT2 both closed "None captured". Every visual claim by the last
> four sessions here is unproven in a browser, and fixing that is the top recommendation, above
> any feature.**

LAUNCH1's mobile assessment (§3.15, scored **35%**) is likewise code-inspection only.

### What is actually true

```
$ node -e "chromium.launch()"
LAUNCH OK
```

Chromium 1.60.0 launches, renders and screenshots without error. **No fix was required — the
blocker had already lifted and nobody had retested it.** Four sessions carried an untested
assumption as a headline finding, and the cost was every visual claim in the last four
implementation reports going unverified.

### The verification four sessions could not run

Server booted (`npm run dev`), entered via the **20-minute no-signup demo trial**, then every
room of the core journey driven at **375px**:

| Route | Renders | Horiz. overflow @375px | Note |
|---|---|---|---|
| `/` (logged out) | ✅ landing | none | trial CTA works |
| `/auth` | ✅ | none | |
| `/home` | ✅ | none | greeting, doors, Companion |
| `/planner` | ✅ | none | React `key` warning in console |
| `/cookbook` (`/meals`) | ✅ | none | one 403 in console |
| `/pantry` | ✅ | none | |
| `/diary` | ✅ | none | |
| `/nutrition` | ✅ | none | see below |
| `/analyser` | ✅ | none | |
| `/login` | ✅ **honest 404** | none | *"This door doesn't open onto anything"* — in voice |

**Result: every room renders; zero horizontal overflow at 375px.** This closes the two open
visual questions the mobile audit could not settle (the 8-item bottom nav, and rows of fixed-width
`w-[140px]` selects) — **neither overflows.** The responsive layer is verified, not merely
inferred. LAUNCH1's mobile score of 35% is driven by the *absent PWA/offline layer*, which
remains entirely correct; the *responsive* half is now evidenced.

### Live corroboration of the KNOW1 finding

On `/nutrition`, a real household is told, on screen:

> **0** Health benefits supported

That is the nutrition-evidence publication gap rendering as a user-visible zero. It is the single
strongest argument for prioritising the sign-off: it is not a dark feature, it is a **visible
statement of emptiness** in the room built to answer *"why is this food good?"*.

### A sub-finding corrected

A parallel audit reported the Nutrition → **Nutrients** tab renders blank for every household
(`HouseholdNutritionCentre.tsx:267` returns `null`). **It did not reproduce**: for the seeded demo
household the tab renders fully (18 foods, 9 meals, 22 nutrients). The `null` return is real in
code, so the claim likely holds for a *genuinely* empty household — which the demo path cannot
create. **Recorded as unverified, not as confirmed.** Stated because a report that only lists
confirmations is not an audit.

---

## 3. The one fix implemented

**`client/src/pages/onboarding-page.tsx` — silent unrecoverable dead end at signup.**

`completeMutation` (`:340`) had `mutationFn` and `onSuccess` and **no `onError`**. The global
query client sets `retry: false` (`client/src/lib/queryClient.ts`), so a **single** dropped
request — routine on a phone — produced:

- the "Get started" button silently re-enabling, with no message;
- `onboardingCompleted` staying `false`;
- **every `ProtectedRoute` redirecting the household back to step 12/12** (`App.tsx:171,199`).

A new household could not reach the product at all, at the exact moment of acquisition, and would
have no idea why. This is not in LAUNCH1's top 20.

**Fix:** an `onError` handler with a destructive toast, matching the convention already used
across the codebase (e.g. `weekly-planner-page.tsx:449`). Three lines plus a comment recording
why it matters. No redesign, no new dependency, no behaviour change on the success path.

**Verified in a real browser**, by aborting the route to force the failure:

```
TOAST SHOWN ON FAILURE: *** YES — fix verified ***
"We couldn't finish setting up — Your answers are safe. Please tap Get started again."
```

---

## 4. New risk: dependency vulnerabilities (LAUNCH1 §8 skipped this)

`npm audit --omit=dev` — **3 vulnerabilities (2 high, 1 moderate)**:

| Package | Severity | Advisory | Fix |
|---|---|---|---|
| `drizzle-orm` `<0.45.2` | **HIGH** | **SQL injection via improperly escaped SQL identifiers** ([GHSA-gpj5-g38j-94v9](https://github.com/advisories/GHSA-gpj5-g38j-94v9)) | `0.45.2` — **breaking** |
| `nodemailer` `<=9.0.0` | **HIGH** | Raw-message option bypasses `disableFileAccess`/`disableUrlAccess` → arbitrary file read + SSRF | `9.0.3` — **breaking** |
| `@anthropic-ai/sdk` | moderate | — | — |

The `drizzle-orm` advisory deserves attention beyond its label: drizzle is THA's **sole** database
access layer, so the blast radius is every table including health data. Exploitability depends on
whether untrusted input reaches a SQL *identifier* (not a parameterised value) — **not assessed
here**, and worth assessing before launch rather than assuming either way.

**Not fixed:** both remediations are breaking major upgrades. Out of scope for a verification
mission, and not a change to make while ~40 untracked files from concurrent sessions are in flight.

---

## 5. Delta verification at current HEAD

Full gate run (this session, HEAD `8e25c195` + working tree):

| Gate | Result | vs LAUNCH1 |
|---|---|---|
| `npm run build` | ✅ **exit 0** | unchanged |
| `npm run verify:coherence` | ✅ PASS (33 domains, 108 citations) | unchanged |
| `npm run verify:schema-coverage` | ✅ PASS **91/91 tables** | unchanged |
| `npm run verify:deployment-config` | ✅ PASS | — |
| `npm run verify:release-packaging` | ✅ PASS (5/5) | — |
| `npm run adoption:check` | ✅ **82 passed · 0 · 0** | unchanged |
| `npm run verify:publication` | 🔴 **FAIL** — 24 domains: 6 healthy, 14 warn, **4 red**; 81 checks, 5 FAIL | **+1 domain** (KNOW1 added this session) |
| `npm run typecheck:ci` | 🔴 **FAIL — 20 regressions** | LAUNCH1 §5-11 said 20. **Unchanged.** |
| `npm audit` | 🟠 3 vulns (2 high) | **new** |

**Typecheck — the important nuance.** Raw count is **94** against a baseline of **168**, so the
headline number *improved* while **20 genuinely new `(file :: TS code)` pairs** went in. The gate
keys on pairs, not totals, which is why it catches what a count comparison hides. One is **shipped
production source**: `server/lib/pantry-intelligence-assembler.ts` (`TS2305`, `TS2339` — importing
`PantryExplanation` and `learningAware`, neither of which exists).

**These files are committed and unmodified in the working tree** — verified with `git status`. This
is **committed breakage at HEAD**, not concurrent in-flight work. The pattern across all 20 is
consistent: tests and one production file written against an intended `explainability-service` /
`meal-scoring-service` API that was never built.

**Deliberately not fixed.** Closing them means *building* the missing service API — feature work
this mission explicitly forbids ("Do not build new capabilities"). Reported as a blocker; it is
already LAUNCH1 workstream 11.

**Trust gates — verified, not assumed.** The canonical dietary safety gate
(`server/lib/household-dietary-safety.ts`) now has **15 consumers**, including
`server/intelligence/conversation/conversation-gateway.ts` and
`server/intelligence/services/meal-discovery-engine.ts`. That is PROD3's fix holding: it found
the Companion consumed the gate **nowhere**. Re-run this session:

```
PROD3 Companion restriction safety: 36 passed, 0 failed
✅ The Companion consumes the canonical safety gate.
```

The nutrition evidence gate is likewise intact and now *asserted* by `ne-gate-intact` (PASS),
added by KNOW1 earlier today. **No gate is flagged off, env-disabled, or weakened** — a targeted
sweep for `skipSafety`/`allowUnsafe`/`bypass`/`FEATURE_*` conditionals found none.

🔴 **But "no gate was weakened" is not the same as "every surface reaches a gate", and PROD5
initially recorded the first as if it proved the second. It does not. See §10 — two endpoints
bypass the safety gate entirely, and the suites are green precisely because neither is tested.**

**A corroboration of LAUNCH1 §8, found by accident.** Four dietary-safety suites were run
individually; **three exceeded a two-minute timeout each**. LAUNCH1's finding that `npm test` is
structurally unrunnable (~3.7 h against a 45-minute CI limit) is not an exaggeration — it
reproduces on a four-suite sample. This is why CI has never passed, and it is why the 20 typecheck
regressions could reach `main` unnoticed.

**Publication (`verify:publication`) — 4 red domains, 5 FAILs**, all pre-existing:

| Domain | Failure |
|---|---|
| Meals | 7 unauthorised writers to `meals` |
| Meal Templates | unauthorised writer `server/storage.ts`; **1,261 of 1,316** rows are boot-job stubs |
| Pantry | **`activity_summary` drift — 4 of 12 rows wrong** (user 38: cached 130, canonical 138) — a user-visible wrong number, not a governance nicety |
| Nutrition — Boost/Uplift | 14 applications cite rules their owner never authored |

Worth escalating out of the WARN band: **163 meals persist under forbidden/unlicensed source keys
(`bbcgoodfood` ×156, `allrecipes` ×7)**. That is a licensing exposure classified as a warning
(LAUNCH1 workstream 8).

---

## 6. Area verdicts — delta only

Scores are LAUNCH1's and are **not** re-derived. This column records only what PROD5 changed.

| Area | LAUNCH1 | PROD5 delta |
|---|---|---|
| Production Foundation | 32% | Build/coherence/schema/packaging **PASS**. Typecheck gate **FAIL (20)** confirmed committed. **+2 high CVEs.** No `unhandledRejection`/`SIGTERM` handler; no structured logging. |
| Household Experience | 45% | **Journey browser-verified end-to-end at 375px** — all rooms render, no overflow. **1 critical dead end found and fixed.** Orphaned routes confirmed: `/supermarkets`, `/quick-meal`. |
| Intelligence | 68% | Companion confirmed **user-visible on every authenticated page**. 3 dead routes, 2 dead verbs, and a live composition path referencing capability `"uplift"` **that is not in the registry**. |
| Food Intelligence | 30% | **Renders "0 Health benefits supported" to households on screen.** 64 claims publishable by one command (KNOW1 F1). |
| Knowledge Publication | — | KNOW1 contract added this session; now the **only** domain reporting its own publication readiness. |
| Trust Gates | — | 🔴 **NOT intact — see §10.** Every *registered* surface is sound (safety gate has 15 consumers; PROD3's Companion fix holds, 36/36; 19 suites, 1,656 assertions, 0 failures). But **two unregistered adapt endpoints bypass it entirely**, one of them a second LLM path that lets a model freehand substitutions for allergic eaters and saves the result as "household-safe". |
| Canonical Publication | — | 4 red domains, 5 FAILs, all pre-existing. Instrument trustworthy; platform not verified. |
| Commercial | 12% | **Confirmed: no payment integration of any kind.** Legal docs written but **unrouted**; **no account deletion**; no cookie consent. Good news: **no client-only entitlement gate**, and demo expiry **is** server-enforced. |
| Mobile | 35% | **Responsive half now verified in a browser, not inferred.** PWA/offline absence confirmed — no manifest, no service worker, `retry: false`, memory-only cache. Capacitor is **inert** (zero imports; `ios/`+`android/` never existed in history). |

---

## 10. 🔴 CRITICAL — two recipe-adaptation endpoints bypass the safety gate

**This is the most serious finding in the session, and it is the one PROD5 nearly missed.** An
adversarial sweep asked not *"is each gate correct?"* (they are) but *"does every surface that
recommends food actually reach one?"* Two do not. **Every claim below was independently
re-verified against source before publication.**

### 10.1 `POST /api/planner/entries/:entryId/adapt` — a second, ungoverned LLM surface

`server/routes.ts:9499-9820`. It violates every discipline the Companion enforces:

| # | Defect | Verified evidence |
|---|---|---|
| 1 | **Safety data raw-templated into a prompt** — the exact anti-pattern INT17 exists to prevent | `routes.ts:9565-9571`, `:9737-9744` |
| 2 | **Direct `new OpenAI(...)`**, bypassing `llm-provider.ts`, the gateway and all observability | `routes.ts:9609-9611`, `:9748` |
| 3 | **A second, weaker rules engine embedded in a prompt string** | `routes.ts:9714-9719` |
| 4 | **The model freehands substitutions for allergic eaters** — *"Substitute any remaining non-compliant ingredients using **best culinary judgement**"* | `routes.ts:9707-9708` |
| 5 | **Its output is never re-validated** against `resolveIngredientRestrictions` or `isMealSafeForHousehold` | grep-confirmed absent |
| 6 | **The unverified result is persisted as a safety claim** — written via `storage.createMeal` with `mealSourceType: "household-safe-variant"` | `routes.ts:10096`, `:10167-10185`, `:10216` |
| 7 | **Zero test coverage** — no suite references the route | grep-confirmed |

**Defect 3, verified directly.** The prompt's `HOUSEHOLD RESTRICTION REFERENCE` (`routes.ts:9714-9719`)
names **five** restrictions: Vegetarian · Vegan · Dairy-Free · Gluten-Free · Nut-Free. The
canonical library carries ids for **sesame, soy, shellfish, eggs, mustard, fish and peanut** —
confirmed by grep over `shared/restrictions/`. So for a household with a sesame or shellfish
allergy, **the model is instructed to scan against a list that never mentions it**, then told to
use its own judgement, and nothing checks what it returns.

> **Reachable harm:** a household declares dairy-free + sesame allergy. The deterministic engine
> handles the dairy. The model freehands the rest and proposes **tahini**. Nothing validates it.
> It is saved as a *"household-safe variant"* and placed in the planner.

### 10.2 `POST /api/meals/:id/adapt` — restriction-blind by construction

`server/routes.ts:5375-5391` → `server/lib/recipe-swap-engine.ts`.

- Exclusions come from **client-supplied `req.body.memberExclusions`** (`routes.ts:5381`, `:5389`).
- The live client sends only `{ goal }` (`client/src/pages/meal-detail-page.tsx:411`) — **so the
  exclusion list is empty on every real call.**
- **`recipe-swap-engine.ts` contains zero references** to restrictions or the safety module —
  I re-ran the grep myself: the count is `0`.
- Its hardcoded tables actively propose canonical allergens (verified verbatim):
  `bacon`/`ham` → **smoked tofu** (soy, `:44-45`) · `fish sauce` → **soy sauce** (soy + gluten,
  `:53`) · `flour` → **almond flour** (tree nut, `:63`).

> **Reachable harm:** a household with a declared tree-nut allergy taps "make this keto" and is
> told to substitute **almond flour**.

*(Adjacent: `routes.ts:5386-5387` returns 404 on a missing meal with no `meal.userId` ownership
check, unlike its sibling at `:5349`.)*

### 10.3 Why every safety suite is green anyway

19 suites, **1,656 assertions, 0 failures** — and both holes are real, because **no suite covers
either endpoint**. `test-prod3-companion-restriction-safety.ts:16` even asserts by grepping
`server/intelligence/` — a directory **neither hole lives in**. The tests verify the gate is
correct and consumed *where it is consumed*; nothing asserts that every food-recommending surface
reaches it. That is the gap, and it is a test-design gap before it is a code gap.

### 10.4 Deliberately NOT fixed

Both are left open, on purpose. Routing these paths through `resolveHouseholdSafetyContext` and
re-validating model output is **1–2 weeks of engineering on two untested endpoints** — it is
LAUNCH1 workstream 3 (*Companion allergen safety*), not a fix found in passing. **A partially
repaired allergy gate is more dangerous than a clearly reported open one**, because the next
reader sees safety code and assumes coverage. That assumption is exactly what produced this
finding. Escalated to the top of §9 instead.

### 10.5 Lower-severity gate findings (reported, not fixed)

| Sev | Finding |
|---|---|
| MED | `shared/canonical/nutrition-context.ts` — hand-authored nutrition claims with **no `sourceRefs`, no `reviewedAt`**, never gated, surfaced to both the user and the LLM under a field literally named **`evidenceContext`** (`engine.ts:120,246`; `nutrition-enrichment.ts:117`). Its own header concedes it is a placeholder. **Not recorded in the publication register** — a real gap in KNOW1's coverage. |
| MED | `resolveIngredientsToKnowledgeSummary` (`registry.ts:1078`) calls the **ungated** `getNutrientsForFood` and discards `evidenceConfidence` — widening KNOW1 F2 onto meal pages and the Nutrition Centre. |
| MED | KNOW1 F2's blast radius is **larger than recorded**: `getFoodsForNutrient` feeds `getNutrientDetailView`, which is on the **Companion's read port** (`nutrition-knowledge-read-port.ts:44`) — so unreviewed composition claims are reachable by the AI, not only by a web page. |
| LOW | Food Intelligence filters on restrictions but **never the requester's diet pattern** (`engine.ts:223`) — a vegan asking about iron can be recommended meat. |
| LOW | `isMealSafeForHousehold:329-330` inspects name + ingredients only; an allergen appearing solely in **instructions** is invisible — which is exactly where §10.1 writes AI-rewritten method text. |

---

## 11. ⚠️ Freshness warning — the commercial findings are moving under this document

A concurrent session, **`BUS1_Trust_And_Compliance_Foundation`**, was writing to this working tree
*while PROD5 ran*. Its untracked artefacts appeared mid-session and target **exactly** the
commercial gaps reported in §6:

```
?? client/src/pages/legal-page.tsx      ?? shared/legal/     ?? shared/privacy/
?? server/privacy/   ?? server/support/  ?? server/trust-routes.ts   ?? server/email/
```

A migration head named **`2026-07-18_bus1_trust_and_compliance`** is already applied.

**So the §6 commercial row — "legal docs written but unrouted, no account deletion, no cookie
consent" — may be stale by the time this is read.** It was true when measured. `legal-page.tsx`
did not exist at the start of this session and does now.

**PROD5 touched none of it**, and deliberately did not verify it: auditing another session's
half-written code produces a finding that is wrong within the hour, and re-testing it would have
raced their edits. **Re-run the commercial section against BUS1's committed result before acting
on §6.** Flagged rather than silently absorbed, because a launch decision made on a stale
commercial audit is exactly the failure mode this report is otherwise about.

---

## 7. Compliance

**Architecture Compliance** — ☑ Bootstrap read (`docs/architecture/README.md`) · ☑ git status confirmed · ☑ rollback created and reported · ☑ no new capability, domain, owner, store, route, schema or migration · ☑ no redesign · ☑ Principle 8 — nothing introduced, nothing to retire.

**AI Architecture Compliance** — ☑ No capability, prompt, registry entry or model path modified · ☑ no second assistant · ☑ no duplicated conversation state · ☑ **honest gaps over fabricated knowledge** — §2's corrected sub-finding and §4's unassessed exploitability are both instances.

**Experience & UI Governance** — the one change is an **error path that previously said nothing**. It adds no colour, token, component or layout. It serves Experience Architecture *honest presence* and Principle 6: a household is told what happened and what to do, instead of silently trapped. No Adoption Register entry (no building block created, adopted or retired). No Product Registry entry (no surface added or withdrawn).

---

## 8. Deliverables

- **Launch Readiness Audit** → **`LAUNCH1` §3** (owner). PROD5 delta: §2, §5, §6.
- **Production Risk Register** → **`LAUNCH1` §5** (owner). PROD5 adds: **2 high CVEs** (§4), the **onboarding dead end** (§3, now closed), **`activity_summary` drift**, and the **capability `"uplift"`** stale reference.
- **Remaining blockers** → §9.
- **Recommended launch sequence** → **`LAUNCH1` §6 Path B / §7**, unchanged and endorsed. PROD5 amends Phase 0 only (§9).
- **Updated implementation report** → this document.

---

## 9. Remaining blockers, and the one amendment to LAUNCH1's sequence

**LAUNCH1's Path B (~10–14 weeks) stands. PROD5 endorses it and does not re-plan it.**

Its **Phase 0 — "Stop the bleeding"** is amended by exactly two items PROD5 discovered:

| # | Add to Phase 0 | Why |
|---|---|---|
| **0a** | 🔴 **Close the two adapt-path safety bypasses (§10) — or disable both endpoints until they are closed** | The only findings in this session with a path to **physical harm**. Disabling is hours; closing properly is 1–2 weeks. **Either is acceptable; shipping as-is is not.** This belongs beside LAUNCH1 workstream 3, not after it |
| **0b** | 🔴 **Add a coverage test asserting every food-recommending route reaches the safety gate** | §10.3 — the existing suites pass *because* they enumerate known consumers. A gate nothing routes through is invisible to a consumer-list test, and that is how both holes survived |
| **0c** | 🟠 **Assess the `drizzle-orm` SQL-injection advisory, then upgrade** | Sole DB layer; blast radius is every table including children's health data. Breaking upgrade — needs its own change, and the assessment gates how urgent it is |
| **0d** | ~~Onboarding dead end~~ ✅ **done in this session** | Was silently costing every new household who hit one dropped request |

Then, unchanged from LAUNCH1: legal base · GDPR rights · Companion allergen safety · payments · backups · the 20 typecheck regressions · licensing purge.

**One item to move up on evidence PROD5 gathered.** LAUNCH1 ranks the nutrition sign-off #12 and
sizes it at 2–4 weeks of expert time. That is right for the *whole* corpus — but **64 claims are
publishable today by one command** (`KNOW1` F1), and the Nutrition room currently tells households
**"0 Health benefits supported"** *on screen*. The first tranche is an afternoon of review, not a
workstream, and it converts a visible zero into 89 benefit chips across 29 everyday foods.

**The judgement PROD5 would add to LAUNCH1's closing.** LAUNCH1 says the last ten percent —
wiring, deploying, deleting the rival, telling the truth — is consistently what does not happen.
This session found the same failure twice, in opposite directions, and they are the same failure:

- **A blocker believed without testing.** Four consecutive sessions reported the browser as
  unusable and ranked fixing it above every feature. It had already lifted; nobody retested.
- **A safety guarantee believed without testing.** 1,656 green assertions were read as proof that
  every surface is gated. They only ever proved the gates work *where they are called*. PROD5's
  own first draft made exactly this error before the adversarial pass caught it.

In both cases the artefact was trustworthy and the *inference from it* was not. The practical
lesson is narrow enough to act on: **THA's tests enumerate consumers, so they can only ever prove
what is connected — never what is missing.** A gate nothing routes through is invisible to every
suite in the repository. Until a test asserts the *complement* — every route that recommends food
reaches a gate — green means "the parts we remembered still work", and a household with a sesame
allergy is relying on somebody having remembered.
