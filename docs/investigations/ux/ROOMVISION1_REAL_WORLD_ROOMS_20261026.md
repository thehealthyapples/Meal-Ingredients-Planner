# ROOMVISION1 — nine rooms, one home

**Morning review pack · 26 October 2026 · Investigation and direction only**

**27 October independent-review correction:** Claude identified a missed governing document for the Pantry/Larder and a weak visual result in five concept images. The Larder proposals below have been corrected against `docs/architecture/LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md`. The six images remain available as unaccepted studies, but they are **not ready as distinct room designs**: Shopping, Nutrition, Diary, Analyser and Household all lean on a very similar Pantry scene. See the review record in `G:\The Healthy Apples\Incoming\Agent Reports\THA-AI-Agent-Bridge-aab-20261027073243-eaef11d0-CLAUDE-2026-10-27.md`. The original 26 October preflight did not list the Larder North Star; this correction records that omission rather than retroactively claiming it was read then.

## What I recommend

Keep the household's sense that Pantry, Planner and Cookbook are *places*, while making their real tasks easier. Make the other six destinations feel related through the same shell, morning light, materials, navigation and restraint. Each room may differ only in **purpose, light, material and at most one data-borne living detail**. Its primary activity must remain clearer than its atmosphere. The six images below are exploratory visual studies, **UNACCEPTED** and not production backgrounds. The governed implementation path uses layout, light and material rather than literal room photographs. See the decision boundary below.

The strongest immediate visual opportunities are: make Pantry cover its available viewport without stretching shelves; let the Planner's entire paper and grid stay visible at browser zoom; and keep Cookbook's book readable while its controls recede. These are based on Colin's supplied screenshots and direction plus the inspected source, **not** a new runtime visual acceptance test.

## Governance preflight receipt

| Item | Receipt |
|---|---|
| Owning repository | `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` |
| Branch / base HEAD | `feat/integrated-dev` / `bffc533d65f58ae30c1faf7d3026b50dcc17be89` |
| Git status | Dirty before this work: tracked Planner/shell/governance changes and many untracked reports/assets. All pre-existing entries preserved. Existing rollback tag `rollback/planner-mobile-image-adoption-20261026` points at base HEAD. |
| User request | A 20-point enhancement plan for each of nine rooms, a sequence for the six remaining rooms, and images illustrating their possible character for morning review. |
| Mandatory files read | `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`; `docs/change-control.md`. |
| Task-specific governing files read | `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`; `docs/architecture/THA_UI_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`; `docs/architecture/HOME_OWNER_ARCHITECTURE.md`. |
| Existing implementation/assets inspected | `client/src/App.tsx`; pages for Home, Pantry, Planner, Cookbook, Shopping, Nutrition, Diary, Analyser and Household; `client/src/components/layout/orchard-backdrop.tsx`; existing Home orchard, Pantry, Planner and Cookbook image assets; user-supplied Planner screenshots. |
| Authorized scope | This investigation report, six unaccepted visual concepts and contact sheet under `artifacts/room-vision-20261026`, and required Agent Report. No application source edits. |
| Explicit non-goals | No route, workflow, service, schema, production data, asset replacement, approval of concept pixels, commit, push or deployment. |
| Architecture / governance conflict | **Present for any literal-photo implementation outside Planner.** Blueprint §16 rejects literal room imagery; §6.2 and the approved Planner image exceptions are narrowly scoped. A broader photographic-room strategy needs a separate owner-governed amendment and Home Owner approval. Concept studies can be reviewed without adoption. |
| Risk / decision | 🟢 Investigation and isolated concept files now. Each later UI change is classified separately; workflow or data changes may be 🟡/🔴. No bundled implementation decision is made here. |
| Implementation permitted | **YES**, only for this bounded report and unaccepted concept artifacts on the verified dev branch. **NO** for applying the concepts to the app. |

## Architecture anchors and evidence

