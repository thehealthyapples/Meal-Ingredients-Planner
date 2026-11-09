# Home Exterior Image Governance Amendment Proposal

**Status:** Draft proposal for owner and governance review. This document changes no governing rule and grants no production permission.
**Date:** 2026-10-27
**Owning repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`

## Decision requested

Decide whether Home should be allowed to adopt the owner-selected exterior front-garden composition as its Home-only E3 environment, and whether Home may place its greeting in the image's open sky. If approved, authorize a separately scoped amendment to the governing Blueprint and its dependent adoption/asset records. Do not treat selection of the concept image as approval of its exact bytes for production.

## Evidence and authority

- **Verified — current rule:** `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` §§5.1, 6.1 and 6.2 define Home's E3 relationship to the orchard, protect the orchard from working text, and require readable type to sit on ground. The architectural-aperture rule is also described in §6.2. These are the governing experience rules.
- **Verified — UI expression:** `docs/architecture/THA_UI_ARCHITECTURE.md` §§2, 5, 11, 12, 16 and 17 make the Experience Architecture superior where they conflict, place readable type on a ground plane, prohibit working text over the orchard, and require visual adoption to be registered. The UI Adoption Register and Product Knowledge Registry describe different facts and must remain separate.
- **Verified — Home owner authority:** `docs/architecture/HOME_OWNER_ARCHITECTURE.md` §§3 and 5–6 allow the Home Owner to initiate an amendment and give final aesthetic approval, while explicitly preventing aesthetic approval from overriding a failed governing gate. Record approvals in the governing admission/register location.
- **Verified — asset admission:** `docs/architecture/LIVING_HOME_VISUAL_REGISTRY.md` §§5.1, 7 and 7.3 classify the orchard as an architectural asset and distinguish concept, candidate, checksum-bound approval, production, and retirement. Concept art is not a production asset.
- **Verified — existing environment owner:** `docs/implementation/assets/house-asset-register.json` rows `orchard-environment-rooms` and `orchard-environment-arrival-graded` identify the current image records and owner component `client/src/components/layout/orchard-backdrop.tsx`; the rooms row cites Blueprint §6.1 and UI Adoption Register row 40. The Blueprint §18 convergence note treats the current two-orchard arrangement as a governed convergence concern.
- **Verified — Home implementation:** `client/src/pages/home-experience-page.tsx` consumes `OrchardWindow` from `client/src/components/layout/orchard-backdrop.tsx`. The visual owner is that existing component/asset pathway; this proposal creates no new owner or parallel environment system.
- **Verified — existing design evidence:** `docs/investigations/ux/ROOMVISION1_REAL_WORLD_ROOMS_20261026.md`, Home recommendations 1–5, recommends preserving the canonical three-bay orchard view, keeping the oak sill boundary, placing content on the counter, and keeping the orchard unobscured. This is investigation evidence, not architecture authority.
- **Verified — selected concept:** `artifacts/home-exterior-vision-20261027/OWNER_SELECTED_UNACCEPTED_HOME_BACKGROUND_ONLY_20261027.png`, 1672×941, SHA-256 `2716423E4E4EEDDFB8B87C847E2213CA26E1DD355D87B5E3583E101AC786369B`. It depicts apple trees/orchard to the left, open sky, a house to the right, and lawn/path foreground. It is owner-selected concept artwork, not admitted or approved production artwork.
- **Inferred:** Adopting the selected composition as a full Home environment, and placing a greeting directly over the sky, cannot be claimed compliant under the current Blueprint without an explicit rule decision. The exact bounds of any amendment must be set by the owners of the governing documents.
- **Unknown:** Whether the owner intends the selected image to replace the current Home orchard, to coexist as a Home-specific responsive composition, or to be used only inside the current architectural aperture. This proposal requests that decision explicitly.

## Conflict to resolve

The selected scene is a front-garden view with the house on the right and orchard on the left, rather than the currently prescribed three-bay orchard-window composition. The prior Home recommendations reinforce the current sill/counter composition. Additionally, the requested Home headline and date/status copy in the open sky would put working text on the environment image, contrary to the current ground-plane rule. These are two distinct decisions: (1) which environment composition Home may use; (2) where readable Home copy may sit. Approval of one must not silently approve the other.

## Options

### A. Keep the current canon

Keep Home on the canonical three-bay orchard window and the current architectural-aperture/ground-plane composition. Retain the selected exterior image as concept/reference only. Put all Home copy and cards on the compliant ground plane.

**Benefits:** No Blueprint conflict, no new asset admission, lowest change and rollback risk.
**Trade-off:** Does not realize the owner-selected exterior view as the Home scene.

### B. Amend Home's composition and admit a Home-only successor environment

Amend the Blueprint to define a narrowly scoped Home E3 front-garden composition using the selected image as the visual direction. Preserve one canonical Home environment owner and one asset pipeline. Decide separately whether any text can sit in a protected sky area; the default proposed here is to keep all readable copy on a calm ground plane/card region, preserving the text rule even if the environment changes. If the owner wants unboxed text in sky, write a precise exception and its legibility/accessibility constraints into the amendment rather than relying on interpretation.

**Benefits:** Honors the chosen house-and-orchard direction while retaining governed ownership, calm, accessibility, and data boundaries.
**Trade-off:** Requires a real architecture amendment and successor asset admission; it is not an implementation-only visual tweak.

### C. Use the exterior image only within the existing architectural aperture

Keep the current E3 aperture and ground-plane rules, but evaluate whether the selected scene can be composed as the environment visible through that aperture. Keep all copy and cards on the sill/counter/ground. Treat this as a candidate concept, not an automatic exception.

**Benefits:** May preserve more of the current rules and avoid text over imagery.
**Trade-off:** The selected scene is a full front-garden view, so forcing it into a three-bay window may crop away the house/orchard relationship the owner chose and may not satisfy the intended Home vision.

## Recommendation

Advance **Option B**, with the narrower default that all readable Home content remains on a calm ground plane and the selected image supplies the environmental scene only. Make sky-overlaid greeting text a separate explicit decision. This is the smallest amendment path that can honor the owner-selected exterior direction without casually weakening a product-wide readability rule. If the owner does not want the ground-plane constraint, defer that part until governance owners explicitly resolve it.

## Proposed amendment boundaries

If Option B is authorized, the amendment should:

1. Change only the Home E3 environmental composition; it must not generalize exterior photography to other rooms.
2. State whether this is a Home-specific successor to the canonical three-bay orchard window or an alternate responsive crop within one canonical Home environment. Avoid a second independently owned Home experience.
3. Preserve the orchard/house relationship in the selected direction: visible apples/orchard to the left, house/entry to the right, calm open sky, and a usable lawn/path foreground.
4. Keep working text and controls on a warm, legible ground plane unless a separately worded sky-text exception is approved.
5. Keep the Home experience owner, environment asset owner, route, data sources, and navigation canonical; do not introduce duplicate state or a parallel Home surface.
6. Preserve restraint: a short welcome and Today status; small, calm Meals, Shopping and From the orchard summaries; one primary next action; secondary destinations in the existing navigation.
7. Require any three summary cards to use their current canonical sources and honest empty/loading/error states. No new persisted summary state or duplicate shopping/meal/orchard data.
8. Define responsive crops for desktop, laptop and mobile with the house/orchard focal relationship protected. Cropping must not distort the image or make the planner/home cards unusable.
9. Define accessible text contrast, focus order, keyboard operation, responsive navigation, and meaningful alternative handling. If the background is decorative, it must not be the only carrier of information.
10. Leave all non-Home rooms, pantry/planner/cookbook imagery and visual directions unchanged.

## Governance and adoption work required after owner decision

This proposal is not itself that work. If Option B is approved, the authorized amendment task should identify and update only the necessary canonical records, including:

- `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` — Home's E3 composition and any explicit readable-text exception.
- `docs/architecture/THA_UI_ARCHITECTURE.md` §17 — the Home adoption row/notes, without duplicating surface purpose from the Product Knowledge Registry.
- The existing owner-controlled visual/asset admission records under `docs/architecture/LIVING_HOME_VISUAL_REGISTRY.md` and `docs/implementation/assets/house-asset-register.json`; preserve the five-stage lifecycle and exact checksum binding. Resolve the current orchard convergence note rather than adding a third sibling asset.
- The Home North Star/implementation specification only where it is a dependent consumer of the changed Blueprint rule.

The actual governance owners must approve the amendment before implementation. The Home Owner must approve the exact final candidate bytes by SHA-256 before those bytes become production-available. Updating an adoption row is not a substitute for governing approval or asset approval.

## Definition of done for a later implementation

- The governing amendment is approved and recorded; all affected cross-references and precedence are consistent.
- The final image candidate has an exact checksum, documented responsive crop/focal rules, and Home Owner approval tied to that checksum.
- The existing environment owner pathway serves it; no parallel source of truth or duplicate Home route is introduced.
- The Home shows the approved composition at supported screen shapes, no distortion or unintended clipping, and all working copy is placed under the approved text rule.
- Meals, shopping and orchard summaries reflect their canonical sources, including truthful empty/loading/error states.
- Keyboard and screen-reader order, contrast, zoom and responsive layout are reviewed against the repository's accessibility gates.
- Rollback restores the prior Home environment and matching register state together; no state migration or database change is expected for a purely visual adoption.
- Owner reviews the actual rendered Home before release.

## Scope lock for this proposal

Only this proposal and its required Agent Report are in scope. No application source, canonical governance, register, production asset, service, database, scheduled task, configuration, or user data was changed. No implementation was authorized by this proposal task.
