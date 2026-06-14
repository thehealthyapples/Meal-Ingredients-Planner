# Smart Planner — Post-Enforcement Slot-Fill Failure Investigation

**Date:** 2026-06-13
**Branch:** `main` @ `39de349`
**Rollback tag:** `rollback/pre-slot-fill-investigation-20260613` → `39de349`
**Scope:** Investigation only. No code, planner logic, restriction, shell, or DB changes.
**Method:** Read-only DB queries + a faithful re-simulation of the
`/api/meal-plans/smart-suggest` route and `generateSmartSuggestion()` pipeline with
per-stage instrumentation (`server/scripts/sim-slot-fill.ts`, `sim-shells.ts`).

---

## TL;DR — Final Verdict: **STATUS F (multiple causes)**

With the live external recipe scraper reachable, the planner **currently fills all
28 slots** for the visible dev household (id 44) and for the strict-diet test users
(Vegan / Vegetarian / Vegetarian+GF). So there is **no hard logic bug leaving slots
empty under normal conditions**. The user's observations are explained by three
compounding structural weaknesses:

1. **Supply concentration / external dependency (dominant).** For restricted diets the
   *user-owned* candidate pool collapses to **0** (saved meals are `starter`-sourced and
   route-excluded, or diet-excluded), so the planner depends almost entirely on the live
   external scraper. When that scraper underperforms or fails, a restricted planner
   produces **no meals** — exactly "with full restrictions, no meals generated."
2. **Slot/category classification skew (real defect).** External candidates default to
   `dinner`, and the classifier **never emits `snack`**. breakfast/lunch/snack pools are
   tiny and name-keyword-dependent → heavy repetition and the slots most at risk of
   emptying.
3. **Shell catalogue is effectively one shell (real defect).** Only **1 of 650**
   meal templates ("Cooked Breakfast", breakfast-only) has populated slot components, so
   Tier-4 can never rescue lunch/dinner/snack.

Filtering itself is behaving **as designed** (not a bug) — it is correctly removing
non-compliant meals. The problem is thin, dinner-skewed supply plus a dead recovery tier,
not over-aggressive filtering.

---

## 1. Single-Run Trace — Visible Dev Household

Request user: **user 1** (`colinclapson@hotmail.co.uk`), the primary dev account
(207 saved meals). Household resolved: **household id 44**, 4 eaters.

| Field | Value |
|---|---|
| Household eaters loaded | 4 |
| Eater: colinclapson@hotmail.co.uk (userId 1) | dietTypes `["style:family-friendly","style:whole-foods","keto"]` (from prefs.dietTypes); hardRestrictions `[]` |
| Eater: colinclapson@outlook.com (userId 38) | dietTypes `["gluten-free","upf-free","keto"]` (from prefs.dietTypes); hardRestrictions `[]` |
| Eater: Lilly (child, userId null) | dietTypes `[]`; hardRestrictions `[]` |
| Eater: Daisy (child, userId null) | dietTypes `["Mediterranean"]` (from defaultDietTypes); hardRestrictions `[]` |
| **mergedDietTypes** | `["style:family-friendly","style:whole-foods","keto","gluten-free","upf-free","Mediterranean"]` |
| **hardExcludedIngredients** | `[]` (no eater carries a hard restriction) |
| **householdStrictDiets** | `[]` (no eater is Vegetarian/Vegan; Daisy = Mediterranean which is not a strict food-group ban) |
| **request-user dietPattern** | `"Keto"` |
| **request-user dietRestrictions** | `[]` |

> Note: the current visible household carries **no** Vegetarian/Vegan eater, so the
> recently-added household-strict-diet hard gate is **inactive** here. The user's
> "Vegetarian/Vegan" symptom is reproduced via the strict-diet request users in §2.

---

## 2. Candidate Pool Counts

### 2a. Visible dev household (user 1, Keto), mealsPerDay = 4

Route-level user-meal filtering:
`raw getMeals = 207 → afterDrink 204 → afterSourceType 124 → afterComponent 117 → afterPremium 117`
(80 of 207 meals removed purely by `mealSourceType ∈ {starter, planner-placeholder, openfoodfacts}`.)

