# Cookbook real-book concept — responsive implementation

**Status:** Implemented for local concept review (Green visual work)

## Scope

- **Verified:** `/cookbook/concept-real-book` continues to read the existing cookbook meals and categories through the established hooks and routes. It writes no data.
- **Verified:** The existing shell-level Companion context is reused; no second Companion or conversation state is introduced.
- **Verified:** The visual scene is a generated candidate environment plate, `client/public/images/cookbook/concept/open-family-cookbook-candidate.png`, SHA-256 `E26B4D98EAF17A864800E8A3B8F8A5D89E25575E3147921E28F20E087A109687`.
- **Verified:** The concept route renders the PNG plates directly using native HTML image maps. It imports no route stylesheet, uses no SVG, and contains no visual DOM/CSS layer. The desktop plate and the two mobile plates carry the page content as physical print.

## Interaction and responsive contract

| Starting page | User action | Expected result | Success criterion |
| --- | --- | --- | --- |
| `/cookbook/concept-real-book` desktop | Open the route | The photographic book spread fills the available content viewport | Both physical pages are visible with a narrow tabletop surround and no document scroll |
| Desktop spread | Select the collection, traybake, or planner region | The transparent interaction region opens the existing Cookbook or Planner route | The visual book remains one uninterrupted photographic surface |
| Mobile-width viewport | Tap `Browse` or `Recipe` | A single readable page is shown over the same physical book plate | No two-page shrink-to-illegibility; no document scroll is needed to reach the paired page |

## Verification

- `git diff --check` — passed (only pre-existing CRLF warnings in unrelated files).
- Focused TypeScript output filtered for `cookbook-real-book-concept`, `app-shell`, and `App.tsx` — no matching errors.
- Browser automation could not inspect `http://localhost:5000` because the Browser URL policy blocked that local route. This was not bypassed. Manual acceptance remains: reload the already-open concept route and check the desktop and narrow/mobile layouts.

## Data, trust, and rollback

- **Data impact:** existing-data reads only; no writes, schema changes, migrations, persistence, or permission changes.
- **Architecture compliance:** fixed raster environment plate plus transparent interaction regions follows the established image-first rendering model. The scene is deliberately isolated under `images/cookbook/concept` as a candidate for review rather than added to the shared production asset library.
- **Assumed:** the user’s visual acceptance of the exact generated scene plate is the intended Home Owner approval for concept review only; it is not a recorded, checksum-bound production admission.
- **Rollback:** `53c12f46 chore: restore point for fridge interaction`.
