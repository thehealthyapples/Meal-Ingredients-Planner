
# Session: AFI3_5_Ambient_Food_Intelligence_Completion

| Field | Value |
|---|---|
| **Session ID** | `AFI3_5_Ambient_Food_Intelligence_Completion` |
| **Rollback ID** | `rollback/AFI3_5-ambient-food-intelligence-completion-20260718` |
| **Start time** | 2026-07-18 |
| **Current stage** | Complete |

## Rollback
| Item | Value |
|---|---|
| Tag | `rollback/AFI3_5-ambient-food-intelligence-completion-20260718` → `7bfad50c` |
| Working tree at start | **Dirty — NOT MINE.** Pre-existing sibling-session + AFI1 + AFI2 uncommitted work. Tag protects committed state only. Do NOT stash (would destroy sibling + AFI1/AFI2 work). Do NOT commit sibling work. Back up deliverables to scratchpad (clobber hazard recorded by AFI1/AFI2). |

## Objective
Complete Ambient Food Intelligence: AFI3 (Pantry & Shopping), AFI4 (Meal & Food),
AFI5 (Companion). Continue the EXISTING AFI1/AFI2 architecture — the one
Observation → Insight → Recommendation pipeline (FI4 opportunity engine / OD1
delivery / DEC1 decision / PHASE5C ambient surface). NO new recommendation engine,
pipeline, capability, or nutrition knowledge. Reuse existing services throughout.
Calm, evidence-aware, household-specific, actionable. One excellent recommendation
beats many average ones.

## DESIGN — PIVOTED (owner decision, 2026-07-18)
**The first design (below, "SUPERSEDED") was abandoned before completion.** Reconnaissance
found that SHOP1 / CBK2 / PANTRY1 — three committed implementation docs AND three committed
test suites at HEAD — already SPECIFY six opportunity generators that DO NOT EXIST in the
engine. They overlap AFI3–AFI5 almost exactly. Building my own parallel types beside them
would be the near-duplication the brief forbids. **Owner chose: implement to the existing
specs.** Their contracts are also stricter and better (CBK2 §4.5/§4.6 refuse "nearly
cookable" and refuse to treat an UNRESOLVABLE ingredient as owned — the superseded AFI4
design counted positive pantry matches, exactly the claim CBK2 exists to forbid).

### Locked scope — six generators to spec
| Workstream | Generator | Type | Domain / priority |
|---|---|---|---|
| AFI3 | `identifyShoppingPantryDuplicateOpportunities(items, pantry)` | `shopping-item-already-in-pantry` | shopping / medium |
| AFI3 | `identifyShoppingHigherRatedProductOpportunities(items, matches)` | `shopping-higher-rated-product-available` | shopping / medium |
| AFI3 | `identifyShoppingLessProcessedOpportunities(items, restrictionDefs)` | `shopping-less-processed-option` | shopping / low |
| AFI3 | `identifyPantryNeedOpportunities(pantry, shopping)` | `pantry-need-not-on-shopping-list` | pantry / medium |
| AFI4 | `identifyCookbookCookableNowOpportunities(meals, pantry)` | `cookbook-recipe-cookable-now` | cookbook / low |
| AFI4 | `identifyCookbookHouseholdConflictOpportunities(meals, restrictions)` | `cookbook-recipe-household-conflict` | cookbook / medium |

**AFI5 (Companion) = the `cookbook` domain registration**, which is what actually carries the
new observations to the Companion. Recon proved an unregistered domain is dropped TWICE:
`DOMAIN_TO_CATEGORY` (notice-engine.ts:296 — the Companion never voices it) and `DOMAIN_LABEL`
(FoodOpportunityCard.tsx:36 — renders as generic "Food"). Four registrations: domain union +
`meal` subject entity; `DOMAIN_SURFACE.cookbook = "meals"`; `NoticeCategory` +=
`cookbook-opportunity` and its `DOMAIN_TO_CATEGORY` row; `DOMAIN_LABEL.cookbook`; plus the
`meals-page.tsx` mount. `OPPORTUNITY_SOURCES` needs ZERO lines (food-intelligence already enrolled).

### Suite reachability (bears on the npm-test wiring instruction)
- **SHOP1** — every import satisfiable → target FULLY GREEN → wire into `npm test`.
- **CBK2 / PANTRY1** — import `generateRecipeExplanation`, `generatePantryExplanation`,
  `EMPTY_PANTRY_HOUSEHOLD_FACTS`, `PlannerOpportunitySignal`, `LearnedPreference` — NONE exist.
  Those are EXPLAINER specifications, not opportunity generators, and are out of this brief's
  scope. The suites cannot even load, so they CANNOT be wired. Build the generators they
  specify, cover them in the already-wired binding suite, and report both suites as
  engineering debt.

