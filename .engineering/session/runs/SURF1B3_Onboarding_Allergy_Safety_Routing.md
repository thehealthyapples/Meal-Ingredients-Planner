# SURF1B3 — Onboarding Allergy Safety Routing

**Status:** Complete
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1B3-onboarding-allergy-safety-routing-20260714` → `194f7af2`
**Predecessor:** SURF1B2 (`docs/implementation/platform/SURF1B2_DIETARY_RESTRICTION_KNOWLEDGE_COMPLETION.md`) — limitation #2.
**Implementation document:** `docs/implementation/platform/SURF1B3_ONBOARDING_ALLERGY_SAFETY_ROUTING.md`

## Mission
Onboarding stored allergies and intolerances as soft `excludedIngredients` rather than
canonical hard dietary restrictions. Route them to the hard-restriction owner
(`users.diet_restrictions`), keep genuine dislikes soft, and audit live data.

## Root cause (verified)
Onboarding and the profile collected the same fact into **two different owners**, using
**two different vocabularies**:

| Surface | Column | Vocabulary |
|---|---|---|
| Onboarding "Allergies or intolerances" | `user_preferences.excluded_ingredients` (**SOFT**) | `nuts`, `dairy`, `gluten` … |
| Profile "Allergies & intolerances" | `users.diet_restrictions` (**HARD**) | `Nuts`, `Dairy-Free`, `Gluten-Free` … |

Only the second is read by `isMealSafeForHousehold()`, the household safety resolver, and the
INT17 AI context. The read path was wrong in the same direction: the onboarding form hydrated
its allergy chips *from* `excludedIngredients`.

**The trap:** routing the chip value verbatim would have stored a restriction the profile page
renders no chip for and `PUT /api/profile` **400s on** (a 7-literal enum). Already live for 4
users (181–184: `meat`, `fish`, `honey`) — they cannot save their profile today. Retiring that
enum was the precondition for the fix, not scope creep.

## Delivered
- `shared/onboarding-restrictions.ts` — **new.** The routing contract + single owner of the
  declarable restriction list. No food keyword of its own (enforced by test). Vocabulary
  mapping **derived from the canonical library**, never hand-written.
- `client/src/pages/onboarding-page.tsx` — submits `dietRestrictions` (hard) + `excludedIngredients`
  (soft) as separate fields; reads chips back from the hard owner; tells the household plainly
  when THA cannot enforce a typed value.
- `client/src/lib/diets.ts` — `ALLERGY_OPTIONS` + `ALLERGY_INTOLERANCE_OPTIONS` derived from the owner.
- `server/routes.ts` — `POST /api/user/complete-onboarding` routes soft-filed allergies to the owner
  **at the door** (covers cached pre-SURF1B3 browsers); `PUT /api/profile` retires
  `ALLOWED_DIET_RESTRICTIONS` for `hardRestrictionsSchema`.
- `scripts/repair-onboarding-allergy-routing.ts` — **new.** Live audit + idempotent, reversible,
  lossless repair. Shares `promoteSoftAllergies()` with the live door.
- `server/tests/test-surf1b3-onboarding-allergy-safety-routing.ts` — **64 passed, 0 failed.** Registered in `npm test`.

## Live-data audit result
**Repair set is EMPTY.** Every enforceable value in a live soft list is already held by its hard
owner (users 181/183, seeded into both columns). The only soft-only value is user 189's
`mushrooms` — not enforceable, a genuine preference, **untouched**. The defect is real and
latent; it would have corrupted the next household to use the allergy screen. Asserted by test
(layer 11), not merely reported. **No database row was written; `--apply` was never run.**

## Verification
- SURF1B3 suite: 64/64. SURF1B: 54/54. SURF1B2: 167/167. SURF1A: 31/31.
- planner-compliance 25/25 · smart-suggest-restrictions 30/30 · context-composition 166/166 ·
  household-binding 51/51 · profile-binding 50/50 · plan1 58/58 · household-eater 13/13.
- `npm run build` clean · `verify:publication` 24/12 (identical, no check moved) ·
  `typecheck` 304 (baseline, 0 new).
- Driven over real HTTP against the dev server: new-client payload, legacy-client payload,
  the profile lockout trap (400 → 200), and the unenforceable rejection (400). Test users deleted.

## Next action
None — complete. Recommends SURF1B2 limitation #1 next: the `Vegan`/`Vegetarian` **pattern** path
(`dietRules.MEAT_KEYWORDS`) still has holes the restriction path no longer has — a vegan household
can be recommended prosciutto. Pinned by SURF1B2's superset test.
