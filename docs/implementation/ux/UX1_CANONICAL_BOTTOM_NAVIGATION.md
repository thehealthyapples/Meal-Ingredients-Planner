# UX1 — Canonical Bottom Navigation — Implementation

**Date:** 2026-07-10
**Branch:** int1-intelligence-platform
**Risk:** 🟡 AMBER
**Reason:** Replaces the primary navigation chrome across all breakpoints (removes the left sidebar, promotes the bottom nav to canonical) — user-facing and cross-cutting, but no data model, business logic, or route change, and fully reversible.

> Phase 2 of the THA UX Refresh, building on UX0 (Home Experience). Canonical
> location per `REPOSITORY_CONVENTIONS.md` § 3 is `docs/implementation/ux/`; the
> mission brief's shorthand `docs/implementation/UX1_CANONICAL_BOTTOM_NAVIGATION.md`
> is honoured here in its conventional workstream subfolder.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/UX1-canonical-bottom-navigation-20260710` → `610e4d7b427ddd71aa3e51dc86fbf588977d92d6` |
| Working tree | Intentionally dirty — pre-existing unauthored working-tree changes were present at session start (UX0's uncommitted code + a repository-housekeeping doc reorganisation). The tag protects committed state only; it does not cover those uncommitted changes. |
| This task's writes | `client/src/components/nav-bar.tsx`, `client/src/App.tsx`, `client/src/index.css`, `docs/implementation/ux/UX1_CANONICAL_BOTTOM_NAVIGATION.md` |
| Rollback to committed state | `git checkout rollback/UX1-canonical-bottom-navigation-20260710 -- client/src/components/nav-bar.tsx client/src/App.tsx client/src/index.css` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/implementation/ux/UX0_HOME_EXPERIENCE.md` (prior phase — Home as default landing + first nav destination)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity
  ✓ Navigation destinations keep their existing route paths (one key space each).
  Explain: /home, /planner, /cookbook, /shopping-workspace, /pantry,
  /plant-diversity, /my-diary, /analyser — unchanged route identities.

□ One owner per fact
  ✓ There is now exactly ONE navigation source of truth.
  Explain: The prior two lists (NAV_ITEMS_MAIN for the sidebar, MOBILE_BOTTOM_ITEMS
  for the mobile bar) are consolidated into a single ordered `NAV_ITEMS`. Both the
  canonical BottomNav and the dormant DesktopSidebar read that one list.

□ No duplicate entities
  ✓ No new nav entity. The BottomNav is the existing mobile nav promoted to
  canonical; no parallel navigation component was created.

□ No duplicate ownership
  ✓ Confirm. Nav order/labels/icons have a single owner (`NAV_ITEMS`).

□ No duplicate state
  ✓ Confirm. Active-page state derives from `useLocation()` only; no nav state is
  stored. The obsolete sidebar-collapsed localStorage is now dormant (unused).

□ Extends existing architecture
  ✓ Explain: Reuses the existing REALM_STYLES highlighting, the wouter routes, the
  `tha:open-workspace` repeat-tap drawer mechanism, and the existing bottom-nav
  component — extended, not replaced-beside.

□ Progressive enrichment where appropriate
  ✓ N/A — navigation chrome, not a knowledge entity.

□ Honest gaps over fabricated information
  ✓ N/A — no knowledge rendered.

□ No permanent synchronisation bridge
  ✓ Confirm. Consolidating two lists into one REMOVES a latent divergence risk
  (the two lists could drift); no bridge is introduced.

□ Evolution over replacement
  ✓ Explain: The DesktopSidebar is retired, not deleted — kept dormant in
  nav-bar.tsx (not rendered) so rollout is safe and reversible by re-adding a
  single line in App.tsx. Retirement condition: delete the dormant DesktopSidebar,
  TopBar, BrandBanner, and their helpers once the canonical BottomNav is confirmed
  in production (a follow-up cleanup workstream).
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: None at the data layer. Navigation presentation/chrome only.
Declared SoT: N/A — no data domain touched. Routes unchanged.
New store created? NO
Existing store extended? NO
Consumer created? NO — the canonical BottomNav is the existing mobile nav promoted;
  it reads location state only.
