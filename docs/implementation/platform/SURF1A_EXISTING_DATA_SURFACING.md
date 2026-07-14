# SURF1A — Surface Existing Published Data

**Status:** Implementation — complete.
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1A-existing-data-surfacing-20260714` → `f9c23c97`
**Source investigation:** [`DCA1_USER_VISIBLE_DATA_COVERAGE_AUDIT.md`](../../investigations/platform/DCA1_USER_VISIBLE_DATA_COVERAGE_AUDIT.md) (gaps 4 and 8; workstream `SURF1` W1)
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (Rules KC4, KC6) → `THA_EXPERIENCE_ARCHITECTURE.md` → `THA_UI_ARCHITECTURE.md` (§17) → WS5A.

> **Filed here, not at `docs/implementation/`.** The brief named
> `docs/implementation/SURF1A_EXISTING_DATA_SURFACING.md`. `REPOSITORY_CONVENTIONS.md`
> §3 forbids *"loose files at its root"* and §4 mirrors the investigation's workstream
> folder — DCA1 is in `docs/investigations/platform/`. `repo-structure-verify.sh`
> enforces both mechanically. Path corrected; content unchanged.

---

## HEADLINE

**Nothing was published, computed, or learned by this workstream. Every fact it put
in front of a household was already true, already owned, and already on the wire.**

DCA1's finding was that THA's constraint had moved from *publication* to *surfacing*:
a 20-point gap between what the platform knows (~75%) and what a household can see
(~55%). SURF1A closes the part of that gap that needed no new knowledge — the fields
that were being **dropped in transit**, after publication and before a person.

The illustration DCA1 chose is now false, which was the point:

> *"Preparation knowledge is 100% published, correctly owned, correctly served over
> the wire — and rendered by exactly zero React components."*

It is rendered by two surfaces. **214 foods** carry published preparations, and all
214 now reach a household.

---

## THE DEFECT CLASS

The two chains failed in **two different places**, which is why one fix would not
have done:

| | Chain A — Pantry → Explore | Chain B — `/foods/:slug` |
|---|---|---|
| API | `GET /api/knowledge/foods/:slug` | `GET /api/foods/:slug/intelligence` |
| Owner → wire | ✅ complete — `preparations`, `storageGuidance`, `aliases` all served | ❌ **the assembler never read them** |
| Wire → type | ❌ `FoodDetail` **omitted `preparations`** — react-query parsed it away | — (nothing to parse) |
| Type → UI | ❌ `storageGuidance` / `aliases` in the type, **referenced by no JSX** | ❌ nothing to render |

**Chain A was a client defect. Chain B was a server defect.** The failure that made
both invisible is the same one: *a field nothing consumes looks exactly like a field
that does not exist* — and no gate in the platform failed while it was happening.
CPV1 passed throughout, correctly: the facts **were** published. They just never
reached a person.

That is the gap this workstream's verification is aimed at, not the three fields.

---

## FIELDS SURFACED

All read from their existing canonical owner. **No seed, migration, or database row
was written.**

| Field | Owner | Published | Was | Now |
|---|---|---|---:|---|
| `preparations` | `knowledge_preparations` / `knowledge_food_preparations` (WS5A) | 39 methods · 420 links · **214 foods** | rendered by **0** components | both food surfaces |
| `storageGuidance` | `knowledge_foods` (WS0) | 264 foods (43%) | served, never rendered | both food surfaces |
| `aliases` | `knowledge_foods` (WS0) | 801 aliases | served, never rendered | both food surfaces |
| `commonForms` | `knowledge_foods` (WS0) | 610 foods (100%) | Chain A only | both food surfaces |

Worked example — `potato`, through both APIs, live:

```
Also known as : potatoes, spud, spuds
Storing it    : Store in a cool, dark, well-ventilated place — not the fridge.
Prepared      : Mashed [unreviewed] · Roasted [unreviewed] · Boiled [unreviewed] · Baked [unreviewed]
Varieties     : whole, mashed, roasted, boiled, baked
sources       : canonical_food, nutrients, meals, discovery, nutrition_enhancement,
                knowledge_foods, knowledge_preparations
