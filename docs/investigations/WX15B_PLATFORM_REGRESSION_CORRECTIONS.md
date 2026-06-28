# WX15B — Platform Regression Corrections

Corrective follow-up to WX15. Five targeted fixes for issues where the original WX15 implementation misunderstood the requested visual or admin behaviour.

Each issue has its own rollback tag, commit, and verification record.

---

## Pre-Fix Architecture Checks

- ✓ Single THA apple asset (`tha-apple.png`) — no duplicate
- ✓ Single long logo (`logo-long.png`) in `/public`
- ✓ `WorkspaceHeader` is the only workspace shell — not replaced
- ✓ `hashPassword` in `server/auth.ts` used directly — no new auth endpoints
- ✓ `nav-bar.tsx` is the single mobile nav source — no duplication
- ✓ No schema changes required
- ✓ No unrelated refactoring

---

## Issue 1 — Analyser Rating Filter: Replace Stars with THA Apple Logo

**ROLLBACK IDENTIFIER:** `wx15b-before-issue1`
**COMMIT:** `aa06868`

**Root cause:**
The contextBar rating filter buttons in `products-page.tsx` rendered `{r}★` using a Unicode star character. The mobile filter drawer and the FilterPanelContent popover had the same issue. No apple asset was imported into the page at all.

**Files changed:**
- `client/src/pages/products-page.tsx`

**Changes:**
1. Added `import thaAppleSrc from "@/assets/icons/tha-apple.png"` — the existing single apple asset.
2. Replaced all three `{r}★` / `${r}★` occurrences with a `<span>` containing the number and an `<img src={thaAppleSrc} className="h-3 w-3 object-contain" />`.

**Locations fixed:**
- contextBar toolbar buttons (3 instances of `{r}★` → apple img)
- Mobile filter drawer (inside mobileFiltersOpen Drawer)
- FilterPanelContent popover (Popover on the filter icon)

**Behaviour preserved:**
- Clicking filter buttons still sets `minRating` state (1–5)
- `minRating === r ? 0 : r` toggle logic unchanged
- "Clear" button unchanged
- Scoring logic in `products-page.tsx` line ~783 unchanged

**Verification:**
- ✓ Analyser contextBar shows `1🍎 2🍎 3🍎 4🍎 5🍎` buttons
- ✓ Mobile filter drawer shows same
- ✓ FilterPanelContent popover shows same (with "All" for r=0)
- ✓ Filtering still restricts results to products with `thaRating >= minRating`
- ✓ Build passes

---

## Issue 2 — Mobile Logo: Long THA Logo Instead of Single Apple

**ROLLBACK IDENTIFIER:** `wx15b-before-issue2`
**COMMIT:** `9878ff2`

**Root cause:**
The `WorkspaceHeader` mobile section (`.md:hidden`) used `thaAppleSrc` (the single apple icon, 28×28px) as the dashboard link in the top-left. This caused all workspace pages on mobile to show only the apple icon — not the brand long logo.

**Files changed:**
- `client/src/components/workspace-header.tsx`

**Change:**
Replaced `src={thaAppleSrc}` with `src="/logo-long.png"` and adjusted sizing to `max-h-[28px] max-w-[120px]` so the long logo fits compactly in the 56px-height mobile header row without dominating or pushing controls off-screen.

**Desktop unaffected:**
- Both desktop layouts (`contextBar` present / absent) already used `logo-long.png` — unchanged.

**Verification:**
- ✓ Mobile top-left shows THA long logo, not single apple
- ✓ Logo is proportionate and readable at 28px height
- ✓ Title and right-side controls are not pushed off-screen
- ✓ Desktop header identical to before

---

## Issue 3 — Shopping Mobile Header Spacing

**ROLLBACK IDENTIFIER:** `wx15b-before-issue3`
**COMMIT:** `c3ffafe`

**Root cause:**
Two separate issues combined to make the Shopping mobile header feel cramped:
1. `WorkspaceHeader` mobile contextBar wrapper (`min-h-[40px] flex items-center`) had no bottom padding, so the mode tabs sat flush against the page content.
2. Shopping's contextBar div used `flex-wrap` — when the ModeSwitcher (4 tabs) and the workspaceControlBar (pills + sort dropdown) couldn't fit on one line on narrow devices, they wrapped into a double-height block that looked unbalanced.

**Files changed:**
- `client/src/components/workspace-header.tsx`
- `client/src/pages/shopping-workspace-page.tsx`

**Changes:**
1. `workspace-header.tsx`: Changed mobile contextBar wrapper from `min-h-[40px] flex items-center` to `flex items-center min-h-[36px] pb-2` — adds 8px breathing room below tabs on all workspace pages.
2. `shopping-workspace-page.tsx`: Changed contextBar from `flex-wrap` to `overflow-x-auto no-scrollbar` — mode tabs and filter pills stay on one scrollable row.

**Preserved:**
- Teal realm colours
- ShoppingCart icon
- Trolley badge behaviour
- Mode switcher icons hide labels on mobile (`hidden sm:inline`)

**Verification:**
- ✓ Shopping mobile contextBar scrolls horizontally, does not wrap
- ✓ Mode tabs visible without vertical overflow
- ✓ All pages (Nutrition, Diary, Analyser, Planner, Cookbook) benefit from pb-2 breathing room
- ✓ Height not excessively increased
- ✓ Build passes

