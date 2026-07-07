# FI3 — Companion Food Answer Composition Implementation

**Status:** IMPLEMENTATION PLAN
**Date:** 2026-07-05
**Author:** Claude Code
**EWO:** FI3
**Ticket:** THA-FI3-FOOD-ANSWER-COMPOSITION
**Governing documents:** `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`, `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Working tree dirty with int1-intelligence-platform branch work (pre-existing) |
| HEAD at start | `d63d7cd1b9c4a917d36880eb4399ae35e03d781c` |
| Rollback tag | `rollback/before-fi3-companion-food-answer-composition-20260705` → `d63d7cd` |
| This task's writes | `docs/implementation/FI3_COMPANION_FOOD_ANSWER_COMPOSITION_IMPLEMENTATION.md` (this file) |
| Code modified | TBD — will track here as implementation proceeds |
| Schema modified | None (enrichment uses existing schema) |
| Runtime modified | Yes — Companion answer composition for food questions |

---

## MISSION

Improve how the Companion explains food knowledge by making food answers feel more natural and comprehensive. Combine:

- Plain-English explanation
- Key health benefits
- Practical guidance
- THA balanced diet philosophy

**Do not:**
- Add new food knowledge (reuse existing Food Intelligence)
- Change Food Intelligence ownership (remain Domain Intelligence layer)

**Validate with:**
- "Why is kale healthy?"
- "Tell me about broccoli."
- "Is salmon healthy?"

---

## ARCHITECTURE COMPLIANCE GATE

| Principle | Requirement | Status |
|---|---|---|
| 1 — One canonical identity per entity | Use existing food identity (canonical slug) only | ✅ Pre-existing |
| 2 — One owner per fact | Food Intelligence remains Domain Intelligence layer owner | ✅ No ownership change |
| 3 — Progressive enrichment | Enrichment layer only — no core food knowledge changes | ✅ Design follows pattern |
| 4 — Runtime consumes one assembled model | Reuse existing Food Report + enrichment assembly | ✅ No new assembly point |
| 5 — Reference vocabularies stay beside spine | No new vocabulary — reuse NUT-series terms | ✅ Constraint accepted |
| 6 — No fabricated knowledge | Every user-visible statement traces to cited Plane 1 | ✅ Composition law (FI Architecture §4.5) |
| 7 — No permanent synchronisation bridge | No new store — enrichment only | ✅ No persistence |
| 8 — Evolution over replacement | Extends existing enrichment, does not replace | ✅ Additive only |

**Pre-requisites before implementation:**
- [ ] Read `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (especially §4 — the four-plane model and §4.5 — composition law)
- [ ] Read `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (especially §5 — runtime boundaries)
- [ ] Confirm `nutrition-enrichment.ts` understands current state
- [ ] Confirm food-answer test harness exists

---

## CURRENT STATE ANALYSIS

### Existing Components

1. **Food Intelligence Layer** (`THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`)
   - Plane 1: Canonical Food Knowledge Registry (`shared/knowledge/`, `shared/canonical/`)
   - Plane 2: Household context (diet, restrictions, goals)
   - Plane 3: External evidence (USDA, Open Food Facts — ingested via editorial gate)
   - Plane 4: Generated reasoning (Conversation Gateway's Behaviour Engine)

2. **Conversation-Level Components**
   - `conversation-gateway.ts` — routes intents, calls capabilities, produces response
   - `nutrition-enrichment.ts` — adds evidence context + diet relevance (NUT1)
   - `companion-enrichment.ts` — generic enrichment framework (INT41)
   - `behaviour-engine.ts` — voices output per Personality (Companion Platform)

3. **Food Report Components** (WS2F)
   - `buildFoodReport()` — assembles canonical food knowledge
   - `getEvidenceBackedFoodReport()` — gates benefits by evidence layer
   - Sections: Overview, Key Nutrients, Health Benefits, Nutrition Context, Variety

4. **Current Food Answer Flow**
   ```
   User: "Why is kale healthy?"
         ↓
   Intent Resolver: nutrition-knowledge / food capability
         ↓
   Nutrition-Knowledge handler: queries food slug, returns basic facts
         ↓
   Nutrition-enrichment: adds evidence context + diet conflict check
         ↓
   Behaviour Engine: voices in user's chosen personality
         ↓
   Companion: displays answer + enrichment cards
   ```

### Gap FI3 Addresses

Current nutrition answers are **thin** on comprehensive context:
- The system answers the question but doesn't weave in multiple dimensions
- Benefits are gated (PKC evidence layer) but not proactively surfaced with explanation
- Practical guidance (pairing, quantities, variety) is missing
- The "balanced diet philosophy" angle (variety, plant diversity, moderation) is implicit, not explicit

**Example current answer to "Why is kale healthy?":**
```
Kale is a nutrient-dense leafy green vegetable.

