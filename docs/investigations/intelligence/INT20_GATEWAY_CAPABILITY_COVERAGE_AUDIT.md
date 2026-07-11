# INT20 — Conversation Gateway Capability Coverage Audit

**Status:** Investigation complete  
**Date:** 2026-07-01  
**Scope:** All 11 capability bindings wired to the Conversation Gateway (INT18)  
**Method:** Static analysis — gateway routing logic, context-frame assembler, and all 11
handler files read in full. No production runs needed; all gaps are deterministic from the
code.

---

## 1. Gateway Architecture Recap

Before the per-capability analysis, a one-page map of the three moving parts that interact
to produce (or fail to produce) capability data.

### 1a. Capability selection — `selectCapabilities`

```
always add: "profile"
add primary:  SURFACE_CAP[frame.surface]  (see table below)
add keywords: up to 3 more, via regex scan of the user message
hard cap:     4 total (profile + primary + ≤2 keyword extras)
```

| Surface | Primary capability |
|---|---|
| `planner` | planner |
| `shopping` | shopping |
| `nutrition` | nutrition-knowledge |
| `pantry` | pantry |
| `diary` | diary |
| `profile` | profile |
| `household` | household |
| `partners` | partners |
| `templates` | templates |
| `analyser` | analyser |
| `meals` | meals |
| `floating` / `voice` | profile (profile is therefore added twice — deduplicated in practice) |

**Keyword regex coverage** — these cap IDs can be added by keyword; the rest cannot:

| Keyword pattern | Cap added |
|---|---|
| `planner\|week\|plan\|schedule\|meal.{0,10}week` | planner |
| `shop\|basket\|grocery\|groceries\|buy\|list` | shopping |
| `pantry\|fridge\|freezer\|larder\|stock\|stored` | pantry |
| `diary\|log\|track\|ate\|eaten\|calories.*today\|today.*calories` | diary |
| `household\|family\|member\|partner\|children\|kids` | household |
| `meal\|recipe\|cook\|dish\|food` | meals |

**Not keyword-reachable:** `nutrition-knowledge`, `templates`, `analyser`, `partners`

### 1b. Parameter construction — `buildCapabilityParams`

This is the function responsible for translating the assembled context frame into the
`intent.parameters` object each handler receives.

```
"planner"             → { scope: "week", weekId: frame.activePlannerWeekId }
                           — but only when activePlannerWeekId is non-null.
                           Falls back to {} when null (see §3.1)
"pantry"              → { scope: "list" }
"diary"               → { scope: "day", date: frame.temporalAnchor }
"meals"               → { scope: "list" }
"nutrition-knowledge" → { scope: "food", slug: frame.currentFoodSlug }
                           — only when currentFoodSlug is non-null.
                           Falls back to { scope: "list-foods" } when null
everything else       → {}
```

Five capability IDs have **no case** in `buildCapabilityParams`: `shopping`, `household`,
`partners`, `templates`, `analyser`. They always receive `{}`.

### 1c. Context frame — what the assembler can resolve

The assembler runs server-side on every request and populates:

| Frame field | Resolution strategy |
|---|---|
| `userId` | Session (always available for authenticated users) |
| `householdId` | `storage.getHouseholdByUser(userId)` — always attempted; populated when user belongs to a household |
| `activePlannerWeekId` | Surface hint → entity ref → **storage fallback** `storage.getPlannerWeeks(userId)[0].id` |
| `selectedMealId` | Surface hint → entity ref. No storage fallback. |
| `currentFoodSlug` | Surface hint → entity ref. No storage fallback. |
| `temporalAnchor` | Always "today's date" (ISO 8601, server clock) |
| `surface` | Supplied by the client call |
| `role` / `premium` | Derived from the user session |

Key takeaway: `activePlannerWeekId` is almost always resolvable (storage fallback exists).
`currentFoodSlug` and `selectedMealId` are only available when the client explicitly
provides a surface hint or a prior conversation entity reference. `householdId` is always
resolved — but is **not used** by `buildCapabilityParams`.

---

## 2. Per-Capability Analysis (all 11)

### 2.1 `profile`

**Gateway params passed:** `{}`  
**Handler scope requirement:** `undefined` or `"profile"` (optional — handler checks
`if (scope !== undefined && scope !== "profile") → gap`; the `undefined` branch is
explicitly allowed)

**Status: ✅ Works correctly**

