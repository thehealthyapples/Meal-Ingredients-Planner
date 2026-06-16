# THA — Comprehensive UI Density & Breathing Space Audit

**Generated:** 2026-06-16  
**Rollback point:** `rollback/ui-density-audit-20260616-0000` → commit `9fe2c02`  
**Branch:** main  
**Investigation type:** Read-only UI audit  
**Risk level:** GREEN — No application code modified  

---

## SECTION 1 — EXECUTIVE SUMMARY

### What feels premium

- **Realm colour system** — each page has its own teal/amber/sage/rose tonal identity. The palette is restrained and warm without being garish. The `data-realm` CSS variable pattern is architecturally sound.
- **Orchard backdrop + card frosting** — `bg-card/82 backdrop-blur-md` gives cards a glass-panel quality that reads as modern and considered.
- **PageHeader sticky behaviour** — the scroll-collapse on mobile (4s auto, scroll-driven) is genuinely calming because it gives users more canvas as they scroll into content.
- **Typography dual-font** — DM Sans for headings, Inter for body. The combination feels editorial and trustworthy.
- **Shadow-none card system** — eliminating shadows in favour of borders and backdrop blur is consistent and reads well against the textured background.
- **Variety dots on planner cards** — small, calm, colour-matched to the legend above. Low noise, informative for those who engage with it.
- **Realm-banner-btn** — the region-tinted action buttons in the planner header feel contextually intentional, not generic.

### What feels crowded

- **Desktop planner cells** — `p-1.5 min-h-[56px]`. 6px padding with 10px status icons creates a spreadsheet feel. The grid is THA's most important surface and currently its most tense.
- **Planner header stat row** — the household diets toggle and the variety legend sit in a single row with `gap-x-4 gap-y-1 mb-2`. Eight pixels of margin between this row and the grid. The planner's most information-rich section has the least breathing room.
- **Chip sizing anarchy** — four different chip heights exist in the same application (10px, 11px, 12px, and badge-default). Users' eyes cannot build a visual grammar because the system never repeats itself.
- **Card default padding** — `CardHeader` uses `p-6` (24px) and `CardContent` uses `p-6 pt-0`. Every information-dense use site overrides with `p-4` or `p-3`. The default is calibrated for marketing cards, not data cards.
- **Mobile cookbook action row** — `h-7 w-7` (28px) icon-only buttons in a horizontal row. Below minimum touch target on mobile.

### What feels inconsistent

- **Typography: utilities defined, raw values used** — `.title-section` (22px) is in `index.css` but `PageHeader` hardcodes `text-[22px]` directly. The token exists; the system doesn't use it.
- **Border radius misalignment** — `tailwind.config.ts` maps `rounded-lg` to `0.75rem` (12px). `Card` uses `rounded-xl` (16px, Tailwind default — not the extended config). `--radius: 0.75rem` in CSS variables. Three sources disagree on what a rounded card looks like.
- **Icon sizing by position** — nav sidebar uses 16px icons, top bar uses 20px, planner row labels use 12px, planner cell status icons use 10px, planner row basket button uses 20px. No scale is being followed.
- **Spacing CSS variables declared, never consumed** — `--space-1: 4px` through `--space-8: 32px` are defined in `:root` but no component uses them. The tokens exist on paper only.
- **Mobile bottom nav label size `text-[9px]`** — 9px is below comfortable reading at arm's length on a phone and below the practical typographic floor for UI labels.

### Top 10 opportunities (ranked by impact)

| # | Opportunity | Scope | Impact |
|---|---|---|---|
| 1 | Increase desktop planner cell padding to `p-2` and min-height to `min-h-[68px]` | Planner | High — THA's primary surface |
| 2 | Unify chip height to a single standard (20px recommended) across all pages | Global | High — most frequent mismatch |
| 3 | Add `pt-4 sm:pt-6` content breathing gap below every sticky PageHeader | Global | High — affects all pages |
| 4 | Increase planner header stat row margin from `mb-2` to `mb-3` and gap from `gap-y-1` to `gap-y-2` | Planner | Medium — simple change, big perception shift |
| 5 | Adopt `.title-section` / `.title-card` typography utilities in PageHeader and card titles | Global | Medium — code hygiene + visual consistency |
| 6 | Establish card padding standard: `p-4` for data cards, `p-5` for informational, `p-6` only for hero/marketing | Global | Medium |
| 7 | Raise planner cell `text-xs` (12px) meal names to `text-sm` (14px) on desktop | Planner | Medium |
| 8 | Raise mobile bottom nav label from `text-[9px]` to `text-[10px]` | Global | Low effort, high legibility gain |
| 9 | Align `Card` border-radius to `rounded-lg` (12px) to match `--radius` and `tailwind.config.ts` | Global | Low — visual refinement |
| 10 | Bring spacing CSS variables into active use or remove them | Global | Medium-term hygiene |

