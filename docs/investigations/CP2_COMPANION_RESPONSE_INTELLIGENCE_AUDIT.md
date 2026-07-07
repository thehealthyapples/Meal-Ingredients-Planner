# CP2 — Companion Response Intelligence Audit

**Date:** 2026-07-04
**Scope:** Audit the live Companion ("Apple") response quality on the existing Intelligence Platform.
**Method:** 27 realistic user questions run end-to-end through the real Companion turn pipeline
(`conversationGateway.processUserTurn` → Canonical Intent Resolver → Capability Registry →
Intelligence Platform → OpenAI `gpt-4o-mini`), the exact code path behind the UI's
`POST /api/intelligence/conversation/turn`. Run against real production data (user 1: Keto diet,
household of 2 adults + 2 children, 591 visible cookbook meals, 6 planner weeks, food diary
entries). OpenAI key and database were live.

> **Faithfulness note.** Questions were driven directly against the production gateway singleton
> rather than clicked in the browser, because that singleton *is* the Companion — the HTTP route is
> a thin auth+JSON wrapper around it (`server/routes.ts:11288`). Each question was additionally
> instrumented to capture the resolved intents and each capability's raw platform outcome, so every
> PARTIAL/FAIL has a traced root cause, not a guess.

---

## 1. Result summary

| Classification | Count | Questions |
|---|---:|---|
| **PASS** | 14 | P1, P2, P3, M1, M2, S1, PA1, D1, N4, H1, PT1, T1, W1, O1 |
| **PARTIAL** | 6 | P4, PL1, PL2, N1, N3, O2 |
| **FAIL** | 7 | M3, M4, PA2, N2, A1, A2, K1 |

*P1–P3 were FAIL at audit start; they are PASS after the fix applied in §4. The 14/6/7 split is the
post-fix state. Pre-fix was 11 PASS / 6 PARTIAL / 10 FAIL.*

**Headline:** The Companion is genuinely strong on **"read my own data"** questions (meals, shopping,
pantry, diary, household, partners, templates) and correctly honest on **write intents** and
**out-of-scope** questions. It is weak on three recurring seams: (1) **direct profile self-questions**
(now fixed), (2) **conceptual / knowledge-base coverage** (UPF definitions, per-additive lookup,
benefit→food links, common-food evidence), and (3) **filtered/derived queries** ("high in protein",
"cook with my pantry") where the resolver falls back to an unfiltered list the LLM then can't mine.

---

## 2. Question set, expected vs actual, classification

