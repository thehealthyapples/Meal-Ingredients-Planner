# P0 — Food Intelligence Recovery

**Session ID:** `P0_Food_Intelligence_Recovery`
**Opened:** 2026-07-17
**Branch:** `int1-intelligence-platform`
**Type:** Implementation — defect recovery only. No features, no schemas, no new ownership.
**Risk:** 🟠 AMBER (deletes server modules; edits a governing architecture document and a security test)

---

## Rollback

| Item | Value |
|---|---|
| **Rollback identifier** | `rollback/P0-food-intelligence-recovery-20260717` → `10573dd20baa9497975c4ed05837b75162305410` |
| Working tree at start | **Intentionally dirty — NOT MINE.** Pre-existing uncommitted work from sibling sessions (NORTH3, NORTH4, CONV1 P10). The tag protects committed state only. **Not touched, not committed, not reverted.** |
| Verification method | Every "pre-existing" claim proven on a **clean `git worktree` at the tag** — never by mutating the dirty tree |

---

## Stage

**Complete — awaiting user review.** Report at `docs/implementation/intelligence/P0_FOOD_INTELLIGENCE_RECOVERY.md`.

---

## The decision that shaped the session

**The mission's constraints forbade the mission's instruction.** "Repair" meant *build the feature* for both paths:

- **Notice Gateway** — not 3 missing imports but a **closed 8-category taxonomy** scoped for 4 categories that don't exist. Repair = NTC-P2 (+4 categories, +3 producers, +3 fact kinds, +4 phrasing cases), refused by Notice Engine §9's stop rule.
- **HHP2** — `household-health` registered nowhere. Repair = **add a capability + enrol a producer**, both explicitly forbidden.

**STOPPED and escalated before touching code** (Architecture Bootstrap requirement). User approved **retire both**. Nothing was protecting either: gateway had zero runtime importers; the binding was never called; the consumer panel has zero importers. **No user-facing change.**

---

## Checkpoints

- [x] Architecture bootstrap read (`docs/architecture/README.md`)
- [x] `git status` confirmed; rollback tag created and resolved
- [x] Run file opened
- [x] **Every FI18 P0 finding independently re-verified** (none taken on trust)
- [x] Mission/mandate conflict escalated → approved → retired
- [x] P0.1 Notice Gateway retired (`notice-engine.ts` byte-untouched, still passing)
- [x] P0.2 HHP2 activation path retired; HHP2/HHP3 completion records corrected
- [x] P0.3 **51 tests registered** (chain 90 → 141)
- [x] P0.4 publication register corrected (vacuous grep removed, gap declared)
- [x] P0.5 FI §13 corrected (status only, **no rule changed**)
- [x] Two false claims in shipped source corrected
- [x] **`npm test`'s position-9 blocker fixed** — 132 gates were unreachable
- [x] **`npm test` → EXIT 0 · 141/141 executed · 0 failed** (was: 9 executed, then dead)
- [x] Gates run: `typecheck:ci` (32 → 27, none new) · `verify:publication` (Companion/Notice 🟢) · `adoption:check` (2 pre-existing) · `repo-structure-verify` (2 pre-existing, sibling loose files)
- [x] Report written

---

## What was found that FI18 did not record

| Finding | FI18 said | Measured |
|---|---|---|
| Unregistered tests | 3 | **61 of 151 (40%)** — including **dietary restriction & allergy SAFETY gates** |
| `npm test` | (not examined) | 🔴 **Already RED, dying at position 9 of 141 → 132 gates never executed.** Before this session: 81 of 90 never ran. **The effective suite was 8 tests** |
| Cause of the above | — | RM3 correctly retired a route on 2026-07-15 → broke a **stale text grep** in TRUST1-S3A → killed the `&&` chain → silently disabled everything downstream **for two days** |
| Publication check | greps a module that can't load | **Also vacuous** — greps for `cookbook-opportunity`, absent from **both** files. Passed by not looking |
| Gateway breakage | 3 missing imports | **Also 4 categories outside the closed taxonomy** — 3 typecheck regressions |
| Same defect class elsewhere | — | **CBK2 · PANTRY1 · PLAN2 · SHOP1** all half-landed identically (`SyntaxError` on absent exports) |

---

## Deliberate deviations (declared, not silent)

1. **`HouseholdNutritionPanel.tsx` NOT deleted** though the approved option named it — it is **HNP1's** panel, not part of the HHP2 activation path, and the **only consumer of `/api/household-nutrition`**; deleting it orphans a live route. Its **verified defect (the false claim) is corrected**; its orphan status is reported as a blocker.
2. **The 3 named P0.3 tests deleted, not registered** — their subjects are retired. The mission's *intent* was served far more broadly (51 registrations).
3. **A security test was edited** (`test-trust1-s3a-meal-ownership-idor.ts`) — required to deliver P0.3 ("tests **execute**"). **Provably security-neutral:** both live routes keep `assertAdmin`; the removed clause guarded an RM3-retired route. **A new assertion was added** so the retired route cannot silently return unguarded.

---

## Next action

**None — session complete.** User review of `docs/implementation/intelligence/P0_FOOD_INTELLIGENCE_RECOVERY.md`.

Standing blockers recorded in the report (each needs its own gated workstream, none is a Food Intelligence P0):

1. **7 orphaned tests still unregisterable** — 4 `SyntaxError` (CBK2/PANTRY1/PLAN2/SHOP1), 3 with real assertion failures (**live regressions invisible because the tests never ran**).
2. **The server has no adoption register.** HHP2 is `PX1`/UIA §17's authored-but-unadopted failure repeated where no instrument exists to catch it. **Nothing prevents the next HHP2.**
3. **Food Intelligence is still mute** — no resolver matcher; Home has no ambient mount; 600/610 foods have no citable evidence (**editorial, not engineering**).
