# ADMIN1 — Admin Domain Shell Implementation

**Status:** In Progress
**Started:** 2026-07-06
**Workstream:** ADMIN1
**Epic:** Admin as first-class main navigation domain

---

## Mission

Create an Admin entry in main navigation (sidebar) for admin users only. Build an Admin domain shell with tabs/cards for Overview, Users, Picks, Recipe Sources, Companion Intelligence, Benchmark Households, and Intelligence Dashboard. Link to existing pages; show disabled/coming-soon for unimplemented pages.

---

## Scope

### What we're doing:
- Add Admin navigation item to main sidebar (admin users only)
- Create `/admin` page with domain shell layout
- Create admin subdomain with tabs/cards for:
  - Overview (coming soon)
  - Users (links to /admin/users)
  - Picks (links to /admin/ingredient-products)
  - Recipe Sources (links to /admin/recipe-sources)
  - Companion Intelligence (links to /admin/companion-intelligence)
  - Benchmark Households (links to /admin/benchmark-households)
  - Intelligence Dashboard (links to /admin/intelligence)
- Apply REALM_STYLES for visual consistency with other domains
- Protect route: only admins can access /admin and its subdomain

### What we're NOT doing:
- Creating new admin functionality
- Changing permission or role system
- Exposing Admin to non-admin users
- Modifying existing admin pages

---

## Architecture

### Permission Gate
- Check: `(user as any)?.role === "admin"` (mirrors existing pattern in nav-bar.tsx)
- Fallback: Redirect to 404 if non-admin tries to access /admin
- Navigation visibility: Conditional render in sidebar only for admins

### Realm Styling
- Create new realm: `/admin` with distinct color scheme (neutral/slate for admin)
- Apply to sidebar nav item, realm banner, and domain shell
- Consistent with existing REALM_STYLES pattern

### Navigation Structure
```
Main Sidebar (DesktopSidebar)
├── Planner
├── Nutrition (Plant Diversity)
├── Cookbook
├── Pantry
├── Analyser
├── Shopping
├── Diary
└── Admin [ADMIN USERS ONLY]

Admin Shell (/admin)
├── Overview tab (coming soon)
├── Users tab → /admin/users
├── Picks tab → /admin/ingredient-products
├── Recipe Sources tab → /admin/recipe-sources
├── Companion Intelligence tab → /admin/companion-intelligence
├── Benchmark Households tab → /admin/benchmark-households
├── Intelligence Dashboard tab → /admin/intelligence
```

### Components
- **AdminDomainShellPage**: Main admin page at `/admin`
  - Tab navigation (horizontal or card grid)
  - Card-based layout for each section
  - Link or disabled state for each card
- **Realm style addition**: New admin realm in REALM_STYLES

### Files Modified
1. `client/src/components/nav-bar.tsx` — Add Admin nav item + realm style
2. `client/src/pages/admin-page.tsx` — New admin shell page
3. `client/src/App.tsx` — Add /admin route
4. Possibly `client/src/hooks/use-user.tsx` or create permission helper if needed

### Files Created
1. `client/src/pages/admin-page.tsx` — Admin domain shell

---

## Rollback Plan

### If we need to rollback:
```bash
# Full rollback (uncommit + revert files)
git reset --soft HEAD~1
git checkout -- .

# Or selective rollback
git checkout HEAD -- client/src/components/nav-bar.tsx
git checkout HEAD -- client/src/App.tsx
git rm client/src/pages/admin-page.tsx
```

---

## Validation Checklist

### As Admin User:
- [ ] Admin item appears in main sidebar
- [ ] Admin item has correct visual realm styling
- [ ] Clicking Admin navigates to /admin
- [ ] /admin page displays correctly with all tabs/cards
- [ ] All "Users", "Picks", "Recipe Sources", "Companion Intelligence", "Benchmark Households", "Intelligence Dashboard" cards link correctly
- [ ] "Overview" card is marked disabled/coming-soon
- [ ] Navigation breadcrumb or title shows "Admin"
- [ ] Realm banner shows admin color scheme (desktop)

### As Non-Admin User:
- [ ] Admin item does NOT appear in main sidebar
- [ ] Attempting to navigate to /admin shows 404
- [ ] No admin links visible in Apple menu (current behavior maintained)

### Edge Cases:
- [ ] Mobile navigation does not show Admin (mobile bottom nav stays focused on core domains)
- [ ] Realm context correctly reflects admin domain
- [ ] Admin pages still function at their direct routes (/admin/users, etc.)

---

## Implementation Steps

1. ✅ Create implementation documentation (this file)
2. ⏳ Create Admin realm style in nav-bar.tsx
3. ⏳ Add Admin nav item to NAV_ITEMS_MAIN (guarded by isAdmin)
4. ⏳ Create /admin shell page with tabs/cards
5. ⏳ Add route to App.tsx
6. ⏳ Test as admin and non-admin
7. ⏳ Verify existing admin page functionality unchanged

---

## Notes

- Admin uses `role === "admin"` permission model (not isAdmin helper yet)
- Existing admin pages accessed via Apple menu; new domain shell complements (doesn't replace) this
- Realm color chosen as neutral slate to denote administrative context
- No new routes or API endpoints required (all existing)

