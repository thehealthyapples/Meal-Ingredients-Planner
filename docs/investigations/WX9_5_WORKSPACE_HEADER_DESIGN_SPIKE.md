# WX9.5 — Workspace Header Design Spike

**Date:** 2026-06-26
**Type:** Design investigation — read only. No production code modified.
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Preceding work:** WX9.4 Unified Workspace Header Architecture Investigation (2026-06-26)

---

## Purpose

WX9.4 concluded that a unified workspace header could recover 94px of vertical chrome and recommended Option B as the strongest direction. Before committing to that architectural change, this spike explores the full design space: what does the ideal authenticated workspace header for The Healthy Apples actually look like?

This is a visual investigation. No code was changed. All outputs are design artefacts.

---

## Gallery

**Primary deliverable:** `docs/design-exploration/workspace-header/index.html`

Open in any browser. Contains all 6 concepts, all 4 pages, tab navigation, before/after comparisons, and individual concept analysis.

**Comparison board:** `docs/design-exploration/workspace-header/comparison-board.html`

All 7 header variants (including current baseline) at full width in Planner realm. Print to PDF for a portable reference.

---

## Pages Explored

Each concept was visualised on the four highest-priority workspace pages:

| Page | Realm | Header type today |
|---|---|---|
| Planner | Teal (hsl 172) | Single row + week navigation |
| My Pantry | Orchard green (hsl 118) | 2-row with category tab strip |
| Dashboard | Forest (hsl 132) | Single row, no context bar |
| Shopping | Warm brown (hsl 26) | 2-row with sort/filter controls |

---

## Vertical Space Baseline

From WX9.4. Measured at steady state (no TrialBanner, no SiteBanner):

| Viewport | TopBar | PageHeader | Total |
|---|---|---|---|
| 1920×1080 | 90px | 52–88px | **142–178px** |
| 1440×900 | 90px | 52–88px | **142–178px** |
| 1366×768 | 90px | 52–88px | **142–178px** |

On a 768px display, 178px is 23% of the screen consumed before any primary content is visible.

---

## Concepts Explored

### Concept A — Current Layout Refined

**What changes:** Logo `max-h` reduced from `88px` to `48px`. Two-band structure preserved. PageHeader unchanged.

**Visual:** TopBar ~50px (was ~90px). PageHeader 52–88px. Total: **102–138px**.

**Space recovered:** 40–54px (25–30% reduction).

**Why it works:**
- Zero architectural risk. The change is two CSS characters.
- Logo is still clearly present and legible at 48px.
- Familiar layout — no user-facing behavioural change.
- Fastest possible path to improvement. Deployable in an afternoon.

**Why it falls short:**
- Two sticky bands remain. The visual discontinuity between global chrome and page identity persists.
- Does not address the architectural debt that WX9.4 identified.
- The largest gain (logo reduction) still leaves ~104px of pre-content chrome.
- The PageHeader `context` subtitle (e.g. "Your health journey at a glance") remains squeezed.

**Branding implications:** Neutral. Logo is smaller but remains the same composition. The brand is unambiguously THA.

**Implementation effort:** XS — hours, not days. Single CSS variable change.

---

### Concept B — Unified Workspace Header ★ Recommended

**What changes:** `TopBar` and `PageHeader` merge into a single `WorkspaceHeader` component at 56px. Logo moves left to 36px. Page title + realm colour fill the centre. Global utilities (search, basket, profile) move to the right of the unified bar. On workspace pages a 40px `WorkspaceToolbar` sits below for tabs and controls.

**Visual:** Single band 56px + optional toolbar 40px. Total: **56–96px**.

**Space recovered:** 46–102px (46–59% reduction).

**Why it works:**
- The single largest space saving without removing navigation.
- Logo at 36px is still fully legible — consistent with Notion (32px), Linear (28px), Figma (30px), Asana (32px).
- Realm colour applies to the unified bar making it the most visually coherent of all concepts.
- One sticky band reduces cognitive overhead. Users see content faster and feel less chrome.
- The sidebar is preserved — navigation paradigm unchanged.
- Mobile improves: 56px header replaces 56px TopBar + 44–80px PageHeader (100–136px today) → ~56px + optional 36px = 56–92px.
- Opens a clean path to command-palette integration (⌘K) which the right side of the unified bar would naturally host.

**Why it presents challenges:**
- 16 authenticated page consumers of `PageHeader` require migration. Mechanical but thorough.
- The `context` subtitle (12px below the title today) cannot survive at 56px unless moved to a tooltip or removed. For most pages this is decorative; for a few it carries useful information.
- Right-side ordering requires care: `[page actions] [search] [basket] [profile]`. The basket badge must remain clearly visible. At 1366px with complex page actions this is tight — needs layout testing.
- The `realm colour` applies to the whole bar in this concept. That means the header changes colour on every page transition. This is the current system's behaviour too, but it is more visible in a unified bar. The effect is warm and correct, not jarring, but should be verified with the actual orchard backdrop.

