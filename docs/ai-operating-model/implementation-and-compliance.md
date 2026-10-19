# Implementation and Compliance

## Required implementation plan

Before changing files, state:

- Architecture compliance and, where applicable, AI compliance.
- Definition of done.
- Data impact: reads existing data, writes new data, changes meaning, or requires backfill.
- Trust check: every material ownership, architecture, and implementation-status claim has a status tag.
- Highest-risk claim that remains Inferred or Assumed.
- Rollback plan.
- Scope lock.
- User-acceptance evidence: starting page, user action, expected behaviour, success criteria, and regression checks.

## AI-specific compliance

AI work enriches existing capabilities; it does not become another platform. Demonstrate, with repository evidence, that the work:

- Reuses the Intelligence Platform.
- Extends the Capability Registry where appropriate.
- Reuses the Intent Engine.
- Reuses existing business services.
- Preserves permission-aware access.
- Does not duplicate conversation state.
- Does not create an additional assistant.

If these cannot be demonstrated, stop and investigate.

## Reports

Implementation reports belong in `docs/implementation/`. Investigations belong in `docs/investigations/`. Use a filename matching the task name and report the resulting path on completion.
