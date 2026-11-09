# Companion Name Update — 2026-11-04

## Summary

**Verified:** The household-facing conversational identity is now named **Companion** in the existing floating conversation surface, Larder prompt, all six registered introductions, product glossary, capability descriptions, and generated product inventory/navigation. No new assistant, conversation state, or workflow was introduced.

## Governance and scope

- **Repository / branch / base:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`.
- **Risk:** 🔴 Red, because the canonical product name in the Product Knowledge Registry changed. The runtime edits are copy-only; answer behavior did not change.
- **Approval:** The owner directly requested that Apple be renamed Companion and authorized rollback tag `rollback/companion-rename-20261104` at the base commit. Dev-branch authority is recorded in `PROJECT_GOVERNANCE.md`.
- **Governance read:** repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, and the THA AI Operating Model skill.
- **Task architecture read:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md`, `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_LANGUAGE.md`, `docs/architecture/THA_UI_ARCHITECTURE.md`, `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`, `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, and `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`.
- **Pre-existing state:** Worktree already contained extensive unrelated edits. The pre-change check reported 157 status entries; no unrelated changes were reset, stashed, or overwritten. Existing edits in `FloatingAssistant.tsx`, `larder-room.tsx`, and `product.yaml` were preserved. Later status count includes new work artifacts.

## Architecture and experience compliance

- **Verified:** Product Knowledge Registry owns the canonical product description; the `dom-companion`, `gls-apple`, and `cap-companion` entries retain their stable IDs while their display names/purpose change. `product.json`, `OWNERS.md`, and `VISIBILITY.md` were regenerated from the canonical YAML.
- **Verified:** The same Companion gateway, personality registry, and existing conversation flow remain in place; this creates no parallel assistant or duplicated state. No access, permissions, food logic, or response routing changed.
- **Experience Constitution:** Hospitality is served by using the name the owner requested; outcome is clearer orientation and more confidence about who is answering; no extra screen, step, or visual weight is added. The Companion remains an invited, dismissible, permission-aware presence; household agency and confirmation behavior remain intact. This is a copy update within the existing interaction, not new room design; no blueprint location or visual pattern changed.
- **UX / UI review:** Existing hierarchy, navigation, design language, control semantics, accessibility naming, states, and adoption register ownership are unchanged. Input and launcher accessible names now say Companion.
- **Registry review:** Registry remains the one product fact owner; stable IDs and visibility values remain. No new capability/page/route was introduced, access remains unchanged, and no product knowledge was added to prompts.

## Changes made

- Updated assistant title, input prompt, action assurance, accessible launcher name, and floating-surface label in `client/src/components/conversation/FloatingAssistant.tsx`.
- Updated the Larder “Ask Apple” call-to-action in `client/src/pages/larder-room.tsx`.
- Updated all six personality introductions in `server/intelligence/conversation/personality-registry.ts`.
- Changed the canonical glossary and relevant capability descriptions to Companion; retained unrelated references to apple fruit, Apple Score/Rating, and Bad Apple.
- Regenerated derived registry inventory and owner/visibility indexes from `docs/product/inventory/product.yaml`.
- Preserved the pre-existing draggable-launcher and Larder loading-skeleton edits.

## Data impact and trust

- **Data impact:** No application records, schema, database, or persistent user data changed. Canonical product-name meaning changed; no backfill is needed. Generated registry artifacts reflect the YAML source, including other already-present YAML changes in this worktree.
- **Trust check:** Product ownership and architecture claims above are tagged Verified and tied to repository documents. Highest remaining uncertainty: local dev-server rendering was not rechecked after the build; the production build verifies compilation, not browser copy at runtime.
- **Definition of done:** Runtime copy and canonical names consistently use Companion, generated indexes match YAML, build passes, and existing user edits remain intact.
- **Acceptance evidence:** On the integrated-dev app, open the floating conversation from any room; its title and input should say Companion, launcher screen-reader name should announce Open/Close Companion, and Larder’s smart-suggestions prompt should say Companion. A first greeting should introduce the speaker as “your Companion” for each of the six voice settings.

## Validation

- `npx tsx scripts/build-product-inventory.ts` — passed; generated 165 entries.
- `npx tsx scripts/build-registry-nav.ts` — passed.
- `npm run build` — passed (client and server). Warnings: old Browserslist dataset, PostCSS missing `from`, large chunks, and CJS `import.meta` notices.
- No tests were run.
- Name search in targeted runtime/product files found no remaining assistant-facing “Apple”; remaining Apple terms are fruit/brand terms and two historical implementation comments.

## Rollback and release

- **Rollback identifier:** `rollback/companion-rename-20261104` → `3467abad4eca8d82ffc52756fee13874e389597f`.
- **Rollback:** Restore only this task’s reviewed changes in the runtime, personality, product source, and generated files; do not reset the repository because it contains pre-existing work. The tag anchors committed code state and does not restore dirty files.
- **Release:** Development branch only. No push, deploy, migration, or shared/main promotion.
- **Commit:** Not created. The repo operating manual requires a local commit for a multi-file task; repository `AGENTS.md` prohibits committing without explicit user authorization. Rollback-tag authorization did not authorize a commit.

## Suggestions — Companion answer quality (separate Red decision)

Browser observations from the companion query review showed three concrete failures: a vegetarian query returned chicken/fish recipes; an “only these ingredients” dinner question suggested an omelet despite no eggs; and pantry results mixed food with household consumables and questionable removal suggestions. Improve answer quality within the existing Intelligence Platform, Capability Registry, Intent Engine, food services, nutrition knowledge, and permission-aware context:

1. Parse diet, allergy, nutrition goal, and ingredient-availability language into explicit intent constraints.
2. Filter candidates against hard dietary constraints and available-ingredient facts before ranking. Treat unknown recipe ingredients as unknown, not compliant.
3. Use grounded per-serving nutrition data for protein questions and show evidence/source; do not present unsupported estimates as facts.
4. Distinguish “use only these ingredients” from “suggest a dish and list what’s missing”; clearly name missing ingredients and keep any shopping/planner action proposed until confirmed.
5. Add regression cases for vegetarian/vegan exclusions, allergens, missing ingredients, pantry non-food items, nutrition targets, and honest unknowns. Track constraint violation rate, evidence coverage, and honest-gap rate.

This behavior work is not implemented by the rename; it requires its own approved Red scope and verification plan.
