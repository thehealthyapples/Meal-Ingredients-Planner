# PROD1 — Product Completion Programme

**Session:** `PROD1_Product_Completion_Programme`
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `rollback/PROD1-product-completion-programme-20260718` → commit `729dcb91` (annotated)
**Dirty-tree snapshot:** `stash@{0}` → `797025208154b3` (231 files)
**Type:** Implementation. Completes the remaining product experience on the existing platform.
**Mandate:** No new architecture. No duplicate capabilities. Extend, never replace.

---

## 1. What this programme is

Two independent audits of the client produced one theme, and PROD1 is that theme's completion:

> **PX1 built the canonical state owners — `EmptyState`, `LoadError`, `Skeleton` — and rolled them out to Home, Dashboard and Profile. The six rooms in the bottom nav never adopted them.**

The consequence is the most serious product defect found: `client/src/lib/queryClient.ts` sets `retry: false`, so a single failed request leaves `data` undefined permanently. Every room then took its `= []` default, concluded it had nothing, and rendered its **empty state**. A server outage was presented to the household as *"you have nothing"*.

The worst instance is worth stating plainly, because it is the one that costs a real household something real: **a family standing in a supermarket whose `/api/shopping-list` call fails was told their shopping list was empty, and invited to type it in again.**

PROD1 creates **no component, capability, route, entity, owner, token or store**. Every fix adopts something the platform already owns.

---

## 2. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity is touched. This programme is presentation-layer only: it changes
  which already-owned component renders which already-fetched state.

☑ One owner per fact
  No fact gains a store. The one ownership question raised — "which page is
  Home?" — is settled by DEFERRING to the existing owner (App.tsx:174, "UX0 —
  Home is the default destination"), never by introducing a second answer.

☑ No duplicate entities
  None created.

☑ No duplicate ownership
  None created. The programme REMOVES duplication: ~9 hand-rolled absence and
  failure treatments across five rooms now defer to the two canonical owners
  (`ui/empty-state.tsx`, `ui/load-error.tsx`).

☑ No duplicate state
  No user state is split. No new client store, context or cache key.

☑ Extends existing architecture
  It extends PX1's canonical-states pattern to the surfaces PX1 did not reach,
  and the ErrorBoundary PX1-W0 introduced to the routes it did not cover. The
  adoption register measures the result: EmptyState 3 → 6 importers,
  LoadError 9 → 14.

☑ Progressive enrichment where appropriate
  N/A — no knowledge entity. Transactional state only; no enrichment added.

☑ Knowledge domain compliance
  N/A — no knowledge domain is introduced or extended.

☑ Honest gaps over fabricated information
  This is the programme's entire subject. It removes fabrication rather than
  adding any: a failed load previously ASSERTED an empty household, which is a
  fabricated fact about the household's own data. Core Principle 6 is the
  reason this work exists.

☑ No permanent synchronisation bridge
  None introduced.

☑ No duplicate capabilities
  No capability is registered, bound or extended. The Intelligence Platform,
  the Capability Registry and the Intent Engine are untouched.
