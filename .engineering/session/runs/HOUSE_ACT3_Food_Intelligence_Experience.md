# HOUSE_ACT3 — Food Intelligence Experience

**Session ID:** `HOUSE_ACT3_Food_Intelligence_Experience`
**Objective:** Activate remaining production-ready Food Intelligence on food and meal experiences, without new capabilities or duplicated logic.
**Rollback ID:** `rollback/HOUSE_ACT3-food-intelligence-experience-20260718` → `b6cc6aaa`
**Stage:** Complete — awaiting owner review
**Started:** 2026-07-18

---

## Rollback

Tag on `b6cc6aaa` (HOUSE_ACT2 completion). Baseline build verified 🟢 first. The tree held uncommitted **PROD3** work across `server/intelligence/**`, `package.json` and ~15 client files — **none captured**, and **no server file touched by this programme** (verified by `git diff --name-only`).

## Checkpoints

- [x] Architecture Bootstrap read; rollback created and reported
- [x] **STOPPED before implementation** — took a scope decision to the owner (see below)
- [x] Verified all six success criteria against live data and DB row counts
- [x] Gap audit: food-detail (14 surfaces / 1 query) vs meal-detail (8 / 7 queries + 3 dead components)
- [x] Doors 1–3 implemented, client only
- [x] Build 🟢 · client typecheck 0 errors · total 94 unchanged · adoption 82/0/0
- [x] Report filed at `docs/implementation/house/HOUSE_ACT3_FOOD_INTELLIGENCE_EXPERIENCE.md`

## Scope decision (owner-directed)

**PROD3 was live on this programme's exact dependencies** — `conversation-gateway.ts`, `food-intelligence/engine.ts`, `meal-discovery-engine.ts` — and mid-change on `HouseholdSignal`, the very type priority 1 consumes, adding `resolutionFailed` with fail-closed safety semantics. Owner directed: **defer all server work, audit + client-only doors.** PROD3 has since completed, having found a green test asserting a gluten-bearing meal be delivered to a gluten-free household. Deferring was correct.

## Delivered

**The meal page never called `GET /api/meals/:id/intelligence`.** The route and its 538-line assembler existed throughout; their only consumer was the Cookbook Intelligence strip. Three components sat dead in consequence.

- **Door 1** — meal detail now calls the existing route via the existing hook (shared 5-min cache with the Cookbook strip)
- **Door 2** — `SimplyBetterChoicesPanel` fed real `nutritionEnhancement.matches` (already the exact `UpliftMatchResult[]` its prop declares)
- **Door 3** — added the missing empty guard: the panel had been rendering a *"Simply Better Choices"* heading containing **nothing, on every meal page in THA**

## Refused

**`MealFamilyConfidence` left dead deliberately.** Feeding it the assembler's `trust` would relabel *"we recognised 8 of 10 ingredients"* as *"this meal suits 80% of your household"* — the trust type's own header says *"solely ingredient resolution, never estimated"*. A component showing nothing is a smaller defect than one showing a confident wrong number.

## Largest finding — not a UI problem

*"Why a food is good"* is dark on ~**371 of 381** food pages. `healthBenefits` requires `isEvidenceBackedClaim` (needs `reviewed_at` + sourceRef), and live DB has **0 of 1,988** `knowledge_food_nutrients` and **0 of 1,366** `knowledge_food_benefits` rows reviewed. Only `NUTRITION_CONTEXT`'s 10 keys can trigger the card. **No client work opens that door** — it needs a named reviewer, not an engineer.

## Next action

**Owner to review** `docs/implementation/house/HOUSE_ACT3_FOOD_INTELLIGENCE_EXPERIENCE.md`.

Manual verification steps are specified and **have not been executed** — no browser session, no acceptance evidence. Step 1 needs a meal whose ingredients match an uplift rule (pasta / rice / potato / chicken).

Recommended next: **`HOUSE_ACT4 — The Meal Page`** (render the rest of `MealIntelligence`, now one render away after Door 1; stop discarding six `food-intelligence` fields; decide the two dead components), and **`KNOW1 — Nutrition Evidence Review`**, which is curation rather than engineering.
