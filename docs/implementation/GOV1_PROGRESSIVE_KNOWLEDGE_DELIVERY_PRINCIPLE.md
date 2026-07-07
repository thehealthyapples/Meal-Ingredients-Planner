# GOV1 — Progressive Knowledge Delivery Principle

**Status:** GOVERNING — Intelligence Governance extension  
**Adopted:** 2026-07-06  
**Classification:** Intelligence Governance (canonical)  
**Scope:** Intelligence Platform response architecture (read-path, Knowledge Plane)  
**Governing documents:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`  

---

## EXECUTIVE SUMMARY

The Intelligence Platform must always aim to **leave the user better informed than before they asked**. This principle establishes the response delivery standard: the platform progressively enriches its answers by systematically searching platform knowledge before invoking any Honest Gap.

Four commitments govern response delivery:

1. **Direct answer first** — attempt to answer the user's specific question directly where possible.
2. **Progressive knowledge search** — before declaring unavailability, systematically search existing canonical platform knowledge for the closest relevant context.
3. **Clear context layering** — explicitly distinguish between requested context (direct answer to the asked question), related context (adjacent or broader knowledge that enriches the answer), and general knowledge (background, definitions, alternatives).
4. **Honest gaps only after exhaustion** — an Honest Gap (declared knowledge unavailability) is the fallback only after all available platform knowledge has been searched and found insufficient.

---

## PRINCIPLE STATEMENT

### GOV1.1 — The user leaves better informed than they arrived

Every Intelligence Platform response must follow this hierarchy:

```
┌─────────────────────────────────────────────────────────┐
│ 1. ATTEMPT DIRECT ANSWER                                │
│    (is the requested question answerable from existing   │
│     platform knowledge?)                                 │
└────────────────────┬────────────────────────────────────┘
                     │ YES
┌────────────────────▼────────────────────────────────────┐
│ 2. ENRICH WITH RELATED CONTEXT                          │
│    (what adjacent knowledge makes this answer stronger?) │
│    • Practical guidance                                  │
│    • Actionable alternatives / next steps                │
│    • Sourced warnings / caveats                          │
│    • Feature connections                                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. SEARCH ADJACENT PLATFORMS                            │
│    (is relevant guidance in related knowledge areas?)    │
│    If found: answer from multiple angles               │
└────────────────────┬────────────────────────────────────┘
                     │ NOT FOUND
