# Household Compatibility Phase 6 — Compatibility-Aware Ranking Plan

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `pre-phase6-compatibility-ranking`
**Rollback commit:** `43fbdda31863fba2ffdc33c3dbb96d36544e22d1`
**Status:** PLANNING ONLY — No code changes, no implementation, no data changes.

---

## 1. Rollback Identifier

```
Tag:    pre-phase6-compatibility-ranking
Commit: 43fbdda31863fba2ffdc33c3dbb96d36544e22d1

To restore:
  git checkout pre-phase6-compatibility-ranking
```

No data cleanup required. No migration rollback required.
This plan describes additive scoring changes only. Reverting means removing one
bonus term from one `.map()` call and deleting one constant.

---

## 2. Files Investigated

| File | Purpose |
|------|---------|
| `server/lib/meal-scoring-service.ts` | `scoreMeal()`, `ScoredCandidate`, score weights |
| `server/lib/smart-suggest-service.ts` | `generateSmartSuggestion()`, slot-filling loop, Tier logic |
| `server/lib/household-meal-matcher.ts` | `computeIngredientCompatibility()`, `computeFitScore()`, `fitScore` weights |
| `docs/investigations/planner/HOUSEHOLD_COMPATIBILITY_PHASE3_PLANNER_INTEGRATION.md` | Phase 3 — how `householdFit` was attached |
| `docs/investigations/planner/HOUSEHOLD_COMPATIBILITY_PHASE4_HOUSEHOLD_FIT_DISPLAY.md` | Phase 4 — display confirmed, ranking confirmed unchanged |
| `docs/investigations/planner/HOUSEHOLD_COMPATIBILITY_PHASE5_RESTRICTION_RESOLVER_INTEGRATION.md` | Phase 5 — resolver upgrade, ranking confirmed unchanged |
| `docs/investigations/planner/HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN.md` | Product goals, THA philosophy |
| `docs/investigations/planner/HOUSEHOLD_COMPATIBILITY_V1_MASTER_PLAN_REVISION.md` | Architecture revision — profile-derived adults |

---

## 3. Investigation Q1 — Current Ranking Flow

### 3.1 Ranking Flow Diagram

```
generateSmartSuggestion()
│
├─ POOL CONSTRUCTION (once per generation)
│   ├── User meals loop
│   │     ├─ Hard gates: product/premium/alcohol/drink filters
│   │     ├─ Household hard restriction filter (isHardExcluded)
│   │     ├─ Profile dietary hard filter (candidateDietExcluded)
│   │     └─ householdFit attached via scoreMealCompatibility() ← PHASE 3
│   │           candidate.householdFit.fitScore  (0–100)
│   │           candidate.householdFit.compatibleCount / totalCount
│   │           [fitScore does NOT affect candidate.score — ranking gap]
│   │
│   └── External meals loop
│         ├─ Same hard gates
│         └─ No householdFit (external candidates receive no scoring)
│
└─ SLOT-FILLING LOOP (per day × per slot)
    │
    ├─ Tier 1: unused candidates matching slot category
    │
    ├─ Tier 2: getSafeFallbackCandidates() — unused category-adjacent
    │
    ├─ Tier 3: getRepeatCandidates() — allow reuse, slot boundary maintained
    │
    └─ Tier 4: selectShellRecoveryCandidate()
               ← household matcher, fitScore-sorted
               ← compatibility gate: scoreBreakdown.compatibility < 1 rejected
               ← score: 0 assigned (no scoreMeal() signal)
    │
    ├─ isVegDay / fishCap / redMeatCap / UPF / budget filters applied
    │
    ├─ SCORING  ← WHERE PHASE 6 INTEGRATES
    │   scored = slotCandidates.map(c => {
    │     const { score, breakdown } = scoreMeal(c, prefs, context)
    │     return { ...c, score, scoreBreakdown: breakdown }
    │   })
    │   [c.householdFit.fitScore is present but NEVER READ here]
    │
    ├─ SORT: scored.sort((a, b) => b.score - a.score)
    │
    ├─ TOP-N: topN = scored.slice(0, 5)
    │
    └─ SELECTION: chosen = topN[random(0, min(3, topN.length))]
                  ← random from top 3 of top 5
```

### 3.2 scoreMeal() — Exact Weights

File: `server/lib/meal-scoring-service.ts` lines 77–86