- **Verified:** The Blueprint's room map (`docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` §5.1) gives each destination a place identity, exposure, light, ground posture and one possible living detail. It also fixes a shared shell, orchard, morning, tokens and navigation (§§5.2–8, 14–16).
- **Verified:** Home already uses the canonical orchard asset through `OrchardWindow` (`client/src/components/layout/orchard-backdrop.tsx`); the Home image below edits that orchard rather than inventing a new one. The other concept studies edit the repository's existing Pantry arrival image and depict one continuous household scene; they are still **not** an approved way to render those rooms in product.
- **Verified:** `/home`, `/pantry`, `/planner`, `/cookbook`, `/shopping-workspace`, `/nutrition`, `/diary`, `/analyser` and `/profile` are current route destinations (`client/src/App.tsx` and their page sources). The nav calls `/profile` Household; `/basket` and `/analyse-basket` lead into canonical Shopping. Proposed work should extend these owners, not create parallel rooms.
- **Verified:** Planner's current photographic approval is byte-specific. `PLANNER_DESKTOP_BOARD_DOMINANT.png` supersedes the earlier desktop photo at ≥1024px; mobile has its own approved portrait. The exception does not cover new surfaces or arbitrary regenerated assets (`THA_EXPERIENCE_BLUEPRINT.md` §§6.2, 16 and later desktop approval note).
- **Inferred:** The current photographic Pantry/Cookbook implementation and the written anti-pattern have an unresolved design tension. The screenshots and page sources establish what is visibly being built; they do not amend the Blueprint. Preserve current work and route the question to the Home Owner before scaling this treatment to six more rooms.
- **Assumed:** The latest Pantry viewport still has an uncovered strip as Colin reports. Verify at desktop/laptop/mobile, browser zoom 80–200%, before choosing the final CSS crop.

## Six concepts to review, not to install

[Open the visual contact sheet](../../../artifacts/room-vision-20261026/CONTACT_SHEET.html). The original generated files remain in Codex's generated-image store; these six copies are new, explicitly unaccepted artifacts. No screenshot was copied into this repository.

| Room | Image | Intended cue and review result | What current governance permits in product |
|---|---|---|---|
| Home | [UNACCEPTED_HOME.png](../../../artifacts/room-vision-20261026/UNACCEPTED_HOME.png) | The existing orchard through generous oak joinery; a quiet sill. | Orchard through its canonical owner at E3; do not install this derivative as a second orchard. |
| Shopping | [UNACCEPTED_SHOPPING.png](../../../artifacts/room-vision-20261026/UNACCEPTED_SHOPPING.png) | Intended practical list; the tiny blank note fails to make Shopping the task. | E1 ground and light, E2 only when clear; one list, no photographed kitchen without amendment. |
| Nutrition | [UNACCEPTED_NUTRITION.png](../../../artifacts/room-vision-20261026/UNACCEPTED_NUTRITION.png) | Intended garden-bright notice; the Pantry scene does not establish a notice/data hierarchy. | E2 view kept away from dense data; no literal noticeboard furniture without amendment. |
| Diary | [UNACCEPTED_DIARY.png](../../../artifacts/room-vision-20261026/UNACCEPTED_DIARY.png) | Intended unhurried record; the book remains in a Pantry scene rather than a distinct Diary posture. | Soft E2, a lap-desk feeling and generous air; no literal journal bitmap behind form text. |
| Analyser | [UNACCEPTED_ANALYSER.png](../../../artifacts/room-vision-20261026/UNACCEPTED_ANALYSER.png) | Intended examined product; the Pantry setting still dominates the work surface. | E1 task light and solid data ground; the product is the object, not a photographed workbench. |
| Household | [UNACCEPTED_HOUSEHOLD.png](../../../artifacts/room-vision-20261026/UNACCEPTED_HOUSEHOLD.png) | Intended family record; a blank paper in a Pantry setting does not make people first-class. | E1 even light and anchored record strata; no decorative album or photographed record. |

