# LAUNCH1 — THA Launch Readiness Audit

| Field | Value |
|---|---|
| **ID** | LAUNCH1 |
| **Type** | Investigation — point-in-time analysis |
| **Date** | 2026-07-18 |
| **Branch** | `int1-intelligence-platform` |
| **Working tree HEAD** | `24e37d20` |
| **Rollback ID** | `rollback/LAUNCH1-launch-readiness-audit-20260718` → `24e37d20` |
| **Status** | Complete — audit only, nothing implemented |
| **Supersedes** | All prior completion reports and percentages, for the purpose of launch assessment |

---

## 0. How this audit was conducted

This is a **first-principles audit**. Every prior completion report, percentage and status
claim in the repository was **deliberately ignored**. Nothing was accepted because a document
said it. The assessment was produced by:

- **Running the gates**, not reading about them: `tsc --noEmit`, `npm run typecheck:ci`,
  `npm run verify:publication`, `npm run verify:coherence`, `npm run adoption:check`,
  `npm run build`, `npm test`.
- **Querying the live database** directly via `DATABASE_URL` for every content and coverage
  claim.
- **Reading the code end to end** — UI → route → service → schema — for each user-facing domain.
- **Ten parallel deep audits**, each instructed to treat documentation as a hypothesis to be
  disproved and to cite `file:line` for every finding.

Where a documented claim did not survive contact with the code, that gap is reported as a
finding in its own right. **A significant proportion of this audit's most important findings
are of that kind.**

### A note on what this audit found about the documentation

This must be said plainly, because it changes how the rest of the report should be read.

THA's governing architecture is of genuinely unusual quality. It is also, in many specific and
load-bearing places, **describing a system that does not exist**. Simultaneously, the repository
contains verification machinery — `verify:publication`, `verify:coherence`, the typecheck gate,
the adoption register — that is **better than most commercial codebases ship with, and which is
currently reporting failures that nobody is acting on**.

The organisation's problem is not a lack of rigour. It is that **the rigour has been spent on
describing and governing the work rather than on finishing and shipping it**, and the
instruments that would have caught this are red and being ignored.

Two measurements frame the whole report:

- **504,329 lines of Markdown against 295,628 lines of TypeScript** — 1.7 lines of prose per
  line of code.
- **`origin/main` is at `3ef7e8ef`, dated 2026-06-29.** The working branch is **147 commits
  ahead**. Production deploys from `main`. **Nineteen days of work — including every security
  control, every convergence and every fix described in recent completion reports — has never
  been deployed.**

---

## 1. Headline verdict

> **Overall build completion: ~41%.**
> **Commercial launch readiness: ~25%.**
>
> **THA cannot be commercially launched today, and the gap is not primarily an engineering gap.**

The distance between those two numbers is the finding. THA has built a large, sophisticated,
in many places genuinely excellent **product platform**, and has built **almost none of the
business around it**. There is no payment processor. There is no privacy policy. There is no
account deletion. There is no price. These are not partially built — they do not exist.

The second finding is that the **content is far thinner than the platform that serves it**.
The cookbook, the food knowledge base, the nutrition claims and the pricing layer are all
substantially hollow, and in several cases what is there is not merely thin but **wrong in ways
that would not survive public scrutiny**.

The third finding is that **THA has essentially no evidence that any of this works for real
people.** 208 of 327 users are synthetic. 60 users have ever written a diary entry, all in two
batch windows. The barcode scanner — the flagship acquisition feature — has been used **four
times in its entire history**.

---

## 2. Evidence baseline (measured 2026-07-18)

### 2.1 Gate status — three of five gates are RED

| Gate | Command | Result |
|---|---|---|
| Build | `npm run build` | 🟢 **PASS** — `dist/index.cjs` 3.9 MB |
| Test suite | `npm test` | 🔴 **CANNOT COMPLETE** — 33/147 suites in 50 min; projects ~3.7 h against a 45-min CI timeout |
| Governing-doc coherence | `npm run verify:coherence` | 🟢 **PASS** — 108 `file:line` citations across 47 docs all resolve |
| Typecheck regression gate | `npm run typecheck:ci` | 🔴 **FAIL** — **20 regressions** |
| Canonical publication | `npm run verify:publication` | 🔴 **FAIL** — **4 domains in publication failure** |
| Adoption register | `npm run adoption:check` | 🔴 **FAIL** — **4 failures** |
| Repo structure | `.engineering/scripts/repo-structure-verify.sh` | 🔴 **FAIL** — 2 checks |
| Branch protection | `npm run verify:branch-protection` | 🔴 **FAIL** — `main` is **not protected** (HTTP 404) |

**Typecheck:** `tsc --noEmit` reports **251 errors** against a frozen baseline of **168**
(`scripts/ci/typecheck-baseline.json`). The baseline's own note reads: *"This list must only
ever shrink."* It has grown by 83.

**Publication failures** (each verified against live data):
- **Meals** — 9 writers to `meals`, 7 unauthorised.
- **Meal Templates** — **1,261 of 1,316 rows are boot-job stubs.** Verified directly:
  only **55** rows have `protein_slots` populated.
- **Pantry** — `activity_summary` has drifted from canonical; users are shown stale counts.
- **Nutrition Boost/Uplift** — **13 of 16 uplift applications in production cite rules that do
  not exist**, including `test_rule_boundary` ×5. **Test fixture data is live in the production
  database, attached to user-facing nutrition suggestions.**

### 2.2 Deployment and source control

- `origin/main` = `3ef7e8ef` (**2026-06-29**); working branch **147 commits** ahead.
- **`main` has no branch protection.** `.github/workflows/ci.yml:42-47` asserts its job "IS the
  required status check on main". It is not. CI has run **twice, both failed**, with `npm test`
  and `npm run build` skipped both times. **The 147-suite gate has never once passed.**
- `deploy.sh:22` runs **`git add -A`**, auto-commits, builds and pushes to auto-deploying `main`.
  **It runs no tests and no typecheck.**
- **240 uncommitted entries** — 82 modified, **158 untracked**.
- 🔴 **The committed repository does not build.** `client/src/App.tsx:35` lazy-imports
  `food-comparison-page.tsx`, which is **untracked**. Verified by fresh clone: the file is absent.
  Also untracked: the Companion's entire write-action layer — `action-language.ts`,
  `action-resolution.ts`, `diary-write-handler.ts`, `pantry-write-handler.ts`. **The subsystem
  this audit rates as the Companion's strongest component exists only in one working directory
  and would be destroyed by `git clean`.**

### 2.3 Scale

| Measure | Value |
|---|---|
| TypeScript | 295,628 lines / 747 files |
| Markdown (`docs/` + `.engineering/`) | **504,329 lines / 1,335 files** |
| `server/routes.ts` | **12,963 lines — one `registerRoutes` function, 313 routes, zero `Router()`** |
| `server/storage.ts` | 4,170 lines — `IStorage` with **252 methods** |
| Declared tables | 91 (100% covered by 93 reviewed migrations — verified) |
| Server test files | 153 (147 wired into `npm test`; **5 orphaned**) |
| Client test files | **0** |

### 2.4 Live database — the product has almost no real usage

| Measure | Value |
|---|---|
| Users | 327 — of which **208 are demo/benchmark/test** |
| Households | 349 |
| Meals | 3,179 (884 system) |
| Planner entries | 2,781 |
| Diary entries | 564, across **60 users**, all written in two batch windows |
| Pantry items | 36,019 — **35,074 (97.4%) are seed data** |
| Freezer meals | **12** |
| Conversation turns | 13,275 |
| **Barcode lookup events** | **1** |
| **Product records from a barcode scan** | **4, ever** |

---

## 3. Area assessments

### 3.1 Platform — **62%** · Priority: **Critical**

**Complete.** The schema is genuinely rebuildable: 93 ordered migrations applied transactionally
at boot (`server/index.ts:136`), **91/91 tables covered, verified by running the gate**. The
schema baseline at `server/migrations/runner.ts:60` is real engineering with a measured
justification. `server/verification/publication-register.ts` (2,103 lines) checks 76 real
invariants against live data — better than most commercial codebases have. Route authorization is
audited clean: **327 registrations, 42 admin, 0 recorded defects**, with mutation tests proving
the auditor can fail. Rot markers are unusually low: 6 TODOs, **0** FIXME/HACK, **0** `@ts-ignore`.