┌────────────────────▼────────────────────────────────────┐
│ 4. DECLARE HONEST GAP WITH CLOSURE                      │
│    • "I don't have documented guidance on..."           │
│    • "Here's what I *can* help with instead..."         │
│    • Suggest what platform knowledge *is* available    │
└─────────────────────────────────────────────────────────┘
```

This is an architectural constraint, not a suggestion. Every response must start at step 1 and proceed through the steps in order.

---

### GOV1.2 — Progressive knowledge search before Honest Gaps

Before invoking an Honest Gap, the Intelligence Platform must systematically search the following knowledge sources *in order of relevance to the asked question*:

#### Tier 1: Direct match sources (highest priority)
- **Documentation by topic:** Operational docs (`docs/*.md`), feature documentation, release notes, known-issues, FAQs matching the question's domain
- **User-facing help content:** Curated help articles indexed by intent/action
- **Investigated guidance:** Relevant ADRs, investigations, implementation records in `docs/investigations/` that address the specific question

#### Tier 2: Domain knowledge (semantic match)
- **Food & Nutrition knowledge:** `knowledge_*` DB sources, food intelligence registry — for nutrition, health claims, ingredient guidance
- **Transactional domain docs:** Operational workflows for planner, shopping, diary, household (e.g., "why didn't my planner update?" → planner-compliance reasons)
- **Product feature metadata:** Feature description, availability by tier, known limitations

#### Tier 3: Adjacent context (enrichment sources)
- **Related features:** Workflow docs for features that solve related problems (e.g., "how to meal-plan" helps context for "how to adjust macros")
- **General principles:** Role-based guidance, subscription tier clarity, general platform philosophy from architecture docs
- **Release guidance:** Recent release notes that may explain feature behavior or new capabilities
- **Architectural principles:** When a user asks "why" about platform design, draw from `ARCHITECTURE_PRINCIPLES.md` and SoT Register for authority and intent

#### Tier 4: General platform knowledge (fallback enrichment)
- **Glossary/definitions:** Feature terminology, concept explanations (e.g., "what is Apple Score")
- **Roles & permissions:** How role/tier access works, what requires premium, what is team-gated
- **Common tasks reference:** Aggregated how-tos from documentation that establish normal flows

**Search termination condition:** Stop searching when:
- A direct answer is found in Tier 1 (use it, then move to enrichment)
- You have found the most relevant three sources at any tier (you have sufficient richness)
- You have searched through all four tiers and found nothing relevant (proceed to Honest Gap)

---

### GOV1.3 — Context layering in responses

Every response must clearly distinguish three types of knowledge content:

#### Requested context (primary answer)
The direct answer to what the user asked. Label it as such.
- *"Based on your question about..."*
- *"To answer your specific request..."*
- *"Your question is about..."*

#### Related context (enrichment)
Knowledge adjacent to the primary answer that makes it more useful — alternatives, warnings, next steps, related features.
- *"You might also consider..."*
- *"A common next step is..."*
- *"Important note: ..."*
- *"Alternative approach: ..."*

#### General knowledge (background)
Definitions, background, principles, or broader context that helps the user understand the answer in the platform's framework.
- *"Context: ..."*
- *"For reference, ..."*
- *"The platform's approach to this is..."*

**Layering rule:** Requested context is always first and is never omitted. Related context is always second. General knowledge is always third. Never bury the direct answer in background; never omit the direct answer to provide only related context.

---

### GOV1.4 — Enrichment standards (what makes an answer "better informed")

An enriched answer includes:

1. **Practical guidance:** If the question is a "how-to," include not just the direct steps but typical decisions and pitfalls
   - *"You can do this. Here's a common decision point: ..."*

2. **Actionable alternatives:** If there are multiple ways to accomplish the goal, name the tradeoffs
   - *"You can approach this two ways:*
     - *Option A: ... (best for ...)*
     - *Option B: ... (best for ...)"*

3. **Sourced caveats:** Warnings or limitations grounded in actual platform knowledge
   - *"Note: This applies to Premium accounts.*
   - *"Warning: This feature has a known limitation: ..."*
   - *"Caveat: This only works if ..."*

4. **Feature connections:** Related platform capabilities that expand what the user can accomplish
   - *"Related feature: ..."*
   - *"You can extend this by also using ..."*

5. **Success criteria:** Clear statement of what success looks like so the user knows if they've accomplished the goal
   - *"You'll know this worked when ..."*
   - *"Look for this indicator: ..."*

6. **Next steps:** What comes after the immediate answer, if applicable
   - *"Once you've done that, you can ..."*

---

### GOV1.5 — Implementation constraints (what this does NOT change)

This principle is governance only. It does not:

- ✅ Change any runtime behavior (no code changes)
- ✅ Modify any LLM prompts or instruction sets
- ✅ Alter any capability or action execution
- ✅ Change the Intent Engine's behavior
- ✅ Modify response time / latency budgets
- ✅ Change any benchmark behavior

It **only** establishes the architectural standard for how the Knowledge Plane (read-path, answer generation) approaches question response — specifically the **order of search** and **layering of context** before defaulting to an Honest Gap.

---

## RELATIONSHIP TO EXISTING PRINCIPLES

### Alignment with ARCHITECTURE_PRINCIPLES.md

This principle is an **operational refinement of two existing principles:**

- **Principle 3 — Progressive enrichment:** This principle specifies *how* progressive enrichment surfaces to users — layered, searchable, clearly distinguished.
- **Principle 6 — No fabricated knowledge / Honest Gaps:** This principle specifies the *order of search* before an Honest Gap is invoked, ensuring gaps are genuine exhaustion events, not early stops.

### Relationship to THA Intelligence Platform Architecture (§4.3 Grounding)

The Knowledge Plane section states: *"Retrieval-augmented only: the model answers from retrieved chunks + the user's own data … No retrieval hit on a question → honest gap."*

GOV1 operationalizes this by defining what "retrieval" means — a systematic four-tier search before declaring "no retrieval hit."

### Enforcement mechanism

This principle is enforced by:
1. **Code review gates** — responses that invoke Honest Gaps without searching Tiers 1–3 are flagged
2. **Test coverage** — test cases for common questions verify that enriched context is present
3. **Benchmark questions** — acceptance tests include verification that answers are layered and not truncated at the direct answer

---

## WORKED EXAMPLE

**User question:** *"How do I import a recipe?"*

### Step 1: Direct answer
Search Tier 1 (help content / docs).  
Found: `docs/how-to-import-recipes.md`.  
Answer: *"To import a recipe, navigate to the Recipes tab, select Import, paste the recipe URL or name, and confirm."*

### Step 2: Enrich with related context
Search Tier 2–3 (domain knowledge, adjacent context).  
Found:
- Common source platforms (feature doc)
- Premium-only status (if applicable)
- How imported recipes integrate with meal planning

Enrich:
- *"Related: Once imported, you can immediately add this recipe to your meal planner."*
- *"Note: The platform automatically extracts nutrition info from imported recipes."*
- *"Common next step: Adjust the recipe's serving size to match your meal plan."*

### Step 3: Distinguish context
Response structure:
- **Requested:** *"Here's how to import: [direct steps]"*
- **Related:** *"Once imported, you can [do X]. Also consider: [alternative Y if they want to modify it]"*
- **General:** *"Context: Imported recipes are stored in your personal library and can be shared with household members if your subscription allows."*

### Step 4: Result
User leaves knowing:
- ✅ How to import (directly answered)
- ✅ What comes next (related context)
- ✅ How it fits in the broader platform (general context)
- ✅ Where the data goes (enrichment)

**Without GOV1**, the response might have been: *"Navigate to Recipes > Import and paste the URL."* [Honest gap on everything else]

**With GOV1**, the response is enriched from platform knowledge the user didn't ask for but benefits from knowing.

---

## KNOWN GAPS & LIMITATIONS

- **Latency:** Four-tier search has cost. Mitigation: tier search is parallelizable; highest-confidence Tier 1 results are cached/indexed.
- **Tier 4 generality:** Tier 4 (glossary/definitions) can be vast. Mitigation: Tier 4 search is scoped to the question's semantic domain, not exhaustive.
- **Enrichment bloat:** Over-enriched answers are unhelpful. Mitigation: "Related context" is limited to the three most relevant enrichments; optional context is separable (e.g., in an expandable section).

---

## GOVERNANCE REVIEW CHECKLIST

Before any response from the Knowledge Plane goes live:

- [ ] Does the response attempt a direct answer to the user's question?
- [ ] If a direct answer exists, are Tiers 2–3 (related context) included?
- [ ] Are requested/related/general contexts clearly distinguished (labeled)?
- [ ] Is practical guidance / alternatives / caveats / next steps included (where applicable)?
- [ ] If Honest Gap is invoked, were Tiers 1–3 searched?
- [ ] Are all knowledge claims sourced (no model-invented facts)?

---

## APPENDIX — EXAMPLE QUESTION MATRIX

| Question | Tier 1 hit | Tier 2 hit | Tier 3 hit | Expected enrichments |
|-----------|-----------|-----------|-----------|----------------------|
| "How do I share a plan?" | Yes (help doc) | Yes (household features) | Yes (subscription tier context) | Tier limits; alternative (snapshot export) |
| "Why doesn't my shopping list update?" | No | Yes (shopping service docs) | Yes (sync behavior, network) | Common causes; troubleshooting steps |
| "What's in the Apple Score?" | No | Yes (nutrition registry) | Yes (platform principles) | Related metrics; how to improve |
| "Can I use the app offline?" | No | No | Yes (feature tier doc) | No — Honest Gap with pointer to available features |
| "Explain fermented foods" | No | Yes (nutrition knowledge) | Yes (plant diversity context) | Science (sourced); examples; THA foods; benefits |

---

## ROLLBACK & REVERT

This document establishes governance for the Intelligence Platform's response architecture. Reverting this principle:

```bash
git rm docs/implementation/GOV1_PROGRESSIVE_KNOWLEDGE_DELIVERY_PRINCIPLE.md
git commit -m "Revert GOV1 — Progressive Knowledge Delivery Principle"
```

No code changes are required. The principle is documentation only.

---

*Adopted 2026-07-06 as an Intelligence Governance extension.*  
*Completes requirement: GOV1 — Progressive Knowledge Delivery Principle.*  
*Next: Verify alignment with Knowledge Plane implementation (Phase 1).*