---

## SECTION 2 — GLOBAL DESIGN SYSTEM AUDIT

### 2.1 Spacing Scale

| Item | Current | Recommended | Priority | Risk |
|---|---|---|---|---|
| CSS spacing tokens | `--space-1..8` defined, never used | Adopt tokens in components or remove | Medium | Low |
| Card padding (default) | `p-6` (24px) for both `CardHeader` and `CardContent` | `p-4` (16px) default, `p-5` option for breathing cards | High | Medium — breaking default |
| Content zone below PageHeader | No guaranteed top padding — varies by page | `pt-4 sm:pt-6` as a consistent wrapper convention | High | Low |
| Planner cell padding | `p-1.5` (6px) | `p-2` (8px) | High | Low |
| Planner header stats row | `mb-2 gap-y-1` (8px below, 4px wrap gap) | `mb-3 gap-y-2` (12px below, 8px wrap gap) | High | Low |
| Section spacing in forms/profile | `space-y-3 sm:space-y-4` | Consistent — can stay | Low | — |
| Mobile slot padding | `p-3` (12px) | Adequate — can stay | — | — |
| Dialog padding | `p-6` (24px) | Fine for modals — stay | — | — |

### 2.2 Typography

| Item | Current | Recommended | Priority | Risk |
|---|---|---|---|---|
| Page title utility | `.title-page: 32px/38px` defined, unused | Adopt in PageHeader and page-level H1s | Medium | Low |
| Section title utility | `.title-section: 22px/28px` defined — PageHeader uses `text-[22px]` directly | Switch PageHeader to `.title-section` | Low | Low |
| Card title utility | `.title-card: 16px/22px` defined, rarely used | Adopt in `CardTitle` overrides | Low | Low |
| Body text | No `.text-body` utility — default `text-sm` (14px) | Define and adopt `.text-body: 14px/20px` | Low | Low |
| Desktop planner cell text | `text-xs` (12px) for meal names | `text-sm` (14px) | High | Low |
| Mobile bottom nav labels | `text-[9px]` | `text-[10px]` | High | Low |
| Table text | `.text-table: 13px/18px` defined in `calm-table` | Consistent — stay | — | — |
| Heading letter-spacing | `-0.01em` on h1–h6 globally | Fine | — | — |

### 2.3 Cards

| Item | Current | Recommended | Priority | Risk |
|---|---|---|---|---|
| Card border-radius | `rounded-xl` (16px, Tailwind default) | `rounded-lg` (12px, matches `--radius` and tailwind config extension) | Low | Low |
| Card backdrop-blur | `backdrop-blur-md` | Fine for the orchard aesthetic — stay | — | — |
| Card shadow | `shadow-none` | Consistent — stay | — | — |
| Card background opacity | `bg-card/82` | Fine | — | — |
| CardHeader default padding | `p-6` = 24px all sides | Override to `p-4` or create `CardHeaderCompact` | Medium | Medium |
| CardContent default padding | `p-6 pt-0` = 24px sides, 0 top | Same — override to `p-4 pt-0` | Medium | Medium |

### 2.4 Chips / Badges / Pills

| Item | Context | Current height | Recommended | Priority |
|---|---|---|---|---|
| Planner card mini-chips | Inside cell cards | 18px (`h-[18px]`) | 20px | Medium |
| Diet toggle chips | Week overrides panel | ~20px (`text-[11px] py-0.5`) | 20px — already close | Low |
| Badge component | Global (Radix-based) | ~22px (`py-0.5 text-xs`) | 20px | Low |
| Profile summary chips | Profile page | ~28px (`text-xs py-1`) | 22px | Low |
| Pantry "Need" chips | Pantry rows | ~20px (`text-[11px] py-0.5`) | 20px — already close | Low |
| Source/retailer chips | Shopping pages | Various | Standardise at 22px | Medium |

**Target:** one chip height standard. Recommended: `h-[20px]` (20px, `text-[11px]`, `px-2`, `rounded-full`). Use `h-[22px] text-xs px-2.5` for slightly more breathing.

### 2.5 Icons

