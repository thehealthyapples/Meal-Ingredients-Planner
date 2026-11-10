---
entry: cap-discovery-capabilities
name: Discovery capabilities
section: intelligence-capabilities
status: registered-unbound
visibility: household
owner: Colin Clapson
last_verified: 2026-11-10
version: 1
---

# Discovery capabilities

> Seven registered capabilities — one per household surface — exist to let
> Companion search within your meals, nutrition, planner, pantry, diary,
> shopping list, or household members. None of the seven can run a search yet.

## What it means for the household

Each of the seven capabilities below is registered in the Capability Registry
with a real, distinct purpose and a declared home in Companion's domain
structure — but none has an executable verb bound. Asking Companion to search
within any of these surfaces today correctly produces an honest gap, not a
defect: the registry itself declares the gap, so saying "I don't know" is the
right answer, not a routing failure.

| Capability | Would search for |
|---|---|
| `meal-discovery` | Recipes and meals — your cookbook, THA's library, meal templates |
| `nutrition-discovery` | Meals matching a nutritional criterion — calorie ceiling, protein floor, macro balance |
| `planner-discovery` | Meals already in your planner, across all weeks |
| `pantry-discovery` | Items in your pantry, larder, fridge, or freezer |
| `diary-discovery` | Food diary entries, by date or meal slot |
| `shopping-discovery` | Items on your shopping list, by name or category |
| `household-discovery` | Household members, their dietary preferences, and allergen restrictions |

## What it will never do

None of the seven invents a search result from general knowledge — each is
scoped to read only its own household's real data once it is wired. Until a
capability is bound with an executable verb, it will never fabricate a match
and will never silently fall back to a different capability's data to answer
in its place.

## Where it lives

| Capability | Owning service |
|---|---|
| `meal-discovery` | `server/intelligence/services/meal-discovery-engine.ts` |
| `nutrition-discovery` | `server/intelligence/services/nutrition-discovery-engine.ts` |
| `planner-discovery` | `server/intelligence/services/planner-discovery-engine.ts` |
| `pantry-discovery` | `server/intelligence/services/pantry-discovery-engine.ts` |
| `diary-discovery` | `server/intelligence/services/diary-discovery-engine.ts` |
| `shopping-discovery` | `server/intelligence/services/shopping-discovery-engine.ts` |
| `household-discovery` | `server/intelligence/services/household-discovery-engine.ts` |
| Registry | `server/intelligence/capability-registry.ts` (all seven ids above) |

This is one consolidated entry for all seven rather than seven near-duplicate
files, because all seven share the exact same status and the exact same
reason for it — a single, honest statement of "registered, not yet bound"
beats seven copies that would drift independently. If any one of the seven is
later given an executable verb, its row above stops being true and this
document becomes a defect until it is split out or corrected (Rule PKR15).

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-10._
