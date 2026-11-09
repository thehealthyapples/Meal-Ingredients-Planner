# HOMEEXT1 — Home exterior design

**Date:** 2026-10-27  
**Status:** Design for the owner-directed dev-branch build  
**Owner decision:** Colin (`tha-governance-owner-001`) selected the exact front-garden image in `artifacts/home-exterior-vision-20261027/OWNER_SELECTED_UNACCEPTED_HOME_BACKGROUND_ONLY_20261027.png`, then asked to build the governance amendment and the Home page. The image SHA-256 is `2716423E4E4EEDDFB8B87C847E2213CA26E1DD355D87B5E3583E101AC786369B`.

## Experience test

1. **Room:** Home, the threshold and heart of the Orchard House (Experience Blueprint § 5.1).
2. **Feeling:** Welcomed and oriented, with the orchard and house present but quiet (Experience Language § 5.1).
3. **One thing:** See how today stands and take the single next step resolved by the existing Home primary-action owner (Experience Architecture § 4; `shared/home/home-primary-action`).

## Experience Constitution Check, before implementation

- **Hospitality:** The house and orchard greet first; task details remain lower and quieter.
- **Outcome:** The household sees its real day without mentally assembling three rooms' facts.
- **Weight:** The view receives more space; the content uses the existing three summaries, not new panels or metrics.
- **Voice and ownership:** Home reports sourced facts. It adds no coaching or interpretation and leaves the Companion as the sole adviser.
- **Agency:** The primary action remains a link to the canonical room. No action is taken on the household's behalf.
- **Restraint:** Extra desktop space becomes orchard, sky and lawn. No rank, streak, alert or invented status is added.
- **Layer:** The Blueprint owns the Home E3 scene and text boundary; UI Architecture owns ground and tokens; the existing Home component renders them.

## Composition

**Desktop and laptop:** The selected photograph fills Home's available viewport between the browser's top and the shared bottom navigation. The house remains on the right and the apple orchard on the left. A compact, warm, solid greeting ground rests within the open upper portion; it carries the signature, date, Today heading and truthful status. Three small ivory summaries rest across the lower lawn, followed by the one primary action. The image is static and decorative. No live text or control is placed directly on the photograph.

**Tablet:** The same asset and hierarchy remain. The three summaries can become two columns, then one; content stays on a solid ground and the image crops without stretching. No separate orchard angle is introduced.

**Phone and browser zoom:** A shorter exterior view establishes arrival; the greeting and summaries become a normal-flow, readable ground beneath it. The site image can crop to a useful orchard/house fragment, but a landscape asset cannot show both extremes in a narrow portrait crop. This is an explicit limitation of the one approved plate, not a reason to distort it or create an unapproved mobile image. The navigation stays the shared shell navigation.

## Content and ownership

- Keep existing `/home`, query hooks, Home primary-action resolver, loading/error/empty states, meal thumbnails and canonical links.
- Keep the one shared bottom navigation. The existing four Home door links are visually redundant with it and are retired from this composition; room destinations remain in the shell.
- `orchard-backdrop.tsx` remains the single environment mouth. The new Home scene is a Home-only architectural plate admitted in the House Register, not a second owner or a generic room background.
- The background is `aria-hidden`; all meaningful Home facts are present in text. Contrast and focus are supplied by the content ground, never dependent on image pixels.

## Acceptance and rollback

- At desktop width, the scene reaches the sides and bottom of the Home content area; no old wall, sill, mullion, banner, or empty frame remains.
- House, orchard, welcome, three sourced summaries and the one action remain legible without overlapping.
- At narrow widths and 200% zoom, content flows and remains reachable without horizontal page scrolling.
- The asset hash matches the selected source; the House Register and Adoption Register identify its sole owner and `/home` consumer.
- Roll back with the HOMEEXT1 pre-implementation tag for committed history and the byte-exact pre-state copies in `G:\The Healthy Apples\Incoming\Rollback Evidence\HOMEEXT1-Home-Exterior-20261027-115335` for dirty files. The tag does not restore dirty working-tree content.

**Data impact:** Existing read-only Home queries continue. No new data write, data-meaning change, backfill, migration, AI state or service is introduced.
