# THA 30 Plants — Page Conversion & Health Benefits Final Design

**Status:** Investigation & Design Amendment Only (No Code Changes)
**Investigation Date:** 2026-06-17
**Rollback Identifier:** `rollback/tha-30-plants-page-design-20260617` → `f384f6a` (object `944e674`)
**Scope:** Convert the "30 Plants This Week" modal into a dedicated **Plant Diversity Report** page, and finalise Health Benefits terminology.
**Supersedes (page-conversion aspects of):** `THA_30_PLANTS_MODAL_V2*.md` series — the modal recommendations remain valid for content/language; this document changes the *container* from modal to page.

---

## SECTION 1 — EXECUTIVE SUMMARY

### What is changing

The "30 Plants This Week" experience is today a **Radix Dialog modal**
(`client/src/components/PlantDiversityExplorer.tsx`, 622 lines) opened from the
weekly planner. It has outgrown a modal: it carries a category grid, an
expandable per-plant report table, completion suggestions, and (proposed)
multi-benefit and "Broaden Your Variety" content. A modal constrains it to
`max-w-2xl` / `max-h-[88vh]` with internal scroll, fights the mobile viewport,
and cannot be linked to, bookmarked, or returned to via the back button.

It should become a **dedicated page** — the **Plant Diversity Report** — reached
by exactly the same gesture as today:

```
Planner  →  tap "30 Plants This Week" counter  →  /plant-diversity (full page)
```

### What is NOT changing

- The entry point (the `WeeklyPlantDiversityCounter` chip in the planner header).
- The underlying data model and libraries (`nutrition-variety.ts`,
  `nutrition-benefit-library.ts`, `ingredient-reuse.ts`).
- The page's *purpose*: an educational diversity report, not an editor.

### Key findings

| Question | Finding | Confidence |
|----------|---------|-----------|
| Should this be a page, not a modal? | **YES** — information density, deep-linking, mobile, back-button all favour a page | Very High (95%) |
| Can the existing component be reused as a page body? | **YES** — strip the `Dialog` shell, keep the body; ~90% reusable | High (85%) |
| Biggest engineering risk? | **Data access** — the modal is fed `weekMealsData` from planner local state; a page needs its own source of that data | High (85%) |
| Should we adopt "Health Benefits" language? | **YES** — confirmed; aligns with prior amendment and THA voice | Very High (95%) |
| Should the page support both food-first and health-first exploration? | **YES, but staged** — ship food-first (sortable), add a health-first lens later | Medium-High (80%) |
| Is `Plant \| Health Benefits \| Key Nutrients \| Meals` the right visible structure? | **YES** | High (88%) |

### Bottom line

Promote the experience to a page at `/plant-diversity`, reuse the existing
report body, resolve week-meal data access via the `PlannerProvider` context (or
a dedicated query), adopt Health Benefits language throughout, and ship sorting
as a food-first table with a clear path to a health-first lens. No code in this
investigation.

---

## SECTION 2 — PAGE ARCHITECTURE

### 2.1 Current implementation (as built)

- **Component:** `client/src/components/PlantDiversityExplorer.tsx`
  - `Dialog` / `DialogContent` shell — `max-w-2xl max-h-[88vh] flex flex-col overflow-hidden p-0` (line ~536)
  - `DialogTitle` "30 Plants This Week" (line ~545)
  - Body sub-components already exist and are page-ready:
    - `ReportSectionHeader` — count + progress (lines ~252–268)
    - `CategoryGrid` — covered categories with check marks (lines ~162–198)
    - `CategoryCompletionSuggestions` — missing categories + suggestions (lines ~200–250)
    - `PlantReportTable` — semantic `<table>` (lines ~443–482)
    - `PlantReportRow` — expandable plant row (lines ~276–441)
  - **Data builder:** `computePlantData(weekMeals)` (lines ~81–158) — pure function,
    container-agnostic, returns `{ plantRows, categoriesFound }`. This is the asset
    we keep untouched.
  - **Props:** `{ open, onClose, weekMeals: WeekMealEntry[] }`

- **Trigger:** `WeeklyPlantDiversityCounter`
  (`client/src/components/nutrition-variety-chips.tsx`, lines ~295–391); renders a
  clickable button when `onExplore` is supplied (lines ~370–380).