Questions that work on any surface:
- "What are my dietary preferences?"
- "What allergens am I avoiding?"
- "What are my health goals?"
- "What's my calorie target?"
- "Which stores do I shop at?"
- "Tell me about my profile"

No limitations — the handler returns the full user row + preferences on every query. This
is intentional: profile is always selected and always succeeds, giving the LLM identity
and preference grounding on every turn regardless of other capability outcomes.

---

### 2.2 `planner`

**Gateway params passed:** `{ scope: "week", weekId: frame.activePlannerWeekId }` when
`activePlannerWeekId` is non-null; `{}` when null.

**Handler scope requirement:** `scope: "week"` with a valid `weekId` or `weekNumber`;
OR `scope: "calendar"` with `weekId`; OR `scope: "freezer"`. Anything else → gap.

**Status: ✅ Works in the common case; ⚠️ edge-case gap for brand-new users**

The assembler has a **storage fallback**: if neither a surface hint nor an entity ref
supplies `activePlannerWeekId`, it calls `storage.getPlannerWeeks(userId)` and takes the
first result. For any user who has ever created a planner week, `activePlannerWeekId` will
be populated and the params `{ scope: "week", weekId }` will be passed correctly.

The gap (`{}` → handler throws) is **only triggered** for a user with zero planner weeks
in the database (e.g. a brand-new account that has never opened the planner). In that
case, the handler's default branch throws a gap, `queryCapability` returns `null`, and the
LLM receives no planner data — which is actually correct: there is nothing to report.

**Limitation (not a bug):** The diary handler accepts only `scope: "week"` (a single week).
Cross-week or multi-week planner questions ("what have I planned for next month?") cannot be
answered; the gateway has no mechanism to pass multiple `weekId` values or a date range.

Questions that work:
- "What meals do I have this week?" (on any surface, for users with planner data)
- "Is Monday's dinner planned?"
- "Which days this week have no lunch?"

Questions that don't work:
- "What did I plan for last week?" (requires a different `weekId` — the assembler only
  resolves the current/first week, not a named past week)
- "Show me my whole 6-week plan" (gateway passes one weekId, not a range)

---

### 2.3 `shopping`

**Gateway params passed:** `{}`  
**Handler scope requirement:** `scope: "list"` | `"unresolved"` | `"basket"`. No scope →
handler default branch → throws gap immediately.

**Status: ❌ Always gaps — no shopping data is ever returned**

`buildCapabilityParams` has no case for `"shopping"`. Every shopping query — regardless of
surface or user message — sends `{}` to the handler, which throws a gap because it requires
an explicit `scope`. `queryCapability` catches the gap and returns `null`. The LLM never
receives shopping list data.

Questions affected (all of them):
- "What's in my shopping list?"
- "What groceries do I need this week?"
- "What's unresolved in my basket?"
- "What items are in my basket right now?"

**Root cause:** Missing `case "shopping": return { scope: "list" }` in
`buildCapabilityParams`.

---

### 2.4 `pantry`

**Gateway params passed:** `{ scope: "list" }`  
**Handler scope requirement:** `scope: "list"` (only supported scope)

**Status: ✅ Works correctly**

Questions that work:
- "What's in my pantry?"
- "What do I have in the fridge?"
- "What's in my freezer?"
- "Do I have any household essentials running low?"

The handler returns all pantry items across all storage areas (Larder/Fridge/Freezer) and
Household Essentials. No known gaps for this capability.

---

### 2.5 `diary`

**Gateway params passed:** `{ scope: "day", date: frame.temporalAnchor }` where
`temporalAnchor` is always today's ISO date (server clock).

**Handler scope requirement:** `scope: "day"` with a `date` param. Both are provided.

**Status: ✅ Works for today; ⚠️ intentional Phase 1 limitation — today only**

Questions that work:
- "What did I eat today?"
- "How many calories have I had today?"
- "Did I log my wellbeing today?"

Questions that don't work:
- "What did I eat yesterday?" (assembler always anchors to today; no date-parsing)
- "How many calories did I average this week?" (requires a date range; handler has no
  range scope; gateway has no range-passing mechanism)
- "Show me my mood trends" (progress/chart data is a separate scope not wired)

These are intentional Phase 1 limitations. The diary handler supports only `scope: "day"`,
and the gateway only ever passes today's date. Expanding to relative dates or ranges
requires changes to both the assembler (date NLP) and the handler (range scope).

---

### 2.6 `meals`

**Gateway params passed:** `{ scope: "list" }`  
**Handler scope requirement:** `scope: "list"` | `"summary"` | `"detail"`

