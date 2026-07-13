# PX1-W4b — Platform Experience Tone & Polish

**Status:** Implemented.
**Date:** 2026-07-13. **Owner:** Colin Clapson.
**Rollback:** tag `rollback/PX1-W4b-platform-experience-tone-and-polish-20260713` (@ `7990f8a0`, the PX1-W4 commit) · `refs/snapshots/PX1W4B_ROLLBACK` (`3d187b13` — the pre-existing dirty tree, preserved).

**Parent:** [`PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) § 10, workstream **PX1-W4b** ("Tone and hygiene").
**Predecessors:** [`PX1W0`](./PX1W0_STOP_MISINFORMING_THE_HOUSEHOLD.md) · [`PX1W1`](./PX1W1_MAKE_THE_PRODUCT_RESPOND.md) · [`PX1W2`](./PX1W2_MAKE_THE_PHONE_WORK.md) · [`PX1W3`](./PX1W3_MAKE_THE_PRODUCT_FEEL_INSTANT.md) · [`PX1W4`](./PX1W4_PLATFORM_EXPERIENCE_CONVERGENCE.md) — all complete.

**Governing architecture (cited, never restated):**
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2 — §12 *never fabricate*, §13 *encouraging, never judgmental*, §14 *alarm is reserved for genuine data loss or safety*) ·
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2 — §10 *colour is never the only signal*, §17 *one owner per visual concern, retire-on-introduction*) ·
[`NK1`](../../architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md) / [`NK2`](../../architecture/NK2_THA_NUTRITION_METHODOLOGY.md) (the food facts this workstream deliberately did **not** soften) ·
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md).

---

## 1. What this workstream was for

PX1 §10 grades W4b *"tone and hygiene — continuous, not a milestone"*. It is the last of
PX1's six behavioural workstreams, and the smallest: six findings, none of them
architectural. What they have in common is that each one is THA **speaking to a household
in the wrong voice** — buzzing at their shopping, raising a red alarm over a satisfied
state, erasing a failure with a success, or leaving a developer's console trace in a
production build.

It is deliberately **not** a redesign: no new UX pattern, no new visual language, no new
experience principle, no surface added or removed. Where a canonical implementation
existed it was adopted; where a predecessor was replaced it was deleted in the same change
(UIA §17).

**The line this workstream draws, and does not cross.** THA's reason to exist is telling a
household the truth about food. Every fact stayed: the NOVA group, the additive counts, the
emulsifiers, the UPF score, the processing indicators, `RATING_LABELS`. What went is the
**judgement wrapped around them** — a 220Hz buzz, a frowning apple, "Add Anyway", "cleaner
alternative", "we would suggest treating it as an occasional rather than regular choice".
Softening a fact to be kind would be misinformation dressed as warmth, and a worse failure
than the alarm was. **EXP §13 forbids judging the household. It does not license lying to
them.**

---

## 2. Findings addressed

W4b closes **6 findings** — the complete W4b table from PX1 §10.

| PX1 §10 | Finding | What was broken | What is true now |
|---|---|---|---|
| 4b.1 | `fnd-px-sound-moralises-food` | `use-sound-effects.ts` graded the household's food aloud: a THA rating of 5 played a rising major third, 3–4 a blip, and **a rating ≤2 a 300ms 220Hz buzz** — the sound of disapproval, played at a household over food they had just chosen. Fired on every scan and every search-result selection in the Analyser. | **The sound confirms the scan landed. It does not grade the food.** One neutral tone, the same for every product, at every score. The hook takes **no rating parameter at all** (`playSound(rating)` → `playScanComplete()`) — there is no longer anything to vary the tone by, which is the point. |
| 4b.1 | *(same finding — its visual half)* | The buzz was only the audible half of the judgement. The same scan raised **`BadAppleWarningModal`**: a destructive-red `AlertTriangle` "warning" over a hand-drawn apple **with a frowning face**, offering "Find Better Option" or **"Add Anyway"** — a label that framed the household's own choice as defiance. The component's name called their shopping a bad apple. | Retired and replaced by **`UltraProcessedNoticeModal`** (§ 4). Same dialog, same data rows, same two actions, **every fact intact**. Gone: the frowning apple, the warning triangle, the destructive red, and "Add Anyway" (now "Add to list"). Red is THA's alarm token and EXP §14 reserves alarm for data loss or safety; a food's processing score is information, not a safety event. |
| 4b.1 | *(same finding — its written half)* | The "clean / cleaner" vocabulary ran through the Analyser, the Shopping List and the Workspace Analyser — *"find a cleaner alternative"*, *"Cleaner shop option"*, *"Choose this (cleaner option)"* — framing the household's own basket as **dirty**. Worse, `analyser-view-model.ts` **prescribed**: *"We would suggest treating it as an occasional rather than regular choice"*, *"before making this a regular weekly purchase"*, *"Strongly consider switching"*. | **"Less processed"** throughout — factual (processing is literally what UPF measures), neutral, and it names the thing THA actually knows. The prescriptions are gone; the facts they were wrapped around are unchanged. THA now says what is true and lets the household decide, which is EXP §13's whole sentence. |
| 4b.2 | `fnd-px-success-silent-error-loud` | Adding a food already in the pantry raised **`variant: "destructive"`** — a red alarm, in the voice THA uses for lost data — over a *satisfied* state. **And the alarm was lying.** The recogniser tested `err.body?.error`, a property that has never existed on THA's thrown errors, so it never matched: the household was told **"Couldn't add that to your pantry — it hasn't been saved"** about a food that **was** in their pantry. Confirmed by driving the flow in a browser (§ 7, check 2). | The canonical notification owner now knows a satisfied state from a failure (§ 3). Both pantry sites say **"Already in pantry" / "Already in list"**, calmly, and **truthfully**. The diary's five hand-rolled `"Failed to log item"`-style destructive toasts join the canonical policy with plain words and a way forward (EXP §14). |
| 4b.3 | `fnd-px-toast-limit-one` | `TOAST_LIMIT = 1`, and `ADD_TOAST` slices to it — so a new toast did not queue behind the previous one, it **destroyed** it. In any batched action a failure could be silently overwritten by a success landing after it: the household was told the *last* thing that happened, never the *most important*. Success toasts also had **no close button** (`toaster.tsx` gated `ToastClose` on `isError`). | `TOAST_LIMIT = 3`. Toasts **stack** and a failure survives the successes around it — verified live (§ 7, check 9: two toasts raised in succession now coexist; under the old limit only one did). **Every** toast carries a close button. The limit was also load-bearing on *other* code: pantry carried a `useRef` hack whose only reason to exist was that a toast raised in `onError` would be destroyed by the hook's — deleted with it. |
| 4b.4 | `fnd-px-ad-hoc-semantic-tints` | Semantic states were re-decided per page: raw `blue-50/blue-200` on the Shopping List, raw `amber`/`emerald` in the Pantry hub (three panels that had **drifted apart inside one file** — two forgot their dark border entirely), and the Dashboard hard-coding **`hsl(132,14%,87%)`** inline on Cards that already carried the governed `--border`. The Dashboard's chart tooltip had **no background at all** and fell back to recharts' white. | One owner. `intelligence-tokens.ts` — the governed, dark-mode-verified palette the finding itself points to — now owns **semantic surfaces** (`notice` · `info` · `positive`), keyed by **meaning, never by hue**, so the next page cannot decide amber means something else. Adopted by the Pantry hub (4 pills + 5 panels), the Shopping List (4 surfaces) and the Workspace Analyser. The Dashboard's inline literals are deleted; its chart chrome reads `hsl(var(--*))`. **`destructive` is deliberately not a tone** — there is no way to reach for alarm through this owner. |
| 4b.5 | `fnd-px-double-bottom-padding` | `.main-safe` is applied once on `<main>` (App.tsx) and gives every routed page its bottom-nav clearance for free. **Five pages re-applied it on their own root inside that `<main>`** (profile, meal-detail, quick-meal, partners, supermarkets) and the Shopping Workspace added a **`pb-20` on top** — so the bottom of some scrolls carried 160px of dead space and others none. | One owner, applied once. All six removed; the rule is now recorded at the class definition itself. **The two conditional applications in Shop mode are correct and were kept**: fullscreen is `fixed inset-0` and genuinely *escapes* `<main>`, which is exactly why W2 put `.main-safe` on its scroller. Verified live (§ 7, checks 4–5). |
| 4b.6 | `fnd-px-debug-logs-shipped` | **Eleven `[BOOST-PROOF]` `console.log` statements shipped to production** across `MealUpliftPanel` and `weekly-planner-page` — tracing a household's recipe, meal ids and cache contents to their browser console. | All eleven removed, with the scaffolding they left behind: an empty `useEffect` that existed only to log, an empty `else {}` branch, two variables (`mealsAfter`, `forkInCache`) computed only to be printed, and five orphaned `// PROOF STEP n` markers. **The finding's second half was already closed by W0**, which gave the Boost flow the user-facing failure surface these logs were standing in for — and left a comment saying so, deferring the logs to this workstream by name. |

## 3. Components adopted

Where a canonical implementation already existed, it was adopted rather than rebuilt:

| Adopted | Where it already was | What now uses it |
|---|---|---|
| **`useTrackedMutation`** (`hooks/use-tracked-mutation.ts`) | W0's canonical notification policy: feedback belongs to the mutation, `failure` is required, the raw error is never shown | The diary's five remaining hand-rolled mutations (metrics save, copy-from-planner, log item, log meal, rename entry). Extended — not rivalled — with a **`satisfied` recogniser** (below). |
| **`intelligence-tokens.ts`** | The governed, dark-mode-verified chip palette (`chipKindStyles`) — the finding names it as the palette the ad-hoc tints should have used | Extended with `semanticSurface` / `semanticText` for **surfaces**, in the same hues, keyed by meaning. Adopted by `PantryKnowledgeHub`, `shopping-list-page`, `WorkspaceAnalyserSheet` and `UltraProcessedNoticeModal`. |
| **`ui/card.tsx`'s own `--border` token** | The card border W4 converged nine rival surfaces onto | The Dashboard's two Cards, whose inline `hsl()` override is deleted rather than re-hued. |
| **`.main-safe`** (`index.css`, `<main>` in `App.tsx`) | PX1 §8 names it as *already* an exemplary convergence — "one class, one owner, applied once" | It is now actually applied once. The six duplicates are gone; the rule is recorded at the definition. |
| **`ui/toast.tsx`'s `ToastClose`** | Present, styled, and gated to errors only | Every toast. |
| **`ui/alert-dialog.tsx`** | W0's and W2's confirmations on destructive actions | Nothing new — but it is *why* 4b.3's undo is not built (§ 5). |

**New owner created** (one, for a concern PX1 §5 names as ownerless):

| New owner | What it owns | Promoted from |
|---|---|---|
| `intelligence-tokens.ts` — **`semanticSurface` / `semanticText`** | What colour a *meaning* is, on a surface: `notice` · `info` · `positive`. Not a severity scale, and **`destructive` is deliberately absent** — alarm is reserved for the one signal that is a safety event (`attentionPresentation.critical`, the restriction conflict), and there is no way to reach for it through this owner. | The chip palette's own hues, which had already answered this question correctly for chips. |

## 4. Components retired

Per UIA §17 (*retire-on-introduction* — name the predecessor, migrate every consumer,
delete it in the same change):

| Retired | Replaced by | Consumers migrated |
|---|---|---|
| **`BadAppleWarningModal.tsx`** — including its `SadAppleSVG` (a frowning apple), its destructive-red `AlertTriangle` header, and its "Add Anyway" action | **`UltraProcessedNoticeModal.tsx`** | Its one importer (`shopping-list-page`). Deleted, not deprecated. |
| **`playSound(rating)`** — the rating-keyed tone ladder (major third / blip / 220Hz buzz) | **`playScanComplete()`** — one neutral tone, no rating parameter | Both Analyser call sites. The ladder is gone from the bundle (§ 7). |
| **The `addFailureKind` `useRef` hack** (×2, `pantry-page`) — a ref that existed *only* to smuggle copy past `TOAST_LIMIT = 1` | The `satisfied` recogniser on the canonical owner | Both pantry add-mutations. Fixing the toast limit removed the reason it existed. |
| **The "clean / cleaner" vocabulary** (9 household-visible strings across 4 files) and the three prescriptive Analyser narratives | "Less processed", and the facts without the sermon | Analyser, Shopping List, Workspace Analyser, `analyser-view-model`. |
| **The raw semantic tints** — `blue-50/200`, `amber-50/200`, `emerald-50/200` on 9 surfaces + 4 pills, and the Dashboard's inline `hsl(132,14%,87%)` / white-fallback tooltip | `semanticSurface` / `semanticText` / `--border` / `hsl(var(--*))` | `PantryKnowledgeHub`, `shopping-list-page`, `WorkspaceAnalyserSheet`, `dashboard`. |
| **Six duplicate bottom-padding applications** — 5 × `.main-safe` re-applied inside `<main>`, plus `pb-20` | The single `.main-safe` on `<main>` | profile, meal-detail, quick-meal, partners, supermarkets, shopping-workspace. |
| **Eleven `[BOOST-PROOF]` console logs** + the empty effect, empty `else`, 2 log-only variables and 5 `// PROOF STEP` markers they left behind | Nothing — W0 already shipped the user-facing failure surface they were standing in for | `MealUpliftPanel`, `weekly-planner-page`. |

## 5. Recorded boundaries — what W4b deliberately did not do

Stated rather than quietly omitted, because a workstream that reports only what it finished
cannot be checked.

- **`fnd-px-toast-limit-one`'s undo is not built.** PX1 §9's rule is that a destructive
  action requires *"a confirm **or** an undo"*. W0 (products "Clear All") and W2 (pantry
  delete) gave THA's destructive household actions the **confirm**, via the canonical
  `AlertDialog` — so the guarantee holds. Stacking an undo toast on top of a confirmation
  dialog would be a *second* recovery mechanism for the same action and a **new UX
  pattern**, which this workstream is explicitly barred from introducing. The mechanism
  half of the finding — the failure being destroyed by a later success, and success toasts
  that could not be dismissed — is what was broken, and is fixed. **`ToastActionElement`
  remains typed and unused**, and that is carried forward as an open item rather than
  claimed.
- **`RATING_LABELS` is unchanged** ("Ultra-Processed" … "Elite Whole Food"). It is THA's
  core scoring vocabulary, owned by the Product Knowledge Registry's claims and by NK1/NK2
  — not a tone defect. Re-wording it is a **product-claim change**, not a polish pass, and
  would need the registry, not this workstream.
- **The Dashboard's four realm-tinted stat tiles and its chart-series palette are
  unchanged.** They are a *realm/data-viz* palette, not semantic-state tints; re-hueing
  them is a visual redesign. Their inline literals share the same light-only defect as the
  borders that were fixed, and they are carried forward (below).
- **`"cleaner_option"` — the `FulfilmentSource` value — is unchanged.** It is **persisted
  data**, not household-visible copy. Renaming it would be a data-contract change wearing a
  tone fix's clothes.

**A finding W4b discovered and did not fix.** THA ships a complete dark theme — a full
`.dark` token set in `index.css`, `darkMode: ["class"]` in `tailwind.config.ts`, and **870
`dark:` utilities across the client** — and **nothing anywhere sets the `dark` class.**
There is no theme toggle, no provider, no `prefers-color-scheme` read. **Dark mode is
authored, paid for in every component, and unreachable.** This matters to the honesty of
4b.4: half of that finding's stated impact ("the dashboard's inline border does not invert
in dark mode") is real in the code and **currently invisible to every household**, because
no household can turn dark mode on. The tints are fixed regardless — they are wrong, and
they would all break on the day a toggle lands — but the *reason* to fix them is
correctness, not a defect anyone can see today. It is exactly the authored-but-unadopted
failure PX1 §4 describes, in the one place PX1 did not look, and it belongs in the
**Adoption Register** (W5.1) as a new row rather than in this workstream's diff.

## 6. Remaining PX1 findings

**W4b closes 6 findings.** With W0's 10, W1's 9, W2's 5, W3's 8 and W4's 16, **54 of PX1's
60 are closed; 6 remain** — all six of W4's § 6 recorded partials, none of them W4b's:

- `fnd-px-no-meal-card-owner` — `MealCard` owns the contract; the remaining render sites migrate as touched.
- `fnd-px-food-row-no-owner` — the household-visible half (two surfaces disagreeing about one item's quantity) is closed via `formatQty`; a full `FoodItemRow` remains open.
- `fnd-px-panel-shell-half-adopted` — `IntelligenceCard` composes `Card`, so adopting it is now strictly a simplification for the 9 rival panels.
- `fnd-px-overlay-container-arbitrary` — `Overlay` exists with its first adoption; the rest migrate as touched.
- `fnd-px-loading-vocabulary` — the Skeleton clones are converged; `Loader2` remains legitimate as an inline pending mark.
- `fnd-px-button-primitive-minority` — required `variant` is done; the ~535 raw `<button>`s remain outside the design system.

**Carried forward as new open items** (not PX1 findings — discovered by this workstream, recorded so they are not rediscovered forever, PKCA Rule KC12):

- **Dark mode is authored and unreachable** (§ 5) — no toggle, no provider, 870 `dark:` utilities with no way to see them.
- **`ToastActionElement` is typed and unused** — THA still has no undo anywhere; every destructive action is guarded by a confirm instead.
- **The Dashboard's realm/chart palette** is still 13 module-level light-only `hsl()` constants.

**The Adoption Register (PX1 §6 / W5.1) is still not built.** W4b changed one of its rows
(Token definitions: the semantic tints now have an owner) and created one owner of its own,
unregistered — which remains precisely the failure mode PX1 §4 describes. **W5.1 is now the
only PX1 workstream not started**, and with the six behavioural workstreams complete it is
the whole of what is left.

## 7. Verification

| Gate | Result |
|---|---|
| `npm run typecheck:ci` | **PASS** — 168 known errors, baseline unchanged. **Zero** in `client/`. |
| `npx vite build` | **PASS** — 144 lazy chunks (W3's splitting intact). |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** — repository structure clean. |
| Built-artifact assertions | **PASS** — every retired name absent from `dist`: `BadAppleWarningModal`, `playSound`, `BOOST-PROOF`, `cleaner alternative`, `Add Anyway`. |
| Behavioural harness (Playwright + ungoogled-chromium 131, live app, demo household, 390×844 touch) | **PASS — 9 / 9.** |

| # | What was asserted against the live app | Observed | |
|---|---|---|---|
| 1 | Demo household session established | `POST /api/demo/start → 201` | PASS |
| 2 | Re-adding a food already in the pantry is **calm and true**, not a red alarm | "Already in pantry / This ingredient is already listed." — no `destructive` variant | PASS |
| 3 | Every visible toast carries a close button | 1/1 closable | PASS |
| 9 | Two toasts raised in succession **coexist** (a failure survives a later success) | 2 toasts stacked | PASS |
| 4 | Bottom-nav clearance applied once on `<main>` | main = 80px, page root = 0px | PASS |
| 5 | Profile does not re-apply `.main-safe` inside `<main>` | 0 descendant `.main-safe` | PASS |
| 6 | Dashboard Cards carry no hard-coded `hsl(132,14%,87%)` | 0 inline literals | PASS |
| 7 | No `[BOOST-PROOF]` logging on production surfaces | 35 console msgs, 0 BOOST-PROOF | PASS |
| 8 | Analyser offers "less processed", not "cleaner", alternatives | no moralising copy on the surface | PASS |

**Check 2 is why this workstream verified behaviourally rather than by reading the diff.**
The finding said "Already in pantry" shipped as a red alarm. Driving the flow showed
something worse and unreported: the branch **never fired at all** — it tested
`err.body?.error`, and `queryClient.ts` throws `new Error(\`${status}: ${rawBody}\`)` with
no `body` property — so a household re-adding a food they already had was told
**"Couldn't add that to your pantry — it hasn't been saved"** about a food that *was*
saved. An alarm was the reported defect; a **falsehood** was the actual one (EXP §12). It
would not have been found by reading the code, because the code reads as though it works.

Reproduce (the PDA1/W0–W4 chromium method):

```
PORT=<port> AUTH_RATE_LIMIT_MODE=log_only npm run dev &
BASE=http://localhost:<port> CHROMIUM=<store>/bin/chromium NODE_PATH=<repo>/node_modules npx tsx <harness>
```

The harness itself is not committed, for W0's reason: it drives the app, it is not part of
it. Its nine assertions are reproduced above so they can be re-derived.

## 8. Architecture Compliance

- **Canonical ownership maintained.** W4b introduces no second owner of anything. The one
  new owner (`semanticSurface`) extends the module the finding names as the existing
  governed palette, and every rival it replaces is deleted in the same change. Every other
  change adopts an owner that already existed (`useTrackedMutation`, `ui/card`,
  `.main-safe`, `ToastClose`).
- **Retire-on-introduction honoured** (UIA §17): § 4's table.
- **No new experience principles, no new UX patterns, no redesign.** No surface, route,
  page, dialog or action was added or removed. The modal keeps its structure, its data and
  both its actions; only its tone changed. 4b.3's undo was declined *because* it would have
  been a new pattern (§ 5).
- **EXP §13** — THA no longer buzzes at, frowns at, or preaches to a household about their
  food, and no longer calls their basket dirty. **EXP §14** — alarm is now reserved: a
  satisfied state speaks calmly, and a processing score is not raised in the voice used for
  lost data. **EXP §12** — the pantry's "it hasn't been saved" falsehood is gone.
  **UIA §10** — colour is still never the only signal: every tone pairs with an icon and a
  label at the call site. **UIA §17** — one owner for the semantic tint, one for the bottom
  padding.
- **Every food fact is intact** (NK1/NK2). Nothing THA knows about a product was softened,
  hidden or hedged. The scoring vocabulary (`RATING_LABELS`) is untouched.
- **Intelligence architecture untouched.** No capability, binding, handler, engine or prompt
  was changed. W4b is client-only: `server/` is not in the diff.

### Definition of Done
- **Success:** THA does not moralise about food in sound, image, or words; a satisfied state
  is not an alarm; a failure cannot be erased by a success; a semantic tint has one owner;
  bottom padding is applied once; and no debug tracing ships to a household's console.
  **Verified in a real browser — § 7.**
- **Must not break:** W0's truth-telling (strengthened — check 2 fixed a live falsehood),
  W1's toast/motion owners (viewport untouched; the toast stack is a flex column already),
  W2's Shop-mode nav clearance (its two conditional `.main-safe` applications deliberately
  kept — § 2, 4b.5), W3's splitting (144 chunks), W4's convergences (Card, `IntelligenceCard`,
  `AppleRating` untouched).
- **Manual test steps:** § 7's assertions are the executable form.

### Product Registry Impact
- **Registry affected: NO.** W4b adds no surface, route, page, capability, setting or claim,
  and removes none. `BadAppleWarningModal` → `UltraProcessedNoticeModal` is a rename of a
  component, not of a product surface: the same dialog, on the same page, reached the same
  way, showing the same facts and offering the same two actions. No registry entry names it.
  The copy changes alter *tone*, not any claim THA makes about food — every fact is
  unchanged, which is precisely what keeps this out of the registry.
- Entries created: **NONE** · updated: **NONE** · retired: **NONE**
- Product knowledge written into a prompt, template, or fallback string: **NO**

### Data Impact
- Reads existing data: **NO** new reads · Writes new data: **NO** · Changes meaning of
  existing data: **NO** · Requires backfill: **NO**. W4b is presentation-layer only. The
  `"cleaner_option"` `FulfilmentSource` — the one string in scope that *is* persisted — was
  deliberately left alone (§ 5).

### Trust Check
- **Could this mislead the user?** **No — it removes a case where THA already did.** The
  pantry told a household "it hasn't been saved" about a food that was saved; it now tells
  them the truth. Nothing else changed what THA asserts: every food fact, score, count and
  NOVA group is byte-for-byte what it was. What changed is that THA stopped adding a verdict
  to them.

---

_Implementation PX1-W4b. It changes no law and adds no principle. It is the last of PX1's
six behavioural workstreams: with it, **54 of 60 findings are closed**, the six that remain
are [W4](./PX1W4_PLATFORM_EXPERIENCE_CONVERGENCE.md) § 6's recorded migrations, and the only
workstream not started is [W5.1](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) —
the Adoption Register that would have prevented all sixty, and that this workstream added
three more rows to._
