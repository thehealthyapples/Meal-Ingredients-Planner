# NUT_VERIFY1 — Plant Diversity Verification

**Session ID:** `NUT_VERIFY1_Plant_Diversity_Verification`
**Objective:** Verify and complete the canonical Plant Diversity and Nutrition reporting pipeline.
**Rollback ID:** `rollback/NUT_VERIFY1-plant-diversity-verification-20260718` → `e5cd889e`
**Stage:** Complete — awaiting owner review
**Started:** 2026-07-18

---

## Rollback

Tag on `e5cd889e` (EXPERIENCE_VERIFY1). Concurrent sessions' uncommitted work — including `plant-diversity-page.tsx` (an unrelated PROD4 route rename) — deliberately **not** captured. Baseline build 🟢 first.

## Checkpoints

- [x] Architecture Bootstrap + LAUNCH1 / PROD2 / PROD3 / PROD4 / EXPERIENCE_VERIFY1 read
- [x] Rollback created and reported
- [x] Pipeline traced end-to-end; canonical owner confirmed (SoT Domain 4)
- [x] **Root cause found and reproduced empirically** (1 → 31 over real cookbook data)
- [x] Fixed counting, sectioning, and a display-name defect found *by looking*
- [x] 43 regression assertions written, registered into `npm test`
- [x] **Browser-verified: 1/30 → 32/30 on screen**
- [x] Report filed

## Root cause

**The client asked the canonical classifier a question in a shape it cannot answer.** `PlantDiversityReport.tsx` passed **whole recipe lines** to `isPlantIngredient()`, but `resolveCanonicalFood` is **exact-key, never substring** (`resolver.ts:10-11`). So `"400g tin chickpeas, drained"` → UNRESOLVED → "not a plant". *"Black Pepper" survived only because it is conventionally written with no quantity* — the complete explanation for `1/30`.

Two defects, opposite directions, both named by LAUNCH1 and left open by PROD2:
1. **under-count** — classifier on the raw line
2. **over-count** — dedupe on the ingredient slug, which SoT Domain 4 calls a defect verbatim (CPI1 S1-2)

Same bug also in `getSectionForIngredient:143` — why the Plant Based section held one ingredient.

**The server had it right all along.** The fix is the client adopting the server's existing chain (parse → singularise → `plantDiversityGroup` → dedupe on **group**). **No new rule, no algorithm change, no seed row.**

## Second root cause — found by the browser, not the diff

With counting fixed, garlic reached the table and rendered **"Arlic"**: `stripForMatch`'s unit alternation had no trailing word boundary, so `"3 garlic cloves"` matched `"3 g"` as *3 grams*. Pre-existing, and invisible for exactly as long as the first defect hid it.

## Results

**On screen: 1/30 → 32/30 plants · 1/9 → 5/9 categories · 1 → 35 plant ingredients.** Cookbook data: 1 → 31. Tests: **43 passed, 0 failed.** Build 🟢, client typecheck 0. **No server file touched.**

## The tests found my own fix was partial

The first suite version failed 13 assertions and was right to: `parseIngredient` strips quantity/unit but **not descriptors**, so `"400g tin chickpeas"` → `"tin chickpeas"` still fails. Rather than weaken the assertions, `BLOCKED_BY_DESCRIPTORS` now **characterises** the gap — a failure there means the resolver improved. Not a client defect: the server counter loses the identical lines.

## Next action

**Owner to review** `docs/implementation/NUT_VERIFY1_PLANT_DIVERSITY_VERIFICATION.md`.

Manual steps 2 (group dedupe via the UI) and 4 (honest absence) **not executed** — both proven by unit test, not by a household action. The **Nutrients** tab (a different assembler) was not re-verified.

Recommended next: **`NUT_VERIFY2 — Canonical Resolution Completion`** — R1 descriptor-aware resolution (moves the number again, upward and honestly), R2 the third display-key rival, **R5: SoT Domain 22 names two SERVER counters still deduping on the slug — the same over-count fixed here, unverified by this programme.** Also R4: the architecture docs contradict themselves on whether M4 landed and whether Plant Diversity is 173/173 or 52/173 published.
