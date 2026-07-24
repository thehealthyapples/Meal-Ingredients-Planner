# UX_REFINE1 — Household Experience Refinement

**Session ID:** `UX_REFINE1_Household_Experience_Refinement`
**Objective:** Resolve remaining UX issues verified by EXPERIENCE_VERIFY1, without new architecture or features.
**Rollback ID:** `rollback/UX_REFINE1-household-experience-refinement-20260718` → `6b93a752`
**Stage:** Complete (part 1 + part 2) — awaiting owner review
**Started:** 2026-07-18 · **Resumed & completed:** 2026-07-19

---

## Rollback

Tag on `6b93a752` (NUT_VERIFY2). Concurrent sessions' 4-line `/nutrition` rename **not** captured. Baseline build 🟢.

## Delivered

- **D1 Planner React key warning — FIXED.** EXPERIENCE_VERIFY1 declared it *NOT LOCATED* after two static scans. Found by instrumenting `console.error` in-browser to capture a JS stack, source-mapped to `weekly-planner-page.tsx:2663`, then walking fragment depth back to a keyless `<>` at **:2368** — 300 lines from where it was reported. Keyed with `row.id`, the convention the sibling map at :2094 already uses. **1 → 0 warnings.**
- **D2 Shopping accessibility — FIXED.** `placeholder:text-foreground/25` → `text-muted-foreground` (the room's primary input was near-invisible), and a double-dimmed `text-muted-foreground/50` footer. Both adopt design-system tokens rather than invented opacities.
- **R2 Plant Categories — FIXED. 5/9 → 6/9.** `getPlantCategory` was fed the private `displayKey` (producing keys like "cucumber or finely"), so chickpeas and lentils counted as plants while **Legumes** stayed unticked. Now fed the canonical slug, and the **`?? "Vegetables"` fallback removed** — an unknown category is absent, not guessed. Plants unchanged at 39/30, confirming no scoring change.

## Retracted

**D3 "Shopping empty-state void" is NOT a defect.** PROD1 built it at `shopping-workspace-page.tsx:2638` — *"Your shopping list is empty"* + **Add items** CTA — deliberately hidden in **Add** mode because Add mode *is* the way out, and Add is the default landing mode EXPERIENCE_VERIFY1 screenshotted. Building a second one would have been the duplication this programme was told to avoid.

## Delivered — part 2 (resumed 2026-07-19, same rollback point)

- **D4 shell logo — DIAGNOSED then FIXED.** Part 1 declined it for want of a cause. The cause is not a realm conditional (which is why the call-site scans missed it): `workspace-header.tsx:261` branches on `contextBar`, and **each arm declared its own `<img>`** — 68px with a contextBar, `max-h-6` (**24px**) without. Home is the only room with no contextual strip; the same arm also hit ~10 secondary pages and **every loading state** (the Planner flashed 24px → 68px). Owner chose **68px everywhere**: one `desktopLogo` consumed by both arms, single-row arm `h-12` → `min-h-[76px]`. **Measured 68px on Home and 68px on Pantry.**
- **D7 planner truncation — FIXED.** Not CSS: `PlannerIntelligenceStrip.tsx:90` was `slice(0, 35)`, a raw character index. Shortening kept (it is the design; full text is in the expanded panel), cut moved to the last word boundary, trailing punctuation trimmed, and `title={full}` added — the affordance the same file already uses at `:175`. **9 pills, 0 mid-word cuts, 0 shortened without title.**
- **D6 pantry clipping — PARTLY FIXED, reported as partial.** `max-h-72` (288px) over ~44px rows = 6.54 rows; row heights are dynamic (group headers, expandable rows) so height-rounding is not available. What made it read *broken* was the parent's `pb-2` leaving the clip edge **8px above the card edge**, stranding a sliced row over dead background. Padding moved inside the scroller: **dead space 8px → 1px, both scrollers.** The remaining half — a fade affordance — is **declined deliberately**: the repo has ~40 bare `overflow-y-auto` scrollers and no `ui/scroll-area.tsx`, so a Pantry-only gradient would create a second owner. Recorded as **R9**.

## Verification — part 2

D4 68px≡68px · D6 8px→1px · D7 0 mid-word / 0 untitled · 0 key warnings · build 🟢 18.66s · client tsc 0 · total tsc 94 unchanged · nut-verify1 55/0 · nut-verify2 81/0 · household-nutrition 54/0 · production bundle re-checked, no `replit-metadata`. The 126 console entries are **all** the disclosed dev-only cartographer warning (126 cartographer / 0 other, categorised programmatically).

Verified by **measurement, not inspection** — `scripts/ux-refine1-verify-shell.ts` (new, zero-write) reads rendered geometry from the live DOM. This matters for D4, whose part-1 failure was an untested hypothesis. Raw numbers in `docs/ui-audit/experience-verify1/ux-refine1b-results.json`.

**Not covered:** mobile arm (`md:hidden`, own `max-h-[28px]` logo) unchanged and un-reverified; dark mode; second household; the ~10 secondary pages fixed by the shared element were not individually screenshotted.

## Disclosed trade

Keying the fragment surfaces a **dev-only** warning: `cartographer` injects `data-replit-metadata` and `Fragment` accepts only `key`/`children`. `vite.config.ts:10` loads it only when `NODE_ENV !== "production"`, and the **production bundle was checked and contains no `replit-metadata`**.

## Verification

0 key warnings and 0 console errors across Nutrition/Planner/Shopping/Pantry/Home · Plant Categories 6/9 · Plants 39/30 unchanged · build 🟢 · client tsc 0 · total tsc 94 unchanged · nut-verify1 55/0 · nut-verify2 81/0 · household-nutrition 54/0. **No regression tests added** — the three fixes are a React key, two token swaps and one changed argument; stated rather than padding the suite.

## Next action

**Owner to review** `docs/implementation/experience/UX_REFINE1_HOUSEHOLD_EXPERIENCE_REFINEMENT.md`. All seven EXPERIENCE_VERIFY1 defects are now closed or reported with evidence; nothing is left silently open.

Carried gaps: manual step 4 **still not executed** (Shopping mode switches did not register, so D3's retraction rests on code evidence at `:2638`, not a screenshot). No contrast ratio measured numerically.

Recommended next: **`UX_REFINE2 — Measured Polish`** — now **R3** (a real WCAG audit, unstarted) and **R9** (the shared scroll-boundary primitive that closes the rest of D6). R1 and R4 closed in part 2.

**But R8 first.** The Chromium fix is still a symlink into `/nix/store` in a gitignored cache. Part 2 depended on it for all three fixes — without it, none of the D4/D6/D7 measurements exist. **CI still cannot verify any of this, four programmes deep.** Also still open across three programmes: R6 the two server counters SoT Domain 22 names, and R7 the M4/publication doc contradiction.
