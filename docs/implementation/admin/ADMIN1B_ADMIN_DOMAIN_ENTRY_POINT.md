# ADMIN1B — Admin Domain Entry Point

**Date:** 2026-07-07
**Scope:** Routing and navigation only — no schema, auth, or benchmark changes.

---

## Objective

Restore a single, routed Admin domain entry point in the navigation. Prior to this implementation, three admin pages were orphaned (no registered routes) and the navigation exposed four separate admin item links instead of one consolidated entry point.

---

## Problem State (Pre-Implementation)

### Orphaned pages (files existed, no route registered)

| File | Intended route |
|---|---|
| `client/src/pages/admin-page.tsx` | `/admin` |
| `client/src/pages/admin-intelligence-page.tsx` | `/admin/intelligence` |
| `client/src/pages/admin-benchmark-households-page.tsx` | `/admin/benchmark-households` |

Both `/admin/intelligence` and `/admin/benchmark-households` were referenced inside the codebase (links, API calls, navigation within pages) but were unreachable because the routes were never registered in `App.tsx`.

### Duplicate admin navigation

Both `nav-bar.tsx` (AppleMenu dropdown) and `workspace-header.tsx` (ProfileMenu dropdown) independently rendered four admin items each:

- Users → `/admin/users`
- Picks → `/admin/ingredient-products`
- Recipe Sources → `/admin/recipe-sources`
- Companion Intelligence → `/admin/companion-intelligence`

This bypassed the admin hub entirely and duplicated the pattern across two components.

---

## Changes Made

### 1. `client/src/App.tsx`

Added imports for the three orphaned pages:

```ts
import AdminPage from "@/pages/admin-page";
import AdminIntelligencePage from "@/pages/admin-intelligence-page";
import AdminBenchmarkHouseholdsPage from "@/pages/admin-benchmark-households-page";
```

Registered three new routes (placed at the head of the admin route block):

```tsx
<Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
<Route path="/admin/intelligence" component={() => <ProtectedRoute component={AdminIntelligencePage} />} />
<Route path="/admin/benchmark-households" component={() => <ProtectedRoute component={AdminBenchmarkHouseholdsPage} />} />
```

All existing four admin sub-routes remain unchanged.

### 2. `client/src/components/nav-bar.tsx`

Replaced four admin DropdownMenuItems in `AppleMenu` with a single consolidated entry:

```tsx
{isAdmin && (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
      <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="apple-menu-admin">
        <ShieldCheck className="h-4 w-4" />
        Admin
      </Link>
    </DropdownMenuItem>
  </>
)}
```

Removed unused icon imports: `Star`, `Sliders`, `Sparkles`.

### 3. `client/src/components/workspace-header.tsx`

Replaced four admin DropdownMenuItems in `ProfileMenu` with a single consolidated entry:

```tsx
{isAdmin && (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
      <Link href="/admin" className="flex items-center gap-2 cursor-pointer" data-testid="workspace-menu-admin">
        <ShieldCheck className="h-4 w-4" />
        Admin
      </Link>
    </DropdownMenuItem>
  </>
)}
```

Removed unused icon imports: `Star`, `Sliders`, `Sparkles`.

---

## Route Map (Post-Implementation)

| Route | Page | Status |
|---|---|---|
| `/admin` | `admin-page.tsx` | ✅ Registered (new) |
| `/admin/users` | `admin-users-page.tsx` | ✅ Registered (existing) |
| `/admin/ingredient-products` | `admin-ingredient-products-page.tsx` | ✅ Registered (existing) |
| `/admin/recipe-sources` | `admin-recipe-sources-page.tsx` | ✅ Registered (existing) |
| `/admin/companion-intelligence` | `admin-companion-intelligence-page.tsx` | ✅ Registered (existing) |
| `/admin/intelligence` | `admin-intelligence-page.tsx` | ✅ Registered (new) |
| `/admin/benchmark-households` | `admin-benchmark-households-page.tsx` | ✅ Registered (new) |

---

## Navigation Entry Points

Both dropdown menus (AppleMenu in TopBar, ProfileMenu in workspace pages) show a single **Admin** item → `/admin` when `(user as any)?.role === "admin"`. The hub page (`admin-page.tsx`) then surfaces all six sub-sections as cards.

---

## Access Control

`admin-page.tsx` contains its own role guard:

```tsx
if (!user || (user as any)?.role !== "admin") {
  return <NotFound />;
}
```

All sub-pages retain their individual guards. `ProtectedRoute` enforces authentication at the router level. No auth changes were made.

---

## Files Changed

- `client/src/App.tsx`
- `client/src/components/nav-bar.tsx`
- `client/src/components/workspace-header.tsx`

## Files Unchanged

All existing admin page components, all server routes, schema, auth, session configuration.
