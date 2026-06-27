# WX9.4 — Unified Workspace Header Architecture Investigation

**Date:** 2026-06-26
**Type:** Architecture investigation — read only. No code modified.
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Preceding work:** WX9.3 above-the-fold optimisation, THA UI Density & Breathing Space Audit (2026-06-16)

---

## Executive Summary

The Healthy Apples uses a two-layer authenticated header: a global `TopBar` and a per-page `PageHeader`. Together these consume **142–190px** of persistent vertical chrome on desktop before any primary content is visible. The TopBar's logo at `max-h-[88px]` is the single largest space consumer — a generous branding choice that made sense during early product development but is now the dominant constraint on content-above-the-fold.

This investigation examines whether the application would benefit from evolving to a unified workspace header. The answer is yes, with important nuance: the logo treatment should change, not be abandoned.

**Recommended direction: Option B — Unified Workspace Header at 56px** with the logo retained prominently but at a scale appropriate for an authenticated productivity workspace rather than a marketing page.

---

## 1. Current Layout Architecture

### 1.1 Authenticated Page Stack

Every authenticated page is rendered inside `ProtectedRoute` (`App.tsx:124–164`) which assembles:

```
┌─────────────────────────────────────────────────────────────────┐
│  [TrialBanner]  — demo users only, py-2.5 = ~40px total        │
├─────────────────────────────────────────────────────────────────┤
│  TopBar  — sticky z-50                                          │
│  bg-card/60 backdrop-blur-md border-b py-0.5                   │
│  Desktop: logo max-h-[88px] → rendered ~90px                   │
│  Mobile:  h-14 = 56px                                          │
├─────────────────────────────────────────────────────────────────┤
│  [SiteBanner]  — admin-controlled, py-2.5 = ~40px total        │
├─────────────────────────────────────────────────────────────────┤
│  DesktopSidebar (220px) │ <main> overflow-y-auto               │
│                         │  ┌───────────────────────────────┐   │
│                         │  │ PageHeader — sticky z-40      │   │
│                         │  │ py-2.5 sm:py-3                │   │
│                         │  │ Single row: ~52px             │   │
│                         │  │ 2-row (tabs/controls): ~88px  │   │
│                         │  ├───────────────────────────────┤   │
│                         │  │ Page content — py-3 sm:py-4  │   │
│                         │  └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 TopBar Contents

**File:** `client/src/components/nav-bar.tsx:368`

| Position | Content | Notes |
|---|---|---|
| Left | Dashboard icon link (h-10), Search button (h-10) | Two 40px touch targets |
| Center | Logo: `max-h-[88px] max-w-[700px]` | Drives topbar height |
| Right | Basket (h-10) + Apple menu dropdown | Badge on basket for item count |

The sidebar (`DesktopSidebar`) handles page-to-page navigation: Quick List, Cookbook, Planner, Pantry, Analyser, Shop, My Diary. The TopBar handles global utilities: search, shopping basket, account.

### 1.3 PageHeader Contents

**File:** `client/src/components/PageHeader.tsx`

| Prop | Purpose |
|---|---|
| `title` | Page name rendered at text-[22px] font-semibold |
| `icon` | Realm icon (h-5 w-5 = 20px) |
| `realm` | Drives colour: cookbook=wheat, planner=teal, pantry=orchard, etc. |
| `context` | Subtitle text-xs below title |
| `actions` | Right-aligned action buttons |
| `center` | Center column, triggers 2-row layout (tabs, workspace controls) |
| `meta` | Status line below center row |
| `controlBar` | Full-width control strip below all rows |

The component has a mobile scroll-collapse: auto-collapses after 4s idle, scroll-driven expand/collapse thereafter. Desktop never collapses.

### 1.4 Vertical Space Budget per Viewport

Measured at steady state (no TrialBanner, no SiteBanner):

| Viewport | TopBar | PageHeader (simple) | PageHeader (2-row) | Content gap | Total before content |
|---|---|---|---|---|---|
| 1920×1080 | 90px | 52px | 88px | 16px | **158px / 194px** |
| 1440×900 | 90px | 52px | 88px | 16px | **158px / 194px** |
| 1366×768 | 90px | 52px | 88px | 16px | **158px / 194px** |
| Mobile 390×844 | 56px | 44px | 80px | 12px | **112px / 148px** |

The desktop budget is viewport-height-independent — it consumes the same 158–194px regardless of whether the display is 768px or 1080px tall. On a 768px display, 194px is 25% of the screen dedicated to chrome before any content.

### 1.5 Pre-content Vertical Space by Page

| Page | PageHeader type | Total chrome (desktop) | Content available at 1440×900 |
|---|---|---|---|
| Dashboard | Single row, no context | 158px | 742px |
| Cookbook | 2-row (mode selector) | 194px | 706px |
| Planner | Single row + meta | ~168px | 732px |
| Pantry | 2-row (category tabs) | 194px | 706px |
| Shopping Basket | 2-row (sort/filter) | 194px | 706px |
| Shopping Workspace | 2-row + controlBar | ~220px | 680px |
| Meal Detail | Single row, collapsible | 158px | 742px |
| My Diary | 2-row (date nav) | 194px | 706px |
| Nutrition Report | Manual layout | ~130px | 770px |
| Food Detail | Manual layout | ~130px | 770px |
| Profile | Single row | 158px | 742px |
| Quick List | Single row + actions | 158px | 742px |

---

## 2. Workspace Header Concept

A unified workspace header merges TopBar and PageHeader into a single sticky band. The key question is which elements can coexist at that reduced height, and which elements need reordering.

### 2.1 Element Inventory

Across all pages, the combined header elements are:

**Global (TopBar today):**
- Logo / brand identity
- Search (modal trigger)
- Shopping basket (with count badge)
- Account / profile menu
- Dashboard shortcut

**Per-page (PageHeader today):**
- Page title (text-[22px])
- Realm icon
- Context subtitle
- Actions (vary per page)
- Center: tabs, mode selectors, date navigation
- Meta: status line
- Control bar (Shopping Workspace only)

**Per-page navigation (Sidebar today):**
- Quick List, Cookbook, Planner, Pantry, Analyser, Shop, My Diary

### 2.2 What Can Coexist in One Bar

At 56px with typical desktop widths (1366–1920px), the following coexist comfortably:

```
[Logo 36px] [Page title + icon] ... [Page actions] [Search] [Basket] [Profile]
```

Width budget at 1440px: ~1220px usable (accounting for sidebar). Even with logo (150px), title (200px), actions (160px), global utilities (120px), there remains ~590px of flex space.

At 1366px with expanded sidebar removed (collapsed 64px): ~1250px usable — similar result.

### 2.3 What Does Not Coexist Without Trade-offs

- **2-row layouts** (Cookbook mode selector, Pantry tabs, Shopping controls): a second row is still needed for workspace-class pages. This is not eliminated by unification — it becomes a second toolbar below the unified header.
- **The controlBar** (Shopping Workspace): three-layer layouts have genuine complexity and likely remain three-layer regardless of architecture.
- **The context subtitle**: 12px text below the title in a compressed header is visually very tight. It either moves to a tooltip or is dropped.

---

## 3. Branding Analysis

### 3.1 Current Logo Treatment

The logo (`/logo-long.png`) is a wide horizontal lockup at `max-h-[88px]`. This makes the TopBar approximately 90px tall — 40–50px taller than equivalent premium applications (Linear: ~48px, Notion: ~44px, Figma: ~40px).

The 88px max-height was appropriate when the application was new: the brand needed presence, users needed to feel the app had identity. After months of use, authenticated users recognise The Healthy Apples without needing the logo to dominate.

### 3.2 Logo in a Reduced Header

At `max-h-[36px]` the logo remains fully legible as a horizontal lockup. At `max-h-[40px]` it has slightly more visual presence. At `max-h-[88px]` in a 56px header it is simply clipped.

Premium SaaS precedents (Notion, Linear, Figma, Asana) uniformly reduce their brand lockups to 24–32px within authenticated workspaces. Users recognise the brand from the realm colours, the orchard backdrop, the typography, and the content — not the header height.

### 3.3 Branding Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Logo feels smaller | Low | Logo is still present and prominent at 36–40px |
| Application feels less distinctive | Low | Realm colour system and orchard backdrop carry the brand |
| First-time users miss brand identity | Low | Logo appears on every page; onboarding has full branding |
| Dashboard feels like a utility app | Medium | Preserve premium card styling, backdrop, typography |
| Brand inconsistency with marketing site | Low–Medium | Update marketing screenshots; authenticated ≠ marketing |

Brand identity is carried by: the orchard backdrop, the realm colour system, DM Sans/Inter typography, the card frosting, the calm intelligence language. Reducing the logo from 88px to 36–40px does not materially reduce brand presence in an application used daily.

---

## 4. Architectural Options

### Option A — Current Architecture with Incremental Refinement

Keep TopBar and PageHeader as separate layers. Make targeted improvements:

1. Reduce TopBar logo from `max-h-[88px]` to `max-h-[48px]` → saves ~40px
2. Reduce PageHeader to `py-2` → saves 4px (marginal after WX9.3)
3. Collapse context subtitle to tooltip-on-hover for power users

**Resulting chrome:** 50px (TopBar) + 48px (PageHeader) + 16px (content gap) = **114px**
**Space recovered vs. today:** ~44px (28%)

**Advantages:**
- Zero routing or component architecture changes
- Logo change is a 2-line CSS edit
- No regression risk
- Incremental — reviewable in isolation

**Disadvantages:**
- Two sticky bands remain (minor visual discontinuity)
- PageHeader still a separate system from global navigation
- Does not address the architectural question — just patches the symptom
- Context subtitle loss requires separate UX work

**Engineering effort:** XS (hours)

---

### Option B — Unified Workspace Header (Recommended)

Merge TopBar and PageHeader into a single `WorkspaceHeader` component at 56px.

**Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 56px unified workspace header (sticky z-50)                    │
│ [Logo 36px] [PageTitle + RealmIcon] ... [Actions] [🔍][🛒][👤] │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ [WorkspaceToolbar — only on 2-row pages] ~40px                 │
│ Tabs, mode selectors, date pickers, control bars               │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Page content — immediately visible                             │
└─────────────────────────────────────────────────────────────────┘
```