**Branding implications:** Low risk. Logo is smaller but the realm colour, DM Sans typography, orchard backdrop, and card frosting collectively carry the THA identity. The authenticated workspace has outgrown the need for a 90px logo.

**Implementation effort:** M — 2–4 days. `WorkspaceHeader` component, `WorkspaceToolbar`, migration of 16 page consumers, layout shell CSS changes, mobile testing.

---

### Concept C — Symmetric Logo, Slim Identity Bar

**What changes:** Logo stays centred in a compact TopBar (~52px). Left: Search + Dashboard. Right: Basket + Profile (symmetric). Below: a slim 40px realm-coloured identity bar with page icon, title, and actions.

**Visual:** TopBar 52px + identity bar 40px. Total: **92px**.

**Space recovered:** 50–86px (35–48% reduction).

**Why it works:**
- Logo is still centred and prominent — highest brand presence of the compact concepts.
- The symmetric composition is particularly graceful at 1920px where the logo breathes.
- The identity bar at 40px is slim, functional, and clearly realm-coloured.
- Two distinct concerns (global brand vs. page identity) separated into two clear layers.

**Why it falls short:**
- Still two bands. The fundamental structural question remains unanswered.
- Logo at centre 48px is larger than needed in an authenticated workspace — the brand is already established.
- Page title in the identity bar is visually secondary to the logo, which creates an odd hierarchy: the brand is louder than the user's current context.
- Context subtitle gone (no space at 40px identity bar).

**Branding implications:** Very low risk. Most conservative logo treatment.

**Implementation effort:** S — 1–2 days. TopBar CSS changes + slim identity bar component + 16 page migrations.

---

### Concept D — Logo Left, Title Dominant

**What changes:** Single 60px bar. Logo sits left at 40px. A vertical divider separates it from the page title which fills the center at 26px bold in realm colour. Controls and global utilities share the right side.

**Visual:** Single band 60px. Total: **60px**.

**Space recovered:** 82–118px (50–66% reduction).

**Why it works:**
- The page title becomes the visual hero of the header. Users immediately know where they are.
- Single band is architecturally clean.
- Logo is present and legible — clearly THA — but correctly subordinate to context in a daily workspace.
- 60px is enough height for comfortable 26px text + padding.

**Why it presents challenges:**
- Realm colour is hard to apply to this concept. The bar is white/frosted. Only the title text is realm-coloured, so the colour system becomes textual rather than background-wash. This is a weaker brand signal than the teal/green wash in Concepts B and C.
- Right side carries page actions + search + basket + profile. At 1366px with multiple page actions this becomes dense. Requires careful grouping (page actions before a divider, then global utilities).
- Logo may feel demoted. Some users and stakeholders may interpret left-aligned at 40px as a downgrade.
- Context subtitle: no space.

**Branding implications:** Medium. The warmth and visual language remain THA, but the header is cooler (white bar) and the realm colour is less visible. Needs the orchard backdrop to compensate.

**Implementation effort:** M — 2–3 days. New single-bar component + right-side ordering system + page migrations.

---

### Concept E — Apple Mark + Horizontal Navigation

**What changes:** Removes the sidebar entirely. A single 52px bar holds: apple icon + "The Healthy Apples" wordmark left, horizontal navigation pills (Quick List | Cookbook | Planner | Pantry | Analyser | Shop | Diary) centre, global utilities right. Content spans full viewport width.

**Visual:** Single band 52px. Total: **52px**. Sidebar (220px horizontal space) also freed.

**Space recovered:** 90–126px vertically + 220px horizontal per page.

**Why it is worth exploring:**
- Most space-efficient authenticated layout possible within the SaaS pattern.
- Horizontal navigation is industry-standard (GitHub, Notion top nav, Linear).
- Content at full viewport width is genuinely premium, especially for the Planner's 7-day grid which benefits from every extra pixel.
- Realm colour can be applied to the active nav pill — still a colour signal.

**Why it is premature or problematic:**
- Removing the sidebar is a paradigm shift, not a header change. This concept solves a different problem.
- Seven navigation items at ~100px each = 700px consumed by nav alone at the centre of the bar. At 1366px with brand left + utilities right this is very tight and could clip at smaller viewports.
- The sidebar provides visual hierarchy (active state, context) that horizontal tabs at 52px cannot replicate as richly.
- Mobile requires a completely different navigation solution. The current mobile bottom nav (7 items) would need redesign.
- Engineering effort is at least a week. The sidebar, its responsive behaviour, mobile nav, and all pages depending on the layout shell would need reworking.
- The THA aesthetic is warm and layered. A horizontal-nav SaaS bar risks feeling colder and more tool-like.

