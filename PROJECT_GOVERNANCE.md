# Healthy Apples Project Governance

This file is the authoritative project brief for ChatGPT, Claude Code, Codex, and any other delegated agent working in this repository.

## Repository and safety

- The authorised repository is `tha-cookbook-real-book-functional`. The primary local checkout is `C:\Users\Colin\The Healthy Apples\GitHub\tha-cookbook-real-book-functional`. A delegated Git worktree may use a different absolute path only when it resolves to this same repository and its exact worktree path, branch, and base commit have been verified before work begins.
- Current feature worktree/branch must be verified before every delegated task.
- Do not commit, tag, push, open PRs, deploy, migrate the database, change credentials, or modify production/staging without explicit user authorization.
- Never read, print, copy, or expose secrets. Treat local `.env` files as authoritative and confidential.
- Preserve unrelated dirty-worktree changes. Do not reset, clean, or overwrite them.

## Mandatory governance bootstrap

Before any significant investigation, recommendation, concept, implementation, or delegated task:

1. Verify the exact repository root, current worktree/branch, HEAD commit, and `git status`.
2. Read `docs/architecture/README.md`. It is the mandatory entry point to the governing architecture.
3. Read and follow `docs/architecture/ENGINEERING_WORKFLOW.md`.
4. Identify the domain affected by the request and read the relevant governing architecture named by the Architecture README.
5. For any UX, UI, frontend, visual, room, Cookbook, Planner, Larder, or Living Home work, read `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` before design or implementation and follow its Experience Constitution Check.
6. Apply `docs/change-control.md` where a material product or implementation decision is required.
7. Do not rely on conversation memory or a summary where the authoritative repository document is available.
8. If authoritative documents conflict, are missing, or do not support the requested change, STOP and report the conflict. Do not choose an interpretation silently.
9. Do not modify files or delegate implementation until the Governance Preflight Receipt below has been produced.

### THA Governance Preflight Receipt

Before implementation or delegation, report:

- Repository
- Worktree / branch
- Base HEAD commit
- Git status
- User request
- Mandatory governance documents actually read
- Task-specific governing documents actually read
- Existing implementation/assets inspected
- Authorised scope
- Explicit non-goals
- Architecture or governance conflicts: NONE or details
- Decision/risk status
- Implementation permitted: YES or NO

A statement such as "I followed the architecture" is not sufficient. Name the exact governing documents actually read.

### Delegation gate

No Claude, Codex, subagent, or other implementation agent may be delegated a THA task from conversation context alone.

Every delegated task must include the repository/worktree identity, authorised scope, non-goals, protected areas, tests, stop condition, and exact governing files to read.

The delegated agent must independently read those files before editing. A parent-agent summary is not a substitute for the authoritative files.

### Verification gate

Agent completion is not acceptance.

After implementation, the parent agent must independently inspect the actual diff and compare it against the same governing documents used during preflight.

A technically working implementation that violates architecture, governance, approved visual direction, ownership, or scope is a failure.

## Product North Star

Healthy Apples is a materially honest home and kitchen experience. It must feel like moving through a real home, not a dashboard or ordinary webpage placed over scenery.

- Physical rooms and household objects are primary.
- Navigation is bottom-only. Do not add a left rail.
- Preserve believable scale, lighting, materials, architecture, and environmental cues.
- Semantic controls and real operations must remain available beneath visual treatments.
- Mobile requires a readable flat fallback.
- Do not use generic grey application modals, floating dashboard cards, childish/basic computer graphics, or unrelated stock imagery as a substitute for project assets.

## Visual governance

- Existing Healthy Apples room/home/kitchen assets and established visual language are the source of truth.
- Before creating a concept, locate and inspect the exact repository assets that define the room, kitchen, shelf, window, fridge, Cookbook, Larder, or Planner context.
- A concept must use the actual project scene or a governed edit of it. Do not use Unsplash or unrelated stock photography unless Colin explicitly authorizes it.
- The real room/kitchen context must remain visibly present and materially believable. A working object such as the Planner may become the dominant usable surface on its dedicated workspace when readability requires it, while remaining physically integrated with the photographed kitchen. Never turn it into a detached generic dashboard, poster, or unrelated UI board.
- Photorealistic means actual photographic/composited pixels with realistic light, shadows, materials, perspective, and scale. HTML/CSS diagrams and schematic panels are not photorealistic concepts.
- Keep concept outputs quarantined under `artifacts/`, label them UNACCEPTED until Colin approves them, and provide exact paths plus a contact sheet.
- Passing a build, contract, screenshot generator, or agent report is not visual approval. Colin is the human visual acceptance owner.

## Architecture and canonical behavior