**Outstanding.** `registerRoutes` is a **single ~12,400-line function** holding 313 routes with no
`Router()` usage; only ~18% have a typed contract. `IStorage` is a 252-method god object. **Split
ownership is live**: `meal_plans`/`meal_plan_entries` (13/150 rows) coexist with
`planner_weeks`/`planner_days`/`planner_entries` (1,362/9,534/2,781); same for `conversations` vs
`conversation_threads`. 384 `as any`; 17 untyped `jsonb` columns.

**Blockers.** (1) Live production data fails its own integrity gate — 4 domains red, including
test fixtures in production. (2) `verify:publication` is **in no pipeline** — not CI, not
`release:check`, not `deploy.sh`. The best gate in the repository runs only when a human
remembers. (3) The migration runner logs a head mismatch on **every boot** and only warns —
placing the baseline at index 0 broke `expectedMigrationHead()` (`runner.ts:3204`), so the
integrity check is permanently and silently wrong.

---

### 3.2 UX / North Star — **45%** · Priority: **High**

Split honestly: platform-experience foundations **~75%**; North Star realisation **~20%**.

**The central question — does the shipped UI feel like "a modern home in an ancient orchard"?
No, except on one screen.** The entire Kept Room material vocabulary is scoped to a single CSS
selector, and the authoring comment says so: `client/src/index.css:878` — *"consumed only under
`.home-arrival`, so NO other room changes."* One page consumes it
(`home-experience-page.tsx:532`). Every other room is flat cream with a tinted header strip.

The celebrated four-level Orchard Exposure Scale is, in shipped CSS, **one level and three
zeros**: `--orchard-exposure-e0` and `e1` are both `0`; `e2` has **zero consumers**; only `e3` is
read, at three sites in one file. The adoption gate passes it because it counts symbols *defined*,
never *consumed*.

**Arrival is not shipped.** Nine arrival prototypes (2,265 LOC) are all gated behind
`import.meta.env.DEV` (`App.tsx:70-101`). Production arrival is a spinner then a redirect.

**Genuinely complete.** A real constant application shell with error boundaries at both levels
(`App.tsx:246`, `:311`) — unusually well reasoned. `WorkspaceHeader` is the sole owner across 17
pages; the documented `PageHeader` duplication **is resolved** (docs stale in the good direction).
`hover-elevate` is a real single-owner system. Reduced motion gated at both layers.

**Outstanding.** `adoption:check` is **red today** — three ceilings documented as *"capped so
they cannot grow"* all grew (raw `<button>` 538→**540**, `Loader2` 179→**182**, `animate-pulse`
9→**10**). Design-system adoption is thin where it matters: **6 importers** of the empty state;
14 pages ship spinner-only loading; **only one error surface in the entire product offers a
retry** (`profile-page.tsx:334`). Page maturity: **6 finished, 28 partial, 1 scaffold**.
`plant-diversity-page.tsx:111,151` ships **two literal "Coming soon" panels behind a
bottom-nav door**. Accessibility is shallow: 39 of 95 `<img>` have no `alt`; `aria-live` = 3.

🔴 **Dark mode is completely unreachable dead code.** `tailwind.config.ts:4` sets
`darkMode: ["class"]`, a full `.dark` token set exists, **827 `dark:` utilities are authored** —
and **nothing anywhere adds the `dark` class**. The adoption gate diligently tracks its growth.

🔴 **Every arrival shows the wrong orchard.** Two assets ship; the owner file itself describes
`orchard-bg.webp` as *"a pale watercolour of a MEADOW… no apple trees, no blossom, no fruit —
nothing that makes an orchard an orchard."* It is what `/auth`, `/onboarding` and the logged-out
landing all display. Five surfaces also bypass the canonical owner via raw `url()`, including
`ui/dialog.tsx:48`, which **puts the orchard behind every dialog in the product**.

---

### 3.3 Production Foundation — **32%** · Priority: **Critical**

This area holds the hardest launch blockers.

**Genuinely excellent — better than most funded startups ship.** `server/auth.ts:137-161` fails
closed on `SESSION_SECRET` and refuses a burned literal by SHA-256 digest. Cookie flags are
computed, never literal. `server/lib/auth-rate-limit.ts` is a **Postgres-backed** limiter across
12 policies, HMAC-keyed so no plaintext PII is stored, with byte-identical 429s to avoid an
oracle. `sanitizeUser.ts` was inverted to an allowlist after a live `passwordResetToken` leak.
All 52 admin routes are gated. `test-trust1-s3a-meal-ownership-idor.ts` is a real integration
test sweeping an id range for a 404-not-403 enumeration oracle. SQL is cleanly parameterised;
zero `dangerouslySetInnerHTML`.

**But the operational foundation barely exists.**

| Blocker | Evidence |
|---|---|
| 🔴 **Zero database backups. No PITR. No migration `down`.** | Nothing repo-wide; `server/migrations/runner.ts` has `statements` only. A destructive migration is **unrecoverable**. |
| 🔴 **No pool `'error'` handler** | `server/db.ts:13` is the entire config. One dropped idle connection **crashes the process**. `connectionTimeoutMillis` defaults to 0 = wait forever. |
| 🔴 **No LLM timeout on any of 12 call sites; no spend cap** | SDK defaults are 10-min timeout × 2 retries — one turn can hold a handler ~30 min. `POST /api/intelligence/conversation/turn` is **unthrottled**: any authenticated user can drive unbounded OpenAI spend. |
| 🔴 **No health endpoint, no error tracking, no request IDs, no SIGTERM handler** | 658 `console.log` + 399 `console.error`. A production crash is **invisible**. |
| 🔴 **Production is 19 days stale; CI never passed; `main` unprotected** | None of the security work above is live. |
| 🟠 No security headers at all | No helmet, CSP, HSTS, X-Frame-Options. |
| 🟠 Reset/verification tokens stored **plaintext** | `storage.ts:1625, 1633`. |
| 🟠 ~64 of 91 tables unindexed; `meals` has no plain `user_id` index | The hottest query is a seq scan. Triple-nested N+1 in `household-history.ts:84-98` = ~175 queries per build. |
| 🟠 No session regeneration on login | Session fixation. |

🔴 **`platform-resilience.ts` is a well-built, fully-tested 325-line circuit breaker whose header
claims it owns resilience for "the LLM provider". `executeWithResilience` has zero production
callers.** During an OpenAI outage an operator sees a green board. The repository already
recorded this exact lesson about this exact class of file:
`test-trust1-s1-session-secret-fails-closed.ts:26` — *"`platform-status.ts` already was
[written], and it protected nobody for as long as nothing imported it."*

---

### 3.4 Intelligence — **68%** · Priority: **Critical**

The highest-scoring area, and deservedly so: the deterministic spine is production-grade.

**Complete.** 23 registered capabilities — **16 EXECUTABLE / 6 PARTIAL / 1 STUB**
(`administration`, registered and never bound). **49 of 101 declared verbs are executable
(48.5%)** — and the registry is honest about it: `listExecutable()` filters on declared
`executableIntents`, so discovery cannot over-advertise. `IntentEngine.routeInner`
(`intent-engine.ts:120-215`) implements LOCATE→VALIDATE→PERMISSION→CONFIRM→INVOKE with real
server-side gates. **The Context Composition Engine genuinely is the only path to the model** —
`composeContext` has exactly one non-test call site, and no prompt-templating bypass exists.
All four engines (Observation, Behaviour, Decision, Notice) are **built and composing**, with
real bounded retention. All four admin surfaces are real, with zero route mismatches.

**Blockers.**
- 🔴 **Non-fabrication is enforced input-side only.** `parsed.text` is returned **verbatim**
  (`conversation-gateway.ts:1287`). `entityRefs` from the model are filtered for **shape only** —
  `typeof r.type === "string" && r.id != null` (`:1294`) — never validated against the composed
  context. **A hallucinated `{type:"meal", id:999}` renders to the household as a real THA link.**