```typescript
const SCORE_WEIGHTS = {
  dietMatch:        22,   // hard diet compliance; drops to -10 or -20 on violation
  goalAlignment:    13,   // health goals (build-muscle, lose-weight, avoid-upf)
  budgetAlignment:  13,   // estimated cost vs budget level
  upfScore:         13,   // UPF sensitivity check
  varietyScore:     13,   // protein variety (penalised if protein used ≥2 or ≥3 times)
  overlapScore:      8,   // ingredient reuse bonus
  cuisineBonus:      5,   // preferred cuisine bonus
  simplicityBonus:  13,   // ingredient count / common meal name bonus
};
// Max possible score ≈ 100 (capped by Math.max(0, Math.min(100, total)))
```

All 8 dimensions are personal to the requesting user's preferences. None uses
`householdFit` data. Household compatibility has zero weight today.

### 3.3 fitScore — Exact Weights

File: `server/lib/household-meal-matcher.ts` lines 104–112

```typescript
const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  compatibility:        0.25,  // diet-type conflicts across all members
  sharedBase:           0.20,  // % base ingredients safe for all members
  swapSimplicity:       0.15,  // fraction with rule-based swaps vs removals
  timeFit:              0.10,  // total cook time vs household tolerance
  costFit:              0.10,  // cost band vs household budget
  healthAlignment:      0.10,  // UPF sensitivity alignment
  preferenceConfidence: 0.10,  // % members with non-empty dietary data
};
// fitScore = sum(component × weight) × 100 → range 0–100
```

`fitScore` is a rich multi-factor household quality score. It captures not just
who can eat the meal unchanged but also how easy the adaptations are, whether
the meal fits household time and cost constraints, and how well dietary data is
populated.

---

## 4. Investigation Q2 — Where Compatibility Could Be Introduced

### Option A — Pre-sort bonus (recommended integration point)

Add `compatibilityBonus` to each candidate's `score` after `scoreMeal()` returns
and before `.sort()`. Because `householdFit` is already populated on the
candidate, this is a single read + arithmetic per candidate.

```
adjustedScore = score + (fitScore / 100) × MAX_BONUS
```

**Advantages:**
- Touches one location in one function (lines 765–787 of `smart-suggest-service.ts`)
- Preserves the random-from-top-3 variety mechanism
- Does not change any existing scoring dimensions
- Cannot apply to external candidates (they have no `householdFit` — guard on undefined)
- Cannot apply to Tier-4 shell candidates (also no `householdFit` on returned shell)
- Zero risk of over-applying — null guard makes it inert for all non-household users

**Disadvantages:**
- Score can exceed 100 if not capped — needs `Math.min(100, adjustedScore)` or
  sort on raw pre-cap value and cap only for storage

---

### Option B — Multiplier on raw score

```
adjustedScore = score × (1 + (fitScore / 100) × MULTIPLIER_WEIGHT)
```

Example: MULTIPLIER_WEIGHT=0.10
- score=92, fitScore=90: 92 × (1 + 0.09) = 100.3 → ~100
- score=95, fitScore=40: 95 × (1 + 0.04) = 98.8

**Disadvantages:**
- A higher base score amplifies the compatibility bonus non-linearly
- A meal with score=100 gets more bonus than score=60 even if fitScore is identical
- Harder to reason about and communicate to users
- Not recommended

---

### Option C — Tie-breaker only

Sort by `score` first; for candidates within a configurable margin (e.g. ±3),
re-rank by `fitScore`.

**Disadvantages:**
- The `±margin` parameter is arbitrary and fragile
- "Tie" is rare in practice — scoreMeal() returns distinct integer values
- More complex implementation (two-pass sort or custom comparator)
- The randomisation already provides tie-breaking diversity
- Not recommended

---

### Option D — Post-filter ranking adjustment

After top-N selection, if the chosen candidate has low `fitScore`, resample from
top-N preferring higher `fitScore`.

**Disadvantages:**
- Affects selection probability in non-obvious ways
- Undermines the deliberate randomisation intent
- Harder to test and reason about
- Not recommended

---

### Conclusion

**Option A (pre-sort additive bonus)** is the correct integration point.
Implementation is minimal, transparent, and consistent with all other score
components in the planner.

---

## 5. Investigation Q3 — Weighting Options

All three options use the same formula at the same integration point. They differ
only in `MAX_BONUS`.

### Formula (all options)

