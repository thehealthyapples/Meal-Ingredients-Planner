# INT35C — Admin Navigation Visibility Fix (Companion Intelligence)

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Branch:** int1-intelligence-platform
**Risk:** 🟢 GREEN
**Reason:** Navigation visibility only — adds a link to an already-shipped, already-`assertAdmin`-gated route. No dashboard page, data logic, Companion behaviour, routing, or Intelligence Platform code is touched.
**Builds on:** [`INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD.md`](./INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD.md) — which shipped the `/admin/companion-intelligence` page and route but left it undiscoverable except by typing the URL directly.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/int35c-admin-nav-visibility-20260702` → `4a2da735f5b80bac2da4dd306c387adeb5e431de` |
| Working tree | Intentionally dirty at start — prior uncommitted INT35/INT35B/INT35C/INT36/INT37 work already present on this branch, unrelated to this fix and untouched by it |
| This task's writes | `client/src/components/nav-bar.tsx`, `client/src/components/workspace-header.tsx` |
| Rollback to committed state | `git checkout rollback/int35c-admin-nav-visibility-20260702` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md`
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/implementation/INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD.md` (the page/route this fix makes visible)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity — N/A, no entity introduced.
□ One owner per fact — N/A, no fact introduced. The route ("/admin/companion-intelligence")
  already has exactly one owner: App.tsx's route table, unchanged by this fix.
□ No duplicate entities — confirmed, nothing new is created.
□ No duplicate ownership — confirmed.
□ No duplicate state — confirmed, no state of any kind is introduced.
□ Extends existing architecture — this is a straight repetition of the existing
  admin-nav-item pattern (Users / Picks / Recipe Sources), copied verbatim in
  structure into both places that pattern already lives.
□ Progressive enrichment where appropriate — N/A, not a knowledge entity.
□ Honest gaps over fabricated information — N/A, nothing is rendered as data.
□ No permanent synchronisation bridge — N/A.
□ Evolution over replacement — nothing is replaced; a fourth item is appended
  to an existing list of three.
```

## AI ARCHITECTURE COMPLIANCE

Not applicable — this change touches no AI/Intelligence code path (no Intelligence Platform, Intent Engine, Capability Registry, conversation, or LLM code was read or modified). It is a client-side navigation-only change.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: None — UI navigation only.
Declared SoT: N/A
New store created? NO
Existing store extended? NO
Consumer created? NO — the existing /admin/companion-intelligence route and its
  existing assertAdmin-gated API are unchanged; this fix only adds a second way
  (besides typing the URL) to reach the same, already-shipped consumer.