- 🔴 **LLM provider layer is 115 lines and operationally bare.** `modelName = "gpt-4o-mini"`
  hardcoded (`llm-provider.ts:54`) — a mid-2024 model, two generations behind. No streaming, no
  timeout, no retry, no `AbortController`. **`completion.usage` is discarded at `:73` — there is
  zero cost visibility for the entire Companion.** Input context is meticulously budgeted against
  measured `prompt_tokens`; actual spend is not measured at all.
- 🟠 **68 of 100 quality-scoring weight points are unmeasured proxies.** `resolveJudge()` is
  hardcoded to `disabledJudge` (`judge.ts:48`). D1 Factual Correctness (weight 30) is proxied by
  *"did it cite an entity"*; D5 Relevance (weight 13) by *"is the answer ≥40 characters"*. All 100
  corpus entries have `grades.actual === "TBC"`. **The reported `hallucinationRate: 0` means "no
  answer lacked both grounding signals and hedging vocabulary" — not zero factual errors.**
- 🟠 Measured intent accuracy is **85.2%** against the platform's own **90%** floor — and
  `test:companion-benchmark` is **not in `npm test`**.

🔴 **The governing architecture describes a system that was never built.**
`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` §6 founds its entire threat model on a
permission-classified embeddings/RAG index, calling retrieval filtering *"the primary defence"*
against risk R1. Grep for `embedding|pgvector|cosine` returns **nothing** — the only hit explains
why embeddings were deliberately rejected. The shipped design is arguably safer; the document's
mitigations describe a different system. The same doc (`:415`) says *"default to latest efficient
Claude models"*; the code uses `gpt-4o-mini` exclusively and imports no Anthropic SDK — though
`@anthropic-ai/sdk` and `@google/genai` are both installed and unused.

---

### 3.5 Companion — **62%** · Priority: **Critical**

**Complete, and substantial.** A 1,573-line gateway running a full pipeline with a four-state
honest failure vocabulary (`no-route`/`no-knowledge`/`no-results`/`internal-error`) that is
persisted and logged — better failure handling than most shipped assistants. **Write execution is
real**: all eight declared write verbs genuinely execute against owning services, household-scoped
at the storage layer. **The confirmation gate is server-side and deterministic** — `intent-engine.ts:170`
refuses any non-read verb unless `confirmed === true`, and re-runs the entire chain at confirm
time rather than trusting the stored proposal. The Companion cannot self-execute. The client is a
real chat surface with `role="log" aria-live="polite"`, focus trap and a mobile-correct panel.

| Companion action | Verdict |
|---|---|
| Planner add / move / replace | **EXECUTABLE** |
| Shopping add / delete | **EXECUTABLE** |
| Pantry add / delete | **EXECUTABLE** |
| Diary log a meal | **EXECUTABLE** |
| Planner delete | **NOT OFFERED** (deliberately, honestly) |
| Create plan / generate week / update profile | **STUB** — refused with an honest gap |

🔴 **BLOCKER — dietary restrictions are not enforced anywhere in the Companion path.**

This governs the score. THA has a competent allergen matcher (`shared/restrictions/restriction-safety.ts`,
tested on tahini→sesame, groundnut oil→peanut) and a canonical resolver whose schema comment reads
*"Hard restrictions — always enforced, never overridable"*. **No file under
`server/intelligence/conversation/` imports it.** Concretely:

- Meal discovery is **unfiltered** — zero restriction logic in `meal-discovery-engine.ts` or
  `native-discovery.ts`.
- The one real filter matches allergens against the string `"${food.name} ${food.category}"`
  (`food-intelligence/engine.ts:192`). **"Satay chicken skewers" does not contain "peanut".**
- The conflict path is **advisory prose**, which the prompt tells the model to *"weave in
  naturally"* — the model may omit it.
- **The system prompt's HARD RULES 1–5 (`gateway:1166`) say nothing about allergies at all.**
- There is **no post-generation validation** of any kind.

And the Companion **actively solicits this class of question**: `FloatingAssistant.tsx:114` ships
*"Any allergens to watch out for?"* as a one-tap planner quick action.

**A household with a recorded nut allergy asking "what should I cook tonight?" can be answered from
an unfiltered discovery result, phrased by a model never told about the allergy, returned with no
post-check.** The safety machinery exists; the surface that talks to users routes around it.

🔴 **The benchmark's safety dimension is graded by nobody.** D3 "Safety & Permission" (weight 15)
awards 3/4 for *not throwing* (`scorer.ts:392`), with a comment deferring content-level judgement
to the judge — but `JUDGE_OWNED = ["D1","D2","D5","D6"]` **excludes D3**, and the judge is
disabled anyway. "Safety verdict: ALL CLEAR" is structurally vacuous.

**Outstanding.** Clarification is a dead end — nothing stores the pending command, so every
clarification requires restating the whole request. **Learned household memory never reaches the
conversation**: the evidence-learning chain is genuinely real end to end, but
`readConfirmedUnderstanding` has **zero hits** in the conversation directory. Threads never close
(`closeThread` has no production caller), so turns from weeks ago can enter history.

---

### 3.6 Food Intelligence — **30%** · Priority: **Critical**

The identity layer, graduation pipeline and evidence gate are well-built. **The material inside
them is ~5% filled, and the two scoring surfaces that are fully shipped are the least defensible
code in the product.**

**Measured content:** 607 canonical foods, 610 knowledge foods, 1,988 food↔nutrient links,
36 nutrients, 15 health benefits, 806 aliases.

🟢 **A correction this audit makes to its own first reading, because it matters.** Raw citation
counts look catastrophic — only 49 of 1,988 nutrient claims carry a source ref, and **0 of 1,366**
benefit claims do. But there **is** a real enforced gate: `shared/knowledge/evidence.ts:92`
requires **both** a valid source ref **and** an explicit human sign-off (`reviewedAt`) before any
claim can render. `npm run test:knowledge-claim-coverage` passes 14/14, including *"no benefit
chip can render for a benefit with zero sourced nutrient claims"* and *"the uncitable benefits are
exactly the documented honest gaps"*. **THA does not publish uncited health claims.** This is
genuinely good work and deserves to be recorded as such.

🔴 **But the consequence is severe: in the live database `reviewed_at` is NULL on 0 of 1,988
nutrient claims and 0 of 1,366 benefit claims. Zero nutrition benefit claims can render to any
household today.** The published coverage figures (450 of 699 chips renderable) are explicitly a
*"post-sign-off projection"* of a sign-off that **has never been performed**. The knowledge
platform is built correctly, gated honestly, and publishes nothing. **This is an operational gap,
not an engineering one** — it needs a qualified human to review and sign off claims.

🔴 **Ingredient resolution is 64.4%, not the ~88% the dictionary could support.** Measured over
5,791 real ingredient lines using the production resolver: 3,730 matched, 2,061 unmatched. The
~24-point gap is **parser defect, not data gap** — `1 x 400g tin` (UK idiom) is unparseable
(~281 lines); `normalize.ts:21` strips hyphens so `low-salt`→`lowsalt` (~185 lines). Only **72
distinct** unmatched names exist; fixing the top 10 recovers ~1,900 lines. **Days of work.**

🔴 **`healthScore` is inverted and corrupting production data.** `server/routes.ts:1761`:
`Math.max(0, 100 - thaRating * 20)` where `thaRating` is 1 (worst) → 5 (best). **5 apples yields
0/100; 1 apple yields 80/100.** It is rendered to users *and* written to
`product_history.health_score`. Every row written so far is inverted. **Needs a fix and a
backfill; remediation cost grows with every row.**

🔴 **The Apple Score is risk-blind.** `calculateTHAAppleRating` accepts `additiveCount: number` —
a bare integer, so risk level and additive type are **structurally unavailable to it**.
Demonstrated by execution: 5 low-risk natural colourings and 5 high-risk synthetic dyes both
score **2 apples**; the natural product scores marginally *worse*. `test:scoring` passes 12/12 and
cannot detect this — no case contrasts low- vs high-risk additives at equal count. The score is
also **non-reconstructible**: `thaBreakdown` is computed and returned from the service but **no
route serialises it**.