```
compatibilityBonus = (candidate.householdFit?.fitScore ?? 0) / 100 × MAX_BONUS
adjustedScore      = score + compatibilityBonus
finalScore         = Math.min(100, adjustedScore)   [for storage on candidate]
sortKey            = adjustedScore                  [sort on pre-cap value]
```

`fitScore` is 0–100 (from `computeFitScore()` in `household-meal-matcher.ts`).
When `householdFit` is absent (solo user, external candidate, no household), the
bonus is 0 — no behaviour change for those users.

---

### Option A — Small compatibility influence

**MAX_BONUS = 5**

| fitScore | Bonus added |
|----------|------------|
| 100 (all members, easy swaps) | +5.0 |
| 75 (3 of 4, easy swaps)       | +3.75 |
| 50 (2 of 4, mixed swaps)      | +2.5 |
| 25 (1 of 4 or hard swaps)     | +1.25 |
| 0  (no compatibility data)    | +0.0 |

**Expected planner behaviour:**
- Only affects ranking when personal scores are within ~2–3 points of each other
- In most real-world selections, the personal preference score still decides
- Compatibility acts as a very gentle tiebreaker
- Weekly plans will show marginally improved household fit on average
- Low visibility effect — users unlikely to notice

---

### Option B — Moderate compatibility influence

**MAX_BONUS = 10**

| fitScore | Bonus added |
|----------|------------|
| 100 | +10.0 |
| 75  | +7.5  |
| 50  | +5.0  |
| 25  | +2.5  |
| 0   | +0.0  |

**Expected planner behaviour:**
- Compatibility can break ranks when personal scores are within ~5–8 points
- A 50-point fitScore advantage (e.g. 4/4 vs 2/4 household fit) is worth 5 bonus points
- Strongly household-friendly meals rise noticeably in ranking
- Personal preference still dominates for clear score gaps (>10 points)
- Weekly plans will show clearly improved household fit
- Effect is perceptible but nutrition/diet quality still leads

---

### Option C — Strong compatibility influence

**MAX_BONUS = 15**

| fitScore | Bonus added |
|----------|------------|
| 100 | +15.0 |
| 75  | +11.25 |
| 50  | +7.5   |
| 25  | +3.75  |
| 0   | +0.0   |

**Expected planner behaviour:**
- Compatibility can override personal preference gaps up to ~12 points
- A 100-point fitScore lead adds 15 bonus points — comparable to a full
  `dietMatch` or `goalAlignment` component
- Household-friendly meals reliably rank above nutritionally better but
  less compatible meals
- Risk: a nutritionally poor but household-friendly meal outranks a nutritionally
  rich meal that needs minor adaptations
- Trust risk: users may notice unexpected meals ranking highly

---

## 6. Investigation Q4 — Worked Examples

### Scenario from brief

```
Meal A — Beef Stir Fry
  Planner score:  95
  fitScore:       40   (2 of 4 members compatible, some removals needed)

Meal B — Veggie Thai Curry
  Planner score:  92
  fitScore:       90   (4 of 4 members compatible, easy swaps only)
```

#### Option A (MAX_BONUS = 5)

```
Meal A: 95 + (40/100) × 5  = 95 + 2.0  = 97.0
Meal B: 92 + (90/100) × 5  = 92 + 4.5  = 96.5

Winner: Meal A  (margin: 0.5)
```

**Interpretation:** A 50-point fitScore gap and a +2.5 bonus swing is not enough
to overcome a 3-point personal preference lead. Option A preserves Meal A's
ranking. The planner still prefers the more personally tailored meal.

#### Option B (MAX_BONUS = 10)

```
Meal A: 95 + (40/100) × 10 = 95 + 4.0  = 99.0
Meal B: 92 + (90/100) × 10 = 92 + 9.0  = 101.0

Winner: Meal B  (margin: 2.0 pre-cap)
```

**Interpretation:** A 50-point fitScore advantage and a 3-point personal preference
gap are reversed. Meal B wins because it fits the whole household whereas Meal A
requires removals for two members. Margin is clear but not overwhelming.

#### Option C (MAX_BONUS = 15)

```
Meal A: 95 + (40/100) × 15 = 95 + 6.0  = 101.0
Meal B: 92 + (90/100) × 15 = 92 + 13.5 = 105.5

Winner: Meal B  (margin: 4.5 pre-cap)
```

**Interpretation:** Compatibility strongly dominates. Even a 10-point personal
preference gap would not prevent the household-friendly meal from winning.

---

### Scenario 2 — Close fitScore, large personal preference gap