User-meal pool construction inside `generateSmartSuggestion`:

| Stage | Excluded | Remaining |
|---|---|---|
| product (openfoodfacts) | 0 | 117 |
| premium | 0 | 117 |
| ready-meal product | 1 | 116 |
| drink/alcohol | 0 | 116 |
| **hardExcluded** | 0 | 116 |
| no-ingredients (restricted profile) | 4 | 112 |
| **request dietPattern (Keto)** | **85** | 27 |
| householdStrictDiets | 0 | **27 user meals pass** |

External candidates (dietaryPrefix `"keto"`):
`raw 83 → enriched 83 → dietExcluded 64 → **19 external pass**`

**Final pool = 46** (27 user + 19 external). Category distribution
`{breakfast:11, lunch:5, dinner:20, dessert:2, drink:6*, null:2}`
(*drinks are additionally removed by the live drink gate; counted here only because the
instrumentation omitted that one external-side check.)

By slot (Tier-3 reuse pool = everything that ever fits the slot):

| Slot | Pool (user + external) |
|---|---|
| breakfast | 11 (2 + 9) |
| lunch | 5 (5 + 0) |
| dinner | 22 (14 + 8) |
| snack | 8 (6 + 2) |

### 2b. Strict-diet request users (the "full restrictions" symptom)

| User / diet | User meals after route filter | User-pool **passed** | dietExcl (user) | External passed / enriched | Final pool | breakfast / lunch / dinner / snack |
|---|---|---|---|---|---|---|
| **42 — Vegan** | 8 | **0** | 8 | 28 / 63 | 28 | 1 / 2 / 21 / 4 |
| **56 — Vegetarian + GF** | 2 | **0** | 2 | 29 / 78 | 29 | 16 / 1 / 11 / 1 |
| **57 — Vegetarian** | 10 | 6 | 4 | 50 / 78 | 56 | 22 / 6 / 26 / 2 |

Key reading: for Vegan and Vegetarian+GF the **entire** usable pool is external
(0 user meals survive — their saved meals are `starter`-sourced and stripped at the route,
and the few scratch meals are diet-excluded). lunch and snack pools are routinely 1–2 items.

---

## 3. Empty-Slot Root Cause

**In all simulated runs (user 1, 42, 56, 57 at mealsPerDay = 4) the planner filled
28/28 slots — 0 empty slots.** There is therefore no reproducible empty slot under
current conditions *while the external scraper is reachable*.

The deterministic empty-slot mechanism (when it does occur) is:

- A slot is left empty **only** when, for that slot's category set, **Tier-1 = Tier-2 =
  Tier-3 = 0 candidates AND Tier-4 returns null.** Because Tier-3 (`getRepeatCandidates`)
  reuses *any* slot-fitting compliant candidate ignoring `usedIds`, a slot can only empty
  when the **whole pool contains zero candidates of that slot's category.**
- That happens when: (a) the request diet excludes the user's saved meals (→ user pool 0),
  **and** (b) the external scraper returns nothing in that category (network failure,
  rate-limit, scrape breakage, or a diet/category combination with no matches).

Worked example — **Vegan + external scraper unavailable**:
- user pool = 0 (all saved meals diet-excluded / starter-stripped),
- external pool = 0 (scraper returned nothing),
- Tier-4: the only populated shell is "Cooked Breakfast" whose `compatibleDiets` =
  `["Vegetarian","Gluten-Free","Dairy-Free","Mediterranean","Low-Carb","Keto"]` — it does
  **not** include Vegan, so `compatibility < 1` → skipped.
- Result: **all 28 slots empty → "no meals generated."** This is the exact failure the
  user reported under full restrictions.

Per the tier columns for the at-risk slots even when the scraper *is* up (Vegan run):
breakfast Tier-3 pool = 1, lunch = 2, snack = 4 — single-digit pools that fill only by
repetition; a transient scraper dip in any of those categories empties the slot.

---

## 4. Repetition Logic

Repeats are **expected and allowed by design** (Tier-3 "controlled repeat" — a repeated
compliant meal is preferred over an empty slot). Observed repeats:

| Run | Most-repeated meal | Times | Distinct meals used / 28 |
|---|---|---|---|
| user 1 (Keto) | "Omelet" | 2× | 27 |
| user 42 (Vegan) | "Vegan banana pancakes" | **7×** | 22 |
| user 56 (Veg+GF) | "Healthy cookies" 4×, "Roasted sweet potato & carrot soup" 3× | up to 4× | 20 |
| user 57 (Vegetarian) | none > 1 | — | 28 |

- **Why allowed:** Tier-3 (`getRepeatCandidates`, smart-suggest-service.ts:317) deliberately
  drops the `usedIds` constraint when the unique pool is exhausted for a slot.
- **Candidate pool size at repeat time:** the slot's category pool — e.g. Vegan breakfast = 1,
  so all 7 breakfasts collapse onto the single "Vegan banana pancakes".
- **Repeat cap:** **none.** There is no per-meal weekly repeat cap. The only diversity
  mechanism is the variety scoring nudge + `topN.slice(0,5)` random pick among the top 3
  (smart-suggest-service.ts:833-836), which cannot help when the slot pool size is 1–2.
- **Is it working?** It is working *as written* (no empty slot), but with no cap the output
  reads as "not a full/varied planner" whenever a category pool is tiny.

---

## 5. Shell Recovery (Tier-4)

- **Did Tier-4 execute?** It is wired and lazily invoked when a slot exhausts Tiers 1–3.
  In the simulated runs Tiers 1–3 never exhausted, so **Tier-4 produced 0 entries** (it was
  reached only when a category pool was genuinely 0, which did not occur with the scraper up).
- **Shell templates considered:** `matchMealsForHousehold` scores all **650** active
  `meal_templates`.
- **Templates that can ever be populated into a candidate:** **1 of 650.** Only template
  **633 "Cooked Breakfast"** has any populated slot components
  (`sharedBaseComponents/proteinSlots/carbSlots/vegSlots/toppingSlots/sauceSlots`). For the
  other **649**, all slot arrays are empty → `allSlotIngredients = []` →
  `compliantIngredients.length === 0` → `continue` (skipped) in
  `selectShellRecoveryCandidate` (smart-suggest-service.ts:362-375).
- **Compatible:** "Cooked Breakfast" `compatibleDiets` =
  `["Vegetarian","Gluten-Free","Dairy-Free","Mediterranean","Low-Carb","Keto"]`. It can only
  fill the **breakfast** slot, and only for households whose every member's diet is covered
  (`compatibility === 1`). It does **not** cover Vegan.
- **Is "only Cooked Breakfast" true?** **Yes — confirmed.** 1/650 usable, breakfast-only.
- **Why it didn't fill missing slots:** Tier-4 is structurally incapable of rescuing
  lunch / dinner / snack (no populated non-breakfast shells) and cannot rescue Vegan
  breakfast (diet not covered). It is a near-dead recovery tier.

---

## 6. Artificial Limits Audit

| Limit | Location | Effect | Causing the failure? |
|---|---|---|---|
| `topN = scored.slice(0, 5)`, random of top 3 | smart-suggest-service.ts:833-836 | Selection randomisation only; does **not** shrink the pool | No |
| External per-source result caps (`.slice(0,10)`, query `.slice(0,3/5)`) | external-meal-service.ts:219-220, 297, 375, 383, 589, 623, 398 | Caps each source's contribution; total external pool ≈ 80–90 raw | Minor — limits ceiling, not a hard cap that empties slots |
| Dietary-prefix generic fallback only when `combined.length < 10` | external-meal-service.ts:773 | Helps thin diets; good | No (mitigation) |
| Enrichment drops candidates with no extractable ingredients | external-meal-service.ts:831-849, 632-635 | 0 dropped in observed runs; can drop more if detail pages fail | Conditional — scrape failures shrink supply |
| Route source-type exclusion `starter / planner-placeholder / openfoodfacts` | routes.ts:4866-4870 | Removes 80/207 user meals (user 1); **removes 63 starter meals per seeded user** → strict-diet users' user-pool = 0 | **Yes — major contributor to thin supply** |
| Component exclusion `kind === 'component'` | routes.ts:4875 | Correct; minor | No |
| Diet hard filter (request pattern + household strict diets) | smart-suggest-service.ts:472-482, 575-583, 639-647 | Removes 73% of user meals (Keto) / 50–77% of external | Working as designed, not a bug |
| Per-slot cap / one-per-day / week-level repeat cap | — | **None exist** | No (their *absence* drives repetition) |
| Early-stop condition | — | None | No |