**Branding implications:** Highest risk. The apple icon at 28px is not the logo — it is the app icon. "The Healthy Apples" in 13px Inter may not carry brand weight. The warmth comes from the backdrop and cards, not the header, which helps — but this is a significant visual departure.

**Implementation effort:** L — 1+ week for the layout change alone, not counting navigation re-architecture.

---

### Concept F — Brand Rail + Workspace Bar

**What changes:** Two ultra-slim layers. Layer 1 (Brand Rail, 32px): logo wordmark centred at `max-h-22px`, search + basket + profile far right. Layer 2 (Workspace Bar, 40px): realm-coloured, icon + page title left, workspace controls centre, page actions right.

**Visual:** Brand rail 32px + workspace bar 40px. Total: **72px**.

**Space recovered:** 70–106px (44–59% reduction).

**Why it works:**
- Two bands, each with a single clear job: rail = brand & utilities, workspace bar = page identity & controls.
- The most explicit separation of global and local concerns.
- Workspace bar at 40px with realm colour is highly readable and distinctive per page.
- Brand rail at 32px is minimal without being invisible — the logo is still legible at 22px.

**Why it presents challenges:**
- The brand rail at 32px with a 22px logo feels undersized. At that height the logo wordmark is very small — arguably smaller than the logo's own minimum legible size.
- Two sticky bands are managed separately. This is actually more complex than Concept B (one band) or the current two-band system (current sizes).
- The rail's visual weight is lighter than the frosted glass TopBar today. The brand may feel less present.
- Not meaningfully more space-efficient than Concept B but harder to build.

**Branding implications:** Medium. The logo is at its absolute minimum size. The realm bar compensates with identity but the brand rail may feel underpowered.

**Implementation effort:** M — 2–4 days. New two-component system + page migrations.

---

### Concept G — Editorial Chrome + Content Title

**What changes:** A single 44px chrome strip: apple icon left, breadcrumb navigation (Home › Planner) centre, global utilities right. Page title is **not sticky** — it renders as a large editorial heading inside the content scroll area and disappears as the user scrolls down.

**Visual:** 44px sticky chrome + title scrolls with content. Sticky total: **44px**.

**Space recovered:** 98–134px persistent (62–75% reduction). Title visible only when scrolled to top.

**Why it is worth exploring:**
- The most radical rethinking of the header. Content-first is editorially correct.
- At 44px, the orchard backdrop fills almost the entire viewport. The app breathes.
- Premium, calm, distinctive. Does not feel like any current SaaS tool — genuinely THA's own voice.
- Breadcrumb navigation is honest about where you are in the information hierarchy.

**Why it is problematic for a workspace app:**
- Page context is lost the moment the user scrolls. A planner, pantry, or shopping list requires frequent orientation. "Where am I?" should never require a scroll-up.
- The apple icon alone is not sufficient as a global identifier for returning users. New users and re-engagement flows need the wordmark.
- The breadcrumb navigation implies hierarchy. THA's pages are siblings, not parent/child. `Home › Planner` is technically correct but feels structurally odd.
- Workspace controls (week navigation, category tabs, sort controls) have nowhere to live. They would need to be inside the page content — losing stickiness and discoverability.
- Engineering effort is high: new layout shell, new title treatment per page, mobile is a complete redesign.

**Branding implications:** High risk. The apple icon only approach is similar to how mobile app launchers present the brand, not authenticated workspaces. While aesthetically interesting, this risks making THA feel incomplete or prototype-like on first encounter.

**Implementation effort:** L — significant redesign of layout and navigation.

---

## Cross-concept Analysis

### Vertical Space Summary

| Concept | Header height | Space saved vs today | % reduction |
|---|---|---|---|
| Today (baseline) | 142–178px | — | — |
| A · Refined | 102–138px | ~40–54px | 25–30% |
| C · Symmetric | 92px | ~50–86px | 35–48% |
| F · Brand Rail | 72px | ~70–106px | 44–59% |
| D · Title Hero | 60px | ~82–118px | 50–66% |
| B · Unified ★ | 56–96px | ~46–102px | 46–59% |
| E · Horiz Nav | 52px | ~90–126px | 62–75% |
| G · Editorial | 44px sticky | ~98–134px | 62–75% |

### Branding Coherence

