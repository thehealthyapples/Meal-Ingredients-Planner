Summary: Implement DEVWORLD2 importer for the committed Development World Foundation 50.

Before changes:
- Read docs/architecture/README.md.
- Create rollback protection.
- Create docs/implementation/DEVWORLD2_DEVELOPMENT_WORLD_IMPORT.md.

Mission

Import data/development_world/ into DEV only.

Rules
- Reuse existing production services.
- Validate every recipe_id/import_key against existing system meals before writing.
- Reference meals; never duplicate recipe bodies, canonical foods, nutrition, allergens, conversations, observations, learning signals or derived shopping rows.
- Import households, accounts, eaters, preferences, pantry, cookbook references, planner, diary and supported evidence.
- Unsupported fields become honest gaps.
- Idempotent: reruns update/reset DEV world households without duplicates.
- Never run in production.

Report rollback ID, files changed, validation result, import counts and honest gaps.
