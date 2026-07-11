# ADMIN1C — Admin Domain Restoration

**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN
**Reason:** Verification and restoration confirmation only — no page, route, navigation, schema, or auth was rebuilt, redesigned, or duplicated.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-admin1c-20260707` → `d3c8827` |
| Working tree | Intentionally dirty — pre-existing unstaged changes in canonical-foods import (`package.json`, `server/cli/import-canonical-foods.ts`, `server/lib/canonical-foods-importer.ts`, `shared/knowledge/index.ts`) and untracked docs. **None are Admin-domain files.** ADMIN1C touched no source files. |
| This task's writes | `docs/implementation/admin/ADMIN1C_ADMIN_DOMAIN_RESTORATION.md` (this document) only |
| Rollback to committed state | `git checkout rollback/before-admin1c-20260707` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (standard implementation process)
- [x] `docs/investigations/platform/AUDIT1_PLATFORM_REGRESSION_AND_FEATURE_AVAILABILITY.md` (the audit that identified — and confirmed the resolution of — the Admin orphaning, Finding F1)
- [x] `docs/implementation/admin/ADMIN1B_ADMIN_DOMAIN_ENTRY_POINT.md` (the implementation that restored the Admin entry point)

---

## OBJECTIVE

Restore the previously implemented Admin domain: verify that `/admin`, its navigation entry, the hub page, the child routes, the existing pages, permissions, and the navigation flow are all present and connected. Reconnect anything that has become disconnected. **Do not rebuild, redesign, or duplicate** any Admin page, route, or navigation entry.

---

## METHOD

Restoration is defined across the three layers that determine whether a feature is actually *available*, following the same model as AUDIT1:

1. **Route registration** — does the URL resolve to a page? (`client/src/App.tsx`)
2. **Navigation reachability** — is there a rendered entry point that links to it? (`workspace-header.tsx` `ProfileMenu`, `nav-bar.tsx` `AppleMenu`)
3. **Runtime health** — do the page and its backing endpoints load and respond?

Verification techniques:
- Static read of the router, both nav menus, and the hub page.
- Default-export presence check across all seven Admin page files.
- Enumeration of registered `/api/admin/*` server endpoints.
- **Live probe** of the running dev server (`localhost:5000`) across representative Admin endpoints.

---

## VERIFICATION RESULT

The Admin domain is **fully present and connected** at HEAD `d3c8827`. It was restored by the immediately preceding commit `d3c8827` ("Consolidate admin navigation and register missing admin routes"), implemented under **ADMIN1B** and independently confirmed by **AUDIT1 Finding F1** ("Admin domain was orphaned; already restored"). ADMIN1C independently re-verified every layer.

### Route registration — `client/src/App.tsx`

| Route | Component | Import | Route line |
|---|---|---|---|
| `/admin` | `AdminPage` (hub) | `App.tsx:29` | `App.tsx:210` |
| `/admin/users` | `AdminUsersPage` | `App.tsx:30` | `App.tsx:211` |
| `/admin/ingredient-products` | `AdminIngredientProductsPage` | `App.tsx:31` | `App.tsx:212` |
| `/admin/recipe-sources` | `AdminRecipeSourcesPage` | `App.tsx:32` | `App.tsx:213` |
| `/admin/companion-intelligence` | `AdminCompanionIntelligencePage` | `App.tsx:33` | `App.tsx:214` |
| `/admin/intelligence` | `AdminIntelligencePage` | `App.tsx:34` | `App.tsx:215` |
| `/admin/benchmark-households` | `AdminBenchmarkHouseholdsPage` | `App.tsx:35` | `App.tsx:216` |

All seven routes are wrapped in `ProtectedRoute` (router-level authentication). All seven page files export a default component (verified).

### Navigation reachability

| Surface | Location | Entry | Gating |
|---|---|---|---|
| `ProfileMenu` (live workspace header) | `workspace-header.tsx:97–105` | single **Admin** item → `/admin` | `isAdmin` (`role === "admin"`) |
| `AppleMenu` (legacy `TopBar`) | `nav-bar.tsx:355–361` | single **Admin** item → `/admin` | `isAdmin` |

`ProfileMenu` is the **live** entry point — it is rendered by `WorkspaceHeader` on every authenticated non-admin page, so an admin reaches the hub from anywhere in the app. `AppleMenu` carries an identical, consistent entry but is dead code (its container `TopBar` is never rendered — see AUDIT1 F4); it is left untouched to avoid unrelated churn. Both menus show a **single** consolidated `Admin` link — no duplicate per-section links remain.

### Hub page — `client/src/pages/admin-page.tsx`

Renders all seven sections as cards via `ADMIN_SECTIONS`: Overview (coming-soon placeholder), Users, Picks, Recipe Sources, Companion Intelligence, Benchmark Households, Intelligence Dashboard. Each active card links to its registered child route. The hub carries its own role guard (`role !== "admin"` → `NotFound`).

### Permissions

Unchanged and intact at three layers: router `ProtectedRoute` (auth), hub/sub-page in-component `role === "admin"` guards, and server-side `/api/admin/*` gating (returns `403` to non-admins).

### Runtime health (live probe, `localhost:5000`)

```
200  /api/version                      (server healthy)
403  /api/admin/users                  (route healthy, auth-gated)
403  /api/admin/recipe-sources         (route healthy, auth-gated)
200  /api/admin/benchmark-households    (route healthy)
```

`403`/`200` responses confirm the Admin endpoints are reachable and correctly permission-gated (not `404`/`500`).

---

## RECONNECTION PERFORMED

**None required.** No Admin route, page, navigation entry, or permission was found disconnected. Every element enumerated in the mission — `/admin` route, Admin navigation entry, Admin hub page, Admin child routes, existing Admin pages, existing permissions, existing navigation flow — is present and wired. The domain was already restored by `d3c8827`; recreating any part would introduce the duplication the mission explicitly forbids. ADMIN1C therefore makes **no code change** and only records the verified restored state.

### Known open items (out of ADMIN1C scope — not disconnections)

These were catalogued by AUDIT1 as pre-existing polish/hygiene gaps, **not** regressions or disconnections. They are additive future work and are deliberately excluded here (see Scope Lock):

- **F3** — No in-app "← Admin" return path from an admin sub-page back to the hub (browser back / URL retype only). Never existed; additive.
- **F5** — Admin sub-pages opt out of the shared `WorkspaceHeader`, so they lack the global basket/profile chrome. Consistency gap; intentional-looking; additive.
- **F4** — Dead `TopBar`/`AppleMenu`/`BrandBanner` in `nav-bar.tsx`. Code hygiene only; removal is unrelated churn.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity ✓
  Each Admin route resolves to exactly one page component; the hub is the single
  canonical Admin entry (/admin). No competing key space.

□ One owner per fact ✓
  Admin permission is owned by role === "admin", checked at router, page, and
  server layers reading the same fact. No second store.

□ No duplicate entities ✓
  No new page, route, or component created. All seven Admin pages pre-exist and
  are reused verbatim.

□ No duplicate ownership ✓
  No attribute given a second owner. Navigation now funnels to a single Admin
  entry; the prior four-item duplication was already removed by ADMIN1B.

□ No duplicate state ✓
  No user state introduced or split.

□ Extends existing architecture ✓
  This task extends nothing — it verifies the existing wouter router + WorkspaceHeader
  ProfileMenu + role-guarded hub pattern already in place.

□ Progressive enrichment where appropriate ✓ (N/A)
  No knowledge entity or transactional state touched.

□ Honest gaps over fabricated information ✓
  Open items (F3/F4/F5) are reported as gaps, not silently implied resolved.
  No fabricated "restoration work" is claimed — the domain was already restored.

□ No permanent synchronisation bridge ✓
  No bridge created.

□ Evolution over replacement ✓
  Nothing replaced; existing pages/routes retained.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Admin (client navigation/routing surface)
Declared SoT: client/src/App.tsx (route table) + client/src/pages/admin-*.tsx (pages)
New store created? NO
Existing store extended? NO
Consumer created? NO
  (Verification only — no code written beyond this document.)
```

---

## DEFINITION OF DONE

- **Success:** `/admin` and all six child routes resolve; the Admin nav entry is reachable for admins; the hub surfaces all sub-sections; permissions and runtime endpoints are healthy — all verified above. ✅
- **Must not break:** No source file changed, so nothing can break. The pre-existing dirty working tree (canonical-foods import) is untouched by ADMIN1C.
- **Manual test steps:**
  1. Sign in as a user with `role === "admin"`.
  2. Open the profile menu (top-right) → click **Admin** → lands on `/admin`.
  3. On the hub, each active card navigates to its `/admin/*` sub-page.
  4. Sign in as a non-admin → the **Admin** menu item is absent, and `/admin` renders `NotFound`; `/api/admin/*` returns `403`.

---

## DATA IMPACT

- Reads existing data: **NO** (static/routing verification only)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- Could this mislead the user? **No** — no user-facing change.
- Could this fabricate certainty? **No** — the "restored" claim is evidenced by route lines, nav lines, default-export checks, and a live probe, and correctly attributes the restoration to the prior commit `d3c8827`/ADMIN1B rather than to this task.
- Is anything guessed but shown as real? **No.**
- What happens if the system is wrong? **N/A** — no runtime behaviour altered.
- No architectural duplication introduced: **YES** (none — no code written).
- No new source of truth created: **YES** (none).
- No runtime behaviour altered (governance/verification-only work): **YES.**

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-admin1c-20260707` → `d3c8827`
- **Files modified by ADMIN1C:** `docs/implementation/admin/ADMIN1C_ADMIN_DOMAIN_RESTORATION.md` only.
- **Rollback commands:** `git rm docs/implementation/admin/ADMIN1C_ADMIN_DOMAIN_RESTORATION.md` (or `git checkout rollback/before-admin1c-20260707`).
- **Verification after rollback:** Admin domain remains fully functional (it was never modified by this task).

---

## SCOPE LOCK

**Implemented scope:**
- Independent verification of every Admin layer (routes, imports, pages, nav entries, permissions, runtime).
- This restoration-confirmation document.

**Explicitly excluded scope (NOT done):**
- Rebuilding or redesigning any Admin page, route, or navigation entry (mission-forbidden; none was disconnected).
- Adding new Admin features or pages.
- F3 "← Admin" return-path affordance.
- F5 rendering `WorkspaceHeader` on admin pages.
- F4 dead-code removal (`TopBar`/`AppleMenu`/`BrandBanner`).
- The unrelated Companion regression (AUDIT1 F2) and the §4 conversation-subsystem export gaps — separate domain, separate task.

**SUGGESTION (out of scope — do not implement without approval):**
The highest-value adjacent items are AUDIT1 **F3** (add a "← Admin" link on each sub-page for a coherent hub return path) and **F2** (the live Companion regression — a one-line export fix in `server/intelligence/conversation/nutrition-enrichment.ts`). Both are additive/isolated but belong to their own tasks.
