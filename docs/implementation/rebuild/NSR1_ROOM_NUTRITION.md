# NSR1 Phase 2 — Nutrition (craft wave)

**Room:** Nutrition — `/nutrition` → `plant-diversity-page.tsx` (+ `HouseholdNutritionCentre.tsx`, `FoodReport.tsx`)
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Owners:** UIOWN1 §8 (Nutrition owns nothing as a room — knowledge is Domain 1's; no target/score exists) · CRAFT1 §5 · GEA8/13/21/22

## Design (architecture first)
The noticeboard by the garden view: unhurried, factual, never appraised. It reports the variety
already on the household's table as *fact*; it never grades that variety or recommends foods (that is
the Companion's, GEA8/22). PRESENCE1 rebuilt the **Foods** tab to standard; this pass brings the
**Nutrients** tab (`HouseholdNutritionCentre`) to the same bar.

## Changes (presentation-only)
1. **Removed the category progress bars** (`CategoryProgressBlock`) — an emerald fill toward
   `enjoyed/total`, a bar filling toward a total the household never set. **GEA13** forbids this by
   name (the same defect PRESENCE1 removed from the Foods tab); it survived here. Now a plain count of
   kinds per category — the count is the fact, the denominator and fill were the judgement.
2. **Removed the "You might enjoy" suggestions** in the Discovery card — suggesting a food is the
   Companion's (**GEA8/22**; UIOWN1 §8). Truthful reporting kept ("Recently discovered", "Not cooked
   recently"); the card's visibility no longer depends on suggestions.
3. **Neutralised appraisal framing** (**GEA21**, CRAFT1 §5 — a count is reported, not celebrated):
   "celebrate first" → the facts, reported; "Plants **enjoyed**" → "Different plants"; eyebrow "Your
   nutrition **journey**" → "Nutrients"; title "Your discovery **journey**" → "Recently in your kitchen".
4. **Removed imperative counsel**: page subtitle "…**discover ingredients to try next**" → "What your
   household eats, and the variety already on your table"; `FoodReport` heading "**Broaden** Your
   Variety" → "Other varieties" (**GEA8/21** — the room labels, it does not instruct).

## Not done — routed to owners
- Whether the whole "Nutrients" centre should exist as a room feature (UIOWN1 §8 — the room owns
  nothing; much of it reads as Companion-shaped intelligence in room chrome). Owner.
- Confirm `/api/nutrition-centre` gates any benefit *claims* through the PKC evidence sign-off
  (Core Principle 6 at the source, not the room's to fix). Backend.
- Category-marker emoji vs the house's one illustration hand. Owner.

## Verification
`tsc --noEmit`: 0 errors across the three files. Diff: **36 insertions / 54 deletions** (net −18). No
test/e2e asserts any removed string. Live visual review recommended.

## Data / Trust / Scope
No schema/API/storage/business-logic change; `server/` untouched. Removing the progress bars and
suggestions *increases* honesty — the room now reports variety and grades nothing (GEA13, Core
Principle 6). Rollback: reset to the NSR1 tag.

## Quality Standard
Closer to "would the Home Owner happily spend time here?" — the noticeboard now reports without
grading or nudging. The open owner question (should the Nutrients centre exist at all) is what remains.
