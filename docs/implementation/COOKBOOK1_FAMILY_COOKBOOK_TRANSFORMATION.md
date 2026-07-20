# COOKBOOK1 — The Family Cookbook Transformation

**Status:** Implementation report. `COOKBOOK1` (2026-07-20).
**Layer:** Experience Implementation. It originates no law (`GOVERNING_EXPERIENCE_ARCHITECTURE.md` § 2.1, **GEA20**).
**Judged against:** `GOVERNING_EXPERIENCE_ARCHITECTURE.md` (the Experience Constitution) and `docs/investigations/EXPREVIEW1_FIRST_TIME_HOUSEHOLD_EXPERIENCE.md` § 6.
**Rollback:** `rollback/COOKBOOK1-family-cookbook-transformation-20260720` → `d03e77ff`

---

## 1. The mission, and what actually turned out to be wrong

The brief was to make the Cookbook feel like a treasured family cookbook rather than a generated recipe catalogue.

EXPREVIEW1 had already found the room and judged it the worst in the house — *"the floor"* of an experience it scored 5.5/10 overall. Its § 6 is worth restating because it is the specification this change was built against:

> "Twelve cards. One combinatorial engine. A visible loop over {black bean, butter bean, cannellini bean, chicken thigh} × {cabbage, celery} × {beetroot, cucumber, tomato}. And at the end of it, a recipe whose name ends in the digit **2**, because the machine collided with itself and appended an integer."

> "A cookbook is supposed to be the warmest object a family owns — stained, annotated, opened to the page that always falls open. **This is a search index with a view.**"

The investigation treated this as a content problem: five hundred bad recipes, replace them with twenty good ones. Building the fix surfaced something the review could not see from the outside, and it is the actual finding of this workstream:

> **The room had no way to tell an authored recipe from a generated one, because nothing in THA owned that distinction.**

All 500 rows of the founding import carry `acquisition_type: "authored"` — including the 490 that were emitted from a template. The provenance record asserts authorship that did not happen. Downstream of that, `meals-page.tsx` had a private `getMealDisplayCategory()` that returned `"tha_meals"` for all five hundred, under a private `SECTION_LABELS` entry reading **"Wholefood Suggestions"**. The room could only present a generator's output as a cookbook, because at no layer did anything know it wasn't one.

That is a **GEA17** violation (*the presentation layer owns no fact*) with a **GEA18** violation behind it (*one owner per experience concern*), and it is why the room read as machine output. The cards were never the problem. The absence of an owner was.

---

## 2. Architecture compliance

### 2.1 The Experience Constitution Check (§ 18.2)

| Gate | Result |
|---|---|
| **HOSPITALITY** (§ 3.1) | No trade was required. The room got quieter and faster to read at the same time. |
| **OUTCOME** (§ 3.5) | **(2) more confidence in a decision already made**, and **(4) a small, true, unearned pleasure**. A household opening the Cookbook now meets ten recipes with names a person wrote, rather than a wall of permutations. Nothing was added to their mind. |
| **WEIGHT** (§ 3.3, **GEA2**) | The room is materially lighter: card controls fell from 528 to 96 across the visible set (§ 5). No panel, badge or strip was added. The one thing added — the library door — replaces an infinite scroll, and is a smaller surface than what it retired. |
| **VOICE** (§ 7, **GEA8/9**) | Nothing here coaches. "Wholefood **Suggestions**" was the room suggesting in its own voice; it is retired. The library door states a fact and offers a choice. |
| **OWNERSHIP** (§ 7.4, **GEA21/22**) | Every statement the room makes is a fact it owns: a shelf name, a recipe name, a freezer portion count. Nothing congratulates, persuades or judges. The one interpretive surface removed from the card — the "Why Good" tab — was a room interpreting, and it is gone from the Cookbook. |
| **AGENCY** (§ 7.4, **GEA23**) | **This is the gate this change came closest to failing, and it is why the generated cohort was demoted rather than deleted.** Nothing was removed from the household's reach: the 490 remain owned by the meal record, fully searchable, fully available to the planner, and reachable in one click. The household decides whether to meet them; THA does not decide for them and present the result as settled. |
| **RESTRAINT** (§ 9 / § 13 / § 15) | Counts removed (§ 5). No score, streak, rank or reward was added or retained on this surface. The images-first sort — a room reorganising itself around its content — was retired. |
| **LAYER** (§ 2.1, **GEA20**) | This is an Implementation-layer change realising **GEA17/GEA18**. It originates no principle. What it discovered that is durable — that provenance asserts authorship for generated rows — is written up as an owner decision (§ 8), not left in this report as a fact only this report knows. |

