# PX1-W5 — Platform Experience Governance & Adoption Register

**Status:** Implemented.
**Date:** 2026-07-13. **Owner:** Colin Clapson.
**Rollback:** tag `rollback/PX1-W5-platform-experience-governance-and-adoption-register-20260713` (@ `eb9296e7`, the PX1-W4b commit) · `refs/snapshots/PX1W5_ROLLBACK` (`48ae777d` — the pre-existing dirty tree, 108 files, preserved).

**Parent:** [`PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md`](./PX1_PLATFORM_EXPERIENCE_DISCOVERY_AND_ARCHITECTURE.md) § 10, workstream **PX1-W5** ("Make this audit unrepeatable").
**Predecessors:** [`PX1W0`](./PX1W0_STOP_MISINFORMING_THE_HOUSEHOLD.md) · [`PX1W1`](./PX1W1_MAKE_THE_PRODUCT_RESPOND.md) · [`PX1W2`](./PX1W2_MAKE_THE_PHONE_WORK.md) · [`PX1W3`](./PX1W3_MAKE_THE_PRODUCT_FEEL_INSTANT.md) · [`PX1W4`](./PX1W4_PLATFORM_EXPERIENCE_CONVERGENCE.md) · [`PX1W4B`](./PX1W4B_PLATFORM_EXPERIENCE_TONE_AND_POLISH.md) — all complete.