🔴 **The cookbook is templated.** 500 recipes are built from 218 distinct ingredient strings.
Three boilerplate lines appear in 372, 343 and 319 of 500 recipes.

---

### 3.7 Planner — **62%** · Priority: **High**

**Verdict on the primary journey: YES — a household can plan a week end to end**, with a serious
caveat about what "week" means.

**Complete.** Full CRUD with optimistic mutations and dnd-kit drag-and-drop across days and slots.
**Smart Suggest is real** (`smart-suggest-service.ts`, 1,005 lines) with hard diet filtering via
the canonical eater row, locked-entry preservation and four candidate-pool exclusions. Household
modelling is genuinely sophisticated: per-entry eaters, one-off guests, per-week diet overrides.
Drinks are first-class with alcohol permanently excluded. Token-based read-only sharing works.
`plannerError` is handled explicitly so a failed load isn't rendered as an empty plan — a real
quality signal.

🔴 **The six-week anchor cliff — undocumented anywhere, and the sharpest finding in this area.**
`storage.ts:1287` stamps all six planner slots as consecutive Mondays at signup. `weekNumber`
never advances and never rolls over. Once today passes slot 6, `resolvePlannerWeek` returns
`{ anchored: false, reason: "window-expired" }`. **Every household that anchors correctly at
signup silently loses its anchor 42 days later**, and the declared remedy (a household declaring
its own anchor, TIME1 §6.2) is **an extension point, not built** — no route, no UI, no mutation.
The 3-of-195 anchored households are a cohort that shrinks to zero.

🔴 **The convergence is four of five, not five.** The planner page — the surface the domain is
named after — **still resolves its week from `localStorage`, defaulting to `"1"`**
(`weekly-planner-page.tsx:262-270`). Nothing in that file imports `useCurrentPlannerWeek`.

**Outstanding.** Multi-week is a fixed 6-slot rota. Leftovers are a suggestion flag with no
entity. **Servings are display-only** — no per-entry override in schema, API or UI.

---

### 3.8 Shopping — **48%** · Priority: **Critical**

The list is ~75%; **the retail/pricing layer is ~5% and is actively misleading.**

**Complete, and the in-store experience is the best thing in this audit.** Planner→list generation
does real ingredient consolidation, unit normalisation and gram conversion, with
`ingredient_sources` rows linking every item back to the meals that caused it. Three modes
(add/prep/shop), a 19-category store walk order, persisted six-state `shopStatus`, optimistic
check-off with rollback, speech input and photo/OCR. Genuinely mobile-shaped and thoughtful.

🔴 **The pricing layer is fabrication.** One US Spoonacular price becomes 36 UK supermarket prices:
```
price-lookup.ts:217  convertUsdToGbp = usd * 0.79        ← hardcoded FX
price-lookup.ts:80   SUPERMARKET_VARIANCE { Tesco: 1.0, Aldi: 0.82, Waitrose: 1.12, … }
price-lookup.ts:106  getStoreTierProductName → "Tesco Finest X", "Specially Selected X"
price-lookup.ts:278  const priceSource: "provider" | "estimate" = "provider";   ← hardcoded
```
A user is shown **"Aldi — Specially Selected Chicken Thighs, £4.12"**. The product name is string
concatenation. The price is a US number times three invented constants. And `priceSource` — the
exact field that exists to distinguish real prices from estimates — **is stamped `"provider"`**,
defeating the honesty mechanism at source.

🔴 **The store comparison is mathematically meaningless.** Since every price is one base number
times a fixed per-store constant, **Aldi (0.82) is always cheapest, for every item, every
household, every time.** It is a constant wearing the costume of a comparison.

`docs/architecture/capabilities/partners.md:78` states the rule — *"Never fabricate a live
price"* — and even flags this code path as *"a fabrication"*. **The governance diagnosed the
hazard correctly and the hazard shipped anyway.**

🔴 **There is no supermarket integration. Not partial — zero.** `grocery-integration.ts:91` posts
to `api.whisk.com`, an API discontinued after the Samsung acquisition. `supermarket_links` has no
seed and no write path. `verifyStoreAvailability()` returns its input unchanged.
**`partners-page.tsx` ships a live affiliate-disclosure notice over 12 partners whose
`websiteUrl` is `https://example.com/…`, all marked `isActive: true`.**

**Functional bugs.** No household-size scaling — `count` is how many times a meal appears in the
week, never multiplied by servings or eaters; the API **accepts** `eaterIds` and the client never
passes them, so **the household model the planner builds is discarded at the shopping boundary**.
Freezer deduction subtracts frozen *portions* from meal *instance count*. Pantry deduction does
not exist server-side.

---

### 3.9 Cookbook — **30%** · Priority: **Critical**

**Verdict on the primary journey: NO.**

🔴 **Nominally 500 recipes. Really about 128.** Verified directly against the live database: of
2,881 method steps across the 500 system recipes, only **407 are distinct — 85.9% duplication**.
One four-step template is the entire skeleton of **372 of 500 recipes (74.4%)**. Verbatim from the
shipped library:

> **British Edamame, Onion & Aubergine Stuffed Pitta** — *"Heat olive oil in a large pan and cook
> onion for 6–8 minutes. | Add garlic and spices and cook for 1 minute. | Add edamame, onion and
> aubergine, stirring to coat in the flavour base. | Add tomatoes, stock or water as listed and
> simmer until tender. | **Cook or stir in the oats as appropriate for the dish.** | Season lightly
> and serve with fresh herbs."*

You are told to simmer a pitta recipe and then stir in oats "as appropriate". **This is not
cookable.** It passed CI because `verify:cookbook-seed` checks only that `instructions` is
non-empty.

| Attribute | Coverage of the 500 |
|---|---|
| Ingredients | 100% |
| Method present | 100% — but see above |
| **Images** | **0%** (verified: 0 of 884 system meals; 0 of 1,316 templates) |
| Nutrition | **14.6%** |
| Parsed quantities | **0%** |
| Prep/cook time, difficulty, cuisine | **no column exists** |
| Dietary classification | 2 of 13 declared diets |

🔴 **Licensing exposure is live, not theoretical.** The *policy layer* is excellent — BBC Good
Food, AllRecipes, Jamie Oliver and Serious Eats are all marked `unlicensed` / `forbidden` with
cited reasoning, and `isSourceCallable` checks policy **before** the admin toggle. But:
- **The DB already holds the scraped content** — 156 rows with `bbcgoodfood.com` source URLs,
  142 with verbatim multi-step method text, **126 hotlinking `images.immediate.co.uk`**.
- **`/api/preview-recipe` has no gate at all** and fetches any URL with **spoofed Chrome headers**
  (`Sec-Ch-Ua`, `Sec-Fetch-*`) explicitly shaped to defeat bot detection.
- The import gate covers **four hostnames**; every other domain short-circuits to *allow*, with a
  WordPress `/wp-json/` fallback used specifically when the normal fetch is blocked.
- **No SSRF protection anywhere** — cloud metadata endpoints are reachable from any logged-in
  account.
- TheMealDB runs on the **shared free test key** (`/v1/1/`), which the register itself flags.

---

### 3.10 Pantry — **35%** · Priority: **Critical**

**Verdict: NO.** The implemented journey (tick names, push to a list) works. The promised journey
has no column, no service and no write path.

🔴 **The pantry is not a pantry.** `user_pantry_items` has **no on-hand quantity, no unit, and no
expiry column of any kind**. The only quantity fields are `need_quantity_value`/`need_unit` — a
shopping wish, not a holding. **3 rows of 36,019 (0.008%) carry a quantity.** There is no
shelf-life knowledge and no expiry warning anywhere.

🔴 **Nothing maintains it.** `logMealToDiary` never touches pantry. Cooking changes nothing. There
is **no barcode → pantry path** — `BarcodeScanner` is used in Products, Meals and Admin, every
room except the one where scanning groceries is the point.

