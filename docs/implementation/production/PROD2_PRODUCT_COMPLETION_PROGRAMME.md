# PROD2 — Product Completion Programme

**Session:** `PROD2_Product_Completion_Programme`
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `rollback/PROD2-product-completion-programme-20260718` → commit `24e37d20` (annotated)
**Dirty-tree snapshot:** `stash@{0}` → `8cc31519778310f1df430f42493cb0b022c2005c` (82 tracked files; **untracked files NOT covered** — see §9)
**Type:** Implementation. Completes the existing product on the existing platform.
**Mandate:** No new capability. No new architecture. Connect, withdraw, or repair only.

---

## 1. What this programme is, and how it relates to PROD1

`docs/implementation/production/PROD1_PRODUCT_COMPLETION_PROGRAMME.md` already exists and carries almost the same title. **PROD2 is its successor, not a second owner of the same question.** PROD1 closed one theme — *rooms that presented a failed load as an absence* — and closed it completely, then listed **14 remaining product gaps** in its §8, sorted by what each was waiting on. PROD2 is the decision-free remainder of that list, joined with the implementation backlog of `docs/investigations/platform/LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md`.

The division is clean and is stated here so no third session has to rediscover it:

- **PROD1 owns** the canonical-state adoption on the six bottom-nav rooms, the 404, ErrorBoundary coverage, document metadata, the production console drop. PROD2 re-opened none of it.
- **PROD2 owns** the withdrawal of surfaces that were never built, the removal of dead rival implementations, the production-foundation wiring, and the verification gates. It creates **no component, capability, route, entity, owner, token or store.**

LAUNCH1 states the thesis both programmes serve, and PROD2 quotes it because it is the sentence that decides scope:

> *"The recurring pattern across all seventeen areas is the same: **a correct engine is built, carefully reasoned, documented beautifully — and never connected; a naive fallback ships in its place.**"*

PROD2's headline finding is a second pattern beside it, and it is the one that cost a household something: **THA shipped, from two live menus, a directory of twelve health and nutrition practitioners that do not exist.**

---

## 2. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity is touched. No key space is added, split or renamed.

☑ One owner per fact
  No fact gains a store. Two facts had their single owner CORRECTED to the
  one that was already true: the Quick List handoff (quick-list.ts named
  list-page.tsx as its reader; the real reader is shopping-workspace-page.tsx)
  and the outbound identity of THA to Open Food Facts (four rival User-Agent
  strings → one).

☑ No duplicate entities
  None created. One RIVAL removed: client/src/pages/list-page.tsx, a second
  773-line shopping-list implementation with no route and no importer.

☑ No duplicate ownership
  None created. Reduced: `TopBar` (a whole unrendered top navigation bar,
  zero consumers) retired; the raw-`<button>` rival count fell 538 → 524.

☑ No duplicate state
  No user state is split. No new client store, context or cache key.

☑ Extends existing architecture
  It adopts owners that already exist — `ui/skeleton.tsx` for a hand-rolled
  spinner — and repairs the pool and typecheck configuration already present.
  Nothing is authored to be adopted later.

☑ Progressive enrichment where appropriate
  N/A — no knowledge entity is introduced or extended.

☑ Knowledge domain compliance
  N/A — no knowledge domain is introduced or extended. No claim, evidence
  chain, gate or graduation path is touched.

☑ Honest gaps over fabricated information
  This is the programme's subject. Every user-facing change REMOVES a false
  statement: twelve invented businesses presented as real recommendations
  under a genuine affiliate notice; two tabs promising rooms that do not
  exist; a control that could never be pressed. Core Principle 6.

☑ No permanent synchronisation bridge
  None introduced.

☑ No duplicate capabilities
  No capability is registered, bound or extended. The Intelligence Platform,
  the Capability Registry and the Intent Engine are byte-untouched.
