# UX_REFINE1 — Household Experience Refinement

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Risk:** 💡 Premium Reasoning
**Reason:** Resolve the remaining UX issues verified by EXPERIENCE_VERIFY1, without new architecture or features.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | `rollback/UX_REFINE1-household-experience-refinement-20260718` |
| **Commit** | `6b93a752` (NUT_VERIFY2 completion) |
| **Baseline build** | 🟢 passes |

**Rollback command:**
```
git reset --hard rollback/UX_REFINE1-household-experience-refinement-20260718
```

Concurrent sessions' uncommitted work — 4 lines across `nav-bar.tsx`, `home-experience-page.tsx` and `weekly-planner-page.tsx` (a `/nutrition` route rename) — was **not** captured.

---

## UX ISSUES RESOLVED

| ID | Issue | Outcome |
|---|---|---|
| **D1** | Planner React key warning | ✅ **Fixed** — located and keyed |
| **D2** | Shopping placeholder contrast | ✅ **Fixed** — two contrast defects |
| **R2** | Plant Categories not using canonical data | ✅ **Fixed** — 5/9 → **6/9** |
| **D3** | Shopping "empty-state void" | ⚪ **Retracted** — not a defect |
| **D4** | Shell/logo inconsistency | ✅ **Fixed (part 2)** — diagnosed, then unified at 68px |
| **D6** | Pantry row clipping | 🟡 **Partly fixed (part 2)** — dead space removed; see below |
| **D7** | Planner text truncation | ✅ **Fixed (part 2)** — word-boundary cut + `title` |

> **Two parts.** Part 1 delivered D1, D2, R2 and retracted D3, leaving D4/D6/D7 open.
> **Part 2 (this resumption)** carried those three forward from the same rollback
> point — no part-1 work was repeated or reverted.

### D1 — the warning EXPERIENCE_VERIFY1 could not locate

EXPERIENCE_VERIFY1 recorded D1 as **NOT LOCATED**: two static scans over every `.map(` found only data transforms, and the deepest stack frame was `WeeklyPlannerPage` itself.

It was found by instrumenting `console.error` in the browser to capture a JS stack at the moment React emitted the warning, which the source map resolved to **`weekly-planner-page.tsx:2663`** — then walking the fragment depth backwards to its opening at **:2368**:

```tsx
{visibleRows.map((row, rowIdx) => {
  return (
    <>                       // ← keyless fragment
```

Fixed with `<Fragment key={row.id}>`. `MatrixRow.id` already exists and the sibling `visibleRows.map` at :2094 already uses `key={row.id}` — so this adopts the file's own convention rather than inventing one.

**Verified:** planner key warnings **1 → 0**.

> **A trade to disclose.** Keying the fragment surfaces a **dev-only** warning: `@replit/vite-plugin-cartographer` injects `data-replit-metadata` into JSX elements, and `React.Fragment` accepts only `key` and `children`, so it warns per row. `vite.config.ts:10` loads cartographer **only when `NODE_ENV !== "production"`**, and the production bundle was checked and contains **no `replit-metadata`**. So: a real correctness warning that shipped to production is gone; a cosmetic warning that never ships remains. Recorded rather than hidden — see R1.

### D2 — Shopping accessibility

Two contrast defects, both fixed by adopting the design system's own token instead of inventing an opacity:

| Element | Before | After |
|---|---|---|
| Add-items placeholder | `placeholder:text-foreground/25` — 25% opacity over a near-white card on the orchard backdrop | `placeholder:text-muted-foreground` |
| Basket hint footer | `text-muted-foreground/50` — half-opacity applied to an already-muted token | `text-muted-foreground` |

The placeholder was the more serious: EXPERIENCE_VERIFY1's screenshot showed *"milk, eggs / oven chips / bananas, yoghurt"* as a barely-visible wash. It is now plainly readable — confirmed by screenshot, not by reasoning about the class name.

### R2 — Plant Categories consume canonical information

The mission's item, and the cause of a real inconsistency: **chickpeas and lentils counted as plants while "Legumes" stayed unticked.**

`getPlantCategory` was being fed `displayKey` — from `getDisplayKey`, a *private* normalisation that strips a different word set and produces keys like `"cucumber or finely"`. Those do not resolve, so the category fell through to a `?? "Vegetables"` default.