## SUPERSEDED — first design (not built; retained for the report's decision trail)
Three new types through the EXISTING FI4/OD1/DEC1/PHASE5C seam. NO new domain
(recon proved a new `owningDomain` is dropped twice — `DOMAIN_TO_CATEGORY` in
notice-engine.ts:296 + no mounted client surface). NO new pipeline/engine/knowledge.

- **AFI3 `shopping-already-in-pantry`** (domain `shopping`, subject `shopping-item`, `low`)
  "You already have X in your pantry — it's on your shopping list too." Matches pantry
  `ingredientKey` ↔ shopping `productName` by canonical slug via the ONE resolver
  (`resolveCanonicalFood`). Reuses the pantry + shopping reads the orchestrator ALREADY
  performs — zero new reads. Skips `checked` / `shopStatus: already_got` (household has
  already actioned it) and `defaultHave: false` pantry rows.
- **AFI4 `planner-meal-pantry-match`** (domain `planner`, subject `planner-meal`, `low`)
  "This week's [Meal] uses N ingredients already in your pantry." Reuses `mealCanonicalFoods`
  (planner-explanation-context.ts:144 — the ONE ingredient→canonical mapper) + the pantry
  index idiom from `readPantryFoods`. Ingredients arrive by switching the orchestrator's
  per-entry meal read from `plannerPort.getMeal` (which projects ingredients AWAY) to the
  existing INT15 `mealsPort.getMeal` — SAME call count, strictly more data.
- **AFI5 `planner-cook-from-pantry`** (domain `planner`, subject `planner-day`, `low`)
  The Companion's cross-room observation — the connection no single room can see: an EMPTY
  day + the cookbook meal that uses the most pantry items the household already has.
  Reuses `mealsPort.getMeals(userId)` (existing INT15 port, same idiom as
  pantry-intelligence-assembler.ts:277) + the same pantry index. Answers the
  `planner-empty-day` gap rather than repeating it. Voiced by the Companion through the
  EXISTING generic Notice Engine (`planner` → `planner-gap`, already mapped) — no second
  notice channel (routes.ts:11742 forbids one).

## Checkpoints
- [x] Rollback tag created + resolved (`7bfad50c`); session registered
- [x] Reconnaissance — pantry/shopping, meal/food, companion reads + existing services
- [x] Design locked (above)
- [x] AFI3 — Shopping ×3 + Pantry ×1 generators (opportunity-engine.ts:652–897) + orchestrator wiring
- [x] AFI4 — Cookbook ×2 generators (opportunity-engine.ts:898–1030) + orchestrator wiring
- [x] AFI5 — Companion: cookbook domain registered at all four drop points
- [x] Tests + typecheck
- [x] Verified in running app (live dev server, real seeded household — not internals)
- [x] Screenshots — 7/7, docs/implementation/assets/afi35/
- [x] Doc: docs/implementation/intelligence/AFI3_5_AMBIENT_FOOD_INTELLIGENCE_COMPLETION.md

## Verification log (2026-07-18)

### Rollback re-confirmed before resuming
Annotated tag `rollback/AFI3_5-ambient-food-intelligence-completion-20260718` → commit
`7bfad50c` = current HEAD. Verified via `git rev-parse tag^{commit}` (plain `rev-parse`
returns the tag OBJECT sha `a89f4947` — not a mismatch). Tree still dirty with sibling +
AFI1/AFI2 work; NOT stashed, NOT committed.

### Defects found and fixed on resume
Two type errors in the 286 lines this session added to the already-wired binding suite
(`test-intelligence-food-opportunity-binding.ts`) — both mine, both fixed:
1. `tier: "major"` → `"additional_restriction"`. `RestrictionTier`
   (shared/restrictions/restriction-types.ts:23) is `'major_allergen' | 'additional_restriction'`;
   "major" was never a member. Vegetarian is a dietary restriction, not an allergen.
2. Fake `FoodIntelligenceReadPort` omitted `assembleFoodComparison` (COMP1 added it as a
   third required method). Added a throwing stub matching the file's existing idiom.