| # | Question | Surface | Expected | Actual (verbatim, trimmed) | Class |
|---|---|---|---|---|---|
| P1 | What's my diet pattern? | floating | "Keto" | *(pre-fix)* "I'm not sure I understood that question…" → *(post-fix)* **"Your diet pattern is Keto."** | PASS\* |
| P2 | What diet am I following? | floating | "Keto" | *(post-fix)* "You are following a Keto diet." | PASS\* |
| P3 | Do I have any dietary restrictions? | floating | "None recorded" | *(post-fix)* "You do not have any dietary restrictions." | PASS\* |
| P4 | How many people are in my household? | floating | 2 adults + 2 children | "There are two people in your household." | PARTIAL |
| M1 | How many meals are in my cookbook? | meals | count | "You have 591 meals in your cookbook." | PASS |
| M2 | What chicken meals do I have? | meals | chicken list | Lists Thai green chicken curry, Chicken Quesadilla, Chicken & Celery Stir-Fry with IDs | PASS |
| M3 | What meals do I have that are high in protein? | meals | high-protein meals | "I don't have that information right now." | FAIL |
| M4 | Show me some breakfast ideas from my meals | meals | breakfast meals | "I don't have that information right now." | FAIL |
| PL1 | What's on my meal plan this week? | planner | this week's plan | "I don't have that information right now." *(but works with active-week hint — see §3)* | PARTIAL |
| PL2 | What am I having for dinner tonight? | planner | tonight's dinner | "I don't have that information right now." | PARTIAL |
| S1 | What's on my shopping list? | shopping | list items | Lists onion, olive oil, garlic, lean beef, mushroom, oregano, canned tomato, beef stock | PASS |
| PA1 | What's in my pantry? | pantry | pantry contents | Lists pantry items correctly (all non-food defaults — see §3) | PASS |
| PA2 | What can I cook with what I have in my pantry? | pantry | cookable meals | "I don't have that information right now." | FAIL |
| D1 | What have I logged in my food diary recently? | diary | recent entries | Lists chicken jalfrezi, iced fairy cakes, creamy courgette lasagne with dates | PASS |
| N1 | What are the benefits of salmon? | floating | cited benefits | "…I don't have trusted information stored to answer it yet — I'd rather say so than guess." | PARTIAL |
| N2 | What foods help with sleep? | floating | foods linked to sleep | "I don't have that information right now." | FAIL |
| N3 | Is broccoli good for you? | floating | broccoli nutrition | "…I don't have trusted information stored to answer it yet…" | PARTIAL |
| N4 | What's the nutritional value of eggs? | floating | egg nutrition | "Eggs are a complete protein food supplying vitamin D, B12, selenium, iodine…" | PASS |
| A1 | What are ultra-processed foods? | analyser | UPF/NOVA concept | "I don't have that information right now." | FAIL |
| A2 | What is E621? | analyser | additive info (MSG) | "I don't have that information right now." | FAIL |
| H1 | What dietary restrictions does my household have? | household | household restrictions | "Your household does not have any hard dietary restrictions listed." | PASS |
| PT1 | Which supermarkets can I compare prices at? | partners | retailer list | Lists Tesco, Sainsbury's, Ocado, Asda, Morrisons, Waitrose, Amazon Fresh, Aldi, Lidl | PASS |
| T1 | What meal plan templates are available? | templates | templates | Lists templates with IDs | PASS |
| K1 | What foods are good for a keto diet? | floating | keto foods | "I'm not sure I understood that question…" | FAIL |
| W1 | Add chicken curry to my shopping list | shopping | honest can't-write gap | "I can read and explain your data, but I can't add items… yet." | PASS |
| O1 | What's the weather like today? | floating | honest out-of-scope | "I'm not sure I understood that question…" | PASS |
| O2 | How many calories should I eat to lose weight? | floating | careful, no medical prescription | "I'm not sure I understood that question…" | PARTIAL |

\* P1–P3 fixed during this audit (§4).

---

## 3. Root causes (every PARTIAL and FAIL)

### RC-1 — Profile self-questions never counted as "understood" *(P1, P2, P3 — FIXED)*
`pattern-intent-resolver.ts` only ever added the `profile` capability as an **always-on baseline**
intent (`resolve()` step 4, confidence 0.50, `baseline: true`). There was **no specific matcher** for
direct questions about the user's own profile. When no other matcher fired, the baseline profile
intent carried `gap: { kind: "unknown" }`, the gateway filtered it out of `queryable`, `classifyTurn`
saw no routed capability, and the turn fell to `no-route` → *"I'm not sure I understood that."* — even
though the profile read returns exactly the requested data (`dietPattern: "Keto"`, `dietRestrictions: []`).
**Fixed in §4.**

