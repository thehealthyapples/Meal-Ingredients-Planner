# Competitor evidence-status distinction — investigation — 19 November 2026

**Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
**Branch / base:** `feat/integrated-dev` / `047fc302991bf42d8b327064ecf0770bc8ebdb84`
**Risk:** 🟡 AMBER — clarifies public evidence-detail behavior without changing ratings.
**Rollback:** `rollback/CMP-evidence-verification-distinction-20261119` → `047fc302991bf42d8b327064ecf0770bc8ebdb84`

## Finding

The comparison page used one `unknown` object both for explicit cells whose reviewed developer sources did not establish a feature and as the fallback for every missing topic entry. This made the page say that sources were reviewed even when no app/task record existed.

## Evidence baseline

**Verified in `client/src/pages/features-compare-page.tsx`:** 21 competitor apps × 30 comparison tasks = 630 cells; 102 explicit Yes, 14 Some limits, 21 explicit unknown records, zero competitor No records, and 493 cells with no explicit entry. The page uses an optional cell URL and otherwise falls back to the app's general URL.

## Decision

- **Not reported in reviewed sources:** an explicit unknown cell. The public detail says the feature is not reported in the developer sources reviewed and that this does not prove the app lacks it.
- **Not assessed yet:** a missing app/task entry. The detail says this specific comparison cell has not yet been assessed and that this is not a No.
- Both remain the existing grey **Not verified** state. Green, amber and red dot rules do not change. Red must remain evidence-backed confirmation of absence, not an inference from missing documentation.
- Avoid hiding unknown entries or giving different colors to unknown subtypes; a single neutral dot keeps the grid legible while the detail carries the reason.

## Limits and next work

This change distinguishes the two current sources of uncertainty. It does not yet capture exact claim-specific URLs, source title, review date, country, platform, subscription tier, or conflicting sources for every cell. Re-review those cells with official developer material before setting any to No. Where the source is silent, retain Not reported; where the source was not checked, retain Not assessed. No market ranking or hands-on competitor testing was performed here.

## Architecture and ownership

**Verified:** competitor evidence is authored in the existing comparison component; the page structure record documents its public behavior. This change extends that evidence model and adds no second data store, persistence, API or workflow. The page consumes the same static evidence records. `docs/product/structure/pages/page-features-compare.md` is updated to reflect the behavior.

**Inferred:** claim-specific evidence provenance may eventually justify a structured research record or data model, but no new owner should be selected until the source audit establishes the need. Do not create a duplicate runtime evidence store as a shortcut.

## Route and build integration finding

**Verified:** before this task, `features-compare-page.tsx` had no import or route in `client/src/App.tsx`, no top-level link in `client/src/pages/home-page.tsx`, and its component was absent from the production bundle. The product page record already named these routes and the Home navigation as consumers. This was an implementation-to-census drift, not a conflict in governing architecture. The shared page is now registered at `/features-and-compare` and `/features&compare`, and Home links to the canonical route.

## Samsung Food source-audit tranche

**Verified:** Official Samsung Food help pages were reviewed on 2026-11-19. The existing row now includes claim-specific URLs, tier caveats and explicit “not reported” reasons for eater profiles, external plan import and paper-plan scanning. Weekly intake was corrected from Yes to Some limits because reviewed nutrition sources describe daily targets and detailed recipe nutrition but not consumed weekly totals across diary days. No cell was marked No. Full task mapping and source URLs: `docs/investigations/ux/CMP_SAMSUNG_FOOD_EVIDENCE_AUDIT_2026-11-19.md`.