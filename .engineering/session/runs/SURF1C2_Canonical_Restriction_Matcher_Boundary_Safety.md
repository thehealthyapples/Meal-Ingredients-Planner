# SURF1C2 — Canonical Restriction Matcher Boundary Safety

**Session ID:** `SURF1C2_Canonical_Restriction_Matcher_Boundary_Safety`
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `rollback/SURF1C2-canonical-restriction-matcher-boundary-safety-20260714` → `9e0b831d`
**Stage:** Complete
**Report:** [`docs/implementation/platform/SURF1C2_CANONICAL_RESTRICTION_MATCHER_BOUNDARY_SAFETY.md`](../../../docs/implementation/platform/SURF1C2_CANONICAL_RESTRICTION_MATCHER_BOUNDARY_SAFETY.md)

## Outcome

Fixed the canonical resolver defect where the meat hidden-term `ragu` matched inside
`aspa·ragu·s`, so the library called asparagus meat and refused every asparagus meal to
every vegetarian, vegan and meat-restricted household (fail-CLOSED; SURF1C1's top gap).

**Fix:** one general rule in the single matcher — a derived/hidden term matches only when it
begins at a **word boundary**. What follows is unrestricted, so plurals/compounds
(`sardines`, `cheesecake`) keep matching while infixes (`aspa·ragu·s`) do not. No asparagus
exception, no second matcher, no keyword list, **no edit to the restriction library**.

**Safety proof:** across the whole corpus (3,252 ingredient lines × 13 restrictions) the new
match set is a strict subset of the old — **0 matches added, 8 false matches removed**, every
one a fail-CLOSED correction:
- `asparagus` → meat (via `ragu`) — a plant
- `cornflour` → gluten (via `flour`) — UK cornflour is cornstarch
- `peanut butter` → tree_nut (via `nut butter`) — peanut is a legume

Protection kept in every case (peanut butter still matches `peanut`; real flours and tree-nut
butters still match). Library self-test: every term still matches itself and its plural.

**Republished:** `npm run seed:cookbook` — +42 labels (17 vegan, 25 vegetarian), 0 removed.
Of the 52 asparagus recipes, 25 gained a label; the 27 still unlabelled contain chicken.

## Tests

SURF1C2 suite: 65/0. SURF1C1 §5b flipped to a fix-holds guard: 81/0. Full SURF1B–SURF1C1
regression + resolver/safety/ingredient suites green. Publication gate unchanged (60 checks,
`cb-diet-labels-derived` still passes). Typecheck clean.

## Next action

None — complete. Possible follow-up (report gap #1): a linter that flags short (<5 char)
derived/hidden library terms, making the authoring rule mechanical rather than disciplinary.