**Height budget:**

| Viewport | Unified header | Toolbar (workspace pages) | Content gap | Total |
|---|---|---|---|---|
| All desktop | 56px | 0px or 40px | 8px | **64px / 104px** |
| Mobile | 48px | 0px or 36px | 8px | **56px / 92px** |

**Space recovered vs. today:**
- Simple pages: 158px → 64px = **94px recovered (59%)**
- Workspace pages: 194px → 104px = **90px recovered (46%)**

**Logo treatment:** `max-h-[36px]` within the 56px bar. Still prominent, consistent with premium SaaS standards.

**Realm identity:** The realm colour is applied to the header background (as today), the title, and the toolbar. The colour system fully survives.

**Global utilities integration:** Search, basket, and profile move to the right side of the unified bar. These already appear on the right in TopBar — the position is unchanged, only the layer collapses.

**Dashboard shortcut:** Clicking the logo navigates home. The explicit Dashboard icon button (LayoutDashboard) can be dropped — the logo fulfils this role, as in every SaaS application.

**Mobile impact:** The unified header at 48px is more space-efficient than the current 56px mobile TopBar + 44px PageHeader (100px total). Collapses to 48px sticky + bottom nav — genuinely better on small screens. The scroll-collapse behaviour of PageHeader can move to the WorkspaceToolbar on workspace pages.