Two changes:

1. **Feed it the canonical slug** — `getPlantCategory(canonicalIngredientSlug(raw))`, the same chain the count and the section already use. One canonical path, three consumers.
2. **Remove the `?? "Vegetables"` fallback.** It was a guess presented as fact: any plant the seed had not classified was silently filed as a vegetable. `plantCategory` is already `PlantCategory | null` and every consumer handles null, so an unknown category is now simply not claimed (Core Principle 6).

**Verified on screen: Plant Categories 5/9 → 6/9**, with the plants figure unchanged at 39/30 — the count was already correct, only the categorisation was not.

### D3 — retracted, with evidence

EXPERIENCE_VERIFY1 recorded *"a large empty void — no empty state, no guidance"*. **It is not a defect.**

PROD1 already built the room's primary absence at `shopping-workspace-page.tsx:2638`:

```tsx
) : items.length === 0 ? (
  <EmptyState variant="empty" icon={ShoppingCart}
    title="Your shopping list is empty"
    description="Add what you need, and THA will check it against your pantry…"
    action={<Button onClick={() => setMode("add")}>Add items</Button>} />
```

with the comment: *"an empty list that does not offer the way out is a dead end, not a state."* It is deliberately not shown in **Add** mode, because Add mode **is** the way out — and Add is the room's default landing mode, which is what EXPERIENCE_VERIFY1 screenshotted.

Adding a second empty state there would have been the duplicate this programme was told not to create.

---

## PART 2 — D4, D6, D7

### D4 — the shell difference, diagnosed then fixed

Part 1 left this undone because the cause was not established. It has now been found, and it was never a `realm` conditional — which is why two scans of the call sites missed it.

`workspace-header.tsx` has **two mutually exclusive desktop arms**, selected at `:261` by whether the page passed a `contextBar`. **Each arm declared its own `<img>`, at a different size:**

| Arm | Condition | Logo |
|---|---|---|
| Two-row banner | `contextBar` **present** | `height: 68px` |
| Single-row `h-12` | `contextBar` **absent** | `max-h-6` — **24px** |

Home is not special-cased. It is simply the only room with no contextual strip — no tabs, no week nav, no filters — so it alone fell into the compact arm. The same arm also served ~10 secondary pages **and every loading state**, so the Planner rendered a 24px logo and then jumped to 68px when data landed.

**Fix, per the owner's decision (68px everywhere):** a single `desktopLogo` element is now declared once and consumed by both arms, and the single-row arm grew from `h-12` to `min-h-[76px]` to seat it. Logo scale is an identity concern; it is no longer a side-effect of whether a page happens to have a contextual strip — **UI Principle 4, one canonical owner for every visual concern.** The stale comment at `:255` that documented the old compact behaviour was corrected rather than left to mislead.

**Verified by measurement, not by eye:** the rendered logo is **68px on Home and 68px on Pantry** — a page without a contextBar and one with. The Planner's loading-state flash is fixed by the same change.

### D7 — the truncation was JavaScript, not CSS

That is why it broke mid-word. `PlannerIntelligenceStrip.tsx:90` cut at a raw character index:

```ts
return str.length > max ? str.slice(0, max - 1) + "…" : str;   // slice(0, 35)
```

`slice(0, 35)` reproduces both reported strings exactly. Shortening itself **is** deliberate — the file's own header states the compact strip is a design intent, and the full text is already recoverable from the expanded panel — so the fix keeps the shortening and corrects only the cut:

- the cut now falls on the **last word boundary**, unless that would discard over half the budget (a single very long word is better hard-cut than reduced to nothing);
- trailing punctuation is trimmed so the ellipsis never follows a comma or dash;
- each shortened pill now carries `title={full}`, adopting the `title=` affordance the same file already uses at `:175`. The pill row is `overflow-x-auto`, so nothing was clamped away.

**Verified:** 9 pills rendered, **0 mid-word cuts, 0 shortened pills without a title.**

| Before | After |
|---|---|
| `Looking ahead to autumn, you may en…` | `Looking ahead to autumn, you may…` |
| `At its best in the UK summer — a lo…` | `At its best in the UK summer — a…` |