```
Meal C — Chicken Tikka Masala
  Planner score:  90
  fitScore:       70

Meal D — Salad Bowl
  Planner score:  72
  fitScore:       95
```

#### Option A: C wins (90 + 3.5 = 93.5 vs 72 + 4.75 = 76.75)
#### Option B: C wins (90 + 7.0 = 97.0 vs 72 + 9.5 = 81.5)
#### Option C: C wins (90 + 10.5 = 100.5 vs 72 + 14.25 = 86.25)

**All options preserve the large personal preference gap.** An 18-point personal
score difference is not overridden by compatibility under any option. Good.

---

### Scenario 3 — Very close scores, compatibility tiebreaker

```
Meal E: Planner score=85, fitScore=60
Meal F: Planner score=85, fitScore=90
```

#### Option A: F wins (85 + 3.0 = 88.0 vs 85 + 4.5 = 89.5 → F by 1.5)
#### Option B: F wins (85 + 6.0 = 91.0 vs 85 + 9.0 = 94.0 → F by 3.0)
#### Option C: F wins (85 + 9.0 = 94.0 vs 85 + 13.5 = 98.5 → F by 4.5)

**All options correctly break ties in favour of the more household-friendly meal.**

---

## 7. Investigation Q5 — Variety Impact

### Could compatibility increase repeats?

**Low risk.** The uniqueness constraint (`usedIds`) prevents the same meal
appearing twice. The bonus does not interact with the `usedIds` gate. A meal
already used in an earlier slot is excluded from Tier-1 and Tier-2 candidate
lists — the compatibility bonus applies only to the remaining unique pool.

The risk is indirect: if a small set of meals has both high personal preference
AND high household compatibility (e.g. 5 dinners that score 95+ plannerScore and
90+ fitScore), those meals rise to the top of every slot's ranked list and are
the first to be exhausted from the unique pool, accelerating the transition to
Tier-2 fallback. However, this is a quality improvement — the planner reaches
Tier-2 faster because it is consuming the best meals faster, not because variety
is reduced.

### Could compatibility reduce cuisine diversity?

**Low-medium risk with Option C, low risk with Options A/B.** If the household's
compatible meals cluster in one cuisine (e.g. a vegetarian household where pasta
and curry dominate the compatible pool), compatibility bonuses skew cuisine
toward those meals. The `cuisineBonus` component (+5 for preferred cuisine) and
the `preferredCuisine` setting in planner settings counteract this — but they do
not guarantee cuisine spread.

Mitigation already present: the random-from-top-3 selection mechanism naturally
spreads outcomes. Even with Option B, the #2 or #3 ranked meal (potentially a
different cuisine) is chosen ~66% of the time across a 7-day plan.

### Could compatibility reduce nutritional diversity?

**Very low risk.** The `fitScore` includes a `healthAlignment` component (0.10
weight) that rewards less-processed meals, so nutritionally appropriate meals
tend to have *higher* fitScore, not lower. A high-UPF meal with all members
compatible does not get a free pass — `healthAlignment` reduces its fitScore
and the planner's `upfScore` component (weight=13) already penalises it in
personal scoring.

Exception: if the household has a strong shared preference (e.g. all members
like simple budget meals), fitScore could be high on nutritionally monotone
options. This is correctly reflecting household preference — not a ranking flaw.

---

## 8. Investigation Q6 — Shell Interaction

### Tier 1 — Unused slot-fit candidates
`householdFit` is present on all passing user meals (Phase 3). Compatibility
bonus applies. ✓

### Tier 2 — Safe fallback unused candidates
Same pool as Tier 1 (filtered subset of `allCandidates`). `householdFit`
present. Compatibility bonus applies. ✓

### Tier 3 — Controlled repeat
Same pool — allows reuse of already-used meal IDs. `householdFit` present.
Compatibility bonus applies. Repeated household-friendly meals preferred over
repeated less-compatible meals. ✓

### Tier 4 — Shell recovery
Shell candidates are constructed inside `selectShellRecoveryCandidate()` and
do NOT carry `householdFit`. The `(candidate.householdFit?.fitScore ?? 0)` null
guard produces `0` bonus — shell candidates enter the `scored` array with no
compatibility bonus. This is correct:

1. Tier 4 is explicitly the fallback of last resort — fired only when Tiers 1–3
   are exhausted. The point of Tier 4 is to fill the slot at all.