**Advantages:**
- 94px recovered on most pages — first meaningful content appears much earlier
- Single sticky band reduces visual noise and cognitive overhead
- Simpler component tree: one header component instead of two coordinated sticky bands
- Consistent with every productivity tool users use daily (Notion, Linear, Figma, GitHub)
- Mobile improves proportionally
- Opens path to keyboard navigation and command palette integrations

**Disadvantages:**
- Context subtitle (e.g., "Your health journey at a glance") requires new treatment — tooltip, page intro card, or removal
- Global utilities and page actions share the same bar — requires careful right-side ordering
- Existing PageHeader consumers (16 pages) need migration
- Sidebar relationship changes: sidebar no longer has a sibling top bar, it has a sibling header bar — minor but touches layout CSS
- Realm colour must apply to a combined element; needs design review to confirm it reads as "calm" not "busy"

**Engineering effort:** M (2–4 days). The PageHeader component is well-isolated and clearly owned. Migration is mechanical but thorough.

---

### Option C — Hybrid: Reduced TopBar + Streamlined PageHeader

Reduce the TopBar logo to `max-h-[44px]` and keep PageHeader, but constrain it to a fixed 40px height with no context subtitle, no collapsing behaviour, and no 2-row layout. Workspace controls move to an inline toolbar within the page content, not the sticky header.

