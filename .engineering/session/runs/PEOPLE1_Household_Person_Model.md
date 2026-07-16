# Run — PEOPLE1 — Household Person Model Investigation

**Status:** COMPLETE
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/PEOPLE1-household-person-model-20260716` → `7d1dd2ce`

---

## Mission

Investigate whether THA has one canonical representation of a person within a
household, and confirm whether `household_eaters` should remain its owner.
**Investigation only — nothing implemented.**

---

## Trigger points

| # | Trigger | Done |
|---|---|---|
| 1 | Rollback protection created **before any file touched** | ✅ tag above, at HEAD `7d1dd2ce` |
| 2 | Architecture Bootstrap read (`docs/architecture/README.md`, STEP 2) | ✅ |
| 3 | LIFE1 + LIFE2 read | ✅ |
| 4 | Git status confirmed (dirty — concurrent sessions; **no stash taken**) | ✅ |
| 5 | Audit performed | ✅ 5 parallel read-only audits + direct reads |
| 6 | Investigation filed | ✅ `docs/investigations/platform/PEOPLE1_HOUSEHOLD_PERSON_MODEL_INVESTIGATION.md` |
| 7 | Indexes updated | ⛔ **Not required** — investigations are not indexed in `docs/architecture/README.md`; that index is governing architecture only |

---

## Working tree note

Intentionally dirty. Concurrent sessions (TIME3, HOME3, NORTH1/2, EXPCOMP1/2,
ORCH1, LIFE1/2) hold uncommitted work. **No stash taken** — a stash would destroy
their trees. This workstream created **one new file** and modified **nothing**.

---

## Outcome

`household_eaters` **is** the canonical person-within-a-household record and **is
sufficient**. No new Person entity is needed or recommended. No STOP triggered on
the canonical-model question.

**One conflict found between two governing documents** (reported, not resolved):
`capabilities/household.md` § Allowed scopes ratifies read-time enrichment from
`users.diet*`, which `ARCHITECTURE_PRINCIPLES.md` names a contested shadow to be
retired. Resolves upward to the Principles; the card is the defect.

**Next action:** none for this workstream — complete. Recommended next workstream
is `PEOPLE2` (the departed-member live profile feed — a live data-protection
defect, blocked by nothing). See the investigation's § 10.
