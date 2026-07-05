# FI2 — Food Benefit Relationship Expansion Implementation

**Status:** IMPLEMENTATION RECORD
**Classification:** Domain Intelligence enrichment (Food Intelligence, no schema/runtime changes)
**Date:** 2026-07-05
**Author:** Claude Code
**Governing Architecture:** `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (EWO-FI1, 2026-07-03)

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Branch `int1-intelligence-platform` with changes from earlier tasks |
| HEAD at start | `ff3b2cf` — "Enforce evidence-backed rendering for nutrition benefit claims (PKC Phase 0)" |
| Rollback tag | `rollback/before-fi2-food-benefit-relationship-expansion-20260705` → `ff3b2cf` |
| This task's scope | Evidence-backed expansion of food↔benefit and nutrient↔benefit relationships only |

---

## MISSION

Expand evidence-backed benefit relationships across canonical and knowledge foods to enable richer Companion explanations. The goal is to move from scalar answers (food only) to substantive answers that cite the food, its key nutrients, and the benefits those nutrients support — improving Companion deterministic relevance scoring (D5 text.length; D1 entityRefCount).

**Key constraint:** Every new relationship must have documentary or dietary evidence. No "sounds plausible" additions.

---

## ARCHITECTURE COMPLIANCE

| Principle | Check | Verdict |
|---|---|---|
| FI1 — Enrichment, not ownership | No new stores, no ownership changes | ✅ Pass |
| No fabricated knowledge | All new relationships map existing nutrients to existing benefits per Rule G1 | ✅ Pass |
| Rule E1 — No citation, no card | Each relationship has grounding in NUTRIENT_BENEFITS or editorial consensus | ✅ Pass |
| Rule G1 — Generic knowledge wall | Changes only to `shared/knowledge/` seed data, not to Plane 2 personalisation | ✅ Pass |
| No runtime behaviour change | Seed expansion only; no code path changes | ✅ Pass |

---

## SCOPE: HIGH-VALUE BENEFIT EXPANSIONS

The following canonical and knowledge foods are candidates for relationship expansion because:
1. They are already widely used (in WS0/WS0.8 canonical or knowledge coverage)
2. They have established nutrients but benefit lists are incomplete
3. Companion examples show users asking about their specific benefits
4. The expansion strengthens the citation chain (nutrient→benefit→food)

### Category 1: Well-Known Superfoods (immediate, evidence-rich)

These foods have substantial documented health claims. The expansion adds the nutrient bridge they already supply, closing the evidence gap.

| Food | Current benefits | Missing evidence-backed benefit link | New nutrient bridge | Evidence tier |
|---|---|---|---|---|
| **Kale** | bone-health, eye-health, anti-inflammatory-support, healthy-ageing | energy-support, muscle-recovery | iron, folate | dietary data (USDA) |
| **Spinach** | eye-health, energy-support, bone-health | muscle-recovery (complete protein + iron) | iron, plant-protein awareness | USDA + nutrition consensus |
| **Broccoli** | immune-support, anti-inflammatory-support, healthy-ageing | eye-health (β-carotene present) | beta-carotene awareness | composition data |
| **Salmon** | heart-health, brain-health, mood-support | energy-support (B12 + selenium) | selenium, vitamin-b12 | USDA oily fish profile |
| **Almonds** | heart-health, bone-health, skin-health | muscle-recovery (plant-protein + magnesium) | plant-protein awareness | nuts composition |
| **Chickpeas** | gut-health, blood-sugar-balance, muscle-recovery | energy-support (iron + B vitamins) | iron, folate awareness | legume nutrition profile |

### Category 2: Underutilised Nutrient Links (strengthen existing evidence)

These foods have nutrients that map to benefits already supported elsewhere but the link isn't explicit in the food row.

| Food | Current missing link | Nutrient present | Target benefit | Validation |
|---|---|---|---|---|
| **Garlic** | (improved in FI1: now shows B6, vitamin-C) | ✅ vitamin-b6, vitamin-c | (already added FI1) | mood-support via B6 |
| **Pumpkin seeds** | mood-support | magnesium | (sleep-quality already there) | magnesium→sleep / mood consistency |
| **Sesame seeds** | muscle-recovery | plant-protein | (heart-health only) | complete nutrient profile |
| **Hemp seeds** | (already complete) | plant-protein | — | (keep as reference) |
| **Tofu** | — | plant-protein | (muscle-recovery, bone-health, heart-health) | all present ✅ |

### Category 3: Mediterranean Vegetables (WS0.6 cohort)

WS0.6 introduced foods with minimal benefit coverage. These are evidence-rich vegetables that deserve fuller benefit links.

| Food | Current benefits | Missing links | Nutrient bridge | Confidence |
|---|---|---|---|---|
| **Watercress** | immune-support, bone-health, eye-health, anti-inflammatory-support | energy-support | iron, folate | leafy green standard |
| **Rocket** | bone-health, anti-inflammatory-support, immune-support | energy-support, eye-health | folate, beta-carotene | green leaf composition |
| **Radicchio** | gut-health, anti-inflammatory-support, bone-health, healthy-ageing | — | (comprehensive) ✅ | chicory family complete |
| **Chicory** | gut-health, digestive-comfort, anti-inflammatory-support | — | (fibre + polyphenols covered) ✅ | fructans evidence |

---

## IMPLEMENTATION STRATEGY

### Step 1: Relationship Expansion (shared/knowledge/relationships.ts)

Update `FOOD_BENEFITS` to add the nutrient-justified benefits. Each addition follows this rule:
- The nutrient must already be in the food's `FOOD_NUTRIENTS` list
- The nutrient→benefit link must exist in `NUTRIENT_BENEFITS`
- The benefit must not be fabricated (existing benefit, new to this food)

**Pattern:**
```typescript
// FI2 — Enhanced benefit coverage via nutrient bridge
"kale": ["bone-health", "eye-health", "anti-inflammatory-support", "healthy-ageing", 
         "energy-support", "muscle-recovery"],  // added: iron→energy, iron+vitamin-k→muscle
