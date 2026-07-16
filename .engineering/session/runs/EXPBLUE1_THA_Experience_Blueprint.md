# Session: EXPBLUE1_THA_Experience_Blueprint

| Field | Value |
|---|---|
| **Session ID** | `EXPBLUE1_THA_Experience_Blueprint` |
| **Rollback ID** | `rollback/EXPBLUE1-tha-experience-blueprint-20260715` → `b3c650cd` |
| **Start time** | 2026-07-15T17:30:00Z UTC |
| **Current stage** | Complete |

## Objective
Create the canonical **THA Experience Blueprint** — the single governing
source of truth for how THA should feel, look and behave — by UNIFYING the
existing experience governance (Experience Architecture, UI Architecture,
Experience Language incl. § 3A/§ 4A) and the graduated experience discoveries
(One Home Many Places, orchard exposure, light, materials, living details)
into one timeless blueprint. Do NOT implement UI, do NOT redesign screens,
do NOT duplicate existing architecture (cite owners; never restate rules).
Extend existing governance rather than rewriting it.

## Files being modified
- `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` — the blueprint (new)
- `docs/implementation/architecture/EXPBLUE1_THA_EXPERIENCE_BLUEPRINT.md` — implementation report (new)
- `docs/architecture/README.md` — index the blueprint under Experience Governance
- `.engineering/session/runs/EXPBLUE1_THA_Experience_Blueprint.md` — this run file
- `.engineering/session/CURRENT.md` — dashboard row

## Checkpoints
- [x] Read architecture README, Experience Architecture, UI Architecture, Experience Language, EXP5 One Home Many Places
- [x] Confirmed git status; created rollback tag (`→ b3c650cd`)
- [x] Author `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` (18 sections; cites owners, owns only the unowned: Vision · One Home Many Places · Orchard Exposure Scale E0–E3 · light/material direction · Living Details · Companion's place · Blueprint Checks · spatial anti-patterns · Design North Star)
- [x] Update `docs/architecture/README.md` Experience Governance section (table row + prose paragraph, additive)
- [x] Extend `docs/architecture/ENGINEERING_WORKFLOW.md` (STEP 2 required reading + compliance block: fourth document row + Blueprint Checks ✓ line, additive)
- [x] Write implementation report (`docs/implementation/architecture/EXPBLUE1_THA_EXPERIENCE_BLUEPRINT.md`)
- [x] `repo-structure-verify.sh` — all checks touched by this workstream pass (pre-existing stray root files from an earlier session noted, untouched)
- [x] Reconcile run file + dashboard

**Last checkpoint:** EXPBLUE1 complete. Blueprint adopted; three sibling
governing documents byte-untouched; every rule still owned once. Open items
recorded in Blueprint § 18 (orchard owner, Home header, UIA § 4 amendment,
dark mode).

**Next action:** None — complete.
