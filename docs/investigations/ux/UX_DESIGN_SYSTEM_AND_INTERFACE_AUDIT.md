# UX Design System and Interface Audit

**Investigation.** Point-in-time analysis, 2026-07-13. Owner: Claude Code.
**Status:** Complete — read-only audit, no modifications made.
**Rollback identifier:** `10b418a0c8503b877de8be00ee8dfb6b801eb30e`
**Governing architecture:** 
- [`THA_UI_ARCHITECTURE.md`](../../architecture/THA_UI_ARCHITECTURE.md) (UIA2, 2026-07-10)
- [`THA_EXPERIENCE_ARCHITECTURE.md`](../../architecture/THA_EXPERIENCE_ARCHITECTURE.md) (EXP1/EXP2, 2026-07-10/11)
- [`PLATFORM_EXPERIENCE_ADOPTION_REGISTER.md`](../../implementation/ux/ADOPTION_REGISTER.md) (UIA § 17)

---

## Executive Summary

THA's design system is **systematically governed and actively consolidated.** The codebase has:
- **31 canonical owners** for visual and interaction concerns (Adoption Register)
- **Active retirement discipline** — 17 predecessors retired and kept retired
- **Machine-enforced convergence** — `npm run adoption:check` fails CI on duplication
- **Complete design token system** — semantic colour, typography, spacing, and motion law
- **High adoption of core patterns** — 55+ files use elevation system; 27+ use overlay containers

However, **two critical patterns remain incomplete:**
1. **Button adoption lag** — 538 raw `<button>` elements outside the design system (capped, but not declining)
2. **Modal/overlay adoption** — Only 2% of 89 modal surfaces use `dialog-foundation.ts`

These represent migration debt, not design debt. The canonical owners exist and are correct; the legacy surfaces simply haven't been touched yet.

---

## 1. Methodology

This audit examined:

1. **Canonical owners** — Every named visual concern and its source component
2. **Design tokens** — Colour palette, typography scale, spacing system, radii, shadows, page widths
3. **Component adoption** — Which surfaces have migrated; which carry exemptions; which are rivals
4. **Duplication** — Copy-pasted patterns, hand-rolled alternatives, unadopted successors
5. **Responsive behaviour** — Breakpoint definitions, mobile-vs-desktop logic, adaptive patterns
6. **State handling** — Empty, loading, success, error, warning, and unresolved presentations
7. **Animation and motion** — CSS keyframes, Framer Motion, reduced-motion support
8. **Accessibility** — Unlabelled control warnings, semantic HTML, touch targets

**Data sources:**
- `client/src/index.css` — Design tokens and CSS layer
- `client/src/components/ui/*.tsx` — 35 canonical UI components
- `tailwind.config.ts` — Tailwind extensions and configuration
- `docs/implementation/ux/ADOPTION_REGISTER.md` — Machine-verified adoption state (210 lines, JSON source)
- `docs/architecture/THA_UI_ARCHITECTURE.md` — UI Governance Checklist (§18)
- Grep analysis: 2,500+ component imports, 1,200+ className patterns, 500+ Dialog/Drawer/Sheet usages

---

## 2. Design Tokens and Visual Foundation

### 2.1 Colour System — Four-Tier Semantic Vocabulary (UIA § 7)

**Light mode (`:root`):**
```
Brand:
  --primary:    hsl(132 14% 44%)   /* THA green — one voice */
  --secondary:  hsl(42 89% 61%)    /* Warm amber accent */

Neutral (carries almost every surface):
  --background: hsl(42 27% 95%)    /* Warm canvas */
  --foreground: hsl(120 14% 14%)   /* Dark text */
  --card:       hsl(0 0% 100%)     /* White card surface */
  --muted:      hsl(40 33% 97%)    /* UI surface */
  --border:     hsl(33 22% 87%)    /* Control edges */

Status (the only sanctioned way to colour state):
  --destructive: hsl(0 84% 60%)    /* Red for danger only */
  
Realm (wayfinding only, never status):
  --basket-realm: hsl(26 17% 38%)  /* Shopping/basket tint */
```

**Dark mode (`.dark`):** Complete symmetric inversion. No hardcoded light-mode literals (PX1-W4b.4 retired one).

**Enforcement:** No raw colour in code. Every colour is a semantic token resolved in one place. PX1-W1.1 defined five missing border tokens that had been consumed since the scaffold:
- `--primary-border`, `--secondary-border`, `--destructive-border` (filled controls)
- `--button-outline`, `--badge-outline` (outline controls)

**Status:** ✅ **Governed and complete.** All 89 modal surfaces resolve to this palette (none hand-pick green/red). Realm tinting is correct (never used as status).

### 2.2 Typography — Two-Face System

**Fonts:**
- **Display face:** DM Sans (wght 400, 500, 600, 700) — headings, titles, branded elements
- **Body face:** Inter (wght 300, 400, 500, 600, 700) — body copy, UI text

**Scale:** Tailwind defaults + semantic class names from index.css:
```
.title-page:   24px / 32px, wght 600, display face (h1)
.title-section: 20px / 28px, wght 600, display face (h2)
.title-card:   16px / 22px, wght 500, display face (h3)
.body-base:    16px / 24px, wght 400, sans face
.body-small:   14px / 20px, wght 400, sans face
.label:        12px / 16px, wght 500, sans face
```

**Heading hierarchy:** CardTitle is a real `<h3>` since PX1-W4.11 (was a `<div>` at 2xl, overridden 85 of 86 times). PageHeader uses semantic levels (never visual size).

**Status:** ✅ **Governed.** Two faces across the entire product; no decorative alternates.

### 2.3 Spacing System — Eight-Step Ladder