All concepts maintain:
- DM Sans headings / Inter body text
- Orchard backdrop (fixed, absolute position)
- Card frosting (white/88% + backdrop-blur)
- Realm colour system (8 realms, unique per section)
- Warm cream background (hsl(42,27%,95%))

The logo is present in all concepts except G (icon only). Realm colour is strongest in B and C (full bar wash). Concept B with the realm-coloured unified bar is the most visually THA of the reduced-chrome options.

### What Premium SaaS Comparables Do

| App | Header height | Logo treatment | Navigation |
|---|---|---|---|
| Notion | 44px | Icon + name, ~28px | Left sidebar |
| Linear | 48px | Wordmark, ~24px | Left sidebar |
| Figma | 40px | Icon only, 20px | Toolbar |
| Asana | 52px | Wordmark, ~28px | Left sidebar |
| GitHub | 56px | Octocat icon, ~22px | Top tabs |

THA's current 90px TopBar is 60–80% taller than all comparables. Concept B at 56px is the first to enter the comparable range while keeping a 36px logo and realm identity.

### Mobile Implications

| Concept | Mobile impact |
|---|---|
| A | None — current mobile TopBar (56px) unchanged |
| B | Better: unified 48px replaces 56px+44px (100px) → 56–92px |
| C | Minor rework — same identity bar approach |
| D | Needs mobile adaptation for crowded right side |
| E | Major redesign required — horizontal nav breaks on mobile |
| F | Brand rail can collapse to hidden on scroll |
| G | Complete redesign — breadcrumb nav + sticky chrome don't map to mobile patterns |

---

## What Was Not Explored

- **Dark mode rendering:** All mock-ups are light mode. Realm colours in dark mode shift (e.g. Planner teal becomes `hsl(172,30%,56%)`). Concept B with its realm-coloured unified bar would benefit from a dark mode pass before implementation.
- **Two-line page actions:** Some pages (Shopping Workspace) have a `controlBar` below the standard rows. A third sticky layer is not eliminated by any of these concepts. Concept B handles it via the `WorkspaceToolbar` → `controlBar` nesting.
- **Animation and transitions:** Page transitions (realm colour fades) are not explored here. Concept B's colour change between pages would need a 150ms ease transition on `background-color`.
- **Accessibility:** Focus ring behaviour, keyboard navigation order, and screen reader announcements for the unified header are not evaluated. These are required before any concept ships.

---

## Recommendation

**Implement Concept B — Unified Workspace Header.**

The case is clear:

1. **Space:** 94px recovered on most pages. 46–59% reduction. First meaningful content appears higher on the screen on every authenticated page, on every viewport.

2. **Brand:** Logo at 36px is fully legible. Realm colour applies to the full bar — the colour signal is actually *stronger* than today because the bar is taller than the PageHeader alone. The orchard backdrop carries the warmth that a reduced logo leaves behind.

3. **Architecture:** One sticky component, not two. The current two-band coordination (TopBar z-50, PageHeader z-40) creates subtle z-index and scroll-interaction complexity. A single unified bar eliminates the class.

4. **Industry precedent:** Every productivity tool that THA users run alongside it (Notion, Linear, GitHub) uses a unified workspace header at 40–56px. The pattern is learnable in seconds.

5. **Mobile:** The unified header at 48px on mobile replaces 100–136px of current chrome. This is the most impactful improvement for mobile users.

6. **Reversibility:** If Concept B is shipped and proves wrong, reverting to the current two-band structure is a single revert commit. The risk profile is low.

**Do not implement Concept E or G** without a dedicated navigation redesign project. They solve the right problem (chrome reduction) by changing a larger contract (navigation paradigm, always-visible page context) that the current user base relies on.

**Consider Concept D** as a future evolution of Concept B once the unified bar is established. The title-dominant composition is powerful and could be phased in by increasing the title font-size and removing the context subtitle.

**Concept A** should be implemented immediately regardless of the Concept B decision. Reducing the logo from 88px to 48px takes hours, saves 40px, and de-risks the visual for the team before the larger change.

---

## Deliverables

| File | Description |
|---|---|
| `docs/design-exploration/workspace-header/index.html` | Interactive gallery — all 6 concepts × 4 pages |
| `docs/design-exploration/workspace-header/comparison-board.html` | All headers at full width, printable to PDF |
| `docs/investigations/WX9_5_WORKSPACE_HEADER_DESIGN_SPIKE.md` | This report |

**To export PNG/PDF from the gallery:**
Open `index.html` in a browser → navigate to the desired concept → right-click the mock-up → "Save image as" or use the browser's Print to PDF feature. For individual concept exports, use `comparison-board.html` which is optimised for print.

---

*Investigation complete. No code modified. Ready for design review.*
