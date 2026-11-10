---
entry: cap-discovery-capabilities
name: Discovery capabilities
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-11-10
version: 2
---

# Discovery capabilities

> Seven live, registered capabilities — one per household surface — let
> Companion search within your meals, nutrition, planner, pantry, diary,
> shopping list, or household members, and each is reachable from natural
> conversation today.

## What it means for the household

**Correction (2026-11-10):** version 1 of this document stated that none of
the seven could run a search and that asking Companion to search any of
these surfaces produced an honest gap. That was wrong — checked against the
static pre-bind declaration in `capability-registry.ts` rather than the live,
bootstrapped registry. Every one of the seven executes `search` right now,
and the Intent Resolver carries dozens of real pattern matchers reaching each
of them from ordinary conversational phrasing — this is a mature, heavily
used part of the Companion, not a stub.

| Capability | Searches | Example |
|---|---|---|
| `meal-discovery` | Recipes and meals — your cookbook, THA's library, meal templates | "do I have a chicken recipe?" |
| `nutrition-discovery` | Meals matching a nutritional criterion | "what's high in protein?" |
| `planner-discovery` | Meals already in your planner, across all weeks | "do I have chicken planned this week?" |
| `pantry-discovery` | Items in your pantry, larder, fridge, or freezer | "do I have any onions?" |
| `diary-discovery` | Food diary entries, by date or meal slot | "what did I eat yesterday?" |
| `shopping-discovery` | Items on your shopping list | "is milk on my list?" |
| `household-discovery` | Household members, their diets and allergen restrictions | "who in my household is vegetarian?" |

## What it will never do

None of the seven invents a search result from general knowledge — each is
scoped to read only its own household's real data. Two of the seven
(`meal-discovery`, `nutrition-discovery`) are also registered for a
`recommend` verb that is **not yet executable** — asking for a search is
answered from real data; asking Companion to actively *recommend* one from
either of those two specific capabilities is still an honest gap today
(a ranking method does not yet exist). The other five never declared
`recommend` at all, so no such gap applies to them.

## Where it lives

| Capability | Owning service |
|---|---|
| `meal-discovery` | `server/intelligence/handlers/meal-discovery-handler.ts` |
| `nutrition-discovery` | `server/intelligence/handlers/nutrition-discovery-handler.ts` |
| `planner-discovery` | `server/intelligence/handlers/planner-discovery-handler.ts` |
| `pantry-discovery` | `server/intelligence/handlers/pantry-discovery-handler.ts` |
| `diary-discovery` | `server/intelligence/handlers/diary-discovery-handler.ts` |
| `shopping-discovery` | `server/intelligence/handlers/shopping-discovery-handler.ts` |
| `household-discovery` | `server/intelligence/handlers/household-discovery-handler.ts` |
| Intent routing | `server/intelligence/pattern-intent-resolver.ts` (dozens of matchers per capability) |
| Registry | `server/intelligence/capability-registry.ts` (all seven ids above) |

This remains one consolidated entry for all seven rather than seven
near-duplicate files: they are still the same SHAPE of capability (a single
read-only `search` verb over one household surface), even though version 1's
claim about their status was wrong. If any one of the seven's behaviour
diverges from this shape in the future, split it into its own document rather
than letting this one state something false for the others (Rule PKR15).

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-10._