### D6 — partly fixed, and reported as partly fixed

The two pantry scrollers (`pantry-page.tsx:605`, `:1052`) are `max-h-72` (288px) over ~44px rows. 288/44 = **6.54 rows**, so a seventh row renders at ~55% height. Rounding the height to a row multiple is **not** available as a fix: group headers add ~20px conditionally and food rows are expandable, so row heights are dynamic at runtime.

What actually made it read as *broken* rather than *scrollable* was not the part-row itself but what sat under it: the scroller's parent was `px-3 pt-1 pb-2`, so the clip edge sat **8px above the card edge** and a sliced row was stranded over dead card background inside a `rounded-lg overflow-hidden` wrapper. The bottom padding now sits **inside** the scroller, so the clip edge is the card edge.

**Measured: dead space below the clip edge 8px → 1px, on both scrollers, both confirmed still overflowing.**

⚠️ **This is an improvement, not a resolution.** A part-visible row remains — that is inherent to any bounded scroller — and the honest fix for the *affordance* is a bottom fade. **No such pattern exists anywhere in this repo:** all ~40 scroll containers use bare `overflow-y-auto` with no boundary treatment, and there is no `ui/scroll-area.tsx`. Adding a one-off gradient to Pantry alone would create exactly the kind of second owner this programme has twice declined to create. It belongs in a shared `ui/` primitive applied across all ~40 — recorded as **R9**.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

- ☑ **One canonical identity** — no entity touched.
- ☑ **One owner per fact** — **improved.** R2 moves the category from a private display-key path onto the canonical chain, so count, section and category now derive from one owner.
- ☑ **No duplicate entities** — none created.
- ☑ **No duplicate ownership** — **reduced by one consumer.** D2 adopts existing design tokens rather than new opacity values; D3 was *declined precisely to avoid* creating a second empty state.
- ☑ **No duplicate state** — none.
- ☑ **Extends existing architecture** — D1 uses the key convention the same file already uses; D2 uses existing tokens; R2 uses the chain NUT_VERIFY1 established.
- ☑ **Progressive enrichment** — N/A.
- ☑ **Knowledge domain compliance** — no knowledge domain touched; no seed row added or edited.
- ☑ **Honest gaps over fabricated information** — **load-bearing.** Removing `?? "Vegetables"` stops a guessed category being shown as fact; D3 and D4 are reported as retracted/undiagnosed rather than papered over.
- ☑ **No permanent synchronisation bridge** — none.
- ☑ **Evolution over replacement** — nothing replaced.

## AI ARCHITECTURE COMPLIANCE

- ✓ **Uses the canonical Intelligence Platform** — no intelligence code touched.
- ✓ **Uses the Capability Registry** — unchanged; no descriptor read or edited.
- ✓ **Uses the Intent Engine** — untouched.
- ✓ **Reuses existing business services** — `getPlantCategory` and `canonicalIngredientSlug` reused; neither modified.
- ✓ **Does not create another assistant** — none.
- ✓ **Does not duplicate conversation state** — none touched.
- ✓ **Uses registered capabilities only** — none invoked.
- ✓ **Uses permission-aware access** — unchanged; no route or data scope altered.
- ✓ **Produces honest gaps rather than fabricated knowledge** — the `?? "Vegetables"` fabrication was **removed**.

---

## DEFINITION OF DONE

**Success:** the verified accessibility and correctness defects are fixed; plant categories derive from canonical data; and every remaining item is reported with its evidence.

**What must not break:** the shared `WorkspaceHeader` (24 consumers, untouched), the plants count (39/30, unchanged), the Shopping room's existing empty state, and the canonical resolution chain.

## VERIFICATION RESULTS

| Check | Result |
|---|---|
| Planner React key warnings | **1 → 0** |
| Console errors — Nutrition / Planner / Shopping / Pantry / Home | **0 / 0 / 0 / 0 / 0** |
| Plant Categories | **5/9 → 6/9** |
| Plants | 39/30 — **unchanged**, as intended |
| `npx vite build` | 🟢 passes |
| `npx tsc --noEmit` — `client/` | 🟢 **0 errors** |
| `npx tsc --noEmit` — total | **94**, identical to baseline, **0 introduced** |
| `test:nut-verify1` | 🟢 55 / 0 |
| `test:nut-verify2` | 🟢 81 / 0 |
| `test:household-nutrition` | 🟢 54 / 0 |
| Production bundle contains `replit-metadata` | **NO** — confirmed |