**Status: ✅ Works; ⚠️ token-cost concern**

`scope: "list"` returns **every meal** the user owns plus every system meal, each with
full `ingredients[]` and `instructions[]` arrays. For users with a large personal library,
this payload can be substantial. The gateway applies no truncation or pagination before
passing the result to the LLM context. Large libraries may push the LLM context toward
token limits.

Questions that work:
- "What meals do I have saved?"
- "Do I have any vegetarian recipes?"
- "Is there a pasta dish in my meal library?"
- "Show me my freezer-eligible meals"

Questions that are capability gaps (intentional — from handler doc):
- "Find me a meal with chicken" (search not wired — `lookupMeals` has no ownership
  scoping so the Card flagged the `search` verb as unsafe to bind)
- "Recommend a meal for tonight" (ranking lives inline at the route layer, not via a
  delegate-only owner method)
- "What's the nutrition in this meal?" (nutrition is a separate table; out of scope for
  this binding by design)

The `detail` scope (single meal + items) is reachable **only** if `selectedMealId` is in
the context frame — but `buildCapabilityParams` always passes `{ scope: "list" }` regardless.
There is no pathway for the gateway to request detail for a specific meal.

---

### 2.7 `nutrition-knowledge`

**Gateway params passed:**
- With `currentFoodSlug` in frame: `{ scope: "food", slug: frame.currentFoodSlug }`
- Without `currentFoodSlug`: `{ scope: "list-foods" }`

**Handler scope requirement for the fallback:** handler's `handleRead` switch has cases
for `"food"` | `"nutrient"` | `"benefit"` | `"categories"` | `"foods"`. Note: **`"foods"`**,
not `"list-foods"`.

**Status: ✅ Works on food-detail contexts; ❌ always gaps on every other context**

When the user is on a food-detail page and the client passes `currentFoodSlug` as a surface
hint, the assembler populates `frame.currentFoodSlug` → gateway sends `{ scope: "food",
slug }` → handler returns the food's name, category, benefits, and nutrients. This path
works correctly.

In every other context (floating surface, shopping surface, any page without a food in
focus), `currentFoodSlug` is null → gateway sends `{ scope: "list-foods" }` → handler
receives `"list-foods"` as the scope, which is not in its switch statement → falls to the
`default` branch → throws a gap → `queryCapability` returns `null`.

The correct fallback scope is `"foods"` (which returns a card list of all foods in the
registry). The gateway sends `"list-foods"`. **This is a typo-level mismatch** between
`buildCapabilityParams` and the handler's enum.

Also note: `nutrition-knowledge` has **no keyword regex** in `selectCapabilities`. It is
unreachable from the `floating` or `voice` surface by keyword. It can only be reached if
the user's current surface is `nutrition` (where it is the SURFACE_CAP primary).

Questions affected:
- "What are the benefits of spinach?" (floating surface, no food slug → gap)
- "Tell me about vitamin C" (no keyword routing; not on nutrition surface → never selected)
- "What foods are good for energy?" (same — never selected on floating surface)
- "What nutrients are in oats?" (floating surface with "food" keyword → meals selected
  instead of nutrition-knowledge; and even if selected, `"list-foods"` typo → gap)

---

### 2.8 `household`

**Gateway params passed:** `{}`  
**Handler scope requirement:** `scope: "household"` | `"dietary-context"` | `"eaters"`.
No scope → handler gap.

**Status: ❌ Always gaps — no household data is ever returned**

`buildCapabilityParams` has no case for `"household"`. Despite the assembler correctly
resolving `frame.householdId` via `storage.getHouseholdByUser(userId)` on every request,
neither the `householdId` nor any scope is passed to the handler. The handler throws a gap
on `{}` → `queryCapability` returns `null`.

Questions affected:
- "Who's in my household?"
- "What does my household need this week?"
- "What are my family's dietary restrictions?"
- "How many people am I shopping for?"

**Root cause:** Missing `case "household": return { scope: "household" }` in
`buildCapabilityParams`. The frame has `householdId` available but it is not forwarded.

---

### 2.9 `partners`

**Gateway params passed:** `{}`  
**Handler scope requirement:** `scope: "retailers"` (only supported scope — explicit check
`if (scope !== "retailers") → gap`).

**Status: ❌ Always gaps — no retailer data is ever returned**

`buildCapabilityParams` has no case for `"partners"`. The handler requires exactly
`scope: "retailers"` and rejects anything else including `undefined`.

