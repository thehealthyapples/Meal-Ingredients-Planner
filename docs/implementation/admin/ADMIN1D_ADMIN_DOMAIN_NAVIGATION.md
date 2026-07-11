# ADMIN1D — Admin Domain Navigation

**Status:** ✅ Complete — Admin left-nav entry + shared Admin banner across all Admin pages
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Scope:** Additive navigation only. No new pages, no route duplication, no auth/permission change.
**Related:** [`AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md`](../../investigations/platform/AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md) §F3 (no in-app return path from admin pages); [`ADMIN1B_ADMIN_DOMAIN_ENTRY_POINT.md`](./ADMIN1B_ADMIN_DOMAIN_ENTRY_POINT.md) (registered the routes this builds on)

---

## 1. Executive summary

Admin was reachable (routes registered in ADMIN1B) but did not **behave** as a domain: the only entry point was the apple/profile dropdown, and once inside an admin sub-page there was no consistent header or cross-navigation — the browser back button or URL-retyping was the only way around (AUDIT1 §F3).

ADMIN1D makes Admin a proper domain with two additive pieces:

1. **Left-navigation Admin entry (admins only)** — a persistent `Admin` item in the desktop sidebar, linking to `/admin`, gated on `role === "admin"`.
2. **Shared Admin banner** — a single `AdminBanner` component rendered above the Admin hub and every Admin sub-page, providing a consistent Admin header **and** a cross-navigation bar between the existing Admin pages.

No new admin pages, no route duplication, no change to auth or permissions, and no unrelated navigation touched.

---

## 2. What changed

### 2.1 Left navigation — `client/src/components/nav-bar.tsx`

Added an `Admin` item to the sidebar's bottom section (alongside Log out), rendered only when `isAdmin`. It reuses the existing `SidebarNavItem` (so it inherits collapsed-mode tooltips and active styling for free) and the already-imported `ShieldCheck` icon.

- **Links to `/admin`.**
- **Active** whenever `location.startsWith("/admin")`, so it highlights on the hub and every sub-page.
- Appears in the **desktop left sidebar only** — the mobile bottom nav (`MOBILE_BOTTOM_ITEMS`) is the product nav and was deliberately left untouched. The existing apple-menu Admin link (admins only) is unchanged.

### 2.2 Shared Admin banner — `client/src/components/admin-banner.tsx` (new component, not a page)

A self-contained `AdminBanner`:

- **Self-gating:** returns `null` unless `role === "admin"`, so it is inert if ever mounted above a non-admin guard (e.g. a page's `NotFound`).
- Renders a `ShieldCheck` + **Admin** label and a horizontal, scrollable nav of links to the existing Admin routes, highlighting the current page (`location === href`).
- Creates **no routes** and owns **no auth** — it only links to routes already registered in `App.tsx`.

Banner links (existing routes only, exactly as specified):

| Label | Route |
|---|---|
| Overview | `/admin` |
| Users | `/admin/users` |
| Picks | `/admin/ingredient-products` |
| Recipe Sources | `/admin/recipe-sources` |
| Companion Intelligence | `/admin/companion-intelligence` |
| Intelligence Dashboard | `/admin/intelligence` |
| Benchmark Households | `/admin/benchmark-households` |

### 2.3 Rendering the banner — `client/src/App.tsx`

Rather than edit seven pages' bespoke internals, the banner is composed onto each Admin page centrally via a small `withAdminBanner(Component)` wrapper that renders `<AdminBanner/>` above the page. The wrapped components are created **once at module scope** (`AdminHomeChrome`, `AdminUsersChrome`, …) so component identity is stable and pages do not remount on re-render. The seven Admin `<Route>`s now point at the wrapped components; the `<ProtectedRoute>` shell, paths, and guards are otherwise unchanged.

```
<Route path="/admin" component={() => <ProtectedRoute component={AdminHomeChrome} />} />
… /admin/users, /admin/ingredient-products, /admin/recipe-sources,
   /admin/companion-intelligence, /admin/intelligence, /admin/benchmark-households
```

### Scope note — Knowledge Review

`/admin/knowledge-review` exists and remains registered, but the mission enumerated exactly the seven routes above as the banner's pages and links. It was therefore **left untouched** (no banner, not added as a link) to honour "use existing pages only / do not touch unrelated navigation" and the explicit link list. The hub card for Knowledge Review is unchanged and still reaches it.

---

## 3. Constraints honoured

- **Use existing Admin pages only** — no page files created; `AdminBanner` is a component.
- **Do not create new Admin pages** — none created.
- **Do not duplicate routes** — the seven `<Route>` paths are unchanged; only the wrapped component reference changed.
- **Do not change auth or permissions** — no guard, `assertAdmin`, or role logic touched. The new UI is gated by the same `role === "admin"` check used elsewhere.
- **Do not touch unrelated navigation** — product nav (`NAV_ITEMS_MAIN`, `MOBILE_BOTTOM_ITEMS`), TopBar, and apple menu are unchanged.

---

## 4. Verification

- **TypeScript:** `tsc --noEmit` — no errors in `App.tsx`, `admin-banner.tsx`, or `nav-bar.tsx`.
- **Client build:** `vite build` succeeds — 3253 modules transformed, no errors (pre-existing chunk-size warning only).
- **Live dev server:** Vite middleware serves the new module (`GET /src/components/admin-banner.tsx` → `200 text/javascript`, containing the `admin-banner-nav` marker), confirming the client picks up the change with no server restart.
- **Logic review:**
  - Left-nav `Admin` renders only when `isAdmin`, links to `/admin`, active across `/admin*`.
  - `AdminBanner` returns `null` for non-admins; links resolve to the seven registered routes; active state matches the current path.
  - All seven Admin routes render the banner above their content via the module-scope wrapped components.

`data-testid`s added for testability: `admin-banner`, `admin-banner-nav`, `admin-banner-link-<label>`, and the sidebar item's existing `sidebar-nav-admin`.
