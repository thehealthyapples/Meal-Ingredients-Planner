# NK2 — THA Nutrition Methodology

**Status:** Investigation and design (no implementation)  
**Date:** 2026-07-07  
**Purpose:** Define THA's canonical Nutrition Methodology — the decision principles, prioritisation philosophy, and practical guidance approach that every business service should follow when applying nutrition knowledge to help households make better food decisions.  
**Governing documents:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md`, `docs/investigations/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`

---

## EXECUTIVE SUMMARY

The Nutrition Methodology is not "how to build nutrition features" — it is **how to decide what nutrition guidance is worth giving at all**. It answers the question: **"How should THA apply nutrition knowledge to help ordinary households make better food decisions?"**

THA's relationship with nutrition is fundamentally different from a clinical tool or a nutrition advice engine. THA serves **ordinary households** — people who eat, cook, have constraints (budget, time, allergies, taste, culture), make trade-offs daily, and are not looking for optimization, they are looking for *better*. This methodology defines what "better" means, how THA decides to help, what it chooses NOT to say, and how it stays honest when knowledge is uncertain or incomplete.

**Three strategic anchors:**

1. **Food-centric, not nutrient-centric.** THA teaches through the foods households recognize and cook. Nutrients are the *why*, not the *what*. Guidance flows: food → nutrients → benefits → household choice.

2. **Household-first, not authority-first.** Every guidance decision prioritizes what a household can *actually do* over what nutrition science says is optimal. Budget, time, culture, allergies, and taste are not obstacles to nutrition — they are the real constraints that define the space where "better" can exist.

3. **Sourced and honest, never fabricated or assumed.** THA speaks about foods and meals, never bodies or diagnoses. Every claim is traceable to evidence. Unsourced knowledge is better *absent* than present. This is non-negotiable — trust is the product.

---

## THE CORE QUESTION

> **"How should THA help a household eat *better*?"**

This breaks into five subordinate questions that organize this methodology:

1. **What does "better" mean for ordinary households?** (Principle domain)
2. **What nutrition knowledge is worth sharing?** (Prioritisation domain)  
3. **How should THA explain and teach nutrition?** (Practical guidance domain)
4. **What are households actually constrained by?** (Household-first domain)
5. **When knowledge conflicts with practicality, what wins?** (Trade-off domain)

---

## SECTION 1 — DECISION PRINCIPLES

These are the non-negotiable values that guide every nutrition guidance decision in THA.

### Principle M1 — Food-Centric, Not Nutrient-Centric

**The rule:** Guidance begins and ends with *foods* — foods households recognize, foods they already cook, foods they shop for. Nutrients are infrastructure, not the subject.

**The test:** If a guidance phrase starts with a nutrient (e.g. "Omega-3 supports heart health, so eat salmon"), reframe it as food-first: "Salmon is a powerful heart-health food, rich in omega-3." The household thinks about salmon; the nutrient explains why.

**Why:** 
- Households shop, plan, and cook in foods, not nutrients.
- A household that understands "eat more legumes" can act. A household that understands "increase folate intake" is blocked until they figure out which foods have folate.
- Nutrient-first guidance creates two problems: (a) it's harder to act on, and (b) it divorces the household from *choice* — a computer could optimize better.

**Applies to:**
- All Health Benefits phrasing (§2.2)
- All Strength/Gap reporting in the Weekly Nutrition Report
- All Nutrient Education (§2.3)
- Discovery/alternatives ranking explanations
- Caution messaging (§3.4)

**Anti-pattern:** "Your iron intake is low" → **Better:** "You've eaten little red meat and beans this week — both are iron-rich foods that help energy."

---

### Principle M2 — Authority Flows Down, Never Up

**The rule:** THA never generates, infers, or assumes a nutrition fact. Every statement flows from a canonical source (NK1 Plane 1) via sourced evidence or household data (NK1 Plane 2). Inference is infrastructure, not guidance.

**The test:** "Where did this fact come from?" 
- If the answer is "Plane 1 (sourced)" → render it as a fact.
- If the answer is "Plane 2 (household pattern)" → render it as an observation about this household.
- If the answer is "computed from multiple facts" → show only the component facts, never the inferred conclusion.
- If the answer is "we guessed" or "the LLM generated it" → do not render it.

**Why:**
- Trust is the product. The moment a household discovers a "fact" that THA cannot source, all other "facts" become suspect.
- Fabrication is easy when the audience has no way to verify. Households cannot and should not have to verify medical/nutritional claims — THA's job is to do it for them.
- Structured inference (decision trees, rules, learning) is valuable *inside THA* (for ranking, for discovery). It is not guidance to the household.

**Applies to:**
- Health benefits claims (Rule NK2 in NK1 — evidence-backed only)
- Occasional-food warnings (rule: sourced toxicity/risk data, never inferred concern)
- Caution messaging (rule: labelled claim with source, not "we think this might be risky")
- Goals guidance (rule: goals are household-chosen, not THA-inferred)

**Hard stop:** Any implementation that generates a claim without tracing it to Plane 1 must stop and seek approval.

---

### Principle M3 — Speak About Foods and Meals, Never Bodies or Diagnoses

**The rule:** THA's subject is always food. It never speaks about bodies, symptoms, diagnoses, or medical conditions.

**The test — banned words:**
- ❌ "prevents", "treats", "cures", "manages", "reduces risk of", "addresses"
- ❌ "symptoms", "condition", "disease", "disorder", "deficiency"
- ❌ "you should have", "you need", "you're lacking" (directed at the person, not the food)

**The test — allowed words:**
- ✅ "supports", "contributes to", "associated with", "linked to"
- ✅ "rich in", "good source of", "contains"
- ✅ "this food *is*" (property of food), never "you *are*" (property of body)

**Why:**
- The moment THA speaks about the body, it is giving medical advice, and medical advice requires either a license or a very careful regulatory boundary.
- Food advice is different: "salmon is rich in omega-3" is a food fact. "Omega-3 supports heart health" is a nutrition fact. "Eat salmon for your heart" is medical advice.
- THA's regulatory position is strengthened by this boundary. It is also the *honest* boundary — THA cannot know any household member's health status, so it cannot ethically recommend for health conditions anyway.

**Applies to:**
- All Health Benefits phrasing
- Weekly Nutrition Report language
- Occasional-food caution messaging
- Goal guidance
- Allergen/restriction messaging (safety-critical exception: allergies and intolerances are medical risk, so explicit language is required here)

**Hard stop:** Any phrasing that addresses a body or suggests medical treatment must be rewritten before shipping.

---

### Principle M4 — Show Signal, Not Noise; Honest Gaps Over Invented Complexity

**The rule:** Nutrient and benefit coverage is intentionally *sparse*. Showing fewer, higher-confidence facts is better than showing many facts of uncertain relevance.

**The test:** 
- "Is this nutrient/benefit in the top 5 reasons someone would eat this food?" If no → don't show it.
- "Can the household act on this information?" If no → don't show it as a primary fact (it can live in expanded detail).
- "Are we certain of this link?" If "mostly" or "probably" → tag it as emerging; if "definitely not" → absent, no placeholder.

**Why:**
- Households are already overwhelmed by health information. Adding uncertainty ("this might help with this maybe") is noise.
- Empty states are honest. A food without "benefits" is not a bad food — it is a food where THA has not *yet* sourced the benefit links.
- The inverse of this principle is also important: when benefits DO light up (Tier B, Phase 1), they are all sourced and reliable. The household learns: "if THA says it, it's backed."

**Applies to:**
- Nutrient display (show 5-20 key nutrients per food, not 100 USDA fields)
- Benefit display (Tier A has zero benefits; Tier B ships 5 minimum; adding more is a content decision, not a UI expansion)
- Comparison views (compare foods on factors that matter, not on every possible nutrient)
- Strength/gap reporting (show macro patterns, not every single nutrient or ingredient tracked)

**Anti-pattern:** A food page with 47 nutrients listed, most of them greyed out or marked "data incomplete". **Better:** A food page with 8 key nutrients, full confidence, plus a "What else can you learn?" expansion for researchers.

---

### Principle M5 — Progressive Enrichment; Minimum Viable Honesty at Launch

**The rule:** Surfaces are permitted to ship incomplete. A surface that ships 30% of its future vision is preferred over one that delays to ship 100% or fabricates the missing 70%.

**The test:** 
- "If this surface shipped today with only the sourced facts visible, would it be useful and honest?" If yes → launch.
- "Would a household misunderstand or be misled?" If no → launch.
- "Is the gap obvious to the household?" If yes → launch.

**Why:**
- The longest pole is editorial (content authoring, sourcing, review), not engineering.
- Shipping incomplete-but-honest is how THA builds trust. Future enrichment then feels like a win, not a correction.
- "Here's what we know, and here's what we're working on" is a stronger message than "we have everything but we're waiting to tell you."

**Applies to:**
- Benefit display (Tier A with no benefits is better than Tier A with fabricated benefits)
- Strength/Gap reporting (show only the nutrients THA has high confidence in; others absent or marked as "emerging")
- Weekly story (ship counts/strengths/gaps as live; ship optional sections as honest shells until ready)
- Alternatives/discovery (if food relationships are unbuilt, rank by basic similarity, not missing relationships)

**Example:** WS1 Plant Diversity launches Tier A (plant counting, key nutrients) while WS2 (Health Benefits) is in editorial review. Zero fabrication. Tier B lights up the day WS2 publishes.

---

## SECTION 2 — PRIORITISATION PHILOSOPHY

What nutrition guidance is worth sharing, and in what order?

### Priority 1 — Food Safety and Allergies

**What:** Allergens, intolerances, toxins, processing risks.

**Why first:** The only guidance that could cause harm if absent. Hard restrictions are boundary-setting, not optimization.

**Rule:** Safety is the absolute blocker. Never deprioritize, never assume, never defer. Rule T0 (household-level safety gate, non-overridable) applies.

**How it appears:**
- Allergen symbols and lists at point-of-discovery
- Restriction filtering on planner/recipes/meals
- Product safety analysis via Analyser (UPF, additives, processing)

---

### Priority 2 — Foods the Household Already Cares About (Meal-Based Guidance)

**What:** Nutrition guidance about the specific meals households plan, shop for, and cook.

**Why this rank:** A household that understands the nutrition of the meals they *want to eat* will eat better more easily than one optimized for meals they don't want.

**Rule:** Start where the household is. Every surface that shows a meal should show what makes that meal nutritionally useful/notable.

**How it appears:**
- Food Report on individual meals (why this meal matters)
- Plant Diversity embedded in Planner (this week's meals → this week's plant count)
- Boost cards on meal detail (what this meal contributes to a balanced week)
- Nutrition section of meal discovery (why pick this recipe vs. that one)

---

### Priority 3 — Pattern Awareness (Weekly and Household-Level Signals)

**What:** Emergent patterns: "you're light on fibre this week", "you haven't cooked with beans in 2 weeks", "your household is 85% meat-based".

**Why this rank:** Patterns are how households learn. Individual facts are noise; patterns teach.

**Rule:** Patterns are observed from household data, never inferred or assumed. Rule P1 (household learning never generates new facts, only re-weights existing ones) applies.

**How it appears:**
- Weekly Nutrition Report (counts + strengths + gaps at household level)
- Ambient nutrition strips in Planner (this week's state at-a-glance)
- Recommendations for "what to add" based on pattern gaps
- Learning signals (re-weighting visible to household, opt-out available)

---

### Priority 4 — Caution and Occasional-Use Awareness

**What:** Guidance about foods to eat less often: high-UPF, high-sodium, high-sugar, allergen-risk.

**Why this rank:** Negative guidance (what to eat less) is much easier to get wrong, so it comes later than positive guidance.

**Rule:** Caution is sourced, not inferred. If a food is "occasional use", the rule for why must be data-backed (e.g. "many breakfast cereals are >20g sugar per serving; see alternatives" is sourced; "sugary foods are bad" is not).

**How it appears:**
- Analyser (product risk scoring: UPF, additives, nutritional profile)
- Occasional-food tags on foods
- "Better choices" in comparison (same category, lower UPF/sodium/sugar)
- Caution messaging in discovery/recommendations (rule: labelled, sourced, optional-read)

---

### Priority 5 — Personalised Optimisation (Goals, Learning, Prediction)

**What:** Household-specific goals ("more protein", "plant diversity", "low UPF"), learned preferences, predictive suggestion.

**Why this rank:** Personalisation is post-launch. It requires learning signals, goals infrastructure, and confidence. It is the last layer.

**Rule:** Personalisation never overrides safety, never invents facts, and is always explainable to the household (Rule P5).

**How it appears:**
- Goals feature (Phases 1–2, post-launch)
- Personalised recommendations (Stages 3–5 of Food Intelligence Engine, Phase 2–3)
- Learned preferences (re-weighting via event log, Phase 1)

---

## SECTION 3 — PRACTICAL GUIDANCE PHILOSOPHY

How should THA explain and teach nutrition to households?

### Guidance Principle G1 — The Household is the Expert on Their Constraints

**The rule:** THA offers options; households choose. Every guidance phrase is phrased as "here's an opportunity" not "you should".

**Phrasing:**
- ✅ "Beans are a plant-based protein option; this week you've had little variety in proteins"
- ❌ "You should eat more beans"
- ✅ "This recipe is low-UPF; here's how it compares to alternatives"
- ❌ "You should stop buying UPF foods"

**Why:** 
- Households know their budget, time, culture, taste, and health status better than THA ever will.
- Directive guidance ("you should") that doesn't account for constraints feels preachy and gets ignored.
- Opportunity-based guidance respects household agency. The household decides if they want to take the opportunity.

**Applies to:**
- Recommendations (show why, let household choose)
- Strength/gap reporting (show the gap, suggest additions, don't mandate)
- Caution messaging (show the risk, offer alternatives, don't ban)
- Allergen/restriction guidance (show what's safe, never assume household will follow)

---

### Guidance Principle G2 — Layer Information; Respect Shallow Reading

**The rule:** The top level is always the executive summary; deeper levels provide support. Never bury the headline.

**Structure:**
- **Layer 1 (headline):** One food attribute or meal contribution, stated clearly. "Salmon is a heart-health food."
- **Layer 2 (support):** Why. "It's rich in omega-3 fatty acids, which are associated with heart health."
- **Layer 3 (evidence):** Source. "Based on NHS guidance on fish and heart health. [link]"
- **Layer 4 (nuance):** Caveats, alternatives, related facts. "Other heart-health foods include walnuts, flaxseed, and legumes."

**Why:**
- Households scan. They don't read full paragraphs before deciding whether to engage.
- Shallow readers should get the key takeaway. Deep readers should be able to verify.
- Layering respects cognitive load. A household cooking dinner has 30 seconds; a household researching plant diversity has 30 minutes.

**Applies to:**
- Health benefits cards (headline + source + expansion)
- Food reports (one key insight, then detail)
- Weekly nutrition report (counts obvious, strengths/gaps explained, stories expanded)

---

### Guidance Principle G3 — Link the Household's Goals to Foods, Not to Nutrients

**The rule:** Guidance flows: household situation → foods → nutrients. Never just nutrients → foods.

**Example:**
- ✅ "You've had little variety in plant-based meals. Here are legume recipes that add plant diversity, and they're also good sources of protein and fiber."
- ❌ "You need more folate, fiber, and B vitamins. Here are some foods high in those."

**Why:**
- The first phrasing connects to a household goal the household stated or demonstrated (plant diversity, trying new meals).
- The second requires the household to understand why those nutrients matter to *them*.
- Households care about outcomes (energy, digestion, plant diversity); nutrients are the mechanism.

**Applies to:**
- Goal-based recommendations (Phase 1+)
- Strength/gap suggestions (link to household situation, not nutrient name)
- Plant diversity reporting (connect to household action, not plant count)

---

### Guidance Principle G4 — Teach Through Familiarity; Name Ingredients by How Households Know Them

**The rule:** Use the names households use in their own kitchens. "Chickpeas" before "Cicer arietinum"; "red lentils" before "Lens culinaris". Alternate names are support detail.

**Test:** "Would a household recognize this ingredient in the grocery store by this name?"

**Why:**
- Familiarity builds confidence. A household that reads "chickpeas" can act immediately.
- Scientific names are useful for disambiguation only (when two common names refer to different things).
- This applies to cuisines and food traditions too: "ginger" not "zingiber officinale"; "dal" not "split pulse".

**Applies to:**
- Ingredient naming in all contexts
- Recipe guidance and suggestions
- Strength/gap reporting (name foods by how households know them)
- Alternatives (show alternatives within familiar categories first)

---

### Guidance Principle G5 — Never Personify or Moralize Food

**The rule:** Food is morally neutral. No "good foods" / "bad foods" language. No personification ("friendly bacteria", "superfoods").

**Banned words:** "Good", "bad", "clean", "pure", "super", "healthy" (as a category), "junk", "processed" (as a slur), "guilt-free".

**Allowed:** Descriptive language. "High-UPF", "low-fibre", "rich in vitamin C", "quick to prepare", "locally-sourced".

**Why:**
- Moralizing food creates shame and anxiety, especially around eating restrictions.
- It is false. No food is "bad"; foods have trade-offs (convenience, affordability, nutrition, taste).
- Households with restrictions, limited budgets, or cultural food traditions need permission to eat what they eat and feel good about it.

**Applies to:**
- All public-facing copy
- Health benefits phrasing (no "superfoods")
- Caution messaging (no "junk food" language)
- Occasional-use tags

---

## SECTION 4 — HOUSEHOLD-FIRST PRINCIPLES

What are households actually constrained by, and how does that shape guidance?

### Household Principle H1 — Budget is Real; No Guidance Assumes Affluence

**The rule:** When suggesting alternatives or additions, consider cost. Premium foods are OK for occasional reference, but the baseline recommendation should be accessible.

**Test:** "Would a low-income household reading this feel welcome?" If the guidance is "eat more salmon and organic spinach", the answer is no.

**Example:**
- ✅ "If you want more fiber, legumes (beans, lentils, chickpeas) are a cheap option that works in many cuisines."
- ✅ "Frozen vegetables have the same nutrition as fresh and are often cheaper."
- ❌ "Eat a variety of organic, locally-sourced vegetables."

**Why:**
- Nutrition guidance that requires wealth becomes a class barrier, not a health tool.
- Legumes, eggs, frozen vegetables, and canned fish are affordable and nutritious.
- THA serves ordinary households. Ordinary households have budgets.

**Applies to:**
- Alternatives and recommendations (show affordable options first)
- Recipe discovery (include budget-friendly recipes)
- Strength/gap suggestions (suggest accessible foods)

---

### Household Principle H2 — Time is Real; Guidance Respects Busy Households

**The rule:** Guidance never assumes leisure time for cooking. "Just prepare from scratch" is not accessible to all households.

**Example:**
- ✅ "Quick proteins: canned beans, eggs, rotisserie chicken, deli meat, Greek yogurt."
- ❌ "Batch cook legumes on Sunday for the week."

**Why:**
- Many households have limited time: shift workers, single parents, caregivers, people working multiple jobs.
- Cooking from scratch is one valid choice. So is using prepared food, frozen meals, and convenience items.
- Guidance that requires leisure time excludes people who don't have it.

**Applies to:**
- Recommendations and alternatives (show quick options)
- Recipe discovery (tag prep time clearly)
- Caution messaging (be careful not to imply "fresh = good, convenient = bad")

---

### Household Principle H3 — Culture and Taste are Non-Negotiable

**The rule:** Guidance never implies that traditional cuisines or food preferences are "less healthy" or need to be replaced.

**Example:**
- ✅ "This week you had little legume variety. Here are legumes used in [household's cuisine] that add diversity."
- ❌ "You should try Mediterranean cuisine for better nutrition."

**Why:**
- Food is cultural. Dismissing a household's food traditions is dismissing their culture.
- Every cuisine has nutrient-rich foods. "Better" means better *for this household*, not "more like Mediterranean".
- When guidance respects culture, households are more likely to follow it.

**Applies to:**
- Recommendations and alternatives (suggest within household preferences first)
- Plant diversity (if the household cooks Asian cuisine, show Asian plant-foods)
- Strength/gap reporting (find solutions that fit how this household already eats)

---

### Household Principle H4 — Allergies and Restrictions are Boundaries; Guidance Stops at the Line

**The rule:** Hard restrictions (allergies, religious, ethical) are non-negotiable. Soft restrictions (preferences, intolerances, dislikes) are household-chosen.

**Test:** 
- Hard restriction: household member cannot eat this → every surface filters it out, always.
- Soft restriction: household member doesn't want to eat this → household can choose to override or ignore the restriction.

**How:** Hard restrictions are in the Planner and discovery logic (rule-enforced). Soft restrictions are in preference weighting (household-controlled, re-weightable).

**Why:**
- Hard restrictions are safety-critical. A household member with a peanut allergy should never see a peanut recommendation, period.
- Soft restrictions are household choice. A household that dislikes mushrooms might still want to know "here's a mushroom recipe if you're curious".

**Applies to:**
- Meal discovery and planner (hard restrictions enforced, soft restrictions as filters)
- Recommendation weighting (soft preferences re-weight, not block)
- Allergen display (always visible for hard restrictions)

---

### Household Principle H5 — Transparency and Control; Households Own Their Data and Choices

**The rule:** Every guidance decision is explainable. Every learning weight is visible. Every preference is resetable.

**How:** 
- "Why did you recommend this?" → show the reasoning (based on X, Y, Z facts about your week).
- "How did my preferences get set?" → show the learning signal and how to reset it.
- "Can I change this?" → household has visible opt-out and reset controls.

**Why:**
- Trust requires transparency. If THA makes a recommendation and a household can't understand why, they will distrust all recommendations.
- Households are in control. THA advises; households decide.
- This builds long-term loyalty. Households trust systems they understand and can control.

**Applies to:**
- Recommendations (show reasoning)
- Learning signals (show how signals are learned, allow opt-out and reset)
- Personalization (household can adjust all settings)

---

## SECTION 5 — TRADE-OFF PRINCIPLES

When knowledge conflicts with practicality, what wins?

### Trade-off T1 — Honesty > Completeness

**The rule:** A gap admitted is better than a fact invented. When THA doesn't know something, the household sees nothing, not a guess.

**Test:** "Is this sourced?" If no and it cannot be easily sourced → don't show it. Don't invent.

**Why:**
- Fabrication destroys trust across the entire system.
- Households learn that THA's gaps are honest, so every fact THA does show is reliable.

**Applies to:** Every claim-bearing surface.

---

### Trade-off T2 — Safety > Optimization

**The rule:** When safety and optimization conflict, safety always wins. When uncertainty is high, default to caution.

**Test:** "Could someone be harmed by this guidance?" If yes and harm is plausible → restrict or gate.

**Example:**
- Allergen guidance is never optional.
- Caution messaging for high-allergen-risk foods is never removed to "look prettier".
- Goal guidance never suggests eliminating entire food groups.

**Why:**
- Harm is permanent; optimization is iterative.

**Applies to:** Allergens, restrictions, medical-adjacent guidance.

---

### Trade-off T3 — Household Agency > Optimization

**The rule:** When guidance that optimizes nutrition conflicts with the household's stated choices/constraints, respect the household's choice.

**Test:** "Did the household choose this constraint?" If yes → honor it, even if it suboptimizes nutrition.

**Example:**
- A vegan household that chooses not to track nutritional completeness still gets honest guidance ("here are legume options that add protein").
- A household with a tight budget that chooses cheaper options gets recommendations within budget, not "better" expensive options.

**Why:**
- Households are the experts on their own lives.
- Guidance that doesn't respect household agency gets ignored and breeds resentment.

**Applies to:** Dietary preferences, budget constraints, time constraints.

---

### Trade-off T4 — Sourced Incompleteness > Unsourced Completeness

**The rule:** When a benefit is partially sourced (some foods have evidence, others don't), show only the sourced foods and mark as incomplete.

**Test:** "Is every fact in this statement backed by a source?" If no → don't show it as a complete statement.

**Example:**
- If "Heart Health" benefit is sourced for salmon, mackerel, and walnuts but not for all legumes, show only the sourced foods as "heart-health foods" and mark as "these heart-health foods have strong evidence; we're researching others".

**Why:**
- Partial knowledge is honest. Claiming completeness when incomplete is a lie.

**Applies to:** Benefit-food mappings, strength/gap reporting.

---

### Trade-off T5 — Familiar Shortcuts > Perfect Precision

**The rule:** When teaching, use familiar concepts even if technically imprecise. Accuracy in detail comes later.

**Example:**
- "Plant diversity" (we count plants) is less precise than "plant species alpha-diversity" but is understood by households and is actionable.
- "Occasional foods" (sourced as foods with high UPF/sodium/sugar) is less precise than "ultra-processed according to NOVA" but households recognize it.

**Why:**
- A household that takes action on an 80% accurate simple concept is better served than one paralyzed by a 100% accurate complex concept.
- Precision can live in expansions; accessibility must live in the headline.

**Applies to:** Health benefits naming, feature naming, Strength/gap language.

---

## SECTION 6 — PROGRESSIVE ENRICHMENT OPPORTUNITIES

How does the methodology scale over time?

### Enrichment Pathway E1 — Benefit Sourcing and Evidence Expansion

**Timeline:** Phase 0 (5 minimum) → Phase 1 (8 ideal) → Phase 2+ (full 15-benefit vocabulary)

**Approach:**
- Launch with the 5 highest-coverage, lowest-risk benefits (Heart, Gut, Immune, Bone, Energy).
- Add benefits 6–8 (Muscle, Brain, Sleep) as a content drop (no UI change).
- Phase 2+ expands to the full 15-benefit vocabulary with full sourcing.

**How methodology guides this:** Principle M4 (show signal, not noise) and Principle M5 (progressive enrichment) ensure that partial benefit sets are honest and ship confidently.

---

### Enrichment Pathway E2 — Household Learning and Personalization Confidence

**Timeline:** Phase 0 (observable patterns) → Phase 1 (learned preferences) → Phase 2 (predictive offers)

**Approach:**
- Phase 0: Show household patterns ("you've had little fiber this week"), no learning yet.
- Phase 1: Learn household preferences from choices (event log), show learned weights to household, allow reset.
- Phase 2: Predict (Stage 4 offerings, "you usually plan curry Friday"). Rule P1 (learning never generates facts) always applies.

**How methodology guides this:** Principle H5 (transparency and control), Trade-off T3 (household agency), and Principle M2 (authority flows down) ensure that learning surfaces as an *observation* the household can verify and control, never as a hidden decision-maker.

---

### Enrichment Pathway E3 — Food Relationships and Discovery Sophistication

**Timeline:** Phase 0 (basic similarity) → Phase 1 (curated relationships) → Phase 2 (multi-factor ranking)

**Approach:**
- Phase 0: Show alternatives by basic category and nutrient similarity.
- Phase 1: Add sourced relationships (family, season, benefit overlap, cuisine).
- Phase 2: Rank by multi-factor scoring (household preferences + learning + relationships + goals).

**How methodology guides this:** Principle M1 (food-centric), Principle H3 (culture and taste), and Trade-off T3 (household agency) ensure that discovery remains grounded in foods households recognize and choose, not in optimization.

---

### Enrichment Pathway E4 — Caution Sophistication and Medical Boundary Clarity

**Timeline:** Phase 0 (sourced warnings only) → Phase 1 (optional-use guidance) → Phase 2+ (risk scoring and trade-off teaching)

**Approach:**
- Phase 0: High-allergen-risk foods are flagged; high-UPF products are shown; no medical claims.
- Phase 1: Optional-use guidance (sourced as occasional); alternatives shown; no "bad food" language.
- Phase 2+: Risk scoring per household context (is *this* household's situation high-risk?); trade-off teaching.

**How methodology guides this:** Principle M3 (speak about food, not bodies), Trade-off T2 (safety > optimization), and Principle G5 (never moralize) ensure that caution stays sourced, respectful, and actionable.

---

### Enrichment Pathway E5 — Ambient Context and Ambient Intelligence

**Timeline:** Phase 0 (explicit surfaces only) → Phase 1 (ambient strips) → Phase 2 (ambient reasoning)

**Approach:**
- Phase 0: Nutrition information lives on dedicated pages (Plant Diversity report, Pantry Explore, Weekly Nutrition Report).
- Phase 1: Nutrition context appears at point-of-decision (Planner week view shows "you're light on fiber").
- Phase 2: Ambient reasoning proactively surfaces recommendations before household explicitly asks.

**How methodology guides this:** Principle G1 (household is expert), Trade-off T3 (household agency), and Principle M5 (progressive enrichment) ensure that ambient intelligence is optional-to-engage, never preachy or mandatory.

---

### Enrichment Pathway E6 — Community and Social Proof (Post-Launch)

**Timeline:** Phase 3 (testimonial sharing) → Phase 4 (community discovery)

**Approach:**
- Phase 3: Households can share meals/plans; others can import and re-ground (every import re-validates against household restrictions).
- Phase 4: Discovery includes "meals household like yours cook" — social proof without fabrication.

**How methodology guides this:** Principle M2 (authority flows down), Principle H3 (culture), and Principle H5 (transparency) ensure that community knowledge is re-grounded per household (never a second-order fact) and respects cultural diversity.

---

## SUCCESS CRITERIA

How to measure whether the methodology is being followed:

### Guidance Fidelity
- [ ] Every public health claim is traceable to NK1 Plane 1 with a source reference
- [ ] Zero phrasing uses banned words (prevents, treats, cures, good/bad foods, superfoods, etc.)
- [ ] Every recommendation is phrased as an opportunity, not a directive
- [ ] Honesty gaps are obvious to households (empty states show cleanly, sparse data is admitted)

### Household Respect
- [ ] Allergen/restriction filtering is enforcement (not optional); soft preferences are optional
- [ ] Affordable alternatives are shown first
- [ ] Cultural cuisines are represented, not stereotyped
- [ ] Learning signals are visible and household-resetable
- [ ] Guidance respects household constraints (time, budget, taste, culture)

### Sourcing Discipline
- [ ] 100% of public health claims have a dated source reference (lastReviewed + SourceRef)
- [ ] Every source is a trusted domain (NHS/BNF/EFSA/NIH ODS)
- [ ] Emerging claims are tagged as emerging, never shown as established
- [ ] Fabrication is structurally prevented by code review and test

### Completeness and Honesty
- [ ] Partial knowledge is shipped as partial (not padded with guesses)
- [ ] Empty states are clean; missing content is not invented
- [ ] Coverage is accurate (nutrition context for 188 foods means all 188, not 50 with the rest made up)
- [ ] Roadmap is honest (post-launch features are named and gated, not hidden)

---

## ANTI-PATTERNS TO AVOID

| Anti-pattern | Why it fails | Prevention |
|---|---|---|
| **Directive guidance ("you should") without respecting constraints** | Households feel judged and ignored; guidance gets ignored in response. | Principle G1: show opportunities, respect agency |
| **Nutrient-first explanation** | Households can't act on nutrients; the bridge between nutrient and food stays unclear. | Principle M1: food-first phrasing always |
| **Moralizing food ("healthy", "junk", "clean")** | Creates shame, especially for households with restricted budgets or restricted choices. | Principle G5: descriptive, never moral |
| **Fabricated or inferred claims without sourcing** | Destroys trust across entire system; legal risk. | Principle M2: authority flows down only |
| **Guidance that assumes affluence or leisure time** | Excludes households without resources; makes THA a tool for the privileged. | Principles H1, H2: budget and time are real |
| **Ignoring cultural food traditions** | Dismisses culture; dooms guidance to being ignored. | Principle H3: culture is non-negotiable |
| **Incomplete benefits shown as complete** | Users later discover gaps and mistrust the system. | Trade-off T4: sourced incompleteness > unsourced completeness |
| **Learning signals invisible or non-resetable** | Users feel manipulated by hidden decision-making. | Principle H5: transparency and control |
| **Caution messaging that shames ("avoid", "don't eat")** | Creates anxiety and backlash; households resist. | Principle G1: show alternatives, not bans |
| **Precision at the cost of accessibility** | Accurate but unusable guidance is useless. | Trade-off T5: familiar shortcuts > perfect precision |

---

## NEXT STEPS

### Immediate (Phase 0)
1. **Review this methodology:** Align product, editorial, and engineering teams on the decision principles.
2. **Audit existing surfaces:** Every health claim, every recommendation, every piece of guidance should be tested against this methodology.
3. **Gate code review:** Architecture Compliance Checklist extended to include "does this guidance follow the Nutrition Methodology?" check.

### Phase 1–2
4. **Widen the audience:** Every new surface, every new capability, every new AI binding should reference this methodology.
5. **Update routinely:** Every 6 months, review which principles are most-tested and which are being pressured to bend. Update this document with learnings.

---

## ROLLBACK & SAFETY

**This is an investigation only. No code, schema, data, or runtime changes.**

- No database migrations needed for NK2 publication.
- No API changes.
- No implementation required.
- SoT Register update (pointer-only) is the only tracked change if this is promoted to governing architecture.

---

## QUESTIONS ANSWERED

| Question | Answer |
|---|---|
| **How should THA help households eat better?** | By being food-centric, sourced, household-first, and honest about gaps. Guidance flows from food, not nutrients. Households are the experts on their constraints. |
| **What are the core decision principles?** | Food-centric (not nutrient-centric); authority flows down (sourced only); speak about food (never bodies); show signal not noise; progressive enrichment. |
| **What guidance is worth sharing?** | Prioritize in order: (1) Safety/allergies, (2) Foods households cook, (3) Patterns, (4) Caution, (5) Optimization. |
| **How should THA explain nutrition?** | Layer information; respect shallow reading; link goals to foods; teach through familiarity; never moralize. |
| **What are households actually constrained by?** | Budget, time, culture, taste, restrictions. Guidance that ignores these is useless. |
| **When knowledge conflicts with practicality, what wins?** | Practicality. Honesty > completeness; safety > optimization; household agency > optimization. |
| **How does this scale?** | Progressive enrichment pathways: benefit sourcing → learning → discovery → caution → ambient → community. Each phase respects the methodology. |

---

*Investigation completed: 2026-07-07*  
*Complementary to NK1 (canonical knowledge) and ARCHITECTURE_PRINCIPLES.md (platform governance)*  
*Next milestone: NK2 review by product/editorial/engineering alignment; methodology audit of existing surfaces; promotion to governing architecture if approved*