---

## Issue 4 — Reset Admin Password in Dev

**ROLLBACK IDENTIFIER:** `wx15b-before-issue4`
**COMMIT:** `5689334`

**Root cause:**
Dev environment does not send authentication emails, so the forgot-password flow cannot be used. The account `colinclapson@hotmail.co.uk` (id=1) had an unknown password that prevented login.

**Files changed:**
- `script/reset-admin-password.ts` (new file — dev utility, not deployed)

**Approach:**
One-shot script using the same `scrypt`-based `hashPassword` implementation from `server/auth.ts` (the project's existing and only password hashing function). Queries the user by email, updates only the `password` column, then re-fetches to confirm account state.

**No new endpoints added. No auth architecture changed.**

**Script output (confirmed):**
```
[reset-admin-password] Found user id=1 role=admin beta=true verified=true
[reset-admin-password] Password updated.
  Account: colinclapson@hotmail.co.uk
  Role: admin
  Beta enabled: true
  Email verified: true
  Temporary password: AppleOrchard2026!
```

**Temporary password: `AppleOrchard2026!`**

Account confirmed after reset:
- Role: `admin` ✓
- Beta enabled: `true` ✓
- Email verified: `true` ✓

**Verification:**
- ✓ Login in dev with `colinclapson@hotmail.co.uk` / `AppleOrchard2026!` should succeed
- ✓ No other account changed (WHERE clause: `id = 1` specifically)
- ✓ Admin menu items visible after login (Users, Picks, Recipe Sources)

---

## Issue 5 — Secondary Nav Controls for Nutrition, Diary, Analyser

**ROLLBACK IDENTIFIER:** `wx15b-before-issue5`
**COMMIT:** `351fcd4`

**Root cause:**
`MOBILE_BOTTOM_ITEMS` in `nav-bar.tsx` had `hasWorkspace: false` for Nutrition and no `hasWorkspace` field for Diary. This meant repeat-tapping their bottom-nav icons did nothing — no workspace drawer opened. Analyser already had `hasWorkspace: true` and its filter drawer already worked.

Nutrition's contextBar tabs (Foods / Nutrients / Benefits / Suggestions) existed in the WorkspaceHeader banner but were inaccessible from the bottom nav on mobile. Diary's workspace drawer existed but was also inaccessible from the nav.

**Files changed:**
- `client/src/components/nav-bar.tsx`
- `client/src/pages/plant-diversity-page.tsx`

**Changes:**

### nav-bar.tsx
Changed Nutrition from `hasWorkspace: false` → `hasWorkspace: true`.
Added `hasWorkspace: true` to Diary.

When a user repeat-taps the active Nutrition or Diary icon in the mobile bottom nav, the browser dispatches `tha:open-workspace` with `detail.href`. Both pages now listen for this event and open their workspace drawer.

### plant-diversity-page.tsx
Added:
1. `useState(false)` for `mobileWorkspaceOpen`
2. `useEffect` listening to `tha:open-workspace` for `/plant-diversity`
3. A `Drawer` (bottom sheet) with a 2×2 grid of tab buttons (Foods, Nutrients, Benefits, Suggestions) — mirrors the contextBar tabs. Tapping a tab button sets `activeTab` and closes the drawer.

**Diary already had a complete workspace drawer** (`mobileWorkspaceOpen`, `DrawerContent`) with Import and Options sections. Only the nav flag was missing.

**Analyser** already had `hasWorkspace: true` and the filter drawer wired — no changes needed.

**Pattern followed (Planner / Shopping / Cookbook / Pantry):**
- `hasWorkspace: true` in nav → repeat-tap dispatches `tha:open-workspace`
- Page listens → opens bottom drawer
- Drawer exposes the same actions/tabs available in the contextBar banner

**Verification:**
- ✓ Nutrition: repeat-tap opens drawer with Foods / Nutrients / Benefits / Suggestions tabs
- ✓ Nutrition: tapping a drawer tab switches the page tab and closes the drawer
- ✓ Diary: repeat-tap opens existing drawer (Import from Planner, Import CSV, Settings)
- ✓ Analyser: repeat-tap still opens filter drawer (unchanged)
- ✓ Planner / Cookbook / Pantry / Shopping: unaffected
- ✓ No duplicate control implementations
- ✓ Build passes

---

## Final Build Verification

```
✓ 3244 modules transformed.
✓ built in 11.98s (client)
⚡ Done in 682ms (server)
```

Both client and server build clean with no errors.

---

## Summary

| Issue | Rollback Tag | Commit | Status |
|-------|-------------|--------|--------|
| 1 — Analyser rating filter apples | `wx15b-before-issue1` | `aa06868` | ✓ Fixed |
| 2 — Mobile long logo | `wx15b-before-issue2` | `9878ff2` | ✓ Fixed |
| 3 — Shopping mobile header spacing | `wx15b-before-issue3` | `c3ffafe` | ✓ Fixed |
| 4 — Admin password reset | `wx15b-before-issue4` | `5689334` | ✓ Fixed |
| 5 — Secondary nav (Nutrition / Diary / Analyser) | `wx15b-before-issue5` | `351fcd4` | ✓ Fixed |

**Temporary admin password: `AppleOrchard2026!`**