```
┌─────────────────────────────────────────────────────────────────┐
│ TopBar (reduced) — ~48px                                       │
│ Logo max-h-[44px] + py-1 = 46px                               │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ PageHeader (fixed density) — 40px                              │
│ [Icon + Title] ... [Actions]                                   │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Page content (workspace controls inline, not sticky)           │
└─────────────────────────────────────────────────────────────────┘
```

**Height:** 48px + 40px + 8px = **96px total**
**Space recovered vs. today:** 158px → 96px = **62px recovered (39%)**

**Advantages:**
- Less disruptive than full unification
- Logo reduction alone saves ~42px
- Workspace controls scrolling (not sticky) is valid for most pages
- No routing or layout shell changes required

**Disadvantages:**
- Two sticky bands remain — two distinct visual layers, two z-indexes
- Workspace controls going non-sticky breaks Cookbook, Pantry, and My Diary specifically — users rely on tabs remaining accessible while scrolling
- The result is still visually two-layered; it solves the space problem partially but not the architectural question
- The remaining 96px of chrome is not significantly better than 104px (Option B workspace pages)

**Engineering effort:** S (half day to a full day)

---

### Option D — Transparent Sticky Header with Contextual Reveal

The header is 0px tall at rest. Logo and global utilities reveal at the top of the viewport only when the user scrolls up or hovers near the top edge. Page title and realm colour are embedded as the first element of each page's content, not in a sticky layer.

This approach is used by some editorial/publishing products (Substack, Medium).

**Advantages:**
- Maximum content immediately visible
- Dramatic on first impression

**Disadvantages:**
- Navigation discoverability collapses — users cannot find Cookbook or Planner without scrolling up
- The basket item count badge becomes hidden by default
- Violates expected behaviour for productivity tools
- Accessibility: users relying on keyboard navigation or screen readers expect persistent navigation landmarks
- Not compatible with THA's multi-realm workspace model

**Engineering effort:** L, with high UX risk.
**Assessment: Not recommended for THA.**

---

## 5. Per-Page Assessment

| Page | Benefits from unification | Notes |
|---|---|---|
| Dashboard | High | Most-visited page; recovering 94px means metrics and recent meals appear immediately |
| Cookbook | High | Mode selector moves to WorkspaceToolbar at 40px; net improvement significant |
| Planner | High | Planner grid is the primary surface; 94px recovered returns it closer to full canvas |
| Pantry | High | Category tabs move to WorkspaceToolbar; no functional loss |
| Shopping Basket | High | Sort/filter controls move to WorkspaceToolbar; content visible sooner |
| Shopping Workspace | Medium | Still 3-layer (header + toolbar + controlBar); modest improvement |
| Meal Detail | High | Recipe content visible much sooner; mobile especially benefits |
| My Diary | High | Date navigation moves to WorkspaceToolbar; immediately shows charts |
| Nutrition Report | Low | Already has manual layout without PageHeader; minimal impact |
| Food Detail | Low | Already has manual layout without PageHeader; minimal impact |
| Profile | Medium | Settings form visible sooner; modest practical impact |
| Quick List | High | Text input visible immediately; reduces friction for high-frequency action |
| Analyser | High | Search and results visible immediately |

Pages that do not use PageHeader today (Nutrition Report, Food Detail) are unaffected by the header architecture choice. They may benefit from consistent adoption of the unified header pattern but that is out of scope here.

---

## 6. User Experience Assessment

### Benefits

**Earlier access to primary content.** On Dashboard, the first intelligence card and recent meals grid would be visible at page load without scrolling. On Planner, the week grid would start at ~104px from the top rather than ~194px, recovering approximately 1.5 planner rows in immediate view.

**Reduced scrolling.** On 1440×900, recovering 90px means approximately one full card row of content becomes permanently above the fold. On 1366×768 this is proportionally more significant — 90px is 12% of the viewport.

**Improved focus.** A single sticky band is less visually noisy than two. The eye naturally settles on one horizontal stripe rather than parsing two distinct layers at the top of each page. This aligns with THA's "calm premium" positioning.

**Stronger hierarchy.** With one authoritative header layer, the content area feels like the entire canvas. This matches how users use productivity tools they describe as "focused."

**Mobile harmony.** The current 100px of mobile chrome (TopBar 56px + PageHeader 44px) compresses to 48px. This is transformative on a 390px-wide phone screen.