**Concept limitations:** AI-generated objects and proportions are illustrative, not precise interface layouts. Independent review found that five concepts repeat the Pantry's jars, cabinetry and worktop so strongly that their supposed room identities do not read clearly. The Shopping note is too small to establish the task. Treat these as a study of shared warmth only, not an endorsed room vision or layout specification. Text, controls and real household data would be live accessible UI, never baked into an image. Home's rendered orchard is illustrative and must not become a second canonical orchard asset.

## Risk key for the 180 proposals

`G` = visual/copy/responsive craft with existing behaviour. `A` = interaction or workflow change requiring an individual Amber decision. `R` = privacy, persistence, canonical ownership or safety question requiring Red-level review before implementation. These are **proposal classifications**, not permissions. Verify each item against the live implementation before opening work.

## Pantry — twenty enhancements

Direction: the governed Larder (currently reached at `/pantry`) should let households recognize their own staples at a glance; the orchard remains a limited view beyond. Practical morning light and **approximate availability**, with no quantities or expiry tracking (`Blueprint` §5.1 Pantry; `LARDER_ROOM_NORTH_STAR_ARCHITECTURE.md` §§1–3, 12, 16; current `living-home-room.tsx` / `.css`). LARDER1 calls for a user-facing **Larder** label while retaining the `/pantry` route and Domain 30 identity; the label's current runtime state needs verification before any naming work.

1. **[G] Fill the viewport** between browser chrome and shared navigation at common desktop heights; no exposed strip under the room.
2. **[G] Preserve shelf proportions** when width changes; crop the environment, never stretch jars, doors or timber.
3. **[G] Set explicit desktop, laptop and phone compositions** using the existing approved asset strategy only after architecture review.
4. **[G] Keep shelf contents inside the visible working region** at 80–200% browser zoom and short laptop heights.
5. **[G] Give the currently active shelf a quiet grounded emphasis** without darkening or hiding neighbouring food.
6. **[G] Use one legible typography scale** for food labels; avoid text floating over detailed photography.
7. **[G] Make each staple's known have/out or approximate availability readable** without hover, especially on touch screens; show no count or freshness claim.
8. **[G] Let empty shelves remain plausible** while a clear live empty-state action explains how to add food.
9. **[G] Keep the practical E2 orchard glimpse in one region** and away from ingredient text.
10. **[G] Align interactive shelf hit areas with the visible shelf geometry** so the room feels trustworthy.
11. **[A] Reduce the add-item journey to one obvious entry** while preserving the existing Pantry owner and data route.
12. **[A] Keep search results spatially tied to the shelf or item** without obscuring an open editor.
13. **[A] Let shelf relocation using the existing category/order fields return the person to the same place** instead of resetting their position.
14. **[A] Explain only known qualitative availability** from the existing staple owner; say nothing when low/out status cannot be substantiated.
15. **[A] Let a low/out staple originate an entry through Shopping's existing owner** while the staple remains in the Larder; provide an explicit handoff, no rival list.
16. **[G] Use an anchored, paper-like detail panel** whose background and contrast support easy reading.
17. **[G] Provide keyboard focus and screen-reader names** for every shelf object and overlay control.
18. **[G] Test reduced motion and slower devices**; any transition should finish before a person reaches the next action.
19. **[G] Compare real screenshots at 1366×768, 1920×1080 and narrow phone widths** for coverage, legibility and cropping.
20. **[R] Audit Domain 30 staples, Domain 15 Shopping and Domain 2 food identity** before any state change; introduce no quantity, time or rival ledger.

## Planner — twenty enhancements

Direction: the week is the principal object. The approved hanging-board photographs provide atmosphere, but the entire live paper grid, Sunday, snacks and controls must remain usable (`Blueprint` §5.1 Planner and exact photo exception; `weekly-planner-page.tsx`, `planner-physical.css`).