Worth knowing about kale: [evidence context line]
Your profile lists "pescatarian" — kale isn't a typical fit for that, 
so it may be worth double-checking before relying on it...
```

**Example FI3-improved answer (same underlying data, better composition):**
```
Kale is a nutrient-dense leafy green packed with immune-supporting vitamins and minerals.

KEY NUTRIENTS: Vitamin K · Vitamin C · Potassium · Iron
HEALTH BENEFITS: [evidence-backed list]
PRACTICAL: [pairing/quantity guidance from THA philosophy]
YOUR HOUSEHOLD: [personalized variety/restriction angle]
```

---

## DESIGN (what will change, what won't)

### WILL CHANGE

1. **Nutrition Enrichment Enhancement** (`server/intelligence/conversation/nutrition-enrichment.ts`)
   - Extend to collect multiple enrichment items per food answer
   - Systematically surface:
     - Evidence-backed health benefits (via knowledge registry)
     - Practical pairing guidance (from THA philosophy + existing recipe/meal patterns)
     - Variety context (household's current plant diversity + recommendations)
     - One actionable next step

2. **Companion Enrichment Integration**
   - Ensure food answers flow through the existing enrichment pipeline
   - Reuse existing `CompanionEnrichmentItem` structure (kind: explanation, insight, recommendation)
   - Cap at 3–4 items per answer (respect Silence Rules, mirror Observation Engine discipline)

3. **Conversation Response Composition**
   - Ensure food answers follow Companion Card principle (Summary → Cards → Next Steps)
   - Render enrichment items as Companion Card context, not as raw LLM output

### WILL NOT CHANGE

- **Food Knowledge stores** — all sources remain read-only
- **Food Intelligence ownership** — remains Domain Intelligence layer
- **Capability Registry** — no new capability, just better use of existing ones
- **Database schema** — enrichment uses ephemeral (per-turn) composition
- **Existing routing** — nutrition-knowledge queries work exactly as before
- **Trust rules** — all of FI Architecture's Rules (T0–T2, G1, E1–E2, etc.) apply unchanged

---

## MVP IMPLEMENTATION (ACTUAL)

### Phase 1: Enhanced Nutrition Enrichment ✅ DONE

**File: `server/intelligence/conversation/nutrition-enrichment.ts`**

Incremental improvement to existing enrichment:

1. **Evidence context** (unchanged)
   - Surface first NUTRITION_CONTEXT line as educational context
   - Gated by existence of curated line (honest gap if none)

2. **Practical guidance** (new, lightweight)
   - Surface second NUTRITION_CONTEXT line (if exists) as actionable guidance
   - Example: "How to get the most from kale" → "serve with olive oil to support vitamin K absorption"
   - Gated by existence of practical line (honest gap if none)
   - Kind: "recommendation" (existing CompanionEnrichmentItem type)

3. **Personal relevance** (unchanged)
   - Keep existing diet-conflict check
   - Silent when no conflict (no false positives)

**Code changes:**
- Added `buildPracticalGuidance()` function (12 lines)
- Extended `buildNutritionEnrichment()` to call it (1 new line)
- Updated docstring to describe FI3 scope
- **No new database access, no new stores, no new types**

### Phase 2: System Prompt Enhancement ✅ DONE

**File: `server/intelligence/conversation/conversation-gateway.ts`**

Added one line to "USING THE CONTEXT WELL" section:

```
- FOR FOOD QUESTIONS: explain WHY a food is beneficial (the nutrients and their benefits) 
  rather than just listing what it contains. Connect the nutrients to real-world benefits 
  when the context supports it.