### Disadvantages and Risks

**Context subtitle loss.** Subtitles such as "Your health journey at a glance" (Dashboard) and "No pressure. Just clearer choices." (My Diary) are part of THA's tone of voice. In a 56px unified header there is no room for them. Options: remove (simplest), tooltip on title hover (reduced reach), move to first-content-element on each page (preserves copy but breaks consistency), or collapse to status metadata. This is the most significant UX regression to manage.

**Actions crowding.** On pages with multiple action buttons (Cookbook: New Meal, Import, Filter; Shopping Workspace: stage controls), the right side of the unified header can become crowded. This requires action priority rules: primary actions always visible, secondary actions in an overflow menu. This is additional UX design work.

**Realm colour on shared header.** Today the realm colour is the background of the PageHeader only — the TopBar always uses `bg-card/60`. In Option B the entire unified header changes colour per page. This is likely pleasing (stronger identity per section) but needs visual validation.

---

## 7. Architectural Impact

### Routing Impact

None. The layout shell is in `App.tsx` `ProtectedRoute` which wraps every authenticated route. A layout change there affects all authenticated routes uniformly. No route-level changes are required.

### Component Impact

| Component | Action | Complexity |
|---|---|---|
| `TopBar` (`nav-bar.tsx:368`) | Extract global utilities (search, basket, profile) into reusable hooks/subcomponents; deprecate outer wrapper | Medium |
| `PageHeader` (`PageHeader.tsx`) | Merge title/realm/actions into `WorkspaceHeader`; extract center/meta/controlBar into `WorkspaceToolbar` | Medium |
| `ProtectedRoute` (`App.tsx:124`) | Replace `<TopBar /> + <PageHeader>` pattern with `<WorkspaceHeader>` | Small |
| Per-page consumers (16 pages) | Update props to new component interface | Mechanical; low risk per page |
| `DesktopSidebar` | No change to sidebar itself; sibling relationship changes from `TopBar` to `WorkspaceHeader` | None |
| `MobileNav` | No change | None |

The new `WorkspaceHeader` receives realm and page-level props from each page — same data flow as today. No state architecture changes.

### Shared Layout Implications

The current pattern passes `realm`, `title`, `icon`, `actions`, and `center` to `PageHeader` at the page level. The unified header would accept the same props but render them in a single component. The interface simplifies rather than complicates.

The one architectural novelty: the unified header must be aware of its own global state (basket count, user session) AND the per-page state (title, realm). Today these are in separate components. The `WorkspaceHeader` would import both, as `TopBar` currently does for basket count and user session. This is straightforward — the data dependencies already exist in the application.

### Maintenance Implications

**Simplification.** One component to understand instead of two. One sticky position to debug. One CSS z-index layer. One realm colour application point. The scroll-collapse logic currently in `PageHeader` can be removed entirely — there is nothing to collapse in a fixed 56px bar.

**Migration cost.** 16 pages must be updated to pass props to `WorkspaceHeader` rather than `PageHeader`. Most changes are mechanical. The `center` prop pattern must be reviewed — pages using `center` for tabs (Pantry, Cookbook) will instead use `WorkspaceToolbar` as a separate component below the header.

### Responsiveness Implications

The current two-layer system already handles responsive breakpoints at `md` (768px). The unified header would inherit the same breakpoints. Mobile would use a single 48px band with the same right-side utilities; the bottom nav handles page navigation on mobile as it does today. WorkspaceToolbar on mobile would be horizontally scrollable if tab count exceeds viewport — the same pattern used by Cookbook's mobile tab row today.

---

## 8. Wireframes

### Current State (desktop 1440×900)

```
0px   ┌──────────────────────────────────────────────────────┐
      │  TOPBAR (90px) — sticky z-50                        │
      │  [⊞] [🔍]    🍏 THE HEALTHY APPLES    [🛒7] [●]   │
90px  ├──────────────────────────────────────────────────────┤
      │ SIDEBAR (220px) │                                    │
      │ ─────────────── │  PAGE HEADER (52–88px) — sticky   │
      │ Quick List      │  [🍳 Cookbook]           [+ New]  │
      │ Cookbook        │  ─ ─ ─ [List | Grid] ─ ─ ─ ─ ─   │
      │ Planner         │                                    │
178px │ ...             ├────────────────────────────────────┤
      │                 │  Content padding (16px)            │
      │                 │                                    │
194px │                 │  PRIMARY CONTENT BEGINS HERE       │
      │                 │                                    │
900px └─────────────────┴────────────────────────────────────┘
```

