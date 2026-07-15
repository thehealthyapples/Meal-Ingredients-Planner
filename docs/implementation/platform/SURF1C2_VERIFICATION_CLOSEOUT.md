# SURF1C2 — Verification Closeout

**Status:** Closed — verification complete, suite fully green.
**Date:** 2026-07-15
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1C2-verification-closeout-20260715` → `3176c62d`
**Parent workstream:** [`SURF1C2_CANONICAL_RESTRICTION_MATCHER_BOUNDARY_SAFETY.md`](./SURF1C2_CANONICAL_RESTRICTION_MATCHER_BOUNDARY_SAFETY.md) — *Tests → Regression* (the three pre-existing `restriction-resolver` failures) and *Safety proof*.

---

## PURPOSE

SURF1C2 shipped its matcher fix complete, but left two loose ends in the verification record:

1. The headline safety statement was phrased as *"No meal that was refused becomes allowed"* — this closeout restates it in the mission's canonical form, **"No unsafe meal became allowed."**
2. The `restriction-resolver` regression suite finished **332 passed, 3 failed**, with the three failures declared *pre-existing and stale* but never actually investigated or retired.

This closeout discharges both. It changes **no runtime behaviour** — only three stale test assertions and the SURF1C2 report were touched. Each failure was individually diagnosed, proven to be an obsolete assertion rather than a defect, and retired.

---

## THE SAFETY STATEMENT

The SURF1C2 report now states, verbatim:

> **No unsafe meal became allowed.** The new match set is a strict subset of the old one, so the change can only stop *false* refusals, never permit a real ingredient — no meal that was refused becomes allowed.

This is the same proven fact SURF1C2 already carried (0 matches added across 3,252 ingredient lines × 13 restrictions; the new match set is a strict subset of the old), stated in the mission's canonical wording. No new claim is introduced — the corpus proof that backs it is unchanged.

---

## THE THREE STALE ASSERTIONS

All three failures share **one** root cause: **the canonical restriction library grew from Phase 3 to Phase 5, and three assertions in `test-restriction-resolver.ts` still pinned the Phase-3 shape.** None reflected a runtime defect — the resolver behaves correctly in every case. Verified live before touching the tests:

```
version: 5.0.0
findRestrictionById('fish'): fish
getRestrictionMatches(['gluten','fish','unknown-allergen']) → len 2, ids ['gluten','fish']
getRestrictionMatches(['fish']) → ['fish']
```

### 1. Library version pin

```ts
// before
assert(RESTRICTION_LIBRARY_VERSION.startsWith('3.'), 'Library version is Phase 3');
```

**Root cause.** `RESTRICTION_LIBRARY_VERSION` is now `5.0.0` (`shared/restrictions/restriction-library.ts:63`). The assertion hard-pinned the Phase-3 major version and was never advanced when the library moved to Phase 4 (fish) and Phase 5 (meat, honey). A stale integrity pin, not a behaviour bug.

**Change.** Advanced the pin to the current phase:

```ts
// after
assert(RESTRICTION_LIBRARY_VERSION.startsWith('5.'), 'Library version is Phase 5');
```

### 2. `findRestrictionById('fish')` expected `undefined`

```ts
// before
assert(findRestrictionById('fish') === undefined, 'findRestrictionById("fish") → undefined (Phase 4)');
```

**Root cause.** When this test was written, `fish` was not yet a restriction, so the assertion pinned its *absence* (the label literally reads "Phase 4", the phase that would add it). `fish` is now a real Phase-5 restriction (`restriction-library.ts:767`) and `findRestrictionById('fish')` correctly returns it. The assertion asserted the opposite of correct current behaviour.

**Change.** Flipped to assert the restriction now exists:

```ts
// after
assert(findRestrictionById('fish')?.id === 'fish', 'findRestrictionById("fish") → fish (Phase 5 restriction)');
```

### 3. "Unknown restrictions silently skipped" expected length 1, got 2

```ts
// before
const withUnknown = getRestrictionMatches(['gluten', 'fish', 'unknown-allergen']);
assertEqual(withUnknown.length, 1, 'unknown restrictions silently skipped');
```

**Root cause.** The **same** root cause as #2. This test's intent is to prove that *unknown* restriction ids are silently dropped, keeping only the known ones. It used `'fish'` as one of its two "unknown" placeholders — correct when fish did not exist. Now that fish is a real restriction, `getRestrictionMatches` correctly resolves it, so the result is length 2 (`gluten` + `fish`), not 1. The skip behaviour under test is **still correct** — the placeholder simply stopped being unknown.

**Change.** Replaced the now-real `'fish'` placeholder with a genuinely-absent token so the test still exercises the skip path:

```ts
// after
const withUnknown = getRestrictionMatches(['gluten', 'not-a-real-restriction', 'unknown-allergen']);
assertEqual(withUnknown.length, 1, 'unknown restrictions silently skipped');
assert(withUnknown[0]?.restriction.id === 'gluten', 'only gluten returned');
```

### Documentation tidy

Two stale header comments in the same file (`Tests for the Phase 3 canonical restriction library…`, `Exact alias matching for all Phase 3 restrictions`) were updated to describe the current Phase-5 library. No assertion behaviour change.

---

## DECISION: OBSOLETE, NOT DEFECT

Each failure was checked against the mission's stop-condition — *"if they expose a real defect, stop and report."* None does:

| Assertion | Expected (stale) | Actual (correct) | Verdict |
|---|---|---|---|
| Library version `3.` | Phase 3 | `5.0.0` (Phase 5) | Obsolete — library evolved |
| `findRestrictionById('fish')` → `undefined` | fish absent | fish is a real restriction | Obsolete — fish added in Phase 5 |
| `['gluten','fish','unknown']` → len 1 | fish unknown | fish resolves, len 2 | Obsolete — same cause as above |

In every case the **resolver is right and the test was wrong.** No runtime code was changed. The restriction library, the resolver, and the SURF1C2 matcher fix are all untouched by this closeout.

---

## FINAL TEST RESULTS

```
npm run test:restriction-resolver
  → RESTRICTION RESOLVER TESTS: 335 passed, 0 failed   ✅  (was 332 / 3)

