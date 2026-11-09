# Codex Luna — Planner image scalability investigation

Date: 2026-10-26
Task: Read-only assessment of scaling the accepted Planner kitchen image across viewport sizes and display resolutions without distortion.
Agent: Codex CLI, model gpt-6-luna, low reasoning effort.

## Scope and authority

- Repository: G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003; branch and HEAD verified as feat/integrated-dev / bffc533d65f58ae30c1faf7d3026b50dcc17be89.
- Parent preflight read: AGENTS.md, PROJECT_GOVERNANCE.md, docs/architecture/README.md, docs/architecture/ENGINEERING_WORKFLOW.md, docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md, docs/architecture/THA_UI_ARCHITECTURE.md, docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md, docs/architecture/THA_EXPERIENCE_BLUEPRINT.md, docs/architecture/THA_EXPERIENCE_LANGUAGE.md, docs/architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md, docs/architecture/HOME_OWNER_ARCHITECTURE.md, and prior Planner implementation/session records. Codex relied on this preflight and did not reread those documents wholesale.
- Risk: Green, investigation only.

## Findings

- Verified: Accepted image client/public/images/planner/PLANNER_TARGET_BLANK_ACCEPTED.png is 1280×960 (4:3). Desktop and tablet stage preserve a 4:3 measure and use object-fit: contain (client/src/styles/planner-physical.css:38-54); this keeps the complete scene visible and may leave surrounding air when the container shape differs.
- Verified: At widths ≤767px, stage becomes auto-height with viewport-based minimum and image changes to object-fit: cover; object-position: center top (planner-physical.css:339-369). This fills the mobile stage by cropping. Exact crop depends on runtime dimensions; no live viewport screenshot was inspected.
- Verified: The JSX renders a single image source and no srcset (client/src/pages/weekly-planner-page.tsx:2104). Responsive stage geometry addresses viewport shape. srcset/sizes or a higher-resolution derivative addresses pixel density and sharpness, not composition or aspect-ratio mismatch.
- Inferred: Because the board is baked into the photograph, ordinary CSS can scale the whole photo or crop it, but cannot enlarge only the board without distortion or cropping other scene content. A different relative board size requires a separately composed visual asset, or rebuilding the board as a separate visual layer—an architectural/design decision, not a CSS sizing adjustment.

## Options

1. Preserve the full photograph with contain; accept air/letterboxing where screen shape differs. Lowest visual risk.
2. Use a focal crop for narrow screens; fills more space but loses parts of the kitchen. The crop must keep the full board visible.
3. Create separately approved compositions for distinct viewport shapes; can preserve the board’s prominence while keeping proportions, but adds visual assets that require review and maintenance.

Recommended first step: Keep the accepted image undistorted and capture the page at the agreed phone and desktop sizes. Assess the existing mobile crop and desktop height constraint before deciding whether cropping or alternate compositions are needed. Consider a higher-resolution derivative only if the same 4:3 image looks soft on high-density displays.

## Actions and unknowns

- Inspected only the named Planner sizing rules, stage/image JSX, and accepted image metadata.
- No repository source or configuration changed; no tests/builds run; no app services, databases, or user data accessed.
- The current dirty working tree was preserved.
- Unknown: exact browser dimensions, zoom, and crop at runtime; no live desktop/mobile screenshot was captured.