### Option A — Incremental (logo reduced to 48px)

```
0px   ┌──────────────────────────────────────────────────────┐
      │  TOPBAR (52px) — sticky z-50                        │
      │  [⊞] [🔍]     🍏 Healthy Apples    [🛒7] [●]      │
52px  ├──────────────────────────────────────────────────────┤
      │ SIDEBAR (220px) │  PAGE HEADER (52–88px) — sticky   │
      │                 │  [🍳 Cookbook]           [+ New]  │
      │                 │  ─ ─ ─ [List | Grid] ─ ─ ─ ─ ─   │
104px │                 ├────────────────────────────────────┤
      │                 │  Content padding (16px)            │
      │                 │                                    │
120px │                 │  PRIMARY CONTENT BEGINS HERE       │
      │                 │                                    │
900px └─────────────────┴────────────────────────────────────┘
```

Space recovered: 74px vs today on simple pages.

### Option B — Unified Workspace Header (Recommended)

```
0px   ┌──────────────────────────────────────────────────────┐
      │  WORKSPACE HEADER (56px) — sticky z-50              │
      │  🍏  🍳 Cookbook          [+ New] [🔍] [🛒7] [●]  │
56px  ├──────────────────────────────────────────────────────┤
      │ SIDEBAR (220px) │  WORKSPACE TOOLBAR (40px, optional)│
      │                 │  [All meals] [Favourites] [Recent] │
96px  │                 ├────────────────────────────────────┤
      │                 │  Content padding (8px)             │
      │                 │                                    │
104px │                 │  PRIMARY CONTENT BEGINS HERE       │
      │                 │                                    │
900px └─────────────────┴────────────────────────────────────┘
```

Space recovered: 90px (workspace pages) — 94px (simple pages) vs today.

### Option C — Hybrid Reduced TopBar + Fixed PageHeader

```
0px   ┌──────────────────────────────────────────────────────┐
      │  TOPBAR (48px) — sticky z-50                        │
      │  [⊞] [🔍]    🍏 Healthy Apples    [🛒7] [●]       │
48px  ├──────────────────────────────────────────────────────┤
      │ SIDEBAR (220px) │  PAGE HEADER (40px) — sticky      │
      │                 │  [🍳 Cookbook]              [+ New]│
88px  │                 ├────────────────────────────────────┤
      │                 │  Content (tabs now non-sticky)     │
96px  │                 │  PRIMARY CONTENT BEGINS HERE       │
      │                 │                                    │
900px └─────────────────┴────────────────────────────────────┘
```

Space recovered: 62px vs today. Tabs non-sticky is a usability regression.

---

## 9. Estimated Vertical Space Savings

| Option | Simple pages | Workspace pages | Mobile |
|---|---|---|---|
| Baseline (today) | 158px | 194px | 100px |
| A — Logo reduction only | 114px (–44px) | 150px (–44px) | 100px (unchanged) |
| B — Unified workspace header | 64px (–94px / **–59%**) | 104px (–90px / **–46%**) | 56px (–44px / **–44%**) |
| C — Hybrid | 96px (–62px / –39%) | 96px (–98px)* | 80px (–20px) |
| D — Contextual reveal | ~0px | ~0px | ~0px |

*Option C moves workspace controls non-sticky, which reduces measured chrome but introduces usability regression.

---

## 10. Risks

### Branding Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Logo perceived as "smaller" | High | Low | Frame as intentional polish; publish design rationale |
| Brand feel shifts from premium to utility | Medium | Medium | Preserve orchard backdrop, realm colours, DM Sans |
| Marketing screenshots become outdated | High | Low | Schedule screenshot refresh |

### Discoverability Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Users cannot find navigation | Low | High | Sidebar is unchanged; bottom nav unchanged |
| Basket count not visible | Very low | Medium | Basket icon retains count badge in unified header |
| Context subtitle provides orientation for new users | Medium | Low–Medium | Preserve in first-content element or page intro card |

### Accessibility Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Single ARIA `role=banner` instead of two header elements | Low | Low | Unified header is architecturally cleaner for screen readers |
| Focus management: topbar-then-pagheader focus order changes | Low | Low | Single header simplifies tab order |
| Reduced logo alt text prominence | Very low | Very low | Alt text unchanged |