| Context | Current size | Issue |
|---|---|---|
| Desktop sidebar nav | `h-4 w-4` (16px) | Fine |
| Top bar buttons | `h-5 w-5` (20px) | Fine |
| Mobile bottom nav | `h-5 w-5` (20px) | Fine |
| PageHeader icon | `h-5 w-5` (20px) | Fine |
| Planner row label | `h-3 w-3` (12px) | Too small — should be `h-3.5 w-3.5` |
| Planner row basket | `h-5 w-5` (20px) | Inconsistent with 12px row icons in same div |
| Planner cell status | `h-2.5 w-2.5` (10px) | Too small — likely invisible on mobile retina |
| Planner cell status (mobile) | `h-3 w-3` (12px) | Borderline |
| Cookbook action buttons | `h-3.5 w-3.5` (14px) in `h-7 w-7` buttons | Appropriate for size |

**Recommended icon standards:**
- Navigation: 20px
- Body/row-label: 14–16px
- Status/inline: 12px (minimum)
- Never use 10px icons for functional affordances

### 2.6 Touch Targets

| Item | Current | Min required | Issue |
|---|---|---|---|
| Mobile bottom nav items | `min-w-[44px] min-h-[44px]` | 44px | Pass |
| Sidebar nav items | `py-2.5` = ~36px height | 44px | Fail on mobile if sidebar shown |
| Pantry `NeedQuantityControl` inputs | `h-6` (24px) | 44px | Fail — too small for touch |
| Cookbook action icon buttons | `h-7 w-7` (28px) | 44px | Fail on mobile |
| Planner cell `+ Add` text links | Text only, no explicit height | 44px | Fail on mobile |
| Profile `SettingRow` click area | `py-3` = 24px total | 44px | Fail on mobile |

### 2.7 Grid and Layout

| Item | Current | Recommended | Priority |
|---|---|---|---|
| Desktop max-width | `max-w-screen-xl` (1280px) most pages | Consistent — fine | — |
| Side padding | `px-4 sm:px-6 lg:px-8` | Consistent — fine | — |
| Sidebar collapsed | `w-16` (64px) | Fine | — |
| Sidebar expanded | `w-[220px]` | Fine for current nav items | — |
| Main content top gap | Varies by page (0 to `pt-6`) | Standardise to `pt-4 sm:pt-6` | High |
| Mobile bottom safe area | `calc(safe-area-inset-bottom + 80px)` | Fine | — |

---

## SECTION 3 — PAGE-BY-PAGE REVIEW

### 3.1 Planner

**What works:**
- Realm colour system (teal-green, cooler than pantry sage) gives the planner a distinctive, focused identity.
- V2 PlannerMealCard is intentionally compact. The three-line hierarchy (name → chips → variety dots) maps to a clear priority order.
- The mobile single-day view is clean and eliminates the 7-column grid squeeze.
- Scroll-collapse on the PageHeader reduces chrome as users focus on the grid.
- The `+ Add Breakfast` / `Name meal, recipe later` two-level quick-add is intelligent and non-intrusive on mobile.
- Drag-and-drop with long-press on mobile is well implemented.

**What feels crowded:**
- Desktop cells: `p-1.5` (6px) padding + `min-h-[56px]` (56px). A 12px title + 10px chip + 6px dot line + 10px boost indicator can exhaust 56px before any margin. With borders between cells the grid reads like a spreadsheet.
- Desktop cell meal name: `text-xs` (12px). This is readable at arm's length on a 27" monitor, not at arm's length on a 13" laptop.
- Planner header stats row immediately below PageHeader: `mb-2` (8px) above the grid, `gap-y-1` (4px) between wrapped items. This zone — which contains the variety legend, plant count, and diets toggle — is the second most important UI element after the grid but has the least breathing room.
- Status icons at `h-2.5 w-2.5` (10px): Snowflake, Cart, Check icons at 10px are functional but nearly invisible on high-density displays. Users must hunt for them.
- The ShoppingBasket icon in the row label column (`h-5 w-5`, 20px) is much larger than the row label icon (`h-3 w-3`, 12px) in the same div. This creates a visual jump.

**What feels sparse:**
- The planner assistant panel (when open on desktop) has good breathing room. This is a positive.
- Week diets card (`p-4 space-y-3`) is appropriately padded.

**Responsiveness concerns:**
- **Mobile (< 640px):** The day tabs (`gap-1`) with 7 days at 3-letter abbreviations can be tight on narrow screens (< 375px). The gap between the label and the date counter is very small.
- **Tablet (640–1024px):** The planner switches from mobile (single-day) to desktop-grid at `sm` (640px). At 640px, the 7-column grid with 100px label column + `900px` min-width triggers horizontal scroll. The `overflow-x-auto -mx-4 px-4` pattern handles this but the experience is not ideal at 640–768px.
- **Desktop:** At 1280px+ the grid is comfortable. At 1024–1280px it can feel compressed.

