# UX0 — Home Experience — Implementation

**Date:** 2026-07-10
**Branch:** int1-intelligence-platform
**Risk:** 🟡 AMBER
**Reason:** Changes the default post-login landing and adds a permanent navigation destination (user-facing routing/navigation change), but introduces no new data store, no schema change, and is fully reversible.

> Phase 1 of the THA UX Refresh. Canonical location per `REPOSITORY_CONVENTIONS.md` § 3 is `docs/implementation/ux/`; the mission brief's shorthand path `docs/implementation/UX0_HOME_EXPERIENCE.md` is honoured here in its conventional workstream subfolder.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/UX0-home-experience-20260710` → `8e10ea32f41a6275d1fb1bc115be588ff8195a3d` |
| Working tree | Intentionally dirty — a pre-existing, unrelated repository-housekeeping change (staged doc moves/deletions) was present at session start and was **not** authored by this task. The tag protects committed state only; it does not cover those uncommitted changes. |
| This task's writes | `client/src/pages/home-experience-page.tsx` (new), `client/src/App.tsx`, `client/src/components/nav-bar.tsx`, `client/src/components/workspace-header.tsx` |
| Rollback to committed state | `git checkout rollback/UX0-home-experience-20260710` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight governing principles)
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (via the Domain Ownership Quick Reference in ARCHITECTURE_PRINCIPLES.md — Planner/Shopping/Diary declared owners)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity
  ✓ Each entity touched keeps exactly one key space.
  Explain: Meal (meals.id), Planner (planner_weeks/days/entries), Shopping
  (shopping_list.id). Home reads these; it introduces no new key space.

□ One owner per fact
  ✓ Every value Home shows is read from its existing single owner.
  Explain: Today's meals ← /api/planner/full + /api/meals; shopping count ←
  /api/shopping-list; plant count ← /api/home/intelligence (weeklyProgress);
  reminders ← /api/intelligence/companion/observations. Home owns none of them.

□ No duplicate entities
  ✓ No new entity created.
  Explain: A new *presentation* surface (home-experience-page.tsx) — not a data
  entity. It is distinct from the pre-login marketing page (home-page.tsx) and
  from the detailed analytics view (dashboard.tsx).

□ No duplicate ownership
  ✓ Confirm. No attribute is given a second owner; Home is read-only.

