# WX12A — Profile Page Regression Fix Implementation

## Investigation Summary

The `/profile` page was incorrectly displaying "Unable to load profile." on first render after navigation. The API was functioning correctly. The failure was caused by a TanStack Query v5 semantics mismatch: the page used `isLoading` as its loading guard, which returns `false` on subsequent renders when cached data exists but a background refetch is in-flight. With the synchronous render path introduced by `WorkspaceHeader`, this race caused the page to briefly (or immediately) fall through to the error branch before data had resolved.

## Root Cause

`isLoading` in TanStack Query v5 is `true` only on the very first fetch when there is no cached data **and** the query is currently fetching. If the query has previously resolved (e.g. via navigation that hit the cache), `isLoading` is `false` even though `data` may be `undefined` on the first synchronous render tick. This allowed `!profile` to be `true` immediately, triggering the "Unable to load profile." error state before the query had a chance to resolve.

`isPending` is the correct v5 guard: it is `true` whenever `data === undefined`, regardless of whether a fetch is in-flight. The page must remain in the loading state until data is present.

## Implementation Performed

In `client/src/pages/profile-page.tsx`:

- **Line 191**: Changed `isLoading` → `isPending` in the `useQuery` destructure
- **Line 240**: Changed `if (isLoading)` → `if (isPending)` as the loading gate

No other changes were made to this file as part of WX12A. The accompanying `WorkspaceHeader` swap (from `PageHeader`) is a separate concern from WX10/WX11 and is present on this branch.

## Rollback Identifier

HEAD commit at rollback point: `265cadd548246b8c1eea820c8793940bd79dc74e`

To roll back:
```
git restore client/src/pages/profile-page.tsx
```
or, to restore the pre-branch state:
```
git checkout 265cadd548246b8c1eea820c8793940bd79dc74e -- client/src/pages/profile-page.tsx
```

## Files Changed

| File | Change |
|------|--------|
| `client/src/pages/profile-page.tsx` | `isLoading` → `isPending` (lines 191, 240) |

## Architecture Compliance

- ✅ One canonical Profile page — unchanged
- ✅ One WorkspaceHeader — unchanged
- ✅ No duplicate loading state — single guard at line 240
- ✅ No duplicate profile ownership — unchanged
- ✅ No schema changes
- ✅ No persistence changes
- ✅ Extends existing implementation only
- ✅ No workaround logic
- ✅ No changes outside approved scope

## Verification Results

**TypeScript:** Zero client-side errors (`npx tsc --noEmit` — errors present only in pre-existing `server/scripts/` and `server/tests/` files, unrelated to this change).

**Behavioural:** The `isPending` guard holds the loading skeleton until `data` is defined. The "Unable to load profile." error branch (`if (!profile)`) is now only reachable when the query has settled with no data — i.e. a genuine API failure — which correctly preserves error surfacing.

**Regression scope:** No other pages were modified. The `isPending` change is scoped to the `useQuery(["/api/profile"])` guard only.

## Follow-Up Recommendations

**WX12B (Recommended):** Audit all remaining page-level TanStack Query loading guards across the application. Several pages (e.g. `HouseholdManagementSection` in this same file at line 730, `HouseholdEatersSection` at line 999) still use `isLoading`. While these sub-components are less exposed to the synchronous-render race, a systematic audit would ensure consistent v5 semantics across the codebase and prevent future regressions of the same class.
