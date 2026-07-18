# HOUSE_ACT1 — Household Experience Activation

**Session ID:** `HOUSE_ACT1_Household_Experience_Activation`
**Objective:** Activate The Healthy Apples as one coherent household experience — audit every room, expose existing intelligence, restore production readiness.
**Rollback ID:** `rollback/HOUSE_ACT1-household-experience-activation-20260718` → `057102ec`
**Stage:** Complete — awaiting owner review
**Started:** 2026-07-18

---

## Rollback

Working tree held **249 uncommitted paths** from prior programmes. A tag on `HEAD` alone would have protected none of it, so a **checkpoint commit** (`057102ec`) was created first on the owner's explicit direction, and the tag placed on it. The 32 untracked `docs/ui-audit/` screenshot dirs (~490 MB) were deliberately excluded — untracked files are unaffected by a revert, so committing them buys no protection while doubling repo size.

⚠️ **Reverting to this tag restores a tree that does not build** (see below).

## Checkpoints

- [x] Architecture Bootstrap read (`docs/architecture/README.md` + 5 compliance blocks)
- [x] Rollback protection created and reported
- [x] Room audit — 13 rooms mapped to routes/pages with `file:line`
- [x] Intelligence surfacing audit — 24 capabilities vs client consumers
- [x] Cross-room consistency audit — 44 adoption-register concerns
- [x] Reconnaissance claims **verified** — 3 of 4 disproved and retracted
- [x] H1 build repair · H2 dead link · H3 register re-measurement
- [x] Report filed at `docs/implementation/house/HOUSE_ACT1_HOUSEHOLD_EXPERIENCE_ACTIVATION.md`

## Headline finding

**The house did not compile.** Two unterminated JSX comments (`*/` with no `}`) in `nav-bar.tsx:391` and `workspace-header.tsx:121` — the two components owning every door — failed `vite build` at `nav-bar.tsx:392`. The parse failure also **masked 92 type errors** (`tsc` reported 2; true count 94, all pre-existing in `server/tests/*.ts`).

Second finding: **3 of 4 reconnaissance-reported defects were false** — prior programmes (PROD1, PX1-W4, AFI4/CBK2) had already fixed them. The gap in THA is not polish; it is that whole rooms do not exist and built intelligence has no door.

## Validation

| Command | Outcome |
|---|---|
| `npx vite build` at tag | 🔴 FAILED — `nav-bar.tsx:392` |
| `npx vite build` after H1 | 🟢 PASSED |
| `npx tsc --noEmit` | 94 errors, all pre-existing in `server/tests/`, **0 in `client/`** |
| `npm run adoption:check` | 🟢 81 passed · 0 notices · 0 failed |
| `repo-structure-verify.sh` | 2 FAILs — **pre-existing**, identical at the tag; report correctly filed in `house/` |

## Refused, with evidence

**Partners · Support · Community** were asked for and are reported **absent rather than built**. Partners was withdrawn deliberately by PROD2 — all 12 entries in `data/partners.ts` were invented with `example.com` URLs, so THA was recommending practitioners that do not exist. Re-opening that door means fabricating partners; Core Principle 6 forbids it.

## Next action

**Owner to review** `docs/implementation/house/HOUSE_ACT1_HOUSEHOLD_EXPERIENCE_ACTIVATION.md` and direct the follow-on programme. Recommended order:

1. **`TEST1`** — fix the 94 `server/tests/*.ts` type errors (invisible behind the parse failure; nothing is trustworthy until green)
2. **`HOUSE_ACT2 — The Intelligence Doors`** — the 7 discovery capabilities + `product-knowledge` are fully built, bound and executable with **zero UI**; household learning is surfaced in 1 room of 13; nutrition enrichment is rendered by **no room at all**

Manual verification steps are specified in the report and **have not been executed** — no user acceptance evidence was captured.