### Responsiveness Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Workspace toolbar overflows on tablet | Medium | Medium | Horizontally scroll tab row on md and below |
| Actions crowd on small desktop | Medium | Medium | Priority-hide secondary actions behind overflow menu |
| WorkspaceToolbar on mobile requires design review | Medium | Low | Toolbar collapses or scrolls same as current Cookbook tabs |

### Implementation Complexity

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Realm colour on full unified header requires visual review | High | Low | Spike with two pages before full rollout |
| 16-page migration introduces regressions | Medium | Medium | Page-by-page migration with visual snapshots |
| Scroll-collapse logic retirement breaks mobile expectation | Low | Low | Mobile UX improves; existing collapse was compensatory, not additive |

---

## 11. Recommendation

### Recommended direction: Option B — Unified Workspace Header

**Why:**

The current 90px TopBar was designed at a time when brand establishment mattered more than productivity. The logo at `max-h-[88px]` is generous — it communicates confidence in the product. That confidence now needs to express itself through product quality, not header height.

A unified 56px workspace header recovers 90–94px on every page. On the most important pages (Dashboard, Planner, Cookbook), this is transformative: the planner grid, the meal cards, and the health metrics are all visible without any scrolling at 1440×900. At 1366×768 — the lowest target viewport — this recovery moves the application from "scroll to find content" to "content is immediately present."

The change is architecturally consistent with every productivity application users trust daily. It reduces component complexity (one sticky band instead of two). It improves mobile experience without any additional mobile-specific work.

The logo is not discarded — it is reduced from 88px to 36px. It remains prominent in the same position. The brand identity is carried by the realm colour system, the orchard backdrop, the typography, and the quality of the intelligence content — all of which are unchanged.

**Expected user benefit:**

- Dashboard: recent meals and intelligence cards visible on load at 1440×900
- Planner: approximately 1.5 additional week rows visible without scrolling
- Cookbook: meal grid starts ~90px sooner; more cards above the fold
- Mobile: 44px recovered — equivalent to one full meal card in height
- Users perceive the application as faster (content appears earlier) even with identical data loading time

**Expected engineering effort:**

M — approximately 2–4 days of focused implementation:
- Day 1: Design spike — visual review of unified header with realm colours across 3 representative pages
- Day 2: Build `WorkspaceHeader` and `WorkspaceToolbar` components from extracted TopBar + PageHeader parts
- Day 3: Migrate the 12 simplest pages (single-row PageHeader)
- Day 4: Migrate the 4 workspace pages (Cookbook, Pantry, Shopping, My Diary) and handle the 2-row/WorkspaceToolbar transition

The migration is mechanical, not architectural. The data flows are identical.

**Launch impact:**

The visual change is significant — the header reduces by ~60% in height. Users who noticed the previous WX9.3 spacing improvements will notice this. No functional behaviour changes: navigation, search, basket, profile, and page-level actions remain in the same relative positions. There is no learning curve.

The only noticeable loss is the context subtitle on pages that had one. Before launch, a decision should be made: remove them (simple, clean) or embed them as the first content element in the page canvas (richer, more flexibility for future evolution). Both are valid.

---

## 12. Final Answer to the Investigation Question

> If The Healthy Apples were designed today with everything we have learned over the past six months, would we still build authenticated pages using separate global headers and page banners, or is there now a better workspace architecture?

**No. Separate global headers and page banners would not be chosen today.**

The two-layer architecture was a reasonable early-product decision: establish brand identity prominently, keep concerns separated, defer complexity. That architecture has served well. The realm colour system, the mobile scroll-collapse, and the PageHeader's flexible center/meta/controlBar props are all evidence of a thoughtful system.

But the accumulated evidence — the WX9.3 viewport budget analysis, the UI density audit, the above-the-fold work on every major page — consistently points at the same constraint: the 90px TopBar driven by a logo sized for marketing, not for a daily productivity workspace.

The better architecture is a single 56px workspace header. The implementation is achievable in one sprint. The user benefit is immediate and observable. The branding risk is low and manageable.

The existing PageHeader system, including its realm colour vocabulary and flexible props, is not abandoned — it is consolidated. The work to date is the foundation; this evolution is the refinement.

---

*Investigation complete. No application code was modified.*
