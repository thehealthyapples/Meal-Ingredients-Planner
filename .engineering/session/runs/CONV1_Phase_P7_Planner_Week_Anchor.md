# Session: CONV1_Phase_P7_Planner_Week_Anchor

| Field | Value |
|---|---|
| **Session ID** | `CONV1_Phase_P7_Planner_Week_Anchor` |
| **Rollback ID** | `rollback/CONV1-phase-p7-planner-week-anchor-20260717` → `8fcb3d72` |
| **Start time** | 2026-07-17 |
| **Current stage** | Complete |

## Objective
Implement CONV1 Phase **P7** only: `SCH-2` — `planner_weeks.weekStartDate`, the planner week
anchor. Additive, nullable, written **only** at week creation (TIME1 § 6.2), **never**
back-filled (HT7 / CONV1 `R5`). Preserve the governing Household Time Architecture. No P8+
work (no consumer converges in this phase), no unrelated refactoring.

## The specification (TIME1 § 6.2 — the crux, settled by the governing docs, not by me)
```
weekStartDate(N) = mondayOf(householdToday(now, zone)) + 7 × (N − 1)
```
Legitimate **only** at `storage.createPlannerWeeks`, where all six slots are made consecutive
in one transaction at a known instant. Existing rows stay `NULL` **forever** — a back-filled
anchor is `approxDate` with a schema.

## Files being modified
- `shared/schema.ts` — `plannerWeeks.weekStartDate` (nullable text) + HT7 comment at definition
- `server/migrations/runner.ts` — additive migration; **the no-back-fill assertion in its own comment** (CONV1 `R5`)
- `server/storage.ts` — `createPlannerWeeks` stamps the anchor at creation (the existing single write funnel; no new writer)
- `server/verification/publication-register.ts` — the gate that fails if someone back-fills (CP10)
- `server/tests/test-time3-p7-planner-week-anchor.ts` — the phase's own suite (new)
- `package.json` — register the suite + wire into aggregate `npm test`
- Governing docs — status/citation corrections only (THA Household Time Architecture § 17 / § 14;
  Source of Truth Register Domain 14/16 + Appendix A; `docs/architecture/README.md` bootstrap)
- `docs/implementation/governance/CONV1_PHASE_P7_COMPLETION.md` — the report

## Scope refusals (recorded up front so they are decisions, not omissions)
- **No back-fill.** Not in SQL, not in code, not "just for demo households".
- **No consumer converges** — `READ-3`/`OWN-6`/`BEH-3`/`OWN-2`/`BEH-9` are **P8**.
- **No offered/declared anchor UI** — TIME1 § 6.2 names it an extension point, not designed here.
- `weekNumber` stays a slot label; 1–6 bound, unique constraint, eager creation, `weekName` all stand (`HT8` / `R9`).

## Checkpoints
- [x] Architecture bootstrap read (README, TIME3, TIME1 § 6.2, TIME2, CONV1 P6 report + programme)
- [x] `GOVTIME1` — confirmed **does not exist** (CONV1 § 0.3); TIME3 performed its function
- [x] Rollback protection created and reported
- [x] Schema + migration (`2026-07-17_conv1_p7_planner_week_anchor`; no-back-fill asserted in its own comment)
- [x] Write funnel stamps the anchor (`storage.createPlannerWeeks`, from `householdWeekOf(householdToday(...))`)
- [x] Gate written — 3 ratchets: `ht-anchor-is-the-planners`, `ht-anchor-is-never-back-filled`, `ht-anchor-is-stamped-from-the-owner`
- [x] Gate mutation-tested — **7/7 mutations caught**, files restored byte-exactly, domain healthy again
- [x] Phase suite written: `server/tests/test-time3-p7-planner-week-anchor.ts` — **51/51**, registered + wired into aggregate `npm test`
- [x] Affected suites (11 · 0 failures) + typecheck (32, identical set) + adoption (76·0·2, unchanged) + build (passes)
- [x] Live-verified: migration applied at boot on a verified-free port (:5417, ancestry-checked); 1152 pre-existing rows **0 back-filled**; 12 new rows all anchored; an existing household re-calling the funnel got six NULLs back; anchor reaches `GET /api/planner/weeks` over HTTP
- [x] Governing docs corrected in the same change that made them false (README bootstrap · THA Household Time Arch header/§17/§14 · Source of Truth Register D14 + Appendix A · the module's own header)
- [x] Report filed: `docs/implementation/governance/CONV1_PHASE_P7_COMPLETION.md`

**Last checkpoint:** COMPLETE. `SCH-2` closed. Gate `household-time` 🟢 **12/12** (9→12, all 3 ratchets mutation-tested, 7/7 mutations caught). Platform 72 checks (69→72), reds unchanged at 4. Typecheck 32 — identical set, diffed against the tag in a worktree. **Live: 1,152 pre-existing rows, 0 back-filled.**

## Next action
None — complete. **Recommends `CONV1 P8`** (the T5 convergence: `READ-3` → `OWN-6` → `BEH-3` →
`OWN-2` → `BEH-9`), and names the risk to carry into it: **`R3` — P7 built a FACT with no
consumers, exactly as P5 built a MODULE with no consumers.** `resolvePlannerWeek` is still called
by no production code. `HT11` decides P8's shape: all of it, or none of it.

⚠️ **The migration is applied** — reverting P7's code does not drop the column. To revert fully:
`ALTER TABLE planner_weeks DROP COLUMN week_start_date` (1,152 rows hold NULL; the 12 anchored rows
are this session's three verification households).

## Blockers
None.

## Notes
- **A concurrent session is live in this tree.** `NORTH1_Home_Implementation` (stage:
  Implementation) is editing `client/`, `.replit` and the EXP4 capture scripts. Its work was
  captured by this phase's preservation commit and is **not modified** by this session; no file
  P7 touches collides with it.
- The preservation commit also captured **CONV1 P6's completed deliverables**, which were still
  uncommitted when P7 began.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._

## Verification summary (measured, not inherited — CP11)
| Signal | Before (`8fcb3d72`) | After | Δ |
|---|---|---|---|
| `household-time` gate | 🟢 9/9 | 🟢 **12/12** | +3, all mutation-tested |
| platform publication | 69 checks · 43P/20W/6F · 🔴4 | **72 · 46P/20W/6F · 🔴4** | +3 passing; reds unchanged |
| `typecheck:ci` | 32 | **32 — identical set** | 0 added |
| `adoption:check` | 76·0·2 | **76·0·2** | 0 added |
| `verify:coherence` / `build` | PASS / passes | **PASS / passes** | — |
| `planner_weeks` (live) | 1,152 rows · no column | **1,164 · 1,152 NULL · 12 anchored** | **no row rewritten** |
| affected suites | — | **11 · 0 failures** (P7's own 51/51) | — |
