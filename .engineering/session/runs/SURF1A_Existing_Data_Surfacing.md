# Session: SURF1A_Existing_Data_Surfacing

| Field | Value |
|---|---|
| **Session ID** | `SURF1A_Existing_Data_Surfacing` |
| **Rollback ID** | `rollback/SURF1A-existing-data-surfacing-20260714` → `f9c23c97` |
| **Start time** | 2026-07-14T07:30:00Z |
| **Current stage** | Complete |

## Objective
Expose data that is **already published and already served** but is dropped before it
reaches a household: preparation guidance, aliases, storage guidance, and existing food
attributes. Trace each field Canonical Owner → Publication → API → Frontend Type → UI and
fix the link that drops it. **Create no new knowledge.**

## Files modified
**Client**
- `client/src/components/intelligence/FoodPreparationList.tsx` — new; the one client owner of preparation presentation
- `client/src/components/intelligence/intelligence-tokens.ts` — new `preparation` chip kind
- `client/src/components/intelligence/index.ts` — export the new owner
- `client/src/components/PantryKnowledgeHub.tsx` — type declares `preparations`; renders aliases / preparations / storage
- `client/src/pages/food-detail-page.tsx` — renders aliases / varieties / preparations / storage

**Server**
- `server/lib/food-intelligence-assembler.ts` — composes the four fields from the knowledge owner over the WS2A identity bridge

**Tests / docs**
- `server/tests/test-surf1a-existing-data-surfacing.ts` — new; 31 assertions
- `package.json` — registers `test:surf1a-existing-data-surfacing` in `npm test`
- `docs/implementation/platform/SURF1A_EXISTING_DATA_SURFACING.md` — implementation report
- `docs/implementation/ux/adoption-register.json` + `.md` — re-dated the one fact this change moved

**No seed, migration, or database row was written.**

## Checkpoints
- [x] Rollback tag created and reported (before any work)
- [x] Architecture bootstrap — `docs/architecture/README.md` read
- [x] DCA1 audit read; scope limited to no-new-knowledge fields
- [x] Both chains traced to the exact dropping link (client type / server assembler)
- [x] Baselines captured before changing anything (typecheck, adoption, CPV1)
- [x] Implementation — both chains
- [x] Verification suite written (31 assertions) and **negative-controlled against `f9c23c97`**
- [x] CPV1 `pr-unrendered` flipped WARN → PASS (an instrument this session did not write)
- [x] Regression suite green; no typecheck regression in any touched file
- [x] Implementation report written
- [x] Milestone commit

**Last checkpoint:** Milestone commit.

## Next action
None — SURF1A is complete.

**Recommended next:** DCA1 gap #1 — `server/storage.ts:2751` hardcodes `dietRestrictions: []`
into the AI-facing household context; 21 households' allergens have never reached the
Companion. It is a safety defect, deliberately out of scope here, and it is the highest
remaining item in the audit.

## Blockers
None.

## Notes
The working tree was already dirty on arrival (uncommitted work by other sessions:
`HouseholdNutritionPanel.tsx`, `household-nutrition-assembler.ts`, `notice-gateway.ts`,
`publication-register.ts`, and others). This session **did not touch, commit, or revert any
of it**. The two `adoption:check` failures and the 32 `typecheck:ci` regressions present in
the tree are all attributable to that work; none is in a file SURF1A touched.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