1. **[G] Fit the approved board composition to the available viewport** without making side gutters or a gap above navigation.
2. **[G] Keep all seven days visible on desktop** at normal zoom before enlarging ornament or controls.
3. **[G] Let the grid take most of the paper**; reduce unused space above Monday–Sunday.
4. **[G] Keep breakfast, lunch, dinner, snacks and summary fully on paper** at short laptop heights.
5. **[G] Give the paper toolbar one stable internal grid** so no button extends over the timber frame.
6. **[G] Place the week range centrally in the paper's top line** with previous/next controls tied to it.
7. **[G] Give search a predictable width** and a clear accessible label without colliding with date controls.
8. **[G] Keep household profile/override visible as a compact control** with a truthful count, no blur.
9. **[A] Make that control open the existing override workflow in one click** and return focus to the trigger.
10. **[G] Make provisioning compact in the same top region** and give its expanded content a bounded, non-overlapping surface.
11. **[G] Place Plan and Workspace at the right end of the paper line** with generous but consistent gaps.
12. **[G] Style controls as part of the paper** while preserving button affordance and focus contrast.
13. **[G] Keep weekdays and meal cells free of instructional text or popovers** when no meal is planned.
14. **[G] Give placed meals live photographs, cropped consistently** with enough room for name and essential status.
15. **[G] Make the row labels share the page's material** rather than grey boxes attached to the paper.
16. **[G] At phone widths, retain meals vertically and days horizontally** with an obvious horizontal scroll and stable row labels.
17. **[G] Offer a readable whole-week overview** without shrinking interactive meal targets below touch/accessibility floors.
18. **[G] Verify browser zoom and text enlargement** so the toolbar wraps or scrolls intentionally, never distorts the board.
19. **[A] Keep add/drag/plan actions reversible and local to the chosen day/meal**; no surprise movement of entries.
20. **[R] Confirm all week, meal and household data still use their canonical Planner owners** before altering interaction state.

## Cookbook — twenty enhancements

Direction: a book by the window: recipes are picked up and read, not managed as dashboard cards. Preserve the existing collection, source and add-to-Planner flows (`Blueprint` §5.1 Cookbook; `cookbook-real-book-concept.tsx`).

1. **[G] Let the open book occupy the usable desktop width** without losing its physical page edges.
2. **[G] Keep the same book proportion across laptop sizes**; use crop/space, not nonuniform scaling.
3. **[G] Make the first visible spread useful** with readable recipe titles before secondary controls.
4. **[G] Place controls in the book's margin or nearby shelf area** rather than on top of recipe text.
5. **[G] Keep page navigation visible but quiet**; show current location in the collection clearly.
6. **[G] Use one consistent photo crop and caption treatment** for personal and imported recipes.
7. **[G] Give long ingredients and methods enough line length and spacing** for cooking at a glance.
8. **[G] Preserve an E2 side-light/window region** without putting dense recipe text on the view.
9. **[G] Let absent recipe images use a dignified paper fallback** rather than empty broken photo boxes.
10. **[G] Show source/provenance legibly** where a recipe was imported or discovered.
11. **[A] Keep search in the same book context** so returning from a recipe restores the result position.
12. **[A] Make source filters explain what they include** without fragmenting the single canonical collection.
13. **[A] Let Add to Planner preserve recipe context** and show the chosen week/day before confirmation.
14. **[A] Keep importing a discovered recipe explicit** and show what will be saved before the write.
15. **[G] Use a single-page phone reading mode** rather than reducing a two-page spread to illegible size.
16. **[G] Give touch targets and keyboard page controls equal clarity** and never require a decorative page-turn.
17. **[G] Provide print-friendly recipe content** if the existing product supports it, with no photo-only instructions.
18. **[G] Treat use marks as subtle, data-borne warmth** and never as popularity rankings or pressure.
19. **[G] Compare real screenshots with image-heavy, text-heavy and empty recipes** at the standard viewports.
20. **[R] Verify recipe ownership, source rights and household scope** before any new save or image flow.