🔴 **The intelligence layer reasons confidently over fabricated inventory.**
`seedDefaultFoodPantryItems` inserts 128 items per household — including *Papaya, Cantaloupe,
Ice cubes* — with `default_have = true`. **That flag is never set to `false` anywhere in the
codebase.** Two consumers read it as ground truth, one commenting it is *"the household's own 'I
have this' flag"*. Measured: **35,074 of 36,019 rows (97.4%) are seed; 66 of 275 households (24%)
have ever added an item; 0 rows anywhere have `default_have = false`.** The app has told users to
reconsider buying eggs, oats and lentils they demonstrably did not own — **94 times across 26
users.**

🔴 **"What can I make from my pantry" has never fired once.** `cookbook-recipe-cookable-now` is
absent from `opportunity_deliveries` entirely. Its `owningDomain` is `"cookbook"` while the pantry
page mounts `domains={["pantry"]}` — **it would not render there even if it did fire.**

---

### 3.11 Diary — **35%** · Priority: **Critical**

**Verdict: mechanically yes, as a product no.**

**Complete, and genuinely good.** Logging friction is the best-executed thing in this audit —
**two taps** to log a known meal, one round trip, with `/recent` and `/frequent` fast paths that
self-improve. The full path is authenticated, ownership-checked and transactional.

🟢 **The day-model bug has actually been fixed properly** — `toISOString().slice(0,10)` removed,
resolution now via `householdToday()` with `Intl.DateTimeFormat`. Credit where due. 🔴 **But
`households.time_zone` is NULL for 334 of 349 households (95.7%) and no UI anywhere sets it** —
the `PATCH` exists with zero client callers. Correct machinery, starved of input.

🔴 **Portion handling does not exist.** No portion, quantity, serving, gram or eater column; the
PATCH route whitelists `name`, `notes`, `mealSlot` only. `meal_items` holds **15 rows across 1
meal of 3,179, with 0 non-null quantities**.

🔴 **The payback is a hardcoded string.** `getInsightText` selects between four platitudes based
solely on *how many days have rows*. It reads no food. A household logging chips and lager 24 days
of 30 is told it is *"focusing on what matters."*

🔴 **Plant diversity — the product's central promise — never reads the diary.**
`use-week-meal-entries.ts:42` queries only `/api/planner/full` and `/api/meals`. **It measures
what you planned, never what you ate.** It also dedupes on the ingredient key rather than the
diversity group — the exact error its own source file forbids in writing — and calls
`isPlantIngredient` on raw un-normalised strings, matching **130 of 3,175 distinct strings vs 552
if normalised first (~74% dropped)**. The two bugs push opposite ways, so **the displayed number
has no bounded error.**

🔴 **Every logged entry fires a `takeaway_avoided` savings event at £10.** The 564 seeded entries
represent **£5,640 of claimed savings for logging toast.**

---

### 3.12 Analyser — **45%** · Priority: **Critical**

**Complete.** A real, deterministic, tested scoring engine with genuine care — overlap-consumption
tracking stops "fatty acids" matching inside "mono- and diglycerides of fatty acids", and
`FORTIFIED_FLOUR_PATTERN` correctly separates mandatory UK flour fortification from discretionary
additives, with a user toggle. **300 additives live.** A real barcode scanner (native
`BarcodeDetector` with `@zxing/browser` fallback) with correct UPC-A→EAN-13 expansion.
Analyser→Planner works: 82 meals carry `meal_source_type='openfoodfacts'`.

🔴 **The flagship feature is effectively unused, and THA cannot measure it.** THA built
`barcode_lookup_events` specifically to measure barcode hit rate. It contains **one row**.
Across 327 users and 3.5 months, barcode scanning produced **4 of 110** product records.

🔴 **Open Food Facts / ODbL non-compliance.** THA's own audit already found this — `FS1:47`:
*"❌ Non-compliant as implemented… No ODbL/DbCL notice, no link to openfoodfacts.org, and no
share-alike release."* Logged as gap G3, severity High, on 2026-07-02. **`grep -ri "ODbL"` across
the entire repository returns zero hits sixteen days later.**

🔴 **All production traffic goes to OFF's staging server** — `world.openfoodfacts.net` at five
sites, while the admin page correctly uses `.org`. A paid product must not depend on a third
party's staging tier. The User-Agent still identifies THA as *"SmartMealPlanner/1.0 (contact:
smartmealplanner@replit.app)"* — a product that no longer exists.

🔴 **NOVA is fabricated and shipped under its real name.** `upf-analysis-service.ts:535` —
when OFF supplies no NOVA group, one is **synthesised from THA's own uncited score** and emitted
in a field named `nova_group`. NOVA is a published academic classification (Monteiro et al.).
`analyser.md:76-79` **forbids exactly this**, and the code does it anyway.

🔴 **Specific rules are indefensible under the framework they invoke.** Palm oil is penalised as
"industrial" though NOVA classes it a group-2 culinary ingredient. **Rosemary extract is
penalised** — a natural antioxidant used specifically to *replace* synthetic preservatives — so
the score pushes households **toward** the more synthetic product.

---

### 3.13 Household Nutrition — **25%** · Priority: **High** (Critical if personalisation ships)

🔴 **The engine was built and its window onto the world was deleted.** The module header, dated
**2026-07-18 — today** — says so: *"THIS MODULE CURRENTLY HAS NO PRODUCTION CALLER. Its I/O
orchestrator and its only UI were retired as dead code."* Verified: both files do not exist;
`/api/household-nutrition` does not exist and a test actively asserts it stays deleted. **Of the
module's 18 exports, the only thing any client imports is the constant `WEEKLY_PLANT_TARGET = 30`.
All 561 lines of scoring logic are dead.**

The governing docs are, to their credit, honest — `HHP2:3` reads *"⛔ STATUS CORRECTION — THIS
WORKSTREAM DID NOT LAND… Its 'Complete' claims are FALSE"*, and `HHP2:8` adds the line this whole
audit exists to answer: ***"'Complete' stops anyone looking. This document is the reason nobody
looked for five days."***

**The one surface that exists is unreachable by route** — mounted only inside `/plant-diversity` —
**ignores the food diary entirely** (planner only), and **self-erases** when the planner is empty.

🔴 **Per-eater modelling does not exist.** `household_eaters` has six columns and **no age, DOB,
life stage, sex, weight or activity level**. 387 eaters across 349 households, zero nutritional
attributes. 🟢 **The birth-date legal blocker is correctly held and correctly reasoned** —
`LIFE1:412`: *"Children's data is a legal and product question with a regulatory surface (UK
GDPR), and an engineering investigation has no authority to decide it."* **This call should be
upheld.** Impact is nonetheless total: without age, no requirement can be personalised.

🔴 **No reference standards implemented.** No RNI, RDA, DRV, SACN or NHS figure anywhere — and
the code says so honestly in three places. The fix is identified and unblocked: **CoFID
(McCance & Widdowson), Crown copyright under the Open Government Licence** — free commercial
reuse with attribution, UK-specific. **Not integrated.** This is the highest-leverage unblocked
item in the area.

🟢 **Genuinely strong:** an **EFSA health-claim firewall** enforced in the system prompt, with
claims wrapped in EU Reg. 432/2012 authorised wordings. Materially better discipline than most
consumer nutrition apps. 🔴 But disclaimer coverage is thin — the canonical `HEALTH_DISCLAIMER`
renders in **two places**, and **`HouseholdNutritionCentre` does not render it at all**.
`products-page.tsx` (2,235 lines) carries none: a household sees a named product scored 1/5 with
warnings and no framing.

---

### 3.14 Community — **20%** (intra-household 75% · inter-household 5%) · Priority: **Low**

**Intra-household collaboration is real and working.** Sound schema with a nullable `userId` on
`household_eaters` — so children are first-class eaters without accounts, which is quietly
excellent domain modelling. Invite→join works end to end with case-insensitive lookup and
owner-only operations enforced server-side. **Departure security is the most rigorous multi-user
code in the repository**, with a real end-to-end regression test against a fixed leak.