**Quick wins:**
- Increase desktop cell padding: `p-1.5` → `p-2`
- Increase min-height: `min-h-[56px]` → `min-h-[68px]`
- Increase desktop meal name: `text-xs` → `text-sm`
- Increase stats row gap: `mb-2 gap-y-1` → `mb-3 gap-y-2`
- Status icons: `h-2.5 w-2.5` → `h-3 w-3`

**Longer term ideas:**
- A "relaxed" cell padding option (user preference: compact vs comfortable) for households who want more or less density.
- Consider separating the variety legend into its own visually distinct bar rather than cramming it into the stats row.
- At tablet breakpoint (640–900px), consider a 4+3 split view (show 4 days, swipe for next 3) before switching to full 7-column grid.

---

### 3.2 Cookbook

**What works:**
- Grid/list view toggle is well-implemented with localStorage persistence.
- Meal card image areas give visual identity to recipes.
- The action toolbar (servings, list, freeze, planner, analyse, basket) is functionally comprehensive.
- `realm-banner-btn` tinting on action buttons feels contextually grounded.

**What feels crowded:**
- The horizontal action toolbar (`h-7 w-7` icon buttons) is 28px height — below the 44px minimum touch target on mobile. On mobile, the long-press action sheet is used instead, but the desktop toolbar is shown on tablet sizes where touch is likely.
- Meal cards using `CardHeader p-6` + `CardContent p-6 pt-0` create unnecessarily tall cards in grid view. With a meal image, title, diet badges, and ingredient preview, 24px internal padding at top/bottom is generous when the card is already tall from image height.
- Analysis dialog: `sm:max-w-[600px] max-h-[85vh] overflow-y-auto` — the 600px width and 85vh height with overflow creates a scrollable modal. Dense content with multiple sections (nutrition, allergens, swaps) can feel overwhelming.

**What feels sparse:**
- The cookbook search/filter bar area — filters are accessible but the spacing above and below the filter row varies.
- The meal detail page (`/cookbook/:id`) — needs separate review but typically has more breathing room.

**Responsiveness concerns:**
- **Mobile:** The action toolbar switches to MobileMealActionSheet (bottom drawer) on long-press — correct. But the card grid itself at mobile width (1 column) can make cards feel large and slow to scroll.
- **Tablet:** Action toolbar at 28px touch targets on touch tablets is the primary concern.
- **Desktop:** Grid view works well.

**Quick wins:**
- Reduce cookbook card padding: override `CardHeader` and `CardContent` to `p-4` for grid cards.
- Increase action icon button hit area: `h-7 w-7` → `h-8 w-8` (still below 44px but better) with `-m-1` negative margin to expand click area without increasing visual size.

---

### 3.3 Shopping

**Shopping List page (`/shopping-list`)**

**What works:**
- `calm-table` with alternating row tints (`row-alt`) is legible and calm.
- `padding: 8px 12px` per table cell — consistent.
- Category grouping with headers is clear.
- The SpellSuggestions component is non-intrusive.

**What feels crowded:**
- The filter/sort bar at the top: a row with search input, store filter, sort button, and export button. At mobile widths these can wrap awkwardly.
- Source chips for item attribution — varying sizes between `text-[11px]` and `text-xs`.
- The apple score badge system in shopping rows — visually distinct but adds horizontal density to already information-rich rows.

**What feels sparse:**
- The empty state (no items) has adequate padding and is well-considered.

**Responsiveness concerns:**
- **Mobile:** Row height with quantity + unit + store selector + checkbox can exceed comfortable thumb reach for individual rows.
- **Desktop:** Table layout at wide viewport is clean.

**Quick wins:**
- Standardise source chip height to 20px across all rows.
- Add `mb-3` spacing between filter bar and table body.

---

**Shopping Workspace (`/shopping-workspace`)**

**What works:**
- Three-tab structure (Review/Prep/Shop) is a strong conceptual split.
- The realm uses a warm "basket" colour identity.
- PageHeader with tab controls as the `center` prop creates an efficient operational header.

**What feels crowded:**
- The Review tab shows all shopping list items in table form with: quantity, unit, store selector, whole-food indicator, apple score, and action buttons. This is a very high information density row.
- On tablet, the combination of all these columns creates horizontal squeeze.
- The workspace side panels, when open, compete aggressively for the main content area.

**Responsiveness concerns:**
- **Mobile:** The table-based review mode collapses poorly. The column count doesn't reduce responsively enough.
- **Tablet:** Side-by-side panels at tablet width can become uncomfortably narrow.