2. `selectShellRecoveryCandidate()` already enforces `match.scoreBreakdown.compatibility >= 1`
   — only fully household-diet-compatible shells are returned. The compatibility
   requirement is baked into shell selection, not into the score.
3. `matchMealsForHousehold()` returns shells pre-sorted by `fitScore` descending.
   The first shell that passes the hard gates is already the best available.
4. Adding a `householdFit` attachment to shell candidates is a valid future
   enhancement (Phase 6.x), but not required for Phase 6 correctness.

**Tier 4 remains purely a fallback — Phase 6 does not alter that contract.** ✓

---

## 9. Investigation Q7 — Household Philosophy Check

### THA Philosophy
> "One meal with adaptations" — not "only meals everybody can eat unchanged."

A meal that fits 3 of 4 members with one easy swap is a good household meal.
The ranking system must not penalise it.

### How the bonus handles adaptable meals

The `fitScore` for an adaptable meal (e.g. 3 of 4 compatible, easy swap available)
is **not low**. Under `computeFitScore()`:

- `compatibility` (weight 0.25): based on `totalDietConflicts / memberCount`, not
  `memberChanges.length / memberCount`. A Path B ingredient swap does not count as
  a diet conflict — only Path A (diet type mismatch) does. A meal with no Path A
  conflicts scores `compatibility = 1.0` even if 1–2 members need ingredient swaps.
- `swapSimplicity` (weight 0.15): rewards rule-based "→" swaps over "remove X"
  removals. An adaptable meal with good swaps scores 0.7–0.9.
- `sharedBase` (weight 0.20): rewards high ingredient overlap across all members.
  A well-designed adaptable meal with few restricted ingredients scores 0.7–1.0.

**Typical fitScore ranges:**

| Scenario | Approx fitScore |
|----------|----------------|
| All 4 members, no changes | 80–95 |
| 3 of 4, one easy swap available | 65–85 |
| 2 of 4, multiple swaps (all rule-based) | 45–70 |
| 2 of 4, mixed swaps and removals | 30–55 |
| 1 of 4, many removals | 15–40 |

### Specific examples

**Beef Lasagne → Quorn alternative**

- `compatibleDiets` may include some diet types; Lilly's vegetarian diet triggers
  Path A if the template/meal has non-vegetarian `dietTypes`.
- Path B: beef mince detected as restricted for Lilly → `swapMap` returns Quorn mince.
- `memberChanges = [{ Lilly: ["beef mince → Quorn mince", "pasta → GF pasta"] }]`
- `compatibleCount = 3, totalCount = 4`
- `swapSimplicity = (1 - 1/4)×0.6 + (2/2)×0.4 = 0.45 + 0.40 = 0.85`
- `compatibility`: if no Path A conflicts for non-Lilly members → 1.0
- **Estimated fitScore: 75–85** → Bonus under Option B: +7.5–8.5

This meal **still ranks well** and receives a strong compatibility bonus because
the adaptation is a clean swap, not a removal. A solo-user meal with plannerScore=88
would need fitScore=5 or less to beat it at plannerScore=80. ✓

**Pizza Night → Keto base**

- Shell meal with `compatibleDiets` including keto variants in carbSlots
- `compatibility = 1.0` (all members can find a compliant slot option)
- `swapSimplicity = 1.0` (no removals — slot architecture handles it)
- **Estimated fitScore: 85–95**
- As a shell, receives no compatibility bonus (Tier 4 / no `householdFit`). The
  shell architecture's inherent compatibility is reflected in shell selection gates,
  not in score bonuses. No risk of pizza dominating Tiers 1–3. ✓

**Burger Night → Vegetarian patty**

- Normal user meal: "Burger Night" with beef mince as primary protein
- Lilly's vegetarian restriction → beef mince flagged via Path A/Path B
- `swapMap` returns "Quorn mince" or "black bean burger"
- `compatibleCount = 3, totalCount = 4`
- **Estimated fitScore: 70–80** → Bonus under Option B: +7.0–8.0

Burger Night still appears in the ranked pool, receives a meaningful bonus for
being 3-of-4 compatible, and is selected when it scores well overall. The
planner does not suppress it — it elevates it relative to a meal that suits only
Colin and provides no swap path. ✓

**Conclusion:** The compatibility bonus rewards adaptable meals proportionally.
A meal with easy, rule-based swaps scores `fitScore` 70–85 and receives a
meaningful bonus. A meal with no swap paths scores lower and receives less bonus.
Adaptable meals remain fully eligible and competitive. ✓