### Suite results — all green
| Suite | Result |
|---|---|
| `test:intelligence-food-opportunity-binding` (covers all 6 generators + AFI5 registration) | **99 passed, 0 failed** |
| `test:shop1-intelligent-shopping` | **34 passed, 0 failed** |
| `test:intelligence-notice-engine` | **65 passed, 0 failed** |
| `test:intelligence-opportunity-delivery-binding` | **60 passed, 0 failed** |
| `test:intelligence-companion-card` | **36 passed, 0 failed** |

Typecheck: production files touched by AFI3–AFI5 (`opportunity-engine.ts`, `notice-engine.ts`,
`framework.ts`, `FoodOpportunityCard.tsx`, `meals-page.tsx`) are **error-free**. The repo's
258 remaining `tsc` errors are all pre-existing and in unrelated files (test-plan2,
test-slot-filling-recovery, publication-register `--downlevelIteration`, etc.) — untouched.

### npm test aggregate
`test:shop1-intelligent-shopping` and `test:intelligence-food-opportunity-binding` were
ALREADY enrolled in the `npm test` aggregate — no wiring change was needed, and none was made.

### Engineering debt — CBK2 / PANTRY1 suites remain unwired (confirmed, not assumed)
Both fail at MODULE LOAD, not on assertions:
- `test-cbk2-intelligent-cookbook.ts` → `SyntaxError: ... does not provide an export named 'generateRecipeExplanation'`
- `test-pantry1-intelligent-pantry.ts` → `SyntaxError: ... does not provide an export named 'EMPTY_PANTRY_HOUSEHOLD_FACTS'`

They specify an EXPLAINER surface (`generateRecipeExplanation`, `generatePantryExplanation`,
`PantryHouseholdFacts`, `PlannerOpportunitySignal`, `LearnedPreference`) that does not exist
and is outside this brief. They have no `package.json` script entries and cannot be wired
until that surface is built. The six OPPORTUNITY generators they also specify ARE built and
ARE covered, in the already-enrolled binding suite.

### App verification (live dev server :5000, demo user 905 / household 546)
Driven through the product's OWN HTTP surface, never by calling engine internals.

- **AFI3 proven end-to-end.** Producer emits 5 × `shopping-item-already-in-pantry`; all 5 survive
  OD1/DEC1 delivery. `GET /api/intelligence/food-opportunities` → `resolved=true`, n=10,
  `grouped={planner:5, shopping:5}`.
- **AFI4+AFI5 proven end-to-end.** Recorded a fish allergy on an eater row via the product's own
  `PATCH /api/household/eaters/:id` (restrictionDefs derive from `hardRestrictions`, NOT
  `defaultDietTypes` — engine.ts:271). Cookbook generator then fired and rendered on `/meals`
  under its own **COOKBOOK** label — the surface AFI5's registration creates.
- Cookbook silence before that seeding was CORRECT, not a defect: `cookable-now` refuses any
  unresolvable ingredient, and `household-conflict` requires stored restrictions.

### Capture-harness evidence defects found and fixed (scripts/afi35-capture-ambient-screenshots.ts)
The first capture run recorded `live_observations: {}` and shot empty surfaces. That LOOKED like an
honest gap but was a **race** — `/api/demo/start` returns before pantry/shopping/cookbook seeding
lands. Three fixes so the evidence means what it says:
1. Poll until the household is genuinely seeded before shooting.
2. `toggled` recorded `!!s.toggle` — true whenever a toggle was merely CONFIGURED, never checking the
   click landed. Now asserts `aria-expanded`; added `surfaceFound`.
3. Wrong Cookbook testids (`ambient-intelligence-cookbook`); the mount uses `ambient-cookbook`
   (meals-page.tsx:3597). Also pre-seed `tha.ambient.*` sessionStorage so expansion is deterministic
   rather than racing the fetch.
Result: 7/7 captured, with the verbatim observation text behind each shot in `manifest.json`.

### Documentation integrity gaps — REPORTED, other workstreams' docs NOT modified
1. PANTRY1 §Suggestions item 4 is **stale**: claims the `pantry-opportunity` notice is a dead end
   (client `/companion/observations` vs server `/companion/notices`). Fixed since —
   use-companion-notices.ts:73 matches routes.ts:11760. Verified live.
2. SHOP1/CBK2/PANTRY1 "Implemented:" sections describe an explainer layer that does not exist.
3. No AFI3–AFI5 completion record existed until this session's document.

## Next action
None — session complete. Nothing committed; HEAD remains `7bfad50c` and the tree keeps the
sibling + AFI1/AFI2 work untouched. Owner to decide what gets committed.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
