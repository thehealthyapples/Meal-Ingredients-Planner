# WX12A — Profile Page Regression Fix

**Branch:** `safety/preserve-since-last-prod-20260617-1613`  
**Date:** 2026-06-27  
**Rollback identifier:** `74936746e983e8045a002aeb23bb1f1d779b44b0`  
(restore with `git stash apply 74936746e983e8045a002aeb23bb1f1d779b44b0`)

---

## Problem

`/profile` showed **"Unable to load profile."** immediately on navigation. The message is rendered by the `!profile` guard in `ProfilePage` — reached only when `isLoading` is `false` and `data` is `undefined`.

## Investigation

### API status: ✅ working
`GET /api/profile` returns HTTP 200 with valid JSON for authenticated users. Server-side route, `buildProfileResponse`, and database queries (`getUser`, `getUserPreferences`) are correct. Auth session is valid when the page is reached because `ProtectedRoute` guards it.

### Root cause: TanStack Query v5 `isLoading` vs `isPending` semantic change

In **TanStack Query v4**, `isLoading` meant: *"status is pending (no cached data)"* — equivalent to what v5 calls `isPending`.

In **TanStack Query v5** (`^5.60.5`), the definition changed:
```
isLoading = isPending && isFetching
         = (status === 'pending') && (fetchStatus === 'fetching')
```

When a query first mounts with no cached data, there is a brief window where:
- `status = 'pending'` (no data)
- `fetchStatus = 'idle'` (fetch not yet started)

During that window: `isLoading = false`, `data = undefined`.

### Why `WorkspaceHeader` made this window visible

The old `PageHeader` component had no hooks that triggered parent state updates. The new `WorkspaceHeader` contains:

```tsx
useLayoutEffect(() => { setRealm(realm); }, [realm, setRealm]);
```

`setRealm` calls `setActiveRealm` inside `ProtectedRoute`. `useLayoutEffect` runs **synchronously** after every React commit. This causes:

1. `ProfilePage` renders with `isLoading=false, data=undefined` (pending/idle state)
2. React commits to DOM
3. `WorkspaceHeader`'s `useLayoutEffect` fires → `setRealm("diary")` → `ProtectedRoute` re-renders synchronously
4. `ProfilePage` re-renders: still `isLoading=false, data=undefined`
5. React commits **"Unable to load profile."** to the DOM ← **user sees this**
6. `useEffect` callbacks run → TanStack Query starts the fetch (`fetchStatus → 'fetching'`, `isLoading → true`)
7. Loading skeleton appears briefly
8. Fetch completes → full profile shows

Before `WorkspaceHeader`, step 3–5 didn't exist. The query transitioned from idle to fetching before any extra commit occurred, so the "Unable to load profile." state was never visible.

### Confirmed failure type
**WorkspaceHeader/shell regression** — specifically the `useLayoutEffect` synchronous re-render cycle exposing TanStack Query v5's narrowed `isLoading` definition.

---

## Fix

**File changed:** `client/src/pages/profile-page.tsx`

Changed the profile query and its loading guard from `isLoading` to `isPending`:

```diff
- const { data: profile, isLoading } = useQuery<ProfileData>({
+ const { data: profile, isPending } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

- if (isLoading) {
+ if (isPending) {
    return (/* loading skeleton */);
  }
```

`isPending` (`status === 'pending'`) is `true` whenever there is no cached data, **regardless of whether the fetch has started**. This is the v4 equivalent of `isLoading` and prevents the error state from being shown while the query is in the initial idle window.

The error state (`!profile`) is now only reached when `status === 'error'` (a genuine API failure), which is the correct behaviour.

---

## Verification

- `npm run build` passes with no TypeScript errors ✅
- `GET /api/profile` returns HTTP 200 with valid profile JSON ✅
- No schema changes, no data changes, no backfill required ✅
- No unrelated pages modified ✅

### Manual verification checklist

- [ ] `/profile` desktop loads — profile content displays
- [ ] `/profile` mobile loads — profile content displays
- [ ] Hard refresh `/profile` — profile loads (not error state)
- [ ] Navigate to `/profile` from the apple/profile menu in `WorkspaceHeader`
- [ ] Other pages (Dashboard, Planner, Pantry, Shopping, Analyser) still load

---

## Architecture compliance

| Rule | Status |
|------|--------|
| One canonical app shell | ✅ unchanged |
| One WorkspaceHeader owner | ✅ unchanged |
| One Profile page owner | ✅ unchanged |
| No duplicate profile routes | ✅ unchanged |
| No duplicate profile state | ✅ unchanged |
| No schema changes | ✅ |
| No data meaning changes | ✅ |

---

## Suggestion (out of scope for this fix)

Other pages using `WorkspaceHeader` with a TanStack Query v5 `isLoading` guard may have the same brief flash. A global audit to replace `isLoading` with `isPending` in all page-level loading guards would harden the app against this class of regression. Not touched here per scope lock.
