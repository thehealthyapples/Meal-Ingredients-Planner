<!-- An implementation report records what was BUILT and proves it works. -->

# SUP1 — Support Hub Foundation — Implementation Report

**Date:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Implementation — client landing-page re-dress. No backend, no new API, no new calculation.
**Risk:** 🟢 GREEN (presentation only; every route, tool, guard and behaviour unchanged)
**Author:** Colin Clapson (via Claude Code)
**Design priors:** [`ADMIN2_SUPPORT_HUB_EXPERIENCE.md`](../investigations/admin/ADMIN2_SUPPORT_HUB_EXPERIENCE.md) (the experience design this builds), [`ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md`](../investigations/admin/ADMIN1_ADMIN_CONSOLE_ENGINEERING_HEALTH_AUDIT.md) (the inventory & IA).

---

## ROLLBACK INFORMATION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/SUP1-support-hub-foundation-20260717` → `7bfad50ca198f2b86f6501a4f82d8ae41af9260b` |
| Working tree | **Intentionally dirty** at session start — sibling sessions (NORTH3/4/5, FI18, P0, CONV1, INT19, ADMIN1/2) hold uncommitted changes. The tag covers **committed state only**; SUP1 touches exactly **two product files**, both listed below. |
| Rollback | `git checkout rollback/SUP1-support-hub-foundation-20260717 -- client/src/pages/admin-page.tsx client/src/components/admin-banner.tsx` (restores both files). No schema, migration, route, or data was changed, so nothing else needs reverting. |

---

## WHAT WAS BUILT

