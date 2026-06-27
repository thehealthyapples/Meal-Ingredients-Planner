# WX11 — Platform Shell Standard Implementation

**Status:** Complete  
**Rollback:** `git tag wx11-pre` (created before any changes)  
**Branch:** `safety/preserve-since-last-prod-20260617-1613`

---

## Architecture Compliance Check

Before any changes, confirmed:

| Check | Status | Notes |
|---|---|---|
| One canonical Platform Shell | ✓ | `WorkspaceHeader` in `workspace-header.tsx` is the sole Site Banner owner |
| One Brand Banner owner | ✓ | `WorkspaceHeader` owns THA logo, portalled via `WorkspaceHeaderSlotContext` to span full width |
| One Sidebar owner | ✓ | `DesktopSidebar` in `nav-bar.tsx` |
| One Workspace Header owner | ✓ | `WorkspaceHeader` in `workspace-header.tsx` |
| One Workspace Toolbar owner | ✓ | `contextBar` prop on `WorkspaceHeader` |
| One Workspace Content owner | ✓ | `<main>` in `ProtectedRoute` in `App.tsx` |
| No duplicate navigation | ✓ | `BrandBanner` and `TopBar` exist in `nav-bar.tsx` but are NOT used in `ProtectedRoute` (legacy, dead code) |
| No duplicate search bars | Investigated — see below |
| No duplicate commands | Investigated — see below |
| No duplicate branding | ✓ |
| No schema changes | ✓ |
| No API changes | ✓ |
| No AI changes | ✓ |
| No business logic changes | ✓ |

---

## Pre-existing Architecture State

The current shell already matches the WX11 target:

```
Browser
  ↓
SiteBanner (green promo banner, optional)
  ↓
WorkspaceHeader (portalled — spans full width above sidebar)
  ├── [Desktop] THA Long Logo | Page Title | [search/center] | [actions] | Basket | Profile
  └── [contextBar] Workspace Toolbar Row Two (if provided)
  ↓
DesktopSidebar + <main> (Workspace Content)
  ↓
MobileNav (bottom, mobile only)
```

### Pages already having a Workspace Toolbar (contextBar)

| Page | Toolbar Contents |
|---|---|
| Planner | Week navigation, view mode tabs |
| Cookbook | Search, category tabs, filters |
| Shopping Workspace | Mode switcher (Add/Review/Prep/Shop) + workspace control bar |
| Diary | Tab selector (Daily Log / Progress) + date navigation |
| Pantry | Tab selector + category filters |
| Shopping List | Mode tabs |

### Pages requiring Workspace Toolbar (WX11 deliverables)

| Page | Required Actions | Implementation |
|---|---|---|
| Dashboard | Log Food, Log Signals, Log Weight, Plan Week | Added via contextBar |
| Nutrition | Foods, Benefits, Nutrients, Suggestions | Added as tab contextBar |
| Partners | Explore Partners, Become a Partner, Category, Service type, Search | Controls promoted from page body |
| Profile | Personal, Household, Account | Scroll-target tabs |
| Analyser | Apple Rating quick filter | Added as contextBar |

---

## Implementation Log

### 1. Rollback Protection

```bash
git tag wx11-pre
```

### 2. Dashboard — Quick Actions Toolbar

**Controls promoted to contextBar:**
- Log Food → navigates to `/my-diary`
- Log Signals → opens existing signals dialog
- Log Weight → opens existing weight dialog
- Plan Week → navigates to `/planner`

**File modified:** `client/src/pages/dashboard.tsx`

### 3. Nutrition — Learning Toolbar

**Tabs added to contextBar:**
- Foods → shows `PlantDiversityReport` (weekly food variety)
- Nutrients → shows `HouseholdNutritionCentre` (lifetime nutrition data)
- Benefits → informational section (placeholder, see SUGGESTIONS)
- Suggestions → points to cookbook discovery

**File modified:** `client/src/pages/plant-diversity-page.tsx`

**Investigation finding:** Surfacing health benefits as a first-class experience requires new content components (benefit explanations per food group, personalised benefit links to household health goals). This is documented under SUGGESTIONS as a high-value future enhancement.

### 4. Partners — Discovery Toolbar

**Controls promoted from page body to contextBar:**
- Service type filter (All / Online / Local / Both)
- Category selector (compact dropdown)
- Search input
- "Become a Partner" action button

