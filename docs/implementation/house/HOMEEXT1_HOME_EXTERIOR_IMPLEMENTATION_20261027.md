# HOMEEXT1 — Home exterior implementation

**Date:** 2026-10-27  
**Repository:** `tha-integrated-dev-g-native-20261003` · `feat/integrated-dev` · HEAD `bffc533d65f58ae30c1faf7d3026b50dcc17be89`  
**Scope:** The owner-selected front-garden Home image, the narrow Home-only architecture amendment, and the `/home` visual composition. No commit, push, release or deployment was made.

## Preflight and authority

**Verified:** The G-workspace `AGENTS.md`, repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`, `docs/change-control.md`, and the task-relevant architecture and operating-model entry points were read before editing. The architectural sources read were `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, `THA_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_LANGUAGE.md`, `THA_UI_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `LIVING_HOME_VISUAL_REGISTRY.md`, `LIVING_HOME_SPATIAL_BLUEPRINT.md`, `HOME_OWNER_ARCHITECTURE.md`, and `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`. The current Home code, shell, House Register and Adoption Register were also read. The selected image source was `artifacts/home-exterior-vision-20261027/OWNER_SELECTED_UNACCEPTED_HOME_BACKGROUND_ONLY_20261027.png`.

**Risk:** 🔴 for the bounded experience architecture/asset admission; 🟢 for the Home visual UI. The user's instruction to build the amendment and page authorized this dev-branch scope. The repository preflight found `Implementation permitted: YES` on `feat/integrated-dev`. No separate downstream release authority is claimed.

**Conflict resolved within the approved scope:** Governing Experience Architecture GEA6 and Experience Blueprint §§6.1–6.2 previously fixed the orchard approach for all rooms. The owner selected an exterior Home plate and then explicitly directed construction of the governing amendment. HOMEEXT1 adds only the Home E3 front-garden architectural composite. The no-text-on-image boundary, one environment owner, shared season/light, arrival surfaces, E0–E2 rooms and unresolved two-orchard convergence remain governed as before.

## Design and implementation

The design/acceptance record is `docs/investigations/ux/HOMEEXT1_HOME_EXTERIOR_DESIGN_20261027.md`. The exact selected PNG was copied to `client/public/images/home/home-front-garden-20261027.png`, with SHA-256 `2716423E4E4EEDDFB8B87C847E2213CA26E1DD355D87B5E3583E101AC786369B`. The House Register owns the exact asset and names `client/src/components/layout/orchard-backdrop.tsx` as the single environment mouth. Its new `HomeExteriorView` has `/home` as sole consumer. The older Home-only `OrchardWindow` composition is no longer rendered.

`client/src/pages/home-experience-page.tsx` keeps the existing Home queries, state sentence, meal/Shopping/plant data, canonical links, primary-action resolver, loading/error handling, and no Home-owned Companion voice. It now renders a solid greeting ground over the sky, a small Today ground, three source-backed summary cards on the lawn, one primary action, and a quiet dashboard link. The redundant Home door list is retired; the shell's BottomNav continues to own room navigation. `client/src/index.css` contains Home-scoped desktop, tablet and narrow-screen layout, with an un-stretched `object-fit: cover` image. `client/src/components/layout/app-shell.tsx` stands down its fallback top header for Home while retaining the shared navigation, Companion and trust surfaces.

The amendments are in `GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `THA_EXPERIENCE_BLUEPRINT.md`, and `LIVING_HOME_VISUAL_REGISTRY.md`. The operational House and Adoption Registers were updated from their source records. The generated `ADOPTION_REGISTER.md` was regenerated from `adoption-register.json` without tightening unrelated ratchets. The Adoption Register says the Home view is a new shape on the existing owner, not a second environment owner.

## Architecture and trust check

- **Verified — single ownership:** Home remains the `/home` room; the existing Home page, primary-action resolver, query owners, environment module, House Register and BottomNav keep their own roles. There is no parallel navigation or Home data store.
- **Verified — consumers:** `/home` is the sole consumer of `HomeExteriorView`; `OrchardBackdrop` remains on arrival surfaces. The House Register names the asset and the Adoption Register names its consumer. No other room mounts the Home plate.
- **Verified — product registry impact:** No product knowledge entity, fact, belief, source or reasoning path was changed; the Product Knowledge Registry is unaffected.
- **Verified — adoption impact:** The existing orchard-environment row was revised; `npm run adoption:check` confirms the generated document is in sync and this owner has four importing modules. Other adoption failures are listed below.
- **Data impact:** No schema, persistence, migration, business action, service call, scheduled task, AI reasoning, household data, or production configuration was changed. Home's existing read-only queries remain.
- **Trust:** The decorative photograph has `aria-hidden`; meaningful information remains text on opaque or near-opaque ivory ground. No status was fabricated and no household action was performed by the page.

## Verification and limits