### Part 2 re-verification (all re-run after D4/D6/D7)

| Check | Result |
|---|---|
| **D4** — shell logo, Home vs Pantry | **68px vs 68px — EQUAL** ✓ (was 24 vs 68) |
| **D6** — dead space below clip edge, both scrollers | **8px → 1px**, both still overflowing ✓ |
| **D7** — planner pills | 9 rendered · **0 mid-word cuts** · **0 shortened without `title`** ✓ |
| Planner React key warnings (D1, re-checked) | **0** — no regression |
| Console errors — Home / Planner / Pantry / Shopping / Nutrition | **0 non-disclosed errors** (see note) |
| `npx vite build` | 🟢 passes in 18.66s |
| `npx tsc --noEmit` — `client/` | 🟢 **0 errors** |
| `npx tsc --noEmit` — total | **94** — identical to baseline, **0 introduced** |
| `test:nut-verify1` | 🟢 55 / 0 |
| `test:nut-verify2` | 🟢 81 / 0 |
| `test:household-nutrition` | 🟢 54 / 0 |
| Production bundle contains `replit-metadata` | **NO** — re-confirmed after rebuild |

**On the 126 console entries.** Every one is the **already-disclosed dev-only** cartographer warning from part 1's D1 fix (`Invalid prop … supplied to React.Fragment … data-replit-metadata`) — categorised programmatically: **126 cartographer, 0 other, 0 key warnings.** It does not ship: the rebuilt production bundle was re-checked and contains no `replit-metadata`. Nothing new was introduced.