```

---

## 1. Objective

`INT35C_GOVERNED_COMPANION_LEARNING_AND_DASHBOARD.md` shipped the Companion Intelligence Dashboard and registered its route in `App.tsx`, but no navigation link to it existed anywhere in the product — an admin could only reach it by typing the URL directly. This fix adds a visible, admin-only navigation entry, and nothing else.

---

## 2. What changed

The app has exactly two places that render the admin dropdown menu — the top navigation bar and the per-page workspace header — and both already list the same three admin links (Users, Picks, Recipe Sources) behind the same `isAdmin` check. A fourth entry, "Companion Intelligence" → `/admin/companion-intelligence`, was appended to both, using the same `DropdownMenuItem asChild` + wouter `Link` structure as every existing entry, inside the same `{isAdmin && (...)}` block (no new gating logic — it reuses the exact boolean each file already computes from `useUser()`'s `role === "admin"`).

| File | Change |
|---|---|
| `client/src/components/nav-bar.tsx` (`AppleMenu`, the top-bar dropdown) | Added `Sparkles` to the `lucide-react` import; added one `DropdownMenuItem` linking to `/admin/companion-intelligence`, labelled "Companion Intelligence", inside the existing `isAdmin` block, after "Recipe Sources" |
| `client/src/components/workspace-header.tsx` (`ProfileMenu`, the workspace-header dropdown) | Identical addition, same icon/label/href/position, inside the same `isAdmin` block |

Both use `data-testid="apple-menu-admin-companion-intelligence"` / `data-testid="workspace-menu-admin-companion-intelligence"` respectively, matching each file's existing `data-testid` naming convention (`apple-menu-admin-*` / `workspace-menu-admin-*`).

**Not changed:** `App.tsx`'s route registration (already existed from INT35C), `admin-companion-intelligence-page.tsx` (dashboard page/data logic untouched), every server-side route/module from INT35C, the Companion/conversation pipeline, the Intelligence Platform, and `isAdmin`'s computation (`(user as any)?.role === "admin"`, reused verbatim — not reimplemented).

---

## 3. Why both files

The top bar (`nav-bar.tsx`) and the per-page workspace header (`workspace-header.tsx`) are two separate, independently-rendered dropdown components that happen to duplicate the same three-item admin list today (a pre-existing duplication in the codebase, not introduced by this fix). Adding the link to only one would leave the app inconsistent depending on which page an admin is viewing — the existing three admin items are already visible from both, so the new one needed to match that existing (if imperfect) precedent rather than introduce a fourth, partial state.

---

## 4. Verification

- `npx tsc --noEmit` — 153 pre-existing errors, unchanged (0 new); neither touched file introduced a new error.
- Dev server smoke test: booted cleanly, `GET /` and `GET /admin/companion-intelligence` both returned `200` with no server-side errors in the log.
- Full `npm test` — not re-run for this change; it touches only two client-side navigation components with no test coverage dependency and no server-side surface, so the existing 55/55 INT35C suite and the full `npm test` chain (verified green in the prior INT35C delivery) are unaffected by construction.
- Not verified: an admin-authenticated visual click-through of the dropdown. As in the prior INT35C delivery, creating or repurposing admin credentials for interactive testing is correctly blocked by this environment's safety controls, so this was verified by code inspection against the three existing, working admin entries (identical structure, identical `isAdmin` gate, identical component) rather than a live screenshot.

---

## DEFINITION OF DONE

- **What success looks like:** An admin sees "Companion Intelligence" in both admin dropdown menus, linking to the existing `/admin/companion-intelligence` route; a non-admin sees neither the new entry nor the three existing ones (same gate, unchanged).
- **What must not break:** The three existing admin nav entries, the dashboard page itself, and every non-admin nav item — none of their code was touched.
- **Manual test steps:** Log in as an admin, open the top-bar Apple menu and (on any workspace page) the workspace header profile menu, confirm "Companion Intelligence" appears after "Recipe Sources" in both, and confirm it navigates to the existing dashboard. Log in as a non-admin and confirm none of the four admin entries appear in either menu.

## DATA IMPACT

- Reads existing data: YES — `useUser()`'s existing `role` field, already read by both files for the pre-existing admin items.
- Writes new data: NO.
- Changes meaning of existing data: NO.
- Requires backfill: NO.

## TRUST CHECK

- Could this mislead the user? No — the link goes exactly where it says.
- Could this fabricate certainty? N/A.
- Is anything guessed but shown as real? No.
- What happens if the system is wrong? Worst case is a broken/missing link for admins; no data or routing risk.
- No architectural duplication introduced: YES (the two-file duplication is pre-existing, not new).
- No new source of truth created: YES.
- No runtime behaviour altered (for governance-only work): N/A — this is a small UI-visibility change, not governance-only; the only "behaviour" altered is the presence of one more link for admins.

## ROLLBACK PLAN

- Rollback identifier: `rollback/int35c-admin-nav-visibility-20260702` → `4a2da735f5b80bac2da4dd306c387adeb5e431de`
- Files modified: `client/src/components/nav-bar.tsx`, `client/src/components/workspace-header.tsx`
- Rollback commands: `git checkout rollback/int35c-admin-nav-visibility-20260702 -- client/src/components/nav-bar.tsx client/src/components/workspace-header.tsx`
- Verification steps after rollback: `npx tsc --noEmit` returns to 153 pre-existing errors; the "Companion Intelligence" entry no longer appears in either dropdown; the three existing admin entries and the dashboard route itself are unaffected either way (this fix never touched them).

## SCOPE LOCK

**Implemented:** A visible, admin-only "Companion Intelligence" navigation entry in both admin dropdown menus, linking to the existing `/admin/companion-intelligence` route.

**Explicitly excluded:**
- No change to `admin-companion-intelligence-page.tsx` or any of its data-fetching/mutation logic.
- No change to `App.tsx`'s route registration (already existed).
- No change to Companion behaviour, conversation routing, or Intelligence Platform code.
- No change to the pre-existing duplication between `nav-bar.tsx` and `workspace-header.tsx` (each independently lists the same admin items) — consolidating that into a single shared component would be a refactor outside this fix's 🟢 GREEN, visibility-only scope.

**Suggestions (not implemented, for a future ticket):** The admin dropdown's three-then-four items are hand-duplicated across two files; a shared `AdminMenuItems` component would remove that duplication the next time an admin nav item changes.