### RC-2 — Household size conflates two sources *(P4 — PARTIAL)*
"How many people are in my household?" routes to `household.read`, which counts **linked household
member accounts** (= 2) and answered *"two people."* The user's `user_preferences` separately records
`adults_count: 2, children_count: 2` (the planner's notion of who is eaten for). The two notions
disagree and the Companion silently picked the members count, which under-reports the household the
user actually plans for. Not wrong per its data source, but misleading to the user.

### RC-3 — Planner "this week / tonight" has no server-side active-week resolution *(PL1, PL2 — PARTIAL)*
`planner.read` requires an explicit `weekId`/`weekNumber` (or `dayId`); scope `undefined` is an honest
gap, and "today/tonight" is deliberately an honest gap ("the planner owns no calendar mapping").
Verified: with the `activePlannerWeekId` surface hint the planner page passes, PL1 answers correctly —
*"You currently have no meals planned for this week (Week 6)."* So PL1 **works on the planner surface**
but the **floating assistant path** (no hint) returns a generic *"I don't have that information"*
instead of resolving the user's active/current week. PL2 ("tonight") is a by-design gap but the reply
reads as a non-answer rather than an explanation of why.

### RC-4 — Filtered meal queries fall back to an unfiltered, truncated list *(M3, M4 — FAIL)*
- **M3 "high in protein":** did not route to the nutrition/macro meal-discovery search; it matched the
  generic `meals.read` (scope `summary`). That payload carries no per-meal nutrition, so the LLM
  correctly could not identify high-protein meals and said *"I don't have that information."*
- **M4 "breakfast ideas from my meals":** `meal-discovery.search` received the raw query
  `"breakfast ideas from my"` (stop-words not stripped) → **0 results**; `meals.read` returned the full
  591-meal list, which is then hard-truncated to `CAP_DATA_MAX_CHARS = 1800` (~4 meals) before reaching
  the LLM, so it cannot pick out breakfasts. Two compounding causes: weak query extraction and blunt
  truncation of large lists.

### RC-5 — "Cook with my pantry" is not implemented as pantry→meal matching *(PA2 — FAIL)*
`meal-discovery.search` was handed the literal query `"what i have in my pantry"` → 0 results; the
`pantry.read` result was returned but contains this user's pantry, which is **entirely non-food default
stock** (toilet roll, bleach, cling film…). There is no capability that intersects pantry food items
with cookable meals, so the LLM had nothing to combine → *"I don't have that information."*
*(Secondary data-quality note: the pantry is seeded with 138 household-supply defaults and no food, so
even a correct implementation would return little for this user.)*

### RC-6 — Knowledge base coverage gaps *(N1, N3 — PARTIAL; N2 — FAIL)*
The nutrition knowledge layer correctly enforces the evidence gate (PKC Phase 0): it refuses to make
benefit claims without stored evidence.
- **N1 salmon / N3 broccoli:** `nutrition-knowledge.explain` returned an honest `no-knowledge` gap —
  these common foods have **no curated evidence records**, so the Companion honestly declines. Correct
  behaviour, but a coverage gap for two of the most obvious foods a user would ask about.
- **N2 "foods that help with sleep":** the search found the benefit `sleep-quality` but returned
  `foods: []` — the benefit taxonomy exists yet **no foods are linked to it**, so the LLM got an empty
  set and said *"I don't have that information."* This is a broken/empty edge in the knowledge graph,
  worse than the honest N1/N3 gap because it neither answers nor cleanly discloses.

### RC-7 — Analyser has no concept/definition or per-additive lookup *(A1, A2 — FAIL)*
The `analyser` matcher routes any UPF/additive phrasing to `analyser.read` scope `additives`, which
returns the **full 300-row additive table**.
- **A1 "what are ultra-processed foods?":** a conceptual/definition question — there is no "explain
  UPF/NOVA" scope, so the user gets a truncated additive dump the LLM can't turn into a definition.
- **A2 "what is E621?":** the query's E-number is not extracted to filter the table; the list is
  truncated at 1800 chars long before E621 (MSG), so the specific additive never reaches the LLM.

### RC-8 — No matcher for "foods for \<diet\>" *(K1 — FAIL)*
"What foods are good for a keto diet?" matched nothing utterance-derived (keto is neither a benefit nor
a nutrient term, and there is no diet→foods matcher) → `no-route`. A natural, on-brand question for a
Keto user is met with *"I'm not sure I understood that."*

### RC-9 — Medical questions decline via the wrong door *(O2 — PARTIAL)*
"How many calories should I eat to lose weight?" is correctly **not** answered (no medical
prescriptions — the intended firewall). But it exits through the generic `no-route` *"I'm not sure I
understood that"* path, which misrepresents a deliberate safety boundary as a comprehension failure.
Safe, but poor UX and it hides the real reason.

---

## 4. Fixes applied

Only **one** change met the "obvious, low-risk" bar and it was applied and verified.

### FIX-1 — Specific matchers for profile self-questions *(resolves RC-1: P1, P2, P3)*
`server/intelligence/pattern-intent-resolver.ts` — added a `PROFILE_MATCHERS` array (appended **last**
in `ALL_SPECIFIC_MATCHERS`, so any more-specific single-domain matcher still wins its own capability)
covering: diet pattern / "what diet am I on", dietary restrictions & allergies, food preferences,
health goal, and calorie target. Each returns a routed (non-baseline) `profile.read`, which marks the
turn "understood" and feeds the already-working profile data to the LLM.

Guards keep the change tight:
- A **household/family guard** (`household|family|everyone|our`) prevents "my household's restrictions"
  from being re-pointed at the individual profile (H1 still routes to `household`).
- The allergy/restriction matcher requires a first-person self-reference, so it can't catch third-party
  phrasings.
- No matcher touches calorie *advice* phrasing, so the medical question O2 is unaffected.

**Verification (live turns, post-fix):**
- "What's my diet pattern?" → **"Your diet pattern is Keto."**
- "What diet am I following?" → **"You are following a Keto diet."**
- "Do I have any dietary restrictions?" → **"You do not have any dietary restrictions."**
- "What are my food preferences?" → **"…family-friendly, whole-foods, and keto… standard budget level."**
- Regression: "What dietary restrictions does my household have?" still → household; "How many calories
  should I eat to lose weight?" still → `no-route` (unchanged); "What chicken meals do I have?" unchanged.

**Tests:** added a "Profile self-questions" section (8 assertions, incl. the two regression guards) to
`server/tests/test-intent-resolver.ts`. Full suite: **147 passed / 0 failed** (was 139).
`test-intelligence-profile-binding.ts`: **50 passed / 0 failed**.

*Everything else was left as a recommendation — the remaining causes are matcher-taxonomy design,
knowledge-base content, or truncation/query-extraction changes that carry regression risk and warrant
their own scoped work, not an opportunistic edit during an audit.*

---

## 5. Recommendations (prioritised, not applied)

**P0 — cheap, high value**
1. **RC-8 / RC-1 extension:** add a "foods for \<diet\>" matcher (keto, low-carb, vegetarian…) routing
   to the food-intelligence/meal-discovery recommend path. Turns K1 and similar diet questions from
   `no-route` into real answers for exactly the audience THA targets.
2. **RC-9:** give medical/prescriptive questions a dedicated honest boundary reply ("I can't give
   personalised calorie or medical targets, but here's what I *can* do…") instead of the generic
   "didn't understand" fallback. A classifier/matcher for prescriptive-advice phrasing, replying with a
   purpose-built message.

**P1 — moderate, high value**
3. **RC-4 (M3):** route macro/nutrient meal filters ("high in protein", "low carb meals") to the
   nutrition meal-discovery search (the "filter meals by nutritional content" capability already
   exists) rather than the unfiltered `meals.read`.
4. **RC-4 (M4) / RC-5:** strip stop-words before handing a query to `meal-discovery.search`, and raise
   or paginate `CAP_DATA_MAX_CHARS` for list-shaped capability payloads (or summarise server-side) so
   large cookbooks aren't truncated to ~4 items before the LLM sees them.
5. **RC-3:** resolve "this/current week" and "tonight/today" to the user's active planner week/day
   server-side (the data exists — the active-week hint proves it) so the floating assistant matches the
   planner surface. At minimum, replace the generic "I don't have that information" with an explanation
   for the deliberate today-mapping gap.

**P2 — content / knowledge investment**
6. **RC-6:** backfill curated evidence for high-frequency foods (salmon, broccoli, chicken, eggs…) and
   link foods to existing benefit slugs (e.g. `sleep-quality`) so benefit→food searches return sets.
   Where a benefit exists but has no linked foods, disclose that specifically rather than returning the
   generic non-answer (N2).
7. **RC-7:** add an analyser "explain UPF/NOVA" concept scope (A1) and a per-additive lookup that
   extracts the E-number/name from the query and returns just that additive (A2).

**P3 — consistency**
8. **RC-2:** reconcile the two household-size notions (member accounts vs `adults_count`/`children_count`),
   or have the Companion answer with both ("2 adult members; your plan is set for 2 adults + 2 children").
9. **Data quality (not a Companion bug):** user 1's pantry holds only non-food default supplies — worth
   checking whether pantry seeding/onboarding is leaving real users without any food pantry, which
   silently defeats every "what can I cook" flow.

---

## 6. What's genuinely good (keep)

- **Honest-gap discipline is excellent.** Write intents (W1), out-of-scope (O1), un-evidenced nutrition
  claims (N1/N3) and unresolved planner scopes all decline cleanly instead of hallucinating — the
  grounding firewall in `buildGroundedResponse` is doing its job.
- **"Read my own data" is reliable and well-phrased** across meals, shopping, pantry, diary, household,
  partners, templates — concise, cited to real entities with IDs, and personality-consistent.
- **The architecture made this audit tractable:** one gateway seam, typed intents, per-capability
  outcomes, and classified fallback states meant every failure traced to a specific matcher, scope, or
  knowledge row — no black-box guessing.

---

*Fix commit touches `server/intelligence/pattern-intent-resolver.ts` and
`server/tests/test-intent-resolver.ts` only. No capability, gateway, or schema changes.*