---

### 3.4 Pantry

**What works:**
- Category icons (Archive, Refrigerator, Layers, Apple) are well chosen and immediately recognisable.
- The "Need quantity" pill is a compact and clever affordance.
- Card-with-divide-y for item rows is clean.
- Collapsible categories reduce cognitive load.

**What feels crowded:**
- `NeedQuantityControl` inputs: `h-6` (24px). On mobile, 24px inputs are below the practical touch target minimum. Users risk tapping adjacent rows.
- The "Need" pill at `text-[11px] px-2 py-0.5` is 20px tall — fine on desktop, small on mobile.

**What feels sparse:**
- The pantry is generally well-paced. When categories are expanded, there's room to breathe.

**Responsiveness concerns:**
- **Mobile:** Row items with checkbox + name + need-quantity + send-to-basket actions across a single row can be tight at narrow widths. The name may truncate aggressively.
- **Desktop:** Good.

**Quick wins:**
- NeedQuantityControl: increase `h-6` → `h-8` for mobile touch target.

---

### 3.5 Diary

**What works:**
- Day navigation with chevron controls is clear.
- Four meal slots (Breakfast/Lunch/Dinner/Snack/Drink) are visually distinct with icons and realm colours.
- Collapsible health/metrics section reduces clutter.
- The progress tab with recharts is cleanly presented.

**What feels crowded:**
- The wellbeing metrics row (weight, BMI, mood, sleep, energy, plan, notes) can create a dense form at full width.
- When DayVarietySummary and DayNutrientSummary chips are displayed for a day, the chip rows can wrap extensively at mobile width.
- The diary card structure using `CardHeader p-6` default creates tall cards for simple meal-slot entries.

**What feels sparse:**
- The progress charts section — recharts give adequate visual space.

**Responsiveness concerns:**
- **Mobile:** The 4-slot day view stacks vertically — works fine but can be long to scroll.
- **Tablet/Desktop:** The day view benefits from the extra horizontal space.

**Quick wins:**
- Override diary entry cards to `p-4` padding.
- Reduce wellbeing metrics form to a condensed grid on desktop.

---

### 3.6 Profile

**What works:**
- `SectionGroup` collapsible pattern with `px-3 py-2 rounded-lg bg-muted/35` headers is elegant. Low contrast, understated.
- `SettingRow` with inline summary (`"Not set"`) gives users a glanceable current-state before expanding.
- `ProfileSummary` chips provide a compact identity card at the top.
- Household management in a Dialog keeps the main page clean.

**What feels crowded:**
- The chip tags in `ProfileSummary` use `text-xs px-2.5 py-1 rounded-full` — larger than most other chips in the app.
- When multiple `SettingRow` items are expanded simultaneously, the sections can become very long with no visual separation.
- The `text-xs font-semibold uppercase tracking-widest text-muted-foreground` section header inside `SectionGroup` is very small and muted — arguably too muted for a navigation element.

**What feels sparse:**
- The overall profile page has good rhythm when sections are collapsed.
- The avatar/name area at the top has appropriate breathing room.

**Responsiveness concerns:**
- **Mobile:** `SettingRow` `py-3` = 24px clickable height. On mobile this should be at least 44px — needs `min-h-[44px]` or `py-3 min-h-[44px]`.
- **Desktop:** Good.

**Quick wins:**
- Add `min-h-[44px]` to `SettingRow` trigger button for mobile touch compliance.
- Unify `ProfileSummary` chips with the app-wide chip standard.

---

### 3.7 Dashboard