```

---

## IMPLEMENTATION

### Files changed

1. **`client/src/components/nav-bar.tsx`**
   - **Consolidated two nav lists into one canonical `NAV_ITEMS`** in the required
     order: Home → Planner → Cookbook → Shopping → Pantry → Nutrition → Diary →
     Analyser. Each item carries its `hasWorkspace` flag (Home and Shopping have no
     workspace drawer; the other six do).
   - **Promoted the mobile bottom nav to the canonical `BottomNav`** (renamed from
     `MobileNav`; item renamed `MobileNavItem` → `BottomNavItem`):
     - Removed the `md:hidden` restriction → the bar now renders on **Desktop,
       Tablet and Mobile**.
     - Responsive layout: `justify-around` + `max-w-lg` on mobile; centred with
       `md:justify-center md:gap-2 md:max-w-3xl`, larger tap targets
       (`md:min-w-[64px] md:px-4`) and label size (`md:text-[11px]`) on ≥768px.
     - **Alias-aware active highlighting** (`NAV_ACTIVE_ALIASES` + `isNavItemActive`):
       the correct pill stays highlighted on routes that render the same page as a
       canonical destination (`/diary`→Diary, `/meals`→Cookbook,
       `/weekly-planner`→Planner, `/products`→Analyser, `/basket` & `/analyse-basket`
       →Shopping). Added `aria-current="page"` on the active item and
       `aria-label="Primary"` on the nav for accessibility.
     - Preserved the `tha:open-workspace` repeat-tap-to-open-drawer behaviour and
       the existing `data-testid`s (`mobile-bottom-nav`, `mobile-nav-<label>`) so no
       automation or the print stylesheet breaks.
   - **Retired the `DesktopSidebar`**: it is no longer rendered. Its code (and
     `SidebarBody`, which now maps the consolidated `NAV_ITEMS`) is kept dormant for
     safe rollback.

2. **`client/src/App.tsx`**
   - Swapped the import `{ DesktopSidebar, MobileNav }` → `{ BottomNav }`.
   - Removed `<DesktopSidebar />` from the `ProtectedRoute` layout; the `<main>`
     content region now spans full width.
   - Rendered `<BottomNav />` (was `<MobileNav />`).

3. **`client/src/index.css`**
   - `.main-safe`: reserve bottom clearance (`safe-area + 80px`) at **all**
     breakpoints. Previously the ≥768px override removed it because the bottom nav
     was mobile-only; now the nav is canonical everywhere, so desktop content must
     clear it too.

### What was deliberately reused (no duplication)

- Existing wouter routes — unchanged.
- Existing `REALM_STYLES` per-route colour system for highlighting.
- Existing `tha:open-workspace` workspace-drawer mechanism (7 pages listen).
- Existing header basket icon (live count) and profile/apple menu (Profile,
  Partners, Admin, Log out) — these already provided Admin/Logout access, so
  removing the sidebar loses no destinations.

---

## DEFINITION OF DONE

**Success looks like:**
- A single bottom navigation bar is the primary navigation on Desktop, Tablet and
  Mobile, in the order Home, Planner, Cookbook, Shopping, Pantry, Nutrition, Diary,
  Analyser — Home first.
- The left sidebar is gone from every screen size.
- The active page's item is always clearly highlighted (including on alias routes).
- Every previously-reachable destination is still reachable; page content is never
  hidden behind the fixed bar.

**What must not break:**
- All routes still resolve and render; Home (UX0) is unchanged.
- Repeat-tap on the active nav item still opens that page's workspace drawer.
- Admin (admins) and Log out remain reachable (via the header profile menu).
- The basket badge and header search still function.

**Manual test steps:** see *Manual Verification* below.

---

## DATA IMPACT

- Reads existing data: **NO** (navigation chrome; reads only current location).
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- Could this mislead the user? **No** — it clarifies "where am I" by showing one
  consistent, highlighted navigation everywhere.
- Could this fabricate certainty? **No.**
- Is anything guessed but shown as real? **No.**
- What happens if the system is wrong? Highlighting falls back to no active pill;
  navigation still works via the routes.
- No architectural duplication introduced: **YES** — duplication was *removed* (two
  lists → one).
- No new source of truth created: **YES.**
- No runtime behaviour altered for other domains: **YES** — domain pages, business
  logic, and routes are untouched.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/UX1-canonical-bottom-navigation-20260710` → `610e4d7b427ddd71aa3e51dc86fbf588977d92d6`