□ No duplicate state
  ✓ Confirm. Home holds no user state. Queries reuse existing react-query keys,
  so the caches are shared (e.g. ["/api/home/intelligence"] is the same key the
  Dashboard's HomeIntelligenceCompanion already reads — one cache, no second fetch).

□ Extends existing architecture
  ✓ Explain: Reuses the ProtectedRoute chrome, WorkspaceHeader (realm="home"),
  REALM_STYLES nav pattern, and the existing read hooks/queries. It builds on the
  established page + nav pattern, not beside it.

□ Progressive enrichment where appropriate
  ✓ Explain: Home surfaces transactional state (planner/shopping) and read-only
  intelligence projections. It adds no enrichment pipeline. Honest gaps: each
  section renders a calm empty state or is absent when no validated data exists.

□ Honest gaps over fabricated information
  ✓ Explain: No meals → "Nothing planned for today yet"; clear list → "Your list
  is clear."; reminders section is omitted entirely when the Notice Engine
  returns nothing. Nothing is invented.

□ No permanent synchronisation bridge
  ✓ Confirm. No bridge created; Home is a read-only consumer.

□ Evolution over replacement
  ✓ Explain: No store replaced. The prior intent-based landing redirect is
  superseded as the DEFAULT destination only; the /api/routing endpoint and the
  routing-correction telemetry remain in place (now dormant) — see Scope Lock.
```

---

## AI ARCHITECTURE COMPLIANCE

Home surfaces AI/intelligence output (companion observations, home-intelligence weekly progress) but adds no new AI capability.

```
✓ Uses the canonical Intelligence Platform — reads /api/home/intelligence and
  /api/intelligence/companion/observations, both thin read-only projections over
  existing canonical owners (Notice Engine, WS8/WS10/WS11, Planner, Meal store).
✓ Uses the Capability Registry — indirectly, via those endpoints; no new binding.
✓ Uses the Intent Engine — N/A: Home issues no new intents; it renders existing
  server-computed projections verbatim.
✓ Reuses existing business services — planner, shopping, meals, notice engine.
✓ Does not create another assistant — the FloatingAssistant is untouched; Home
  renders no chat surface and no second companion.
✓ Does not duplicate conversation state — Home holds no conversation state.
✓ Uses registered capabilities only — via existing endpoints.
✓ Uses permission-aware access — all queries gated on `enabled: !!user`; the
  observations hook returns an honest empty state on 401.
✓ Produces honest gaps rather than fabricated knowledge — see checklist above.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: None at the data layer (read-only presentation). Navigation/routing config only.
Declared SoT: Planner (planner_weeks/days/entries), Shopping (shopping_list),
  Meals (meals), Home Intelligence (/api/home/intelligence projection),
  Notice Engine (/api/intelligence/companion/observations) — all unchanged.
New store created? NO
Existing store extended? NO
Consumer created? YES — a new read-only UI consumer (home-experience-page.tsx).
  Reads from declared SoT? YES — via existing endpoints/query keys only.
```

---

## IMPLEMENTATION

### What was built

1. **`client/src/pages/home-experience-page.tsx` (new)** — the calm Home screen:
   - Personalised greeting **"Welcome Home, {firstName}."** (falls back to
     displayName/username local-part; renders "Welcome Home." if no name), with a
     muted date eyebrow for orientation ("where am I / when is now").
   - Subtitle **"How can I help your family today?"**
   - **Today's focus**, showing only today's most relevant information:
     - **Today's Meals** — derived from the active planner week and the current
       calendar day-of-week (the planner is week-number based with no stored
       date, so "today" is composed client-side using the established
       `day.dayOfWeek === new Date().getDay()` pattern). Links to `/planner`.
     - **Shopping** — count of unchecked `/api/shopping-list` items. Links to
       `/shopping-workspace`.
     - **Plant Diversity** — `weeklyProgress.plantCount` of 30 with a slim
       progress bar. Links to `/plant-diversity`.
     - **Reminders** — up to three `useCompanionObservations()` notices; the
       whole card is omitted when there are none.
   - A quiet "See your full dashboard" link to `/dashboard` (keeps the detailed
     analytics view reachable without cluttering Home).
   - Every clickable card carries a clear label + chevron/arrow so the next
     logical action is always obvious.

2. **`client/src/App.tsx`** —
   - Imported `HomeExperiencePage`; added `<Route path="/home">` inside
     `ProtectedRoute` (so Home inherits the sidebar/header/nav chrome).
   - **Made Home the default post-login destination:** `HomeRoute` now redirects
     onboarded, authenticated users to `/home` (previously an intent-based
     redirect to planner/cookbook/analyser/shopping). Unauthenticated users still
     see the marketing `HomePage`; non-onboarded users still go to `/onboarding`.
   - Removed the now-unused `routeToPath` helper and the `useQuery` import that
     only served the superseded routing redirect.

3. **`client/src/components/nav-bar.tsx`** — permanent Home destination:
   - Added a `Home` item as the **first** entry in both `NAV_ITEMS_MAIN`
     (desktop sidebar) and `MOBILE_BOTTOM_ITEMS` (mobile bottom nav).
   - Added a `/home` entry to `REALM_STYLES` (brand-green home anchor) so the nav
     pill highlights active/inactive consistently with every other destination.

4. **`client/src/components/workspace-header.tsx`** — repointed the three logo
   `<Link>`s (desktop two-row, desktop single-row, mobile) from `/dashboard` to
   `/home` with `aria-label="Home"`. The logo is the universal "home" affordance;
   it now returns users to the Home anchor.

### Why this shape

- **Reuse over rebuild:** Home renders from existing query keys, so it shares the
  Dashboard's caches and introduces no new fetch path or state.
- **No duplicate greeting:** Home renders its own greeting and deliberately does
  **not** embed `HomeIntelligenceCompanion` (which carries its own greeting); the
  Dashboard keeps that component unchanged.
- **Calm and uncluttered:** a single narrow column (`max-w-3xl`), three focus
  cards, optional reminders — no charts, no dialogs, no dense stat strips.

---

## DEFINITION OF DONE

**Success looks like:**
- After login, an onboarded user lands on `/home` showing the greeting, subtitle,
  and today's meals/shopping/plant-diversity (+ reminders when present).
- "Home" appears as a permanent, first destination in the desktop sidebar and the
  mobile bottom nav, and highlights when active.
- The logo returns the user to Home from anywhere.
- Users can always tell where they are (Home title + active nav pill + greeting)
  and what to do next (labelled cards with a clear affordance).

**What must not break:**
- Unauthenticated `/` still shows the marketing page; onboarding redirect intact.
- Dashboard, Planner, Shopping, Plant Diversity, and all other routes still work
  and are unchanged in behaviour.
- Basket badge count and search in the header still function.

**Manual test steps:** see *Manual Verification* below.

---

## DATA IMPACT

- Reads existing data: **YES** (planner, meals, shopping list, home-intelligence
  projection, companion observations — all via existing endpoints).
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- Could this mislead the user? **No.** Every figure is read straight from its
  canonical owner; empty states are explicit, never invented.
- Could this fabricate certainty? **No.** No AI-generated claims are produced;
  intelligence text is rendered verbatim from server projections.
- Is anything guessed but shown as real? **No.** Missing data renders as an honest
  empty state or an absent section.
- What happens if the system is wrong / a query fails? Cards fall back to their
  calm zero/empty copy; the reminders card simply does not render. Home never
  errors on missing data.
- No architectural duplication introduced: **YES** (confirmed — read-only reuse).
- No new source of truth created: **YES** (confirmed).
- No runtime behaviour altered for other domains: **YES** — only the default
  landing redirect and the logo target changed; other pages are untouched.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/UX0-home-experience-20260710` → `8e10ea32f41a6275d1fb1bc115be588ff8195a3d`
- **Files modified:**
  - `client/src/pages/home-experience-page.tsx` (new — delete to remove)
  - `client/src/App.tsx`
  - `client/src/components/nav-bar.tsx`
  - `client/src/components/workspace-header.tsx`
- **Rollback commands:**
  ```bash
  git checkout rollback/UX0-home-experience-20260710 -- \
    client/src/App.tsx \
    client/src/components/nav-bar.tsx \
    client/src/components/workspace-header.tsx
  rm client/src/pages/home-experience-page.tsx
  ```
  (Or, to restore the whole committed tree: `git checkout rollback/UX0-home-experience-20260710`.)
- **Verification after rollback:** `npx tsc --noEmit` shows no new `client/src`
  errors; login lands on the prior intent-based destination; no "Home" nav item;
  logo returns to `/dashboard`.

---

## MANUAL VERIFICATION

Run `npm run dev`, then in a browser:

1. **Default landing** — Log in as an onboarded user. You land on `/home` and see
   "Welcome Home, {name}." and "How can I help your family today?".
2. **Today's Meals** — If today's active-week planner day has meals, they list
   here; the card links to the planner. With none planned, it reads "Nothing
   planned for today yet — tap to map out your day."
3. **Shopping** — The card shows the unchecked-item count (or "Your list is
   clear.") and opens `/shopping-workspace`.
4. **Plant Diversity** — Shows "N of 30 plants" with a progress bar; opens
   `/plant-diversity`.
5. **Reminders** — When the companion has notices, up to three appear under "A
   gentle reminder"; when it has none, the card is absent (no empty box).
6. **Permanent Home nav** — Desktop: "Home" is the first sidebar item and
   highlights when on `/home`. Mobile: "Home" is the first bottom-nav item.
7. **Logo affordance** — From any page, click the header logo → returns to
   `/home`.
8. **Where-am-I** — On `/home` the header title reads "Home" and the Home nav pill
   is active.
9. **No regressions** — Visit Planner, Cookbook, Shopping, Plant Diversity, Diary,
   Pantry, Analyser: each loads and behaves as before. The basket badge and search
   still work.
10. **Unauthenticated** — Log out; visit `/`: the marketing landing page still
    shows with Sign in / Create account.

**Automated checks performed this session:**
- `npx tsc --noEmit` → **0 errors in `client/src`** (remaining errors are
  pre-existing `server/` issues unrelated to UX0).
- `npx vite build` → **exit 0**, client bundle built successfully (3262 modules).

---

## ARCHITECTURE CONVERGENCE STATUS

*(Optional for 🟡 AMBER; included briefly for completeness.)*

This workstream introduces **no** new duplication and converges nothing — it is a
read-only presentation + navigation change. It does, however, leave one item of
now-dormant code (the intent-based routing redirect + routing-correction
telemetry) that is superseded as the landing behaviour but not yet removed. See
Scope Lock for the retirement suggestion.

---

## SCOPE LOCK

**Implemented scope:**
- New Home page; `/home` route; Home as the default post-login destination.
- Permanent Home navigation (sidebar + mobile bottom nav + realm styling).
- Logo → Home.
- Implementation report + manual verification steps.

**Explicitly excluded scope (NOT done):**
- No redesign of the Dashboard, Planner, Shopping, Plant Diversity, Diary,
  Pantry, Analyser, or any other domain.
- No change to the data model, endpoints, or any server code.
- No removal of the `/api/routing` endpoint or the `useRoutingCorrectionTracker`
  telemetry (left in place, now dormant).
- No new intelligence capability, assistant, or conversation surface.
- The unused `TopBar` / `BrandBanner` components in `nav-bar.tsx` (not rendered by
  the live layout) still reference `/dashboard`; left untouched as dead code.

**SUGGESTION (out of scope — do not implement without approval):**
- Retire the now-dormant intent-based landing path: `/api/routing`,
  `useRoutingCorrectionTracker`, and the `_routingLanding` module state in
  `App.tsx`, plus the `routing_correction` event tracking. They no longer affect
  the landing destination and could be removed in a dedicated cleanup once the
  team confirms the intent-routing signal is no longer wanted.
- Consider surfacing a compact "today" summary directly in the mobile experience
  and adding a keyboard shortcut / quick-add from Home in a later UX phase.
- Consider whether the detailed `/dashboard` view should eventually fold into
  Home or remain a separate "full view" — a product decision for a later phase.
```
