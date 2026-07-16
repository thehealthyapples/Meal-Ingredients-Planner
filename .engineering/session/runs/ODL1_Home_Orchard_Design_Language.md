# ODL1 — Orchard Design Language for Home

**Stage:** Waiting for User
**Report:** [`docs/implementation/ux/ODL1_HOME_ORCHARD_DESIGN_LANGUAGE.md`](../../../docs/implementation/ux/ODL1_HOME_ORCHARD_DESIGN_LANGUAGE.md)
**Date:** 2026-07-16
**Rollback ID:** `rollback/ODL1-home-orchard-design-language-20260716` → `7d1dd2ce`
**Scope:** Visual refinement of the authenticated Home page (`client/src/pages/home-experience-page.tsx`, route `/home`) into the Orchard Design Language, guided by the North Star concepts at `attached_assets/design/north_star/v2/` (inspiration, not pixel specs — per `NORTH_STAR.md` there). Architecture, workflows and business logic unchanged. Refinement, not redesign.
**Working-tree caveat:** The tag protects committed state only. The tree is heavily dirty with uncommitted work from concurrent sessions (server/*, docs/*, other pages) — that work is NOT covered by the tag and will not be touched or committed by this session.

---

## Mission

Transform the existing authenticated Home page into the Orchard Design Language using the
North Star v2 concepts (`NORTH_STAR_V2_HOME_DESKTOP_MOBILE.png`). Keep all queries, data
ownership, loading/error/empty state handling, routes and testids intact. Deliver a
production-ready Home, before/after screenshots, and an implementation report.

## Pre-work checkpoints

- [x] Rollback tag created before any file was touched
- [x] `git status` reviewed (dirty tree from concurrent sessions — preserved, untouched)
- [x] `docs/architecture/README.md` read (Architecture Bootstrap, STEP 2)
- [x] North Star v2 assets read (`attached_assets/design/north_star/v2/`)
- [x] Governing visual law digested (UIA, Kept Room Translation, Experience Blueprint, OHDB, Experience Language, Experience Architecture)
- [x] Prior Home sessions digested (DESIGN1, UXHOME1, HOME2/HOME3, HOME_COMPLIANCE_AUDIT_20260716)
- [x] Client design-system inventory (tokens, fonts, shell, capture recipe)

## Delivered

Implemented the lawful subset of the North Star on `home-experience-page.tsx`
(display-voice two-line greeting, named type roles, "Today at a glance" heading,
plant-card honest absence, Companion beat via `useWithholdCompanion`, reminders
fade-in, dead `dark:`/phantom-class deletions, contrast fix, more air). Governance-
gated North Star elements (orchard backdrop/light, signature hand, depth vocabulary)
deliberately NOT shipped — each named with its unlock path in the report §2/§5.
Registry entry `page-home.md` corrected in the same change (stale dead-reminders
defect; live since PHASE5E). Verified: HOME2 resolver 47/47; adoption gate — the 2
failures are pre-existing from concurrent sessions (raw-`<button>` ceiling,
`HouseholdNutritionPanel` orphan), none from ODL1; typecheck adds no client errors.
Before/after screenshots: `docs/ui-audit/odl1-home-orchard/`.

## Next action

None — awaiting user review of the after screenshots and the report. If the user
records ADOPT on the signature-typography migration, a one-line greeting upgrade
(+ Caveat `@import` move + prototype deletion) follows; the orchard light waits on
the UIA §4 amendment path.