- **Host state:** `weekly-planner-page.tsx`
  - `plantExplorerOpen` boolean — line ~829
  - `weekMealsData: WeekMealEntry[]` memo — lines ~567–580 (built from
    `activeWeekData.days[].entries[].mealId` → `mealById`)
  - Renders `<PlantDiversityExplorer open=… onClose=… weekMeals={weekMealsData} />`
    — lines ~3943–3947

- **Routing framework:** Wouter v3.3.5, URL-based registration in
  `client/src/App.tsx` (`<Switch>`, lines ~176–208). Pages live in
  `client/src/pages/*.tsx` and are wrapped by `ProtectedRoute` (lines ~122–162),
  which provides the full app chrome (OrchardBackdrop, TopBar, SiteBanner,
  DesktopSidebar, scrollable `<main>`, MobileNav).

### 2.2 Target architecture (proposed)

```
client/src/pages/plant-diversity-page.tsx          ← NEW page (route target)
   └─ renders report body (extracted from PlantDiversityExplorer)
client/src/components/PlantDiversityReport.tsx      ← OPTIONAL: extracted body
   └─ ReportSectionHeader / CategoryGrid / CategoryCompletionSuggestions /
      PlantReportTable / PlantReportRow  (unchanged)
client/src/lib/nutrition-benefit-library.ts         ← UNCHANGED
client/src/lib/nutrition-variety.ts                 ← UNCHANGED
client/src/lib/ingredient-reuse.ts                  ← UNCHANGED
```

**Two viable refactor shapes (decision for implementation phase, not now):**

- **Option A — Body extraction (recommended).** Pull the body of
  `PlantDiversityExplorer` into `PlantDiversityReport` (no `Dialog`). The page
  renders `<PlantDiversityReport weekMeals={…} />`. The modal is retired. Cleanest;
  one rendering path.
- **Option B — Dual-mode component.** Keep one component with a `variant: "modal" | "page"`
  prop that conditionally wraps in `Dialog`. Lower churn but leaves two layout paths
  to maintain. Not recommended.

**The page must reuse `computePlantData` verbatim** — it is the single source of
truth for plant rows, and decoupling it from any container is the reason this
conversion is low-risk.

### 2.3 The data-access problem (the real work)

The modal receives `weekMealsData` as a prop from planner local state. A page at
its own route does **not** inherit planner local state. The page needs to derive
the *same* `WeekMealEntry[]` for the active week. Three options:

| Approach | How | Trade-off |
|----------|-----|-----------|
| **A. PlannerProvider context (recommended)** | The planner already wraps in `PlannerProvider` (`App.tsx` line ~166). Expose `weekMealsData` (or the active-week id + meal map) via that context, and register `/plant-diversity` *inside* the same provider. | Reuses existing memoisation; page and planner stay in lockstep. Requires the route to share the provider. |
| **B. Dedicated query** | Page independently queries the active week + meals (same source the planner memo is built from) and runs the same assembly. | Fully decoupled; page is deep-linkable even from a cold load. Duplicates the assembly logic — extract it into a shared hook (`useWeekMealEntries`). |
| **C. Navigation state / params** | Pass the active week id in the URL (`/plant-diversity?week=…`) and re-fetch. | Explicit, bookmarkable, but still needs B's assembly. |

**Recommendation:** Extract the assembly (planner lines ~567–580) into a shared
hook `useWeekMealEntries(weekId)` and have the page use approach **B** (dedicated
query) keyed by the active week. This makes the page deep-linkable and removes the
hidden coupling to planner local state. Approach A is acceptable if deep-linking
from cold load is explicitly out of scope.

> This is the single most important architectural decision and the main reason the
> conversion is "investigation-worthy" rather than trivial. It does not change in
> this document — it is flagged for the implementation phase.

### 2.4 Page shell & layout

- Register the route in `App.tsx` exactly like its peers:
  `<Route path="/plant-diversity" component={() => <ProtectedRoute component={PlantDiversityPage} />} />`
  — inheriting full chrome automatically.
- Page body uses the same width discipline as other content pages (a centered
  `max-w-*` container) rather than the modal's `max-w-2xl`. With a full page the
  report table can breathe: the `hidden md:table-cell` columns (Meals, Days,
  Nutrients) that the modal hides on narrow widths can show at more breakpoints.