Additionally, `partners` has **no keyword regex**. On the `floating` surface it can only
be reached as a keyword-added capability if the user message happens to trigger the
`household` keyword (not the same thing). On the `partners` surface it is the primary — but
even then, the params are `{}` → gap.

Questions affected:
- "Which supermarkets do you support?"
- "What stores can I export my list to?"
- "Does THA support Waitrose?"

**Root cause:** Missing `case "partners": return { scope: "retailers" }` in
`buildCapabilityParams`.

---

### 2.10 `templates`

**Gateway params passed:** `{}`  
**Handler scope requirement:** `scope` must be one of `"meal-templates"` | `"meal-template"`
| `"plan-templates"` | `"plan-templates-mine"` | `"plan-templates-default"` |
`"plan-template"`. No scope → falls through all `if` branches → throws gap.

**Status: ❌ Always gaps — no template data is ever returned**

`buildCapabilityParams` has no case for `"templates"`. The handler has six valid scopes,
none of which is attempted.

Additionally, `templates` has **no keyword regex**. It is only reachable via the `templates`
surface, but even there the params are `{}` → gap.

Questions affected:
- "Show me my saved plan templates"
- "What's the default meal plan template?"
- "Do I have any plan templates I've created?"
- "What meal shell templates are available?"

**Root cause:** Missing `case "templates": return { scope: "plan-templates" }` (or
whichever scope is the sensible default) in `buildCapabilityParams`.

---

### 2.11 `analyser`

**Gateway params passed:** `{}`  
**Handler scope requirement:** `scope: "additives"` (only supported scope — explicit check
`if (scope !== "additives") → gap`).

**Status: ❌ Always gaps — no analyser data is ever returned**

`buildCapabilityParams` has no case for `"analyser"`. Like `partners`, the handler requires
an exact scope string and rejects `undefined`. Also like `partners` and `templates`,
`analyser` has **no keyword regex** — it is unreachable from floating surface by keyword.

Questions affected:
- "What additives should I be concerned about?"
- "Tell me about E numbers"
- "What's the risk level of E621?"

Note: Barcode/product UPF analysis is intentionally NOT in scope for this binding (per the
handler doc — the Card found no safe stored-read for live product analysis). The additive
reference table (`scope: "additives"`) is the only thing this binding can return, and it
currently never does due to missing params.

**Root cause:** Missing `case "analyser": return { scope: "additives" }` in
`buildCapabilityParams`.

---

## 3. Summary Table

| Cap | Always selected? | Keyword reachable? | Params gateway sends | Handler needs | Works? |
|---|---|---|---|---|---|
| profile | Yes (hardcoded) | — | `{}` | `{}` or `{ scope: "profile" }` | ✅ |
| planner | Primary on `planner` surface; keyword | planner/week/plan/schedule | `{ scope:"week", weekId }` / `{}` | `{ scope:"week", weekId }` | ✅ common; ⚠️ edge |
| pantry | Primary on `pantry` surface; keyword | pantry/fridge/freezer | `{ scope:"list" }` | `{ scope:"list" }` | ✅ |
| diary | Primary on `diary` surface; keyword | diary/log/track/ate | `{ scope:"day", date:today }` | `{ scope:"day", date }` | ✅ today only |
| meals | Primary on `meals` surface; keyword | meal/recipe/cook/dish | `{ scope:"list" }` | `{ scope:"list"\|"summary"\|"detail" }` | ✅ (list only) |
| nutrition-knowledge | Primary on `nutrition` surface | ❌ no keyword | `{ scope:"food", slug }` / `{ scope:"list-foods" }` | `"food"\|"nutrient"\|"benefit"\|"categories"\|"foods"` | ✅ with slug; ❌ typo fallback |
| shopping | Primary on `shopping` surface; keyword | shop/basket/grocery | `{}` | `{ scope:"list"\|"unresolved"\|"basket" }` | ❌ always gaps |
| household | Primary on `household` surface; keyword | household/family/member | `{}` | `{ scope:"household"\|"dietary-context"\|"eaters" }` | ❌ always gaps |
| partners | Primary on `partners` surface | ❌ no keyword | `{}` | `{ scope:"retailers" }` | ❌ always gaps |
| templates | Primary on `templates` surface | ❌ no keyword | `{}` | `{ scope: one of 6 values }` | ❌ always gaps |
| analyser | Primary on `analyser` surface | ❌ no keyword | `{}` | `{ scope:"additives" }` | ❌ always gaps |