### 2.2 The preservation constraints

The brief named four things to preserve. Each was verified, not assumed:

| Constraint | How it was preserved | Evidence |
|---|---|---|
| **Canonical food ownership** | Untouched. No canonical food, resolver, or knowledge module was read or written. | `test:canonical-food`, `test:knowledge-food-ownership` unaffected; no file under `shared/canonical/` or `shared/knowledge/` modified. |
| **Meal ownership** | Untouched. `meals` remains the sole owner of a recipe. No meal was deleted, no ownership reassigned, no second record of a recipe created. `shelfForMeal` **reads** a meal and returns a label; it stores nothing. | `test:cbk1-cookbook-seed` 37/37 pass; `test:surf1c1` 81/81 pass, including *"2323 user-owned meals — outside this mandate, and none was written"*. |
| **Planner architecture** | Untouched. `CookbookMealIntelligenceStrip` was removed from the Cookbook card but **deliberately not deleted** — the planner still owns and renders it (`weekly-planner-page.tsx:3803`). Every demoted recipe remains reachable by the planner. | `test:planner-compliance` 25/25; `test:rm4-planner-ready-meal-library` 21/21. |
| **Intelligence platform** | Untouched. No assembler, capability, binding or registry was modified. | `test:intelligence-platform` 33/33; `test:intelligence-meals-binding` 72/72. |

**No duplicate models or ownership were introduced.** No schema change was made, no table added, no column added, and no second record of a recipe exists. `shared/cookbook/curation.ts` is a pure classifier over a meal the `meals` table already owns.

---

## 3. What was built

### 3.1 A single owner for shelving — `shared/cookbook/curation.ts` (new)

The one thing the room was missing. It owns the shelf vocabulary, the rule that assigns a meal to a shelf, and the names shelves carry in the interface.

Six shelves: `household` · `kitchen` · `web` · `packaged` · `drinks` · `library`.

The load-bearing addition is the split of what used to be one bucket:

- **`kitchen`** — the ten recipes a person actually wrote. *Apple, Oat & Cinnamon Morning Bowl. Gentle Taco Rice Bowls. Lentil & Root Vegetable Cottage Pie.*
- **`library`** — the 490 template-generated variations.

The cohort is recognised by the cuisine-template prefix the generator used (`{Cuisine}-style ` / `British `). Verified against the live database: **10 authored, 490 generated, 384 system rows that are not recipes at all** (drinks and packaged products — 7UP, Actimel, baby food — which shelve as `drinks`/`packaged` before the question is ever asked).

A name-shape rule is a thing to be embarrassed about rather than proud of. It is here because the field that should carry this fact says `"authored"` for all 500. Correcting that is § 8.

### 3.2 The predecessors it retired (GEA18)

In the same change, as the constitution requires:

| Retired | Was |
|---|---|
| `getMealDisplayCategory()` | Private to the page; returned `"tha_meals"` for all 500 |
| `SECTION_LABELS` | Private to the page; contained **"Wholefood Suggestions"** |
| `MEAL_CATEGORY_ORDER` | Private to the page |
| `sectionCounts` | Rendered **"· 500"** above the shelf |
| the in-card tab strip | Ingredients / Nutrition / "Why Good", inside every card |
| the six-icon `MealActionBar` on the grid card | **A pure duplicate** — every one of its six actions already existed in `CardActionsMenu` on the same card |
| the images-first sort tiebreak | Split every shelf into a photographed top and an icon-wall bottom |
| `cardInfoTabs` state | State for a strip that no longer exists |

The action bar deserves a note, because removing controls usually costs capability and here it cost none. `CardActionsMenu` already contained View recipe, Add to planner, Add to basket, Analyse, Freeze and the image actions. The six-icon footer was a **second owner of the card's actions**, not a second route to them.

### 3.3 The room

- **Curation over volume.** The `library` shelf is not rendered when browsing. It is not deleted, not hidden from search (searching reaches into it), and not withheld from the planner. A household who wants it opens it: *"There is a wider library of recipe variations behind the cookbook. Searching already looks inside it."*
- **Food is the hero.** The image went from a 96–128px letterbox to a 4:3 plate. The black name-pill that was printed *across* the photograph is gone; the recipe's name now sits beneath it in `.title-card`, the house's own card type. The serves badge came off the image (it is recipe metadata, and it lives on the recipe). The freezer portion count stayed — it is a fact about the household's own freezer and the one thing that changes what they cook tonight.
- **Shelves are named, not counted.** `title-section`, no `· N`, no rule-off line. Air separates shelves (**GEA11**).
- **`"Show more (836 remaining)"` → `"More recipes"`.**