**What works:**
- Motion-staggered card entry (`staggerChildren: 0.07`) gives the dashboard a premium, considered feel.
- The greeting + meal plan summary tiles create a high-value landing view.
- Hardcoded `GREEN_DEEP`, `GREEN_MID`, `SAGE` constants create a consistent dashboard palette. (Note: these are dashboard-local and don't integrate with the CSS token system — an opportunity for future unification.)
- Recharts (Bar, Pie) give the dashboard analytical depth without overwhelming.

**What feels crowded:**
- Dashboard cards using `Card` + `CardContent` at default `p-6` — 24px padding on cards that are already serving as stat tiles feels generous rather than premium.

**What feels sparse:**
- No explicit concerns.

**Quick wins:**
- Override dashboard stat tiles to `p-4` or `p-5` for a tighter, more premium feel.

---

### 3.8 Shared Components

**Dialog**
- `max-w-lg` (512px), `p-6` — appropriate defaults for standard dialogs.
- Complex meal-detail dialogs (used in the planner) push content into this same `max-w-lg` container. A `max-w-2xl` variant would benefit information-rich dialogs (nutrition uplift, ingredient lists, household adaptations).
- DialogTitle at `text-lg` (18px) is correct weight for a modal heading.
- DialogHeader `space-y-1.5` (6px) — fine.
- The orchard background on dialog content (`backgroundImage: url('/orchard-bg.png')`) layered inside an already frosted card can create competing textures.

**Drawers (mobile panels)**
- Used for workspace panels on mobile. Appropriate pattern.
- `DrawerTitle` inherits DialogTitle styles.

**Sheets**
- Used for workspace contexts. Adequate.

**Tabs**
- `TabsList` / `TabsTrigger` — Radix-based. Current usage is clean.

**Accordion / Collapsible**
- Used in Profile page. `accordion-down` / `accordion-up` animations at `0.2s ease-out` — appropriately fast.

**Buttons**
- `min-h-9` default (36px), `min-h-8` sm (32px), `min-h-10` lg (40px).
- `size="icon"` = `h-9 w-9` (36px) — slightly below 44px minimum for mobile touch.
- `hover-elevate` + `active-elevate-2` classes referenced but not defined in `index.css` — likely in a separate file or Tailwind plugin. Cannot verify from this audit if this creates visual inconsistency.

**Badge**
- `px-2.5 py-0.5 text-xs` — approximately 22px tall. Reasonable.
- `rounded-md` — this uses the Tailwind default `md` radius (8px from extended config), not `rounded-lg` or `rounded-xl`. Badges are squarer than cards.

**Empty states**
- `FirstVisitHint` component uses a subtle pattern — small text, understated. Correct.

**Loading states**
- `Skeleton` components used in Profile loading state: appropriate sizes `h-36 w-full rounded-xl` etc.

**Toasts**
- Via `useToast` + `ToastAction`. Not reviewed for density; assumed to follow Radix defaults.

---

## SECTION 4 — RESPONSIVE REVIEW

### 4.1 Desktop (≥ 1024px)

**Strengths:**
- The sidebar + top bar + main content three-zone layout is clean and stable.
- `max-w-screen-xl` max-width keeps content comfortably scannable at wide viewports.
- The planner 7-column grid reads as a proper weekly plan at 1280px+.
- The realm-tinted colour system is most visible and effective at desktop sizes.
- The `hidden md:block` desktop sidebar collapses to `w-16` — a clean icon rail that saves space without losing navigation.

**Weaknesses:**
- Desktop planner cells at `min-h-[56px]` and `p-1.5` feel compressed. The UI most used by returning users is the most cramped.
- `text-xs` meal names in desktop cells — at 1920px on a 27" monitor this is comfortable. At 1366px on a laptop it is at the readability threshold.
- The top bar logo `max-h-[88px]` means the bar can expand to 88px on desktop if the logo asset renders at full height. Most browsing sessions will see a logo around 50–60px tall, which is fine, but the 88px constraint is unusually permissive.
- Dashboard stat tiles at default `p-6` look generous — too much air between the icon and the number.

**Recommended spacing principles:**
- Establish a `pt-4 sm:pt-6` convention between PageHeader and the first content section.
- Use `p-4` as the default for all information-dense cards (stat tiles, list cards, table cards).
- Reserve `p-6` for marketing/hero sections only.
- Target 68–80px per planner cell row.

---

### 4.2 Tablet (640–1023px)

**Strengths:**
- The `sm` breakpoint switches planner from single-day to 7-column grid — the threshold is aggressive (640px is a small tablet).
- PageHeader center-column content (week selector, stat bar) hides on mobile and shows from `sm` — this collapses gracefully.
- The `hidden md:block` desktop sidebar does not appear at tablet, so the sidebar column doesn't compete.

**Weaknesses:**
- At 640–768px, the planner grid min-width of `900px` inside `overflow-x-auto` forces horizontal scroll. This is functional but not ideal UX — users must scroll left-right inside an already-scrolling page.
- Shopping workspace at tablet width: the side-panel approach creates columns that are too narrow to be useful (sub-250px at 640px viewport).
- The cookbook grid at tablet (2 columns) works but action toolbars on touch tablets hit the 28px touch target problem.
- Profile `SettingRow` touch targets (24px) are below minimum.

**Recommended spacing principles:**
- Consider a 4-day-view planner at 640–900px before switching to 7-column with horizontal scroll.
- Side panels on tablet should stack below rather than aside.
- Touch target minimum: `min-h-[44px]` on all interactive rows and icon buttons at tablet breakpoints.

---

### 4.3 Mobile (< 640px)

**Strengths:**
- The mobile planner (single-day card with day tabs) is the correct mobile-first design. Avoiding the 7-column grid at mobile is the right call.
- Long-press action sheet for planner meal cards is a good pattern — avoids nested touch targets.
- The mobile bottom nav at 7 items (`min-w-[44px] min-h-[44px]`) meets the 44px minimum per item.
- `.main-safe { padding-bottom: calc(safe-area-inset-bottom + 80px) }` correctly clears the bottom nav + safe area.
- PageHeader auto-collapse after 4s and scroll-driven collapse maximises content canvas.
- `backdrop-blur-xl` on the mobile nav creates visual separation from content.

**Weaknesses:**
- Mobile bottom nav label `text-[9px]` is critically small. At 9px on a 375px phone, labels like "Cookbook", "Planner", "Analyser" are at the limit of comfortable reading without glasses. This is below industry accessibility guidance (minimum 11px for UI labels).
- The mobile planner day tab row (`flex items-center gap-1`) with 7 days is very tight. At 320px viewport, 7 tabs at ~40px each = 280px + 24px gap = 304px. The container is likely `flex-nowrap` so it fits but the individual taps are narrow.
- `NeedQuantityControl` inputs at `h-6` (24px) — only 24px touch area on mobile.
- Profile `SettingRow` (`py-3`) = 24px — well below the 44px minimum.
- The quick-add meal form in mobile planner (`h-7` input, `h-7 w-7` buttons) is 28px — borderline.
- Mobile cookbook action icon buttons in the action toolbar: at 28px (`h-7 w-7`), these are rendered on mobile behind the long-press sheet, but on a narrow tablet at the `sm` breakpoint they appear as the visible CTA.

**Recommended spacing principles:**
- Raise mobile nav labels to `text-[10px]`.
- All interactive rows on mobile: `min-h-[44px]`.
- Input controls on mobile: `h-9` (36px) minimum, ideally `h-10` (40px).
- Quick-add inputs: `h-8` minimum.
- Consider 5-item mobile nav (hide least-used items behind overflow menu) vs current 7-item approach to give each item more width.

---

## SECTION 5 — PRIORITISED IMPROVEMENTS

### Quick Wins (< 1 day)

| # | Description | Benefit | Risk | Effort |
|---|---|---|---|---|
| QW-1 | Planner desktop cell padding: `p-1.5` → `p-2`, min-height: `min-h-[56px]` → `min-h-[68px]` | Grid feels calmer, content has breathing room | Low — no layout breakage expected | 1–2h |
| QW-2 | Planner stats row: `mb-2 gap-y-1` → `mb-3 gap-y-2` | Less cramped header zone | Low | 30min |
| QW-3 | Planner desktop meal name: `text-xs` → `text-sm` in `DroppablePlannerCell` content | Easier to read at laptop sizes | Low | 30min |
| QW-4 | Planner status icons: `h-2.5 w-2.5` → `h-3 w-3` (desktop), `h-3 w-3` → `h-3.5 w-3.5` (mobile) | Icons become visible rather than hunted | Low | 30min |
| QW-5 | Mobile bottom nav labels: `text-[9px]` → `text-[10px]` in `MobileNavItem` | Legibility improvement, accessibility | Low | 15min |
| QW-6 | Add `min-h-[44px]` to Profile `SettingRow` trigger button | Touch compliance on mobile | Low | 15min |
| QW-7 | Pantry `NeedQuantityControl` inputs: `h-6` → `h-8` | Touch compliance on mobile | Low | 15min |
| QW-8 | Add `pt-4 sm:pt-6` to planner content wrapper (`max-w-screen-xl mx-auto` div) | Clear breathing space below header | Low | 15min |

---

### Medium Improvements (1–3 days)

| # | Description | Benefit | Risk | Effort |
|---|---|---|---|---|
| M-1 | Unify chip height to a standard: `h-[20px] text-[11px] px-2 rounded-full` | Visual grammar — chips mean one thing | Medium — touches many files | 1 day |
| M-2 | Standardise `CardHeader` and `CardContent` overrides across data-card contexts to `p-4` | Less inflated cards, more content per scroll | Medium — many call sites | 1 day |
| M-3 | Adopt `.title-section` utility in PageHeader instead of `text-[22px]` | Token hygiene, searchable class name | Low | 2h |
| M-4 | Complex planner/meal dialog: add `max-w-2xl` variant for information-rich dialogs | Less content squeeze in meal-detail overlays | Low | 2h |
| M-5 | Cookbook grid card padding: override to `p-4` instead of default `p-6` | Cards feel less inflated, grid more scannable | Low | 2h |
| M-6 | Cookbook action toolbar touch targets: `h-7 w-7` → `h-9 w-9` with negative margin | Touch compliance on tablets | Low | 2h |
| M-7 | Dashboard stat tiles: `CardContent` `p-4` override instead of `p-6` | Premium tighter feel for stat tiles | Low | 1h |
| M-8 | Planner row label icon: `h-3 w-3` → `h-3.5 w-3.5` and shopping basket icon `h-5 w-5` → `h-4 w-4` | Visual consistency in row label column | Low | 30min |
| M-9 | Add `pt-4 sm:pt-6` consistently to all page content wrappers below PageHeader | Uniform breathing across all pages | Low | 1h |

---

### Larger Improvements (> 3 days)

| # | Description | Benefit | Risk | Effort |
|---|---|---|---|---|
| L-1 | Activate `--space-*` CSS token system — replace raw Tailwind spacing values in components | Token-driven spacing, future theming | High — touches every component | 3–5 days |
| L-2 | Unify `Card` border-radius: `rounded-xl` → `rounded-lg` (12px) to match `--radius` and config | Consistent radius across system | Low visual risk, systemic change | 2 days |
| L-3 | Planner tablet experience: 4-day view at 640–900px before full 7-column | No horizontal scroll on tablet planner | Medium — new layout state | 3 days |
| L-4 | Shopping workspace row redesign for mobile: stacked item cards instead of table rows | Touch-friendly shopping mode | Medium — significant layout change | 3–5 days |
| L-5 | Define `.text-body` utility and audit all `text-sm` uses for intentionality | Typography system completeness | Low risk | 1 day |
| L-6 | Mobile bottom nav: reduce to 5 primary items, secondary items behind `+More` | Each item wider, more legible labels | Medium — navigation restructure | 2–3 days |
| L-7 | Consider "Comfortable" vs "Compact" density toggle for the planner (user preference) | Serves both high-density power users and casual families | Medium complexity | 3–4 days |

---

## APPENDIX — RAW FINDINGS REFERENCE

### CSS Design Token Status

| Token | Defined | Used in components |
|---|---|---|
| `--space-1..8` | Yes (`index.css`) | No |
| `--radius` | `0.75rem` | Partial (`input`, `ring-offset`) — Card uses `rounded-xl` (16px) not the token |
| `--topbar-h` | `60px` mobile, `44px` desktop | Yes — layout logic |
| `--orchard-opacity` | `0.72` light, `0.18` dark | Yes — OrchardBackdrop |
| `--realm-accent/text/bg/border` | Yes | Yes — `data-realm` blocks |
| `--basket-realm` | Yes | Used in basket realm styles |
| `--font-sans` / `--font-display` | Yes | Yes — body and headings |

### Typography Utility Adoption

| Utility | Defined | Used |
|---|---|---|
| `.title-page` (32/38px) | Yes | Not found in components |
| `.title-section` (22/28px) | Yes | Not found in components; PageHeader uses `text-[22px]` |
| `.title-card` (16/22px) | Yes | Not found in components |
| `.text-table` (13/18px) | Yes | Used in `.calm-table` |
| `.text-numeric` (18/24px) | Yes | Limited use |

### Component Padding Reference

| Component | Default padding | Most common override |
|---|---|---|
| `CardHeader` | `p-6` | `p-4` (many data cards) |
| `CardContent` | `p-6 pt-0` | `p-4` or custom |
| `CardFooter` | `p-6 pt-0` | Uncommon |
| `DialogContent` | `p-6` | `sm:max-w-[600px]` override common |
| Mobile slot | `p-3` | — |
| Desktop planner cell | `p-1.5` | — |
| Profile SectionGroup | `px-3 py-2` | — |
| Profile SettingRow | `py-3` | — |

### Touch Target Compliance Summary

| Surface | Size | Pass/Fail (44px min) |
|---|---|---|
| Mobile bottom nav | `min-h-[44px]` | Pass |
| Sidebar nav items | ~36px | Fail (mobile) |
| Pantry NeedQuantity inputs | 24px | Fail |
| Cookbook action buttons | 28px | Fail (tablet touch) |
| Profile SettingRow | 24px | Fail (mobile) |
| Planner `+ Add` text links | No explicit target | Fail |
| Planner quick-add inputs | 28px (`h-7`) | Fail |
| `size="icon"` button | 36px (`h-9 w-9`) | Marginal |

---

*Investigation complete. No application code modified. No design tokens changed. No components created or altered.*  
*Rollback: `git checkout rollback/ui-density-audit-20260616-0000`*