## Home — twenty enhancements

Direction: the threshold and heart of the house, not a dashboard. A generous view through the **existing** orchard owner welcomes the household; only a compact counter gives immediate orientation (`Blueprint` §5.1 Home; `HOME_OWNER_ARCHITECTURE.md`; `home-experience-page.tsx`).

1. **[G] Preserve the canonical three-bay orchard window** as the one generous E3 view, with no duplicate image owner.
2. **[G] Keep the oak sill a clear boundary** between outdoor view and live indoor content.
3. **[G] Give the greeting one calm location** and enough space to be read before tasks appear.
4. **[G] Make the first glance answer “how are we and what next?”** in a compact household counter.
5. **[G] Keep the orchard unobscured by cards, overlays or statistics** so the view can do its welcoming work.
6. **[G] Use the same full-morning light as other rooms**; no alternate season, dusk or animation.
7. **[G] Fit the window and counter to desktop, laptop and phone** without collapsing the view into a banner.
8. **[G] Give one clear next action** instead of equal visual weight to every destination.
9. **[G] Make secondary room entrances quiet but findable** through the shared navigation and Home's current doors.
10. **[G] Let empty households see an honest invitation** without fabricated meals, stock or progress.
11. **[A] Derive glances from existing canonical room owners** so Home summarizes, never owns duplicate task state.
12. **[A] Return to the same Home position after visiting a room** when the session navigation allows it.
13. **[G] Keep the signature greeting scarce and legible** according to its existing admission, without repeating it elsewhere.
14. **[G] Reserve visible air around the compact counter** rather than filling it with additional tiles.
15. **[G] Make loading and error states quiet and truthful**; retain the feeling of arrival when data is unavailable.
16. **[G] Ensure the window crop keeps the orchard path and gate recognizable** at all common aspect ratios.
17. **[G] Keep keyboard order aligned with visual order**: greeting, immediate action, room navigation.
18. **[G] Review the Home header against the shared shell** and record any documented exception before altering it.
19. **[G] Test one-minute arrival with a new, returning and sparse-data household** for less mental load.
20. **[R] Audit what household data Home may summarize** and keep access permission-aware, minimal and source-linked.

## Shopping — twenty enhancements

Direction: a list by the door. It should be swift, bright and usable in motion, yet still belong to the house. `/shopping-workspace` remains the one owner of Add, Shop and Review rather than acquiring another basket page (`Blueprint` §5.1 Shopping; `shopping-workspace-page.tsx`).

1. **[G] Make the active list the largest visual object**; the room's light supports it but never competes.
2. **[G] Size the note to its content** so short lists retain air and long lists scroll predictably.
3. **[G] Use plain bright E1 task light** and only permit E2 when the surface is genuinely clear.
4. **[G] Keep Add, Shop and Review recognizably the same list** with a calm mode indicator.
5. **[G] Put add-item entry at thumb reach on phones** without covering the last item.
6. **[G] Show quantity and unit with each item** in a stable, scannable order.
7. **[G] Make checked-off items settle quietly into shade**; no celebration or guilt language.
8. **[G] Keep a clear distinction between needed, in basket and completed** without relying on colour alone.
9. **[G] Make aisle or category grouping optional in the view** and preserve a simple list reading.
10. **[G] Keep scan and speech controls secondary but accessible** from the same entry lane.
11. **[A] Return focus after adding an item** so repeated additions do not require reorienting.
12. **[A] Preserve list position when checking off an item**; avoid jumping to the top.
13. **[A] Make undo for a mistaken cross-off immediate** and tied to the existing list item.
14. **[A] Explain retailer, export or price information as optional layers** that do not interrupt shopping.
15. **[A] Link planned meals and Pantry shortages into the existing Shopping workflow** with explicit source context.
16. **[G] Provide a high-contrast outdoor-use state** within approved tokens rather than a new palette.
17. **[G] Keep accessible names for scan, voice, edit and delete** distinct and unambiguous.
18. **[G] Test with empty, ten-item and very long lists** on phone and desktop.
19. **[G] Keep the shared app navigation stable** even when the list is in Shop mode.
20. **[R] Confirm retailer, household and price data permissions/owners** before adding any cross-room summary.