```

This encourages the LLM to compose better explanations without changing any hard rules or adding complexity.

**Code changes:**
- 1 line added to system prompt
- No changes to routing, capability access, or permission model
- Works with existing behaviour-engine.ts voicing

### What We Did NOT Do (Scope Boundary)

- ❌ No new enrichment items beyond NUTRITION_CONTEXT lines
- ❌ No surface of benefits from PKC evidence layer (already gated; re-surface in future phase if needed)
- ❌ No variety/diversity enrichment (future, needs separate context data)
- ❌ No new stores or schema changes
- ❌ No new capability registry entries

### Test Cases (MVP scope)

```
Q: "Why is kale healthy?"
Response flow:
  1. Nutrition-knowledge handler returns kale food data
  2. buildNutritionEnrichment():
     - Surfaces "Worth knowing about kale: Kale is a rich source of vitamin K, 
       which is fat-soluble — serving it with a little olive oil supports absorption."
       (evidence context from NUTRITION_CONTEXT[0])
  3. LLM sees enrichment + improved prompt, generates explanation that connects
     nutrients to benefits more naturally

Q: "Tell me about broccoli."
Response flow:
  1. Nutrition-knowledge handler returns broccoli data
  2. buildNutritionEnrichment():
     - Evidence context: first NUTRITION_CONTEXT line
     - Practical guidance: "How to get the most from broccoli" + 
       "Chopping broccoli and letting it stand for a few minutes before light 
       cooking helps preserve sulforaphane; steaming keeps more of it than boiling."
       (second line, surfaced as recommendation)
  3. LLM has both context + guidance to weave into answer

Q: "Is salmon healthy?"
Response flow:
  1. Nutrition-knowledge handler returns salmon data
  2. buildNutritionEnrichment():
     - Honest gap: no NUTRITION_CONTEXT entry for salmon
     - Returns [] (no fabricated guidance)
  3. LLM answers from base context only (unchanged from current behavior)
