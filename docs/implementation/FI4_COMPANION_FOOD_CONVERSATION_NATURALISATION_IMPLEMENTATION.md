# FI4 — Companion Food Conversation Naturalisation Implementation

**Status:** IMPLEMENTATION PLAN
**Date:** 2026-07-05
**Author:** Claude Code
**EWO:** FI4
**Ticket:** THA-FI4-FOOD-CONVERSATION-NATURALISATION
**Governing documents:** `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Working tree dirty with prior int1 work (pre-existing) |
| HEAD at start | Current main branch HEAD |
| Rollback tag | `rollback/before-fi4-companion-food-conversation-naturalisation-20260705` |
| This task's writes | TBD — will track as implementation proceeds |
| Code modified | TBD |
| Schema modified | None |
| Runtime modified | Yes — food answer wording and routing |

---

## MISSION

Refine Companion food conversations to feel natural, educational, and practical while remaining fully grounded in Food Intelligence. Focus on:

- **Fix routing issues** (e.g., mushroom questions not reaching correct handlers)
- **Reduce repetitive openings** (vary how answers start to sound more natural)
- **Improve food-specific wording** (use language tailored to each food, not generic)
- **Add practical takeaway** (one actionable insight where grounded data supports it)
- **Verify accuracy** (ensure all food-specific statements are accurate and sourced)

**Do not:**
- Add new food knowledge
- Change Food Intelligence ownership
- Add new stores or capabilities

**Validate with:**
- "Why is kale healthy?"
- "Tell me about mushrooms."
- "Is salmon healthy?"
- "Tell me about broccoli."

---

## CURRENT STATE ANALYSIS

### Issue 1: Food Question Routing

**Problem:** Some food questions may not route to the correct intent/capability.

**Current routing logic:**
- Pattern-intent-resolver.ts uses regex matchers for food questions
- Common patterns: "what is X good for?", "why is X healthy?", "tell me about X"
- Routes to: `nutrition-knowledge` capability with `explain` verb
- Entity extraction: converts to slug via `toSlug()` (lowercase, hyphenate, strip special chars)

**Known gaps:**
- Preparation instructions ("how do I cook mushrooms?") may route to nutrition-knowledge instead of a more appropriate handler
- Plural/variety names ("shiitake mushrooms", "button mushrooms") need canonical resolution
- Multi-word food names may be truncated or misparsed

**Example problem — "Tell me about mushrooms":**
- Should route to: nutrition-knowledge explain { foodSlug: "mushroom" }
- Actually routes to: ✓ (works via regex pattern)
- But: no special handling for plural vs. canonical

### Issue 2: Repetitive Openings

**Problem:** LLM tends to start food answers the same way:
```
"Kale is a nutrient-dense leafy green vegetable..."
"Mushroom is a fungal food with nutritional benefits..."
"Salmon is a fatty fish rich in omega-3s..."
"Broccoli is a cruciferous vegetable..."
```

**Root cause:**
- System prompt doesn't guide variation in opening style
- LLM defaults to same structure: "[Food] is a [category] [descriptor]..."
- No example variations in system prompt to encourage diversity

**Impact:** Conversations feel monotonous despite accurate content

### Issue 3: Generic vs. Food-Specific Wording

**Problem:** Answers use generic phrasing instead of food-specific language:

| Generic | Food-specific |
|---------|---|
| "contains vitamins" | "rich in vitamin K" |
| "has health benefits" | "supports bone health and blood clotting" |
| "good for diet goals" | "pairs well with fats to aid absorption" |
| "has practical uses" | "preserve sulforaphane by chopping and letting stand before cooking" |

**Current state:** FI3 provides enrichment, but system prompt doesn't guide LLM to use it well

### Issue 4: Practical Takeaways

**Problem:** No single, actionable insight stands out from each answer.

**Example current answer to "Why is kale healthy?":**
```
Kale is a nutrient-dense leafy green. [Facts about nutrients.] 
Your profile lists "pescatarian" — kale fits well with that.
```

**Example improved (FI4 goal):**
```
Kale is a nutrient-dense leafy green, especially valued for vitamin K 
and immune-supporting antioxidants. Here's the practical angle: 
serve it with a little olive oil or other fat — vitamin K is fat-soluble, 
so the fat helps your body absorb it. That's why kale with olive oil 
dressing is more nutritious than kale alone.
```

**What's missing:** A single, clear, actionable insight that ties nutrients to real-world benefit

### Issue 5: Accuracy Verification

**Problem:** System doesn't validate that food-specific claims are accurate.

**What needs verification:**
- "Mushrooms contain vitamin D" — ✓ (in NUTRITION_CONTEXT)
- "Kale is rich in vitamin K" — ✓ (in NUTRITION_CONTEXT)
- "Salmon is a fatty fish" — ✓ (but need to verify not overstated)
- "Broccoli has sulforaphane" — ✓ (in NUTRITION_CONTEXT)

**Current state:** LLM can say anything; no gating on accuracy

---

## DESIGN (what will change, what won't)

### WILL CHANGE

1. **System Prompt Enhancement** (`server/intelligence/conversation/conversation-gateway.ts`)
   - Add food-specific guidance section
   - Provide opening variation examples
   - Guide LLM to surface one practical takeaway
   - Emphasize grounded, sourced language only

2. **Intent Resolver Routing** (`server/intelligence/pattern-intent-resolver.ts`)
   - Verify food question patterns catch common variations
   - Ensure mushroom/fungi questions route correctly
   - Add guards for prep/cooking questions (forward to different handler or gap)

3. **Enrichment Context Utilization** (conversation-gateway.ts)
   - Ensure system prompt explicitly references available enrichment
   - Guide LLM to surface practical guidance from enrichment naturally
   - Mark which enrichment items provide "the practical takeaway"

4. **Example Openings** (personality-registry.ts or system prompt)
   - Provide 3–4 varied opening templates for food answers
   - Examples: nutrient-focused, benefit-focused, practical-focused, variety-focused
   - LLM picks one randomly per food to vary conversation feel

### WILL NOT CHANGE

- Food Intelligence ownership (stays Domain Intelligence layer)
- Food knowledge stores (all read-only)
- Enrichment data structure (reuse existing CompanionEnrichmentItem)
- Capability registry (no new capabilities)
- Database schema (no persistence, all ephemeral)
- Trust rules or safety gates

---

## IMPLEMENTATION APPROACH

### Phase 1: Fix Routing Issues (targeted)

**File: `server/intelligence/pattern-intent-resolver.ts`**

1. **Verify existing patterns catch mushroom questions**
   - Test: "tell me about mushrooms" → nutrition-knowledge explain { foodSlug: "mushroom" }
   - Test: "why are mushrooms healthy?" → same routing
   - Test: "shiitake mushrooms" → resolved to canonical slug "mushroom"

2. **Add guard for cooking/prep questions**
   - Pattern: "how do I cook X?" / "how to prepare X?" / "recipe for X?"
   - Action: Return honest gap or route to different handler (if exists)
   - Goal: Don't send cooking questions to nutrition-knowledge

3. **Verify plural handling**
   - "mushrooms" → "mushroom" ✓ (already works via toSlug)
   - "broccoli" → "broccoli" ✓
   - "kale" → "kale" ✓
   - Validate in tests

### Phase 2: System Prompt Enhancement (natural wording)

**File: `server/intelligence/conversation/conversation-gateway.ts`**

Add a new section to system prompt:

```
FOOD CONVERSATIONS:
When answering about a specific food:
1. Vary your opening — use different structures across answers
   Examples: nutrient angle ("rich in..."), benefit angle ("supports..."), 
   practical angle ("preserve... by...")