**Governing architecture (cited, never restated):**
[`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2 — **§ 17**, which mandates this register and every rule it enforces) ·
[`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2) ·
[`ENGINEERING_WORKFLOW.md`](../../architecture/ENGINEERING_WORKFLOW.md) ·
[`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](../../architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) (Rules KC8, KC12, KC14) ·
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md).

**The register itself:** [`ADOPTION_REGISTER.md`](./ADOPTION_REGISTER.md) (generated) ← `adoption-register.json` (source of truth).

---

## 1. What this workstream was for

PX1's thesis, in one line: **THA's experience defects are not defects of knowledge. They are
defects of adoption.** Nearly every canonical owner the audit looked for already existed and
was already correct — and the platform had authored those foundations, never adopted them,
and never retired what they replaced. `hover-elevate` was consumed by every control in the
product and **defined nowhere**. `prefersReducedMotion()` had **zero consumers**.
`PageHeader.tsx` was a complete, well-built successor to `WorkspaceHeader` with **zero
importers**, sitting live-looking in the tree for the next workstream to adopt *instead of*
the real owner.

UIA § 17 already named that failure state and already mandated the countermeasure:

> *"**The adoption register.** Every canonical building block carries a visible register: what
> it owns, which surfaces have adopted it, which are exempt and why. **Authored-but-unadopted
> must be impossible to hide.**"*

**That register had never been built.** For as long as it did not exist, that sentence was the
only rule in THA's governing architecture with **no owner and no way to check it** — and its
absence is the mechanism by which all sixty of PX1's findings survived. W0–W4b closed 54 of
them and created **fifteen new canonical owners between them, every one unregistered**, which
is precisely the failure mode PX1 § 4 describes. Each of those six workstreams ends with the
same sentence: *"the register that would have prevented all 60 is still W5's."*

W5 is that register. It is deliberately **not** a redesign, and it adds no law: every rule it
enforces belongs to UIA § 17. What it adds is the instrument that makes UIA § 17 *checkable* —
and, for the first time, a gate that **fails the build** when a foundation is authored and not
adopted, when a rival implementation appears, or when a retired predecessor comes back.

**Scope discipline.** W5 implements PX1 § 10's W5 table (5.1–5.3) and nothing else. It closes
none of PX1's 60 findings — **54 of 60 remain closed and 6 remain open, exactly as W4b left
them.** What it changes is that those six can no longer be lost, and that the next one cannot
be created in silence.

---

## 2. What was built

| PX1 § 10 | Item | What exists now |
|---|---|---|
| 5.1 | **Stand up the Adoption Register** | [`docs/implementation/ux/ADOPTION_REGISTER.md`](./ADOPTION_REGISTER.md) — **36 concerns · 20 retired predecessors · 10 exemptions · 8 outstanding migrations · 5 orphans**: every canonical Platform Experience owner, what it owns, its status, which surfaces are exempt and why, which predecessors are retired, and which migrations remain and to whom. It lives *beside the implementation* because UIA § 17 says it must ("it is operational, not architectural"). It is **generated** from `adoption-register.json`, which is its single source of truth. |
| 5.2 | **Add an Adoption Register Impact line to the Definition of Done** | `ENGINEERING_WORKFLOW.md` gains an **Adoption Register Impact** section (the eighth mandatory section of every implementation document), an **ADOPTION REGISTER COMPLIANCE** block, and **Completion Gate item 4**. A new building block cannot now ship without a register entry and a named predecessor. Indexed from `docs/architecture/README.md`'s Compliance section, so it is reachable by anyone actually following the workflow. |
| 5.3 | **Enforce the register mechanically** | `scripts/ci/adoption-register-gate.ts` (`check` · `record` · `measure`), wired as `npm run adoption:check` and into **`release:check`**. It fails when a canonical owner has 0 importers, when a rival count rises, when a retired predecessor returns, when a new orphan appears, or when the document drifts from its data. |

### The four rules the gate enforces

1. **ADOPTION.** Every canonical owner is imported by at least its declared floor. **An owner
   with 0 importers fails the build** — this is the `PageHeader.tsx` case, made impossible.
2. **RIVALS.** Every rival count is a **ceiling**. A count that *rises* fails. A competing
   implementation cannot enter THA without someone raising the ceiling **in the register, by
   hand, with a reason** — which is exactly what *"future work cannot introduce competing
   implementations without explicit ownership"* has to mean if it is to mean anything.
   A count that *falls* is reported so the ratchet tightens.
3. **RETIRED.** Every retired predecessor stays retired: **zero occurrences in code, forever.**
4. **ORPHANS.** Every module with 0 importers is a **known, named, owned** orphan. A *new* one
   fails. Dead code cannot appear in silence.

This is the same shape as the repository's existing `typecheck:ci` gate — a recorded baseline
that may fall and may never rise — and it is modelled on it deliberately, including its
`check` / `record` verbs.

### Two design decisions that make the difference between a gate and a nuisance

**Comments are not code.** UIA § 17's retire-on-introduction rule *requires* a workstream to
name the predecessor it deleted, so THA's codebase is full of comments like
`// Predecessor: BadAppleWarningModal — deleted in this change, not deprecated`. Every one of
the "retired" names in § 4 of the register appears somewhere in a comment. **A gate that
matched raw text would fail on the very evidence that proves compliance** — and would teach
engineers to stop writing the record down. The gate strips comments and matches code only;
this is verified (§ 6, negative test 5).

**The document declares; the gate measures.** The first version of the register baked live
adoption counts into the generated Markdown — and it was wrong: *any* commit that added a
`<Card>` import would have broken CI until someone re-ran `record`. That is unacceptable
friction, and friction is how gates get bypassed. **There are now no adoption counts in the
document at all.** A count in prose is a count that rots: correct the day it is typed, wrong
by the next commit, and a register carrying stale numbers teaches its readers not to trust it.
The counts are measured on every run and printed by `adoption:check`. The two figures that
*are* frozen (the `dark:` census, the `ToastAction` census) are **dated**, and the gate
re-measures them and raises a *notice* — never a failure — the moment they move (PKCA Rule
KC14: for a self-describing record, currency *is* the evidence standard).

---

## 3. The six recorded migrations — reviewed, and what actually happened

PX1-W4 § 6 recorded six migrations as *"owners established, migrations continuing"*, and W4b
carried all six forward unchanged. **None of the six closes by documentation, and the register
does not pretend otherwise.** What it completes is their **governance half**: every one now has
a named owner, a rival population capped so it cannot grow, and a **named human accountable for
the deferral**. A migration nobody owns is a migration that does not happen.

| # | Finding | What the register does with it |
|---|---|---|
| 1 | `fnd-px-no-meal-card-owner` | `MealCard`/`MealThumbnail` registered as the owner; `PlannerMealCard` recorded as an **exemption with a reason** (it owns the thumbnail-*less* planner-cell face — a different object, and `MealCard`'s seed, not its rival). Remaining render sites deferred, owned, migrate as touched. |
| 2 | `fnd-px-food-row-no-owner` | **Split into two concerns, because it was always two.** The *quantity string* has an owner (`lib/unit-display.ts`'s `formatQty`) and is ✅ **governed** — that is the half a household could actually feel, the one where the same basket item showed a different quantity in two shopping surfaces, and it is closed. The *row layout* has ❌ **no owner** and is recorded as deferred, with the reason (a component unifying nine dense row layouts is a redesign, which PX1 forbids). |
| 3 | `fnd-px-panel-shell-half-adopted` | The **6 remaining rival panels are named** (`PlannerAssistantPanel` 1,946 LOC · `templates-panel` 835 · `MealUpliftPanel` 580 · `SmartReviewPanelContent` 558 · `CookbookMealIntelligenceStrip` 204 · `SimplyBetterChoicesPanel` 125). Enforcement is marked **`review`, not `machine`** — **no grep can honestly detect "a hand-rolled panel shell"**, and claiming otherwise would create the declared-vs-enforced gap this register exists to close (PKCA Rule KC8). |
| 4 | `fnd-px-overlay-container-arbitrary` | `Overlay` registered as the owner. `<DrawerContent>` **capped at 12** and `<SheetContent>` **capped at 3** — so the overlay population can now only fall. Deferred, owned. |
| 5 | `fnd-px-loading-vocabulary` | **Corrected — see § 4.** |
| 6 | `fnd-px-button-primitive-minority` | Raw `<button>` **capped at 538**. The enforceability half (required `variant`) was W4's; the ratchet is W5's. Deferred, owned. |

---

## 4. What the register found on the day it was built

An audit instrument that finds nothing on its first run has not been tested. This one found
four things, none of them known to any PX1 workstream. **They are recorded here rather than
quietly fixed or quietly omitted** — which is the behaviour the register exists to make normal.

### 4.1 Four live meal-library invalidations that PX1-W3 reported as zero — **fixed**

W3.3 created `invalidateMealLibrary()` as the one way to say *"the meal library changed"*,
because 32 call sites were invalidating the full-rows cache while **none** of them invalidated
the summary cache that Home and the Dashboard read. Its § 8 check 8 asserts:

> *"No direct `invalidateQueries`/`refetchQueries` on either meal key outside
> `invalidateMealLibrary` — **0** (grep, `client/src`)"*

**There were four.** W3's grep looked for the double-quoted key `["/api/meals"]`; these four are
**single-quoted** — `['/api/meals']` — and it walked straight past them:

| Site | What it does | Reachable? |
|---|---|---|
| `meals-page.tsx:2835` | freezer-eligible toggle | **No** — `toggleFreezerEligible` is defined and never invoked (dead client code; the server route exists) |
| `meals-page.tsx:3088` | save a searched product as a meal | **Yes** |
| `meals-page.tsx:3174` | save a barcode-scanned product as a meal | **Yes** |
| `shopping-list-page.tsx:560` | a basket edit that also corrects the recipe | **Yes** |

**The household-visible consequence:** save a product to your Cookbook, and Home's *Today's
Meals* and the Dashboard's *Your Collection* count could go on showing the pre-save library —
because the summary cache was never told. This is precisely the defect `invalidateMealLibrary`
was created to prevent, in the workstream that created it.

**W5 fixes it**, and this is the only code change in the workstream. It is a **pure adoption of
an owner that already exists** — no new pattern, no new component, no redesign, and strictly a
*superset* of the invalidation it replaces (the owner does the same invalidation, plus the
summary). The gate now holds it closed: the register's `retired` pattern for this concern is
anchored on the closing bracket, so it matches the **bare library keys** and deliberately does
*not* match the legitimate per-meal keys (`['/api/meals', mealId, 'nutrition']`) that W3
correctly left alone.

### 4.2 Five orphan modules — 985 LOC — **recorded, not deleted**

PX1-W4.7 deleted 26 dead files (3,940 LOC). These five survived that sweep and were known to no
workstream:

| Module | LOC | What it is |
|---|---|---|
| `pages/list-page.tsx` | 774 | **An entire page with no route.** `App.tsx` routes `/basket` and `/analyse-basket` to `shopping-list-page`; nothing routes here. 774 lines of live-looking shopping UI — `PageHeader.tsx`'s exact failure mode, still in the tree. |
| `lib/companion-delight.ts` | 71 | **All five exports unconsumed** — see below. |
| `components/illustrations/orchard-hero.tsx` | 62 | Dead illustration. |
| `components/ui/toggle.tsx` | 44 | Dead `ui/` primitive (its `toggle-group` sibling *was* deleted by W4.7; this was not). |
| `lib/whole-food-fallback.ts` | 34 | Dead module. |

**`companion-delight.ts` deserves naming precisely.** PX1 § 5 recorded that
`prefersReducedMotion()` had **0 consumers**. PX1-W1.4 answered by making `variantForInteraction()`
— *in the same file* — call it. But **nothing imports the module at all**, so W1 connected one
dead function to another. The finding it was answering was never really closed.

**The reduced-motion guarantee itself is unaffected and live**, and it is important not to
overstate this: it is delivered by W1's `@media (prefers-reduced-motion: reduce)` block and by
framer-motion's `MotionConfig reducedMotion="user"`, neither of which touches this file. What is
dead is the module, not the guarantee.

These five are recorded as **defects, not exemptions**. An exemption says *"this is fine"*; these
are not fine. They are simply **no longer hidden**, which is the register's job. Deleting them is
hygiene of W4.7's class, not governance, and W5 does not do it — every PX1 wave implemented its
own table and nothing else, and this one is not going to be the exception. The gate now fails if a
**sixth** appears.

### 4.3 `fnd-px-loading-vocabulary` was less closed than the record claimed — **corrected**

W4 and W4b both characterised this finding's remainder as legitimate: *"`Loader2` remains
legitimate as an inline button-pending mark."* **The first measurement does not support that.**
Of 180 `Loader2` usages, **140 are inside a control** (correct — a button that is saving), and
**~40 are standalone page- and section-level content placeholders** on meal-detail, food-detail,
quick-meal, shared-plan, the cookbook's three search panels and the two scan-review surfaces.

The register settles the vocabulary question the finding actually raised, by **naming which mark
owns which situation** — *`Skeleton` owns content arriving; `Loader2` owns indeterminate work
inside a control* — because a vocabulary is not "only one mark", it is **one rule for which mark**.
By that rule the 140 are exempt (recorded, with the reason) and the 40 are drift (recorded, capped,
owned). The concern is marked ⚠️ **half-adopted**, not ✅ governed.

This correction is the clearest possible argument for measuring rather than typing: the prose was
written in good faith and the code did not agree with it.

### 4.4 A pre-existing React `forwardRef` warning on the Cookbook

Found while verifying, and **proven pre-existing**: it fires on `/cookbook` at the pure PX1-W4b
commit, with none of W5's changes and none of the other workstreams' uncommitted work present
(§ 6). Not a W5 regression; not an adoption defect; recorded so it is not rediscovered (PKCA Rule
KC12) and not inflated into something it is not.

---

## 5. Canonical ownership — what the register records

**36 concerns** — the 14 UIA § 17 names by name, the 3 PX1 § 6 added, and every owner W0–W4b
created and left unregistered. Full detail is in the register; this is the shape:

- **✅ governed — 26.** Header · Navigation · Card · Dialog · Accessible-name enforcement ·
  Empty state · Error presentation · Error boundary · Unsaved-work guard · Rating mark ·
  Food quantity string · Breakpoint truth · Page shell · Back · Density ladder ·
  "The meal library changed" · Interaction feedback · Touch floor · Hover-revealed row controls ·
  Bottom-nav clearance · Motion vocabulary · Semantic surface tint · Tone · Utility class
  definitions · Brand mark · Icon set.
- **⚠️ half-adopted — 7.** Overlay · Form field · Loading state · Mutation feedback · Panel shell ·
  Meal presentation · Button / primary action. *(Each carries a capped rival population and a
  named migration owner.)*
- **❌ no owner — 3.** Food item row (layout) · **Theme / colour mode** · **Undo**.

**Two of the three ownerless concerns are new rows, carried forward from W4b § 5**, and one of them
is the register's own thesis staring back at it:

**Theme / colour mode.** THA ships a complete dark theme — a full `.dark` token set,
`darkMode: ["class"]`, and **842 `dark:` utilities** across the client — and **nothing anywhere sets
the `dark` class.** No provider, no toggle, no `prefers-color-scheme` read. Dark mode is authored,
paid for in every component, and **unreachable by every household**. It is *exactly* the
authored-but-unadopted failure PX1 § 4 describes, in the one place PX1 never looked. It is recorded
rather than fixed, because shipping a theme is a **product decision** and a new UX surface — which
this workstream is barred from introducing. It is now impossible to hide. Choosing to build it is
not the register's call.

**Undo.** Recorded as a **deliberate architectural choice, not an outstanding defect.** PX1 § 9's
rule is that a destructive action requires *a confirm **or** an undo*; THA chose the confirm, at
every destructive site (W0's products "Clear All" and the profile guard; W2's pantry and recipe
deletes) — **so the guarantee holds.** The toast-action mechanism is wired and has exactly one
consumer, the planner's *"Link to planner"* follow-up, which is a next step and not an undo. Stated
plainly so that a future audit does not rediscover "THA has no undo" and mistake a decision for a
gap.

---

## 6. Verification

| Gate | Result |
|---|---|
| `npm run adoption:check` (the new gate, against the exact tree being committed) | **PASS — 65 checks, 0 notices, 0 failures.** |
| `npm run typecheck:ci` | **PASS** — 168 known errors, baseline unchanged. **Zero** in `client/`. |
| `npm run typecheck:ci` **on the commit in isolation** (a clean tree of HEAD + W5 only, the W0 § 9 method) | **PASS** — W5 stands up without work it does not own. |
| `npx vite build` | **PASS** — **145 lazy chunks** (W3's route splitting intact). |
| `.engineering/scripts/repo-structure-verify.sh` | **PASS** — repository structure clean. |
| Built-artifact assertions | **PASS** — **0** direct bare-library-key invalidations anywhere in the shipped JS outside the owner; the owner's *paired* invalidation (full-rows **and** summary) present in the bundle. The three `["/api/meals"]` occurrences that remain are `useQuery` **reads**, which are correct. |
| Behavioural harness (Playwright + ungoogled-chromium 131, **two live servers**, real demo household, 390×844) | **PASS — 8 / 8.** |
| Adoption-gate **negative** tests (a gate that cannot fail is theatre) | **PASS — 5 / 5.** |

### The gate was tested by breaking things

A verification that only proves the gate passes has proved nothing. Each violation below was
introduced into a throwaway tree and the gate was required to catch it:

| # | Violation introduced | Gate |
|---|---|---|
| 1 | A competing raw `<button>` (rival 538 → 539) | **FAIL** — *"rival count ROSE… Adopt `ui/button.tsx`, or raise the ceiling in the register with a reason"* |
| 2 | A retired predecessor resurrected (`playSound(2)` — the food-moralising buzz) | **FAIL** — *"RETIRED predecessor is live again… (retired by PX1-W4b.1)"* |
| 3 | A new component authored and never adopted (0 importers) | **FAIL** — *"NEW authored-but-unadopted module… adopt it, delete it, or record it in the register with an owner"* |
| 4 | The generated document hand-edited so prose contradicts data | **FAIL** — *"ADOPTION_REGISTER.md has drifted… they may never disagree"* |
| 5 | A **comment** naming five retired predecessors (`BadAppleWarningModal`, `playSound`, `"Add Anyway"`, `MiniAppleRating`, `intelligenceSurface`) | **PASS** — as it must. This is the retire-on-introduction record UIA § 17 *requires*; a gate that failed here would teach engineers to stop writing it down. |

### Behavioural verification — a differential, not an assertion

Two dev servers were run side by side — `:5112` = **pure HEAD** (the PX1-W4b commit), `:5111` =
**HEAD + W5** — and driven through the same four surfaces, so the question answered is *"what did
W5 change?"* rather than *"does the app work?"*

| # | Asserted against the live app | Observed | |
|---|---|---|---|
| 1 | Demo household session established on both | HEAD `201` · W5 `201` | PASS |
| 2 | `/home` renders | HEAD 558 chars · W5 641 | PASS |
| 3 | `/dashboard` renders | HEAD 1,217 · W5 1,095 | PASS |
| 4 | `/cookbook` renders *(a file W5 changed)* | HEAD 7,003 · W5 7,003 | PASS |
| 5 | `/basket` renders *(the other file W5 changed)* | HEAD 1,833 · W5 1,833 | PASS |
| 6 | **W5 introduces no new console error** | `/home` 0→0 · `/dashboard` 0→0 · `/cookbook` **2→2** · `/basket` 0→0 | PASS |
| 7 | Home reads `/api/meals/summary` (W3.3 intact) | HEAD ✓ · W5 ✓ | PASS |
| 8 | Home never fetches the full library (W3.3 intact) | HEAD ✗ · W5 ✗ | PASS |

**Check 6 is why this was run as a differential.** The Cookbook carries a React *"Function
components cannot be given refs"* warning — and a single-server run would have reported it as a W5
regression. It is present, identically, at the pure PX1-W4b commit (§ 4.4).

**What was *not* driven end-to-end, stated rather than glossed:** the three *live* invalidation
sites (product-save, barcode-save, basket recipe-correction) each require an external dependency —
a product search, a camera, or a recipe-linked basket item — and were not exercised through the UI.
The change is a strict **superset** of the invalidation it replaces, and it is verified at source
(the gate proves zero direct library-key invalidations remain outside the owner), in the **built
artifact** (the owner's paired invalidation ships; no bare-key invalidation does), and by typecheck
in isolation. The owner itself was behaviourally verified by W3. Saying so is cheaper than implying
a coverage that does not exist.

Reproduce (the PDA1/W0–W4b chromium method; ungoogled-chromium 131 runs directly):

```
PORT=<port> AUTH_RATE_LIMIT_MODE=log_only npm run dev &
BASE=http://localhost:<port> CHROMIUM=<store>/bin/chromium npx tsx <harness>
```

The harness is not committed, for W0's reason: it drives the app, it is not part of it. Its
assertions are reproduced above so they can be re-derived. **The adoption gate, by contrast, *is*
committed** — it is not a throwaway that drives the app, it is a permanent instrument that governs
it, and that is the whole distinction.

---

## 7. Architecture Compliance

- **Canonical ownership maintained.** W5 introduces **no new owner of anything** and no second
  owner of anything. It *records* the owners that already exist. Its one code change **adopts** an
  owner (`invalidateMealLibrary`) that W3 created.
- **The register creates no law.** Every rule it enforces is UIA § 17's. It is operational, not
  architectural, and lives beside the implementation because § 17 says it must. Where a § 17 rule
  cannot honestly be machine-checked, the row says `review` rather than pretending (Rule KC8).
- **No new experience principles, no new UX patterns, no redesign.** No surface was added, removed
  or restyled. The one code change substitutes one function call for another at four sites.
- **It does not duplicate the Product Knowledge Registry**, and the boundary is recorded in both
  places: the Product Knowledge Registry owns **what THA is** (surfaces, journeys, claims, settings
  — read by the Companion); the Adoption Register owns **what THA is built from** (components,
  hooks, tokens). **No runtime code reads the Adoption Register**, and none may.
- **Intelligence architecture untouched.** No capability, binding, handler, engine or prompt was
  changed. `server/` is not in the diff.

### Definition of Done
- **Success:** every canonical Platform Experience owner is recorded with its adoption status,
  exemptions, retired predecessors and outstanding migrations; a new building block cannot ship
  without a register entry and a named predecessor; and the build **fails** if a foundation is
  authored and unadopted, a rival appears, or a retired predecessor returns. **Verified — § 6,
  including by breaking the gate five ways.**
- **Must not break:** W0's truth-telling · W1's elevation/motion/dialog owners · W2's touch floor
  and breakpoint truth · W3's splitting and payload behaviour (145 chunks; Home still reads the
  summary and never the full library — § 6 checks 7–8) · W4's convergences · W4b's tone. All
  re-exercised; none touched.
- **Manual test steps:** § 6's assertions are the executable form. `npm run adoption:check` is the
  one to run.

### Adoption Register Impact
*(The first implementation to complete the section it creates.)*
- Register affected: **YES** — this change creates it.
- Owners **created**: **NONE.** W5 authors no building block. *(Deliberate: an owner with no
  consumers fails its own gate.)*
- Owners **adopted**: `invalidateMealLibrary` (`hooks/use-meals.ts`), at 4 call sites — 3 live, 1 dead.
- Predecessors **retired**: the direct meal-library-invalidation idiom — nominally retired by
  W3.3, **actually** retired here (§ 4.1).
- Rival ceilings **raised**: **NONE.** Every ceiling is set at its measured baseline.
- Exemptions **added**: `Loader2` as an inline pending mark · per-meal query keys · `PlannerMealCard`'s
  planner-cell face · Shop mode's two `.main-safe` re-applications · `nav-bar`/`error-boundary`/
  `use-unsaved-changes`/`a11y-dev-warnings` single-consumer-by-design. Each with a reason.
- `npm run adoption:check` passes: **YES** — 65 checks, 0 failures.

### Product Registry Impact
- **Registry affected: NO.** W5 adds no surface, route, page, dialog, capability, setting or claim,
  and removes none. The answer to *"what is THA?"* is unchanged. The register it creates describes
  what THA is **built from**, which is not product knowledge and is read by no runtime code.
- Entries created: **NONE** · updated: **NONE** · retired: **NONE**
- Product knowledge written into a prompt, template, or fallback string: **NO**

### Data Impact
- Reads existing data: **NO** new reads · Writes new data: **NO** · Changes meaning of existing
  data: **NO** · Requires backfill: **NO**. The one code change invalidates a client-side cache
  key that was already being invalidated, plus a second one that should always have been.

### Trust Check
- **Could this mislead the user?** **No — it removes a case where THA already did.** A household who
  saved a product to their Cookbook could be shown a stale collection count and stale meal names on
  Home and the Dashboard, because the summary cache was never told the library had changed. It is
  now told (§ 4.1).
- **Could this fabricate certainty?** The nearest risk was the opposite of one: a register that
  *claimed* to enforce what it cannot. Every row therefore declares `machine` or `review`, and the
  three concerns no grep can honestly police say so (§ 3, item 3).

---

## 8. What was committed

**Only PX1-W5.** The working tree carried, and still carries, ~108 files of other workstreams'
uncommitted work (HHP3, CBK2, PANTRY1, PLAN2, SHOP1, NTC-P2, TRUST1 and others). Two of the files
W5 had to change also contained some of it — `meals-page.tsx` (CBK2) and `shopping-list-page.tsx`
(SHOP1).

Those files were committed with **W5's hunks only** — derived as the diff from the
`PX1W5_ROLLBACK` pre-work snapshot (which preserved the other workstreams' state) to the finished
tree — and the other workstreams' hunks were left uncommitted, exactly as they were found, exactly
as W0–W4b did. `package.json` and `docs/implementation/README.md` likewise carry other workstreams'
edits and were committed with W5's lines only.

The commit's tree was then **type-checked in isolation** — a clean tree of HEAD + W5 alone — and
the adoption gate run against it, to prove W5 stands up without work it does not own. It does.

**One number in the register is calibrated to the commit, not the working tree**, and the gate said
so: the `dark:` census is **842** in the committed code and 844 in the dirty tree (two more from
other workstreams' uncommitted work). The register describes the code it ships beside. Running
`npm run adoption:check` in the current dirty tree therefore raises exactly one **notice** — which
is the instrument being honest about the difference between what is committed and what is merely
present, on its first day of life.

---

_Implementation PX1-W5. It changes no law and adds no principle. [UIA § 17](../../architecture/THA_UI_ARCHITECTURE.md) has mandated an adoption register since the day it was written, and for that entire time it was the one rule in THA's governing architecture with no owner and no way to check it — which is why sixty findings could accumulate underneath it. The register now exists, it is generated from data rather than typed, and the build fails when a foundation is authored and never adopted. **PX1 is complete: 54 of its 60 findings are closed, the remaining 6 are recorded with owners and capped so they cannot grow, and the seventh thing PX1 asked for — that this audit never need to be repeated — is the only one that had to be built rather than fixed.**_