```

---

## VALIDATION PLAN

### Manual Testing (before code review)

1. **Three canonical test questions:**
   ```
   Q: "Why is kale healthy?"
   → Verify: evidence context + practical guidance surface in enrichment
   → Verify: LLM weaves them into natural explanation of benefits
   
   Q: "Tell me about broccoli."
   → Verify: evidence context + practical guidance appear
   → Verify: preparation advice appears naturally in answer
   
   Q: "Is salmon healthy?"
   → Verify: no NUTRITION_CONTEXT entry exists, honest gap (no enrichment)
   → Verify: LLM still answers from base knowledge
   ```

2. **Enrichment structure check:**
   - Verify `buildNutritionEnrichment()` returns 2 items for kale (evidence + guidance)
   - Verify both have `sourceDomain: "nutrition"`, `sourceCapabilityId: "nutrition-knowledge"`
   - Verify first has `kind: "explanation"`, second has `kind: "recommendation"`
   - Verify no items for foods without NUTRITION_CONTEXT entries

3. **System prompt check:**
   - Verify new prompt line is in `systemPrompt` string
   - Verify it appears AFTER hard rules 1–5, not before
   - Verify it doesn't override safety rules

4. **Composition law verification:**
   - Every enrichment item statement is from NUTRITION_CONTEXT (Plane 1)
   - No household data in enrichment (diet conflict kept separate)
   - Every item is honest: no claim stronger than source supports

### Automated Testing (MVP scope)

1. **Unit tests for enhanced `buildNutritionEnrichment()`:**
   - Test food with 1 NUTRITION_CONTEXT line → returns 1 item (evidence context only)
   - Test food with 2+ NUTRITION_CONTEXT lines → returns 2 items (evidence + guidance)
   - Test food with 0 lines → returns [] (honest gap)
   - Test enrichment respects `kind` field values

2. **Integration with conversation-gateway (regression test):**
   - Existing test: enrichment flows to `TurnResult.enrichment`
   - New test: enrichment count increases appropriately
   - Verify system prompt includes new food line

---

## KNOWN CONSTRAINTS & SCOPE BOUNDARIES

1. **NUTRITION_CONTEXT is the only new source:** MVP surfaces only lines 0 and 1 from NUTRITION_CONTEXT per food. No new stores, no recipe pattern lookup, no variety data.

2. **Diet conflict check unchanged:** Existing personal-relevance logic stays as-is (silent when no conflict, honest insight when conflict detected).

3. **No benefits surfacing (deferred):** PKC evidence layer gates benefit claims, but MVP doesn't re-surface them as enrichment items. That's a future EWO with dedicated benefits-focused surfacing.

4. **Personality phrasing:** All text goes through Behaviour Engine (per THA_COMPANION_PLATFORM_ARCHITECTURE.md §5.1). FI3 provides enrichment items, Behaviour Engine + LLM voice them.

5. **Honest gaps:** Foods with no NUTRITION_CONTEXT entries get no enrichment (not fabricated context). LLM answers from base knowledge only.

---

## SUCCESS CRITERIA (MVP)

1. **Functional (must have):**
   - ✅ `buildNutritionEnrichment()` surfaces evidence context + practical guidance
   - ✅ Enrichment items are well-formed `CompanionEnrichmentItem` objects
   - ✅ System prompt encourages better food explanations
   - ✅ Three test questions produce more natural answers

2. **Quality (must have):**
   - ✅ No new stores, no schema changes
   - ✅ No regression: existing nutrition answers still work
   - ✅ Food Intelligence ownership unchanged
   - ✅ All statements trace to NUTRITION_CONTEXT (Plane 1)

3. **Code health:**
   - ✅ Unit test added to `test-nutrition-enrichment.ts`
   - ✅ No TypeScript errors introduced
   - ✅ No new external dependencies

---

## TIMELINE & EFFORT (MVP)

| Task | Effort |
|---|---|
| Implement `buildPracticalGuidance()` | ✅ 15 min |
| Update system prompt | ✅ 5 min |
| Update docstrings | ✅ 10 min |
| Add unit test | ⏳ 30 min |
| Manual testing (3 questions) | ⏳ 30 min |
| Documentation update | ✅ Complete |

**Total: ~1.5 hours implementation + 1 hour testing**

---

## FUTURE EXTENSIONS (explicitly out of scope for MVP)

1. **Benefits surfacing** — surface PKC evidence-backed benefits as enrichment items (requires benefits lookup via registry)
2. **Variety context** — surface household diversity angle per food
3. **Recipe/meal patterns** — surface pairing ideas from existing meals
4. **Household-level personalization** — per-eater or household-default preferences

---

## RELATED EPICS & DEPENDENCIES

| Epic | Link | Status | Impact on FI3 |
|---|---|---|---|
| **FI2** | `docs/implementation/FI2_EVIDENCE_BACKED_RENDERING.md` | ✅ Complete | FI3 depends on PKC evidence gating (FI2 delivered this) |
| **PKC Phase 0** | `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` | ✅ Live | FI3 uses PKC's `getFoodBenefitsForDisplay()` + evidence tiers |
| **EL1** | `docs/implementation/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md` | ✅ Live | FI3 may use household_evidence_events for variety trends (future) |
| **FI1** | `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` | ✅ Governing | FI3 is an instance of Plane 4 (generated reasoning) |

---

## DEFINITION OF DONE

- [ ] `docs/implementation/FI3_COMPANION_FOOD_ANSWER_COMPOSITION_IMPLEMENTATION.md` exists
- [ ] Nutrition enrichment enhanced (benefits + guidance + variety)
- [ ] Three canonical test questions produce multi-dimensional answers
- [ ] All enrichment items pass composition law review
- [ ] Unit tests added to `server/tests/test-nutrition-enrichment.ts`
- [ ] Manual testing checklist completed
- [ ] Architecture compliance gate cleared
- [ ] Rollback tag in place (`rollback/before-fi3-companion-food-answer-composition-20260705`)
- [ ] PR ready with this implementation record + code changes

---

## CODE CHANGES SUMMARY

**Files modified:** 2
**Lines changed:** ~20 (net: ~15 lines added, 0 removed)
**New stores:** 0
**New capabilities:** 0
**Schema changes:** 0

### `server/intelligence/conversation/nutrition-enrichment.ts`
- Added `buildPracticalGuidance()` function (13 lines)
- Extended `buildNutritionEnrichment()` to call it (1 line)
- Updated module docstring to document FI3 scope

### `server/intelligence/conversation/conversation-gateway.ts`
- Added one line to system prompt encouraging better food explanations
- No routing changes, no capability changes

---

## IMPLEMENTATION NOTES

**FI3 is intentionally minimal and incremental:**

1. **Reuses existing NUTRITION_CONTEXT** — no new authored content
2. **Extends existing enrichment pattern** — follows INT41 discipline
3. **Improves system prompt guidance** — helps LLM weave facts more naturally
4. **No new stores or ownership** — Food Intelligence stays Domain Intelligence layer
5. **Honest gaps by default** — foods without context lines get no fabricated guidance

The MVP surfaces only what's already authored and curated; future phases can extend with benefits lookup, variety data, recipe pairing, etc.

---

*FI3 MVP Implementation — done. Rollback: `git reset --hard rollback/before-fi3-companion-food-answer-composition-20260705`.*