```

---

## THE PART THAT WAS NOT DISPLAY WORK

Preparation knowledge could not simply be printed. WS5A §4.3 names the domain's
central trust risk, and it is a *rendering* risk:

> A household must be able to tell **"we know it doesn't matter"** (an evidenced
> `no-change` finding — reassuring) from **"nobody knows yet"** (`unreviewed` — an
> absence). These are different facts, and collapsing them into one vague line is
> the failure.

`knowledge_preparation_effects` holds **0 rows**. So today **every one of the 420
links is `unreviewed`** — and the honest consequence is that the section must be
*complete while saying nothing about nutrition at all*. A surface that filled that
silence with a hedge to look finished would have been worse than the invisibility it
replaced.

So the contract is held by one component, not by discipline:

- **`FoodPreparationList` is the only client component permitted to print
  `approvedWording`** — verbatim, with the citations that earned it, or not at all.
  It authors no wording of its own.
- An `unreviewed` preparation renders **no claim row**. Silence is the design.
- `no-change` renders **visually distinct** from `unreviewed` — it is a positive
  finding, and it may only ever be produced by a row that cleared the same Layer-2
  evidence gate as a benefit chip.
- Existence is unconditional (Rule KC6): a preparation with no reviewed effect is
  still shown. An effect never gates a preparation's visibility.

Both surfaces render through that one owner. A second surface composing its own
sentence about a preparation would give the domain two mouths — and the test suite
fails if one appears.

---

## CHANGES MADE

**Client**

| File | Change |
|---|---|
| `client/src/components/intelligence/FoodPreparationList.tsx` | **New.** The one client owner of preparation presentation and of the three-state contract. |
| `client/src/components/intelligence/intelligence-tokens.ts` | New `preparation` chip kind — deliberately the calmest tint in the palette: how a food is prepared is a practical fact, not a health claim, and must not borrow the visual authority of a benefit chip. |
| `client/src/components/intelligence/index.ts` | Export the new owner. |
| `client/src/components/PantryKnowledgeHub.tsx` | `FoodDetail` type now declares `preparations` (**the line whose absence was the bug**). Renders *Also known as*, *How it's prepared*, *Storing it*. |
| `client/src/pages/food-detail-page.tsx` | Mirrors the widened wire type; renders *Also known as*, *Varieties*, *How it's prepared*, *Storing it*. |

**Server**

| File | Change |
|---|---|
| `server/lib/food-intelligence-assembler.ts` | Composes `preparations`, `storageGuidance`, `aliases`, `commonForms` onto `FoodIntelligence` — read from the knowledge domain's **one mouth** (`getPreparationsForFood`, `getFoodBySlug`) over the **WS2A identity bridge** (`knowledgeFoodSlug`), the only permitted seam. The assembler re-derives nothing and owns nothing. |

**Tests**

| File | Change |
|---|---|
| `server/tests/test-surf1a-existing-data-surfacing.ts` | **New** — 31 assertions. Registered as `npm run test:surf1a-existing-data-surfacing` and wired into `npm test`. |

**Register**

| File | Change |
|---|---|
| `docs/implementation/ux/adoption-register.json` + `.md` | Re-dated the one fact this change moved: `dark:` utilities 842 → 848. No ceiling raised, no orphan absorbed. |

**No** seed, migration, or row was written. **No** raw `<button>` was added (the
`button-primitive` ratchet is unchanged at 539).

---

## VERIFICATION

### The check THA already had, which this workstream flipped

CPV1's `pr-unrendered` check exists precisely to detect published-but-unrendered
knowledge. **It is an instrument SURF1A did not write, and did not modify:**

```
BEFORE  🟡 Nutrition — Preparation
        ⚠ [WARN] Published preparation knowledge reaches at least one surface
            0 client surfaces consume preparation knowledge —
            architecturally exemplary and rendered nowhere.