### 3.4 Signs of machine generation, removed

- **The magic wand.** `Wand2` was the default placeholder for every un-photographed recipe in the house — the most common thing a household saw where a picture of dinner should be was *an AI icon*, on precisely the recipes that most needed to look authored. Replaced with a quiet empty plate (**GEA16**; honest absence, **GEA15** § 15.3).
- **"Generate AI image" / "Regenerate AI image" / "AI image generated"** → **"Illustrate this recipe" / "Illustrate it again" / "Illustration added"**. Honest about what it produces — an illustration, not a photograph of the household's food — without advertising the machine (**GEA16**).
- **"AI will extract the title, ingredients, and steps"** → **"The title, ingredients and steps are read off the page. You review them before anything is saved."**

### 3.5 Data repair — `scripts/repair-cookbook-recipe-names.ts` (new)

Reports both naming defects; repairs only the one that is safe to repair.

**Repaired (468 system rows + 38 household copies = 506 total, applied to the dev database and to the source data):** the generator lower-cased the cuisine token mid-title (*"Australian cafe-Style"*, *"French country-Style"*) and capitalised the style suffix throughout. Both normalise to *"Australian Cafe-style"*, *"Pakistani-style"*. This changes spelling, never identity.

**Reported, never repaired:** the collision integers. There are **127**, and they run **as high as 9** — EXPREVIEW1 found one *"Rice Bowl 2"* and drew the right conclusion from it, but the defect is an order of magnitude larger than the sample suggested. The script refuses to strip them, and the refusal is the point: removing `" 2".." 9"` does not produce eight well-named recipes, it produces eight recipes with *identical* names, because the recipes themselves are near-identical. The integer is the symptom, not the cause. A script that quietly renamed them would be hiding the finding. See § 8.

Source data (`.json`, `.csv`, `.md`) was repaired too, so a future re-seed does not reintroduce what was just fixed.

---

## 4. A finding this change surfaced and did not act on

The founding import's output **did not stay in the system library.**

`server/lib/meal-service.ts` copies starter meals into each household's own cookbook at onboarding (`mealSourceType: "starter"`, `isSystemMeal: false`). **43 template-generated recipes are therefore sitting in households' own cookbooks**, where `shelfForMeal` correctly shelves them as `household` — the shelf labelled *"Your recipes"*.

So the machine output is not only in THA's library. It is on the shelf a family reads as *theirs*.

Their names were repaired along with everything else. **Re-shelving them was not done**, because it is an ownership question and the household owns those rows. It is § 8's second decision.

---

## 5. Definition of Done — measured, not asserted

`scripts/capture-cookbook1-family-cookbook.ts` (new) captures the room at 1440, 1920 and 390, and probes it. The before column was captured by reverting the two client files to `d03e77ff` and re-running the same probe against the same database.

| Measure | Before | After |
|---|---|---|
| Shelf headers | `Wholefood Suggestions· 500` | `From the THA kitchen` \| `Drinks` |
| Inventory counts above shelves | 1 | **0** |
| Controls inside recipe cards (48 cards) | **528** (11.0 per card) | **96** (2.0 per card) |
| Load-more label | `Show more (501 remaining)` | `More recipes` |
| Door to the wider library | *(none)* | `Open the wider library` |
| Magic-wand glyphs in the room | **49** | **1** |
| Names rendered per card | 2 *(duplicated — a defect this work introduced and fixed)* | 1 |

An 82% reduction in card controls. EXPREVIEW1 counted *"seventy-two unlabelled controls"* across twelve cards; the same twelve cards now carry 24, and none of the removed ones lost a capability.

| Gate | Result |
|---|---|
| `npm run typecheck:ci` | **No new regressions.** The gate already failed at `d03e77ff` with 16 pre-existing errors in planner/pantry/cookbook *test* files; the set after this change is byte-identical. Recorded rather than absorbed. |
| `npx vite build` | Passes |
| `test:cbk1-cookbook-seed` | 37 / 37 |
| `test:surf1c1-starter-cookbook-diet-classification` | 81 / 81 |
| `test:planner-compliance` | 25 / 25 |
| `test:rm4-planner-ready-meal-library` | 21 / 21 |
| `test:intelligence-platform` | 33 / 33 |
| `test:intelligence-meals-binding` | 72 / 72 |
| Name repair idempotence | Re-run reports 0 remaining capitalisation defects |

**Evidence:** `docs/ui-audit/cookbook1-family-cookbook/{before,after}-{1440,1920,mobile}-{fold,full}.png`

