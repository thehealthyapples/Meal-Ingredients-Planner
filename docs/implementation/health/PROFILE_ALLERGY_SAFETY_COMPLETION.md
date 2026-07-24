# Profile Allergy Safety — Completion (NSR1 Phase 1)

**Programme:** North Star Reconstruction (`NSR1`), Phase 1 — Profile allergy safety
**Date:** 2026-07-22
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Trigger:** REBUILD1 consolidated audit map §3 — "a person's allergies have two edit surfaces … editing the Personal row may not update the eater row the safety filter reads → a silently dropped restriction."

---

## 1. Investigation — what is actually true

The audit raised the worst-case hypothesis (a restriction silently dropped from the record). A full
trace of the write and read paths shows that **worst case is not occurring** — and the accurate
finding is important, because overstating a data-loss bug would be as dishonest as missing one.

**Both allergy edit surfaces write the SAME canonical column.**

| Surface | Route | Storage call | Target |
|---|---|---|---|
| Personal "Allergies & Intolerances" row (`profile-page.tsx:1546`) | `PUT /api/profile` (`server/routes.ts:748–753`) | `storage.updatePersonDiet(userId, { hardRestrictions })` (`storage.ts:3299`) | `household_eaters.hard_restrictions` for the caller's row, matched by `(householdId, userId)` |
| Household-eater card, incl. the account holder (`profile-page.tsx:1213–1226`) | `PATCH /api/household/eaters/:id` (`server/routes.ts:9887`) | `storage.updateHouseholdEater(eaterId, { hardRestrictions })` | `household_eaters.hard_restrictions` for the same row, matched by `id` |

**The safety filter reads that exact column.** `server/lib/household-dietary-safety.ts:225/247`,
`server/lib/household-meal-matcher.ts:230`, and `server/lib/planner-compliance.ts:103/114` all read
`household_eaters.hard_restrictions`. So **editing allergies in either surface does update the data
used for household protection** — verified. This is by design: `CONV1 P4 (WRITE-2)` retired the
`users.diet*` shadow columns and made the eater row the single canonical owner
(`server/routes.ts:745–747`). There is **one canonical owner already**, and **no shadow write, no
sync bridge, no silent DB drop.**

## 2. The genuine defect that WAS present (and is now fixed)

The record was always correct; the **display** could silently lie. React Query cached the two
surfaces separately and neither edit invalidated the other:

- `PUT /api/profile` `onSuccess` did `setQueryData(["/api/profile"], …)` **only** — it did not
  invalidate `["/api/household/eaters"]`.
- The eater `PATCH` `onSuccess` invalidated `["/api/household/eaters"]` **only** — not `["/api/profile"]`.

So after editing a person's allergies in one surface, the **other surface on the same page kept
showing the old allergies** until an unrelated refetch. For allergy data, a stale, self-contradictory
display is a real safety-trust failure — a household cannot tell which value is authoritative, may
believe the save failed, or may "re-correct" a stale value back to an outdated allergy. This is the
"no silent failures" clause of the Phase 1 brief, in the presentation layer.

## 3. The fix applied (presentation-only, no decision required)

Cross-invalidate the two caches so they can never diverge (`client/src/pages/profile-page.tsx`):

- Profile-save `onSuccess` now also `invalidateQueries(["/api/household/eaters"])`.
- Eater-edit `onSuccess` now also `invalidateQueries(["/api/profile"])`.

After **any** allergy edit, both surfaces refetch and render the single canonical value. Pure React
Query cache invalidation — **no schema, route, storage, or business-logic change.** `server/`
untouched. Net +13 lines.

## 4. What still needs a Home Owner decision (STOP per the Phase 1 rule)

The Phase 1 brief asks for "one canonical owner … no duplicate write paths." One canonical **owner**
of the *data* exists (§1). Two items remain, and both are the owner's call — the first is a
UX/discoverability decision, the second is a backend change — so per the brief's STOP rule they are
**presented, not implemented**:

1. **One editable surface, or two consistent ones?** The account holder's allergies are editable in
   two places (Personal row *and* their own eater card). With §3, they can no longer *diverge*, but
   the redundancy remains. Options: (a) retire the Personal "Allergies & Intolerances" editor, making
   the eater card the single canonical editing surface (matches Principle 2 / CRAFT1 §6 *delete before
   adding*; costs some discoverability, since the Personal row is prominent); (b) keep both as now
   (consistent but redundant); (c) make the Personal row a read-only reflection that deep-links to the
   eater card. **Recommendation: (a) or (c).**
2. **Two write paths → one?** `updatePersonDiet` and `updateHouseholdEater` are two storage doors to
   the same canonical column. This is **redundancy, not a correctness risk** — neither is a shadow
   column and there is no sync bridge (Principle 7 is not violated). Consolidating to a single write
   path is a **backend change**; per the STOP rule it is not made here. **Recommendation: acceptable
   as-is; consolidate only if the owner wants strict single-path writes.**

## 5. Architecture Compliance

- **Core Principle 6 (trust is the product):** the safety-relevant fact (allergies) is now displayed
  consistently everywhere it appears; the fix removes a way the UI could contradict itself.
- **Principle 2 (one owner per fact):** unchanged and reaffirmed — `household_eaters.hard_restrictions`
  is the single canonical owner; both surfaces write it.
- **UIOWN1 / household.md:** the eater row remains the canonical owner; no new owner, store, or field.
- **Scope:** presentation-only (React Query cache); no backend, per the Phase 1 STOP discipline.

## 6. Definition of Done

- [x] Verified editing allergies always updates the protection data (`household_eaters.hard_restrictions`).
- [x] Confirmed no silent **DB** drop (one canonical owner; shadow columns retired by CONV1 P4).
- [x] Fixed the silent **display** failure (stale divergent allergy surfaces) — cross-cache invalidation.
- [x] 0 client type errors introduced; `server/` untouched.
- [x] Remaining "single editor / single write-path" items presented as owner decisions (§4), not implemented.

## 7. Data Impact

None. No schema, migration, API, storage, or business-logic change. The persisted allergy data and its
canonical owner are unchanged; only client cache-invalidation was added.

## 8. Manual Verification

- Static: `tsc --noEmit` — 0 errors in `profile-page.tsx`; `git diff` — +13 lines, one file, client-only.
- Trace: write paths (§1) and safety read paths (§1) confirmed by direct file:line reading.
- **Live check recommended:** on `/profile`, edit an allergy in the Personal row and confirm the same
  person's eater card reflects it immediately (and vice versa) — the behaviour this fix guarantees.

## 9. Rollback Plan

`git reset --hard rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`). The change is a
13-line, single-file cache-invalidation addition; reverting `profile-page.tsx` alone is safe.

## 10. Scope Lock

Presentation-only. No architecture, schema, route, permission, storage, or AI change. `server/`
byte-untouched. The two owner-decision items (§4) are surfaced, not acted on.