- `npm run build` — **PASS**, including the client and server bundles; four unrelated CJS `import.meta` warnings remain.
- Live `http://127.0.0.1:5001/home` at 1280×720 — **visually inspected** in the in-app browser. Evidence: `artifacts/home-exterior-vision-20261027/HOMEEXT1_DESKTOP_LIVE_PREVIEW_20261027.png`. The photograph fills the Home area edge to edge above the shared navigation; the house is right, orchard is left, welcome and Today are readable, three cards and the primary action are visible without overlap. The page displayed actual existing household data: one planned meal and 58 shopping items.
- `npm run adoption:check` — Home owner/adoption and JSON-to-Markdown sync **PASS**; overall **FAIL** with 12 unrelated register failures including rival counts, a missing quantity-string adopter, and orphan modules. This work did not modify those owners.
- `npm run verify:living-home-assets` — new Home image hash and House Register **PASS** (`House assets match registered hashes`, 13 assets); overall **FAIL** on other asset/orphan/jar checks outside this Home scope.
- `npm run typecheck` — **FAIL** on pre-existing server script/test type errors outside the Home/client files; no Home/client diagnostics appeared in the output.
- `git diff --check` — flags trailing whitespace only in the pre-existing dirty `PROJECT_GOVERNANCE.md` additions, not in HOMEEXT1 files.
- Narrow-screen and 200% browser zoom composition are designed in CSS but were not visually exercised in this run. They remain a manual acceptance check before release; no claim of cross-device completion is made.

## Rollback, scope lock and completion

The pre-edit HEAD is tagged `rollback/HOMEEXT1-home-exterior-adoption-20261027`. That lightweight tag covers committed history only. Byte-exact copies of the dirty targets and the 99-entry pre-status are in `G:\The Healthy Apples\Incoming\Rollback Evidence\HOMEEXT1-Home-Exterior-20261027-115335`. The two modified configuration registers have timestamped sibling backups (`house-asset-register.json.pre-HOMEEXT1-20261027-115335.bak` and `adoption-register.json.pre-HOMEEXT1-20261027-123710.bak`). All 99 pre-existing status paths are still present; no reset, clean, stash, branch switch or deletion of pre-existing work occurred.

**Definition of done for this dev-branch scope:** the approved exact asset is registered, governance records the narrow exception, `/home` renders the proposed composition, desktop visual evidence and build pass, and rollback/reporting are present. **Release gap:** narrow-screen/zoom acceptance and the repository's unrelated failing gates require separate resolution before promotion. No architecture convergence percentage is claimed; the pre-existing two-orchard migration remains open.

## Suggestions

- Check this layout on an actual narrow phone and at 200% browser zoom, then adjust the Home-scoped crop and card flow if needed.
- Resolve the unrelated register/typecheck/asset gate failures in their owning workstreams before release.

## Owner-directed visual refinement — 2026-10-27

Following review of the live desktop page, the owner requested the greeting/date without a bordered widget, smaller opaque cards sitting on the lawn, removal of the duplicate green “Check your shopping list” action, and one Today heading that combines its state without repeating “Today.” Implemented in `client/src/pages/home-experience-page.tsx` and `client/src/index.css`: greeting text is now unboxed; summary cards are narrower and use fully opaque ivory; the tier-zero shopping action is omitted because the Shopping card already links to the list; and the heading reads “Today is planned,” “Should we plan today?” or “Today” when state is unavailable. Existing resolver, data, links and navigation remain in place. The previous screenshot is retained; updated live evidence is `artifacts/home-exterior-vision-20261027/HOMEEXT1_DESKTOP_LAYOUT_TWEAK_PREVIEW_20261027.png`. `npm run build` passes after this refinement. No data, service, database, scheduled task or deployment was touched. Current pre-edit files are preserved at `G:\The Healthy Apples\Incoming\Rollback Evidence\HOMEEXT1-Home-Layout-Tweak-20261027`; rollback tag: `rollback/HOMEEXT1-home-layout-tweak-20261027`.

The owner then clarified that this dynamic status belongs directly below the date, in the date's font, rather than in a separate Today tile. Moved the status into the welcome header and removed the tile. When the planner has no meal for today the line reads “Should we plan today?” Live desktop evidence: `artifacts/home-exterior-vision-20261027/HOMEEXT1_STATUS_UNDER_DATE_PREVIEW_20261027.png`. The build passed after this refinement. Pre-change copies: `G:\The Healthy Apples\Incoming\Rollback Evidence\HOMEEXT1-Status-Under-Date-20261027`; rollback tag: `rollback/HOMEEXT1-status-under-date-20261027`.

For the next owner-directed refinement, the three summary cards and “See your full dashboard” link now use an ivory background at 78% opacity and transition to fully opaque on hover or keyboard focus. The selected color is a balance between seeing the garden through the cards and retaining readable text. Desktop preview: `artifacts/home-exterior-vision-20261027/HOMEEXT1_CARD_TRANSPARENCY_PREVIEW_20261027.png`. `npm run build` passes. Pre-change CSS copy: `G:\The Healthy Apples\Incoming\Rollback Evidence\HOMEEXT1-Card-Transparency-20261027`; rollback tag `rollback/HOMEEXT1-card-transparency-20261027`.

The owner requested greater transparency while retaining the clear hover appearance. Reduced the resting ivory fill on the cards and dashboard link from 78% to 62%; hover and keyboard focus still set it to fully opaque. Checked both resting and hovered live states in the desktop browser; the hovered card returned to a solid ivory surface. Updated preview (resting state): `artifacts/home-exterior-vision-20261027/HOMEEXT1_CARD_TRANSPARENCY_MORE_PREVIEW_20261027.png`. `npm run build` passes. Pre-change CSS copy: `G:\The Healthy Apples\Incoming\Rollback Evidence\HOMEEXT1-Card-Transparency-More-20261027`; rollback tag `rollback/HOMEEXT1-card-transparency-more-20261027`.