```

### AI Architecture Compliance

**Not applicable, and deliberately so.** PROD2 registers no capability, composes no Context View, adds no Companion surface, and touches no LLM call site, prompt, or provider. `server/intelligence/**` is byte-untouched by this session.

This is a deliberate refusal, not an oversight. The single highest-value item in LAUNCH1 is **Companion allergen safety**, and §8 records in full why PROD2 declined to half-build it.

### Experience & UI Governance

- **The Experience Test** (EXPBLUE2 §15.3) — *which room is this · how should someone feel here · what is the one thing it helps them do.* The Nutrition room could not answer the third question on two of its four doors; it now has two doors and answers it on both.
- **Honest absence** — a withdrawn surface is now silent rather than advertised. A "Coming soon" card is an honest sentence about a dishonest situation: it tells the household THA has put a door on a room it has not built.
- **Adoption Register Compliance** — satisfied **in the same change** (§4). `npm run adoption:check` moved **4 failures → 0**, and the new orphan this change deliberately created is recorded with a named owner rather than left to be discovered.

---

## 3. Definition of Done

| # | Done means | Status |
|---|---|---|
| 1 | Existing capabilities fully connected | ⚠️ **Partial** — the reachable-but-unwired items are reported in §8, not silently claimed. `/supermarkets` is verified functional and still unlinked; connecting it is a navigation decision (§8.1). |
| 2 | No duplicate implementations | ✅ `list-page.tsx` (773 lines) and `TopBar` (185 lines) retired; both verified dead at the moment of deletion |
| 3 | Production-critical wiring completed | ✅ pool `'error'` handler + connection timeout, proven by forced failure (§7.3) |
| 4 | Placeholder experiences removed or honestly hidden | ✅ the partners directory, two Nutrition tabs, one dead diary control — all verified absent from the shipped bundle |
| 5 | Adoption and publication verification improved | ✅ `adoption:check` **4 failures → 0** (81 passed); typecheck **251 → 94 errors** |
| 6 | Product trust measurably improved | ✅ 12 fabricated businesses no longer ship; 9 call sites no longer identify THA as a product that does not exist |
| 7 | Architecture preserved | ✅ no entity, owner, capability, route (added), token or store |
| 8 | AI Architecture preserved | ✅ `server/intelligence/**` byte-untouched |
| 9 | Existing tests updated where required | ✅ none required updating — 23 suites re-run green, 0 failures (§7.4) |
| 10 | Manual verification completed | ⚠️ **Partial and disclosed** — bundle-level and runtime verification done; browser-driven verification was **impossible in this environment** (§7.5) |
| 11 | Implementation report completed and saved | ✅ this document |

**Two items are marked partial rather than green.** Both are stated in the table rather than in a footnote, because a Definition of Done that quietly rounds up is the `HHP2` failure this repository has already recorded once: *"'Complete' stops anyone looking."*

---

## 4. Files changed

Measured against the session-start snapshot `8cc31519`. Files modified by **concurrent sessions** are excluded and were never touched.

```
 client/src/pages/list-page.tsx                | 773 --------------------------
 client/src/components/nav-bar.tsx             | 200 +------
 client/src/pages/plant-diversity-page.tsx     | 120 +---
 server/db.ts                                  |  24 +-
 server/routes.ts                              |  24 +-
 docs/implementation/ux/adoption-register.json |  22 +-
 client/src/components/workspace-header.tsx    |  14 +-
 docs/implementation/ux/ADOPTION_REGISTER.md   |  14 +-
 client/src/pages/food-diary-page.tsx          |  13 +-
 client/src/App.tsx                            |  10 +-
 client/src/lib/quick-list.ts                  |   8 +-
 server/lib/openfoodfacts-importer.ts          |   6 +-
 server/services/meal-analysis.ts              |   6 +-
 tsconfig.json                                 |   1 +
 14 files changed, 119 insertions(+), 1116 deletions(-)
```

**The shape of this change is a 9:1 ratio of deletion to insertion, and that is the point.** LAUNCH1 §6 predicted it: *"Every item below is a deletion or a hiding, not a build."*

### 4.1 The partners directory — the finding that justifies the programme

`client/src/data/partners.ts` defines twelve partners. **Every one is invented**, every `websiteUrl` is on `example.com`, and every one is `isActive: true`:

> *Calm Orchard Yoga · Rooted Nutrition Studio · Still Morning Meditation · Family Table Nutrition · Sleep Well Collective · Gentle Strength Movement …*

They rendered on `/partners`, reachable from **two live menus** (`workspace-header.tsx:117`, `nav-bar.tsx:387`), beneath a genuine transparency notice:

> *"Some links on this page may be affiliate links — meaning THA may receive a small commission… We only feature services we genuinely believe in."*

Three things make this the most serious user-facing defect found:

1. **The disclosure is real and the businesses are not.** The notice is what makes a reader trust the list. It is doing the opposite of its job.
2. **It is health-adjacent.** THA holds allergy and health data and here recommended nutrition and movement practitioners who do not exist.
3. **No gate could see it.** It typechecks, builds, renders, and passed every check in the repository, because fabricated data is well-formed data.

**What PROD2 did:** withdrew both nav entries, removed the route, and removed the lazy import so the page and its data leave the bundle entirely. **What it did not do:** delete the page, the data file or the types. A real partner programme is a legitimate product idea; the door is closed until the partners are real, and the register now names the owner who can reopen it.

### 4.2 The Nutrition room — two doors onto nothing

`plant-diversity-page.tsx` offered four tabs. Two rendered a *"Coming soon"* card describing unbuilt work. The room now offers **Foods** and **Nutrients**, which are built. Its loading state also adopted the canonical `Skeleton` owner in place of a hand-rolled spinner.

### 4.3 The dead rivals

| Retired | Size | Evidence it was dead, checked at the moment of deletion |
|---|---|---|
| `client/src/pages/list-page.tsx` | 773 lines | No importer. `/list` redirects to `/shopping-workspace`. Its Quick List handoff (`PENDING_LIST_KEY`) had **already been taken over** by `shopping-workspace-page.tsx:1321`, which reads and clears it. |
| `TopBar` in `nav-bar.tsx` | 185 lines | Exported, **zero consumers** — a whole top navigation bar, including search and logo, that never rendered. |

Removing `list-page.tsx` also **closed one instance of a documented open finding**: the adoption register records five surfaces bypassing the canonical orchard owner via raw `url('/orchard-bg.webp')`, one of which was `list-page.tsx:417`. That count is now **5 → 4**.

### 4.4 Production foundation

**`server/db.ts` — the three lines that keep the process alive.** `node-postgres` emits `'error'` on **idle** clients when a connection drops beneath the pool (a database restart, a failover, an idle-timeout kill). An `'error'` event with no listener is an unhandled error event, which Node escalates to an uncaught exception and **the process exits**. The pool recovers on its own; the listener exists so the process survives long enough to let it. A `connectionTimeoutMillis` was also set — pg's default is `0`, meaning a connection attempt against an unreachable database waits forever.

**`tsconfig.json` — one missing line, 157 errors.** The config set `"lib": ["esnext"]` but **no `"target"`**, so the target defaulted to ES5 and every `for…of` over a `Map` or `Set` in the repository failed with TS2802. Adding `"target": "ESNext"` — matching the `"module": "ESNext"` already there — took the repository from **251 typecheck errors to 94**. This is a typecheck-only change: the shipped bundle is produced by esbuild and is byte-unaffected.

### 4.5 Open Food Facts — honesty at the boundary

Nine call sites sent **production traffic to OFF's staging instance** (`world.openfoodfacts.net`) while the admin page correctly used `.org` — a split owner. All nine now use `world.openfoodfacts.org`. Separately, nine User-Agent strings across four variants identified THA as `SmartMealPlanner/1.0`, contactable at `smartmealplanner@replit.app` and `contact@smartmealplanner.com` — **a product that does not exist at addresses that do not exist**. All nine now send one honest string built from the app's own already-canonical support address (`server/auth.ts:217`):

```
TheHealthyApples/1.0 (+https://thehealthyapples.com; support@thehealthyapples.com)
```

No contact address was invented for this change. Had none existed in the repository, the User-Agent would have been left alone and reported.

---

## 5. Data Impact

**None.** No schema change, no migration, no write path, no new query, no cache-key change, no change to any request payload. No row was read, written, updated or deleted by this session. `shared/schema.ts` and `server/migrations/**` are byte-untouched.

Two databases were **read** during verification, and neither was modified:

- `supermarket_links` (16 rows) — to test LAUNCH1's claim about fabricated partner data. See §6.
- A `select 1` and a simulated pool error, to prove the `db.ts` fix (§7.3).

**No verification account was created.** PROD1 needed one and disclosed it; PROD2's changes were verifiable from the bundle and the pool without authenticating as a household.

---

## 6. Findings withdrawn — three LAUNCH1 items that did not survive verification

PROD1 §7.2 recorded that one of its audit findings was a false positive and **reverted its own "fix" rather than keeping it as harmless-looking padding**. PROD2 hit the same class three times, and records all three, because a backlog that is never re-tested grows fiction.

| LAUNCH1 finding | Verdict | Evidence |
|---|---|---|
| §3.14 — *"the UI makes a false sharing claim… `meals` and `freezerMeals` carry only `userId`"*, so **"Freezer meals"** in profile's "Shared with household" panel is a lie | **FALSE POSITIVE — withdrawn** | `freezer_meals` **has** a `household_id` column, and `getFreezerMeals` reads `where(eq(freezerMeals.householdId, householdId))` (`storage.ts:1549`). The other three claims (Planner, Shopping basket, Pantry) are household-scoped too. **The whole panel is honest.** No change made. |
| §3.8 — *"`partners-page.tsx` ships a live affiliate-disclosure notice over 12 partners whose `websiteUrl` is `https://example.com/…`"*, filed under **Shopping / supermarket integration** | **TRUE, but filed against the wrong surface** | `supermarket_links` holds **16 real rows** with genuine search URLs (`tesco.com`, `sainsburys.co.uk`, `ocado.com`) and **has no `website_url` or `is_active` column at all.** The fabricated twelve are health-service partners in `client/src/data/partners.ts` — a different page. Acted on (§4.1); re-filed here so the *Shopping* item is not "fixed" by someone deleting working supermarket data. |
| §3.1 Blocker 3 — *"migration runner logs a head mismatch on every boot and only warns — baseline at index 0 broke `expectedMigrationHead()`"* | **DOWNGRADED — not a defect** | `runner.ts:3239` **already documents this exact case**: a database that adopts the baseline after the fact has it as its newest `applied_at` row, producing *"one cosmetic parity WARNING… It is not a failure, it self-resolves the moment any further migration is appended."* `compareMigrationState` is set-based, so `verify-prod` asks *"is anything missing"* and is unaffected. Reproduced live at boot and left alone. |

**The pattern is worth naming:** all three were *read* correctly and *concluded* wrongly, because the audit inferred behaviour from a declaration instead of running it. The `freezerMeals` one would have caused an engineer to delete a true sentence from a trust surface.

---

## 7. Verification performed

### 7.1 Gate movement

| Gate | Session start | Now |
|---|---|---|
| `npx tsc --noEmit` | **251 errors** | **94 errors** (−157) |
| `npm run typecheck:ci` | **20 regressions** | **18 regressions** (−2; the remaining 18 are **not this session's** — §7.2) |
| `npm run adoption:check` | **4 failed**, 76 passed | **0 failed · 0 notices · 81 passed** |
| `NODE_ENV=production npm run build` | pass | **pass** |
| Targeted test suites | — | **23 run, 23 pass, 0 failures** |

The adoption register's ceilings were re-recorded, and the runner confirmed **every movement was a tightening**: overlay container 12 → 11, raw `useMutation` 137 → 133, raw `<button>` **538 → 524**, `dark:` utilities 855 → 846. **No ceiling was raised and no debt absorbed** — the gate refuses to raise a ceiling except by a deliberate hand edit, and none was made.

### 7.2 The 18 remaining typecheck regressions are not mine, and I did not touch them

This is stated precisely because the honest thing and the flattering thing differ here.

- **3** are in `server/tests/test-intelligence-shopping-binding.ts`, caused by **another session's uncommitted change** to `server/intelligence/handlers/shopping-read-port.ts`, which added `getProductMatchesForUser` to the port. Verified: the method is **absent from the committed port and present in the working tree**. Repairing their test would be adapting to work in flight; `OPERATING_MANUAL` §9 forbids it.
- **15** belong to an **unbuilt explainer workstream** — `test-cbk2-intelligent-cookbook.ts`, `test-pantry1-intelligent-pantry.ts`, `test-plan2-planner-evolution.ts`. They import `generateRecipeExplanation`, `generatePantryExplanation`, `EMPTY_PANTRY_HOUSEHOLD_FACTS` and `scoreIntelligence`, **none of which exist**. None has an npm script; none is in the aggregate suite; all three were swept into the repository by a `chore: preserve current workspace` commit.

**PROD2 deliberately did not delete them**, and the reason is a finding rather than a preference. The live, wired suite `test-intelligence-food-opportunity-binding.ts:276` already carries a governance note explaining the situation and proving the generator contracts in their place:

> *"NEITHER SUITE CAN LOAD… Those are EXPLAINER specifications — a separate workstream from the opportunity generators. Until they are built, those suites cannot run and cannot be wired into `npm test`."*

So the three files are a **specification for unbuilt work**, not redundant tests, and deleting another workstream's specification to turn a gate green is precisely the trade `PRE_DEPLOYMENT` §4 warns produces *"a gate that gets switched off"*. **There is also live production code in the same state:** `server/lib/pantry-intelligence-assembler.ts` dynamically imports two of those non-existent exports at lines 177 and 216, and has **no caller** (its only inbound reference is a comment). It is reported in §8, not deleted.

### 7.3 The pool fix, proven by forcing the failure

A screenshot of a working pool proves nothing. Both directions were run:

```
  guarded (server/db.ts)        listeners=1  connectionTimeoutMillis=10000
    → emit('error')             logged: "[db] idle client error — connection retired, pool continues"
    → select 1 afterwards       process SURVIVED and pool still queries: true

  unguarded (a bare pg.Pool)    listeners=0
    → emit('error')             THREW synchronously: simulated connection drop
```

That throw is what reaches Node as an uncaught exception in the real asynchronous case, and it is what took the server down on every transient database blip before this change.

### 7.4 Test suites

23 suites run, **0 failures**, including every suite adjacent to a touched file: `restriction-safety`, `additives`, `scoring`, `extracts`, `product-dedup`, `restriction-resolver`, `substitution-rules`, `canonical-food`, `uplift`, `planner-compliance`, `household-nutrition`, `time3-household-time`, `time3-p8-t5-convergence`, `home2-home-primary-action`, `intelligence-platform`, `intelligence-conversation-gateway`, `intelligence-notice-engine`, `intelligence-context-composition`, `dec1-decision-engine`, `attn1-attention-platform`, `knowledge-evidence-gate`, and three `trust1` security suites.

**The full `npm test` was not run, and could not be.** LAUNCH1 §2.1 measured it at ~3.7 hours against a 45-minute CI timeout; this session confirms the shape of that finding (147 `&&`-chained suites, no parallelism). It remains the top engineering blocker and is **not** something PROD2 fixed — see §8.

### 7.5 Manual verification — and one honest gap

**What was verified, against the artefact a household actually receives** (`dist/`, rebuilt from clean):

| Must be ABSENT from the shipped bundle | Result |
|---|---|
| `Calm Orchard Yoga` / `example.com/rooted-nutrition` (fabricated partners) | **absent** |
| `may be affiliate links` (the disclosure over them) | **absent** |
| `Health Benefits Explorer` / `Personalised Suggestions` ("Coming soon" tabs) | **absent** |
| `Import from Cookbook` (the dead diary control) | **absent** |
| `openfoodfacts.net` (staging) — client **and** server bundle | **absent** |
| `SmartMealPlanner` (the non-existent product) — client **and** server bundle | **absent** |

| Must be PRESENT | Result |
|---|---|
| `openfoodfacts.org` (production) | **present** |
| `TheHealthyApples/1.0 (+https://…; support@…)` in `dist/index.cjs` | **present** |
| `[db] idle client error` handler in `dist/index.cjs` | **present** |
| no `list-page` chunk emitted; `shopping-list-page` survives | **confirmed** |
| server boots and serves (`GET /` → 200, `GET /api/user` → 401) | **confirmed** |

**The gap, stated plainly: no browser-driven verification was possible.** Playwright is installed and its Chromium **cannot launch in this environment** — `libglib-2.0.so.0: cannot open shared object file`. So no screenshot exists of the withdrawn `/partners` route, and **nobody has yet seen these surfaces render**. Bundle-absence proves the fabricated data cannot reach a household, which is the safety-critical half; it does **not** prove the Nutrition room looks right with two tabs, or that `/partners` lands somewhere sensible rather than on a bare 404. §11 gives the five manual steps that close this, and they should be run before release.

---

## 8. Remaining recommendations — NOT implemented

Ordered by value. Items 1–3 need no decision from anyone and are the natural next session.

**1. Companion allergen safety — the one finding with a path to physical harm, and PROD2 refused to half-build it.**
LAUNCH1 §3.5 ranks this first and PROD2's own measurement is **worse than LAUNCH1 reported**: `shared/restrictions/restriction-safety.ts` — a competent, tested matcher (tahini→sesame, groundnut oil→peanut) — has **zero production consumers anywhere in the repository**. Only two test files import it. LAUNCH1 said no file under `server/intelligence/conversation/` imports it; the truth is *no file outside `server/tests/` imports it at all.*

**Why this was not done here.** Wiring it properly requires ingredients at the filtering layer, and `DiscoveryItem` (`meal-discovery-port.ts`) carries **no ingredient field** — only `dietTypes`. Supplying them means extending the port through all three sources (personal, system, template), the handler, and post-generation validation. That is LAUNCH1's 1–2 week estimate and it is right.

**A partial filter here would be worse than none.** It would let THA imply a safety guarantee it cannot deliver, on the one path where being wrong reaches a child with an allergy. The correct move was to leave the gap fully open, measure it more precisely than the audit did, and hand it over — not to ship a filter that catches the easy cases and silently misses satay.

**2. `npm test` cannot complete in CI, and nothing this session did is visible until it can.** ~3.7 h against a 45-minute timeout; 147 `&&`-chained suites; no parallelism, reporter or isolation. LAUNCH1 §3.17 observed *"No genuine test failure was observed in the 33 suites that did run."* Parallelising the runner is the same fix as the CI timeout, and it is the precondition for every gate below meaning anything.

**3. The unbuilt explainer workstream should be finished or formally retired — by its owner.** `server/lib/pantry-intelligence-assembler.ts` is **live production code with no caller** that dynamically imports two exports which do not exist (`:177`, `:216`); three test files specify the same unbuilt API. Together they are 15 of the 18 remaining typecheck regressions. This needs a one-line decision from whoever owns PANTRY1/CBK2/PLAN2 — *build the explainers, or retire the specification* — after which the gate goes green. PROD2 refused to make that call by deletion (§7.2).

**4. `/supermarkets` is a working feature nobody can reach.** Unlike `/partners`, it is **real**: it queries `/api/supermarkets`, reads 16 genuine rows, and builds working deep links (`searchUrl + encodeURIComponent(query)`). It is routed and has **zero in-app links**. This is the clearest *"connect what exists"* item left — held only because where it belongs in navigation is a product decision, and PROD2 had just removed a neighbouring menu entry. `/quick-meal` (758 lines) is in the same state.

**5. Verified-and-carried-forward from PROD1 §8, still true:** no billing (#1), no legal/privacy/consent (#2 — the gravest item in LAUNCH1, and it holds Art. 9 special-category data), three unenforced premium limits with `requirePremium` still at zero call sites (#3), dead-end upgrade CTAs (#4), `subscriptionExpiresAt` never enforced so **a premium tier never expires** (LAUNCH1 §3.16 — genuinely a two-line fix, but it revokes access from live users and is therefore a pricing decision, not an engineering one), 15 icon-only buttons with no accessible name (#10).

**6. Not attempted, and named so they are not lost:** `households.time_zone` NULL for 95.7% of households with a `PATCH` that has zero client callers; `eaterIds` accepted by the shopping API and never sent by the client; `cookbook-recipe-cookable-now` owned by `cookbook` while the Pantry page mounts `domains={["pantry"]}`, so it could not render even if it fired; the planner page still resolving its week from `localStorage` (the 5th of TIME3's five convergences); plant diversity reading the planner instead of the diary; the `takeaway_avoided` £10 claim; 827 authored `dark:` utilities with nothing that sets the `dark` class; four surfaces still bypassing the canonical orchard owner.

---

## 9. Rollback Plan

| Step | Command |
|---|---|
| Inspect the rollback point | `git show --stat rollback/PROD2-product-completion-programme-20260718` |
| Restore committed state | `git reset --hard rollback/PROD2-product-completion-programme-20260718` |
| Restore the pre-PROD2 working tree (82 tracked files) | `git stash apply 8cc31519778310f1df430f42493cb0b022c2005c` |
| Revert only this session's files | `git checkout 8cc31519 -- tsconfig.json server/db.ts server/routes.ts server/lib/openfoodfacts-importer.ts server/services/meal-analysis.ts client/src/ docs/implementation/ux/` |
| Restore the deleted page alone | `git checkout 8cc31519 -- client/src/pages/list-page.tsx` |

**What the tag does NOT protect, stated explicitly as `ROLLBACK_PROTECTION_PROTOCOL` §3 requires.** The working tree was dirty at session start: **82 modified tracked files and 159 untracked files**. The annotated tag covers **committed state only**. The stash snapshot was taken with `git stash create` (non-destructive — the working tree was never disturbed) and covers **all 82 tracked modifications and none of the 159 untracked files**. Untracked work belonging to concurrent sessions is therefore protected by neither, was never touched by this session, and would still be destroyed by `git clean`. That is a pre-existing condition — recorded by ENGPROG1 as *43 of 137 session run files are untracked* — not one this session created.

Every change is presentation-layer, configuration, or deletion. **There is no data migration to unwind and no schema change to reverse.** Deleted files are recoverable from git history (`git rm`, not `rm`) and additionally snapshotted outside the repository at `<scratchpad>/pre-delete-snapshot/`.

### 9.1 A concurrent session committed this work mid-flight — disclosed, not hidden

During PROD2's verification phase, a **concurrent session** created commit `057102ec` — *"Pre-HOUSE_ACT1 checkpoint — capture in-flight programme work"* — which swept the working tree into a single commit. **PROD2's changes were committed by that session, before review, along with every other session's in-flight work.** The working tree went from 241 uncommitted entries to 41.

This is recorded here for three reasons:

1. **Rollback protection held.** The annotated tag still resolves to `24e37d20`, the pre-PROD2 commit, which is now the checkpoint's *parent*. `git reset --hard rollback/PROD2-product-completion-programme-20260718` therefore still unwinds PROD2 **and** the checkpoint. Every rollback step in the table above was re-verified after the commit and remains correct.
2. **Nothing was lost or altered.** All nine of PROD2's substantive changes were re-verified on disk after the commit (target, pool handler, connection timeout, `list-page` removal, `TopBar` removal, OFF endpoint, User-Agent, partners route, orphan record).
3. **It is the third instance of a pattern this repository has already recorded twice.** ENGPROG1's Audit Finding 2 named it exactly — *"`OPERATING_MANUAL` §9 forbids committing work you did not author, and one concern per commit"* — after `bc360ba5` committed 620 lines of MAT1's work unreported. PROD2 mentions it not as a complaint but because a checkpoint commit that captures four sessions at once makes `git log` a poor record of who changed what, and this report is the only place the boundary is now written down.

**PROD2 authored no commit.** The files listed in §4 are its work; anything else inside `057102ec` belongs to other sessions and was neither touched nor reviewed here.

---

## 10. Scope Lock

**In scope, and delivered:** withdrawal of the fabricated partners directory; withdrawal of two unbuilt Nutrition tabs and one dead diary control; retirement of two dead rival implementations; the pool `'error'` handler and connection timeout; the `tsconfig` target; the Open Food Facts endpoint and User-Agent; adoption-register compliance.

**Out of scope, and held — with nothing attempted:** Community (LAUNCH1: *"do not build community for launch"*); partner **integrations** (only the *removal* of a fabricated partners page was in scope); any new Intelligence Platform, capability, embedding index or model change; payments, pricing, entitlement enforcement and legal/GDPR authorship; PWA/offline, native, CoFID, reference standards; any architecture expansion (`registerRoutes`, `IStorage`).

**Three items were removed from scope during the work rather than delivered**, each on evidence, each recorded in §6 rather than quietly dropped: the "Freezer meals" false-sharing claim (the sentence is true), the Shopping-filed partners finding (re-filed against the right surface), and the migration head mismatch (already documented as intentional).

**One item was deliberately left undone despite being reachable:** the Companion allergen filter (§8.1). Refusing it is a scope decision and is reported as one.

---

## 11. Manual Verification Steps

The forced-failure and bundle checks in §7 are reproducible now. **Steps 1–3 close the browser gap of §7.5 and should be run before release.**

**Setup.** `npm run dev`, sign in.

1. **The partners withdrawal.** Open the apple/workspace menu. *Expect:* no **Partners** entry in either menu. Then visit `/partners` directly. *Expect:* the 404 room. **Must not see:** *"Calm Orchard Yoga"*, *"Sleep Well Collective"*, or any affiliate notice.
2. **The Nutrition room.** Visit `/plant-diversity`. *Expect:* exactly two tabs — **Foods** and **Nutrients** — on desktop and in the mobile workspace drawer. **Must not see:** *"Coming soon"*.
3. **The diary chooser.** Open the diary's copy-to-slot dialog. *Expect:* only pressable options. **Must not see:** a greyed *"Import from Cookbook"* with a **Soon** badge.
4. **The retired route.** Visit `/list`. *Expect:* a redirect to `/shopping-workspace` with the list intact. Then add an item to the quick list from a meal detail page and confirm it arrives in the workspace — this is the `PENDING_LIST_KEY` handoff that `list-page.tsx` used to own.
5. **Open Food Facts.** Scan or enter barcode `5000159407236`. *Expect:* "Mars" resolves. Confirm in the server log that the outbound host is `world.openfoodfacts.org`.
6. **Automated equivalents:**
   `npm run adoption:check` → **0 failed**;
   `npx tsc --noEmit` → **94 errors**;
   `NODE_ENV=production npm run build` → exit 0;
   `grep -rc "Calm Orchard Yoga" dist/public/assets/` → no match.

---

## 12. Overall assessment

PROD1 put product completion at **~72%**, held there by an absent commercial layer rather than an unfinished experience. **PROD2 does not move that number, and should not be read as claiming to.** Billing, legal, pricing and entitlement are all exactly where PROD1 left them, because all four need an owner's decision and none is an engineering task.

What changed is narrower and worth stating exactly:

- **The product no longer tells a household something untrue about the world.** Twelve invented health practitioners, recommended under a real affiliate disclosure, are gone. That is the single largest trust defect found in this session and it was invisible to every gate in the repository.
- **The product no longer advertises rooms it has not built.** Two tabs and a dead control withdrawn.
- **The server survives a database blip.** It previously did not.
- **The verification layer can see again.** Typecheck 251 → 94, adoption 4 failures → 0. ENGPROG1's top debt was that *"nothing this programme built is visible to CI while the single required check is red"*; that check is now materially closer to green, and the 18 errors left are named, owned, and not this session's to close.

**The honest summary: PROD2 removed 1,116 lines and added 119, and the product is more trustworthy for it.** The most valuable thing it did was refuse — it left the Companion allergen gap fully open rather than shipping a filter that would have implied a safety guarantee THA cannot yet make, and it withdrew three audit findings that would have had a future engineer "fix" things that were already true.

---

## 13. Provenance

- Rollback: `rollback/PROD2-product-completion-programme-20260718` → `24e37d20`; snapshot `stash@{0}` → `8cc31519`
- Governing architecture read first: `docs/architecture/README.md` (the mandatory Bootstrap), plus `ROLLBACK_PROTECTION_PROTOCOL.md`, `ENGINEERING_WORKFLOW.md` (the Compliance Checklist), `THA_UI_ARCHITECTURE.md` §17
- Backlog: `docs/investigations/platform/LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md` (§2.1 gates, §3 area findings, §5 top-20, §6 Path B withdrawal list, §7 order)
- Predecessor: `docs/implementation/production/PROD1_PRODUCT_COMPLETION_PROGRAMME.md` §8 (the 14 remaining gaps)
- Owners adopted (created by others, not by this session): `client/src/components/ui/skeleton.tsx`
- Pre-delete snapshots: `<scratchpad>/pre-delete-snapshot/` (`list-page.tsx`, `nav-bar.tsx`, both register files)
- Session record: `.engineering/session/runs/PROD2_Product_Completion_Programme.md`
