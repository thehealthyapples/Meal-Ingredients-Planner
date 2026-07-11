# Admin Benchmark Navigation Visibility Fix

## Overview

Admin benchmark pages are accessible via the admin dropdown menu (Apple menu) in the top-right corner of the application. Both the **Intelligence Benchmark Dashboard** and **Benchmark Households** pages are visible only to users with `admin` role.

## Implementation

### Location
- **File:** `client/src/components/nav-bar.tsx`
- **Component:** `AppleMenu` (lines 329–399)
- **Navigation Section:** Admin dropdown (lines 355–393)

### Navigation Links

#### 1. Intelligence Benchmark Dashboard
```tsx
<DropdownMenuItem asChild>
  <Link href="/admin/intelligence" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-admin-intelligence">
    <BarChart3 className="h-4 w-4" />
    Intelligence Benchmark
  </Link>
</DropdownMenuItem>
```
- **Route:** `/admin/intelligence`
- **Icon:** `BarChart3` (from lucide-react)
- **Label:** "Intelligence Benchmark"
- **Test ID:** `apple-menu-admin-intelligence`

#### 2. Benchmark Households
```tsx
<DropdownMenuItem asChild>
  <Link href="/admin/benchmark-households" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-admin-benchmark-households">
    <FlaskConical className="h-4 w-4" />
    Benchmark Households
  </Link>
</DropdownMenuItem>
```
- **Route:** `/admin/benchmark-households`
- **Icon:** `FlaskConical` (from lucide-react)
- **Label:** "Benchmark Households"
- **Test ID:** `apple-menu-admin-benchmark-households`

### Admin-Only Access

Both links are rendered conditionally within an admin guard (lines 355–394):

```tsx
{isAdmin && (
  <>
    {/* All admin menu items, including benchmark pages */}
  </>
)}
```

The `isAdmin` flag is derived from the user's role:
```tsx
isAdmin: (user as any)?.role === "admin"
```

### Menu Structure

The admin menu follows this hierarchy:

1. **Profile** (visible to all users)
2. **Partners** (visible to all users)
3. ─────── *(separator)*
4. **Users** (admin only)
5. **Picks** (admin only)
6. **Recipe Sources** (admin only)
7. **Companion Intelligence** (admin only)
8. **Intelligence Benchmark** ← (admin only, INTQ4+)
9. **Benchmark Households** ← (admin only, INTQ4+)

## Usage

### For Admins
1. Click the Apple menu (top-right, THA logo)
2. Scroll to admin section (below the dashed separator)
3. Click **"Intelligence Benchmark"** or **"Benchmark Households"**

### For Non-Admins
Admin menu items are not rendered; only Profile and Partners are visible.

## Testing

### Manual Testing
1. **As an admin user:** Verify both links appear in the dropdown menu
2. **As a non-admin user:** Verify links do not appear in the dropdown menu
3. **Click Intelligence Benchmark:** Should navigate to `/admin/intelligence` and display the benchmark dashboard
4. **Click Benchmark Households:** Should navigate to `/admin/benchmark-households` and display the households control panel

### Automated Testing
Test IDs for Cypress/Playwright tests:
- `apple-menu-admin-intelligence`
- `apple-menu-admin-benchmark-households`

## Related Pages

- **Intelligence Benchmark Dashboard:** `client/src/pages/admin-intelligence-page.tsx`
  - Displays run history, scores, breakdowns, and downloadable reports
  - Runs Quick (10q), Full (100q), or Certification modes

- **Benchmark Households:** `client/src/pages/admin-benchmark-households-page.tsx`
  - Manages the 10 deterministic benchmark households
  - Allows impersonation, reset, and benchmark execution

## Routes (Server-Side)

All benchmark endpoints require admin role verification via `assertAdmin` middleware:

- `GET /api/admin/benchmark-households` — List all households
- `GET /api/admin/benchmark-households/{id}` — Inspect a household's fixture vs live state
- `POST /api/admin/benchmark-households/seed` — Seed the entire world
- `POST /api/admin/benchmark-households/{id}/reset` — Reset a household
- `POST /api/admin/benchmark-households/{id}/impersonate` — Impersonate a household's owner
- `POST /api/admin/benchmark-households/run-benchmark` — Execute a benchmark run

See `server/routes.ts` for full implementation.

## Permissions

- **No new permissions added** — uses existing `admin` role check
- **No functionality changed** — navigation only, pages unchanged
- **No new pages created** — links to existing pages only

## Environment

- DEV environment only (benchmark world is permanent test fixture)
- Production deploys: these pages are not accessible (admin role guard only)