### 5.1 A probe that lied, and was fixed

The `wands` counter first returned **0 in both columns**, which read as a pass and was nothing of the sort — the selector pinned an exact lucide class name that no longer matches the rendered glyph. Corrected to a class-substring match and re-run against both columns, it gives the real figure: **49 → 1**.

Forty-eight of those forty-nine were placeholder wands, one per card, standing where a photograph of dinner should be. The single survivor is the *labelled* "Build" action in the workspace panel, which is a control a household chose to look at rather than an AI glyph standing in for food.

The first number is recorded here because a silent zero that looks like a pass is the more dangerous of the two results, and the instrument produced one.

---

## 6. The claim this change does **not** make

**There is still no photograph of food in this room.**

The brief asked for beautiful food imagery, and EXPREVIEW1 named it the single most important thing: *"You cannot pick up a card that has no face."* This change made the card able to hold a photograph well — 4:3, nothing printed across it, name beneath in real type — and removed the AI glyph that stood where one should be. **It did not put food in it, because it cannot.** The founding cookbook has zero images; the 500 rows contain no image field at all.

The room is therefore better composed, honestly quiet, and still without its subject. Ten empty plates with good names is a real improvement over five hundred with bad ones, and it is not the finished room. § 8, decision 3.

A second, related defect was found and not fixed: `POST /api/meals/:id/generate-image` stores the **raw OpenAI URL** (`server/routes.ts:1281`), and those expire in about an hour. Every illustration generated through that path rots. It is out of this workstream's scope but it is on the same subject, and it means the one imagery route that does exist does not durably work.

---

## 7. Files changed

| File | Change |
|---|---|
| `shared/cookbook/curation.ts` | **New.** The single owner of shelving. |
| `client/src/pages/meals-page.tsx` | Reads the owner; retires four private predecessors; card, shelves, copy, library door. |
| `client/src/components/MealImageWidget.tsx` | Magic-wand placeholder retired; `showNameInPlaceholder` prop; honest imagery copy. |
| `scripts/repair-cookbook-recipe-names.ts` | **New.** Reports both defects, repairs the safe one. |
| `scripts/capture-cookbook1-family-cookbook.ts` | **New.** Before/after evidence and probe. |
| `data/cookbook/tha_original_founding_cookbook_500/*.{json,csv,md}` | Capitalisation repaired at source. |

No schema change. No migration. No route added or altered. No server logic changed.

---

## 8. Remaining owner decisions

These are the owner's, and this change deliberately did not take them.

**1. The 490 generated recipes — demote, or delete?**
This change demoted them. EXPREVIEW1 § 8 recommends deletion: *"Replace five hundred combinatorial titles with a small, real, photographed collection — twenty recipes a person actually chose."* Deletion is irreversible and removes rows the planner may already reference, so it was not done on implementation authority. If the answer is delete, the `library` shelf and `isGeneratedLibraryName` should be retired in the same change.

**2. The 43 generated recipes sitting in households' own cookbooks (§ 4).**
They are shelved as *"Your recipes"* because the household owns those rows. If a starter meal a family never chose should not be presented as theirs, `shelfForMeal` needs a rule for it — and that rule is a statement about ownership, not presentation.

**3. Photography (§ 6).** The largest remaining gap, and the one the brief cared most about. Requires commissioned or licensed images; no code change reaches it. Related: the expiring-URL defect in the generate-image route.

**4. The provenance is wrong, and should be corrected at source.**
All 500 rows assert `acquisition_type: "authored"`. Correcting the 490 to a generated/derived lane — and persisting the classification as a column on `meals` — would let `shared/cookbook/curation.ts` read a fact instead of matching a name shape, and `isGeneratedLibraryName` could then be retired. This needs a reviewed migration in `server/migrations/runner.ts` (the only sanctioned schema route, per `TRUST1-O8`), so it was out of scope here.

**5. Production data repair.** The name repair ran against the **dev** database only (`helium`, classified disposable). `npx tsx scripts/repair-cookbook-recipe-names.ts --apply` must be run against production to land the 506 capitalisation fixes there. It is idempotent and reports before it writes.

**6. Adoption Register.** `docs/implementation/ux/ADOPTION_REGISTER.md` should record `shared/cookbook/curation.ts` as the successor and the four retired predecessors, per `THA_UI_ARCHITECTURE.md` § 17.

---

*The Cookbook is no longer a catalogue. It is a short shelf of recipes with names a person wrote, in a room that has stopped counting them out loud. It is still a shelf without photographs, and that is the next thing.*
