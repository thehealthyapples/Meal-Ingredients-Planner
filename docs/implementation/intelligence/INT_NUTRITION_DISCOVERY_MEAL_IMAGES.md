# Nutrition Discovery Meal Images

Date: 2026-11-10  
Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`  
Branch: `feat/integrated-dev`  
Risk: Amber (small user-facing Companion behavior change)

## Objective and scope

Show the canonical image on Companion cards when nutrition discovery returns a saved meal that has an image. This change is limited to the nutrition discovery card projection. The separate request to remove gluten shopping reminders was not implemented in this decision.

## Governing authority read

- `AGENTS.md`, `PROJECT_GOVERNANCE.md`
- `docs/architecture/README.md`
- `docs/architecture/ENGINEERING_WORKFLOW.md`
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`
- `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`
- `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`
- `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`
- `docs/architecture/THA_UI_ARCHITECTURE.md`
- `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`
- `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`
- `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`
- `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
- `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`
- `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`
- `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md`
- `docs/architecture/capabilities/meals.md`
- `.engineering/OPERATING_MANUAL.md`
- `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- `.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`

No authority conflict found for this scoped change.

## Architecture and experience compliance

- **Verified:** `nutrition-discovery` returns saved meal rows with their canonical `imageUrl` in `server/intelligence/services/nutrition-discovery-engine.ts`.
- **Verified:** the Native Discovery builder already has a rich meal-card path that preserves canonical meal ID, canonical image URL, and meal navigation; the Companion renderer already displays `imageUrl` for meal cards.
- **Verified:** nutrition discovery was configured as a generic food card, which discarded the meal image and used the wrong canonical ref kind for a saved-meal result. It now opts into the existing meal-card projection.
- **Verified:** the meal and its image remain owned by the meal record. The Companion is a consumer; no second image source or meal state is introduced.
- **Verified:** this reuses the existing Intelligence Platform capability result, discovery builder, Companion Card component, and canonical meal route. No new capability, intent, assistant, conversation state, or persistence path is introduced.
- **Verified:** permission-aware access remains in the existing nutrition discovery read path; this change only projects its returned result.
- **Experience Constitution:** hospitality is supported by showing the actual saved meal image; the outcome is greater confidence recognizing a suggestion; card weight is unchanged; the Companion remains the advising voice; meal identity and image ownership remain canonical; agency is unchanged; restraint is preserved; the change stays within the existing Companion Card presentation layer.
- **UX governance:** progressive disclosure and canonical navigation are preserved; no new notification, prompt, string, or interaction is added; the existing card remains the sole presentation owner; absence of an image still uses the existing glyph; no image is fabricated.
- **UI governance:** the existing card anatomy and tokens are reused; no new visual building block, asset, color, motion, or register owner is introduced.
- **Product Registry impact:** no entry change; product identity or user-facing product claim did not change.
- **Adoption Register impact:** no change; no client-side building block was introduced, adopted, or retired.

## Definition of done

- Nutrition discovery suggestions with a canonical meal image render that image in their Companion card.
- Suggestions without an image retain the existing glyph placeholder.
- Cards refer to the canonical meal ID and Open navigates to that meal’s canonical page.
- No Add to Planner or Add to Shopping action is introduced for nutrition-discovery cards.
- The separate shopping reminder request remains untouched.

## Data impact

- Reads existing data: **YES**, existing saved meal image URL.
- Writes new data: **NO**.
- Changes meaning of existing data: **NO**.
- Requires backfill: **NO**.

## Trust check

- Could this mislead the user? **No known new risk**; the card now identifies the actual meal and uses its canonical image.
- Could it fabricate certainty or content? **No**; image remains optional and source-owned.
- Is anything guessed but shown as real? **No**.
- What happens if the system is wrong? The user can open the canonical meal record; no mutation occurs on the card.
- No architectural duplication introduced: **YES**.
- No new source of truth created: **YES**.
- Highest-risk remaining inferred claim: browser rendering in the current dev process has not been manually observed after this edit.

## Rollback

- Rollback identifier: `rollback/INT-companion-meal-images-20261110` → `82f23226f43a3a8e8298f8863c483239a3e2a89d`.
- Files changed: `server/intelligence/conversation/native-discovery.ts`; its existing contract test fixture/assertion in `server/tests/test-intelligence-native-discovery.ts`; this report; engineering session records.
- Rollback code/report changes by reverting those scoped changes; the tag anchors the pre-change committed state. No existing uncommitted work was present at task start.
- Post-rollback verification: inspect status and diff; run the focused native discovery check when the owner requests test execution.

## Scope lock

- Implemented: map nutrition discovery meal results to the existing meal-card view.
- Excluded: gluten reminder dismissal/muting, shopping restriction logic, image generation, other discovery domains, deployment, restart, or promotion.
- **SUGGESTIONS:** none.

## Verification and user acceptance

- Inspected the source diff and confirmed the change is limited to the nutrition-discovery domain configuration plus its existing contract fixture/assertion.
- Automated tests were not run. The governing agent instructions prohibit adding or running tests unless requested; the existing assertion/fixture was updated to match the intended card contract.
- Manual acceptance: on the Cookbook Companion, ask for a high-protein meal whose saved record has a canonical image. Expected: the suggestion card shows that image; Open goes to the canonical meal; a meal without an image shows the existing placeholder; no write action appears.
- Starting evidence: provided screenshot on the Cookbook Companion page showing meal suggestion cards with generic glyphs despite cookbook thumbnails.
- User acceptance: pending live browser confirmation.

## Implementation Completion Report

- Architecture Complete: **YES** for the scoped mapping, with canonical meal identity and presentation owners reused.
- Engineering Complete: **PARTIAL** — source diff reviewed; automated test intentionally not run; browser acceptance pending.
- Interaction Complete: **PARTIAL** — static route mapping reviewed; live card click and image load still need user/browser confirmation.
- Existing Assets Used: canonical meal `imageUrl`; existing meal discovery projection; existing Companion Card renderer; existing canonical meal route.
- New Assets Required: **NONE**.
- Remaining Gaps: **Verification gap** — browser confirmation of image loading and canonical navigation is pending; user can verify in the open dev app.
- Stop Test: no further independent code change remains in this scoped image mapping; only runtime/browser verification remains.

## Commit-all follow-up verification — 2026-11-11

`npx tsx server/tests/test-intelligence-native-discovery.ts` was attempted. The meal/card projection assertions, including canonical image propagation, pass before the Gateway end-to-end section attempts Postgres and exits with `EACCES` on port 5432. Therefore the complete suite did not pass; no live image rendering/navigation acceptance was performed. This verification gap is preserved for the owner.