🔴 **The UI makes a false sharing claim.** `profile-page.tsx:943` tells users "Shared with
household: Planner, Shopping basket, Pantry, **Freezer meals**". Planner, basket and pantry are
genuinely household-scoped; `meals` and `freezerMeals` carry **only `userId`**. A member can plan
a meal into the shared planner that a co-member cannot open in their own cookbook.

**Inter-household community does not exist** — no public profiles, no ratings, no feed, no
referral, no UGC, no moderation. Publishing is **structurally impossible**: `visibility` only ever
holds `"private"` or `"shared"`.

**Recommendation: do not build community for launch.** Three concrete reasons: (1) it needs
liquidity THA cannot yet have; (2) the moment inter-household UGC ships you inherit moderation,
reporting and takedown obligations — **and given the app holds allergy data, a user-posted recipe
that harms an allergic child is a genuine safety and liability surface**; (3) the share link
already provides the viral loop, and it emits **no events**, so nobody can tell whether it works.
**Instrument the existing loop before building anything social.**

---

### 3.15 Mobile — **35%** (responsive web ~70% · mobile product ~5%) · Priority: **Critical**

🟢 **PX1-W2 "Make the Phone Work" genuinely shipped, and every claim verified in code.** Viewport
correct with `viewport-fit=cover` and `maximum-scale=1` **removed** to unblock pinch-zoom (WCAG
1.4.4) — both details right, both usually wrong. A **44px touch floor implemented as a hit-area
pseudo-element** so a call-site `size` override cannot shrink it — the correct architecture,
reaching ~532 button consumers at once. Safe areas honoured. The hover-on-touch trap fixed. One
breakpoint truth. **Route-level code splitting shipped** — previously every household downloaded
the admin world to see tonight's dinner.

🔴 **Capacitor is aspirational — a 9-line config and four unused dependencies.** `ios/` and
`android/` **have never existed** (`git log --all` is empty for both). **Zero `@capacitor/*`
imports anywhere. Zero plugins installed.** There is no path from this repo to an App Store build
without net-new native work. Hard rejection risk: the app ships a camera scanner and there is no
`NSCameraUsageDescription`.

🔴 **PWA entirely absent** — no manifest, no service worker, **no offline capability of any kind**
(zero matches for `navigator.onLine`), not installable, no icon set.

**For a product used in a kitchen and a supermarket — the two places phone connectivity is worst —
the total absence of offline handling is the most consequential finding in this area.** A
household in a supermarket aisle with two bars loses their shopping list to a spinner.

🔴 **Zero client-side tests.** Playwright is installed and used by **15 screenshot-capture
scripts** — art direction, not tests. Not one assertion. The touch floor, safe areas and
breakpoints are protected by nothing, and the last such regression already happened.

---

### 3.16 Commercial Readiness — **12%** · Priority: **Critical**

**This area holds the single hardest launch blockers, and most of them are absences.**

🔴 **Payments: 0%. Does not exist.** No Stripe, Paddle, Braintree, PayPal or RevenueCat in
`package.json` or `node_modules`. **Zero webhook endpoints in the entire repository.** Zero
billing environment variables. No invoices, no VAT, no dunning, no refunds.

🔴 **Entitlement is three gates, all confined to plan templates.** None of the core value — meal
planning, food intelligence, the Companion, analysis, pantry, diary — is gated at all. Three
specific revenue leaks:
- **`requirePremium` is dead code** — the only reusable enforcement primitive has **zero call
  sites**.
- **Three gates are live TODOs**: `routes.ts:920` (>3 meals), `:3335` (analysis limit), `:6102`
  (>2 days/week). Free users get unlimited meals, unlimited analysis and a full 7-day planner.
- 🔴 **`subscriptionExpiresAt` is never enforced — a premium tier never expires.**
  `hasPremiumAccess()` reads **only** `subscriptionTier`. **A cancellation or failed payment could
  never revoke access, because nothing reads the fields that would express it.** This is the
  highest-leverage two-line fix in the audit.

🔴 **No price exists anywhere in the repository.** No amount, no currency, no billing period, no
pricing page. The four "Upgrade to Premium" strings in the client are **text with no
destination** — no route, no button, no checkout. A user told to upgrade has literally nowhere
to go.

🔴 **Legal and compliance: 0%.** Terms of Service, Privacy Policy, cookie consent, GDPR export,
account deletion, age gating, accessibility statement — **every one does not exist**. The string
`consent` appears **nowhere in `client/src`**. Signup captures no consent whatsoever.

**This is the gravest finding in the audit.** THA stores **UK GDPR Article 9 special-category
health data about identified individuals, including children**: allergies and intolerances,
`healthGoals`, `heightCm`, `weightKg`, and a longitudinal health record in `foodDiaryMetrics`
(`weightKg`, `bmi`, `moodApples`, `sleepHours`, free-text `notes`), plus `childrenCount` and
`babiesCount`. Against that: no Art. 9(2) condition captured, no lawful-basis record, no Art. 13
notice, no Art. 15 access path, **no Art. 17 erasure path**, and **no field-level encryption
anywhere**.

**Damningly, `product_events` and `activity_summary` are already declared
`onDelete: "cascade"` on `userId` — the database is ready for user deletion and the application
code to trigger it was never written.** And ~13 user-scoped tables declare `integer("user_id")`
with **no `.references()` at all**, so a raw `DELETE FROM users` would orphan most of a
household's health data rather than remove it.

🔴 **Named children's allergies are transmitted to OpenAI (US)** with no recorded lawful basis —
`routes.ts:9563` interpolates `${p.displayName}: … allergies & intolerances=${restrictions}`
into the prompt. No DPA reference, no zero-retention config, **no pseudonymisation (sending
`Eater 2` would cost nothing functionally)**, no per-user opt-out.

🔴 **Analytics: flying blind.** No product analytics SDK. **No error monitoring** — `ErrorBoundary`
catches render throws and reports nowhere; a production crash is invisible. The self-built event
pipeline is a competent feature-usage counter for engaged households, but **no acquisition events
exist at all** — no signup, onboarding, trial, login or activation. **The 20-minute demo, the only
acquisition mechanic, is completely unmeasured.**

🔴 **Support: both contact routes sit behind `ProtectedRoute`.** An unauthenticated visitor — or
**a paying customer locked out of their account** — has no way to contact THA at all.

🔴 **The worst operational gap:** email verification blocks login in production, email send
**fails silently** (returns HTTP 201 telling the user to check an inbox that may never receive
anything), and **no admin route can resend a verification email or mark a user verified**. This is
an unrecoverable customer lockout with no support remedy.

🟢 A real landing page **does** exist, with deliberate OG/Twitter metadata added specifically so
share links unfurl. The demo trial is genuinely well-built and server-enforced (4/4 on start,
stored expiry, server check, real consequence) — **but it converts to nothing**: the captured
email has no email type that could ever contact it.

**Admin surface ratio: 1 customer-support page against 11 internal food-data/AI/test pages.** The
admin tooling was built to curate the food platform, not to help a customer who cannot log in.

---

### 3.17 Engineering — **48%** · Priority: **Critical**

🟢 **The tests are real tests, not smoke scripts** — and this deserves saying clearly. 109 of 153
files define an `assert` helper; 142 exit non-zero on failure. `test-restriction-safety.ts` has 78
assertion sites in 403 lines. The security suites **drive a real HTTP server and read real
`Set-Cookie` headers off the wire**, and include **mutation tests that prove the assertion can
fail**. 🟢 **CI is well-designed** — coherence → ephemeral Postgres → ordered migrations against an
empty DB → typecheck gate → suites → build. 🟢 **The gates enforce and are not theatre**: the
typecheck gate keys on `(file, TS code)` with a documented rationale for rejecting line/message
keying, and **fails when errors are fixed** to stop the baseline going stale.
🟢 **`verify:coherence` passes** — 108 `file:line` citations across 47 governing documents all
resolve. A gate that mechanically checks the docs cite real code, and it works.