```

### AI Architecture Compliance

**Not applicable, and deliberately so.** PROD1 touches no LLM path, registers no capability, composes no context view, and adds no Companion surface. It is presentation-layer only. The one adjacent surface — the ambient intelligence mount on the Shopping room — is rendered above the changed region and is byte-untouched.

### Experience & UI Governance

- **Experience Test** (EXPBLUE2 §15.3) — *which room is this · how should someone feel here · what is the one thing it helps them do.* Each adopted state answers all three: it names the room's own noun ("your shopping list", "your cookbook", "your pantry"), it reassures before it explains (*"Nothing has been lost"*), and it offers exactly one action (Try again / the room's own first step).
- **Honest absence** — `EmptyState`'s `variant` discriminator is used as designed. The Shopping room previously rendered *"your list is empty"* and *"no items match this filter"* identically as bare `<p>` tags; a household reading the second as the first believes it has lost its list. They are now structurally different states.
- **The 404** deliberately adopts neither `EmptyState` (a missing page is not "you have nothing yet") nor `LoadError` (whose sentence claims a failure that did not occur).
- **Adoption Register Compliance** — no building block is created, adopted-as-new, or retired; existing owners gain consumers. `npm run adoption:check` fails on four items, **all pre-existing** and none introduced here (see §8, debt 4).

---

## 3. Definition of Done

| # | Done means | Status |
|---|---|---|
| 1 | No room presents a failed load as an absence | ✅ 5/5 rooms, each proven under a forced failure |
| 2 | Genuine absences use the right `variant` and offer the next step | ✅ Shopping, Cookbook, Analyser, Pantry |
| 3 | No user-facing surface addresses the developer | ✅ 404 rewritten |
| 4 | A render throw outside the shell is recoverable | ✅ ErrorBoundary wraps the outer Suspense |
| 5 | A shared plan link unfurls as THA | ✅ verified in shipped `dist/public/index.html` |
| 6 | No household data reaches a production console | ✅ 0 `console.*` in the shipped bundle |
| 7 | No new type errors | ✅ 251 pre-existing, **0** in any touched file (§7.3) |
| 8 | Full `npm test` green | ✅ **exit 0 — 131 suites, 0 failures** |
| 9 | Every claim carries evidence | ✅ 7/7 acceptance (§7.1), screenshots (§7.4) |

---

## 4. Files changed

Measured against the session-start snapshot `797025208154b3`. Two `engineering-knowledge-*` server files appear in a naive diff against that snapshot; they belong to a **concurrent session** and are excluded — PROD1 touched no server file.

```
 client/src/pages/shopping-workspace-page.tsx | 135 ++++++++++++++++-----
 client/src/pages/meals-page.tsx              |  65 ++++++++---
 client/src/pages/not-found.tsx               |  56 +++++++--
 client/index.html                            |  43 +++++++
 client/src/pages/products-page.tsx           |  33 +++---
 client/src/pages/weekly-planner-page.tsx     |  30 +++++
 client/src/pages/pantry-page.tsx             |  46 ++++++++
 client/src/App.tsx                           |  23 ++++
 client/src/pages/food-diary-page.tsx         |  21 ++++
 vite.config.ts                               |  19 ++++
 client/src/hooks/use-meals.ts                |  10 +-
 11 files changed, 418 insertions(+), 63 deletions(-)
```

Plus `scripts/prod1-capture-product-completion.ts` and `docs/implementation/assets/prod1/` (evidence).

### 4.1 The rooms — the pair, never one alone

Each room gained the **pair**: `isError`/`refetch` destructured, `LoadError` rendered, and the error branch tested **before** any absence branch. That ordering is load-bearing: on error the item list *is* empty, so an absence branch tested first wins and lies.

| Room | What a failed load used to show | Now |
|---|---|---|
| **Shopping** | "Your shopping list is empty" + "Add items" | "We couldn't load your shopping list" + Try again |
| **Cookbook** | Nothing at all — `filteredMeals` undefined, so grid, "show more" and empty state all failed their optional chain together | "We couldn't load your cookbook" + Try again |
| **Planner** | Seven blank days — a week apparently erased | "We couldn't load your planner" + Try again |
| **Diary** | "Nothing added yet" in every slot | "We couldn't load your diary for this day" + Try again |
| **Pantry** | "No larder staples yet — try adding olive oil or pasta" **and**, in the second section, "No household items yet" — both sections read the same query | Both now name the failure + Try again (see §7.2 item 0) |

Also: the **Cookbook's empty state gained the action it never had** (it said *"try creating a new meal"* with no button — a dead end on a household's first visit), reusing the same `CreateMealDialog` control the header's primary CTA already drives. The **Analyser** adopted `EmptyState` for two absences it already told apart correctly but hand-rolled.

---

## 5. Data Impact

**None.** No schema change, no migration, no write path, no new query, no cache-key change, no change to any request the client makes. Every change is in the rendering of state already fetched, plus one build-config flag.

One exception is disclosed in full: a **verification account** was created directly in the database (`users` id 927, `households` id 561) because private-beta registration is closed (`/api/register` → 403) and `/api/demo/start` is rate-limited to 5/hour. It was created using the application's own `hashPassword`, used only to log in and drive the UI, and **deleted at §9**. It wrote no household data.

---

## 6. Trust Check

| Question | Answer |
|---|---|
| Can any change cause THA to state something untrue? | No — every change **removes** a false statement. The programme's subject is a UI that asserted an empty household when the truth was a failed request. |
| Can a household lose data? | No. No write path is touched. The new copy explicitly says *"Nothing has been lost"* — and that is true, which is why it can be said. |
| Does anything fabricate? | No. The one place fabrication was tempting — marketing copy for `og:` tags — uses THA's **canonical Vision line**, owned by `THA_EXPERIENCE_BLUEPRINT.md` §1.4 and quoted rather than re-authored. The meta description states what the app *does* and claims **no health outcome**, which matters for a health-adjacent product under Principle 6. |
| Is any household data exposed? | Less than before. 57 `console.*` calls shipped to households, including `[THA-STORE-DEBUG]` on every search and `[recipe-scan-timing]` on every recipe photograph. This repo already recorded logging that *"traced a household's recipe to their browser console"*; the lesson was written down and never generalised. It is now generalised at the build boundary. |
| Safety-critical paths? | Untouched. No restriction, allergen or `critical` attention path is modified. |

---

## 7. Verification performed

### 7.1 Acceptance — failures forced, not photographed

A screenshot of a working room proves nothing about a fix to failure handling: the room looked fine before, too. So `scripts/prod1-capture-product-completion.ts` **aborts each room's own API request** with Playwright interception and judges what the household is then shown — asserting on **rendered text**, so a component that mounted but said the wrong thing still fails.

Two assertions per room:
- `stillClaimsDataIsEmpty` — must be **false**
- `namesTheFailureAndOffersRetry` — must be **true**

```
--- failed-load acceptance, one room at a time ---
  ✓ shopping    failed-load → names the failure
  ✓ cookbook    failed-load → names the failure
  ✓ planner     failed-load → names the failure
  ✓ diary       failed-load → names the failure
  ✓ pantry      failed-load → names the failure