- Reuse existing routes, services, hooks, data models, dialogs, mutations, and callbacks. Do not invent parallel business paths in concept pages.
- Preserve `useMeals()`, `shelfForMeal()`, `/api/freezer`, `usePlannerMealSearch`, Planner infrastructure, scanner/review flow, and `CompanionContextProvider`.
- Cookbook canonical shelves and placement language are owned by `shared/cookbook/curation.ts`.
- Canonical ingredient identity uses the shared parser, normalizer, resolver, and controlled variants. Do not add local synonym/token matching.
- Actions must execute the real operation. Shopping adds meal ingredients to the existing shopping list; Freezer uses the existing freezer workflow; Planner uses existing Planner infrastructure.
- Preserve legacy functionality at `/cookbook/grid` while `/cookbook` is the Real Book surface.
- Keep provenance/source URLs and acquisition information intact.

## Planner direction

The Planner remains functionally a weekly day/meal-slot grid, but its visual presentation must be a real-world kitchen object rather than a dashboard grid.

- The intended direction is a physical weekly Planner hanging from or attached near an existing shelf, window, rail, fridge, or other real kitchen feature.
- Natural daylight may illuminate it; the Planner must belong to the actual project kitchen scene.
- The Planner remains a physically believable object within the real kitchen scene. On the dedicated Planner workspace, the accepted Planner photograph may fill most or all of the available viewport so the weekly paper grid is large and readable. The Planner must remain visibly part of the kitchen and must never become a generic dashboard, poster, or detached UI board.
- Preserve the existing seven-day, meal-time, search, drag/drop, assignment, removal, and accessibility behavior.
- Do not implement Planner visual changes until the concept has been grounded in the actual project assets and Colin has reviewed the pixels.

## Delegated-agent contract

Every Claude/Codex task must include:

- the exact absolute worktree path, branch, and repository identity;
- exact files allowed to read/edit;
- protected files/areas and forbidden scope;
- the governing North Star and relevant canonical architecture;
- exact commands/tests to run;
- a stop condition;
- no commit/push/deploy/credential/database side effects.

Agent completion is not acceptance. The parent agent must inspect `git status`, `git diff`, actual artifacts, focused tests, build output, and live behavior where relevant. For visual work, the parent must inspect the actual full-resolution pixels and reject violations before delivery.

## Delegation responsibility split

For the Planner migration and visual implementation:

- When a Planner feature-parity audit is required, Codex may be used as the read-only audit worker. During that audit it must enumerate every current Planner feature, interaction, route, service, hook, data flow, mutation, accessibility behavior, responsive behavior, and edge case that must be preserved. It must not redesign or edit implementation during the audit. Performing the audit does not reserve later implementation work to either Codex or Claude.
- Planner visual implementation is assigned by the THA orchestrator to Claude or Codex only after the Governance Preflight, task-fit and complexity assessment, and current capacity review. Claude is normally preferred for nuanced visual-fidelity work, but this is a routing preference rather than ownership. The selected worker must remain narrowly scoped and must not decide feature scope, remove existing behavior, invent architecture, replace canonical services/routes, or use generic UI patterns.
- Hermes/Luna, or ChatGPT when acting as the parent orchestrator, reconciles any parity audit with the repository architecture, recommends or selects the implementation worker under the governed THA routing rules, gives that worker exact bounded implementation directions, and independently verifies the resulting diff, tests, runtime behavior, and visual pixels where applicable.
- If an agent cannot locate the governing principle, canonical implementation, required asset, or safe behavior in project files, it must stop and ask for direction. It must not infer, substitute, or proceed generically.
- The accepted Planner visual base is `artifacts/planner-target-blank/PLANNER_TARGET_BLANK_ACCEPTED.png`. Do not create a replacement visual direction without Colin's explicit approval.
- Planner implementation must use the accepted image as the physical surface and place semantic live overlays over its blank content area. Do not recreate the image, cupboard, window, paper, wood, lighting, or Planner frame with generic CSS.
- The Planner must feel familiar to the accepted Real Book Cookbook: physical-object-first, materially honest, readable, calm, household-scale, and functionally direct. Reuse the Cookbook's established interaction language and canonical controls where architecture supports it; do not invent a second visual system or generic dashboard card treatment.
- Planner visual acceptance requires the approved hanging Planner photograph to fill the available screen as the physical surface; desktop days must run horizontally Monday through Sunday, meal types vertically down the side, and live meal information must occupy the paper grid. Planner typography must mirror the Cookbook's established typography and material voice. The page title should use the established family-meal voice, with the working wording: "Planner — The meals that bring our family together, every day". Controls must be calm and restrained: reduce visible button-heavy chrome without removing semantic access to existing Planner actions.

## Status vocabulary

Distinguish: coding complete, technically verified, integrated, visually reviewed, human-approved, and deployed. Never collapse them into one completion claim.