**Outstanding.**
- 🔴 **The typecheck gate is RED and being ignored** — 251 actual vs 168 baseline, 20 regressions.
- 🔴 **`npm test` cannot pass in CI — it is unrunnable as configured, and this is the root cause
  of the never-green pipeline.** Measured in this audit: the suite reached **33 of 147 suites in
  50 minutes** before hitting the audit's own timeout — **1.52 min/suite, projecting ~223 minutes
  (3.7 hours) for a full run**. The CI job sets **`timeout-minutes: 45`**
  (`.github/workflows/ci.yml:51`). **Even if GitHub's runners were three times faster than this
  environment, a full run would take ~74 minutes and still exceed the limit.**

  This explains the record precisely: CI has run twice, failed twice, with `npm test` and
  `npm run build` **skipped both times**. The gate was not neglected — **it is structurally
  incapable of completing.** Every claim in the repository that rests on "the 147-suite gate"
  rests on a gate that has never once run to completion, anywhere, by anyone.

  No genuine test failure was observed in the 33 suites that did run. Separately, a suite that an
  earlier run failed on (`test-trust1-s3-secure-meal-template-endpoints`) **passed in isolation**,
  confirming flakiness rather than a permanent break.

  Compounding it: the suite is 147 `&&`-chained scripts, so a single flaky suite blinds every
  suite after it. There is no reporter, no summary, no parallelism and no per-suite isolation.
  **The fix — parallelising the runner — is also the fix for the CI timeout.**
- 🔴 **Five orphan test files, three of which test features that were never built.**
  `test-plan2-planner-evolution.ts` imports `scoreIntelligence` — does not exist.
  `test-pantry1-intelligent-pantry.ts` imports `generatePantryExplanation` and
  `EMPTY_PANTRY_HOUSEHOLD_FACTS` — do not exist. **PLAN2, PANTRY1 and CBK2 have tests, have
  implementation documents, and have no implementation. Excluding them from `npm test` is what
  kept it invisible.**
- 🔴 **Zero client tests across 90,307 lines**, including a 7,092-line `meals-page.tsx`.
- 🔴 **`main` unprotected + `deploy.sh` runs `git add -A` and pushes with no test gate.** With 158
  untracked files present, running it would sweep everything into production in one unreviewed
  commit. `ci.yml` itself predicts this, marking branch protection and deploy hardening as "NOT
  done here". Neither was ever done.

**Honest assessment of the governance overhead.** The **gates** are a help and should be kept —
`verify:coherence`, `verify:publication` and the typecheck gate catch real defects that would
otherwise ship. The **prose is a drag**, and the evidence is that the process no longer verifies
itself: `repo-structure-verify.sh` **fails its own rules**, `adoption:check` fails 4, the Source
of Truth register is flagged stale **by the verifier it governs**, and 925 doc files were touched
since 1 July — while the two hardest signals, tests and typecheck, are both red.

---

## 4. Overall completion

| # | Area | % | Priority |
|---|---|---|---|
| 1 | Intelligence | 68 | Critical |
| 2 | Platform | 62 | Critical |
| 3 | Companion | 62 | Critical |
| 4 | Planner | 62 | High |
| 5 | Shopping | 48 | Critical |
| 6 | Engineering | 48 | Critical |
| 7 | UX / North Star | 45 | High |
| 8 | Analyser | 45 | Critical |
| 9 | Pantry | 35 | Critical |
| 10 | Diary | 35 | Critical |
| 11 | Mobile | 35 | Critical |
| 12 | Production Foundation | 32 | Critical |
| 13 | Food Intelligence | 30 | Critical |
| 14 | Cookbook | 30 | Critical |
| 15 | Household Nutrition | 25 | High |
| 16 | Community | 20 | Low |
| 17 | Commercial Readiness | 12 | Critical |

> ### Overall build completion: **41%**
> ### Commercial launch readiness: **25%**

The two figures differ because **launch readiness is gated, not averaged**. A product with a 68%
intelligence platform and no privacy policy is not 68% launchable; it is not launchable. Four
areas — Commercial Readiness (12%), Production Foundation (32%), Cookbook (30%) and Food
Intelligence (30%) — each independently block a paid launch, and no amount of progress elsewhere
compensates.

---

## 5. Top 20 remaining workstreams

Ordered by **launch-gating force**, not by size.

| # | Workstream | Area | Why it gates launch | Size |
|---|---|---|---|---|
| 1 | **Legal base** — privacy policy, terms, explicit Art. 9 consent at signup (timestamped, versioned, withdrawable), age gate | Commercial | Processing special-category health data about children with no lawful basis. Charging money makes it materially worse. | 1–2 wk + counsel |
| 2 | **GDPR rights** — account deletion (Art. 17), data export (Art. 15); add missing FK cascades | Commercial / Platform | Legally required; the DB is already wired for it, the endpoint was never written | 1 wk |
| 3 | **Companion allergen safety** — restriction filter before composition, a HARD RULE in the prompt, post-generation validation | Companion | The Companion invites allergy questions and answers them with an unvalidated model output. Real-world harm. | 1–2 wk |
| 4 | **Database backups + PITR + migration rollback** | Production | Families' health data is currently unrecoverable from any destructive event | 3–5 d |
| 5 | **Payments** — Stripe Checkout + Billing + **webhooks**; define a price; fix `hasPremiumAccess()` to honour expiry and status; self-serve cancellation | Commercial | THA cannot take money at all today | 1–2 wk |
| 6 | **Remove fabricated pricing and the fake store comparison**; fix or remove the example.com partners page | Shopping | Misleading pricing under real retailer names + trademark exposure; an affiliate disclosure over fictional partners | 3–5 d |
| 7 | **Rewrite or honestly cut the cookbook** — 372 of 500 recipes are uncookable boilerplate | Cookbook | The core content promise is not met | 4–8 wk (content) |
| 8 | **Purge unlicensed publisher content; close the scraping paths** — gate `/api/preview-recipe`, remove spoofed headers and the WP-JSON fallback, default-deny unregistered domains, add SSRF protection | Cookbook | Copyright exposure sitting in production data + an open SSRF | 1 wk |
| 9 | **ODbL compliance** — attribution, notice, share-alike posture; repoint OFF to `.org`; fix the User-Agent | Analyser | Known since 2026-07-02, unremediated; blocks commercial use of the product data | 3–5 d |
| 10 | **LLM operations** — timeouts, retries, rate limiting on the turn endpoint, usage capture, spend cap | Production / Intelligence | Unbounded cost exposure from any authenticated account; 30-min handler hangs | 3–5 d |
| 11 | **Ship the branch** — commit the untracked source, **parallelise `npm test` so it can finish inside the CI timeout at all**, fix the 20 typecheck regressions, enable branch protection, harden or delete `deploy.sh` | Engineering | **147 commits and 19 days of work are undeployed; the committed repo does not build; and the test gate is structurally unrunnable (~3.7 h vs a 45-min timeout), which is why CI has never passed** | 1–2 wk |
| 12 | **Nutrition knowledge sign-off** — a qualified human reviews and signs off claims so `reviewedAt` is populated | Food Intelligence | The knowledge platform is built, gated and **publishing nothing** | 2–4 wk (expert time) |
| 13 | **Fix the inverted `healthScore` + backfill `product_history`** | Food Intelligence | Users are shown a score that is exactly backwards; cost grows with every row | 1–2 d |
| 14 | **Rebuild the Apple Score to be risk-aware and reconstructible**; remove fabricated NOVA; cite every additive risk level; publish the methodology | Analyser / Food Int. | Currently indefensible under public or legal scrutiny | 2–3 wk |
| 15 | **Error monitoring, health endpoint, structured logging, pool error handler, graceful shutdown** | Production | A production crash is currently invisible; one dropped connection kills the API | 3–5 d |
| 16 | **Fix the six-week anchor cliff + build the week-declaration path**; converge the planner page | Planner | Every household silently loses its anchor after 42 days | 1 wk |
| 17 | **Wire plant diversity to the diary**; add a portion column; fix the two counting bugs; remove the false £10 savings claim | Diary | The product's central promise is measured from the wrong source with unbounded error | 1–2 wk |
| 18 | **Stop asserting fabricated pantry inventory**; add on-hand quantity and expiry; deplete on cook | Pantry | The app makes provably false statements about people's cupboards | 2–3 wk |
| 19 | **Offline + PWA** — manifest, service worker, cached shopping list | Mobile | The product fails in the kitchen and the supermarket, its two primary contexts | 1–2 wk |
| 20 | **Acquisition analytics + activation funnel + a logged-out support route + admin resend-verification** | Commercial | Launching without these is flying blind, with no remedy for locked-out customers | 1 wk |

