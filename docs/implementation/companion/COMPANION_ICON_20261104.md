# Companion Icon Consistency — 2026-11-04

## Summary

**Verified:** Replaced the generic leaf glyph with the existing Companion emblem at conversational identity locations in `client/src/components/conversation/FloatingAssistant.tsx`: surface label, answer avatar, loading avatar, drawer heading, and first introduction. The canonical source remains `client/public/companion-mark.png`, already designated an approved Brand asset by `docs/architecture/LIVING_HOME_CANONICAL_PRODUCTION_ASSET_ARCHITECTURE.md`.

## Governance and scope

- **Repository / branch / base:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` / `feat/integrated-dev` / `3467abad4eca8d82ffc52756fee13874e389597f`.
- **Risk:** 🟢 Green visual consistency; no behavior, data, or architecture changed.
- **Approval:** Owner request: “icon needs to be the companion icon.”
- **Governing files read:** repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `.engineering/OPERATING_MANUAL.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`, THA AI Operating Model skill.
- **Task architecture read:** `docs/architecture/THA_UI_ARCHITECTURE.md` §10; `docs/architecture/LIVING_HOME_CANONICAL_PRODUCTION_ASSET_ARCHITECTURE.md`; `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` §18; `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md` §18.2.
- **Repository state:** Extensive unrelated changes were already present. This task edits only the existing `FloatingAssistant.tsx` component plus session/report records. Its pre-edit dirty bytes were saved at `.engineering/session/rollback-evidence/COMPANION_ICON_20261104_FloatingAssistant.tsx.prechange.bak`, SHA-256 `C26D36E2D33566674995A478B32FFF7A8A393AE2D7937E5D03A8D8166D4F11A4`.

## Architecture and experience compliance

- **Verified:** The one already-approved Companion mark and existing `.companion-emblem` presentation are reused; no new or copied visual asset or parallel icon style was created.
- **Verified:** The visual mark is decorative and stays `aria-hidden`; the Companion control retains its accessible text label. No runtime state, conversation data, route, workflow, or capability changed.
- **Experience:** One familiar Companion identity across its conversation surfaces; no new attention demand, interaction step, or visual pattern. The existing identity remains anchored to THA's brand system.
- **Product Registry:** No product fact or capability behavior changed, so no registry entry change was needed.

## Definition of done and acceptance

- **Definition:** All generic leaf glyphs used to identify the Companion in its conversation panel are replaced by the canonical Companion mark; unrelated leaf and apple uses are unchanged.
- **Acceptance:** Open the floating Companion panel, inspect the title, an assistant answer, loading state, introduction, and room-context badge. Each Companion identity location should show the approved detailed medallion, matching the asset used at the app's top-right launcher.
- **Visual verification limitation:** The local home route loaded, but the signed-in panel was not interactively opened after the build; a post-change screenshot comparison remains unverified.

## Validation

- `npm run build` — passed (client and server). Existing warnings: stale Browserslist data, PostCSS `from`, large chunks, and CJS `import.meta`.
- No tests were run.
- Dirty-state snapshot and source component hashes matched before editing.

## Data impact, rollback, release

- **Data impact:** None. No persistent records, schema, migrations, or configuration changed.
- **Rollback identifier:** `rollback/companion-rename-20261104` → `3467abad4eca8d82ffc52756fee13874e389597f` (tag created earlier with explicit owner authorization; it anchors committed state only).
- **Dirty-state rollback:** Restore the saved pre-change component snapshot to return `FloatingAssistant.tsx` exactly to its state before this icon task, preserving the earlier rename and user drag changes. Do not reset the repository.
- **Release:** Dev branch only; no commit, push, deploy, or promotion.

## Outcome

Icon consistency is implemented and build-verified; live signed-in visual acceptance remains for the owner to confirm.