**Removed from page body:**
- Category pill filter section
- Search + service type filter row (previously in `#partners-grid` section)

**Hero section:** Retained. CTA buttons removed from hero (now in toolbar).

**File modified:** `client/src/pages/partners-page.tsx`

### 5. Profile — Section Navigation Toolbar

**Tabs added to contextBar:**
- Personal → scrolls to Personal section
- Household → scrolls to Household section
- Account → scrolls to Settings & Support section

**Implementation:** Tab click triggers `scrollIntoView` on section elements identified by `data-testid` attributes already present.

**File modified:** `client/src/pages/profile-page.tsx`

**Note:** Spec listed "Health", "Membership", "Notifications" as suggested tabs. These do not correspond to distinct current sections. Documented under SUGGESTIONS.

### 6. Analyser — Apple Rating Toolbar

**Controls added to contextBar:**
- Apple Rating quick filter (1–5 compact pills)
- Clear rating button (when active)

**Already in place (not duplicated):**
- Search input (in `centerContent` of WorkspaceHeader)
- Barcode scanner (in `centerContent`)
- Full filter panel (in `actions` → Popover)

**File modified:** `client/src/pages/products-page.tsx`

---

## Definition of Done Checklist

- [x] Full-width Site Banner — pre-existing via portal architecture
- [x] THA Long Logo permanently visible — desktop: `logo-long.png`; mobile: apple icon
- [x] Logo inline with workspace title — pre-existing in WorkspaceHeader desktop layout
- [x] Sidebar begins below Site Banner — pre-existing via portal (header portals above sidebar row)
- [x] Universal Workspace Toolbar implemented — contextBar now on all authenticated pages
- [x] Dashboard quick actions implemented
- [x] Nutrition learning toolbar implemented
- [x] Shopping toolbar retained (pre-existing)
- [x] Partners toolbar implemented (controls promoted)
- [x] Profile toolbar implemented
- [x] Analyser toolbar implemented
- [x] Duplicate controls removed (Partners page body filter section removed)
- [x] Search ownership standardised (Partners search moved to toolbar)
- [x] Platform consistency achieved
- [x] Existing functionality preserved

---

## Files Modified

1. `docs/investigations/WX11_PLATFORM_SHELL_STANDARD_IMPLEMENTATION.md` (this file)
2. `client/src/pages/dashboard.tsx`
3. `client/src/pages/plant-diversity-page.tsx`
4. `client/src/pages/partners-page.tsx`
5. `client/src/pages/profile-page.tsx`
6. `client/src/pages/products-page.tsx`

---

## SUGGESTIONS

These opportunities were identified during implementation but fall outside WX11 scope:

### S1 — Nutrition: Health Benefits as first-class discovery

Surfacing nutritional benefits per food group would require a new content component mapping plant families → health benefits (e.g. "Cruciferous vegetables → sulforaphane → cancer risk reduction"). This would be a high-impact feature but requires new data/content design. Recommend as WX12 focus.

### S2 — Nutrition: Personalised Suggestions

"Suggestions" tab could show personalised "eat more of X" recommendations based on the household's plant diversity gaps. Currently the PlantDiversityReport shows diversity scores; a dedicated Suggestions section could surface 3–5 specific ingredients to try. Requires UX design.

### S3 — Profile: Health section

A dedicated "Health" profile tab (health goals, conditions, intolerances) would require extracting health-related preferences from the Personal section. Currently grouped under Personal.

### S4 — Profile: Membership section

A "Membership" tab for subscription/plan management is not currently in the profile page. Would need API and business logic development.

### S5 — Profile: Notifications section

Notification preferences are not currently in the profile page. Would be a valuable addition.

### S6 — Analyser: Recent history

A "Recent" quick-access section in the Analyser toolbar showing recently searched/scanned products would require a local persistence layer (localStorage or API). High UX value for repeat users.

### S7 — BrandBanner + TopBar cleanup

`BrandBanner` and `TopBar` in `nav-bar.tsx` are dead code — they are defined but not used in `ProtectedRoute`. These should be removed in a future cleanup pass to reduce bundle size and code confusion.

### S8 — Desktop: overflow-hidden scroll areas

Several pages still scroll the whole page on desktop. The Nutrition, Partners, and Profile pages in particular could benefit from scoped scroll areas (content scrolls within the fixed workspace frame). This is a follow-on to WX11.