---

## 4. Root Cause Classification

### RC-1: `buildCapabilityParams` missing 5 cases (shopping, household, partners, templates, analyser)

These five capabilities are fully implemented at the handler level but are never reached
because `buildCapabilityParams` sends `{}` and every one of their handlers requires an
explicit `scope`. A single `case` per capability in the switch block is all that is needed
to unblock each one.

Minimum additions needed:
```
case "shopping":  return { scope: "list" };
case "household": return { scope: "household" };
case "partners":  return { scope: "retailers" };
case "templates": return { scope: "plan-templates" };
case "analyser":  return { scope: "additives" };
```

### RC-2: `nutrition-knowledge` fallback scope mismatch (`"list-foods"` vs `"foods"`)

The gateway sends `{ scope: "list-foods" }` when no `currentFoodSlug` is available.
The handler's switch has `case "foods"` (without the `"list-"` prefix). One character
change in either `buildCapabilityParams` or the handler resolves this.

### RC-3: Four capabilities have no keyword routing

`nutrition-knowledge`, `templates`, `analyser`, and `partners` are unreachable from the
`floating` or `voice` surface by keyword. Users can only trigger them by being on the
matching named surface. If users ask nutrition, template, additive, or retailer questions
in the floating assistant, none of these capabilities are selected — the query is answered
from profile data only.

### RC-4: `planner` only surfaces one week; `diary` only surfaces today (intentional Phase 1 limits)

Both are by design. The assembler resolves a single anchor (one planner week, today's
date). Expanding to relative references ("last week", "yesterday") or ranges requires NLP
date parsing in the assembler and range scopes in the handlers — both are future work.

### RC-5: `meals` `scope:"list"` returns full text for every meal (token-cost concern)

Not a correctness bug — the data is accurate and the handler works. But for users with
large libraries, returning full `ingredients[]` + `instructions[]` for every meal in one
capability payload is expensive. The gateway has no mechanism to prefer `scope: "summary"`
(lighter projection) when only overview information is needed.

### RC-6: `selectedMealId` is assembled but never forwarded to any capability

The frame resolves `selectedMealId` but `buildCapabilityParams` never uses it. The meals
handler's `detail` scope requires `{ scope: "detail", mealId }` — there is currently no
gateway path to invoke it, even when a specific meal is in context.

---

## 5. What Questions Should Work Today

These questions are expected to return grounded data (assuming typical user state):

| Question | Surface | Caps providing data |
|---|---|---|
| "What are my dietary preferences?" | any | profile |
| "What allergens am I avoiding?" | any | profile |
| "What meals do I have this week?" | any (user has planner data) | planner + profile |
| "Is Monday's dinner planned?" | planner | planner + profile |
| "What's in my pantry?" | any | pantry + profile |
| "What do I have in the fridge?" | any | pantry + profile |
| "What did I eat today?" | any | diary + profile |
| "What meals do I have saved?" | any | meals + profile |
| "Do I have any vegetarian recipes?" | any | meals + profile |
| "What are the benefits of spinach?" | nutrition (with food in focus) | nutrition-knowledge + profile |

## 6. What Questions Are Broken (should work, don't)

These questions map to implemented, tested capability handlers but always return null due
to the gateway gaps above:

| Question | Surface | Problem |
|---|---|---|
| "What's in my shopping list?" | shopping / floating | RC-1: shopping always gets `{}` |
| "What groceries do I need?" | shopping / floating | RC-1: shopping always gets `{}` |
| "Who's in my household?" | household / floating | RC-1: household always gets `{}` |
| "What are my family's dietary restrictions?" | household | RC-1: household always gets `{}` |
| "What stores does THA support?" | partners / floating | RC-1: partners always gets `{}` |
| "What plan templates do I have?" | templates | RC-1: templates always gets `{}` |
| "What additives should I watch out for?" | analyser | RC-1: analyser always gets `{}` |
| "What foods are good for bone health?" | nutrition (no slug) | RC-2: `"list-foods"` typo |
| "Tell me about the nutrition knowledge base" | nutrition (no slug) | RC-2: `"list-foods"` typo |
| "What nutrition info do you have?" | floating | RC-2 + RC-3: no keyword + typo |
| "Tell me about my plan templates" | floating | RC-3: no keyword → cap never selected |
| "What E numbers are in your database?" | floating | RC-3: no keyword → cap never selected |

---

*End of INT20 investigation. No implementation was performed.*