---

## 10. Investigation Q8 — Performance Assessment

### Per-candidate cost

The compatibility scoring (`scoreMealCompatibility()`) was moved to pool
construction time in Phase 3. `householdFit.fitScore` is already on every
passing candidate by the time the slot-filling loop begins.

**Phase 6 adds per-candidate cost in the slot-filling loop:**
```
compatibilityBonus = (c.householdFit?.fitScore ?? 0) / 100 × MAX_BONUS
```
This is a single property read + two multiplications + one addition.
Cost: **O(1)** per candidate. Negligible.

### Per-slot cost

Each slot evaluates `slotCandidates.length` candidates (typically 5–30 after
slot-fit filtering). The `scored.map()` loop already calls `scoreMeal()` once per
candidate (the expensive part). Adding one arithmetic operation adds:

**< 0.01ms per slot** — unmeasurable against `scoreMeal()` which executes
keyword scans over ingredient lists.

### Per-generation cost

A 7-day plan with 3 meals/day = 21 slots. At 20 candidates per slot:
- 420 additional multiplications total
- **Estimated additional latency: < 0.1ms per generation**

The dominant planning latency sources remain:
1. External candidate fetch (`fetchExternalCandidates`) — network I/O
2. `buildHouseholdContext()` — DB queries (~8 for a 4-person household)
3. Per-candidate `scoreMeal()` calls — string keyword scanning

**Phase 6 adds no DB queries, no network calls, and no new loops.** It is
arithmetically invisible relative to existing pipeline costs.

---

## 11. Investigation Q9 — Trust Check

### Could compatibility dominate nutrition?

**No, under Options A and B.** The `scoreMeal()` nutrition signals are:
- `dietMatch`: weight 22, hard exclusions produce -10 or -20
- `goalAlignment`: weight 13
- `upfScore`: weight 13

MAX_BONUS = 10 (Option B). A meal with excellent nutrition
(dietMatch=22, goalAlignment=18, upfScore=13) scores ~85+ and receives a
nutrition-informed score that the compatibility bonus cannot override unless the
meal is also highly household-compatible.

A nutritionally poor meal (dietMatch=-10, upfScore=-10) would score around
35–50 from `scoreMeal()`. Even with fitScore=100 and MAX_BONUS=10, its adjusted
score is 45–60 — well below a nutritionally appropriate meal at 80+.

**Under Option C** (MAX_BONUS=15), it becomes possible for a nutritionally mediocre
meal (score=70) to match a nutritionally excellent meal (score=80) if fitScore=100.
This is the primary reason Option C is not recommended.

### Could compatibility dominate cost?

**No.** `budgetAlignment` (weight 13) produces up to 13 points of personal cost
influence. A high-budget meal for a budget-conscious user scores 0 on that
component, yielding a ~13-point disadvantage that Options A/B cannot overcome
with compatibility bonuses.

### Could compatibility dominate variety?

**No.** The `usedIds` uniqueness constraint enforces variety by excluding already-
used meals. Variety is structural, not score-based. Compatibility bonuses cannot
cause the same meal to be selected twice — the planner always takes a unique meal
from Tiers 1–3 before repeating.

### Could compatibility dominate user preferences?

**No, under Options A/B.** Personal preference signals (dietMatch=22,
goalAlignment=13, simplicity=13) collectively account for 48 raw score points.
Compatibility adds at most 10 bonus points. Personal signals retain dominant weight.

### Prevention mechanisms

1. `MAX_BONUS` cap prevents runaway compatibility weight
2. `null` guard (`?.fitScore ?? 0`) ensures solo users see no behaviour change
3. The existing random-from-top-3 mechanism dilutes the deterministic effect of
   small score differences — even if Meal B ranks #1, it is only selected 1/3 of
   the time across random trials
4. `dietMatch` can impose -20 points for hard dietary violations — no amount of
   compatibility bonus recovers a meal that conflicts with the requester's own diet

---

## 12. Investigation Q10 — Rollback Plan

Phase 6 touches exactly one location in one function.

### Implementation (for reference — NOT implemented in this plan):

**File:** `server/lib/smart-suggest-service.ts`
**Location:** `scored = slotCandidates.map(...)` block (approximately line 765)