- **Files modified:** `client/src/components/nav-bar.tsx`, `client/src/App.tsx`, `client/src/index.css`
- **Rollback commands:**
  ```bash
  git checkout rollback/UX1-canonical-bottom-navigation-20260710 -- \
    client/src/components/nav-bar.tsx \
    client/src/App.tsx \
    client/src/index.css
  ```
  (Fast partial rollback without a full revert: re-add `<DesktopSidebar />` and
  restore `<MobileNav />` in `App.tsx`, and re-add `md:hidden` to the nav — the
  DesktopSidebar component is still present, dormant.)
- **Verification after rollback:** `npx tsc --noEmit` shows no new `client/src`
  errors; the left sidebar returns on desktop and the bottom nav returns to
  mobile-only.

---

## MANUAL VERIFICATION

Run `npm run dev`, log in, then:

1. **Canonical bar on all sizes** — At desktop, tablet, and mobile widths, a single
   bottom navigation bar is present. No left sidebar appears at any width.
2. **Order & Home-first** — The items read, left to right: **Home, Planner,
   Cookbook, Shopping, Pantry, Nutrition, Diary, Analyser**, with Home first.
3. **Active highlight** — Navigate to each destination; the matching item is clearly
   highlighted. Visit `/meals` (Cookbook), `/diary` (Diary), `/basket` (Shopping),
   `/weekly-planner` (Planner), `/products` (Analyser) — the correct pill stays
   highlighted on these alias routes.
4. **Responsiveness** — Resize from mobile to desktop: items stay evenly spread on
   small screens and centre with comfortable spacing on large screens; nothing
   overflows horizontally.
5. **Content clearance** — On each page, scroll to the bottom; page content is not
   hidden behind the fixed bar at any width.
6. **Workspace drawer preserved** — On Planner/Cookbook/Pantry/Nutrition/Diary/
   Analyser, tap the already-active item again → that page's workspace drawer opens.
7. **No lost destinations** — Shopping is reachable from the bar (and still via the
   header basket icon with its count). Admin (as an admin) and Log out are reachable
   from the header profile/apple menu.
8. **Home unchanged** — `/home` still shows the UX0 greeting and today's cards.
9. **Print** — Print preview hides the navigation bar (unchanged print rule).

**Automated checks performed this session:**
- `npx tsc --noEmit` → **0 errors in `client/src`** (remaining errors are
  pre-existing `server/` issues unrelated to UX1).
- `npx vite build` → **exit 0**, client bundle built successfully.

---

## SCOPE LOCK

**Implemented scope:**
- Canonical BottomNav across Desktop, Tablet and Mobile, in the required order.
- Removal (retirement) of the left DesktopSidebar from the layout.
- Single consolidated `NAV_ITEMS` source of truth.
- Alias-aware active highlighting + accessibility attributes.
- Content-clearance CSS for all breakpoints.
- Implementation report + manual verification steps.

**Explicitly excluded scope (NOT done):**
- No redesign of any domain page (Planner, Cookbook, Shopping, Pantry, Nutrition,
  Diary, Analyser) or of Home.
- No change to business logic, data, or endpoints.
- No routing change beyond active-highlight alias mapping (no routes added/removed/
  redirected).
- No removal of the header basket icon or profile/apple menu (they carry the
  shopping shortcut/count and the Admin/Logout destinations).
- The dormant `DesktopSidebar`, `TopBar`, and `BrandBanner` code (and the
  now-unused `useSidebarState` collapse persistence) are left in place, not deleted.

**SUGGESTION (out of scope — do not implement without approval):**
- Follow-up cleanup workstream to delete the dormant `DesktopSidebar`, `TopBar`,
  `BrandBanner`, `SearchModal` (if it becomes fully unused), and `useSidebarState`
  once the canonical BottomNav is confirmed in production. This removes the last
  navigation dead code.
- Consider whether the header basket icon should remain now that Shopping is a
  first-class nav destination, or be simplified to a badge-only indicator, in a
  later UX phase.
- Consider refreshing the stale `data-testid` names (`mobile-bottom-nav`,
  `mobile-nav-<label>`) to breakpoint-neutral names in a coordinated change with
  any test suites.