--- production polish ---
  ✓ not-found         dev language: gone · way home: yes
  ✓ brand logo        → /home (canonical home is /home)
  ✓ document metadata title="The Healthy Apples" og:title=set

  acceptance: 7/7 judged surfaces accepted
```

### 7.2 The capture caught four things reading the code did not

**0. Half the Pantry was still lying.** The screenshot showed an honest error card in the Food section and, directly beneath it in the same failure, *"No household items yet."* Both sections read the **same** `/api/pantry` query; only one had been fixed. A room is not fixed until every section fed by the failed read stops claiming an absence. This was invisible in the code review and obvious in the image.

**0b. The checker that missed it, and then over-corrected.** The first matcher was a list of literal strings, and *"No household items"* does not contain *"no items"*, so the Pantry passed while visibly failing. Broadening it to a shape (`no … yet` anywhere on the page) then failed the Cookbook on *"No frozen meals yet"* — which is **not** a defect: the freezer is its own `/api/freezer` query, it loaded fine, and the household genuinely has no frozen meals. Flagging it would have pushed me to "fix" a true sentence. The matcher is now scoped per room to the false claim that room would make **about its own failed data**, so unrelated sections reading unrelated successful queries are left to tell the truth. Both wrong versions are documented in the script, because they are opposite failures of the same instinct — judging a page by a global string search.

**1. The Shopping error state was unreachable exactly where it mattered.** My first fix put the `isError` branch inside the `mode !== "add"` block — and the room **defaults to `add` mode** (its `useState` initialiser returns `"add"` when no `?stage=` is present). So on a failed load the household was dropped silently into the "add items" composer, which asserts an empty list by its mere presence. The error was correct, well-worded, and invisible. A load error belongs to the **room**, not to a mode: it is now a banner across every mode, and the composer stays usable because adding items never needed the read that failed.

**2. An audit finding was a false positive, and is withdrawn.** Both audits reported that the brand logo pointed at `/dashboard` while `/home` is canonical — "two competing homes". The probe returned `null` at every route and both viewports, which is how the finding fell over: `nav-bar.tsx`'s `TopBar` is exported with **zero consumers** and never renders. The logo a household actually taps is `workspace-header.tsx:272`, and it already pointed at `/home`. **My change to the dead component was reverted rather than reported as a fix.** `TopBar` being unrendered is recorded as debt instead (§8, debt 5).

### 7.3 Build, bundle and suite

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **251 errors, all pre-existing** (252 at session start). **Zero** in any PROD1-touched file, confirmed by filename filter. |
| `NODE_ENV=production npm run build` | **exit 0** — 3,290 modules transformed |
| `console.*` in shipped client bundle | **0** (`grep` over `dist/public/assets/*.js`) |
| Shipped `dist/public/index.html` | `<title>`, description, `theme-color`, `apple-touch-icon`, `og:title`, `og:description`, `og:image`, `twitter:card` all present |
| `npm run adoption:check` | EmptyState **3 → 6** importers, LoadError **9 → 14**; 4 pre-existing failures unchanged |
| `npm test` | see §11 |

### 7.4 Screenshots

`docs/implementation/assets/prod1/` — 12 PNGs + `manifest.json` recording each judgement.

| Shot | Evidences |
|---|---|
| `shopping-failed-load.png` | The P0, fixed: *"We couldn't load your shopping list — Nothing has been lost, your list is safe… You can still add items below"* + **Try again**, above a still-usable composer |
| `cookbook/planner/diary/pantry-failed-load.png` | Each room naming its own failure instead of claiming an absence. `pantry-failed-load.png` shows **both** sections of that room reporting honestly — the image that caught the half-fix. |
| `not-found.png` | *"This door doesn't open onto anything"* + **Take me home** |
| `shopping-empty.png`, `cookbook-working.png`, `pantry-working.png` | The happy paths, unchanged |

---

## 8. Remaining product gaps

Ordered by commercial severity. **Items 1–3 are the reason this product cannot yet take money, and none of them is an engineering decision.**

| # | Gap | Severity | Why PROD1 did not do it |
|---|---|---|---|
| 1 | **There is no billing integration at all.** No payment SDK is installed; no `/api/checkout`, `/api/billing` or `/api/subscription` route exists. A user's tier can change **only** by an admin editing a dropdown (`routes.ts:7678`). Every "Upgrade to Premium" string in the product is therefore unfulfillable. | **P0** | A new capability *and* new architecture. The brief forbids both. This is the single largest revenue gap and needs a decision, not a patch. |
| 2 | **No Terms of Service, Privacy Policy or cookie notice exists**, and registration captures no consent. The app stores household dietary restrictions and health data — special-category data under UK/EU GDPR — and intends to charge. | **P0** | I will not fabricate legal text for a health-data product. This needs the business and counsel. It also blocks App Store / Play submission of the Capacitor build. |
| 3 | **Three premium limits are documented as intended but unenforced** — `routes.ts:920` (>3 meals), `:6102` (>2 planner days/week), `:3335` (analysis cap). `requirePremium` exists in `server/lib/access.ts` and is **never imported anywhere**. The flagship weekly planner is entirely free, and the analysis path calls paid third-party APIs uncapped. | **P0** | Enforcing them changes what existing free households can already do. That is a pricing decision, not an engineering one. |
| 4 | **Every upgrade CTA is a dead end** — three separate paths (`share-plan-dialog.tsx:281` → `/profile`, which has no upgrade UI at all; `templates-panel.tsx:463` plain text; `:700` a tooltip on a disabled button, invisible on touch). | High | Cannot be honestly fixed before #1 — a CTA needs somewhere to go. |
| 5 | **`nav-bar.tsx`'s `TopBar` is exported and never rendered** (zero consumers, confirmed by probe at two viewports and four routes). A whole top navigation bar, including search and logo, is dead. | Medium | Discovered while disproving a finding (§7.2). Deletion is a real change to a large component and deserves its own scoped decision, not a drive-by. The adoption register's orphan list is its natural home. |
| 6 | **Trial expiry promises something the system does not do.** `auth-page.tsx:290` says *"Create an account to save your progress"*, but the demo user is logged out and deleted (`auth.ts:523`) with no migration path; the 25% discount offer captured at `TrialBanner.tsx:93` is written to the DB and never read again. | Medium | Honest options are (a) build demo→real migration (new capability) or (b) change the copy to something true. (b) is in-scope engineering but changes a conversion surface's wording — an owner's call. Flagged rather than assumed. |
| 7 | **Premium gating has four divergent implementations** — `access.ts:16` canonical, `routes.ts:7312` reimplemented inline, and two different client derivations. `templates-panel.tsx:422` gates on a **different predicate** than the server (`routes.ts:7277`), so a free user can see a lock on a template the server would have served. | Medium | A genuine "one owner per fact" violation and good future work, but it changes access outcomes — it belongs with #3. |
| 8 | **`/quick-meal` (758 lines) and `/supermarkets` (223 lines) are routed but unreachable** — zero in-app links to either. Complete, shipped, dead features. | Medium | Linking them is a product-navigation decision (where does it belong, what does it displace). |
| 9 | **Two of four Nutrition tabs are "Coming soon"** (`plant-diversity-page.tsx:111, :151`); Diary has a permanently disabled "Import from Cookbook" option (`:273`). | Medium | Building them is new feature work. |
| 10 | **15 icon-only buttons have no accessible name**, incl. a destructive delete (`templates-panel.tsx:599`) and the share-link copy button on the growth surface. Radix tooltips supply `aria-describedby` (a description), not a name. | Medium | Genuinely in scope and cheap; deferred only for session budget. The highest-value item left that needs no decision from anyone. |
| 11 | **The Analyser has no first-run state** (`products-page.tsx:1212`) — a new household sees a search box and nothing else. | Low | Needs product copy/example queries — a content decision. |
| 12 | **`list-page.tsx` (773 lines) is fully dead** — both its routes redirect away and nothing imports it. A second shopping-list implementation that will drift. | Low | Deletion deserves its own change. |
| 13 | **251 pre-existing `tsc` errors** repo-wide. | Medium | Pre-existing; its own workstream. |
| 14 | **The DOCGOV1 filing gate is failing** and was before this session — 7 loose reports in `docs/implementation/`. `session-complete.sh` will refuse closeout. | Medium | Not PROD1's to resolve: filing another session's unreviewed report hides it from its owner. |

---

## 9. Rollback Plan

| Step | Command |
|---|---|
| Restore the exact pre-PROD1 commit | `git reset --hard rollback/PROD1-product-completion-programme-20260718` |
| Restore the pre-PROD1 working tree | `git stash apply 797025208154b3` |
| Revert only the client changes | `git checkout 797025208154b3 -- client/ vite.config.ts` |
| Verification account | **already removed** — see §11 |

Every change is presentation-layer or build-config. **There is no data migration to unwind and no schema change to reverse**, so rollback is a file operation with no residue. The one database artefact created (the verification user and household) was deleted at the end of the session and is listed in §11 so its removal is auditable rather than assumed.

---

## 10. Scope Lock

**Locked at the start of implementation, in the session run file, before any file was edited.**

**In scope:** adopting `EmptyState` and `LoadError` on the six bottom-nav rooms; the 404 page; ErrorBoundary coverage of the routes outside the shell; document metadata; production console drop.

**Out of scope, and held:** billing (#1), legal pages (#2), premium enforcement (#3), upgrade CTAs (#4). Each was found, each is reported in §8 with file:line evidence, and **none was attempted** — the first is new architecture and a new capability, the second requires legal authorship I must not fabricate, and the third and fourth are pricing decisions.

**One item was removed from scope during the work** rather than delivered: R5, the "logo points at the wrong home" fix, on discovering the finding was a false positive (§7.2). The change was reverted rather than kept as harmless-looking padding.

---

## 11. Manual Verification Steps

Reproducible by hand. The forced-failure steps are the ones that matter; the rest is confirmation.

**Setup.** `npm run dev`, sign in. (Private-beta registration is closed and `/api/demo/start` allows 5/hour, so a verification account may be needed — see §5.)

1. **The P0.** Open DevTools → Network → block `/api/shopping-list`. Reload `/shopping-workspace`.
   *Expect:* "We couldn't load your shopping list… Nothing has been lost — your list is safe" with **Try again**, above a still-usable add composer.
   *Must not see:* "Your shopping list is empty".
2. **Repeat per room:** block `/api/meals` on `/meals`; `/api/planner/full` on `/weekly-planner`; `/api/food-diary` on `/diary`; `/api/pantry` on `/pantry`. Each must name its own failure and offer Try again; none may claim an absence.
3. **Retry works.** Unblock the request, press **Try again** — the room populates without a reload.
4. **The two truths.** With a populated list on `/shopping-workspace`, apply a source filter that matches nothing. *Expect* "No items match this filter — your list still has items", visually distinct from the empty state.
5. **The wrong door.** Visit `/this-page-does-not-exist`. *Expect* "This door doesn't open onto anything" + **Take me home**. *Must not see* "Did you forget to add the page to the router?".
6. **Share preview.** `npm run build`, then confirm `dist/public/index.html` carries `<title>`, `og:title`, `og:image`, `twitter:card`. Paste a `/shared/:token` link into any unfurling client.
7. **Console silence.** In the production build, search a product and scan a barcode with DevTools open. *Expect* an empty console. In `npm run dev`, the same actions still log — the drop is production-only.
8. **Automated equivalent:** `PROD1_BASE_URL=http://localhost:5056 npx tsx scripts/prod1-capture-product-completion.ts` — exits non-zero if any surface regresses.

---

## 12. User Acceptance Evidence

**7/7 judged surfaces accepted.** Full record in `docs/implementation/assets/prod1/manifest.json`, which stores per-surface verdicts (`stillClaimsDataIsEmpty`, `namesTheFailureAndOffersRetry`, `accepted`) rather than a summary, so a reader can check each judgement rather than trust the total.

The acceptance criterion is deliberately phrased from the household's side, not the code's:

> *When THA cannot load something of mine, does it tell me so, promise me nothing is lost, and give me a way to try again — and never tell me I have nothing?*

Answered **yes** for all five rooms, each proven under its own forced failure.

**Suite result (`npm test`): exit 0 — 131 suites, 0 failures.** Run after all implementation was complete.

---

## 13. Overall product completion assessment

### By area

| Area | Assessment |
|---|---|
| **Household journeys** | **Strong.** The five primary rooms now degrade honestly. The journey-level defect — a household re-entering a shopping list they never lost — is closed and proven. |
| **House / room experiences** | **Strong.** Every room speaks in its own noun ("your pantry", "your cookbook"), consistent with the Blueprint's one-home-many-rooms model. The 404 is now part of the house rather than an exception to it. |
| **Cross-domain UX** | **Good.** The two canonical state owners are now shared across six rooms instead of ~9 private treatments. The remaining inconsistency is the four divergent premium checks (§8.7). |
| **Commercial readiness** | **Weak, and not for engineering reasons.** The share loop and metadata are fixed. But **the product cannot take money**: no billing, no legal pages, unenforced premium limits, dead-end upgrade CTAs. |
| **Production polish** | **Good.** No developer language reaches users; no household data reaches the console; error boundaries cover the acquisition and growth surfaces. |
| **Product consistency** | **Good.** EmptyState 3 → 6 importers, LoadError 9 → 14. |
| **Delight and trust** | **Materially improved.** The single largest trust defect — THA asserting a false fact about a household's own data — is removed at its source. |

### The number

**Product completion: ~72%** — where 100% is "a household can sign up, pay, and use the product end to end without meeting an unfinished edge".

The **experience** is well past that line: the rooms are complete, coherent, honest under failure, and hold to a genuinely unusual standard of non-fabrication. Weighing experience alone I would put it near 90%.

It is held to ~72% by the **commercial layer**, and the shortfall is one shape: **the product is finished up to the point where money changes hands, and absent after it.** No billing, no terms, no privacy policy, unenforced limits, and four upgrade buttons that lead nowhere. None of that is a polish gap that another engineering session closes — item 1 is a new capability, item 2 needs counsel, item 3 is a pricing decision.

**The honest summary: this is a nearly-complete product experience wrapped around an absent commercial model.** PROD1 finished what the brief allowed to be finished — the experience — and has documented, with file:line evidence, exactly what is left and who has to decide it.

The highest-value work that needs **no decision from anyone** is §8 item 10 (15 missing accessible names, one on a destructive action). Everything above it on the list is waiting on an owner, not an engineer.

---

## 14. Provenance

- Rollback: `rollback/PROD1-product-completion-programme-20260718` → `729dcb91`; snapshot `stash@{0}` → `797025208154b3`
- Governing architecture read first: `docs/architecture/README.md` (the mandatory Bootstrap), plus `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md` §17, `THA_EXPERIENCE_BLUEPRINT.md`, `ARCHITECTURE_PRINCIPLES.md`
- Owners adopted (created by PX1, not by this session): `client/src/components/ui/empty-state.tsx`, `client/src/components/ui/load-error.tsx`, `client/src/components/error-boundary.tsx`
- Evidence: `docs/implementation/assets/prod1/` (12 screenshots + `manifest.json`)
- Harness: `scripts/prod1-capture-product-completion.ts`
- Session record: `.engineering/session/runs/PROD1_Product_Completion_Programme.md`