- Replace the `DialogClose` affordance with a standard page back path (browser
  back returns to `/planner`; optionally a "← Back to planner" affordance using
  Wouter's `navigate`).

---

## SECTION 3 — NAVIGATION CHANGES

### 3.1 Entry gesture (unchanged for the user)

```
Planner header
  └─ WeeklyPlantDiversityCounter  ("23 / 30 plants", progress bar)
        onExplore  →  (today)  setPlantExplorerOpen(true)
        onExplore  →  (target) navigate("/plant-diversity")
```

The chip stays exactly where it is and looks exactly the same. Only its handler
changes: instead of flipping local modal state, it calls Wouter's `navigate`.

### 3.2 Required navigation edits (implementation phase, not now)

| Location | Today | Target |
|----------|-------|--------|
| `App.tsx` `<Switch>` (~line 197 region) | — | add `/plant-diversity` route |
| `weekly-planner-page.tsx` ~829 | `plantExplorerOpen` state | removed |
| `weekly-planner-page.tsx` ~1906 | `onExplore={() => setPlantExplorerOpen(true)}` | `onExplore={() => navigate("/plant-diversity")}` |
| `weekly-planner-page.tsx` ~3943 | `<PlantDiversityExplorer … />` mount | removed |
| `nutrition-variety-chips.tsx` ~370 | button calling `onExplore` | unchanged (still calls `onExplore`) |

The counter component is already correctly abstracted behind an `onExplore`
callback, so it needs **no change** — the planner simply hands it a navigation
action instead of a state setter.

### 3.3 Back / exit behaviour

- **Back button:** returns to `/planner` natively (a true browser history entry —
  a modal never offered this).
- **In-page affordance:** a "← Back to your week" link using `navigate("/planner")`.
- **Deep link:** `/plant-diversity` becomes shareable/bookmarkable. This is only
  meaningful if data access uses approach B/C from §2.3; with approach A a cold
  deep link must redirect to `/planner` if no active week context exists.

### 3.4 Title change

The page `<h1>` becomes **"Plant Diversity Report"** (the experience's name),
with the "30 Plants This Week" framing retained as the progress sub-header
(`ReportSectionHeader`). The planner chip keeps its "x / 30 plants" microcopy.

---

## SECTION 4 — HEALTH BENEFITS LANGUAGE

This confirms and carries forward the prior amendment
(`THA_30_PLANTS_MODAL_V2_HEALTH_BENEFITS_AMENDMENT.md`) into the page design.

### 4.1 Terminology — adopt

| Use | Instead of | Where |
|-----|-----------|-------|
| **Health Benefits** | "Support" / "Primary Support" / "Secondary Support" | Column header; benefit labels |
| **More Health Benefits** | "Additional Supports" / "Show More" | Secondary-benefit section within an expanded row |
| **Broaden Your Variety** | (new) | Variant-suggestion section within an expanded row |

### 4.2 Terminology — remove

- "Primary Support"
- "Secondary Support"
- "Additional Supports"
- "Show More" (as a standalone generic control)

### 4.3 Rationale (unchanged from amendment, summarised)

- "Health Benefits" is human, outcome-focused, and answers "what do I gain?"
  without a nutrient-translation step.
- "More Health Benefits" makes the secondary content enticing and self-describing,
  and can preview benefits inline rather than hiding them behind a generic control.
- "Broaden Your Variety" frames the variant list as a forward-looking, positive
  action ("here's how to go further"), consistent with the report's educational,
  non-judgemental tone.
- All three align with THA's trust philosophy: each Health Benefit is evidenced by
  a named Key Nutrient, and each plant is evidenced by the Meals it appeared in.

### 4.4 Disclaimer (retain)

Keep an educational footer: *"Plant count and health benefits are educational
summaries, not medical advice."* This protects "Health Benefits" from reading as
marketing rather than science.

---

## SECTION 5 — SORTING STRATEGY

### 5.1 Today

`computePlantData` sorts by `CATEGORY_ORDER` then alphabetically by plant name
(lines ~146–151). There is no user-facing sort control and no reusable sort
component (`ui/table.tsx` exists but is unused here).

### 5.2 The two exploration modes

The brief asks whether one page can serve both:

- **Food-first exploration:** "Here are my plants — what does each give me?"
  (rows = plants; the natural reading of the current table).
- **Health-first exploration:** "I care about Sleep / Heart — which plants and
  meals deliver it?" (rows pivot around Health Benefits).

### 5.3 Recommendation — food-first table, sortable; health-first as a later lens

Ship **one table whose rows are plants** (food-first), with a **sort control**.
Do **not** try to make a single table simultaneously be plant-rowed and
benefit-rowed — that is what causes confusion. Instead:

**Phase 1 (page launch): sortable food-first table.**

| Sort key | Behaviour | Notes |
|----------|-----------|-------|
| **Plant** (default) | Category order, then A–Z (current behaviour) | Familiar; safe default |
| **Health Benefit** | Group/sort by each plant's *primary* Health Benefit | Surfaces "what am I covered for?" without leaving the plant-row model |
| **Key Nutrient** | Sort by primary nutrient | Educational clustering (all magnesium plants together) |
| **Meals** | Sort by number of contributing meals (desc) | "What's doing the heavy lifting this week?" |
| **Category** | Explicit category grouping | Already the implicit default; expose it |

**Phase 2 (follow-up): a health-first *lens*, not a second table.**
Add a toggle ("View by plant" / "View by health benefit"). The health-first view
re-pivots the *same data* so rows are Health Benefits, each expanding to the
nutrient → plants → meals beneath. Keep it a distinct, explicitly-labelled mode so
the user always knows which lens they are in. This directly answers the brief's
"can the same page support both without confusion?" — **yes, if they are explicit
modes rather than a blended table.**

### 5.4 Why staged

- The data already supports all five sort keys (every field is present on
  `PlantRow`); sorting is low-risk and high-value.
- A full benefit-rowed pivot needs an inverted index (benefit → nutrient → plants)
  that does not exist yet and warrants its own design. Shipping it blended with the
  plant table is the main confusion risk — hence Phase 2 and a clear toggle.

### 5.5 Scope guard

Per approved scope, **no sorting is implemented in this investigation**. §5 is the
recommended model only.

---

## SECTION 6 — EDUCATIONAL MODEL

### 6.1 Internal model (reasoning order)

```
Health  →  Nutrient  →  Plant  →  Meal
```

"I want better sleep → magnesium drives it → pumpkin seeds are rich in it → I ate
them in Breakfast Bowl."

### 6.2 Visual model (column order)

```
Plant  |  Health Benefits  |  Key Nutrients  |  Meals
```

### 6.3 Confirmation: this balance is correct

The visual order is **plant-first** even though the internal teaching model is
**health-first**, and this tension is intentional and correct:

- The user arrives from the planner already thinking in **plants** ("I ate 23 of
  30"). A plant-first column anchors them in something concrete they recognise.
- Reading left→right then *delivers* the health-first lesson: *this plant* → *gives
  these Health Benefits* → *via these Nutrients* → *which I actually ate here*. The
  row literally narrates Health ← Nutrient ← Plant ← Meal evidence in a single
  scan.
- The **Health-first sort/lens** from §5 is what serves the minority who arrive
  goal-first ("I care about sleep"). So the internal model is honoured *twice*: once
  in every row's left-to-right narrative, and once as an optional whole-page lens.

**Verdict:** Keep `Plant | Health Benefits | Key Nutrients | Meals` as the visible
structure. The internal `Health → Nutrient → Plant → Meal` model is expressed
through (a) row narrative and (b) the optional health-first lens — not by reordering
columns. This remains the best balance. Confidence: High (88%).

---

## SECTION 7 — WIREFRAMES

> Conceptual only. Not pixel specs. No CSS implied.

### 7.1 Page (desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to your week                                                    │
│                                                                        │
│  🌱 Plant Diversity Report                                             │
│  You've eaten 23 of 30 plants this week.                               │
│  ███████████████████░░░░░░░  23 / 30                                   │
│                                                                        │
│  Categories covered: 8 of 9                                            │
│  [Veg ✓][Fruit ✓][Legumes ✓][Grains ✓][Seeds ✓][Nuts ✓][Herbs ✓]     │
│  [Olive Oil ✓][Fermented —]                                            │
│                                                                        │
│  Sort by: ( Plant ▾ )   Health Benefit   Nutrient   Meals   Category   │
│                                                                        │
│  Plant            Health Benefits   Key Nutrients   Meals              │
│  ───────────────────────────────────────────────────────────────────  │
│  🌻 Pumpkin Seeds  😴 Sleep Quality  Magnesium       3 ▾              │
│  🍅 Tomatoes       ❤️ Heart Health   Lycopene        7 ▸              │
│  🥬 Spinach        🛡 Immune Support  Iron, Folate    5 ▸              │
│  …                                                                      │
│                                                                        │
│  Educational summary: health benefits are not medical advice.          │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Expanded plant row (the worked example from the brief)

```
🌻 Pumpkin Seeds     😴 Sleep Quality     Magnesium     3 ▾
   ┌────────────────────────────────────────────────────────────────┐
   │ More Health Benefits                                            │
   │   ❤️ Heart Health      Magnesium                                │
   │   💪 Muscle Function   Magnesium                                │
   │   🛡 Immune Support    Zinc                                     │
   │   ⚡ Energy            Iron                                     │
   │                                                                 │
   │ Used In                                                         │
   │   ✓ Breakfast Bowl — Monday                                     │
   │   ✓ Thai Feast — Thursday                                       │
   │   ✓ Mediterranean Salad — Saturday                             │
   │                                                                 │
   │ Broaden Your Variety                                           │
   │   • Raw Pumpkin Seeds                                           │
   │   • Roasted Pumpkin Seeds                                       │
   │   • Pumpkin Seed Oil                                            │
   └────────────────────────────────────────────────────────────────┘
```

The collapsed row shows the **primary** Health Benefit + its Key Nutrient + meal
count. Expansion reveals **More Health Benefits**, the **Used In** evidence
(meals + days), and **Broaden Your Variety** (variant suggestions). No "Primary
Support / Secondary Support / Show More" anywhere.

### 7.3 Mobile (narrow)

```
┌──────────────────────────────┐
│ ← Back                        │
│ 🌱 Plant Diversity Report     │
│ 23 of 30 plants  ███████░░    │
│ Categories: 8 / 9             │
│ Sort: ( Plant ▾ )             │
│ ───────────────────────────   │
│ 🌻 Pumpkin Seeds          ▾   │
│   😴 Sleep Quality            │
│   Magnesium · 3 meals         │
│ ───────────────────────────   │
│ 🍅 Tomatoes               ▸   │
│   ❤️ Heart Health             │
│   Lycopene · 7 meals          │
└──────────────────────────────┘
```

On mobile the secondary columns stack under the plant name (the component already
does this via `md:hidden` blocks), and the full page removes the modal's vertical
viewport fight.

### 7.4 Health-first lens (Phase 2 concept)

```
View: [ By plant ]  ( By health benefit )

😴 Sleep Quality        Magnesium
   🌻 Pumpkin Seeds — Breakfast Bowl, Thai Feast
   🥬 Spinach       — Mediterranean Salad
❤️ Heart Health         Lycopene, Magnesium
   🍅 Tomatoes      — Pasta Night
   …
```

Same data, re-pivoted; an explicit, separately-labelled mode.

---

## SECTION 8 — RISKS

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|-----------|------------|
| 1 | **Data access** — page lacks planner local state that feeds `weekMealsData` | HIGH | HIGH | Extract `useWeekMealEntries(weekId)`; use dedicated query (§2.3 B) or shared PlannerProvider (A) |
| 2 | **Deep-link cold load** — `/plant-diversity` opened with no active-week context | MEDIUM | MEDIUM | Redirect to `/planner` if no active week, or resolve week from query param |
| 3 | **Loss of modal "lightness"** — full page feels heavier for a quick glance | LOW | MEDIUM | Keep the planner chip's inline count as the at-a-glance answer; page is the deep dive |
| 4 | **Two layout paths** if dual-mode component chosen (Option B) | MEDIUM | MEDIUM | Prefer body extraction (Option A); retire the modal entirely |
| 5 | **Blended sort/lens confusion** — mixing plant-rows and benefit-rows | MEDIUM | MEDIUM | Keep food-first table and health-first lens as explicit, separate modes (§5.3) |
| 6 | **Benefit-library coverage gaps** — plants with no `getNutritionBenefit` entry render empty Health Benefits | MEDIUM | MEDIUM | Graceful empty state ("benefit data coming soon"); already partially handled (`benefitSummary: null`) |
| 7 | **"Broaden Your Variety" data source** — variant suggestions must come from real variants, not invented | MEDIUM | MEDIUM | Drive from existing `variants`/`CATEGORY_SUGGESTIONS`; do not fabricate |
| 8 | **Back-button / history** expectations differ from modal dismissal | LOW | LOW | Standard page semantics; add explicit back affordance |
| 9 | **Analytics/route tracking** — `useRoutingCorrectionTracker` may flag fast in/out of the page as a "correction" | LOW | LOW | Confirm the new route is excluded or expected in routing-correction logic |
| 10 | **Sidebar/nav presence** — should `/plant-diversity` appear in the sidebar? | LOW | LOW | Decide intentionally; default to *not* in primary nav (reached from planner only) |

---

## SECTION 9 — RECOMMENDATION

**Proceed with the page conversion.** The experience is information-rich, benefits
from deep-linking and back-button semantics, and is currently fighting the modal
viewport — especially on mobile. The conversion is low-risk because the data
builder (`computePlantData`) and all body sub-components are already
container-agnostic.

**Recommended shape:**

1. **Body extraction (Option A):** lift the report body into
   `PlantDiversityReport`; retire the `Dialog`. Register
   `/plant-diversity` in `App.tsx` under `ProtectedRoute`.
2. **Solve data access first (Risk #1):** extract `useWeekMealEntries(weekId)` and
   feed the page via a dedicated query keyed to the active week, so the page is
   deep-linkable and decoupled from planner local state.
3. **Re-point the trigger:** `WeeklyPlantDiversityCounter.onExplore` →
   `navigate("/plant-diversity")`. No change to the counter component itself.
4. **Adopt Health Benefits language** end-to-end: "Health Benefits", "More Health
   Benefits", "Broaden Your Variety"; remove "Primary/Secondary/Additional Support"
   and standalone "Show More".
5. **Sorting:** ship a food-first sortable table (Plant default; Health Benefit,
   Nutrient, Meals, Category). Defer the health-first **lens** to Phase 2 as an
   explicit toggle, not a blended table.
6. **Keep visible columns** `Plant | Health Benefits | Key Nutrients | Meals`; the
   internal `Health → Nutrient → Plant → Meal` model is delivered through row
   narrative and the optional lens.

**Confidence:** High (87%). The only material unknown is the data-access wiring
(Risk #1), which is a known, bounded engineering task, not a design uncertainty.

---

## FINAL REPORT

### 1. Rollback identifier
```
Tag:    rollback/tha-30-plants-page-design-20260617
Commit: f384f6a40c8dffcecc18736fd1393180cc080b7b
Object: 944e674f15aa7f605440bc2906fc3096470277bc
Restore: git reset --hard rollback/tha-30-plants-page-design-20260617
```

### 2. Recommended page structure
- New route `/plant-diversity` under `ProtectedRoute` (full app chrome).
- Page body = extracted `PlantDiversityReport` (header + category grid +
  completion suggestions + plant report table), modal `Dialog` retired.
- Title "Plant Diversity Report"; progress sub-header keeps "x of 30 plants".
- Visible columns: **Plant | Health Benefits | Key Nutrients | Meals**.
- Expanded row: **More Health Benefits** → **Used In** → **Broaden Your Variety**.
- Reuse `computePlantData` and the nutrition libraries unchanged.

### 3. Recommended sorting model
- Food-first plant-rowed table with a sort control: **Plant (default), Health
  Benefit, Key Nutrient, Meals, Category** — all fields already exist on `PlantRow`.
- Health-first **lens** as a Phase 2 explicit toggle ("By plant" / "By health
  benefit"), re-pivoting the same data — never a blended table.

### 4. Required amendments
- Language: "Support/Primary/Secondary/Additional Support" → **Health Benefits** /
  **More Health Benefits**; "Show More" → integrated; add **Broaden Your Variety**.
- Architecture: extract `useWeekMealEntries(weekId)`; resolve page data via
  dedicated query (or shared PlannerProvider).
- Navigation: add route; re-point `onExplore` to `navigate`; remove
  `plantExplorerOpen` state and the modal mount in the planner.
- Container: extract body component; retire `Dialog` shell.

### 5. Risks
Highest: **data access** (page lacks planner local state) and **deep-link cold
load**. Both bounded and mitigable (shared hook + dedicated query; redirect when no
active week). Secondary: blended sort/lens confusion (avoid via explicit modes),
benefit-library coverage gaps (graceful empties), and variant-data authenticity for
"Broaden Your Variety". Full table in Section 8.

### 6. Recommendation
**Approve the conversion.** Promote the modal to `/plant-diversity` via body
extraction, solve data access with a shared week-meals hook, adopt Health Benefits
language, and ship a food-first sortable table with a staged health-first lens.
Confidence: High (87%).

### 7. Confirmation — No code changes made
```
✓ No page created
✓ No routes modified
✓ No modal/component changed
✓ No CSS changed
✓ No sorting added
✓ No tables added
✓ No schema / API / migration changes
✓ Only this investigation document added (untracked); rollback tag created
```

---

**Investigation completed:** 2026-06-17
**Status:** ✓ RECOMMENDED — proceed to implementation planning
**Rollback available:** `git reset --hard rollback/tha-30-plants-page-design-20260617`