2. Use food-specific language — "vitamin K" not "vitamins", 
   "fat-soluble" not "works better with fats"
3. Connect nutrients to real benefits — explain the "why", not just "what"
4. Highlight ONE practical takeaway that grounds the answer
   Source from enrichment where available
5. Every claim must appear in the context data provided
   Never guess or fabricate food facts
```

### Phase 3: Example Opening Variations (reduce repetition)

**Two approaches (pick one):**

**Option A: LLM-guided via prompt (simpler, no code)**
```
FOOD OPENINGS — start this way (pick one, vary across turns):
Pattern 1 — nutrient-focused: "[Food] is prized for its [specific nutrient]..."
Pattern 2 — benefit-focused: "[Food] is particularly valued for [benefit]..."
Pattern 3 — practical-focused: "What makes [food] special is [practical angle]..."
Pattern 4 — sourcing-focused: "[Food] belongs to the [family] family, which means..."
```

**Option B: Code-based personality templates (more structured)**
- Add `foodOpeningTemplates` to each personality
- LLM sees 4 example templates, picks one
- Ensures consistency across turns per personality

**Recommendation:** Option A (simpler, no code change, more flexible)

### Phase 4: Practical Takeaway Surfacing (actionable insight)

**File: `server/intelligence/conversation/conversation-gateway.ts`**

Update system prompt:

```
THE PRACTICAL TAKEAWAY:
Every food answer should highlight ONE actionable insight that ties nutrients to benefits.
Look for this in the enrichment "recommendation" items provided.
Example: "Here's the practical angle: kale + olive oil lets your body absorb 
the vitamin K more effectively — that's why traditional pairings often work."
Surface it naturally, not as a separate bullet point.
```

This works because FI3 already surfaces practical guidance via enrichment recommendations.

### Phase 5: Accuracy Verification (no fabrication)

**File: `server/intelligence/conversation/conversation-gateway.ts`**

Strengthen existing hard rule #2:

```
HARD RULE #2 (enhanced):
Nutrition and health: only state what is explicitly in the context.
- Never claim a food "helps with" anything beyond what's in the enrichment
- Never invent nutrient content — only state what's explicitly provided
- Food categories must match the context (e.g. "salmon is a fish" ✓, 
  "salmon is a leafy green" ✗)