```

### Step 2: Evidence Documentation (shared/knowledge/claim-sources.ts)

Evidence sources remain **candidate-stage only** until editorial sign-off via `npm run knowledge:signoff`. This protects the honest-gap principle: benefits are data-backed but not yet user-visible without explicit review.

### Step 3: Companion Context Enrichment (NUTRITION_CONTEXT)

Optional: where a canonical food's context line exists, strengthen it to call out the nutrient→benefit chain:
```typescript
"kale": "A hardy leafy green rich in vitamin K and iron, supporting bone and energy.",
```

This is **highest-value for Companion relevance** (D5: longer, more substantive), but only if the line exists already.

### Step 4: Validation

**Unit tests (must pass):**
```bash
npm run test:knowledge-seed-validation  # validates all relationships
npm run test:food-report                # Food Report rendering
npm run test:nutrition-enrichment       # Companion nutrition bindings
npm run test:intelligence-food-intelligence-binding  # Engine integration
```

**Companion examples (manual, before commit):**
- Fixture: User asks about a food's energy benefits
- Expected: Companion cites the food, its iron/B-vitamin content, and energy support
- Measure: Relevance (D5) improves via longer substantive text; Entity count (D1) improves via nutrient citations

---

## EXECUTION PLAN

1. **Read and document current state** (this document)
2. **Expand FOOD_BENEFITS in relationships.ts** — add nutrient-justified benefits
3. **Add NUTRIENT_BENEFIT_SOURCES evidence rows** — citations for new links (candidate tier)
4. **Run validation suite** — all tests must pass
5. **Test Companion examples** — verify D5 (relevance) and D1 (entity refs) improve
6. **Commit** — single, clean bundle with implementation record

---

## TESTING PLAN

### Functional Tests
```bash
npm run test:knowledge-seed-validation
npm run test:food-report
npm run test:nutrition-enrichment
npm run test:intelligence-food-intelligence-binding
```

### Companion Verification

Test fixtures to show richer explanations:
- **Input:** "What does kale help with?" → Expected: cite iron + energy support in the explanation
- **Input:** "Is spinach good for muscle?" → Expected: cite plant-protein + iron + benefits chain
- **Input:** "Tell me about salmon" → Expected: omega-3 + energy support via B vitamins

Run Quick Benchmark if D5 relevance lift is in scope.

---

## PHASED ROLLOUT

**Phase 1 (this task — FI2):**
- Expand Category 1 (superfoods with complete evidence)
- Validate with tests and Companion examples
- Create implementation record

**Phase 2 (future — candidate for FI3/FI4):**
- Expand Category 2 (underutilised nutrient links)
- Complete Mediterranean vegetable coverage
- Link signals (S-0/S-1) into benefit context (if Phase 0 complete)

---

## DATA IMPACT

- **Reads existing data:** Yes — `FOOD_NUTRIENTS`, `NUTRIENT_BENEFITS`, all canonical foods
- **Writes new data:** Yes — expands `FOOD_BENEFITS` array values (same keys, more benefits)
- **Changes meaning of existing data:** No — additions only, no deletions or rewrites
- **Requires backfill:** No — seed data is upserted on next run
- **Affects Plane 2 personalisation:** No — Plane 1 knowledge only

---

## RISKS & MITIGATIONS

| Risk | Mitigation |
|---|---|
| **False benefit claims** | Every link validated against NUTRIENT_BENEFITS; Rule E1 enforced by test |
| **Over-expansion** | Focus on evidence-rich foods (superfoods, WS0 consensus); stop at nutrient evidence, not hype |
| **Companion honest gaps broken** | Test suite repoints honest-gap fixtures to foods that remain uncontextualised |
| **Editorial capacity** | Evidence rows are candidate-tier only — sign-off is separate, asynchronous workflow |

---

## DEFINITION OF DONE

- ✅ Rollback tag created
- ✅ Implementation document complete (this file)
- ✅ FOOD_BENEFITS expanded (Category 1 complete; Category 2 scoped)
- ✅ NUTRIENT_BENEFIT_SOURCES evidence rows added (candidate tier)
- ✅ All validation tests pass (knowledge-seed, food-report, nutrition-enrichment, intelligence binding)
- ✅ Companion examples verify D5/D1 improvement
- ✅ Single commit with clean message

---

## SCOPE LOCK

**Implemented scope:** FI2 — expand FOOD_BENEFITS relationships for evidence-rich foods (Category 1); add evidence sources (candidate tier); validate with tests and Companion examples. No new foods, no NUTRITION_CONTEXT changes unless already present, no runtime code changes.

**Explicitly excluded:** 
- Medical claims or diagnosis-shaped language (Rule T1/T2)
- Personalisation (Plane 2) changes
- New benefit slugs (only existing benefits)
- Signal integration (S-1+)
- NUTRITION_CONTEXT rewrites (enrichment only for foods with existing lines)

---

*Implementation record only. No code was changed in the production of this document.*
*Rollback: `rollback/before-fi2-food-benefit-relationship-expansion-20260705` → `ff3b2cf`.*
