# PX1-W0 — Stop Misinforming the Household

**Status:** Implemented.
**Date:** 2026-07-12. **Owner:** Colin Clapson.
**Rollback:** tag `rollback/PX1-W0-stop-misinforming-the-household-20260712` (@ `b4a63af8`) · `refs/snapshots/PX1W0_ROLLBACK` (`9bd51ec` — the pre-existing dirty tree, preserved).

**Parent:** [`PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) § 10, workstream **PX1-W0**.

**Governing architecture (cited, never restated):**
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2 — §12 *never fabricate*, §14 *say what happened*, §16 *accessibility*) ·
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2 — §10, §15 *meaningful marks are named*; §17 *retire-on-introduction*) ·
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md).

---

## 1. What this workstream was for

PX1 found that **THA tells households things that are not true.** Not as an edge case —
on the first screen after login, in the most-used action in the product, and about the
one number THA exists to deliver.

W0 is the subset of PX1 that stops that. It is deliberately **not** a redesign: no new
UI, no new UX patterns, no new experience principles, no visual change to any surface
that was already telling the truth. Every finding below was closed by making the code
say what is actually happening.

**Scope discipline.** W0 implements PX1 §10's W0 table and nothing else. Where a defect
on a surface W0 touched belongs to a later workstream (W1, W2, W4, W4b), it was left
alone and is listed in § 6. Two of them are load-bearing enough to name here: the
`[BOOST-PROOF]` console logs (W4b.6) and Profile's full-page-reload Back (W4.5) were
both *read* during this work and deliberately *not* fixed.

---

## 2. Findings addressed

All seven W0 items, and the eight findings they resolve.

| PX1 § 10 | Finding | What the household was told | What they are told now |
|---|---|---|---|
| 0.1 | `fnd-px-false-empty-home` | On Home, a household with a full week planned and a full basket was told *"Nothing planned for today yet"* and *"Your list is clear."* — because all five `useQuery` calls destructured `= []` and not one read `isLoading` or `isError`. | Waiting → a skeleton. Broken → `LoadError`. Empty → the empty state, and only once that is known to be true. |
| 0.1 | `fnd-px-false-empty-dashboard` | Every visit began *"No meals yet / Add Your First Meal"*, *"No meals planned yet"*, *"No meals in your collection yet"* — the best-designed empty states in the codebase, firing falsely. | Same three-way separation. Counts render a skeleton while unknown, and `—` (not `0`) when the request failed. |
| 0.4 | `fnd-px-error-renders-as-empty` | A thrown query left `data` undefined, the `= []` default swallowed it, and the **empty state rendered**. No `ErrorBoundary` existed anywhere in `client/src`. A crash was a white screen. | `ui/load-error.tsx` and `components/error-boundary.tsx` now exist. An error can no longer *be* an empty state: they are different components with different words. |
| 0.2 | `fnd-px-basket-confirms-wrong-call` | The four basket mutations had no `onError`. Call sites fired `addToBasket(...)` **unawaited**, awaited a *separate* shopping-list POST, and toasted **that** call's success as *"Added to basket"* — so a failed basket write was **actively confirmed as a success**. | The basket write is awaited, and it owns its own feedback. If it fails, THA says so and does not write the shopping list. If the *list* write fails afterwards, THA says *that* — it no longer claims the basket failed when the basket succeeded. |
| 0.3 | `fnd-px-apple-score-inaudible` | The score was the *number of apple `<img>`s*, every one `alt=""`. Zero `aria-label`, zero `role`. To a screen reader, THA's central judgement of a food was **silence**. | `role="img"` + `aria-label` on both entry points: *"THA Score: 4 out of 5 — Good"*. |
| 0.5 | `fnd-px-clear-history-unguarded` | "Clear All" wiped every product analysis straight from an `onClick`: no confirmation, no undo, no word that it happened, no word if it failed. | The canonical `AlertDialog` asks first, naming how many analyses will go and that it cannot be undone. Success and failure are both spoken. |
| 0.6 | `fnd-px-silent-mutations` | 35 mutations with no `onError`. The household acted and was told nothing. | Every named mutation now has a failure path, through the canonical feedback owner. |
| 0.6 | `fnd-px-silent-optimistic-rollback` | The household flipped a switch, it moved, and it silently snapped back — which reads as a **broken control**, not a failure. | The rollback is unchanged; it now *says* it rolled back: *"We've put it back the way it was."* |
| 0.6 | `fnd-px-technical-errors-to-household` | `queryClient.ts:15` throws `` `${status}: ${rawBody}` ``, piped verbatim into toasts. A household saving their profile read **"Couldn't save changes / 500: Internal Server Error."** | Declared copy only. The status code goes to `console.error`, where it is useful. `useTrackedMutation` **cannot** forward `err.message` — it never receives it. |
| 0.7 | `fnd-px-persistence-model-split` | Profile is the only dirty→Save surface in THA and it has **four** independent dirty flags behind four Saves. Having learned everywhere else that THA saves as you go, the household edited two sections, pressed one Save, left — and **silently lost the other**. There was no `beforeunload` and no route guard. | The four sections declare their dirty state to one registry. Leaving — by nav, by any `Link`, by reload, by Profile's own Back — is guarded. |

---

## 3. Components adopted

W0 created **four canonical owners**, each one either mandated by UIA §17 as a concern
requiring an owner, or named in PX1 § 9 with a seed to promote. **None was designed from
scratch; every one was lifted from a pattern already proven in the codebase.**

| New owner | What it owns | Promoted from (the seed) |
|---|---|---|
| `client/src/hooks/use-tracked-mutation.ts` — **`useTrackedMutation`** | Mutation feedback. `feedback.failure` is **required** — the type will not compile without the words to say what went wrong — and the error's own message is **never** rendered. | The literal spec already existed at `shopping-workspace-page.tsx:1488–1505` (snapshot → optimistic write → rollback → a toast that *tells* the household the rollback happened). PX1 § 8 called it "the canonical feedback pattern; it exists, it works, and it is copy-pasted rather than owned." |
| `client/src/components/ui/load-error.tsx` — **`LoadError`** | Error presentation. Says what could not be loaded, what it means for their data (*nothing is lost*), and one way forward (*Try again*). | The **admin** `LoadError` at `admin-behaviour-workbench-page.tsx:270` — the only correct error presentation in the client, private to one page, invisible to the 14 household pages that needed it. |
| `client/src/components/error-boundary.tsx` — **`ErrorBoundary`** | Render-time failure. Mounted *inside* the shell in `App.tsx`, so the header and bottom nav survive: a broken surface is never one the household cannot leave. Resets on navigation. | Nothing — there was none (0 files). It renders `LoadError`, so a crash and a failed fetch speak in the same voice. |
| `client/src/hooks/use-unsaved-changes.tsx` — **`UnsavedChangesProvider` / `useUnsavedSection` / `useUnsavedChangesGuard`** | Unsaved-work guard. Sections *declare* dirty state; the page asks before letting the household leave. | Nothing — there was none (0 `beforeunload`, 0 route guards). |

**Existing canonical components adopted rather than rebuilt:**

- `ui/skeleton.tsx` — the canonical loading mark (7 importers; PX1 § 8: *"correct, already written, and barely adopted"*). Every new loading branch in W0 uses it. **No new loading vocabulary was invented** — the `Loader2`/`animate-pulse` convergence is W4.8's, not W0's.
- `ui/alert-dialog.tsx` — the canonical confirmation, for "Clear All" and for the Profile unsaved-changes prompt. W0 introduced **no** new interruption pattern and no `window.confirm`.
- `ui/card.tsx`, `ui/button.tsx` — `LoadError` composes them; it is not a tenth card surface.
- `components/AppleRating.tsx`'s `RATING_LABELS` — the score's accessible name is built by a single exported function, `appleScoreLabel()`, so the mark's **two** entry points cannot drift into describing the same score with different words.

## 4. Components retired

Per UIA §17 (*retire-on-introduction* — name the predecessor, migrate every consumer,
delete it in the same change), as `AmbientIntelligence` did.

| Retired | Replaced by | Consumers migrated |
|---|---|---|
| The **private `LoadError`** in `admin-behaviour-workbench-page.tsx:270` (and its private `AlertCircle` import) | `components/ui/load-error.tsx` | All 3 call sites in that page (`:591`, `:672`, `:1068`). Its admin-specific sentence survives as a `description` prop rather than being lost. |
| The **second THA-score sentence**. `AppleRating.tsx:85` hand-built `` `THA Score: ${n}/5 - ${label}` `` for its tooltip, while `ui/apple-rating.tsx` had no text at all. | `appleScoreLabel()`, exported from `components/AppleRating.tsx` and imported by `ui/apple-rating.tsx`. The tooltip and the accessible name are now **the same sentence from the same function**. | Both rating components; `ScoreBadge`'s 7 importers / 22 call sites inherit it for free. |

**Nothing else was retired, and that is deliberate.** The full collapse of the apple's
three names (`ui/apple-rating`, `AppleRating`, `MiniAppleRating`) and the deletion of the
`ScoreBadge` alias is **W4.12**, which PX1 explicitly says "is the same edit as 0.3."
W0 does the *accessibility* half and leaves the vocabulary shared, so W4.12 inherits a
merge instead of a divergence. `MiniAppleRating` (`KitchenToBasketVisual.tsx:5`) renders a
hard-coded `rating={5}` inside an illustration — it is decoration, and `alt=""` is
correct for decoration, so W0 leaves it silent on purpose.

---

## 5. What changed, by file

**New (4):** `hooks/use-tracked-mutation.ts` · `hooks/use-unsaved-changes.tsx` · `components/ui/load-error.tsx` · `components/error-boundary.tsx`

**Changed (18):**

| File | Change |
|---|---|
| `App.tsx` | `ErrorBoundary` around the routed page, keyed on location. |
| `pages/home-experience-page.tsx` | Per-section waiting / broken / empty. Home's Notice and Household-Score sections already honoured EXP §12 and were **not touched**. |
| `pages/dashboard.tsx` | Same, across Recent Meals, This Week's Plan, Your Collection, and the two stat counts. |
| `hooks/use-meals-summary.ts` | Exposes `isError` + `refetch`. A consumer that cannot see the failure has no choice but to render the absence. |
| `hooks/use-basket.ts` | All four mutations own their feedback; `addToBasketAsync` added so call sites can await the write they are about to claim. |
| `pages/meals-page.tsx` (×4 call sites), `components/meal-completion-dialog.tsx` | Await the basket write; only claim what actually landed. |
| `components/AppleRating.tsx`, `components/ui/apple-rating.tsx` | `role="img"` + `aria-label`; one shared sentence. |
| `pages/products-page.tsx` | `AlertDialog` on Clear All; feedback on clear/delete/settings (incl. the silent optimistic rollback). |
| `pages/profile-page.tsx` | Unsaved-changes guard + dialog; `LoadError`; stopped toasting `err.message`. |
| `pages/pantry-page.tsx`, `pages/food-diary-page.tsx`, `pages/shopping-list-page.tsx`, `components/MealUpliftPanel.tsx`, `hooks/use-learning-signals.ts`, `hooks/use-food-opportunities.ts` | Failure paths for the silent mutations. |
| `hooks/use-planner-operations.ts`, `components/templates-panel.tsx`, `pages/weekly-planner-page.tsx`, `components/share-plan-dialog.tsx`, `components/AdaptationReviewSheet.tsx` | Stopped forwarding `${status}: ${rawBody}` into household toasts. |
| `pages/admin-behaviour-workbench-page.tsx` | Adopts the canonical `LoadError`; its private one deleted. |

---

## 6. Remaining PX1 findings

**W0 closes 10 of PX1's 60 findings** (5 P0 + 5 P1). **50 remain open**, unchanged and
unstarted. They are listed here so no future reader mistakes W0 for PX1.

**All 5 P0s are closed.** The P0 row of PX1 § 5 is now empty.

**P1 — 15 of 20 remain.** Closed by W0: `fnd-px-silent-mutations`,
`fnd-px-clear-history-unguarded`, `fnd-px-silent-optimistic-rollback`,
`fnd-px-technical-errors-to-household`, `fnd-px-persistence-model-split`.
Still open — and these are the ones a household feels next:

- `fnd-px-dead-elevation` (W1.1) — **every** Button, Badge and clickable Card in THA is
  inert on hover and press. `hover-elevate` is consumed everywhere and **defined nowhere**.
- `fnd-px-invisible-destructive-controls` (W2.2) — an invisible delete sits at the end of
  every pantry row and fires on contact, with no confirmation. On the phone THA is used on.
- `fnd-px-shop-mode-row-under-nav` (W2.1) — in the supermarket, the last item on the list
  is under the nav and cannot be ticked.
- `fnd-px-dialog-no-max-height` (W1.3) · `fnd-px-fab-covers-nav` (W1.5) ·
  `fnd-px-no-empty-state-owner` (W4.8) · `fnd-px-forms-unlabelled` (W4.1) ·
  `fnd-px-icon-buttons-unnamed` (W4.2) · `fnd-px-keyboard-unreachable` (W4.2) ·
  `fnd-px-companion-not-a-dialog` (W4.2) · `fnd-px-no-route-splitting` (W3.2) ·
  `fnd-px-no-compression` (W3.1) · `fnd-px-home-fetches-whole-cookbook` (W3.3) ·
  `fnd-px-meals-invalidation-storm` (W3.3) · `fnd-px-cookbook-search-refetch` /
  `-jank` (W3.5).

**P2 — all 25 remain** (W2, W4, W4b). **P3 — all 10 remain** (W4.7, W4b, W3.4).

**The Adoption Register (PX1 § 6 / W5.1) is still not built.** W0 changed four of its
rows — Empty/Loading/Error (❌ → an owner now exists for *error*, not yet for *empty*),
Status presentation, and the Rating mark (⚠️ → named, still three names) — but the
register itself, the instrument that makes "authored-but-unadopted impossible to hide",
remains unowned. **Every W0 owner is therefore itself unregistered**, which is precisely
the failure mode PX1 § 4 describes. W5.1 is the workstream that ends it, and until it
ships these four new owners are on trust.

**Two findings W0 touched a file for and deliberately did not fix:**

- `fnd-px-debug-logs-shipped` (W4b.6) — the nine `[BOOST-PROOF]` `console.log`s still
  ship. W0 gave that flow the user-facing failure surface they were standing in for,
  which is the household-visible half; removing the logs is W4b's.
- `fnd-px-back-three-mechanisms` (W4.5) — Profile's Back still does
  `window.location.href = prev`, a full page reload. W0 routes it *through* the guard so
  it can no longer discard unsaved work in silence, but the reload itself is untouched.

**One known limit of the Profile guard, recorded rather than papered over:** the browser's
own Back button (`popstate`) is not guarded. Blocking it requires pushing a decoy history
entry, which is its own class of defect. In-app navigation, `Link`s, the bottom nav,
reload, tab-close and Profile's Back are all covered.

---

## 7. Architecture Compliance

- **Canonical ownership maintained.** W0 introduces no second owner of anything. It
  *creates* owners only for concerns UIA §17 names as requiring one and PX1 confirmed have
  none (error presentation, error boundary, mutation feedback, unsaved-changes).
- **Retire-on-introduction honoured** (UIA §17): the private admin `LoadError` and the
  duplicate score sentence were deleted **in the same change** that replaced them.
- **No new experience principles, no new UX patterns, no redesign.** Every new surface
  composes existing canonical primitives (`Card`, `Button`, `Skeleton`, `AlertDialog`).
- **EXP §12** (*never fabricate*) — an absence is now claimed only when known true.
- **EXP §14** (*say what happened*) — every mutation W0 touched says what could not be
  done, what it means for their data, and one way forward. No status code, ever.
- **EXP §16 / UIA §10, §15** (*meaningful marks are named*) — the apple score is named.
- **Intelligence architecture untouched.** No capability, binding, handler, engine or
  prompt was read or changed. W0 is client-only: `server/` is not in the diff.

### Definition of Done
- **Success:** on Home and Dashboard, a slow or failed load never renders an empty state; a
  failed basket write is never confirmed; the apple score is announced; Clear All asks
  first; Profile cannot silently lose an edit. **Verified in a real browser — see § 8.**
- **Must not break:** existing success paths and copy (unchanged where already honest);
  Home's Notice/Household-Score silence (untouched); the optimistic rollbacks in Shopping
  and Planner (behaviour preserved exactly — only their *voice* was added).
- **Manual test steps:** § 8's harness is the executable form of these.

### Product Registry Impact
- **Registry affected: NO.** W0 adds no surface, no route, no page, no dialog that is a
  *destination*, no capability, no setting, and no claim. The answer to "what is THA?" is
  unchanged: the same surfaces exist, reachable the same ways, doing the same things —
  they now tell the truth about what they are doing. The two dialogs W0 adds (Clear All
  confirm, unsaved-changes prompt) are **confirmations of existing actions**, not new
  product surfaces; PKR's Dialogs section enumerates surfaces that carry product
  knowledge, and these carry none.
- Entries created: **NONE** · updated: **NONE** · retired: **NONE**
- Any entry set to `public`/`household`: **N/A**
- Product knowledge written into a prompt, template, or fallback string: **NO**

### Data Impact
- Reads existing data: **YES** (no new reads; `use-meals-summary` exposes flags it already had)
- Writes new data: **NO** · Changes meaning of existing data: **NO** · Requires backfill: **NO**

### Trust Check
- **Could this mislead the user?** No — it is the change that stops THA misleading them.
  The one thing to watch: W0 makes failures *visible* that were previously silent, so a
  household on a flaky connection will now see toasts where they used to see nothing. That
  is the intent (EXP §14), not a regression.

---

## 8. Verification

Typecheck gate, build, repo structure, and a **behavioural** harness that drives the real
app in a real browser against a real demo household — forcing each condition the findings
describe (a failed request, an in-flight request, a destructive tap) and asserting what the
household is actually told.

| Gate | Result |
|---|---|
| `npm run typecheck:ci` | **PASS** — 168 known errors, baseline unchanged. **Zero** in `client/`. |
| `npx vite build` | **PASS** — 3.84 MB / 968 KB gzipped (unchanged; W0 adds no payload of consequence). |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** — repository structure clean. |
| Behavioural harness (Playwright, live app, demo household) | **PASS — 9 / 9.** |

The harness forces each defect's exact condition and asserts the household-visible result.
All nine passed against the running app:

| # | What was forced | What the household got | |
|---|---|---|---|
| 1 | Home, `/api/planner/full` + `/api/meals` + `/api/shopping-list` → 500 | `LoadError` rendered; *"Nothing planned for today yet"* and *"Your list is clear."* both **absent** | PASS |
| 2 | Home, the same three held in flight | skeleton rendered; neither false-empty string appeared | PASS |
| 3 | Dashboard, `/api/meals/summary` + planner → 500 | `LoadError`; *"No meals yet"* / *"No meals in your collection yet"* **absent** | PASS |
| 4 | Basket surface, real scores | every apple mark named — 3 of 3 — announcing *"THA Score: 5 out of 5 — Elite Whole Food"* | PASS |
| 5 | Cookbook, `POST /api/user-basket` → 500 | *"Couldn't add that to your basket"*; **"Added to basket" never shown** | PASS |
| 6 | Analyser, tap "Clear All" | confirmation dialog; **no `DELETE` issued** | PASS |
| 7 | …then confirm it | `DELETE` → 200 and *"Analysis history cleared"* | PASS |
| 8 | Profile, dirty a section then tap the bottom nav | navigation **held** on `/profile`; unsaved-changes dialog shown | PASS |
| 9 | …then choose "Leave without saving" | navigation released to `/home` | PASS |

Check 5 is the one that matters most: it is the exact scenario in which THA used to say
*"Added to basket"* about a basket that had just rejected the write.

**One thing the harness surfaced that W0 does not fix:** the cookbook's row actions
(including *Add to basket*) are `opacity-0 group-hover:opacity-100` — present but invisible
until hover, and therefore unreachable on a touch device. The harness has to dispatch the
click rather than perform it. That is PX1's `fnd-px-invisible-destructive-controls`
(**W2.2**), it is real, and it is recorded here rather than worked around silently.

Reproduce (chromium needs the Nix shared libraries on `LD_LIBRARY_PATH`, excluding the
glibc core — the method PDA1 established and documented in
[`docs/product/assets/screenshots/README.md`](../../product/assets/screenshots/README.md);
note also that `libstdc++`/`libcrypto`/`libicu` must be left to the system, or they shadow
node's own and node will not start):

```
AUTH_RATE_LIMIT_MODE=log_only npm run dev &      # POST /api/demo/start is 5/hour/IP (TRUST1-S5)
LD_LIBRARY_PATH=<chromium-libs> npx tsx <harness>
```

The harness itself is not committed: it drives the app, it is not part of it, and a
throwaway script kept in the tree is exactly the kind of unadopted artefact PX1 § 4 is
about. Its nine assertions are reproduced in the table above so they can be re-derived.

### A note on how this change was verified, and once nearly lost

Midway through this work an automated process ran `git stash` against the repository,
taking with it both W0's edits and **89 files of other workstreams' uncommitted work**
(CBK2, HHP3, PANTRY1 and others). Everything was recovered from the stash and re-verified;
nothing was lost. It is recorded here because it is the reason the commit was assembled
the way § 9 describes, and because a repository that carries ~90 files of uncommitted work
across half a dozen workstreams is one `git stash` away from losing all of it. That is not
a PX1 finding — it is an engineering-hygiene observation, offered once and not pressed.

---

## 9. What was committed

**Only PX1-W0.** The working tree carried, and still carries, uncommitted work belonging to
other workstreams. Three of the files W0 had to change also contained some of it —
`home-experience-page.tsx` (HHP3's Household-Health entry point), `meals-page.tsx` (CBK2's
cookbook `AmbientIntelligence`) and `pantry-page.tsx` (PANTRY1's `ingredientKey`).

Those files were committed with **W0's changes only**: the other workstreams' hunks were
separated out and left uncommitted, exactly as they were found. The commit's tree was then
type-checked **in isolation** — extracted to a clean directory and compiled on its own — to
prove W0 stands up without work it does not own. It does.

---

_Implementation PX1-W0. It changes no law and adds no principle: it is the code finally doing what [EXP §12, §14 and §16](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) always said it must. The remaining 50 findings are [PX1](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md)'s, and the register that would have prevented all 60 is still [W5.1](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md)'s._