- When doubt arises, describe what you DO have rather than what you guess
```

---

## VALIDATION PLAN

### Manual Testing (four canonical questions)

1. **"Why is kale healthy?"**
   - ✓ Routes to nutrition-knowledge explain { foodSlug: "kale" }
   - ✓ Opening varies (not "kale is a leafy green..." every time)
   - ✓ Explains vitamin K + fat-soluble pairing
   - ✓ Surfaces practical takeaway: olive oil pairing

2. **"Tell me about mushrooms."**
   - ✓ Routes to nutrition-knowledge explain { foodSlug: "mushroom" }
   - ✓ Different opening style than kale answer
   - ✓ Mentions vitamin D (unique to fungi/few plant sources)
   - ✓ Practical takeaway: sunlight exposure method

3. **"Is salmon healthy?"**
   - ✓ Routes to nutrition-knowledge explain { foodSlug: "salmon" }
   - ✓ No enrichment for salmon (honest gap)
   - ✓ Answers from base context only
   - ✓ Never fabricates benefits not in context

4. **"Tell me about broccoli."**
   - ✓ Routes to nutrition-knowledge explain { foodSlug: "broccoli" }
   - ✓ Opening varies from other answers
   - ✓ Connects sulforaphane to preparation method
   - ✓ Practical takeaway: chopping + standing + steaming preserves it

### Accuracy Checks

- [ ] No claims beyond NUTRITION_CONTEXT + CANONICAL_SEED
- [ ] Food categories correct (salmon = "fish", kale = "leafy green", etc.)
- [ ] Nutrient names specific (not generic "vitamins")
- [ ] Practical guidance sourced from enrichment only
- [ ] Opening styles vary across four test questions

### Routing Verification

- [ ] Pattern-intent-resolver tests pass
- [ ] "mushrooms" → foodSlug: "mushroom" ✓
- [ ] Cooking questions: handled appropriately (gap or forward)
- [ ] Multi-word foods: parsed correctly to canonical slugs

---

## CODE CHANGES SCOPE

| File | Change | Lines |
|---|---|---|
| `server/intelligence/pattern-intent-resolver.ts` | Verify routing + add guard for cooking questions | +10–15 |
| `server/intelligence/conversation/conversation-gateway.ts` | Enhanced system prompt section | +15–20 |
| `server/tests/test-intent-resolver.ts` | Add routing tests (mushrooms, prep questions) | +30–40 |
| `server/tests/test-nutrition-enrichment.ts` | Verify FI3 enrichment surfaces practical guidance | Already tested |

**Total: ~60–80 lines of code + documentation**

---

## KNOWN CONSTRAINTS

1. **LLM variability:** Even with prompt guidance, LLM may not vary openings perfectly. Accept "good enough" (70%+ variation) rather than rigid rotation.

2. **No rigid templates:** Don't lock the LLM into strict templates; provide guidance + examples instead.

3. **Practical takeaway availability:** Not all foods have practical guidance (NUTRITION_CONTEXT line 2 doesn't exist for all foods). When missing, surface enrichment's "explanation" instead.

4. **Multi-turn consistency:** Conversation history may repeat similar openings. That's acceptable — focus is on not repeating within a single turn.

5. **Personality variation:** Each personality should have some tone guidance, but food conversations should be consistent across personalities (core facts don't change).

---

## SUCCESS CRITERIA

1. **Routing (must have):**
   - [ ] Mushroom/fungi questions route to nutrition-knowledge
   - [ ] Cooking/prep questions don't go to nutrition-knowledge (gap or forward)
   - [ ] All pattern-intent-resolver tests pass

2. **Naturalness (should have):**
   - [ ] At least 3 different opening styles observed across 4 test questions
   - [ ] Opening varies within personality (70%+ variation)

3. **Accuracy (must have):**
   - [ ] All food categories correct (salmon=fish, kale=vegetable, etc.)
   - [ ] All nutrient claims sourced from NUTRITION_CONTEXT
   - [ ] No fabricated benefits or guessed nutrients

4. **Practical guidance (should have):**
   - [ ] One actionable takeaway surfaces naturally in each answer
   - [ ] Takeaway connects nutrients to real-world use (e.g., oil absorption)

5. **Code health:**
   - [ ] No new stores or schema
   - [ ] No changes to Food Intelligence ownership
   - [ ] All tests pass
   - [ ] System prompt is clear and focused

---

## TIMELINE & EFFORT

| Phase | Task | Effort | Status |
|---|---|---|---|
| **Phase 1** | Fix routing issues (verify + tests) | 1–2 hours | To do |
| **Phase 2** | System prompt enhancement | 1 hour | To do |
| **Phase 3** | Opening variation guidance | 0.5 hours | To do |
| **Phase 4** | Practical takeaway guidance | 0.5 hours | To do |
| **Phase 5** | Accuracy verification (strengthen rule) | 0.5 hours | To do |
| **Testing** | Manual testing + validation | 1–2 hours | To do |

**Total: ~5–6 hours**

---

## OPEN QUESTIONS

1. **Cooking question handling:** Should we forward cooking questions to a different handler, or return an honest gap?
   - Option A: Gap ("I focus on nutrition, not cooking methods")
   - Option B: Forward to a future cooking/recipe handler (doesn't exist yet)
   - **Recommendation:** Option A for FI4 MVP

2. **Opening rotation strategy:** Strict rotation or LLM-guided with examples?
   - Option A: Prompt provides 4 patterns, LLM picks one
   - Option B: Personality registry owns rotation (code-based)
   - **Recommendation:** Option A (simpler, more flexible)

3. **Practical takeaway prominence:** Separate section or woven into narrative?
   - Option A: Natural weaving (current enrichment approach)
   - Option B: Highlighted ("Here's the practical takeaway: ...")
   - **Recommendation:** Option A (more natural, less mechanical)

---

## RELATED WORK

| Work | Link | Impact |
|---|---|---|
| **FI3** | FI3_COMPANION_FOOD_ANSWER_COMPOSITION_IMPLEMENTATION.md | FI4 depends on FI3's enrichment (evidence + practical guidance) |
| **FI2** | Evidence-backed rendering | FI4 uses FI2's accuracy gates |
| **FI1** | Food Intelligence Platform Architecture | FI4 respects composition law, no new ownership |

---

## DEFINITION OF DONE

- [ ] Rollback tag in place
- [ ] Implementation plan approved
- [ ] Phase 1: Routing verified + tests added
- [ ] Phase 2: System prompt enhanced
- [ ] Phase 3: Opening guidance added
- [ ] Phase 4: Practical takeaway guidance added
- [ ] Phase 5: Accuracy rule strengthened
- [ ] Four canonical test questions validated manually
- [ ] All new tests passing
- [ ] No regression in existing tests
- [ ] Ready for code review and merge

---

## AUTHOR NOTES

FI4 is intentionally focused on **conversation quality**, not data or architecture:

- **Routing fixes** ensure questions reach the right place
- **System prompt enhancement** guides LLM without changing rules
- **Opening variations** reduce repetitiveness without adding complexity
- **Practical takeaways** leverage existing FI3 enrichment
- **Accuracy verification** strengthens existing safety rules

Together, these changes make food conversations feel more natural and educational while staying fully grounded in Food Intelligence and respecting all existing constraints.

---

*Implementation plan. No code committed. Rollback: `git reset --hard rollback/before-fi4-companion-food-conversation-naturalisation-20260705`.*