```typescript
// Phase 6: compatibility-aware ranking bonus
// Reads householdFit.fitScore already computed at pool-construction time (Phase 3).
// Solo users and external candidates have no householdFit → bonus is 0 → no change.
const COMPATIBILITY_RANKING_BONUS = 10;

const scored = slotCandidates.map(c => {
  const { score, breakdown } = scoreMeal(...);
  const compatBonus = c.householdFit
    ? (c.householdFit.fitScore / 100) * COMPATIBILITY_RANKING_BONUS
    : 0;
  return { ...c, score: Math.min(100, score + compatBonus), scoreBreakdown: breakdown };
});
```

### Rollback procedure:

```bash
# Remove COMPATIBILITY_RANKING_BONUS constant
# Remove compatBonus variable
# Revert the score: field to: score: Math.min(100, score)
# OR:
git checkout pre-phase6-compatibility-ranking -- server/lib/smart-suggest-service.ts
```

No schema changes. No migrations. No data writes. No API shape changes.
Rollback is a 5-line revert with zero data impact.

---

## 13. Final Output

### 13.1 Ranking Flow Diagram (Summary)

```
CURRENT (Phases 1–5):
  scoreMeal(candidate, prefs, context)       → score [0–100]
  candidate.householdFit.fitScore            → UNUSED in ranking
  scored.sort((a,b) => b.score - a.score)
  → top 5 → random from top 3

PROPOSED (Phase 6 — Option B):
  scoreMeal(candidate, prefs, context)       → score [0–100]
  compatBonus = (householdFit?.fitScore / 100) × 10
  adjustedScore = score + compatBonus        → max ~110 pre-cap, stored as min(100, ...)
  scored.sort((a,b) => b.adjustedScore - a.adjustedScore)
  → top 5 → random from top 3
```

---

### 13.2 Current Scoring Summary

| Dimension | Weight | Source |
|-----------|--------|--------|
| dietMatch | 22 | Personal diet types vs ingredient keywords |
| goalAlignment | 13 | Health goals (muscle/weight/UPF) |
| budgetAlignment | 13 | Estimated cost vs budget level |
| upfScore | 13 | UPF sensitivity vs estimatedUPFScore |
| varietyScore | 13 | Protein variety tracker |
| simplicityBonus | 13 | Ingredient count + common name |
| overlapScore | 8 | Cross-week ingredient reuse |
| cuisineBonus | 5 | Preferred cuisine match |
| **householdCompatibility** | **0** | **Not used — Phase 6 gap** |

---

### 13.3 Weighting Matrix

| Option | MAX_BONUS | fitScore=100 bonus | fitScore=50 bonus | fitScore=25 bonus | Swings ranking when gap ≤ |
|--------|-----------|--------------------|--------------------|--------------------|-----------------------------|
| A | 5  | +5.0 | +2.5 | +1.25 | ~2–3 points |
| B | 10 | +10.0 | +5.0 | +2.5  | ~5–8 points |
| C | 15 | +15.0 | +7.5 | +3.75 | ~10–12 points |

---

### 13.4 Worked Examples Summary

```
Meal A: plannerScore=95, fitScore=40, fits 2/4  (some removals)
Meal B: plannerScore=92, fitScore=90, fits 4/4  (all easy swaps)

                 Meal A  |  Meal B  |  Winner
  Option A:     97.0     |  96.5    |  A  (personal preference wins)
  Option B:     99.0     |  101.0   |  B  (household fit wins cleanly)
  Option C:    101.0     |  105.5   |  B  (household fit dominates strongly)
```

---

### 13.5 Risks

| Risk | Severity | Option | Mitigation |
|------|----------|--------|-----------|
| Compatibility overrides clearly better personal meal | LOW | A/B | MAX_BONUS ≤ 10; dietMatch -20 penalty cannot be recovered |
| Cuisine diversity reduction | LOW-MEDIUM | C | Options A/B: random-from-top-3 dilutes effect |
| fitScore absent for external candidates | NONE | All | Null guard: `?.fitScore ?? 0` → bonus = 0 |
| Shell candidates receive no bonus | NONE | All | Shells already enforce compatibility=1.0 gate |
| Users notice unexpectedly ranked meals | LOW | C | Option B: effect only visible in close races |
| fitScore=0 meals compete with no penalty | VERY LOW | All | Bonus is additive upward only — compatible meals rise, incompatible meals stay |
| Solo users affected | NONE | All | `householdFit` absent → bonus = 0 → no change |

---

### 13.6 Recommended Weighting

**Option B — MAX_BONUS = 10**

---

### 13.7 Why Option B Best Supports THA Philosophy