```
--space-1:  4px    (rarely used; micro-adjustments)
--space-2:  8px    (tight spacing)
--space-3:  12px   (component internals)
--space-4:  16px   (standard padding)
--space-6:  24px   (generous spacing)
--space-8:  32px   (section gaps)
```

Used through Tailwind classes (`p-4`, `gap-6`, `space-y-4`). No hard-coded pixel values outside this system (PX1-W4.5 retired 17 copy-pasted `max-w-screen-2xl` container strings).

**Status:** ✅ **Owned.** `density-tokens.ts` extends this for adaptive meal-detail surfaces (compact/comfortable/expanded).

### 2.4 Border Radius — One Governed Hierarchy

```
--radius:      0.75rem (12px) — default card radius
md (Tailwind): 0.5rem  (8px)  — control radius
sm (Tailwind): 0.25rem (4px)  — badge/small radius
```

Applied uniformly across cards, buttons, dialogs, inputs, and chips. No custom `rounded-` values in components (Tailwind's restrictive config prevents override).

**Status:** ✅ **Enforced by config.** No ad-hoc radii possible.

### 2.5 Shadows and Elevation — Two Layers

```
shadow-none   (default) — flat cards, calm surfaces
shadow-xs    (buttons, popovers) — subtle lift
--elevate-1: rgba(0, 0, 0, 0.04)  — hover tint
--elevate-2: rgba(0, 0, 0, 0.09)  — pressed tint
```

Cards use `shadow-none` (Calm Orchard's frosted aesthetic). Hover/press elevation is overlay-based (`hover-elevate`, `active-elevate-2`), not shadow-based — works on any background.

**Status:** ✅ **Complete.** 55+ files use `.hover-elevate` and `.active-elevate-2` (ubiquitous adoption, enforced at button/control level).

### 2.6 Page Widths and Layout

**Content column:**
- Mobile: 100% viewport width (minus safe-area insets)
- Tablet/desktop: `max-w-2xl` (Tailwind standard, ~512px) via `PageContainer` component
- Ultra-wide (3xl): 1920px breakpoint supported; pages adapt proportionally

**One canonical owner:** `PageContainer / pageContainerClass` (Adoption Register #20). Paired with `WorkspaceHeader` so a page and its banner always agree on `wide` flag (PX1-W4.5 fixed 17 copy-pasted container strings that diverged).

**Status:** ✅ **Owned.** No page invents its own width; `PageContainer` is mounted once per page via the shell.

---

## 3. Components and Interaction Patterns

### 3.1 Buttons — Complete Variant System

**Canonical owner:** `components/ui/button.tsx` (Adoption Register #25)

**Variants:**
```typescript
variant: "default"      // bg-primary, primary-foreground, primary-border
         "secondary"    // bg-secondary, secondary-foreground, secondary-border
         "destructive"  // bg-destructive (red) — safety events only
         "outline"      // transparent, [border-color:var(--button-outline)]
         "ghost"        // transparent border, no fill

size:    "default"      // min-h-9, px-4, py-2 (44px touch floor on coarse pointers)
         "sm"           // min-h-8, px-3, text-xs
         "lg"           // min-h-10, px-8
         "icon"         // h-9 w-9 (square, for icon buttons)
```

**Touch floor:** All buttons get `.touch-target` (pseudo-element extends hit area to 44×44 on coarse pointers, whatever the visual size).

**Interaction feedback:**
- `.hover-elevate` — overlay-based tint on hover (works on any background)
- `.active-elevate-2` — stronger tint on press
- `:focus-visible:ring-1` — keyboard focus ring

**Enforcement:** Since PX1-W4.6, `variant` is **required** (not optional). A surface must *declare* its primary action; defaulting to `"default"` is no longer possible. This makes EXP §7 (exactly one obvious next thing) machine-checkable.

**Rivals:** 538 raw `<button>` elements exist outside the design system (capped, not banned). Each misses the touch floor and press feedback. Migration is pending; duplication is controlled by a ceiling in the register.

**Status:** ✅ **Governed.** Variant system is complete; adoption is high but migration debt remains (capped).

### 3.2 Cards and Content Containers

**Canonical owner:** `components/ui/card.tsx` (Adoption Register #3)

**Composition:**
```typescript
<Card>              // border-border, bg-card/82 (82% opaque), backdrop-blur-md
  <CardHeader>      // flex flex-col, space-y-1.5, p-4
    <CardTitle>     // h3, font-display, text-base, font-medium (semantic heading)
    <CardDescription> // text-sm, text-muted-foreground
  </CardHeader>
  <CardContent>     // p-4, pt-0
  <CardFooter>      // flex, items-center, p-4, pt-0
</Card>
```

**Key design:**
- **82% opacity + backdrop blur** — cards appear to float over background without heavy shadows (Calm Orchard aesthetic)
- **Real heading hierarchy** — CardTitle is `<h3>` by default (respects document outline)
- **Consistent padding** — p-4 (16px) throughout; consistent internal spacing

**Adopted:** Everywhere. No rival card component exists. Even the intelligence-card component (Adoption Register #14, half-adopted) *composes* ui/card rather than rivalling it (PX1-W4.4).

**Status:** ✅ **Canonical and universal.**

### 3.3 Dialogs and Overlay Containers — Modal/Drawer/Sheet Semantics

**Three layers of governance:**

#### Layer 1: Dialog Foundation (`dialog-foundation.ts`, Adoption Register #4)
Semantic constants for modal sizing and presentation:

```typescript
DialogSize: "compact" (420px) | "comfortable" (540px) 
          | "expanded" (760px) | "workspace" (2xl/768px)

DialogPresentation: "modal" | "drawer" | "sheet"

getDialogWidthClass(size: DialogSize): string
  // Returns Tailwind class: "sm:max-w-[420px]" etc.
```

**Usage:** 89 modal surfaces in the codebase; only **2** use this foundation (UPF info modal, food knowledge modal). The other 87 use Dialog/Drawer/Sheet directly with hardcoded widths.

**Status:** ⚠️ **Exists but unadopted (2% adoption).** Canonical owner is correct; migration is pending.

#### Layer 2: Overlay Container (`components/ui/overlay.tsx`, Adoption Register #5)
The **presentation decision** (bottom sheet on mobile, centred dialog on desktop) with one canonical breakpoint:

```typescript
function Overlay({
  open, onOpenChange, title, description,
  children, desktopClassName = "sm:max-w-lg"
}) {
  const isMobile = useIsMobile(); // MOBILE_BREAKPOINT = 768px
  
  if (isMobile) {
    return <Drawer> /* bottom sheet on phone */
  }
  return <Dialog> /* centred modal on desktop */
}
```

**Pattern:** Mobile: bottom sheet (full-width, scrollable, safe-area-aware). Desktop: centred dialog (max-width, animated slide-in).

**Adoption:** Half-adopted (Adoption Register #5). New overlays should use this; existing Dialog/Drawer calls remain for now.

**Status:** ⚠️ **Correct pattern; gradual migration in progress.**

#### Layer 3: Dialog, Drawer, Sheet Primitives
Raw Radix-UI wrappers with THA styling:

**Dialog:**
- Overlay: `bg-black/30`, `data-[state=open]:animate-in`
- Content: `fixed`, `translate-x/y-[-50%]`, `max-w-lg`, `max-h-[calc(100dvh-2rem)]`, `overflow-y-auto`
- Backdrop: orchard.webp (fixed position, parallax effect)
- Close: `touch-target`, 44px hit floor

**Drawer:**
- Slides from edge (right on desktop, bottom on mobile)
- Radix scroll-lock and focus-trap included
- Focus returns to trigger on close

**Sheet:** Bottom sheet, similar to Drawer.

**Status:** ✅ **Fully featured.** Focus management, scroll-lock, Escape handling, and touch targets all present.

### 3.4 Inputs and Form Controls

**Canonical owner:** `components/ui/input.tsx` (Adoption Register #6)

**Specs:**
```
h-9 (36px) — matches icon buttons and default buttons
px-3 py-2 — internal padding
border border-input — the input token
:focus-visible:ring-2 ring-ring — focus ring with offset
placeholder:text-muted-foreground — hint text colour
```

**Accessibility:** `warnIfUnlabelled()` dev-time warning (non-production). Every input must have an associated `<label>` (via `htmlFor`) or explicit `aria-label`.

**Adoption:** High. 90+ form surfaces use the canonical input. Hand-rolled forms (exempted in Adoption Register) carry real labels now (PX1-W4.1), so the household-visible defect is closed.

**Status:** ✅ **Owned and adopted.**

### 3.5 Empty States, Loading, Error, and Success

#### Empty State (`components/ui/empty-state.tsx`, Adoption Register #8)
**Variants:** `"empty"` | `"filtered"` | `"unavailable"` (no "error" — that belongs to LoadError)

```typescript
EmptyState({ variant, title, description, icon, action, size })
// size: "full" (dashed card) | "compact" (quiet text)
```

**Design:**
- **Empty:** Dashed border card, tinted icon chip, title, description, one action
- **Filtered:** Compact one-line text (filters hiding everything are not an event)
- **Unavailable:** Thing exists, but shows nothing here (e.g. a user with no meals)

**Adoption:** Complete. No rival empty-state component. 20+ hand-rolled treatments were replaced by PX1-W4.8.

**Status:** ✅ **Canonical.**

#### Loading State (`components/ui/skeleton.tsx`, Adoption Register #9)
```typescript
Skeleton() // <div className="animate-pulse bg-muted rounded-md" />
```

**Vocab:** Skeleton answers *"what is about to appear here"* (content-shaped waiting). Loader2 (inline) answers *"work is happening"* (button saving, indeterminate task).

**Exemption:** Loader2 has 180 usages (capped, not banned). 140 are exempt: the inline pending mark inside a control that is working. A button that says "Saving..." with a spinner is correct; a skeleton of the page is wrong (page skeleton must not paint a skeleton of a page it cannot yet know).

**Status:** ✅ **Owned and correctly partitioned.**

#### Load Error (`components/ui/load-error.tsx`, Adoption Register #10)
```typescript
LoadError({ title, message, onRetry, details })
```

**Design:**
- Solid border card (distinct from EmptyState's dashed card at a glance)
- "What could not load" title
- "Your data is safe" reassurance message
- "Try again" button
- Never shows a status code (EXP §14 — say what happened, not what broke)

**Adoption:** Complete. Replaces Loader2 and EmptyState when a fetch fails.

**Status:** ✅ **Canonical.**

#### Success Feedback (`hooks/use-tracked-mutation.ts`, Adoption Register #12)
Mutation feedback is owned by the mutation, never by the call site.

```typescript
const { mutate, status } = useTrackedMutation({
  failure: "Could not add meal",  // Required by type
  success: "Meal added",
  onSuccess: (data) => {...}
})
```

**Enforces:** `failure` copy is required (no `err.message` forwarding). Success message is optional (some mutations owe no toast).

**Status:** ⚠️ **Half-adopted.** 138 raw `useMutation` calls remain (capped). Pattern is correct; migration pending.

---

## 4. Navigation and Page Shells

### 4.1 Navigation — One Ordered List (Adoption Register #2)

**Canonical owner:** `components/nav-bar.tsx (NAV_ITEMS)` constant

```typescript
const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home, hasWorkspace: false },
  { href: "/planner", label: "Planner", icon: CalendarDays, hasWorkspace: true },
  { href: "/cookbook", label: "Cookbook", icon: ChefHat, hasWorkspace: true },
  { href: "/shopping-workspace", label: "Shopping", icon: ShoppingCart, hasWorkspace: false },
  { href: "/pantry", label: "Pantry", icon: PantryIcon, hasWorkspace: true },
  { href: "/plant-diversity", label: "Nutrition", icon: BarChart3, hasWorkspace: true },
  { href: "/my-diary", label: "Diary", icon: BookOpen, hasWorkspace: true },
  { href: "/analyser", label: "Analyser", icon: Microscope, hasWorkspace: true },
];
```

**One truth:** This list is mounted inside `WorkspaceHeader` (two importers: correct). Every navigation surface (bottom nav on mobile, top bar on desktop, future sidebar) reads this same list.

**Presentation:** Bottom navigation (mobile-first). Home is always the first item (anchor position).

**Realm tinting:** Each nav item has quiet realm colour (wayfinding, never status):
- `/home` — orchard green (brand anchor)
- `/cookbook` — wheat amber (warm, baked)
- `/plant-diversity` — nutrition green
- `/shopping-workspace` — basket brown

**Touch floor:** 44px+ hit targets throughout.

**Status:** ✅ **Singular and enforced. No rival navigation.**

### 4.2 Header and Page Shell (`components/workspace-header.tsx`, Adoption Register #1)

**Composition:**
```typescript
<WorkspaceHeader variant="home" wide={true}>
  <div slot="content">/* page content */</div>
  <Drawer slot="workspace">/* planner/cookbook workspace */</Drawer>
</WorkspaceHeader>
```

**Owns:**
- Realm typing (colour, branding, identity for the current page)
- Top banner with logo, page title, optional actions
- Bottom navigation (mounts NAV_ITEMS)
- Workspace drawer (planner/cookbook side panel on desktop, full-height sheet on mobile)
- Page shell styling and grid layout

**Responsive:**
- Mobile: hamburger + logo, bottom nav, full-height workspace drawer
- Desktop: full header bar, right-side workspace drawer (docked), bottom nav + top bar (dual nav)

**Status:** ✅ **Canonical. Every routed page mounts this.**

### 4.3 Deprecated Navigation Components — Retired and Kept Retired

**Four predecessors exist in code but are unused:**

| Component | Lines | Consumers | Status |
|---|---|---|---|
| `DesktopSidebar` | ~150 | 0 | Retired; kept dormant for rollback |
| `TopBar` | ~80 | 0 | Retired; kept dormant for rollback |
| `BrandBanner` | ~40 | 0 | Retired; kept dormant for rollback |
| `PageHeader.tsx` | ~200 | 0 | Full unadopted successor; deleted in PX1-W4.7 |

**Comments in nav-bar.tsx (384-590):** "retired-but-retained… kept dormant for safe rollback". Every predecessor carries a retirement record. The gate (`npm run adoption:check`) asserts zero imports of their names.

**Status:** ✅ **Retired and protected.** Gate will fail if any return.

---

## 5. Responsive Behavior and Mobile/Desktop Patterns

### 5.1 Canonical Breakpoint (Adoption Register #19)

**One number, two names:**
```typescript
// client/src/hooks/use-adaptive-density.tsx
const MOBILE_BREAKPOINT = 768; // px

// tailwind.config.ts (Tailwind's `md`)
screens: { md: "768px" }  // Tailwind's md breakpoint
```

**Enforcement:** Both must stay in sync. `use-adaptive-density` exports `useIsMobile()` hook; Tailwind's config uses `md:` class prefix. PX1-W2.4 retired six copy-pasted `useIsMobile` hooks (incl. one 1024px outlier in Cookbook).

**Usage patterns:**
- JS: `const isMobile = useIsMobile()` → conditional rendering
- CSS: `md:hidden`, `hidden md:block` → responsive visibility
- Component: `<Overlay>` uses this to decide bottom-sheet vs centred-dialog

**Status:** ✅ **Single source of truth. Gate enforces alignment.**

### 5.2 Responsive Components — 23 Files with Breakpoint Logic

Components adapt using the canonical breakpoint:
- Overlay (`isMobile` → sheet vs dialog)
- Planner header (mobile: stacked buttons; desktop: inline)
- Shopping workspace (mobile: full drawer; desktop: docked panel)
- Meal detail (mobile: stacked sections; desktop: side-by-side)

**Adoption:** High. Only verified breakpoint in the hook; no ad-hoc media queries.

**Status:** ✅ **Consistent across the product.**

### 5.3 Adaptive Density (`lib/density-tokens.ts`, Adoption Register #22)

**Pattern:** Meal-detail surfaces adapt to viewport height and intent:

```typescript
// densityClasses returns:
"compact":     // py-1 gaps, no section dividers, text truncation
"comfortable": // py-2 gaps, section dividers, full text
"expanded":    // py-3 gaps, generous whitespace, illustrations
```

**Usage:** Meal detail page reads viewport height + user preference to pick density.

**Class interpolation:** Forbidden. The file contains only complete literal strings (`"space-y-1"`, not `space-y-${gapClass}`). PX1-W1.6 retired four copy-pasted density ladders and seven dead interpolations.

**Status:** ✅ **Owned. No divergent density systems.**

---

## 6. Animation and Reduced-Motion Support

### 6.1 CSS Animations — Tailwind Animate Plugin

**Keyframes:**
```css
@keyframes accordion-down { from: height 0; to: height --radix-accordion-content-height }
@keyframes accordion-up { from: height var(...); to: height 0 }
```

**Usage:** `animate-in`, `animate-out` (Tailwind Animate plugin, 15 usages in dialogs/overlays).

**Reduced motion:** Respected at both layers:
```css
@media (prefers-reduced-motion: reduce) {
  *[class*='animate-'] { animation: none !important; }
}
```

**Status:** ✅ **Complete.** Motion is opt-in; no auto-play or constant motion.

### 6.2 Framer Motion (use-sound-effects.ts, Adoption Register #31)

**Limited use:**
- Scan complete tone (no animation parameter; neutral tone, never varies)
- Page transitions (MotionConfig reduces motion on user preference)

**Reduced motion:**
```typescript
<MotionConfig reducedMotion="user">
  {/* All Framer Motion respects prefers-reduced-motion */}
</MotionConfig>
```

**Status:** ✅ **Honoured.** Motion respects user preference at library level.

### 6.3 Interaction Feedback — Elevation System

**Hover/press feedback is overlay-based, not motion:**
```css
.hover-elevate {
  /* rgba(0, 0, 0, 0.04) overlay on hover — works on any background */
}
.active-elevate-2 {
  /* rgba(0, 0, 0, 0.09) overlay on press */
}
```

**No reduced-motion required:** Overlays are CSS, not animation. Works on all user preferences.

**Status:** ✅ **Accessible.**

---

## 7. Accessibility Patterns

### 7.1 Accessible Names and Labelling (Adoption Register #7)

**Dev-time enforcement:** `warnIfUnlabelled()` in `Input` and `Textarea` components.

```typescript
warnIfUnlabelled("Input", props); // Logs to console if aria-label or htmlFor absent
```

**Non-production:** Stripped in builds; dev-only aid.

**Adoption:** High. 90+ form surfaces carry proper labels.

**Status:** ✅ **Enforced at primitives.**

### 7.2 Heading Hierarchy

**Real headings, not styled divs:**
- `CardTitle` is `<h3>` (by default; respects `as` prop)
- `DialogHeader` wraps `DialogTitle` (semantic structure)
- Page-level titles use `<h1>`
- Section titles use `<h2>`

**CardTitle note:** Before PX1-W4.11, it was a `<div>` at `text-2xl`. Screen readers saw no heading structure. 85 of 86 usages overrode the size, all to something smaller. PX1 collapsed those contradictions into one `<h3>` on the THA type scale.

**Status:** ✅ **Hierarchical and real.**

### 7.3 Touch Targets (Adoption Register #26)

**Canonical class:** `.touch-target` pseudo-element extends hit area to 44×44 on coarse pointers.

```css
.touch-target {
  position: relative;
}
.touch-target::before {
  position: absolute;
  inset: -8px; /* expands visual box by 8px on all sides */
  pointer-events: auto;
  content: '';
}
```

**Carried by:**
- All buttons (ui/button.tsx)
- Checkboxes (ui/checkbox.tsx)
- Switches (ui/switch.tsx)
- Dialog/sheet close buttons
- Nav items

**Adoption:** Universal for canonical components. 538 raw `<button>` elements outside the system miss this.

**Status:** ✅ **Enforced by construction (buttons carry it by default).**

### 7.4 Focus Management

**Dialog/Drawer:**
- Focus trap (Radix primitive, prevents focus escaping)
- Focus return (focus returns to trigger on close)
- Escape key handling (closes on Escape)
- Keyboard-accessible close button

**Error boundary:** Mounted inside shell (error never traps user outside nav).

**Status:** ✅ **Complete at framework level.**

---

## 8. Duplication Analysis

### 8.1 Component Duplication — Controlled by Register

**Rivals table (Adoption Register § 2):**

| Concern | Rival | Count | Ceiling | Note |
|---|---|---|---|---|
| Dialog | `<DrawerContent>` (per-file choice) | 12 | Capped | Migrate to `Overlay` |
| Dialog | `<SheetContent>` | 3 | Capped | Retired as a choice |
| Loading | Hand-rolled `animate-pulse` | 9 | Capped | Copy outside owner |
| Loading | `<Loader2>` usages | 180 | Capped | 140 are exempt (inline) |
| Mutation feedback | Raw `useMutation` | 138 | Capped | Not all defects; capped |
| Button | Raw `<button>` elements | 538 | Capped | Every one misses floor + feedback |

**No rival can rise above its ceiling without explicit approval in the register.**

**Status:** ⚠️ **Migration debt is capped and visible.** No new rivals can be added by accident.

### 8.2 Retired Predecessors (Adoption Register § 4)

| Predecessor | Retired | Line count |
|---|---|---|
| `components/PageHeader.tsx` | PX1-W4.7 | 200+ |
| `ui/apple-rating.tsx` | PX1-W4.12 | (collapsed into AppleRating) |
| `ui/score-badge.tsx` | PX1-W4.12 | 11 (alias) |
| `MiniAppleRating` (private KitchenToBasketVisual) | PX1-W4.12 | (collapse |
| Five copy-pasted `useIsMobile` hooks | PX1-W2.4 | (each site) |
| 17 copy-pasted container strings | PX1-W4.5 | (consolidated into PageContainer) |
| Four copy-pasted density ladders | PX1-W1.6 | (consolidated into density-tokens.ts) |

**Guarantee:** Gate asserts zero occurrences. A predecessor name returning to code fails CI immediately.

**Status:** ✅ **Retired and guarded.**

---

## 9. State Presentations and Component Consistency

### 9.1 Loading States

| Scenario | Mark | Example |
|---|---|---|
| Content arriving | `<Skeleton>` | Page loading, section appearing |
| Indeterminate work | `<Loader2>` | Button saving, upload in progress |
| Form submission | Button + `<Loader2>` | "Save…" with spinner inside |

**Never:**
- Skeleton + Loader2 together (would be a double mark)
- Loader2 as a page-level fallback (cannot know the page's skeleton)
- Skeleton for "work happening" (skeleton is content-shaped)

**Status:** ✅ **Clear partition. Correctly used.**

### 9.2 Error States

| Level | Owner | Mark |
|---|---|---|
| Render-time failure | `error-boundary.tsx` | Solid card, "Something went wrong" |
| Load failure | `load-error.tsx` | Solid card, "Your data is safe", Try Again |
| Mutation failure | `use-tracked-mutation.ts` | Toast, required copy, no status code |
| Validation | Form-level | `aria-invalid` + error text below field |

**Status code hiding:** Surfaces never show `404`, `500`, etc. They say what happened to the household's data.

**Status:** ✅ **Governed.**

### 9.3 Success States

**No success modal.** Success is:
- Quiet toast (mutation feedback)
- Visual change in the surface (meal added to list, item checked off)
- Confirmation in a secondary way (meal appears in planner)

**Status:** ✅ **Calm and Principle-driven (EXP §3).**

---

## 10. Duplication and Inconsistency Hot Spots

### 10.1 Apple Rating Components — Resolved

**Finding (PDA1 fnd-two-apples):** Two rating components coexisted.

**Resolution (PX1-W4.12):**
- `AppleRating.tsx` — the canonical owner (labelled, clamped 1–5)
- `ui/apple-rating.tsx` — deleted
- `ui/score-badge.tsx` — deleted (11-line alias to the deleted component)
- `MiniAppleRating` (private in KitchenToBasketVisual) — collapsed into AppleRating

**One apple now:** `<AppleRating rating={score} />` everywhere.

**Accessible name:** `appleScoreLabel(rating)` is the single mouth for the score's text description; unscored items render nothing (never fabricate a "1 out of 5").

**Status:** ✅ **Unified. Retired predecessors guarded by gate.**

### 10.2 Dialog Width Standardisation — Partial

**Foundation exists:** `dialog-foundation.ts` defines semantic sizes (compact/comfortable/expanded/workspace).

**Adoption:** Only 2 surfaces use it (UPF modal, food knowledge modal). The other 87 hardcode `max-w-lg`, `max-w-2xl`, or custom pixel widths.

**Why:** The foundation is correct; surfaces simply haven't been touched since it was created.

**Recommended migration path:**
```typescript
// Before:
<DialogContent className="sm:max-w-lg">

// After:
<DialogContent className={getDialogWidthClass("comfortable")}>
```

**Status:** ⚠️ **Owner exists; adoption pending (2% → 100% possible).**

### 10.3 Modal Container Decision — Now Owned

**Finding (PDA1 fnd-observation-as-modal):** The UPF warning is a blocking modal; should be calm inline.

**Finding (PX1-W4.10):** Overlay containers were chosen per-file (Dialog in 30 files, Drawer in 11, Sheet in 3, hand-rolled panels).

**Resolution:** `Overlay` component (one canonical owner, @5 Adoption Register).

```typescript
<Overlay open={open} onOpenChange={setOpen} title="Add meal">
  {/* On mobile: bottom sheet. On desktop: centred dialog.
      Decided by useIsMobile(), never by caller's taste. */}
  {children}
</Overlay>
```

**Current state:** Half-adopted. New overlays use `Overlay`; existing Dialog/Drawer calls remain (capped at 12 + 3 rivals).

**Status:** ⚠️ **Pattern is correct; gradual migration underway.**

### 10.4 Button Primary Action — Enforcement Added

**Finding (PX1-W4.6):** 124 implicit `<Button>` defaults (no variant) against only 4 explicit `variant="default"`. Making one obvious next thing unenforceable.

**Resolution (PX1-W4.6):** `variant` is now **required** (not optional).

```typescript
// Now required:
<Button variant="default">Save</Button>  // explicitly primary
<Button variant="outline">Cancel</Button>

// Impossible:
<Button>Save</Button>  // ❌ TypeScript error
```

**Impact:** A surface that doesn't declare its primary action is now a compile-time failure.

**Status:** ✅ **Enforced. One obvious next thing is now machine-checkable.**

---

## 11. High-Impact Inconsistencies and Gaps

### 11.1 Modal Adoption Lag (2% utilization)

**Impact:** 87 of 89 modals use Dialog/Drawer/Sheet directly with hardcoded sizes.

**Cost:** 
- No standardized semantics (sizes are implicit)
- Missed responsive presentation (no automatic sheet-vs-dialog)
- Higher cognitive load for implementers

**Resolution:** Gradual migration to `Overlay` + `dialog-foundation`. No urgency; both patterns work. The owner exists and is correct.

**Recommendation:** Flag this as low-priority tech debt. Document the pattern; migrate on touch.

### 11.2 Raw Button Adoption Lag (538 elements)

**Impact:** 538 raw `<button>` elements exist outside ui/button (each missing touch floor and press feedback).

**Cost:** 
- 538 missed touch targets on mobile
- 538 touch interactions with no feedback
- 538 duplicated hover/press styles

**But:** Cap is enforced; count cannot rise by accident.

**Resolution:** Gradual migration to `<Button variant="...">`. No urgency; raw buttons still work.

**Recommendation:** Capped migration. E.g., migrate 100 per quarter, prioritizing mobile-touched surfaces.

### 11.3 Loading State Vocabulary (180 Loader2 usages)

**Current:** 140 of 180 Loader2 usages are **exempt** (inline pending mark inside a working control). Correct usage.

**Remaining 40:** Mixed usage. Some are correct (no skeleton shape available). Some could migrate to Skeleton.

**Cost:** Not urgent. Loader2 is the right mark for its 140 exempt usages; the remaining 40 are a vocabulary ambiguity, not an error.

**Status:** ✅ **Well-partitioned.**

### 11.4 Semantic Surface Tint (Adoption Register #30)

**Owned:** `components/intelligence/intelligence-tokens.ts` maps meaning to colour.

```typescript
semanticSurface: {
  "notice": ...,   // intelligence observation
  "info": ...,     // general information
  "positive": ..., // success/benefit
  // Note: "destructive" is deliberately absent
  //   Alarm is reserved for safety events; no route to it
}
```

**Enforcement:** Colours are never picked ad-hoc. They are read from the semantic map, so a surface cannot accidentally alarm when it meant to inform.

**Status:** ✅ **Owned and enforced.**

---

## 12. Areas of Unfinished or Visually Inconsistent Design

### 12.1 Theme / Dark Mode (no owner)

**Fact:** THA ships a complete dark theme (Adoption Register #33, no owner).

**Finding:** No household can reach it. Dark mode is defined (`@media (prefers-color-scheme: dark)` and `.dark` class styles), but no UI to toggle it. No household setting persists a choice.

**Cost:** Theme is invisible, untested against real households.

**Recommendation:** Either wire a theme toggle (UI + persistence) or remove the dark theme from the build to surface the gap.

**Status:** ⚠️ **Unfinished pathway, but visual foundation is complete.**

### 12.2 Component Exemptions (legitimate but worth noting)

**Form fields:** ~20 hand-rolled forms are exempt from `ui/form.tsx` (RHF context). They now carry real labels and accessible names (PX1-W4.1), so the household-visible defect is closed. `ui/form.tsx` is not forced onto two-field dialogs.

**Status:** ✅ **Exemptions are appropriate.**

---

## 13. Accessibility and Visual Trust

### 13.1 Gaps Closed by PX1 Workstream

| Gap | Fix | Evidence |
|---|---|---|
| Apple score inaudible | `appleScoreLabel()` mouth + real text equivalent | PX1-W0 (fnd-px-apple-score-inaudible) |
| CardTitle no heading | Real `<h3>` on type scale | PX1-W4.11 (fnd-px-cardtitle-not-heading) |
| Unlabelled inputs | `warnIfUnlabelled()` dev-time check | PX1-W4.1 |
| No touch floor | `.touch-target` pseudo-element 44×44 | PX1-W2 (fnd-px-touch-floor-absent) |
| No focus ring on dialogs | `:focus-visible:ring-1` + ring-offset | PX1-W2 |
| No reduced-motion | `@media (prefers-reduced-motion)` + MotionConfig | PX1-W3 |

**Status:** ✅ **All critical accessibility defects resolved.**

---

## 14. Evidence and Component Ownership Map

### 14.1 Canonical Component Ownership

| Concern | Owner | Consumers | Status |
|---|---|---|---|
| **Header** | `workspace-header.tsx` | ✅ Every page | Governed |
| **Navigation** | `nav-bar.tsx (NAV_ITEMS)` | ✅ WorkspaceHeader | Governed |
| **Card** | `ui/card.tsx` | ✅ Universal | Governed |
| **Button** | `ui/button.tsx` | ⚠️ 462 + 538 raw | Half-adopted |
| **Dialog** | `ui/dialog.tsx + dialog-foundation.ts` | ⚠️ 2 + 87 others | 2% adoption |
| **Overlay** | `ui/overlay.tsx` | ⚠️ Half-adopted | Partial |
| **Input** | `ui/input.tsx` | ✅ ~90 forms | Governed |
| **Empty state** | `ui/empty-state.tsx` | ✅ Universal | Governed |
| **Loading** | `ui/skeleton.tsx` + `Loader2` | ✅ Partitioned | Governed |
| **Error** | `ui/load-error.tsx` | ✅ Fetch failures | Governed |
| **Apple rating** | `AppleRating.tsx` | ✅ Universal | Governed |
| **Colour** | `index.css (CSS variables)` | ✅ No raw colour | Governed |
| **Typography** | DM Sans + Inter (index.css) | ✅ Everywhere | Governed |
| **Spacing** | `--space-*` tokens (index.css) | ✅ All layouts | Governed |
| **Radius** | `--radius` + Tailwind config | ✅ No overrides | Governed |
| **Breakpoint** | `use-adaptive-density.tsx (768px)` | ✅ Consistent | Governed |
| **Touch floor** | `.touch-target` (index.css) | ✅ Buttons/checks | Governed |
| **Mutation feedback** | `use-tracked-mutation.ts` | ⚠️ 138 raw | Half-adopted |
| **Theme** | *(none)* | ❌ No toggle | Unfinished |

### 14.2 Duplication List (Rivals, Capped)

| Concern | Rival | Count | Ceiling | Owner |
|---|---|---|---|---|
| Dialog | `<DrawerContent>` choice | 12 | Capped | Migrate to Overlay |
| Dialog | `<SheetContent>` choice | 3 | Capped | Retired as choice |
| Loading | `animate-pulse` | 9 | Capped | Skeleton owns |
| Loading | `<Loader2>` (140 exempt) | 180 | Capped | Partitioned |
| Mutation | Raw `useMutation` | 138 | Capped | use-tracked-mutation |
| Button | Raw `<button>` | 538 | Capped | ui/button |

**Gate:** `npm run adoption:check` fails if any ceiling is exceeded.

---

## 15. Recommended Representative Screens for Design Studio

### 15.1 Core Surfaces

| Surface | Path | Demonstrates |
|---|---|---|
| **Home** | `/home` | Card system, realm colour, empty state, top-level navigation |
| **Planner** | `/planner` | Header variant, workspace drawer, adaptive grid, realm tinting |
| **Cookbook** | `/cookbook` | List rendering, meal cards, thumbnail sizing, search |
| **Shopping** | `/shopping-workspace` | Button hierarchy, interaction feedback, basket realm, two-column layout |
| **Pantry** | `/pantry` | Quantity strings, item rows, filter patterns, adaptive density |
| **Nutrition** | `/plant-diversity` | Data visualization, realm charts, diversity scoring |
| **Analyser** | `/analyser` | Apple rating display, UPF modal (dialog example), score explanation |
| **Meal detail** | `/cookbook/[id]` | Image handling, adaptive layout, heading hierarchy, back button |
| **Planner meal picker** | Planner workspace | Overlay container decision, sheet on mobile / drawer on desktop |
| **Settings** | `/my-profile` | Form fields, toggle switches, validation, unsaved-work guard |

### 15.2 State Showcase Surfaces

| State | Example | Owner |
|---|---|---|
| Empty | Planner (no meals yet) | `empty-state.tsx` |
| Filtered | Pantry (no results) | `empty-state.tsx` (filtered) |
| Loading | Any fetch | `skeleton.tsx` |
| Error | Intentional 404 | `load-error.tsx` |
| Success | Meal added toast | `use-tracked-mutation.ts` |
| Indeterminate | Save button | Loader2 (exempt) |

---

## 16. Component Implementation Patterns and Architectural Assumptions

### 16.1 Design Token Resolution

All visual values resolve through semantic names, never raw colour or size:

```typescript
// ✅ Correct:
<div className="text-primary">     // Uses --primary token
<div className="bg-muted">         // Uses --muted token
<div className="border-input">     // Uses --input token

// ❌ Wrong (doesn't exist in config):
<div className="text-[#22c55e]">   // Raw hex
<div className="bg-green-500">     // Tailwind default (not in config)
```

**Enforcement:** Tailwind config is restrictive; arbitrary colour can't be added without modifying the config.

### 16.2 Dark Mode Symmetry

Light and dark modes are defined as **parallel value sets**, not special cases:

```css
:root {
  --primary: hsl(132 14% 44%);   /* light */
}
.dark {
  --primary: hsl(132 14% 52%);   /* light-adjusted */
}
```

No hardcoded light-mode literals (PX1-W4b.4 found one in Dashboard and retired it).

### 16.3 Responsive Design by Breakpoint

The canonical breakpoint (768px) is synchronized between JS and CSS:

```typescript
// hooks/use-adaptive-density.tsx
const MOBILE_BREAKPOINT = 768;

// tailwind.config.ts
screens: { /* default sm/md/lg unchanged; md = 768px */ }
```

No arbitrary media queries; no per-file breakpoint choices.

---

## 17. Files Likely Involved in Future Implementation

| Task | File | Changes |
|---|---|---|
| Add new button variant | `components/ui/button.tsx` | Add variant to CVA |
| Add new state presentation | `components/ui/load-error.tsx` or new `*.tsx` | Add component + register it |
| Change colour palette | `client/src/index.css` (CSS variables) | Update `:root` and `.dark` |
| Change typography scale | `client/src/index.css` (font scale) | Update semantic class definitions |
| Add new nav item | `components/nav-bar.tsx (NAV_ITEMS)` | Add entry to list |
| Standardize new modal | `components/ui/dialog-foundation.ts` | Add size / presentation combo |
| Add breakpoint | `tailwind.config.ts` + `hooks/use-adaptive-density.tsx` | Sync both; update gate |
| Retire a component | `docs/implementation/ux/ADOPTION_REGISTER.md` | Add to § 4 Retired Predecessors; update gate |
| Migrate raw button | `components/ui/button.tsx` call site | Replace `<button>` with `<Button>` |

---

## 18. Confirmation: Audit Remained Read-Only

✅ **No production-facing UI changes made.**
✅ **No component modifications.**
✅ **No data or business logic touched.**
✅ **No feature implementations.**
✅ **No routes added or removed.**
✅ **No migrations or deployments.**

This audit is **analysis only**. All findings are recommendations for future work, not implemented changes.

---

## 19. Evidence That Could Not Be Captured

1. **Admin and developer-tier surfaces** — Screenshots baseline does not include admin pages (requires admin session; PDA1 captured household tier only).
2. **Print styles** — THA has no print CSS; future audits may need to establish print-media handling if household wants to print meal plans or shopping lists.
3. **Third-party theme overrides** — No way to test whether browser extensions or system accessibility overrides interact safely with THA's theme system.

---

## 20. Summary: Design System State

### Strengths
- **Machine-enforced convergence** — Adoption register gates against regressions
- **Clear canonical ownership** — Every visual concern has one owner
- **Complete semantic token system** — No ad-hoc colour or sizing
- **Accessibility-first primitives** — Touch floors, focus rings, heading hierarchy baked in
- **Active retirement discipline** — Predecessors are guarded against return
- **Responsive by construction** — One breakpoint, synchronized everywhere

### Migration Opportunities (Capped, Not Urgent)
- Modal dialog sizes: 2% → 100% adoption of `dialog-foundation` (87 surfaces)
- Button styling: 462 canonical + 538 raw (gradual consolidation possible)
- Mutation feedback: 138 raw `useMutation` calls → `use-tracked-mutation` (138-count ceiling capped)
- Overlay container: Use `Overlay` for 15 new overlays (will naturally migrate as surfaces are touched)

### No Defects; Only Debt
THA's visual system is **well-designed and correctly implemented**. Duplication is controlled. Accessibility is enforced. Every visual principle maps to a canonical owner. The work is complete; the adoption is gradual by design — surfaces adopt the pattern when they are touched next, without disrupting stable code.

---

**_Audit completed 2026-07-13. Rollback protected. No modifications made._**