AFTER   🟢 Nutrition — Preparation
```

Suite-wide: **22 → 23 passed, 24 → 23 warned.** One domain moved from *needs
attention* to *healthy*. No check was added, weakened, or reworded to achieve it.

### The new suite — `npm run test:surf1a-existing-data-surfacing` · **31 passed, 0 failed**

Three layers, because the bug lived in all three:

1. **SURFACE** — every field is pinned to a **render marker** (a `data-testid`, or the
   one component permitted to draw it), never to the mere presence of its name.
   *This distinction is load-bearing.* `storageGuidance` and `aliases` were **already
   in the client's type** before SURF1A — a test asserting `source.includes("storageGuidance")`
   would have passed happily for the entire period they were invisible, certifying the
   exact gap DCA1 had to be written to find. **Presence in a type is not visibility.**
2. **TRUST** — the three-state contract survives surfacing: exactly one component
   renders approved wording; `unreviewed` renders no claim; `no-change` does not look
   like silence; the server's Layer-2 evidence gate is untouched.
3. **LIVE** (DB-backed) — both APIs really serve the fields for real foods:
   *214 foods with published preparations · 15/15 sampled canonical foods now
   surfacing them*, and an unbound canonical food surfaces **empty** knowledge rather
   than fabricated knowledge.

**Negative control.** The SURFACE assertions were run against the code as it was at
`f9c23c97`, and they fail there — the suite detects the original defect rather than
merely describing the fix.

### Regression

| Gate | Result |
|---|---|
| `test:preparation-knowledge` | 30 passed, 0 failed |
| `test:knowledge-evidence-gate` | 116 passed, 0 failed |
| `test:know4-graduated-food-reports` | 102 passed, 0 failed |
| `test:canonical-knowledge-binding` | 67 passed, 0 failed |
| `test:intelligence-food-intelligence-binding` | 36 passed, 0 failed |
| `test:int50-food-intelligence-composition` | 21 passed, 0 failed |
| `npm run typecheck:ci` | **0 new errors in any file SURF1A touched** |
| `npm run adoption:check` | 64 passed · 0 notices · 2 failed — **both pre-existing** |

> **The two adoption failures are not SURF1A's.** `HouseholdNutritionPanel.tsx` is an
> untracked file from another session (orphan, 0 importers), and the `button-primitive`
> ceiling had already risen to 539 before this work began. SURF1A added no raw
> `<button>` and left both counts exactly where it found them. They are reported, not
> absorbed — raising a ceiling to make a gate pass is the failure the ratchet exists
> to prevent.

---

## AFFECTED SCREENS

| Screen | Route | Nav-reachable | Change |
|---|---|---|---|
| Pantry → Explore → food detail | `/pantry?mode=explore` | ✅ via Pantry | *Also known as*, *How it's prepared*, *Storing it* |
| Food Intelligence page | `/foods/:slug` | ❌ (URL + in-app links only — DCA1 §1) | *Also known as*, *Varieties*, *How it's prepared*, *Storing it* |

No page was redesigned, no navigation changed, and no new destination was created.
Every section is independently optional and silent when empty (Experience Principle 3).

---

## REMAINING DCA1 GAPS

**Untouched, and deliberately so.** SURF1A took only the fields that needed no new
knowledge and no new surface.

| # | Gap | Why not here |
|---|---|---|
| **1** | **Allergens/restrictions never reach the AI** (`storage.ts:2751`, 21 users) | **The most serious finding in DCA1, and out of scope by explicit instruction.** A safety defect with a different risk profile; DCA1 W0 says it must not be bundled with surfacing work. **It remains open, and it is the thing to do next.** |
| 2 | Pantry knowledge 13% (32 of 247 keys) | Needs *new knowledge*. The UI is built and starved. |
| 3 | Cookbook: 0/500 images, 73/500 nutrition, 0 provenance | Needs new content + a seed fix (`seed-ready-meals.ts:29` re-nulls images at boot). |
| 4a | **Preparation *effects*: 0 rows** | The taxonomy is now surfaced; the *nutritional consequence* was never authored. Every one of the 420 links reads `unreviewed` — correctly. Populating it is knowledge creation, and each row must clear the Layer-2 evidence gate. **The surface is now waiting for it.** |
| 5 | Shopping intelligence stranded off-nav (`/basket`) | Navigation change, not a dropped field. |
| 6 | Plant-diversity ring over-counts (`PlantDiversityReport.tsx:256`) | Convergence work — DCA1 W2. |
| 7 | Meal templates 96% hollow | Data gap. |
| 9 | Product Knowledge: 154 entries, 0 components | Needs a *designed surface*, not a dropped-field fix. |
| 10 | Platform learns nothing (4 signals, 0 confirmed) | Decision Engine reads an empty set. |
| **11** | **"Benefits" / "Suggestions" tabs are "Coming soon"** | **Considered and deliberately declined.** `BenefitExplorer` is a *private function inside* `HouseholdNutritionCentre.tsx`, not an independently mountable component — surfacing it means extracting a component and designing a browse experience. That is a UI change, and the brief forbids redesigning the wider UI. **Recommended as the first item of `SURF1B`**, where it can be designed rather than smuggled in. |
| 12 | 163 meals under unlicensed source keys | Licensing, unrelated. |

### What moved

| Domain | DCA1 (data / visible) | Now |
|---|---|---|
| Preparation | 50% / **10%** | 50% / **~65%** — fully rendered on both food surfaces; effects still 0 rows |
| Knowledge (narrative) | 46% / 45% | 46% / **~60%** — `storageGuidance` + `aliases` now reach users |

The **data** column is unchanged by design. SURF1A created no knowledge.

---

## GOVERNANCE

- **Architecture Bootstrap** — read before implementation: `docs/architecture/README.md`
  and the documents above.
- **Rule KC4 (one mouth)** — preparation knowledge is read from
  `getPreparationsForFood` by both chains. The assembler queries no preparation table
  directly, and the client composes no preparation sentence. Enforced by test.
- **Rule KC6 (enrichment never gates what is visible)** — a preparation with no
  reviewed effect is still shown.
- **Principle 2 (one owner per fact)** — no fact was copied, cached, or re-derived;
  the WS2A `knowledgeFoodSlug` bridge is the only seam used.
- **Progressive enrichment** — every new section is independently optional and absent
  when the owner records nothing. An unbound food surfaces empty knowledge, never
  fabricated knowledge (asserted live).
- **UIA §17 (Adoption Register)** — one owner created (`FoodPreparationList`), adopted
  by both food surfaces through the `@/components/intelligence` barrel, exactly as its
  siblings (`SeasonalCard`, `ConnectedFoodPanel`) are. The one recorded fact this
  change moved (`dark:` utilities) was re-dated in the same change.

**The working tree was already dirty on arrival** (uncommitted work by other sessions:
`HouseholdNutritionPanel.tsx`, `household-nutrition-assembler.ts`, `notice-gateway.ts`,
and others). SURF1A **did not touch, commit, or revert any of it**, and the milestone
commit contains only the files listed under *Changes Made*.

---

*Implementation. 2026-07-14. Surfaces existing published data; creates none.*