**"One meal with adaptations" requires adaptable meals to be preferred over
non-adaptable meals when personal scores are close.**

Option A (bonus=5) is too gentle: a 50-point fitScore gap (4/4 all-easy-swaps
vs 2/4 with removals) only produces a 2.5-point score shift. In a planner where
many meals cluster in the 80–95 range, this rarely changes ranking outcomes.
Option A has too little practical effect to serve the household compatibility
goal.

Option C (bonus=15) overreaches: a 12-point personal score gap can be overcome
by compatibility. This risks selecting a nutritionally mediocre but household-
friendly meal over a nutritionally excellent but adaptation-requiring meal. It
contradicts the "adaptations are acceptable and expected" philosophy by making
adaptation-free meals too dominant.

Option B (bonus=10) is the correct balance:
- A 50-point fitScore gap (significant household quality difference) produces a
  5-point bonus — enough to decide genuinely close races
- A 3-point personal score gap is overcome when fitScore advantage is 30+ points,
  which represents a real, meaningful compatibility improvement
- A 20-point personal score gap (clear winner) is not overridden under any
  compatibility scenario
- Nutrition, diet compliance, and budget signals retain dominance
- Adaptable meals (fitScore 65–85) receive meaningful bonuses (6.5–8.5 points)
  and compete fairly with solo-preference-optimised meals
- The random-from-top-3 mechanism continues to provide variety; the bonus shifts
  probabilities gently rather than making ranking deterministic

Option B respects that "fits 3 of 4 with an easy swap" is a **good meal for
the household** and deserves to be preferred over a meal that fits only the
requester but scores marginally higher on personal dimensions.

---

### 13.8 Implementation Readiness Assessment

| Check | Status |
|-------|--------|
| `householdFit.fitScore` present on all passing user meal candidates | ✓ Phase 3 complete |
| `fitScore` accuracy — resolver integration complete (Phase 5) | ✓ Phase 5 complete |
| Integration point identified (single location, single function) | ✓ lines 765–787 `smart-suggest-service.ts` |
| No schema changes required | ✓ Confirmed |
| No migrations required | ✓ Confirmed |
| No API shape changes required | ✓ `score` field already present; value changes only |
| No UI changes required | ✓ `fitScore` display (Phase 4) is independent |
| Solo users unaffected | ✓ Null guard confirmed |
| External candidates unaffected | ✓ No `householdFit` → bonus = 0 |
| Tier 4 shells unaffected | ✓ Already enforce compatibility gate separately |
| Performance impact negligible | ✓ O(1) per candidate, no DB calls |
| Rollback procedure defined | ✓ Single-location revert or git checkout |
| Worked examples validated | ✓ Arithmetic confirmed above |
| THA philosophy preserved | ✓ Adaptable meals rank competitively |

---

## STATUS A — READY FOR IMPLEMENTATION

All prerequisite phases (1–5) are complete. The integration point is clearly
identified. The formula is exact. The rollback path is trivial. The philosophy
check confirms adaptable meals remain eligible and competitive.

Implementation requires changes to exactly one file (`smart-suggest-service.ts`),
adding one constant and one arithmetic expression in the existing `scored.map()`
call. No other files require changes.

---

## 14. Data Impact Declaration

| Question | Answer |
|----------|--------|
| Reads existing data | YES — `candidate.householdFit.fitScore` already in memory |
| Writes new data | NO |
| Changes meaning of existing data | NO — `fitScore` interpretation unchanged |
| Requires migration | NO |
| Requires backfill | NO |

---

## 15. Scope Lock

### Planning only (this document)

- Current ranking flow documented
- Integration points evaluated
- Weighting options with exact formulas
- Worked examples with arithmetic
- Variety/philosophy/performance/trust analysis
- Rollback procedure defined
- Recommendation made

### NOT implemented (SUGGESTIONS — Phase 6 implementation phase)

- Constant `COMPATIBILITY_RANKING_BONUS = 10` addition to `smart-suggest-service.ts`
- `compatBonus` arithmetic in `scored.map()` call
- TypeScript verification of no new type errors
- Manual test of planner generation showing changed rankings
- Any change to `scoreMeal()` or `computeFitScore()` signatures
- Any UI changes
- Any schema changes
- Any data writes

---

## 16. Report Location

`docs/investigations/planner/HOUSEHOLD_COMPATIBILITY_PHASE6_COMPATIBILITY_RANKING_PLAN.md`