npm run test:surf1c2-canonical-restriction-matcher-boundary-safety
  → SURF1C2: 65 passed, 0 failed                        ✅  (unchanged — no regression)

npx tsc --noEmit
  → 0 errors in test-restriction-resolver.ts            ✅
```

The three retired assertions account for the +3 pass delta (332 → 335); no assertion was deleted — each was corrected to the current library shape, so coverage is preserved, not reduced.

---

## FILES CHANGED

| File | Change |
|---|---|
| `server/tests/test-restriction-resolver.ts` | Three stale Phase-3 assertions retired to the current Phase-5 library shape; two header comments updated. **No runtime code.** |
| `docs/implementation/platform/SURF1C2_CANONICAL_RESTRICTION_MATCHER_BOUNDARY_SAFETY.md` | Safety statement restated as "No unsafe meal became allowed"; regression row updated to 335 / 0; footnote ¹ now records the failures as retired and points here. |
| `docs/implementation/platform/SURF1C2_VERIFICATION_CLOSEOUT.md` | **New** — this closeout. |

**Runtime behaviour changed:** none. **Restriction library changed:** none. **Resolver changed:** none.

---

## SURF1C2 — FORMALLY CLOSED

- ✅ Report states **"No unsafe meal became allowed."**
- ✅ All three `restriction-resolver` failures investigated → each proven a stale Phase-3 assertion, not a defect.
- ✅ Stale assertions retired (corrected to current library shape); no coverage lost.
- ✅ Canonical restriction resolver suite **fully green — 335 passed, 0 failed.**
- ✅ SURF1C2 matcher-boundary suite still green (65 / 0); no regression introduced.
- ✅ No runtime behaviour changed — the mission's stop-condition (real defect) was not triggered.

**SURF1C2 is formally closed.**

---

## ROLLBACK

```
git reset --hard rollback/SURF1C2-verification-closeout-20260715   # → 3176c62d
```

This closeout is test-and-documentation only; rolling it back restores the three stale
failures (332 / 3) and the prior report wording, and touches no runtime code. The SURF1C2 fix
itself remains anchored at its own tag:

```
rollback/SURF1C2-canonical-restriction-matcher-boundary-safety-20260714   → 9e0b831d
```

---

*Verification closeout. 2026-07-15. A stale test asserts yesterday's shape; retire it, don't obey it.*