There is **no single artificial cap** that empties the planner. The closest structural
contributor is the **starter-source route exclusion**, which zeroes the user-meal pool for
seeded/strict-diet accounts and forces total reliance on the external scraper.

---

## 7. Final Verdict

**STATUS F — Multiple causes.**

- **C (slot/category classification)** — real: external classifier defaults to `dinner`
  and never emits `snack`; breakfast/lunch detection is name-keyword-only. Pools are
  dinner-heavy; lunch/snack are starved.
- **E (shell catalogue too small)** — real: 1/650 usable shell, breakfast-only → Tier-4
  cannot recover lunch/dinner/snack or Vegan.
- **A (supply, not filtering)** — for restricted diets the user-meal pool is 0 and the
  planner depends entirely on the live external scraper; when it dips/fails, slots empty.

Filtering is **not** a bug (rules out a clean B/D). The end-user symptoms — "no meals under
full restrictions", "more after loosening", "still not full/varied" — are the visible
result of thin + dinner-skewed supply, a dead recovery tier, and no repeat cap.

---

## 8. Recommended Next Steps (NOT implemented)

Ordered safest-first. Each is independent and behind the existing rollback tag.

1. **Resilience logging + telemetry on external fetch (RISK: very low).**
   Log per-source counts and per-slot pool sizes at generation time so an empty/near-empty
   pool is observable in dev. No behaviour change. Confirms whether real-world empties are
   scraper outages vs. classification.

2. **Add `snack` to the external category classifier (RISK: low).**
   `inferCategoryFromCuisineAndName` never returns `snack`; add snack keyword detection
   (bar, bites, energy ball, trail mix, hummus, dip, etc.) so snack stops borrowing solely
   from dessert. Pure classification widening; no filter relaxation.

3. **Per-slot pool floor → trigger generic backfill earlier (RISK: low–medium).**
   Today the generic fallback fires only when *total* `combined.length < 10`. Make it
   per-category (e.g. fire when breakfast/lunch/snack < N) so thin slots get topped up
   before Tier-3 repetition kicks in. Touches external-service fallback only.

4. **Introduce a weekly repeat cap with graceful relaxation (RISK: medium).**
   Cap a meal at e.g. 2–3×/week; relax the cap only when the slot would otherwise empty
   (preserve the "repeat beats empty" guarantee). Improves perceived "fullness/variety"
   without risking new empty slots. Needs careful ordering against Tiers 2–4.

5. **Populate the shell catalogue (RISK: medium).**
   649/650 templates have empty slot components, so Tier-4 is inert for non-breakfast.
   Seed slot components + `compatibleDiets` for representative lunch/dinner/snack shells
   (including Vegan-covered ones). This is the genuine fix for guaranteed slot coverage
   under any restriction. (Out of scope here — "do not seed shells".) Validate via the
   existing compliance gate before exposing.

6. **Re-evaluate the `starter` route exclusion for seeded accounts (RISK: medium–high).**
   The exclusion is correct for operational templates, but it zeroes the user-meal pool for
   seeded/strict-diet users, forcing total external reliance. Consider promoting curated
   starter meals into real, dietary-tagged user meals (or a separate eligible source type)
   so restricted users have an on-device fallback pool. Highest blast radius — design first.

---

## Appendix — Reproduction

- `server/scripts/sim-slot-fill.ts` — env `SIM_USER`, `SIM_MPD`; replicates route + planner
  with per-stage instrumentation and a real `generateSmartSuggestion` run.
- `server/scripts/sim-shells.ts` — shell-template slot-population audit (1/650 finding).
- `server/scripts/query-investigation.ts` — household/user/template/meal census (pre-existing).

All scripts are **read-only** (SELECT + in-memory simulation; no writes).