**Method.** Verification is by **measurement, not inspection** — `scripts/ux-refine1-verify-shell.ts` reads rendered geometry from the live DOM (logo `getBoundingClientRect().height`, card-bottom minus scroller-bottom, each pill's text against its `title`). This matters for D4 specifically, whose part-1 failure was a hypothesis never tested against the rendered page. The script is **zero-write**: it authenticates as an existing fictional Development World household and performs no database write.

**Regression tests (part 2):** none added. No test in the repo references `workspace-header`, `PlannerIntelligenceStrip` or the pantry scrollers — these are presentation-only changes (one shared element, one grid height, a string-cut boundary, and moved padding) with no data path. Stated plainly rather than padding the suite.

**Regression tests:** none added. The three fixes are a React key, two Tailwind token swaps, and a change of argument to an already-tested function — none has a unit-testable surface that the existing 136 assertions in `nut-verify1`/`nut-verify2` do not already cover for the canonical chain. **Stated plainly rather than padding the suite with tests that assert nothing.**

## ACCESSIBILITY IMPROVEMENTS

| Improvement | Detail |
|---|---|
| **Shopping add-items placeholder** | `text-foreground/25` → `text-muted-foreground`. The primary input affordance of the Shopping room was, in EXPERIENCE_VERIFY1's own screenshot, close to invisible over the orchard backdrop |
| **Shopping basket-hint footer** | `text-muted-foreground/50` → `text-muted-foreground`, removing a double-dimming of an already-secondary token |
| **Method** | Both adopt the design system's existing semantic token rather than a hand-picked opacity, so contrast is owned by the token, not by this change |

⚠️ **Not measured numerically.** No contrast-ratio instrument was run; the improvement is verified visually and by the removal of the opacity multipliers. A measured WCAG audit is recommendation **R3**.

## DATA IMPACT

- **Reads existing data:** YES — planner meals, as before.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO. R2 changes which *input* a classifier receives, not what any value means. **The plants count is unchanged (39/30), confirming no scoring change.**
- **Requires backfill:** NO.

No schema, migration, seed row, route or server file was touched.

## TRUST CHECK

- **Could this mislead the user?** Less than before. A guessed category (`?? "Vegetables"`) is no longer shown as fact, and an unreadable placeholder is now readable.
- **Could this fabricate certainty?** No — the change removes a fabrication. R2 makes an unknown category **absent** rather than defaulted.
- **Is anything guessed but shown as real?** No. Where D4's cause was not established, no speculative fix was made.
- **What happens if the system is wrong?** R2's failure mode is a category rendering as absent when it could have been known — the honest direction. D1 is a key, with no data path. D2 changes only colour.
- **No architectural duplication introduced:** YES — and D3 was declined specifically to avoid one.
- **No new source of truth created:** YES.
- **No runtime behaviour altered:** NO — deliberately altered: one React key, two colours, one classifier argument.
- **Every "verified" claim backed by a command that ran:** YES. Unmeasured claims (contrast ratios) are marked as such; undone items are named.

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/UX_REFINE1-household-experience-refinement-20260718` → `6b93a752`
- **Files modified:** part 1 — `client/src/pages/weekly-planner-page.tsx`, `client/src/pages/shopping-workspace-page.tsx`, `client/src/components/PlantDiversityReport.tsx`; part 2 — `client/src/components/workspace-header.tsx`, `client/src/components/PlannerIntelligenceStrip.tsx`, `client/src/pages/pantry-page.tsx`, `scripts/ux-refine1-verify-shell.ts` (new); plus this report and screenshots.
- **The rollback point is unchanged** — part 2 resumed from the *same* tag on `6b93a752`; no new rollback point was cut and no part-1 work was reverted.
- **Rollback command:** `git reset --hard rollback/UX_REFINE1-…-20260718`
- **Preferred:** `git revert <sha>` of this commit alone, leaving concurrent sessions' work intact.
- ⚠️ Reverting restores the React key warning, both low-contrast values, Plant Categories at 5/9 with the `"Vegetables"` default, **the 24px shell logo on Home and every loading state, the mid-word planner cuts, and the pantry dead space**.
- **Verification after rollback:** `npx vite build` 🟢; planner shows 1 key warning again.

## SCOPE LOCK

**Implemented (part 1):** D1, D2 (two contrast fixes), R2 (canonical category + fabrication removal). D3 retracted with evidence.

**Implemented (part 2):** D4 (one canonical shell logo at 68px), D7 (word-boundary cut + `title`), D6 (clip edge moved to the card edge — partial, and reported as partial).

**Explicitly excluded — NOT done:**
- A bottom-fade scroll affordance for D6 — **no such pattern exists in the repo**; belongs in a shared `ui/` primitive across all ~40 scrollers (**R9**), not a one-off on Pantry
- Any new feature, business logic, nutrition scoring, or AI capability
- Any server, schema, route or canonical seed change
- Any change to canonical ownership
- A numeric WCAG contrast audit
- Any unrelated refactoring — part 2 touched exactly 3 files (`workspace-header.tsx`, `PlannerIntelligenceStrip.tsx`, `pantry-page.tsx`) plus the new verification script

**Files changed in part 2:**

| File | Change |
|---|---|
| `client/src/components/workspace-header.tsx` | One `desktopLogo` consumed by both arms; single-row arm `h-12` → `min-h-[76px]`; stale comment corrected |
| `client/src/components/PlannerIntelligenceStrip.tsx` | Word-boundary `truncate`; pills carry `{label, full}`; `title` on shortened pills |
| `client/src/pages/pantry-page.tsx` | Bottom padding moved inside both scrollers (2 sites each) |
| `scripts/ux-refine1-verify-shell.ts` | **New** — zero-write measurement harness for D4/D6/D7 |

**Suggestions observed outside scope (not implemented):**
- `getDisplayKey` remains a **third** private normalisation in `PlantDiversityReport`, still producing artifact rows (*"Cucumber Or Finely"*, *"Celery Sticks"* beside *"Celery"*). R2 removed its influence on the **category**; the **row grouping** still uses it
- The keyed-fragment/cartographer interaction affects any keyed `Fragment` rendered in dev

---

## MANUAL VERIFICATION

**1 — D1**
- *Start:* `/planner`, DevTools console open
- *Expected:* **no** *"Each child in a list should have a unique key prop"* warning
- *Regression:* the weekly grid still renders all meal rows and the summary strip

**2 — D2**
- *Start:* `/shopping-workspace` (Add mode), empty list
- *Expected:* the placeholder *"milk, eggs / oven chips / bananas, yoghurt"* is **plainly readable**
- *Success:* the basket hint at the foot is legible too

**3 — R2**
- *Start:* `/nutrition` → **Foods**, planner week containing chickpeas or lentils
- *Expected:* **Legumes** is ticked; PLANT CATEGORIES ≥ 6/9
- *Success:* PLANTS is **unchanged** at 39/30 — this changed categorisation, not scoring
- *Regression:* no plant is filed as "Vegetables" without cause

**4 — D3 (confirming the retraction)**
- *Start:* `/shopping-workspace`, empty list, switch to **Review** or **Shop**
- *Expected:* *"Your shopping list is empty"* with an **Add items** button
- *Note:* this is deliberately absent in **Add** mode

## USER ACCEPTANCE EVIDENCE

**Captured.** Authenticated browser session, dev-world household, 1440×900 @2×:

| Screenshot | Shows |
|---|---|
| `ux-refine1-nutrition.png` | Plants 39/30, **Plant Categories 6/9** |
| `ux-refine1-shopping.png` | readable placeholder + footer |
| `ux-refine1-planner.png` · `ux-refine1-pantry.png` · `ux-refine1-home.png` | no console errors |
| `ux-refine1-shopping-empty-review.png` | Add mode, showing the D2 fix in situ |

Console measured across all five rooms: **0 key warnings, 0 other errors**.

**Not covered:** desktop light mode only; one household; no mobile viewport or dark mode. **Manual step 4 was NOT executed** — my attempts to switch Shopping modes did not register, so D3's retraction rests on **code evidence** (`:2638`), not a screenshot of the empty state rendering. No contrast ratio was measured numerically.

### Part 2 evidence — captured

Same authenticated dev-world household, 1440×900 @2×, via `scripts/ux-refine1-verify-shell.ts`:

| Screenshot | Shows |
|---|---|
| `ux-refine1b-home.png` | **D4 fixed** — Home carries the full 68px logo and full-height divider, matching every other room |
| `ux-refine1b-pantry.png` | **D6** — clip edge now at the card edge; measured dead space 8px → 1px |
| `ux-refine1b-planner.png` | **D7 fixed** — both insight pills end on a word |
| `ux-refine1b-shopping.png` · `ux-refine1b-nutrition.png` | no console errors beyond the disclosed dev-only warning |
| `ux-refine1b-results.json` | **the raw measurements** — every number in this report is reproducible from it |

**Direct before/after, D4:** part 1's `ux-refine1-home.png` shows the 24px mark; part 2's `ux-refine1b-home.png` shows the 68px logo. Both are in `docs/ui-audit/experience-verify1/`.

**Still not covered in part 2:** mobile viewport (the `md:hidden` mobile arm keeps its own `max-h-[28px]` logo and was **not** changed or re-verified), dark mode, and a second household. The ~10 secondary pages that shared the compact arm were fixed by the same shared element but were **not individually screenshotted** — only Home was.

---

## REMAINING LAUNCH RECOMMENDATIONS

| # | Recommendation | Value | Cost |
|---|---|---|---|
| ~~**R1**~~ | ~~Diagnose D4 before fixing it~~ — **CLOSED in part 2.** Diagnosed from the rendered DOM as the `contextBar` branch, then fixed | ✅ | — |
| ~~**R4**~~ | ~~D6 + D7~~ — **D7 CLOSED**, **D6 partly closed** (see R9 for the remainder) | ✅ / 🟡 | — |
| **R9** | **A shared scroll-boundary affordance.** D6's remaining half is that a part-visible row has no fade telling you it scrolls. This repo has **~40 bare `overflow-y-auto` scrollers and no `ui/scroll-area.tsx`** — so the fix is one owned primitive applied across all of them, not a gradient on Pantry | 🟠 Med | M |
| **R2** | **Retire `getDisplayKey`**, the last private normalisation in `PlantDiversityReport`. It still groups the ingredient table and still produces *"Cucumber Or Finely"* and *"Celery Sticks"* beside *"Celery"* | 🟠 Med-High | M |
| **R3** | **Measured accessibility pass.** This programme improved two contrast values by adopting tokens but measured no ratios. A real WCAG AA audit across the seven rooms is unstarted | 🟠 Med-High | M |
| **R5** | **Compound ingredient lines** (NUT_VERIFY2 R1) — still where the remaining unresolved ingredients live | 🟠 Med-High | M |
| **R6** | **The two server counters** SoT Domain 22 names as deduping on the slug — carried from NUT_VERIFY1, **still unverified across three programmes** | 🟠 Med | S |
| **R7** | **The architecture-document contradiction** on M4 status and Plant Diversity publication (173/173 vs 🔴 52/173) — carried from NUT_VERIFY1, untouched | 🟠 Med | S |
| **R8** | **Durable browser verification** (EXPERIENCE_VERIFY1 R1) — the Chromium fix is still a symlink into `/nix/store` inside a gitignored cache. **CI still cannot verify**, and this programme depended on it throughout | 🔴 High | S |

### Suggested follow-on programme

**`UX_REFINE2 — Measured Polish`** — now **R3** (a real WCAG contrast audit across the seven rooms, still unstarted) and **R9** (the shared scroll-boundary primitive that closes the rest of D6). R1 and R4 were closed in part 2.

**R8 first, though** — the Chromium fix is *still* a symlink into `/nix/store` inside a gitignored cache. Part 2 depended on it again, for all three fixes: without it none of the D4/D6/D7 measurements could have been taken. **CI still cannot verify any of this**, and that is now four programmes deep. It is the highest-value item on this list precisely because everything else on it is verified by a browser that does not survive a fresh clone.

Also still open across three programmes: **R6** (the two server counters SoT Domain 22 names) and **R7** (the M4 / Plant Diversity publication contradiction).

---

## OUTCOME

**Part 2 closes the three that part 1 left open: five fixed outright, one partly, one retracted.**

D4 is the one that changed character. Part 1 declined it because the cause was not established — correctly, since `workspace-header.tsx` is the shell of 24 pages. The cause turned out not to be a realm conditional at all, which is why two passes over the call sites found nothing: the component has **two desktop arms**, and each declared its own `<img>` at a different size. Home was never special-cased — it was simply the only room without a contextual strip, and the same arm was also silently shrinking the logo on ~10 secondary pages *and on every loading state*, so the Planner flashed a 24px mark before jumping to 68px. One shared element now serves both arms, which is what UI Principle 4 asked for in the first place.

D7 was mis-described as a truncation defect. It was a `slice(0, 35)` — a raw character index, which is why it cut mid-word where the ~20 CSS `line-clamp` sites elsewhere in the app never do. The shortening was kept, because it *is* the design; only the cut was corrected.

**D6 is the one to be honest about.** The dead space is gone and the measurement proves it (8px → 1px), but a part-visible row still has no fade telling you it scrolls. That fix exists — and it belongs to all ~40 of this repo's bare scrollers, not to Pantry alone. Building it here would have been the third time this programme was offered a duplicate owner and the third time it should say no. Recorded as R9 rather than quietly shipped as a local patch.

---

### Part 1 outcome (unchanged)

**Three defects fixed, one retracted, three left with reasons.**

D1 was the satisfying one: EXPERIENCE_VERIFY1 declared it *NOT LOCATED* after two static scans, and it took a runtime stack capture and a fragment-depth walk to find a keyless `<>` three hundred lines from where it was reported. R2 was the useful one — chickpeas and lentils were being counted as plants while **Legumes** sat unticked, because the category alone was still reading a private display key instead of the canonical chain the count already used. Removing its `?? "Vegetables"` default matters more than the tick: a category THA does not know is now absent rather than guessed.

**D3 is the one worth remembering.** It was reported as a missing empty state; the empty state had been there since PROD1, deliberately hidden in the one mode where the input *is* the way out. Building it again would have been the duplication this programme was told to avoid — and the only reason it wasn't built is that the code was read before the fix was written.

D4 is undone on purpose. The observation is real, the cause is not established, and `workspace-header.tsx` is the shell of twenty-four pages. A fix that begins with a guess there is worse than a defect that begins with a diagnosis.