## Nutrition — twenty enhancements

Direction: a garden-facing noticeboard for understanding, with a solid data tier beneath. It should show patterns without grades or judgments. Preserve the existing Foods/Nutrients route and data owners (`Blueprint` §5.1 Nutrition; `plant-diversity-page.tsx`).

1. **[G] Create a calm upper notice tier** for one plain-language factual report at a time, without behavioural interpretation.
2. **[G] Put charts and nutrient detail on solid ground** below, never over the E2 orchard view.
3. **[G] Keep the garden glimpse in a single committed region** with the same orchard and morning.
4. **[G] Clarify Foods and Nutrients tabs** so each has one purpose and consistent navigation.
5. **[G] Use meaningful chart titles, units and time windows** visible without hovering.
6. **[G] State missing or incomplete input openly** rather than implying full nutritional coverage.
7. **[G] Replace rank-like visual treatment with neutral comparisons** against the household's own selected period.
8. **[G] Keep the “garden filling in” living detail subtle** and tied only to actual data.
9. **[G] Allow the household to read one useful fact at a glance** before advanced breakdowns.
10. **[G] Use consistent plain-language labels for ingredients, plants and nutrients**.
11. **[A] Let a chart segment explain its source meals/foods** through an existing detail path.
12. **[A] Keep period selection consistent across Foods and Nutrients** when the underlying data permits it.
13. **[A] Route any requested interpretation or recommendation to the registered Companion**; Nutrition itself reports facts and never becomes a coaching voice.
14. **[G] Avoid red/green moral coding and celebratory streaks** in every state.
15. **[G] Ensure chart data has a table or text equivalent** for screen readers.
16. **[G] Fit important numbers at phone text sizes** without rotating labels or shrinking type.
17. **[G] Treat empty data as a gentle explanation of what can be known**.
18. **[G] Keep evidence and interpretation visually separate** so confidence is not overstated.
19. **[G] Review dense-data layout at browser zoom and large text** before adding any visual dressing.
20. **[R] Trace each nutrient/plant claim to its canonical data source and calculation** before changing messages or rules.

## Diary — twenty enhancements

Direction: a window seat and lap desk: the most air in the house. Recording food should feel private, optional and forgiving. Keep the current daily log, meal slots, Planner copy and imports within `/diary` (`Blueprint` §5.1 Diary; `food-diary-page.tsx`).

1. **[G] Give today's record a single quiet focal area** instead of a dense dashboard header.
2. **[G] Keep the E2 window partial and away from written entries**.
3. **[G] Use a softly gathered pool of the same morning light** without making the page dim.
4. **[G] Leave deliberate space around the active day** so writing does not feel like form-filling.
5. **[G] Make meal slots easy to scan vertically** at desktop and phone sizes.
6. **[G] Show the selected date clearly and keep adjacent-day movement simple**.
7. **[G] Give blank days a neutral state**; no “missed”, “failed” or streak pressure.
8. **[G] Let an entry's title, time and source fit without truncating essential facts**.
9. **[G] Keep optional trends below the daily record** under progressive disclosure.
10. **[G] Mark yesterday's trace only when genuine prior data exists**.
11. **[A] Make adding a meal use existing entry paths** and return to the same day/slot.
12. **[A] Show when an entry was copied from Planner** and what is editable in Diary.
13. **[A] Let edit and remove actions be reversible** and preserve the user's position.
14. **[A] Keep CSV import an explicit separate action** with preview and result feedback.
15. **[G] Make metrics subordinate to the person's record**; avoid calorie-first visual hierarchy.
16. **[G] Provide a readable long-entry state** without forcing a fixed card height.
17. **[G] Keep focus order and labels private, clear and predictable** on mobile.
18. **[G] Test sparse, full and imported days** for density and calm.
19. **[G] Make loading/error/empty states honest and gentle** without pretending an entry exists.
20. **[R] Verify diary privacy, retention and canonical ownership** before any new derived insight or Home summary.