The Admin landing page was re-dressed as the **Support Hub** — "the study off the hall"
(`THA_EXPERIENCE_BLUEPRINT.md` §4.1: admin is a room in the same house, exposure E0, *"never a
second product"*), implementing ADMIN2's recommendation **QW-3**. This is a **landing re-dress
only**: every tool, route, client guard, `data-testid="admin-page"`, and downstream behaviour is
unchanged.

### Goal-by-goal

| Goal | Done | How |
|---|---|---|
| Rename the experience to Support Hub (routes unchanged) | ✅ | Page `<h1>` is now **"Support Hub"**; the persistent admin banner brand label renamed **"Admin" → "Support Hub"** (one word). **No route changed** — `/admin` and every `/admin/*` are identical. |
| A calm landing that feels like another room in the Orchard House | ✅ | Warm canvas, generous whitespace, one plain voice, no orchard imagery (correct for E0), quiet hover states. Uses only existing Calm Orchard tokens (`bg-accent/10`, `text-primary`, `text-muted-foreground`, `border-border`). No new colour, token, or component. |
| A short introduction explaining the Support Hub's purpose | ✅ | A two-sentence intro under the title (the "arrival/orientation" beat — Experience Language §5.9). |
| Surface **existing** Engineering Health information only (no new calculations) | ✅ | A calm **"Engineering health"** panel that surfaces *where health is already observable* and links to the tools that own each signal (Publication integrity · Runtime telemetry · Release readiness). **No new fetch, no new endpoint, no fabricated status** — see "An honest note on Engineering Health" below. |
| Group existing tools into Platform / Intelligence / Knowledge / People / Development | ✅ | All 11 existing tools mapped to exactly one group each (table below). |
| Expandable "Learn more" guidance per section | ✅ | Each group has a collapsible **"Learn more"** (canonical `ui/collapsible`), **collapsed by default** — progressive disclosure by intent (Experience Architecture §5). |
| Keep all existing tools and behaviour unchanged | ✅ | Tool titles, descriptions, icons and `href`s are carried verbatim; each card is the same `Link` → same route. |
| No backend changes · No new APIs · No duplicate functionality | ✅ | Zero server files touched; zero new queries; the health links are navigation to existing pages, not a second implementation of any signal. |

### The five groups (every existing tool, one obvious home)

| Group | Tools (unchanged routes) |
|---|---|
| **Platform** | Canonical Publication Integrity (`/admin/canonical-publication-integrity`) |
| **Intelligence** | Intelligence Dashboard (`/admin/intelligence`) · Companion Intelligence (`/admin/companion-intelligence`) · Observation Workbench (`/admin/observations`) · Behaviour Workbench (`/admin/behaviour`) |
| **Knowledge** | Picks (`/admin/ingredient-products`) · Recipe Sources (`/admin/recipe-sources`) · Knowledge Review (`/admin/knowledge-review`) |
| **People** | Users (`/admin/users`) |
| **Development** | Benchmark Households (`/admin/benchmark-households`) · Development World (`/admin/development-world`) |

The previous **"Overview"** card was a permanent `coming-soon` stub (`href: null`); it is replaced by
the intro + Engineering Health panel — the orientation beat ADMIN1/ADMIN2 identified as its natural
purpose. No functional tool was removed.

### An honest note on Engineering Health (why it links rather than computes)

The brief asks to *"surface existing Engineering Health information only (no new calculations)."*
ADMIN1's headline finding is that THA has **no wired operations/health endpoint** today —
`buildOperationsStatus()` has zero callers and there is no `/api/health`. With **no backend change and
no new API** permitted, the only honest way to surface engineering health is to present **where it is
already observable** and link to the tools that own each signal — computing nothing and, crucially,
**fabricating no status** (Visual Trust, `THA_UI_ARCHITECTURE.md` §14: status must never pose as
current; UNKNOWN is never shown as green). Wiring a real health readout is a backend workstream
(ADMIN1 QW-1/QW-2), explicitly out of SUP1's scope.

---

## SCREENSHOTS

Captured against the live dev server (Vite, `localhost:5000`) using the Replit-provided Chromium, via
a disposable admin account that was **created and deleted within the same run** (verified: 0 leftover
`sup1-shot-*` rows). The throwaway capture harness was removed after use.

### Desktop (1280×1200) — banner renamed, intro, Engineering Health panel, grouped tools

![Support Hub — desktop](./assets/SUP1/support-hub-desktop.png)

### Mobile (390×844) — responsive stacking, "Learn more" expanded (Platform)

The mobile capture has the Platform section's **"Learn more"** expanded, evidencing progressive
disclosure and the calm guidance copy.

![Support Hub — mobile](./assets/SUP1/support-hub-mobile.png)

---

## FILES CHANGED

**Two product files. No backend, schema, migration, route, or API.**

| File | Change |
|---|---|
| `client/src/pages/admin-page.tsx` | **Rewritten** as the Support Hub landing: "Support Hub" header + intro; "Engineering health" orientation panel (links to existing surfaces, no new calc); five grouped sections (Platform / Intelligence / Knowledge / People / Development) each with a collapsed-by-default "Learn more"; all existing tool cards carried verbatim (title/description/icon/href). Admin role guard and `data-testid="admin-page"` preserved. |
| `client/src/components/admin-banner.tsx` | **One-word label change** — the banner brand label "Admin" → "Support Hub" so the rename is coherent across the landing and its persistent nav. **No nav item, route, icon, or behaviour changed.** |

**Documentation / assets (non-product):**
- `docs/implementation/SUP1_SUPPORT_HUB_FOUNDATION.md` (this report)
- `docs/implementation/assets/SUP1/support-hub-desktop.png`, `…/support-hub-mobile.png`
- `.engineering/session/runs/SUP1_Support_Hub_Foundation.md`, `.engineering/session/CURRENT.md` (row)

---

## VERIFICATION

- **Typecheck:** `tsc --noEmit` reports **zero errors in `admin-page.tsx` or `admin-banner.tsx`**. The
  baseline gate's 27 "NEW" errors are **all pre-existing `server/` sibling debt** in the dirty tree
  (test-shop1, publication-checks, publication-register) — none in any file SUP1 touched, and SUP1's
  delta is **0 new type errors**.
- **Build:** `vite build` exits **0** with both changes applied (fresh `dist/public/index.html`).
- **Runtime:** the page renders correctly under an authenticated admin session at both viewports (see
  screenshots) — header, intro, Engineering Health panel, all five groups, all tool cards, and the
  "Learn more" collapsibles all present and interactive; the bottom household nav and companion FAB
  render as normal (shell unchanged).
- **Behaviour unchanged:** every tool card links to its original route; the admin role guard
  (`role !== "admin"` → `<NotFound/>`) is byte-identical; no query, mutation, or endpoint was added.
- **No data left behind:** the disposable screenshot admin was deleted in the same run; **0** leftover
  rows confirmed by direct query.

---

## ARCHITECTURE COMPLIANCE

- **`THA_EXPERIENCE_BLUEPRINT.md` §4.1 / `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`** — the Support Hub is
  the Admin room ("the study off the hall", E0) done to standard: same shell, canvas, tokens, type
  scale; calmer and plainer; no orchard imagery, no Living Detail, no signature voice. It does **not**
  become a second product.
- **`THA_EXPERIENCE_ARCHITECTURE.md` §5 / §9** — progressive disclosure (Learn-more collapsed by
  default; depth by intent) and the standard information hierarchy (orientation → state → tools).
- **`THA_UI_ARCHITECTURE.md` §12 / §14 / §17** — uses the **canonical** `ui/collapsible` and `ui/card`
  owners (no re-implementation); surfaces **no fabricated status**; adds no new token or component, so
  no adoption-register entry is required.
- **No second owner created** — the health panel *links to* existing owners; it does not re-compute or
  re-record any signal (`THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §7 respected).

No conflict found.

---

## FOLLOW-ON RECOMMENDATIONS

Each is a separate, decision-gated change — **none is implemented here.**

1. **Wire a real Engineering Health readout** (ADMIN1 QW-1/QW-2) — add `GET /api/health` and surface
   `buildOperationsStatus()` (written, zero callers today), so the health panel shows honest live
   status (UNKNOWN≠green) rather than links alone. This is the backend SUP1 was scoped to exclude.
2. **One nav owner** (ADMIN1 QW-4) — the banner's `ADMIN_NAV` is still a hand-maintained second list
   that diverges from the hub's groups (it omits Knowledge Review, Publication Integrity, Development
   World). Drive both the banner and the landing from one `GROUPS` config to end the drift.
3. **Adopt the Operation Card pattern** (ADMIN2 Part 6) — the deeper ADMIN2 work: give every operator
   task one canonical pattern with guidance + lifecycle + honest feedback. SUP1 lays the calm landing;
   this fixes the silent high-consequence operations (Publish/Rollback, benchmark runs).
4. **One obvious place to benchmark** (ADMIN2 QW-4 / Part 7.1) — "benchmark" still spans five surfaces;
   consolidate the two runners behind an explained world choice.
5. **Rename the deeper labels for namespaces** (ADMIN2 P1-3) — "Learning Queue" / "Benchmark & Release"
   so two tools are not both called "Intelligence"; the SUP1 grouping makes this rename safe to do next.
6. **Formalise Admin → Support Hub in the experience map** — if the rename is to be canonical, add/rename
   the row in `THA_EXPERIENCE_BLUEPRINT.md` §5.1 by governance (a map-row amendment), per ADMIN2 §1.6.

---

## SCOPE LOCK

- **Implemented:** the Support Hub landing re-dress (two client files) + this report and its assets.
- **Explicitly excluded:** all backend, API, schema, migration, route, and data changes; any new health
  calculation; any change to a tool's own page or behaviour; the deeper ADMIN2 Operation-Card work.
- **Suggestions (do not implement without approval):** the six follow-on recommendations above.