**Deliberately not in the top 20, with reasons:** community (post-launch growth, and it imports
moderation liability); native app store presence (a separate multi-week workstream — launch on
mobile web); CoFID integration (high value, but personalisation is legally gated behind LIFE1
§12.1); the North Star visual realisation (differentiating and worth doing, but it does not gate a
paid launch — see §7).

---

## 6. Shortest path to commercial launch

There are two credible paths. **The second is strongly recommended.**

### Path A — Launch the full product as scoped (~5–7 months)

Requires all 20 workstreams. Dominated by the cookbook rewrite (7) and the nutrition sign-off (12),
both of which are **content and expert-time constrained, not engineering constrained** — they
cannot be compressed by adding developers.

### Path B — Narrow the launch surface, then launch (~10–14 weeks) ✅ **Recommended**

The insight is that **THA's weakest areas are its most-promised ones**, and several can be
*withdrawn* rather than *fixed*. Every item below is a deletion or a hiding, not a build.

**Launch with:** Planner · Shopping list (no prices) · Cookbook (~128 real recipes) · Diary ·
Companion (allergen-safe) · Household sharing · Analyser (additives and ingredients only, no
Apple Score).

**Withdraw before launch — turn off, do not fix:**
- **All pricing, store comparison, basket handoff and the partners page.** Removes workstream 6
  entirely and eliminates the largest misleading-claims exposure in one deletion.
- **The Apple Score and the derived NOVA group.** Ship additive detection and ingredient
  transparency — which are genuinely good and defensible — without the indefensible composite.
  Defers workstream 14 past launch.
- **The nutrition-benefit layer**, until sign-off exists. It renders nothing today; make that
  deliberate and honest rather than accidental.
- **Plant diversity**, or fix it (workstream 17). Do not ship a headline number with unbounded error.
- **The pantry's inventory intelligence.** Keep the checklist; remove every claim about what a
  household owns.
- **`plant-diversity-page`'s "Coming soon" panels** and the unreachable `list-page.tsx`.

**Then the critical path is:**

| Phase | Weeks | Content |
|---|---|---|
| **0 — Stop the bleeding** | 1 | Ship the branch (11): commit untracked source, protect `main`, harden `deploy.sh`, clear typecheck regressions. **Nothing else is real until what you have is deployable.** |
| **1 — Make it safe** | 2–4 | Companion allergen safety (3) · LLM operations (10) · backups and rollback (4) · error monitoring and the pool handler (15) |
| **2 — Make it legal** | 3–6 | Legal base (1) · GDPR rights (2) · ODbL compliance (9) · purge unlicensed recipes and close scraping (8) · pseudonymise eater names sent to OpenAI |
| **3 — Make it sellable** | 5–8 | Payments and entitlement (5) · pricing · self-serve upgrade and cancellation · admin resend-verification and a logged-out support route (20) |
| **4 — Make it honest** | 6–10 | Withdraw the surfaces above · cut the cookbook to ~128 real recipes · fix `healthScore` (13) · fix the anchor cliff (16) |
| **5 — Make it usable where it's used** | 8–12 | Offline and PWA (19) · acquisition analytics (20) · mobile polish on `shared/:token` |
| **6 — Beta** | 12–14 | 20–50 real households. **THA currently has almost no real usage evidence — this phase is not optional.** |

**Critical-path constraint:** Phase 2 gates Phase 3 (you cannot lawfully charge before the legal
base exists), and Phase 1 gates everything (you should not expose real households to an
unmonitored, allergen-unsafe system). Phases 4 and 5 can run in parallel with 3.

---

## 7. Recommended implementation order

1. **Deploy what exists.** Commit the untracked source (**the repository does not currently
   build**), protect `main`, harden `deploy.sh`, clear the 20 typecheck regressions, make
   `npm test` parallel and green, and put `verify:publication` into CI. *Rationale: 147 commits of
   completed work — including every security control — is sitting undeployed, and the tree in git
   is incomplete. Nothing downstream is trustworthy until this is fixed.*
2. **Companion allergen safety.** *Rationale: the only finding with a path to physical harm.*
3. **Backups, monitoring, LLM timeouts and spend caps.** *Rationale: cheap, days of work, and they
   remove catastrophic and unbounded-cost risk. The pool `'error'` handler is three lines.*
4. **Legal base and GDPR rights.** *Rationale: longest external dependency (counsel) — start it in
   parallel with 2 and 3, not after.*
5. **Withdraw the indefensible surfaces** (pricing, Apple Score, NOVA, pantry inventory claims,
   unsigned nutrition claims). *Rationale: the fastest, cheapest quality improvement available —
   deletions, not builds — and it shrinks every subsequent workstream.*
6. **Licensing** — ODbL, purge unlicensed recipes, close scraping, SSRF. *Rationale: the exposure
   is in production data today and grows with every import.*
7. **Payments and entitlement.** *Rationale: gated by 4; fix `hasPremiumAccess()` first — it is two
   lines and currently makes every subscription permanent.*
8. **Cut the cookbook to what is real; fix `healthScore`; fix the anchor cliff.**
9. **Diary → plant diversity; portions; pantry quantity and expiry.**
10. **Offline/PWA and analytics.**
11. **Closed beta with real households.**
12. **Only then:** the North Star visual realisation, native apps, CoFID, community.

**One judgement stated directly.** The recurring pattern across all seventeen areas is the same:
**a correct engine is built, carefully reasoned, documented beautifully — and never connected;
a naive fallback ships in its place.** The Decision Engine, the resilience layer, the household
nutrition core, the plant classifier, the pantry matcher, the recipe acquisition register, the
`requirePremium` middleware and the Apple Score trust gate are all real, well-built artefacts that
the runtime does not use. THA's problem is **not** that it cannot build things. It is that **the
last ten percent — wiring, deploying, deleting the rival, and telling the truth about what is
finished — is consistently the part that does not happen**, and the documentation culture has been
absorbing the resulting gap rather than surfacing it.

The single most valuable process change is the one `HHP2:8` already discovered on its own:

> ***"'Complete' stops anyone looking."***

Stop writing completion reports. Let the gates say what is done — they already work, and they are
already telling the truth. They are just red, and nobody is listening.

---

## 8. What this audit did not do

- **Implemented nothing.** No product source, schema, config or test was modified. The only files
  written are this document and the session run file.
- Could not run the full `npm test` suite to completion — **because it cannot be run to completion
  in any reasonable window.** It reached 33 of 147 suites in 50 minutes, projecting ~3.7 hours
  against a CI timeout of 45 minutes. This became a finding rather than a limitation (§3.17).
- Did not assess third-party dependency vulnerabilities (`npm audit`), load or performance under
  concurrency, or the admin/benchmark surfaces beyond whether they are real.
- Did not evaluate Companion answer quality directly — **because nothing in the repository can:
  the judge is disabled and every corpus grade is `TBC`** (§3.4).
- **Made one correction to itself in flight**, recorded in §3.6: an initial reading of raw citation
  counts as a trust breach was wrong. The evidence gate is real and enforced. The finding became
  more important once corrected, not less — the platform publishes nothing because sign-off has
  never occurred.

---

*Audit conducted 2026-07-18 against working-tree HEAD `24e37d20` on branch
`int1-intelligence-platform`. Rollback point: `rollback/LAUNCH1-launch-readiness-audit-20260718`.
This document is a point-in-time investigation and is never edited; supersede it with a new
investigation rather than correcting it in place (`REPOSITORY_CONVENTIONS.md` §3).*