## Analyser — twenty enhancements

Direction: a clear work bench. The examined product is the object; the analysis is evidence, with uncertainty easy to see. `/analyser` already owns search, scan, comparison and history (`Blueprint` §5.1 Analyser; `products-page.tsx`).

1. **[G] Put one product and one primary action in view** before showing secondary analysis.
2. **[G] Keep the working area E1: solid, legible and brightly lit** without orchard imagery under data.
3. **[G] Use product image and name as the bench's focal object** when a result is selected.
4. **[G] Show barcode, brand, serving basis and data source close to the product**.
5. **[G] Separate observed label facts from interpreted advice** with clear visual hierarchy.
6. **[G] Make uncertain or missing facts explicit**; never visually fill gaps with false precision.
7. **[G] Present ingredients, nutrition and risks in a stable reading order**.
8. **[G] Use one comparison plane for two products** rather than stacking inconsistent cards.
9. **[G] Keep warning language factual and proportionate**; no fear-based colour or labels.
10. **[G] Let the “where you left off” detail disappear when stale**.
11. **[A] Carry a scanned product into the same analysis flow** as a searched product.
12. **[A] Preserve search or scan context when opening details and returning**.
13. **[A] Explain how a comparison was selected** and offer an easy clear/reset action.
14. **[A] Make analysis history retrievable without turning it into a score leaderboard**.
15. **[G] Use a quiet first-use E2 glimpse only when the bench is clear**; recede it during analysis.
16. **[G] Keep tap targets usable in store lighting and one-handed phone use**.
17. **[G] Provide text equivalents for any gauges or bars** and state their units.
18. **[G] Test long ingredient lists and unknown products** so evidence never overflows the bench.
19. **[G] Make errors tell the user what could not be checked** without inventing a result.
20. **[R] Trace analysis claims through the existing product/intelligence services and permission gates** before changing decision logic.

## Household — twenty enhancements

Direction: an even, unshadowed family record. People and their choices are first-class, while private settings feel secure and understandable. `/profile` remains the current Household route (`Blueprint` §5.1 Household; `profile-page.tsx`).

1. **[G] Make household members the first clear section** with names and roles easy to recognize.
2. **[G] Use even E1 light and anchored record strata** rather than an album or decorative collage.
3. **[G] Give each settings group one plain purpose**: members, preferences, diets, privacy.
4. **[G] Make the active household and member context visible** before editing any preference.
5. **[G] Keep status and counts factual**; do not make a household “score”.
6. **[G] Use consistent spacing and section labels** so the record can be scanned without reading every field.
7. **[G] Explain invite codes in ordinary language** with duration and audience visible if available.
8. **[G] Make potentially sensitive diet/health fields visually restrained** and easy to review.
9. **[G] Distinguish household-wide from person-specific choices** before any edit.
10. **[G] Show save state and errors near the relevant setting** rather than in a distant toast only.
11. **[A] Make switching family profile return a clear current-context confirmation**.
12. **[A] Open an override from Planner in the existing Household/profile editor** rather than a duplicate editor.
13. **[A] Review member invitation and removal journeys** for explicit, reversible steps where possible.
14. **[A] Make preference changes explain which rooms they affect** without new hidden cross-room state.
15. **[G] Let the canonical avatar/name treatment be the one living detail** and avoid family-photo decoration.
16. **[G] Keep keyboard and screen-reader grouping aligned with the visible record**.
17. **[G] Fit narrow screens with one-column strata** without hiding active context.
18. **[G] Test one-person and larger households** so layout stays human rather than administrative.
19. **[G] Use honest empty states for unconfigured preferences** with no suggested medical assumptions.
20. **[R] Confirm membership, health, diet and privacy owners and access controls** before any field or persistence change.

## Sequence for bringing the six rooms together

1. **Establish visual acceptance references.** Capture current desktop/laptop/phone screenshots for each canonical route, including loading, empty and populated states. Record the existing shell and exposure level. This is read-only.
2. **Resolve the photograph boundary with the Home Owner.** Choose either the current governed material/light translation or a separate, explicitly scoped Blueprint amendment for literal room images. Preserve the accepted Planner exception exactly as written. No route or asset replacement should precede this decision.
3. **Fix the shared frame once.** Verify navigation, height accounting, focus, typography and tokens in the existing shell owner. A room must not create its own header or navigation to feel distinct.
4. **Refine Home first.** It sets the orchard, sun and welcome by which later rooms will be judged. Keep `OrchardWindow` the single image owner.
5. **Refine Shopping and Household next.** Their E1 working grounds set the restraint and legibility standard; neither should require a photographic backdrop.
6. **Refine Nutrition and Diary.** Their E2 view and more reflective purpose can then be measured against the same morning and solid data ground.
7. **Refine Analyser last of the six.** It is the densest task room and should inherit the proven shell and E1 patterns while keeping evidence first.
8. **Revisit Pantry, Planner and Cookbook as one household.** Check that their stronger visual character does not create three separate applications, violate the Blueprint or damage function. Close their viewport, grid and book issues individually.
9. **Review at three shapes, not one size.** Use desktop, laptop and phone screenshots; include 80%, 100%, 125%, 150% and 200% browser zoom where layouts are most fragile. On mobile, preserve the same canonical workflows rather than shrinking a desktop tableau.
10. **Accept one room at a time.** For each room record the Home Owner's visual verdict, UX/UI/Language checklist, accessibility, performance, empty/error states, data-owner trace and user acceptance. Later Amber/Red behavior requires its own decision and rollback plan.

## Acceptance evidence and change control

For each future room change, success means the primary task is obvious within a glance, all visible controls remain inside their working surface, no text overlaps, no meaningful content is clipped at the supported viewports, the shared navigation remains constant, and the room feels like the same bright morning. Keyboard, touch and screen-reader paths must reach the same task. A photograph may never be the sole carrier of instructions or data.

**Architecture compliance:** This report changes no owner, state, route, service, component or data. The future plan extends the existing page/component owners found in source. It preserves one orchard owner, one shell, one Companion, one household authority and permission-aware access. Proposed `A` and `R` items are separately gated. Materially changing the pictured-room policy requires the Blueprint owner and Home Owner to record an explicit decision; this report does not do that. The Experience Constitution Check's practical test is whether each room reduces load and leaves the household free to choose, rather than asking for more attention or more tracking.

**Data impact:** None now. The six concept images contain blank illustrative surfaces and no real household records. **Trust check:** No claim of live current behavior is made from an old screenshot; current route/source findings are cited above, and later acceptance requires fresh visual verification. **Rollback:** All outputs are isolated new report/artifact files and may be withdrawn without touching current code; the pre-existing rollback tag and dirty work remain intact. **Definition of done for this task:** nine directions, exactly twenty enhancements each, six unaccepted images, contact sheet, architecture boundary, implementation sequence and Agent Report. **Live services, databases, scheduled tasks and configuration:** untouched.

## Suggestions

- After the visual decision, create a single governed room prototype for one E1 destination and one E2 destination before repeating a pattern across all six.
- Consider a small user review with a household member unfamiliar with the app: ask where they would add a shopping item, find a past diary meal, and understand a product's uncertain data. Observe rather than prompt.
